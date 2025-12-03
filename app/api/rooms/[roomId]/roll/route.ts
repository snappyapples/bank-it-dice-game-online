import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/gameStore'
import { applyRoll, canRollNow } from '@/lib/gameLogic'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params
    const body = await request.json()
    const { playerId } = body

    console.log('[Roll] Request:', { roomId, playerId })

    if (!playerId) {
      console.log('[Roll] Missing playerId')
      return NextResponse.json(
        { error: 'Missing playerId' },
        { status: 400 }
      )
    }

    const room = await gameStore.getRoom(roomId)
    if (!room) {
      console.log('[Roll] Room not found:', roomId)
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    console.log('[Roll] Room found. Started:', room.started)
    console.log('[Roll] Players in room:', Array.from(room.players.keys()))

    if (!room.started) {
      console.log('[Roll] Game not started')
      return NextResponse.json(
        { error: 'Game not started' },
        { status: 400 }
      )
    }

    // Get the player's game ID
    const playerGameId = await gameStore.getPlayerGameId(roomId, playerId)
    console.log('[Roll] Player game ID lookup:', { playerId, playerGameId })

    if (!playerGameId) {
      console.log('[Roll] Player not in room. Available players:', Array.from(room.players.entries()))
      return NextResponse.json(
        { error: 'Player not in room' },
        { status: 400 }
      )
    }

    // Check if it's this player's turn
    const currentPlayer = room.gameState.players.find(p => p.isCurrentRoller)
    console.log('[Roll] Current roller:', currentPlayer?.nickname, 'ID:', currentPlayer?.id)
    console.log('[Roll] Requesting player game ID:', playerGameId)

    if (!currentPlayer || currentPlayer.id !== playerGameId) {
      console.log('[Roll] Not player turn. Current:', currentPlayer?.id, 'Request:', playerGameId)
      return NextResponse.json(
        { error: `Not your turn. Current roller: ${currentPlayer?.nickname || 'unknown'}` },
        { status: 400 }
      )
    }

    // Check if banking window has passed (after first roll of round)
    const rollCheck = canRollNow(room.gameState)
    if (!rollCheck.allowed) {
      console.log('[Roll] Banking window still active, remaining:', rollCheck.remainingMs)
      return NextResponse.json(
        { error: 'Banking window still active', remainingMs: rollCheck.remainingMs },
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
