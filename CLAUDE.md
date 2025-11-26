# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bank It is an online multiplayer dice game built with Next.js 16, TypeScript, Tailwind CSS, and Supabase. Players roll two dice each turn, accumulating points in a shared "bank" that they can cash in before someone rolls a 7 and busts.

**Tech Stack:**
- Next.js 16.0.3 (App Router with Turbopack)
- React 19.2.0
- TypeScript 5.9.3
- Tailwind CSS 3.4.18
- Supabase (PostgreSQL for persistence)
- Vercel (deployment)

## Development Commands

```bash
npm run dev      # Start development server (Turbopack, port 3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run linting
```

**Clearing Turbopack Cache:** `rm -rf .next && npm run dev`

## Architecture

### Game State Management

Pure functional state management with immutable updates. All game logic in `lib/gameLogic.ts` operates on a single `GameState` object.

```
User Action → API Route → Pure Game Logic → New State → Supabase → Poll → React Re-render
```

**Core Functions** (`lib/gameLogic.ts`):
- `initGame()` - Initialize new game with players
- `applyRoll()` - Process dice roll, apply rules based on roll count
- `applyBank()` - Handle player banking (tracks `lastBankedPlayer` for overlay, triggers `roundWinner` phase when all bank)
- `advanceTurn()` / `advanceTurnFrom()` - Move to next active player
- `checkBustTransition()` - Auto-advance from bust phase after 10-second delay to round winner
- `checkRoundWinnerTransition()` - Auto-advance from round winner phase after 5-second delay
- `startNewRound()` - Uses `lastRollerIndex` to properly advance starting player

### Game Rules

**First 3 Rolls** (`applySpecialRules()`):
- All rolls add face value
- Rolling 7 adds **70 points** (bonus)

**Roll 4+** (`applyNormalRules()`):
- Rolling 7 = **BUST** (bank empties, enters 'bust' phase for 10 seconds)
- Rolling doubles = **DOUBLES** entire bank
- Other rolls add face value

### Multiplayer Architecture

