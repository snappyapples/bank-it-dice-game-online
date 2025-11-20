import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/gameStore'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params

    const success = await gameStore.startGame(roomId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to start game. Need at least 2 players or game already started.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    )
  }
}
