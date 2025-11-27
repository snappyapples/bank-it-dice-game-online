import { GameState, GameStats, Player, RollEffect, RollHistoryEntry } from './types'

/**
 * Roll two dice and return the results
 */
export function rollDice(): { die1: number; die2: number } {
  return {
    die1: Math.floor(Math.random() * 6) + 1,
    die2: Math.floor(Math.random() * 6) + 1,
  }
}

/**
 * Initialize a new game
 */
export function initGame(playerNicknames: string[], totalRounds: number): GameState {
  // Randomly select starting player
  const randomStartIndex = Math.floor(Math.random() * playerNicknames.length)

  const players: Player[] = playerNicknames.map((nickname, index) => ({
    id: `player-${index}`,
    nickname,
    score: 0,
    hasBankedThisRound: false,
    isCurrentRoller: index === randomStartIndex,
    status: 'in',
    pointsEarnedThisRound: 0,
  }))

  // Initialize stats tracking
  const stats: GameStats = {
    doublesCount: Object.fromEntries(players.map(p => [p.id, 0])),
    bustCount: Object.fromEntries(players.map(p => [p.id, 0])),
    hazardRolls: Object.fromEntries(players.map(p => [p.id, 0])),
    earlyBanks: Object.fromEntries(players.map(p => [p.id, 0])),
    biggestRound: null,
    totalRolls: Object.fromEntries(players.map(p => [p.id, 0])),
    comebackKing: null,
  }

  return {
    players,
    roundNumber: 1,
    totalRounds,
    bankValue: 0,
    rollCountThisRound: 0,
    lastRoll: undefined,
    history: [],
    roundHistory: [],
    stats,
  }
}

/**
 * Apply special rules for the first 3 rolls of a round
 * - All rolls add their face value
 * - Rolling a 7 adds 70 (not just 7)
 */
function applySpecialRules(
  state: GameState,
  die1: number,
  die2: number
): { newBankValue: number; effect: RollEffect } {
  const sum = die1 + die2
  const wasDouble = die1 === die2
  let newBankValue = state.bankValue
  let effectType: RollEffect['effectType'] = 'none'
  let effectText = ''

  if (sum === 7) {
    // Rolling 7: Add 70 to bank (special rule for first 3 rolls)
    newBankValue += 70
    effectType = 'add70'
    effectText = 'Lucky 7! Bank +70'
  } else {
    // Any other roll (including doubles): Add face value to bank
    newBankValue += sum
    effectType = 'add'
    effectText = wasDouble ? `+${sum} to bank (doubles)` : `+${sum} to bank`
  }

  return {
    newBankValue,
    effect: {
      die1,
      die2,
      sum,
      wasDouble,
      effectType,
      effectText,
    },
  }
}

/**
 * Apply normal rules (after the first 3 rolls)
 * - Rolling a 7 empties the bank (bust)
 * - Rolling doubles DOUBLES the entire bank value
 * - Other rolls add their face value
 */
function applyNormalRules(
  state: GameState,
  die1: number,
  die2: number
): { newBankValue: number; effect: RollEffect; busted: boolean } {
  const sum = die1 + die2
  const wasDouble = die1 === die2
  let newBankValue = state.bankValue
  let effectType: RollEffect['effectType'] = 'none'
  let effectText = ''
  let busted = false

  if (sum === 7) {
    // Rolling 7: BUST! Bank empties
    newBankValue = 0
    effectType = 'bust'
    effectText = '💥 BUST! Bank emptied'
    busted = true
  } else if (wasDouble) {
    // Doubles: DOUBLE the entire bank value
    newBankValue = state.bankValue * 2
    effectType = 'doubleBank'
    effectText = `Doubles! Bank doubled to ${newBankValue}`
  } else {
    // Any other roll: Add face value to bank
    newBankValue += sum
    effectType = 'add'
    effectText = `+${sum} to bank`
  }

  return {
    newBankValue,
    busted,
    effect: {
      die1,
      die2,
      sum,
      wasDouble,
      effectType,
      effectText,
    },
  }
}

/**
 * Process a dice roll and update game state
 */
