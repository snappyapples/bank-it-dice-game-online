import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/gameStore'

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

    return NextResponse.json({
      roomId: room.id,
      gameState: room.gameState,
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
