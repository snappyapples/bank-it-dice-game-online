import { GameState } from './types'
import { initGame } from './gameLogic'
import { supabase, RoomRow } from './supabase'

interface Room {
  id: string
  hostPlayerId: string
  totalRounds: number
  gameState: GameState
  players: Map<string, { nickname: string; playerId: string }>
  started: boolean
  createdAt: number
}

class GameStore {
  async createRoom(hostPlayerId: string, hostNickname: string, totalRounds: number): Promise<string> {
    const roomId = this.generateRoomId()

    const players = new Map([[hostPlayerId, { nickname: hostNickname, playerId: 'player-0' }]])
    const gameState = initGame([hostNickname], totalRounds)

    console.log('[GameStore] Attempting to create room:', { roomId, hostPlayerId, totalRounds })

    const { error } = await supabase
      .from('rooms')
      .insert({
        id: roomId,
        host_player_id: hostPlayerId,
        total_rounds: totalRounds,
        started: false,
        game_state: {
          ...gameState,
          _players: Object.fromEntries(players),
        },
      })

    if (error) {
      console.error('[GameStore] Supabase error creating room:', error)
      console.error('[GameStore] Error code:', error.code)
      console.error('[GameStore] Error message:', error.message)
      console.error('[GameStore] Error details:', error.details)
      throw new Error(`Failed to create room: ${error.message}`)
    }

    console.log(`[GameStore] Created room ${roomId} for ${hostNickname}`)
    return roomId
  }

  async joinRoom(roomId: string, playerId: string, nickname: string): Promise<{ success: boolean; error?: string }> {
    const room = await this.getRoom(roomId)
    if (!room) return { success: false, error: 'Room not found' }
    if (room.started) return { success: false, error: 'Game has already started' }
    if (room.players.has(playerId)) return { success: true } // Already in room

    // Check for duplicate nickname (case-insensitive)
    const existingNicknames = Array.from(room.players.values()).map(p => p.nickname.toLowerCase())
    if (existingNicknames.includes(nickname.toLowerCase())) {
      return { success: false, error: 'That name is already taken. Please choose a different name.' }
    }

    // Add player to room
    const playerIndex = room.players.size
    room.players.set(playerId, { nickname, playerId: `player-${playerIndex}` })

    // Reinitialize game with all players - SORT by playerId to ensure consistent order
    // (JSON/database operations don't preserve Map insertion order)
    const sortedPlayers = Array.from(room.players.values())
      .sort((a, b) => {
        const aNum = parseInt(a.playerId.replace('player-', ''))
        const bNum = parseInt(b.playerId.replace('player-', ''))
        return aNum - bNum
      })
    const allNicknames = sortedPlayers.map(p => p.nickname)
    const newGameState = initGame(allNicknames, room.totalRounds)

    const { error } = await supabase
      .from('rooms')
      .update({
        game_state: {
          ...newGameState,
          _players: Object.fromEntries(room.players),
        },
      })
      .eq('id', roomId)

    if (error) {
      console.error('[GameStore] Error joining room:', error)
      return { success: false, error: 'Failed to join room' }
    }

    return { success: true }
  }

  async startGame(roomId: string): Promise<boolean> {
    const room = await this.getRoom(roomId)
    if (!room) return false
    if (room.started) return false
    if (room.players.size < 2) return false // Need at least 2 players

    room.gameState.phase = 'inRound'

    const { error } = await supabase
      .from('rooms')
      .update({
        started: true,
        game_state: {
          ...room.gameState,
          _players: Object.fromEntries(room.players),
        },
      })
      .eq('id', roomId)

    if (error) {
      console.error('[GameStore] Error starting game:', error)
      return false
    }

    return true
  }

  async getRoom(roomId: string): Promise<Room | undefined> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error || !data) {
      console.log(`[GameStore] Room ${roomId} not found`)
      return undefined
    }

    return this.mapRowToRoom(data)
  }

  async updateGameState(roomId: string, newState: GameState): Promise<boolean> {
    const room = await this.getRoom(roomId)
    if (!room) return false

    const { error } = await supabase
      .from('rooms')
      .update({
        game_state: {
          ...newState,
          _players: Object.fromEntries(room.players),
        },
      })
      .eq('id', roomId)

    if (error) {
      console.error('[GameStore] Error updating game state:', error)
      return false
    }

    return true
  }

  async getPlayerGameId(roomId: string, playerId: string): Promise<string | undefined> {
    const room = await this.getRoom(roomId)
    if (!room) return undefined

    const player = room.players.get(playerId)
    return player?.playerId
  }

  async restartRoom(roomId: string, newHostPlayerId: string, newHostNickname: string): Promise<{ success: boolean; error?: string }> {
    const room = await this.getRoom(roomId)
    if (!room) return { success: false, error: 'Room not found' }

    // Create fresh player list with new host as only player
    const players = new Map([[newHostPlayerId, { nickname: newHostNickname, playerId: 'player-0' }]])

    // Initialize fresh game state, preserving totalRounds from previous game
    const newGameState = initGame([newHostNickname], room.totalRounds)

    const { error } = await supabase
      .from('rooms')
      .update({
        host_player_id: newHostPlayerId,
        started: false,
        game_state: {
          ...newGameState,
          _players: Object.fromEntries(players),
        },
      })
      .eq('id', roomId)

    if (error) {
      console.error('[GameStore] Error restarting room:', error)
      return { success: false, error: 'Failed to restart room' }
    }

    console.log(`[GameStore] Restarted room ${roomId} with new host ${newHostNickname}`)
    return { success: true }
  }

  private mapRowToRoom(row: RoomRow): Room {
    const gameStateWithPlayers = row.game_state as any
    const playersObj = gameStateWithPlayers._players || {}
    const players = new Map(
      Object.entries(playersObj) as [string, { nickname: string; playerId: string }][]
    )

    // Remove _players from gameState before using it
    const { _players, ...gameState } = gameStateWithPlayers

    return {
      id: row.id,
      hostPlayerId: row.host_player_id,
      totalRounds: row.total_rounds,
      gameState: gameState as GameState,
      players,
      started: row.started,
      createdAt: new Date(row.created_at).getTime(),
    }
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  // Cleanup is now handled by Supabase function in schema.sql
  async cleanupOldRooms(): Promise<void> {
    const { error } = await supabase.rpc('cleanup_old_rooms')
    if (error) {
      console.error('[GameStore] Error cleaning up old rooms:', error)
    }
  }
}

// Singleton instance
export const gameStore = new GameStore()