export function applyRoll(state: GameState): GameState {
  const currentPlayer = state.players.find((p) => p.isCurrentRoller)
  if (!currentPlayer || currentPlayer.hasBankedThisRound) {
    return state
  }

  const { die1, die2 } = rollDice()
  const newRollCount = state.rollCountThisRound + 1

  let newBankValue: number
  let effect: RollEffect
  let busted = false

  // Apply rules based on roll count
  if (newRollCount <= 3) {
    const result = applySpecialRules(state, die1, die2)
    newBankValue = result.newBankValue
    effect = result.effect
  } else {
    const result = applyNormalRules(state, die1, die2)
    newBankValue = result.newBankValue
    effect = result.effect
    busted = result.busted
  }

  // Add to history
  const historyEntry: RollHistoryEntry = {
    rollNumber: newRollCount,
    playerNickname: currentPlayer.nickname,
    die1,
    die2,
    result: `${die1 + die2}`,
    effect: effect.effectText,
    bankAmount: newBankValue,
  }

  // Update stats
  const updatedStats: GameStats = state.stats ? { ...state.stats } : {
    doublesCount: {},
    bustCount: {},
    hazardRolls: {},
    earlyBanks: {},
    biggestRound: null,
    totalRolls: {},
    comebackKing: null,
  }

  // Track total rolls for this player
  updatedStats.totalRolls = {
    ...updatedStats.totalRolls,
    [currentPlayer.id]: (updatedStats.totalRolls[currentPlayer.id] || 0) + 1,
  }

  // Track doubles (in hazard mode - roll 4+)
  if (effect.wasDouble && newRollCount > 3) {
    updatedStats.doublesCount = {
      ...updatedStats.doublesCount,
      [currentPlayer.id]: (updatedStats.doublesCount[currentPlayer.id] || 0) + 1,
    }
  }

  // Track hazard rolls (any roll in hazard mode - roll 4+)
  if (newRollCount > 3) {
    updatedStats.hazardRolls = {
      ...updatedStats.hazardRolls,
      [currentPlayer.id]: (updatedStats.hazardRolls[currentPlayer.id] || 0) + 1,
    }
  }

  // Track busts
  if (busted) {
    updatedStats.bustCount = {
      ...updatedStats.bustCount,
      [currentPlayer.id]: (updatedStats.bustCount[currentPlayer.id] || 0) + 1,
    }
  }

  const newState: GameState = {
    ...state,
    bankValue: newBankValue,
    rollCountThisRound: newRollCount,
    lastRoll: effect,
    history: [...state.history, historyEntry],
    stats: updatedStats,
  }

  // If busted, end the round immediately
  if (busted) {
    return endRoundBust(newState)
  }

  // Advance to next player
  return advanceTurn(newState)
}

/**
 * Handle a player banking their points
 */
export function applyBank(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)
  if (!player || player.hasBankedThisRound) {
    return state
  }

  const wasCurrentRoller = player.isCurrentRoller
  // Capture the current roller's index BEFORE modifying state
  const currentRollerIndex = state.players.findIndex((p) => p.isCurrentRoller)

  // Calculate deficit before banking (for comeback tracking)
  const maxScoreBefore = Math.max(...state.players.map(p => p.score))
  const deficitBefore = maxScoreBefore - player.score

  // Add bank value to player's score
  const updatedPlayers = state.players.map((p) =>
    p.id === playerId
      ? {
          ...p,
          score: p.score + state.bankValue,
          hasBankedThisRound: true,
          isCurrentRoller: false,
          pointsEarnedThisRound: p.pointsEarnedThisRound + state.bankValue
        }
      : p
  )

  // Update stats for biggestRound, comebackKing, and earlyBanks
  const pointsThisRound = player.pointsEarnedThisRound + state.bankValue
  let updatedStats = state.stats ? { ...state.stats } : {
    doublesCount: {},
    bustCount: {},
    hazardRolls: {},
    earlyBanks: {},
    biggestRound: null,
    totalRolls: {},
    comebackKing: null,
  }

  // Track early banks (banking before hazard mode - rolls 1-3)
  if (state.rollCountThisRound <= 3) {
    updatedStats = {
      ...updatedStats,
      earlyBanks: {
        ...updatedStats.earlyBanks,
        [player.id]: (updatedStats.earlyBanks[player.id] || 0) + 1,
      },
    }
  }

  // Track biggest round
  if (!updatedStats.biggestRound || pointsThisRound > updatedStats.biggestRound.points) {
    updatedStats = {
      ...updatedStats,
      biggestRound: {
        player: player.nickname,
        points: pointsThisRound,
        round: state.roundNumber,
      },
    }
  }

  // Track comeback king - if player was behind and banked enough to take lead
  const newScore = player.score + state.bankValue
  const newMaxScore = Math.max(...updatedPlayers.map(p => p.score))
  if (deficitBefore > 0 && newScore >= newMaxScore) {
    // Player overcame a deficit to take/tie the lead
    if (!updatedStats.comebackKing || deficitBefore > updatedStats.comebackKing.deficit) {
      updatedStats = {
        ...updatedStats,
        comebackKing: {
          player: player.nickname,
          deficit: deficitBefore,
        },
      }
    }
  }

  let newState: GameState = {
    ...state,
    players: updatedPlayers,
    lastBankedPlayer: player.nickname,
    lastBankedAt: Date.now(),
    stats: updatedStats,
  }

  // Check if all players have banked
  const allBanked = updatedPlayers.every((p) => p.hasBankedThisRound)
  if (allBanked) {
    // Save the last roller index before showing round winner
    newState = {
      ...newState,
      lastRollerIndex: currentRollerIndex,
      phase: 'roundWinner',
      roundWinnerAt: Date.now(),
    }
    return newState
  }

  // Only advance turn if the banking player was the current roller
  if (wasCurrentRoller) {
    return advanceTurnFrom(newState, currentRollerIndex)
  }

  return newState
}

/**
 * Advance to the next player who hasn't banked
 */
