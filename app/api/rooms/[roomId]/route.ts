import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/gameStore'
import { checkBustTransition, checkRoundWinnerTransition } from '@/lib/gameLogic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params

    const room = await gameStore.getRoom(roomId)

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Check if we need to auto-advance from bust phase (10 second delay)
    let gameState = room.gameState
    let newGameState = checkBustTransition(gameState, 10000)

    // Check if we need to auto-advance from round winner phase (5 second delay)
    newGameState = checkRoundWinnerTransition(newGameState, 5000)

    // If state changed, update the database
    if (newGameState !== gameState) {
      await gameStore.updateGameState(roomId, newGameState)
      gameState = newGameState
    }

    return NextResponse.json({
      roomId: room.id,
      gameState: gameState,
      started: room.started,
      playerCount: room.players.size,
      hostPlayerId: room.hostPlayerId,
    })
  } catch (error) {
    console.error('Error getting room:', error)
    return NextResponse.json(
      { error: 'Failed to get room' },
      { status: 500 }
    )
  }
}
