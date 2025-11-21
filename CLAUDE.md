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
- `applyBank()` - Handle player banking (only advances turn if banker was current roller)
- `advanceTurn()` / `advanceTurnFrom()` - Move to next active player
- `checkBustTransition()` - Auto-advance from bust phase after 10-second delay
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

**API Routes** (`app/api/rooms/`):
- `POST /api/rooms` - Create room
- `POST /api/rooms/[roomId]/join` - Join room
- `GET /api/rooms/[roomId]` - Get state (auto-transitions from bust after 5s)
- `POST /api/rooms/[roomId]/start` - Start game (host only, min 2 players)
- `POST /api/rooms/[roomId]/roll` - Roll dice
- `POST /api/rooms/[roomId]/bank` - Bank points

**Client Synchronization** (`app/room/[roomId]/page.tsx`):
- Polls every 2 seconds
- Player identity in localStorage (`playerId`, `nickname`)
- **Important:** Always read fresh `playerId` from localStorage for API calls (state can be stale)
- Uses `pendingGameState` pattern to delay UI updates until dice animation completes

### Game Phases

`GamePhase = 'lobby' | 'inRound' | 'betweenRounds' | 'bust' | 'finished'`

- **bust**: Shows BUST! overlay for 10 seconds (`bustAt` timestamp), then auto-advances on next poll

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

### Type System (`lib/types.ts`)

- `GameState` - Complete game state including `bustAt` timestamp and `lastRollerIndex` for turn tracking
- `Player` - Score, banking state, `pointsEarnedThisRound`
- `RollEffect` - effectType: 'add' | 'add70' | 'doubleBank' | 'bust' | 'none'
- `RollHistoryEntry`, `RoundHistoryEntry` - History tracking

### Styling

**Custom Colors** (`tailwind.config.js`):
- `brand-purple`, `brand-teal`, `brand-lime` - Brand colors
- `bank-green`, `bank-dark` - Bank display
- `bust-red` - Bust/error states
- `background-dark` - Main background (#0a0a0a)

**Risk Indicators:** When `rollCountThisRound >= 3`, background transitions to red gradient

## Environment Setup

Requires `.env.local` with Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Database schema in `supabase/schema.sql`.

## Key Implementation Details

**Banking Turn Logic:** `applyBank()` only calls `advanceTurn()` if the banking player was the current roller. This prevents skipping the current roller's turn when another player banks.

**Player Order Consistency:** In `gameStore.joinRoom()`, players are sorted by playerId before initializing game to handle JSON serialization not preserving insertion order.

**Animation Timing:** Dice animation is 2.5 seconds (`ROLL_DURATION` in ActionPanel). After 3-second timeout, `setGameState(data.gameState)` updates the full UI.

**Bust Phase:** When bust occurs, game enters 'bust' phase for 10 seconds. `checkBustTransition()` in the GET endpoint auto-advances to new round after delay.

**Turn Order on New Round:** `lastRollerIndex` is saved before clearing `isCurrentRoller` (in `endRoundBust` and `applyBank`). `startNewRound()` uses this to correctly advance to the next player.

### Sound Effects

`lib/sounds.ts` manages audio playback with `soundManager` singleton:
- **roll** - Dice shaking sound
- **bank** - Cash register cha-ching
- **bust** - Negative fail sound
- **doubles** - Bonus win sound
- **lucky7** - Jackpot sound for 7 in first 3 rolls
- **danger** - Warning alert when entering roll #4 (risky phase)

`hooks/useSounds.ts` provides React hook. Sounds are played in page.tsx handlers and also triggered for other players' rolls via polling.

### Floating Effect Messages

`BankPanel` displays roll effects ("+8 to bank", "BUST!", etc.) as floating text using CSS animation. Uses React `key` prop with unique `rollKey` to force remount and restart animation on each new roll.
