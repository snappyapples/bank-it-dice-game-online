import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/gameStore'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params
    const body = await request.json()
    const { playerId, nickname } = body

    if (!playerId || !nickname) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const success = await gameStore.joinRoom(roomId, playerId, nickname)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to join room. Room may not exist or game already started.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error joining room:', error)
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    )
  }
}
