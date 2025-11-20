import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/gameStore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerId, nickname, totalRounds } = body

    console.log('Create room request:', { playerId, nickname, totalRounds })

    if (!playerId || !nickname || !totalRounds) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const roomId = await gameStore.createRoom(playerId, nickname, totalRounds)

    console.log('Room created successfully:', roomId)

    return NextResponse.json({
      roomId,
      success: true,
    })
  } catch (error) {
    console.error('Error creating room - Full error:', error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Failed to create room',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
