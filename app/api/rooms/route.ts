import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/gameStore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerId, nickname, totalRounds } = body

    if (!playerId || !nickname || !totalRounds) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const roomId = await gameStore.createRoom(playerId, nickname, totalRounds)

    return NextResponse.json({
      roomId,
      success: true,
    })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