export function advanceTurn(state: GameState): GameState {
  const currentRollerIndex = state.players.findIndex((p) => p.isCurrentRoller)
  return advanceTurnFrom(state, currentRollerIndex)
}

/**
 * Advance turn starting from a specific player index
 * Used when the current roller may have already been cleared (e.g., after banking)
 */
export function advanceTurnFrom(state: GameState, fromIndex: number): GameState {
  const activePlayers = state.players.filter((p) => !p.hasBankedThisRound)

  if (activePlayers.length === 0) {
    return startNewRound(state)
  }

  let nextRollerIndex = (fromIndex + 1) % state.players.length

  // Find next player who hasn't banked
  let attempts = 0
  while (state.players[nextRollerIndex].hasBankedThisRound && attempts < state.players.length) {
    nextRollerIndex = (nextRollerIndex + 1) % state.players.length
    attempts++
  }

  const updatedPlayers = state.players.map((p, index) => ({
    ...p,
    isCurrentRoller: index === nextRollerIndex && !p.hasBankedThisRound,
  }))

  return {
    ...state,
    players: updatedPlayers,
  }
}

/**
 * End the round due to a bust (no one gets points)
 * Sets phase to 'bust' and records timestamp - new round starts after delay
 */
function endRoundBust(state: GameState): GameState {
  // Capture the current roller index BEFORE clearing
  const lastRollerIndex = state.players.findIndex((p) => p.isCurrentRoller)

  // All players who haven't banked get nothing
  const updatedPlayers = state.players.map((p) => ({
    ...p,
    hasBankedThisRound: true,
    isCurrentRoller: false,
  }))

  // Set bust phase with timestamp - don't immediately start new round
  return {
    ...state,
    players: updatedPlayers,
    phase: 'bust',
    bustAt: Date.now(),
    lastRollerIndex,
  }
}

/**
 * Check if bust delay has passed and transition to new round if needed
 * Call this when getting game state to auto-advance from bust
 */
export function checkBustTransition(state: GameState, delayMs: number = 10000): GameState {
  if (state.phase !== 'bust' || !state.bustAt) {
    return state
  }

  const elapsed = Date.now() - state.bustAt
  if (elapsed >= delayMs) {
    // Delay has passed, show round winner card
    return {
      ...state,
      phase: 'roundWinner',
      roundWinnerAt: Date.now(),
    }
  }

  // Still in bust phase
  return state
}

/**
 * Check if round winner delay has passed and transition to new round if needed
 * Call this when getting game state to auto-advance from round winner
 */
export function checkRoundWinnerTransition(state: GameState, delayMs: number = 5000): GameState {
  if (state.phase !== 'roundWinner' || !state.roundWinnerAt) {
    return state
  }

  const elapsed = Date.now() - state.roundWinnerAt
  if (elapsed >= delayMs) {
    // Delay has passed, start new round
    return startNewRound(state)
  }

  // Still showing round winner
  return state
}

/**
 * Start a new round
 */
export function startNewRound(state: GameState): GameState {
  const newRoundNumber = state.roundNumber + 1

  // Create round history entry for the round that just finished
  const playerResults = state.players.map(p => ({
    playerNickname: p.nickname,
    pointsEarned: p.pointsEarnedThisRound,
  }))

  const topPoints = Math.max(...state.players.map(p => p.pointsEarnedThisRound))
  const topPlayer = state.players.find(p => p.pointsEarnedThisRound === topPoints)?.nickname || ''

  const roundHistoryEntry = {
    roundNumber: state.roundNumber,
    playerResults,
    topPlayer,
    topPoints,
  }

  // Check if game is over
  if (newRoundNumber > state.totalRounds) {
    return {
      ...state,
      roundHistory: [...state.roundHistory, roundHistoryEntry],
      phase: 'finished',
    }
  }

  // Use saved lastRollerIndex, or find current roller, or default to 0
  const lastRollerIndex = state.lastRollerIndex ?? state.players.findIndex(p => p.isCurrentRoller)
  const nextRollerIndex = lastRollerIndex >= 0
    ? (lastRollerIndex + 1) % state.players.length
    : 0

  // Reset for new round with next player as roller
  const updatedPlayers = state.players.map((p, index) => ({
    ...p,
    hasBankedThisRound: false,
    isCurrentRoller: index === nextRollerIndex,
    status: 'in' as const,
    pointsEarnedThisRound: 0,
  }))

  return {
    ...state,
    players: updatedPlayers,
    roundNumber: newRoundNumber,
    bankValue: 0,
    rollCountThisRound: 0,
    lastRoll: undefined,
    history: [],
    roundHistory: [...state.roundHistory, roundHistoryEntry],
    phase: 'inRound',
    lastRollerIndex: undefined, // Clear for new round
    bustAt: undefined,
    roundWinnerAt: undefined,
    lastBankedPlayer: undefined,
    lastBankedAt: undefined,
  }
}

/**
 * Get the winner(s) of the game
 */
export function getWinners(state: GameState): Player[] {
  const maxScore = Math.max(...state.players.map((p) => p.score))
  return state.players.filter((p) => p.score === maxScore)
}
