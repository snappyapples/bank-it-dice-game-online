# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bank It is an online multiplayer dice game built with Next.js 16, TypeScript, and Tailwind CSS. Players roll two dice each turn, accumulating points in a shared "bank" that they can cash in before someone rolls a 7 and busts.

**Tech Stack:**
- Next.js 16.0.3 (App Router with Turbopack)
- React 19.2.0
- TypeScript 5.9.3
- Tailwind CSS 3.4.18

**Current Status:** Local multiplayer with in-memory game state and polling-based synchronization

## Development Commands

```bash
# Start development server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm lint
```

**Note:** Development server runs on port 3000 by default. If that port is in use, Next.js will automatically select the next available port.

## Architecture

### Game State Management

The game uses **pure functional state management** with immutable updates. All game logic is centralized in `lib/gameLogic.ts` and operates on a single `GameState` object.

**Key Principle:** Game state flows unidirectionally:
```
User Action → Handler Function → Pure Game Logic → New State → React Re-render
```

**Game Logic Functions** (`lib/gameLogic.ts`):
- `initGame()` - Initialize new game with players and rounds
- `applyRoll()` - Process dice roll and update bank value
- `applyBank()` - Handle player banking their points
- `advanceTurn()` - Move to next active player
- All functions are pure - they take state, return new state, never mutate

### Game Rules Implementation

The game has **two distinct rule sets** that switch based on roll count:

**First 3 Rolls** (`applySpecialRules()`):
- All dice rolls add their face value (including doubles)
- **Exception:** Rolling a 7 adds 70 to the bank (not just 7)

**After Roll 3** (`applyNormalRules()`):
- Rolling a 7 **empties the bank** (bust - all non-banked players get nothing)
- Rolling **doubles multiplies the entire bank by 2**
- All other rolls add their face value

The rule switching happens in `applyRoll()` based on `rollCountThisRound`:
```typescript
if (newRollCount <= 3) {
  const result = applySpecialRules(state, die1, die2)
} else {
  const result = applyNormalRules(state, die1, die2)
}
```

### Next.js 16 Patterns

This project uses **Next.js 16 App Router** conventions:

**Async Params:** Route params are Promises that must be unwrapped with `React.use()`:
```typescript
export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  // Now use roomId...
}
```

**Route Structure:**
- `app/page.tsx` - Home page with Create/Join game modals
- `app/room/[roomId]/page.tsx` - Game room (dynamic route)
- `app/layout.tsx` - Root layout with header and global styles

### Multiplayer Architecture

**Server-Side State Management** (`lib/gameStore.ts`):
- Singleton GameStore using `globalThis` for hot-reload persistence
- In-memory Map storing all active rooms
- Each room contains: `gameState`, `players`, `hostPlayerId`, `started` flag
- Room IDs are 6-character uppercase codes (e.g., "LZ11Z4")

**API Routes** (`app/api/rooms/`):
- `POST /api/rooms` - Create new room with host player
- `POST /api/rooms/[roomId]/join` - Join existing room
- `GET /api/rooms/[roomId]` - Get current room state
- `POST /api/rooms/[roomId]/start` - Start game (host only)
- `POST /api/rooms/[roomId]/roll` - Roll dice for current player
- `POST /api/rooms/[roomId]/bank` - Bank points for player

**Client-Side Synchronization:**
- Polling every 2 seconds via `GET /api/rooms/[roomId]`
- Player identity stored in localStorage (playerId + nickname)
- Optimistic UI updates for actions, server as single source of truth

**Room Lifecycle:**
1. Host creates room → receives roomId
2. Players join via roomId → added to room's player list
3. Host starts game → all players transition from lobby to game
4. Game progresses via roll/bank actions
5. Round history tracked across all rounds
6. Game ends when `phase === 'finished'`

### Component Organization

**Panel Components** - Display game information (read-only):
- `BankPanel` - Shows current bank value, round number, risk indicators
- `PlayersPanel` - Lists all players with scores and status badges
- `RollHistoryPanel` - Shows table of all rolls this round
- `RoundHistoryPanel` - Personalized view of player's performance per round

**Interactive Components** - Handle user actions:
- `ActionPanel` - Contains Roll and Bank buttons with game logic
- `RollingDice` - Displays dice with spinner overlay during 5-second roll animation
- `CreateGameModal` / `JoinGameModal` - Home page modals for room management
- `HowToPlayModal` - Game instructions modal
- `Header` - Navigation with "How to Play" link

**Component Props Pattern:** Components receive `gameState` or derived props, never modify state directly. All state changes flow through handler functions in the page component.

### Styling System

**Tailwind Custom Colors** (defined in `tailwind.config.js`):
- `brand-purple`, `brand-teal`, `brand-lime` - Main brand colors
- `bank-green`, `bank-dark` - Bank value display
- `bust-red` - Bust/error states
- `background-dark` - Main background (#0a0a0a)

**Global Styles** (`app/globals.css`):
- Poppins font family imported from Google Fonts
- CSS custom properties for theming
- Form input number styles (remove spinners)

**Design Tokens:**
- Dark theme with gradient backgrounds
- Rounded corners (1rem default, 1.5rem lg)
- Glass-morphism effects (backdrop-blur-sm, border-white/10)

### Type System

**Core Types** (`lib/types.ts`):
- `GameState` - Single source of truth for entire game
- `Player` - Individual player with score, status, banking state, points earned per round
- `RollEffect` - Describes what happened on a roll (bust, double bank, etc.)
- `RollHistoryEntry` - Record for roll-by-roll history with bank amounts
- `RoundHistoryEntry` - Round summary with player results and winners
- `GamePhase` - Lifecycle: 'lobby' | 'inRound' | 'betweenRounds' | 'finished'

**Type Safety:** All game logic functions are strictly typed. State transitions are type-checked at compile time.

## Common Patterns

### Clearing Turbopack Cache

When experiencing build issues or stale state:
```bash
rm -rf .next && npm run dev
```

### State Update Pattern

Always use functional setState when the new state depends on previous state:
```typescript
setGameState(prevState => applyRoll(prevState))
```

Never directly mutate state. Game logic functions create new objects.

### Animation Timing

Dice rolling uses a 5-second delay to match animation duration:
```typescript
setTimeout(() => {
  setGameState(prevState => applyRoll(prevState))
  setIsRolling(false)
}, 5000)
```

### Visual Risk Indicators

When `rollCountThisRound >= 3`, the UI signals increased risk:
- Background: Changes to red gradient (`bg-gradient-to-b from-red-950/30`)
- Bank panel border: Changes to red glow (`border-red-500/50`)
- Roll phase text: Changes to red with warning emoji
- All transitions use `duration-1000` for smooth effects

### Round Transition Bug Prevention

Reset `isRolling` state when round changes to prevent auto-rolling:
```typescript
useEffect(() => {
  if (gameState && gameState.roundNumber !== currentRound) {
    setIsRolling(false)
    setCurrentRound(gameState.roundNumber)
  }
}, [gameState, currentRound])
```
