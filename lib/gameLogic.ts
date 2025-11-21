import { GameState, Player, RollEffect, RollHistoryEntry } from './types'

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

  return {
    players,
    roundNumber: 1,
    totalRounds,
    bankValue: 0,
    rollCountThisRound: 0,
    lastRoll: undefined,
    history: [],
    roundHistory: [],
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

  const newState: GameState = {
    ...state,
    bankValue: newBankValue,
    rollCountThisRound: newRollCount,
    lastRoll: effect,
    history: [...state.history, historyEntry],
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

  // Add bank value to player's score
  const updatedPlayers = state.players.map((p) =>
    p.id === playerId
      ? {
          ...p,
          score: p.score + state.bankValue,
          hasBankedThisRound: true,
          isCurrentRoller: false,
          pointsEarnedThisRound: state.bankValue
        }
      : p
  )

  const newState: GameState = {
    ...state,
    players: updatedPlayers,
  }

  // Check if all players have banked
  const allBanked = updatedPlayers.every((p) => p.hasBankedThisRound)
  if (allBanked) {
    return startNewRound(newState)
  }

  // Only advance turn if the banking player was the current roller
  if (wasCurrentRoller) {
    return advanceTurn(newState)
  }

  return newState
}

/**
 * Advance to the next player who hasn't banked
 */
export function advanceTurn(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => !p.hasBankedThisRound)

  if (activePlayers.length === 0) {
    return startNewRound(state)
  }

  const currentRollerIndex = state.players.findIndex((p) => p.isCurrentRoller)
  let nextRollerIndex = (currentRollerIndex + 1) % state.players.length

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
    // Delay has passed, start new round
    return startNewRound(state)
  }

  // Still in bust phase
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

  // Find the last roller from the previous round and advance to next player
  const lastRollerIndex = state.players.findIndex(p => p.isCurrentRoller)
  const nextRollerIndex = (lastRollerIndex + 1) % state.players.length

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
  }
}

/**
 * Get the winner(s) of the game
 */
export function getWinners(state: GameState): Player[] {
  const maxScore = Math.max(...state.players.map((p) => p.score))
  return state.players.filter((p) => p.score === maxScore)
}