**Database** (`lib/supabase.ts`, `lib/gameStore.ts`):
- Supabase PostgreSQL stores all room state
- `gameStore` singleton handles all database operations
- Player-to-gameId mapping stored in `game_state._players` JSON field
- Players sorted by playerId on game init to ensure consistent order (JSON doesn't preserve Map order)
- **Duplicate name prevention:** `joinRoom()` checks for case-insensitive name duplicates

**API Routes** (`app/api/rooms/`):
- `POST /api/rooms` - Create room
- `POST /api/rooms/[roomId]/join` - Join room (returns error message for duplicate names)
- `GET /api/rooms/[roomId]` - Get state (auto-transitions from bust and roundWinner phases)
- `POST /api/rooms/[roomId]/start` - Start game (host only, min 2 players)
- `POST /api/rooms/[roomId]/roll` - Roll dice
- `POST /api/rooms/[roomId]/bank` - Bank points

**Client Synchronization** (`app/room/[roomId]/page.tsx`):
- Polls every 2 seconds
- Player identity in localStorage (`playerId`, `nickname`)
- **Important:** Always read fresh `playerId` from localStorage for API calls (state can be stale)
- Uses `pendingGameState` pattern to delay UI updates until dice animation completes
- Tracks `lastBankedAt` to show banking overlay for other players
- **Separate error states:** `error` (cleared by polling) vs `joinError` (persists until cleared by user action) - prevents join errors from disappearing

### Game Phases

`GamePhase = 'lobby' | 'inRound' | 'betweenRounds' | 'bust' | 'roundWinner' | 'finished'`

- **bust**: Shows BUST! overlay for 10 seconds (`bustAt` timestamp), then transitions to roundWinner
- **roundWinner**: Shows round winner card for 5 seconds (`roundWinnerAt` timestamp), then starts new round

### 3D Dice Animation

`ThreeDDice` component uses Web Animations API:
- CSS 3D transforms with `perspective`, `transform-style: preserve-3d`
- Animation duration: 2.5 seconds
- `isRolling` state triggers animation; dice values from `pendingGameState.lastRoll`
- For non-rolling players, new rolls detected via polling trigger same animation

### Next.js 16 Patterns

**Async Params:** Route params are Promises:
```typescript
export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
}
```

**Suspense for useSearchParams:** Home page wraps `useSearchParams()` in Suspense boundary for URL code param handling.

### Type System (`lib/types.ts`)

- `GameState` - Complete game state including timestamps (`bustAt`, `roundWinnerAt`), `lastRollerIndex`, `lastBankedPlayer`, `lastBankedAt`
- `Player` - Score, banking state, `pointsEarnedThisRound`
- `RollEffect` - effectType: 'add' | 'add70' | 'doubleBank' | 'bust' | 'none'
- `RollHistoryEntry`, `RoundHistoryEntry` - History tracking

### Styling

**Custom Colors** (`tailwind.config.js`):
- `brand-purple`, `brand-teal`, `brand-lime` - Brand colors
- `bank-green`, `bank-dark` - Bank display
- `bust-red` - Bust/error states
- `background-dark` - Main background (#0a0a0a)

**Custom Animations** (`tailwind.config.js`):
- `fade-in-up` - Floating effect text
- `pulse-danger` - Pulsing red glow for risky phase
- `slide-in` / `slide-out` - Round winner card transitions
- `bank-flash` - Banking overlay animation
- `shake` - Shake animation for alerts

**Risk Indicators:** When `rollCountThisRound >= 3`, background transitions to red gradient, status bar shows "Hazard" with pulsing animation

## Environment Setup

Requires `.env.local` with Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Database schema in `supabase/schema.sql`.

## Key Implementation Details

**Banking Turn Logic:** `applyBank()` only calls `advanceTurn()` if the banking player was the current roller. This prevents skipping the current roller's turn when another player banks. Now also tracks `lastBankedPlayer` and `lastBankedAt` for overlay display.

**Player Order Consistency:** In `gameStore.joinRoom()`, players are sorted by playerId before initializing game to handle JSON serialization not preserving insertion order.

**Animation Timing:** Dice animation is 2.5 seconds (`ROLL_DURATION` in ActionPanel). After 3-second timeout, `setGameState(data.gameState)` updates the full UI.

**Round End Sequence:**
1. Bust: Shows BUST card for 10 seconds
2. Round Winner: Shows round winner card for 5 seconds (appears after bust card, or alone if all players bank)
3. New Round: Starts automatically after delays

**Turn Order on New Round:** `lastRollerIndex` is saved before clearing `isCurrentRoller` (in `endRoundBust` and `applyBank`). `startNewRound()` uses this to correctly advance to the next player.

### Sound Effects

`lib/sounds.ts` manages audio playback with `soundManager` singleton:

**Sound Themes:** Four selectable themes (classic, arcade, casino, silly) with different sound sets for each effect. Theme selection in lobby.

**Lobby Music:** Requires user click on "Play Lobby Music" button due to browser autoplay policies. Toggle button shows current state.

**Sound Effects:**
- **roll** - Dice shaking sound
- **bank** - Cash register cha-ching
- **bust** - Random selection from array of bust sounds (sad trombone, fail, etc.)
- **doubles** - Bonus win sound
- **lucky7** - Jackpot sound for 7 in first 3 rolls
- **danger** - Warning alert when entering roll #4 (risky phase)
- **lobbyMusic** - Background music in waiting room (loops, quieter volume)

`hooks/useSounds.ts` provides React hook. Sounds are played in page.tsx handlers and also triggered for other players' rolls via polling.

### UI Components

**Status Bar:** Shows round number, roll number, banked count, and Safe/Hazard indicator with appropriate styling.

**Leaderboard:** `PlayersPanel` with `showLeaderboard={true}` displays players sorted by score with medal emojis (🥇🥈🥉) and "X behind" indicators.

**Up Next Bar:** Horizontal list showing turn order, with current roller highlighted.

**Bank Panel:** Displays bank value with Bank It button alongside. Button disabled when bank is zero or player has already banked.

**Banking Overlay:** Brief floating overlay when any player banks, showing their name.

**Round Winner Card:** Displays round winner with points earned, same styling as bust card.

**Share Functionality:** Share button uses Web Share API (or clipboard fallback) with URL `/?code=ROOMID` that auto-opens join modal.

### Game Setup

**Round Presets:** Create game modal offers Short (5), Medium (20), Long (40), or Custom rounds with slider (3-50).

**Replay:** "Play Again" button on game completion screen returns to home page.
