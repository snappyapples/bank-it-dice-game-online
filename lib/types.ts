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

export type GamePhase = 'lobby' | 'inRound' | 'betweenRounds' | 'finished'

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
}
