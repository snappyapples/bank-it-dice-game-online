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
- `POST /api/rooms/[roomId]/restart` - Restart game in same room (caller becomes new host)
- `POST /api/rooms/[roomId]/settings` - Update room settings (host only, lobby phase only)

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

### Banking Window

After each roll (except the first of each round), there's a 3-second banking window before the next player can roll:
- **Server-enforced:** `canRollNow()` in `lib/gameLogic.ts` checks `lastRollAt` timestamp
- **Roll API validation:** Returns 400 error if banking window still active
- **UI countdown:** ActionPanel shows "Wait Xs..." for current player, "Bank now! (Xs)" for others
- **Constant:** `BANKING_WINDOW_MS = 3000` in `lib/gameLogic.ts`
- First roll of each round has no delay (`lastRollAt` is cleared in `startNewRound()`)

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

- `GameState` - Complete game state including timestamps (`bustAt`, `roundWinnerAt`, `lastRollAt`), `lastRollerIndex`, `lastBankedPlayer`, `lastBankedAt`, `stats`
- `GameStats` - End-game statistics tracking: doublesCount, bustCount, hazardRolls, totalRollsAtBank, bankCount, biggestRound, totalRolls, comebackKing
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

**Audio Implementation:** Uses HTMLAudioElement with pooling (up to 5 elements per URL) for concurrent sound playback. Avoids Web Audio API due to CORS issues with external audio URLs.

**Simplified Sound System:** Single consolidated sound set (no theme selection). Bust sounds randomly selected from pool of 4 different sounds.

**Local Sound Files:** `public/sounds/` contains locally hosted audio files:
- `victory.mp3` - Awards ceremony winner music
- `lobby.mp3` - User-provided lobby music (download from Udio)

**Stop Method:** `soundManager.stop(effect)` stops all playing instances of a sound effect (used when restarting game to stop victory music).

**Sound Effects:**
- **roll** - Dice shaking sound (SoundBible)
- **bank** - Cash register cha-ching
- **bust** - Random selection from 4 bust sounds (sad trombone, fail, wrong, etc.)
- **doubles** - Bonus win sound
- **lucky7** - Jackpot sound for 7 in first 3 rolls
- **danger** - Warning alert when entering roll #4 (risky phase)
- **lobbyMusic** - Background music in waiting room (loops, quieter volume)
- **victory** - Epic celebration music when game ends

**Lobby Music:** Requires user click on "Music" toggle button due to browser autoplay policies.

**Test Page:** `/test-sounds` page for debugging all sound URLs. Shows status (idle/playing/success/error) for each sound.

`hooks/useSounds.ts` provides React hook. Sounds are played in page.tsx handlers and also triggered for other players' rolls via polling.

### UI Components

**Status Bar:** Shows round number, roll number, banked count, and Safe/Hazard indicator with appropriate styling.

**Leaderboard:** `PlayersPanel` with `showLeaderboard={true}` displays players sorted by score with "X behind" indicators. Current player shown with "👤 You" indicator.

**Up Next Bar:** Horizontal list showing turn order, with current roller highlighted.

**Bank Panel:** Displays bank value with Bank It button alongside. Button disabled when bank is zero or player has already banked.

**Banking Overlay:** Brief floating overlay when any player banks, showing their name.

**Round Winner Card:** Displays round winner with points earned, includes compact leaderboard below.

**Turn Notification:** "It's your turn!" popup appears when the current player changes to you (detected via polling).

**Auto-Scroll:** On mobile, auto-scrolls to bank panel at round start; auto-scrolls to stats after game ends.

**Share Functionality:** Share button uses Web Share API (or clipboard fallback) with URL `/?code=ROOMID` that auto-opens join modal.

**Victory Celebration:** When game ends, displays confetti animation (`Confetti` component) and plays victory music. Header "Bank It" logo links to home page.

**Game Stats/Awards:** `GameStats` component displays end-game awards:
- Lucky Doubles 🎰 - Most doubles in hazard mode
- Danger Zone 💀 - Most busts
- Risk Taker 🎯 - Most rolls in hazard mode (aggressive play)
- Safe Player 🛡️ - Lowest average roll count when banking (most conservative)
- Biggest Round 💎 - Highest single-round score
- Luckiest 🍀 - Highest points per roll ratio
- Comeback King 👑 - Largest deficit overcome to take lead

**Responsive Design:** Dice size adapts to screen width (70px under 500px, 100px on desktop). Status bar wraps on narrow screens. `useIsMobile` hook in ActionPanel detects screen width.

### Game Setup

**Round Presets:** Create game modal offers Short (5), Medium (15), Long (30), or Custom rounds with slider (3-50). Default is Medium (15).

**Host Settings:** In the waiting room lobby, the host can adjust the number of rounds using preset buttons (5/15/30) or a custom slider.

**Play Again Flow:** Two buttons on game completion:
- **Play Again** - Restarts game in same room with same code. First player to click becomes new host; other players see join form (nickname pre-filled from localStorage). Uses `gameStore.restartRoom()`.
- **New Room** - Returns to home page to create a fresh room.

### Assets

**Favicon:** `app/icon.svg` and `app/apple-icon.svg` - Lime green dice showing 5-face pattern, matches brand-lime color (#A3E635).
