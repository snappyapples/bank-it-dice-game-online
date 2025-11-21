'use client'

import { useState, useEffect, useRef, use } from 'react'
import BankPanel from '@/components/BankPanel'
import PlayersPanel from '@/components/PlayersPanel'
import ActionPanel from '@/components/ActionPanel'
import RollHistoryPanel from '@/components/RollHistoryPanel'
import RoundHistoryPanel from '@/components/RoundHistoryPanel'
import { GameState } from '@/lib/types'
import { useSounds } from '@/hooks/useSounds'
import { soundManager } from '@/lib/sounds'

function getPlayerId(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('playerId') || ''
}

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [pendingGameState, setPendingGameState] = useState<GameState | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerCount, setPlayerCount] = useState(0)
  const [isRolling, setIsRolling] = useState(false)
  const [error, setError] = useState('')
  const [playerId] = useState(() => getPlayerId())
  const [hostPlayerId, setHostPlayerId] = useState('')
  const [currentRound, setCurrentRound] = useState(1)
  const [lastRollId, setLastRollId] = useState<string | null>(null)

  // Sound effects
  const { play: playSound } = useSounds()

  // Refs to access current values in polling callback
  const lastRollIdRef = useRef<string | null>(null)
  const isRollingRef = useRef(false)
  const pendingGameStateRef = useRef<GameState | null>(null)

  // Keep refs in sync with state
  useEffect(() => { lastRollIdRef.current = lastRollId }, [lastRollId])
  useEffect(() => { isRollingRef.current = isRolling }, [isRolling])
  useEffect(() => { pendingGameStateRef.current = pendingGameState }, [pendingGameState])

  // Poll for game state updates
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`)
        if (!response.ok) {
          throw new Error('Room not found')
        }

        const data = await response.json()

        // Check if this is a new roll
        const newLastRoll = data.gameState?.lastRoll
        if (newLastRoll) {
          const newRollId = `${newLastRoll.die1}-${newLastRoll.die2}-${data.gameState.rollCountThisRound}`

          if (lastRollIdRef.current === null) {
            // First load - just set everything normally
            lastRollIdRef.current = newRollId
            setLastRollId(newRollId)
            setGameState(data.gameState)
          } else if (newRollId !== lastRollIdRef.current && !isRollingRef.current) {
            // New roll detected from another player - trigger animation
            lastRollIdRef.current = newRollId
            isRollingRef.current = true  // Update ref immediately to prevent race conditions
            setLastRollId(newRollId)
            setPendingGameState(data.gameState)
            setIsRolling(true)

            // Play roll sound for other player's roll
            soundManager.play('roll')

            // After animation, update displayed game state and play result sound
            setTimeout(() => {
              isRollingRef.current = false
              setIsRolling(false)
              setGameState(data.gameState)
              setPendingGameState(null)

              // Play result sound based on what happened
              const effect = data.gameState.lastRoll?.effectType
              if (effect === 'bust') {
                soundManager.play('bust')
              } else if (effect === 'doubleBank') {
                soundManager.play('doubles')
              } else if (effect === 'add70') {
                soundManager.play('lucky7')
              }
            }, 3000)
          } else if (newRollId === lastRollIdRef.current && !isRollingRef.current) {
            // Same roll, not animating - update other state normally (scores, etc.)
            setGameState(data.gameState)
          }
          // If animating, skip this update (we'll get fresh data after animation)
        } else {
          // No lastRoll yet - update normally
          setGameState(data.gameState)
        }

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

    // Get fresh playerId from localStorage in case it changed
    const currentPlayerId = localStorage.getItem('playerId') || ''
    if (!currentPlayerId) {
      setError('Player ID not found. Please refresh the page.')
      return
    }

    try {
      // Call API first to get dice values BEFORE starting animation
      const response = await fetch(`/api/rooms/${roomId}/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to roll')
      }

      const data = await response.json()
      setError('')

      // Store pending state (dice values for animation) but don't update displayed state yet
      setPendingGameState(data.gameState)

      // Update lastRollId so the polling effect doesn't trigger a duplicate animation
      const newRollId = `${data.gameState.lastRoll.die1}-${data.gameState.lastRoll.die2}-${data.gameState.rollCountThisRound}`
      setLastRollId(newRollId)

      // Start the animation and play roll sound
      setIsRolling(true)
      playSound('roll')

      // Wait for animation to complete, then update the full game state (bank, history, etc.)
      setTimeout(() => {
        setIsRolling(false)
        setGameState(data.gameState)
        setPendingGameState(null)

        // Play result sound based on what happened
        const effect = data.gameState.lastRoll?.effectType
        if (effect === 'bust') {
          playSound('bust')
        } else if (effect === 'doubleBank') {
          playSound('doubles')
        } else if (effect === 'add70') {
          playSound('lucky7')
        }
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to roll')
    }
  }

  const handleBank = async () => {
    // Get fresh playerId from localStorage
    const currentPlayerId = localStorage.getItem('playerId') || ''
    if (!currentPlayerId) {
      setError('Player ID not found. Please refresh the page.')
      return
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}/bank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to bank')
      }

      const data = await response.json()
      setGameState(data.gameState)
      setError('')
      playSound('bank')
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
  const isBustPhase = gameState.phase === 'bust'
  const backgroundClass = isBustPhase
    ? 'bg-gradient-to-b from-red-900/50 via-red-950/30 to-background-dark'
    : isRiskyPhase
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

        {/* Bust Announcement */}
        {isBustPhase && (
          <div className="mb-6 bg-gradient-to-r from-red-900/30 via-red-800/20 to-red-900/30 border-2 border-bust-red rounded-lg shadow-2xl p-8 text-center backdrop-blur-sm animate-pulse">
            <div className="text-6xl mb-4">💥</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Round {gameState.roundNumber}</div>
            <div className="text-5xl font-bold text-bust-red mb-2">BUST!</div>
            <div className="text-xl text-gray-300">
              <span className="font-bold text-bust-red">{gameState.history[gameState.history.length - 1]?.playerNickname || 'Someone'}</span> rolled a 7 - Bank emptied!
            </div>
            <div className="text-gray-400 mt-4 text-sm">New round starting soon...</div>
          </div>
        )}
        {/* Top Section - Bank Info */}
        <div className="mb-6">
          <BankPanel
            gameState={gameState}
            lastRoll={gameState.lastRoll}
            showEffect={!isRolling && !!gameState.lastRoll}
          />
        </div>

        {/* Middle Section - Actions and Players */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Action Panel - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <ActionPanel
              isCurrentPlayer={isCurrentPlayer}
              hasBanked={hasBanked}
              lastRoll={pendingGameState?.lastRoll ?? gameState.lastRoll}
              isRolling={isRolling}
              isBustPhase={isBustPhase}
              currentRollerName={gameState.players.find(p => p.isCurrentRoller)?.nickname || ''}
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
                <div className="text-xl font-bold">
                  {(() => {
                    const maxScore = Math.max(...gameState.players.map(p => p.score))
                    const leadersCount = gameState.players.filter(p => p.score === maxScore).length
                    const isAtMax = currentPlayer.score === maxScore
                    const pointsBehind = maxScore - currentPlayer.score

                    if (maxScore === 0) {
                      return <span className="text-gray-400">Game just started - roll to build the bank!</span>
                    } else if (isAtMax && leadersCount > 1) {
                      return <span className="text-yellow-400">Tied for first place</span>
                    } else if (isAtMax) {
                      return <span className="text-brand-lime">You are winning!</span>
                    } else {
                      return <span className="text-orange-400">{pointsBehind} points behind leader</span>
                    }
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
