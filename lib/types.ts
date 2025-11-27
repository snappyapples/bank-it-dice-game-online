export type PlayerId = string

export type PlayerStatus = 'in' | 'banked' | 'out'

export interface Player {
  id: PlayerId
  nickname: string
  score: number
  hasBankedThisRound: boolean
  isCurrentRoller: boolean
  status: PlayerStatus
  pointsEarnedThisRound: number
}

export interface RollEffect {
  die1: number
  die2: number
  sum: number
  wasDouble: boolean
  effectType: 'add' | 'add70' | 'doubleBank' | 'bust' | 'none'
  effectText: string
}

export interface RollHistoryEntry {
  rollNumber: number
  playerNickname: string
  die1: number
  die2: number
  result: string
  effect: string
  bankAmount: number
}

export interface RoundHistoryEntry {
  roundNumber: number
  playerResults: {
    playerNickname: string
    pointsEarned: number
  }[]
  topPlayer: string
  topPoints: number
}

export type GamePhase = 'lobby' | 'inRound' | 'betweenRounds' | 'bust' | 'roundWinner' | 'finished'

export interface GameStats {
  doublesCount: Record<PlayerId, number>
  bustCount: Record<PlayerId, number>
  sevensInHazard: Record<PlayerId, number>
  biggestRound: { player: string; points: number; round: number } | null
  totalRolls: Record<PlayerId, number>
  comebackKing: { player: string; deficit: number } | null
}

export interface GameState {
  players: Player[]
  roundNumber: number
  totalRounds: number
  bankValue: number
  rollCountThisRound: number
  lastRoll?: RollEffect
  history: RollHistoryEntry[]
  roundHistory: RoundHistoryEntry[]
  phase?: GamePhase
  bustAt?: number // Timestamp when bust occurred (for delay before new round)
  roundWinnerAt?: number // Timestamp when round winner card shown (for delay before new round)
  lastRollerIndex?: number // Track who was rolling when round ended (for next round start)
  lastBankedPlayer?: string // Nickname of the last player who banked (for overlay display)
  lastBankedAt?: number // Timestamp when last player banked
  stats?: GameStats // Game statistics for end-game awards
}
