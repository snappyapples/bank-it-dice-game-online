import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/gameStore'
import { applyRoll } from '@/lib/gameLogic'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params
    const body = await request.json()
    const { playerId } = body

    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing playerId' },
        { status: 400 }
      )
    }

    const room = await gameStore.getRoom(roomId)
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (!room.started) {
      return NextResponse.json(
        { error: 'Game not started' },
        { status: 400 }
      )
    }

    // Get the player's game ID
    const playerGameId = await gameStore.getPlayerGameId(roomId, playerId)
    if (!playerGameId) {
      return NextResponse.json(
        { error: 'Player not in room' },
        { status: 400 }
      )
    }

    // Check if it's this player's turn
    const currentPlayer = room.gameState.players.find(p => p.isCurrentRoller)
    if (!currentPlayer || currentPlayer.id !== playerGameId) {
      return NextResponse.json(
        { error: 'Not your turn' },
        { status: 400 }
      )
    }

    // Apply the roll
    const newState = applyRoll(room.gameState)
    await gameStore.updateGameState(roomId, newState)

    return NextResponse.json({
      success: true,
      gameState: newState,
    })
  } catch (error) {
    console.error('Error rolling dice:', error)
    return NextResponse.json(
      { error: 'Failed to roll dice' },
      { status: 500 }
    )
  }
}
