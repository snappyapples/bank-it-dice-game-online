'use client'

import { useState, useEffect, use } from 'react'
import BankPanel from '@/components/BankPanel'
import PlayersPanel from '@/components/PlayersPanel'
import ActionPanel from '@/components/ActionPanel'
import RollHistoryPanel from '@/components/RollHistoryPanel'
import RoundHistoryPanel from '@/components/RoundHistoryPanel'
import { GameState } from '@/lib/types'

function getPlayerId(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('playerId') || ''
}

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerCount, setPlayerCount] = useState(0)
  const [isRolling, setIsRolling] = useState(false)
  const [error, setError] = useState('')
  const [playerId] = useState(() => getPlayerId())
  const [hostPlayerId, setHostPlayerId] = useState('')
  const [currentRound, setCurrentRound] = useState(1)

  // Poll for game state updates
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`)
        if (!response.ok) {
          throw new Error('Room not found')
        }

        const data = await response.json()
        setGameState(data.gameState)
        setGameStarted(data.started)
        setPlayerCount(data.playerCount)
        setHostPlayerId(data.hostPlayerId)
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room')
      }
    }

    // Initial fetch
    fetchGameState()

    // Poll every 2 seconds
    const interval = setInterval(fetchGameState, 2000)

    return () => clearInterval(interval)
  }, [roomId])

  // Reset isRolling when round changes
  useEffect(() => {
    if (gameState && gameState.roundNumber !== currentRound) {
      setIsRolling(false)
      setCurrentRound(gameState.roundNumber)
    }
  }, [gameState, currentRound])

  const handleStartGame = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start game')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game')
    }
  }

  const handleRoll = async () => {
    if (isRolling) return

    setIsRolling(true)

    // Add suspenseful delay for 3D dice animation (5 seconds)
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/roll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to roll')
        }

        const data = await response.json()
        setGameState(data.gameState)
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to roll')
      } finally {
        setIsRolling(false)
      }
    }, 5000)
  }

  const handleBank = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/bank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to bank')
      }

      const data = await response.json()
      setGameState(data.gameState)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bank')
    }
  }

  // Show loading state
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {error ? (
            <div className="text-bust-red text-xl">{error}</div>
          ) : (
            <div className="text-gray-400 text-xl">Loading room...</div>
          )}
        </div>
      </div>
    )
  }

  // Show lobby if game hasn't started
  if (!gameStarted) {
    const isHost = playerId === hostPlayerId

    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Lobby Panel */}
          <div className="bg-[#141414] border border-white/10 rounded-lg p-8 backdrop-blur-sm mb-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Game Lobby</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-bust-red/20 border border-bust-red px-4 py-3 text-sm text-bust-red">
                {error}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Players ({playerCount}):</h3>
              <div className="space-y-2">
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex items-center justify-between"
                  >
                    <span className="font-medium">{player.nickname}</span>
                    {player.id === 'player-0' && (
                      <span className="text-xs bg-brand-purple px-2 py-1 rounded">Host</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-gray-400 mb-6">
              {playerCount < 2 ? (
                <p>Waiting for at least 2 players to start...</p>
              ) : isHost ? (
                <p>Ready to start! Click the button below to begin.</p>
              ) : (
                <p>Waiting for host to start the game...</p>
              )}
            </div>

            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={playerCount < 2}
                className="w-full py-4 bg-brand-lime text-black font-bold rounded-lg text-lg hover:bg-brand-lime/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Game
              </button>
            )}
          </div>

          {/* Room Code at Bottom */}
          <div className="bg-[#141414] border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-center">
              <span className="text-sm text-gray-400">Room Code:</span>
              <div className="text-3xl font-bold text-brand-lime mt-2">{roomId.toUpperCase()}</div>
              <p className="text-gray-400 mt-2 text-sm">Share this code with friends to join!</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get current player's game ID from the game state
  const currentPlayerNickname = localStorage.getItem('nickname') || ''
  const currentPlayerGameId = gameState.players.find(p => p.nickname === currentPlayerNickname)?.id
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerGameId)
  const isCurrentPlayer = currentPlayer?.isCurrentRoller || false
  const hasBanked = currentPlayer?.hasBankedThisRound || false

  // Determine if we're in the risky phase (roll 4+)
  const isRiskyPhase = gameState.rollCountThisRound >= 3
  const backgroundClass = isRiskyPhase
    ? 'bg-gradient-to-b from-red-950/30 via-background-dark to-background-dark'
    : 'bg-background-dark'

  // Determine winner if game is finished
  const isGameFinished = gameState.phase === 'finished'
  const maxScore = Math.max(...gameState.players.map(p => p.score))
  const winners = gameState.players.filter(p => p.score === maxScore)
  const winnerText = winners.length > 1
    ? `${winners.map(w => w.nickname).join(' & ')} (Tie!)`
    : winners[0]?.nickname || ''

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-colors duration-1000 ${backgroundClass}`}>
      {error && (
        <div className="max-w-7xl mx-auto mb-4 rounded-lg bg-bust-red/20 border border-bust-red px-4 py-3 text-sm text-bust-red">
          {error}
        </div>
      )}

      {/* Main Game Layout */}
      <div className="max-w-7xl mx-auto">
        {/* Winner Announcement */}
        {isGameFinished && (
          <div className="mb-6 bg-gradient-to-r from-brand-lime/20 via-brand-teal/20 to-brand-purple/20 border-2 border-brand-lime rounded-lg shadow-2xl p-8 text-center backdrop-blur-sm">
            <div className="text-6xl mb-4">🏆</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Winner is:</div>
            <div className="text-5xl font-bold text-brand-lime mb-2">{winnerText}</div>
            <div className="text-2xl text-gray-300">Final Score: {maxScore}</div>
          </div>
        )}
        {/* Top Section - Bank Info */}
        <div className="mb-6">
          <BankPanel gameState={gameState} />
        </div>

        {/* Middle Section - Actions and Players */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Action Panel - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <ActionPanel
              isCurrentPlayer={isCurrentPlayer}
              hasBanked={hasBanked}
              lastRoll={gameState.lastRoll}
              isRolling={isRolling}
              onRoll={handleRoll}
              onBank={handleBank}
            />
          </div>

          {/* Players Panel - Takes 1 column on large screens */}
          <div className="lg:col-span-1 space-y-4">
            {/* Player Status Box */}
            {currentPlayer && (
              <div className="bg-[#141414] border border-white/10 rounded-lg shadow-xl p-4 backdrop-blur-sm text-center">
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Status:</div>
                <div className="text-xl font-bold text-brand-lime">
                  {(() => {
                    const maxScore = Math.max(...gameState.players.map(p => p.score))
                    const isWinning = currentPlayer.score === maxScore
                    const pointsBehind = maxScore - currentPlayer.score
                    return isWinning ? 'You are winning' : `${pointsBehind} points behind winner`
                  })()}
                </div>
              </div>
            )}

            <PlayersPanel players={gameState.players} />
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-6 mb-6">
          <RollHistoryPanel history={gameState.history} />
          <RoundHistoryPanel history={gameState.roundHistory} currentPlayerNickname={currentPlayerNickname} />
        </div>

        {/* Room Code Footer */}
        <div className="bg-[#141414] border border-white/10 rounded-lg p-4 flex items-center justify-between backdrop-blur-sm">
          <div>
            <span className="text-sm text-gray-400">Room Code:</span>
            <span className="ml-2 text-xl font-bold text-brand-lime">{roomId.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
