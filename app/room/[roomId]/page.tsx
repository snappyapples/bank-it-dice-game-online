'use client'

import { useState, useEffect, useRef, use } from 'react'
import BankPanel from '@/components/BankPanel'
import PlayersPanel from '@/components/PlayersPanel'
import ActionPanel from '@/components/ActionPanel'
import RollHistoryPanel from '@/components/RollHistoryPanel'
import RoundHistoryPanel from '@/components/RoundHistoryPanel'
import Confetti from '@/components/Confetti'
import GameStats from '@/components/GameStats'
import { GameState } from '@/lib/types'
import { useSounds } from '@/hooks/useSounds'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { soundManager } from '@/lib/sounds'
import { useHeaderContext } from '@/contexts/HeaderContext'

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
  const [showBankOverlay, setShowBankOverlay] = useState(false)
  const [lastBanker, setLastBanker] = useState('')
  const [lastBankedAmount, setLastBankedAmount] = useState(0)
  const [lastBankedLeaderInfo, setLastBankedLeaderInfo] = useState<{ leader: string; deficit: number } | null>(null)
  const [showCopiedOverlay, setShowCopiedOverlay] = useState(false)
  const [showTurnPopup, setShowTurnPopup] = useState(false)
  const [lobbyMusicStarted, setLobbyMusicStarted] = useState(false)
  const [needsToJoin, setNeedsToJoin] = useState(false)
  const [joinNickname, setJoinNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  // Track if user explicitly disabled music (to prevent autoplay from overriding)
  const userDisabledMusicRef = useRef(false)
  const autoplayAttemptedRef = useRef(false)
  const gameStartedRef = useRef(false)
  const musicInteractionListenerRef = useRef<(() => void) | null>(null)
  const victoryPlayedRef = useRef(false)

  // Sound effects
  const { play: playSound } = useSounds()

  // Header auto-hide on desktop during game
  const { setAutoHide } = useHeaderContext()

  // Install prompt for PWA
  const { canInstall, showIOSInstructions, promptInstall, dismissIOSInstructions } = useInstallPrompt()

  // Refs to access current values in polling callback
  const lastRollIdRef = useRef<string | null>(null)
  const isRollingRef = useRef(false)
  const pendingGameStateRef = useRef<GameState | null>(null)
  const lastBankedAtRef = useRef<number | undefined>(undefined)
  const bankPanelRef = useRef<HTMLDivElement>(null)
  const gameStatsRef = useRef<HTMLDivElement>(null)
  const prevRoundRef = useRef<number>(1)
  const prevRollerRef = useRef<string | null>(null)
  const gameFinishedScrolledRef = useRef(false)

  // Keep refs in sync with state
  useEffect(() => { lastRollIdRef.current = lastRollId }, [lastRollId])
  useEffect(() => { isRollingRef.current = isRolling }, [isRolling])
  useEffect(() => { pendingGameStateRef.current = pendingGameState }, [pendingGameState])

  // Enable header auto-hide on desktop when game is active (not in lobby or finished)
  useEffect(() => {
    const shouldAutoHide = gameStarted && gameState?.phase !== 'finished'
    setAutoHide(shouldAutoHide)
    return () => setAutoHide(false)
  }, [gameStarted, gameState?.phase, setAutoHide])

  // Load saved nickname
  useEffect(() => {
    const savedNickname = localStorage.getItem('nickname')
    if (savedNickname) {
      setJoinNickname(savedNickname)
    }
  }, [])

  // Check if player needs to join the game
  useEffect(() => {
    if (gameState && !gameStarted) {
      const currentNickname = localStorage.getItem('nickname')
      const isInGame = gameState.players.some(p => p.nickname === currentNickname)
      setNeedsToJoin(!isInGame)
    }
  }, [gameState, gameStarted])

  // Clear activeRoomId when game finishes (so home page doesn't show rejoin)
  useEffect(() => {
    if (gameState?.phase === 'finished') {
      localStorage.removeItem('activeRoomId')
    }
  }, [gameState?.phase])

  // Handle lobby music - autoplay when entering lobby, stop when game starts
  useEffect(() => {
    gameStartedRef.current = gameStarted

    if (gameStarted) {
      soundManager.stopLobbyMusic()
      setLobbyMusicStarted(false)
      autoplayAttemptedRef.current = false
      userDisabledMusicRef.current = false

      // Clean up any pending interaction listeners
      if (musicInteractionListenerRef.current) {
        document.removeEventListener('click', musicInteractionListenerRef.current)
        document.removeEventListener('keydown', musicInteractionListenerRef.current)
        musicInteractionListenerRef.current = null
      }
      return
    }

    // Only try autoplay once and only if user hasn't manually disabled
    if (!autoplayAttemptedRef.current && !userDisabledMusicRef.current && !gameStarted) {
      autoplayAttemptedRef.current = true
      soundManager.startLobbyMusic().then((success) => {
        if (success) {
          setLobbyMusicStarted(true)
        } else {
          // Autoplay blocked - set up click handler to start on first interaction
          const startMusicOnInteraction = () => {
            // Don't start music if game has started or user disabled it
            if (!userDisabledMusicRef.current && !gameStartedRef.current) {
              soundManager.startLobbyMusic().then((started) => {
                if (started && !gameStartedRef.current) {
                  setLobbyMusicStarted(true)
                } else if (started && gameStartedRef.current) {
                  // Game started while we were trying to play - stop immediately
                  soundManager.stopLobbyMusic()
                }
              })
            }
            document.removeEventListener('click', startMusicOnInteraction)
            document.removeEventListener('keydown', startMusicOnInteraction)
            musicInteractionListenerRef.current = null
          }
          musicInteractionListenerRef.current = startMusicOnInteraction
          document.addEventListener('click', startMusicOnInteraction)
          document.addEventListener('keydown', startMusicOnInteraction)
        }
      })
    }

    return () => {
      soundManager.stopLobbyMusic()
      if (musicInteractionListenerRef.current) {
        document.removeEventListener('click', musicInteractionListenerRef.current)
        document.removeEventListener('keydown', musicInteractionListenerRef.current)
        musicInteractionListenerRef.current = null
      }
    }
  }, [gameStarted])

  // Toggle lobby music
  const handleToggleLobbyMusic = () => {
    if (lobbyMusicStarted) {
      soundManager.stopLobbyMusic()
      setLobbyMusicStarted(false)
      userDisabledMusicRef.current = true  // Track that user manually disabled
    } else {
      userDisabledMusicRef.current = false  // User wants music back on
      soundManager.startLobbyMusic().then((success) => {
        if (success) setLobbyMusicStarted(true)
      })
    }
  }

  // Poll for game state updates
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`)
        if (!response.ok) {
          // Room no longer exists, clear stored room ID
          localStorage.removeItem('activeRoomId')
          throw new Error('Room not found')
        }

        const data = await response.json()

        // Check for banking overlay
        if (data.gameState?.lastBankedAt && data.gameState.lastBankedAt !== lastBankedAtRef.current) {
          lastBankedAtRef.current = data.gameState.lastBankedAt
          const bankerName = data.gameState.lastBankedPlayer || ''
          setLastBanker(bankerName)

          // Get banker info for enhanced popup
          const banker = data.gameState.players.find((p: { nickname: string }) => p.nickname === bankerName)
          if (banker) {
            setLastBankedAmount(banker.pointsEarnedThisRound)

            // Calculate leader info
            const maxScore = Math.max(...data.gameState.players.map((p: { score: number }) => p.score))
            const leader = data.gameState.players.find((p: { score: number }) => p.score === maxScore)
            if (leader && banker.score < maxScore) {
              setLastBankedLeaderInfo({ leader: leader.nickname, deficit: maxScore - banker.score })
            } else {
              setLastBankedLeaderInfo(null) // Banker is the leader
            }
          }

          setShowBankOverlay(true)
          setTimeout(() => setShowBankOverlay(false), 2500) // Slightly longer for more info
          // Play bank sound for other players' banks
          soundManager.play('bank')
        }

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

              // Play danger sound when entering risky phase (roll #4)
              if (data.gameState.rollCountThisRound === 3) {
                soundManager.play('danger')
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

  // Reset isRolling when round changes and scroll to bank panel on mobile
  useEffect(() => {
    if (gameState && gameState.roundNumber !== currentRound) {
      setIsRolling(false)
      setCurrentRound(gameState.roundNumber)

      // Auto-scroll to bank panel on round start (mobile only)
      if (typeof window !== 'undefined' && window.innerWidth < 640 && bankPanelRef.current) {
        setTimeout(() => {
          bankPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 500) // Small delay to let round winner card disappear
      }
    }
  }, [gameState, currentRound])

  // Detect when it becomes current player's turn and show popup
  // Delay popup until banking window ends so it appears when they can actually roll
  const BANKING_WINDOW_MS = 7000 // Must match lib/gameLogic.ts
  useEffect(() => {
    if (!gameState || gameState.phase !== 'inRound') return

    const currentPlayerNickname = localStorage.getItem('nickname') || ''
    const currentPlayerGameId = gameState.players.find(p => p.nickname === currentPlayerNickname)?.id
    const isNowRoller = gameState.players.find(p => p.id === currentPlayerGameId)?.isCurrentRoller || false
    const currentRollerId = gameState.players.find(p => p.isCurrentRoller)?.id || null

    // Check if roller changed and it's now this player's turn
    if (isNowRoller && currentRollerId !== prevRollerRef.current && prevRollerRef.current !== null) {
      // Calculate remaining banking window time
      let delayMs = 0
      if (gameState.lastRollAt && gameState.rollCountThisRound > 0) {
        const elapsed = Date.now() - gameState.lastRollAt
        delayMs = Math.max(0, BANKING_WINDOW_MS - elapsed)
      }

      // Show popup when banking window ends (when they can actually roll)
      setTimeout(() => {
        setShowTurnPopup(true)
        setTimeout(() => setShowTurnPopup(false), 2500)
      }, delayMs)
    }

    prevRollerRef.current = currentRollerId
  }, [gameState])


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

  const handleRoundsChange = async (rounds: number) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: localStorage.getItem('playerId'),
          totalRounds: rounds,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update settings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
    }
  }

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinNickname.trim()) return

    setIsJoining(true)
    setJoinError('')

    try {
      // Generate player ID if not exists
      let currentPlayerId = localStorage.getItem('playerId')
      if (!currentPlayerId) {
        currentPlayerId = 'player-' + Math.random().toString(36).substring(2, 15)
        localStorage.setItem('playerId', currentPlayerId)
      }

      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayerId,
          nickname: joinNickname.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room')
      }

      // Save nickname, room ID, and mark as joined
      localStorage.setItem('nickname', joinNickname.trim())
      localStorage.setItem('activeRoomId', roomId)
      setNeedsToJoin(false)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join room')
    } finally {
      setIsJoining(false)
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
        // Silently ignore banking window errors - UI should prevent this
        if (data.error === 'Banking window still active') {
          return
        }
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

        // Play danger sound when entering risky phase (roll #4)
        if (data.gameState.rollCountThisRound === 3) {
          playSound('danger')
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

  const handleShare = async () => {
    const url = `${window.location.origin}/room/${roomId}`
    try {
      await navigator.clipboard.writeText(url)
      setShowCopiedOverlay(true)
      setTimeout(() => setShowCopiedOverlay(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setShowCopiedOverlay(true)
      setTimeout(() => setShowCopiedOverlay(false), 2000)
    }
  }

  const handlePlayAgain = async () => {
    // Stop victory music immediately
    soundManager.stop('victory')

    const currentPlayerId = localStorage.getItem('playerId') || ''
    const currentNickname = localStorage.getItem('nickname') || ''

    if (!currentPlayerId || !currentNickname) {
      setError('Player info not found. Please refresh the page.')
      return
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId, nickname: currentNickname }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to restart')
      }

      // Reset victory played ref so it can play again next game
      victoryPlayedRef.current = false
      setError('')
      // Polling will automatically detect the restart and show lobby
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restart game')
    }
  }

  // Determine if game is finished (for victory sound hook - must be before early returns)
  const isGameFinished = gameState?.phase === 'finished'

  // Play victory sound when game finishes, stop when game restarts
  useEffect(() => {
    if (isGameFinished && !victoryPlayedRef.current) {
      victoryPlayedRef.current = true
      soundManager.play('victory')
    } else if (!isGameFinished && victoryPlayedRef.current) {
      // Game was restarted (by any player) - stop victory music
      soundManager.stop('victory')
      victoryPlayedRef.current = false
    }
  }, [isGameFinished])

  // Auto-scroll to game stats after game ends (mobile only)
  useEffect(() => {
    if (isGameFinished && !gameFinishedScrolledRef.current) {
      gameFinishedScrolledRef.current = true
      // Delay scroll to let confetti play and user see winner
      if (typeof window !== 'undefined' && window.innerWidth < 640 && gameStatsRef.current) {
        setTimeout(() => {
          gameStatsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 3000)
      }
    } else if (!isGameFinished) {
      gameFinishedScrolledRef.current = false
    }
  }, [isGameFinished])

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

    // Show join form if player needs to join
    if (needsToJoin) {
      return (
        <div className="min-h-screen p-4 md:p-6 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-[#141414] border border-white/10 rounded-lg p-8 backdrop-blur-sm">
              <h2 className="text-3xl font-bold mb-2 text-center">Join Game</h2>
              <div className="text-center mb-6">
                <span className="text-gray-400">Room Code: </span>
                <span className="text-2xl font-bold text-brand-lime">{roomId.toUpperCase()}</span>
              </div>

              {joinError && (
                <div className="mb-4 rounded-lg bg-bust-red/20 border border-bust-red px-4 py-3 text-sm text-bust-red">
                  {joinError}
                </div>
              )}

              <form onSubmit={handleJoinGame} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300" htmlFor="nickname-join">
                    Your Nickname
                  </label>
                  <input
                    className="rounded-lg border-2 border-gray-600 bg-gray-900 px-4 py-3 text-white transition-colors focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal"
                    id="nickname-join"
                    name="nickname"
                    placeholder="Enter your name"
                    type="text"
                    value={joinNickname}
                    onChange={(e) => setJoinNickname(e.target.value)}
                    maxLength={20}
                    disabled={isJoining}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isJoining || !joinNickname.trim()}
                  className="w-full py-4 bg-brand-teal text-white font-bold rounded-lg text-lg hover:bg-brand-teal/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? 'Joining...' : 'Join Game'}
                </button>
              </form>

              <div className="mt-6 text-center text-gray-400 text-sm">
                {gameState?.players.length || 0} player(s) waiting
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen p-4 md:p-6">
        {/* Link Copied Overlay */}
        {showCopiedOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-brand-purple/90 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bank-flash">
              <div className="text-3xl font-bold text-center">
                📋 Link copied to clipboard!
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          {/* Game Code at Top - More Visible */}
          <div className="bg-gradient-to-r from-brand-purple/20 via-brand-teal/20 to-brand-lime/20 border-2 border-brand-lime rounded-lg p-6 mb-6 backdrop-blur-sm">
            <div className="text-center">
              <span className="text-sm text-gray-400 uppercase tracking-wider">Game Code</span>
              <div className="mt-2 flex justify-center items-center gap-2">
                <span className="text-5xl font-bold text-brand-lime tracking-widest">{roomId.toUpperCase()}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomId.toUpperCase())
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Copy code"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleShare}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-brand-teal text-white rounded-full font-medium hover:bg-brand-teal/80 transition-all"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Game
              </button>

              {/* Status message and Start button */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="text-gray-400 mb-4">
                  {playerCount < 2 ? (
                    <p>Waiting for at least 2 players to start...</p>
                  ) : isHost ? (
                    <p>Ready to start!</p>
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
            </div>
          </div>

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

            {/* Game Settings - Rounds */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider">Game Settings</h3>
              {isHost ? (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300">Rounds</span>
                    <span className="text-2xl font-bold text-brand-lime">{gameState.totalRounds}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 15, 30].map((rounds) => (
                      <button
                        key={rounds}
                        onClick={() => handleRoundsChange(rounds)}
                        className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                          gameState.totalRounds === rounds
                            ? 'bg-brand-lime text-black'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {rounds}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        const custom = prompt('Enter number of rounds (3-50):', String(gameState.totalRounds))
                        if (custom) {
                          const num = parseInt(custom)
                          if (num >= 3 && num <= 50) {
                            handleRoundsChange(num)
                          }
                        }
                      }}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        ![5, 15, 30].includes(gameState.totalRounds)
                          ? 'bg-brand-lime text-black'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-gray-300">Rounds</span>
                  <span className="text-2xl font-bold text-brand-lime">{gameState.totalRounds}</span>
                </div>
              )}
            </div>

            {/* Lobby Music Toggle */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider">Music</h3>
              <button
                onClick={handleToggleLobbyMusic}
                className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  lobbyMusicStarted
                    ? 'bg-brand-teal text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {lobbyMusicStarted ? (
                  <>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                    Music On
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Music Off
                  </>
                )}
              </button>
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
  const isRoundWinnerPhase = gameState.phase === 'roundWinner'
  const backgroundClass = isBustPhase
    ? 'bg-gradient-to-b from-red-900/50 via-red-950/30 to-background-dark'
    : isRiskyPhase
    ? 'bg-gradient-to-b from-red-950/30 via-background-dark to-background-dark'
    : 'bg-background-dark'

  const maxScore = Math.max(...gameState.players.map(p => p.score))
  const winners = gameState.players.filter(p => p.score === maxScore)
  const winnerText = winners.length > 1
    ? `${winners.map(w => w.nickname).join(' & ')} (Tie!)`
    : winners[0]?.nickname || ''

  // Round winner calculation
  const roundWinnerPoints = Math.max(...gameState.players.map(p => p.pointsEarnedThisRound))
  const roundWinners = gameState.players.filter(p => p.pointsEarnedThisRound === roundWinnerPoints)
  const roundWinnerText = roundWinnerPoints === 0
    ? ''
    : roundWinners.length > 1
      ? `${roundWinners.map(w => w.nickname).join(' & ')}`
      : roundWinners[0]?.nickname || ''

  // Count banked players
  const bankedCount = gameState.players.filter(p => p.hasBankedThisRound).length

  // Get turn order for up-next display
  const currentRollerIndex = gameState.players.findIndex(p => p.isCurrentRoller)
  const turnOrder = currentRollerIndex >= 0
    ? [...gameState.players.slice(currentRollerIndex), ...gameState.players.slice(0, currentRollerIndex)]
        .filter(p => !p.hasBankedThisRound)
    : gameState.players.filter(p => !p.hasBankedThisRound)

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-colors duration-1000 ${backgroundClass}`}>
      {error && (
        <div className="max-w-7xl mx-auto mb-4 rounded-lg bg-bust-red/20 border border-bust-red px-4 py-3 text-sm text-bust-red">
          {error}
        </div>
      )}

      {/* Banking Overlay */}
      {showBankOverlay && lastBanker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-brand-teal/90 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-2xl shadow-2xl animate-bank-flash max-w-[90vw]">
            <div className="text-2xl sm:text-3xl font-bold text-center mb-2">
              💰 {lastBanker} banked!
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-center text-brand-lime">
              +{lastBankedAmount} points
            </div>
            {lastBankedLeaderInfo && (
              <div className="text-sm sm:text-base text-center mt-2 text-white/80">
                {lastBankedLeaderInfo.deficit} behind {lastBankedLeaderInfo.leader}
              </div>
            )}
            {!lastBankedLeaderInfo && lastBankedAmount > 0 && (
              <div className="text-sm sm:text-base text-center mt-2 text-yellow-300 font-medium">
                Now in the lead!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Copied Overlay */}
      {showCopiedOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-brand-purple/90 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bank-flash">
            <div className="text-3xl font-bold text-center">
              📋 Link copied to clipboard!
            </div>
          </div>
        </div>
      )}

      {/* It's Your Turn Popup */}
      {showTurnPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-brand-purple/95 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-2xl shadow-2xl animate-bank-flash">
            <div className="text-2xl sm:text-3xl font-bold text-center mb-1">
              🎲 Your Turn!
            </div>
            <div className="text-sm sm:text-base text-center text-white/80">
              Roll the dice
            </div>
          </div>
        </div>
      )}

      {/* Confetti for winner */}
      {isGameFinished && <Confetti />}

      {/* Main Game Layout */}
      <div className="max-w-7xl mx-auto">
        {/* Winner Announcement */}
        {isGameFinished && (
          <>
            {/* Install App Banner - show at game end for good conversion */}
            {canInstall && (
              <div className="mb-6">
                <button
                  onClick={promptInstall}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-teal/20 border-2 border-brand-teal rounded-lg text-brand-teal font-bold text-lg hover:bg-brand-teal/30 transition-all"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Love Bank It? Install the App!
                </button>
              </div>
            )}

            {/* iOS Install Instructions */}
            {showIOSInstructions && (
              <div className="mb-6">
                <div className="relative flex items-center gap-3 px-6 py-4 bg-brand-teal/10 border border-brand-teal/50 rounded-lg text-gray-300">
                  <svg className="h-5 w-5 flex-shrink-0 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-sm">
                    Love Bank It? Install it! Tap <span className="inline-flex items-center"><svg className="h-4 w-4 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg> Share</span> then <strong>&quot;Add to Home Screen&quot;</strong>
                  </span>
                  <button
                    onClick={dismissIOSInstructions}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-300"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <div className="mb-6 bg-gradient-to-r from-brand-lime/20 via-brand-teal/20 to-brand-purple/20 border-2 border-brand-lime rounded-lg shadow-2xl p-8 text-center backdrop-blur-sm animate-winner-glow">
              <div className="text-6xl mb-4">🏆</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Winner is:</div>
              <div className="text-5xl font-bold text-brand-lime mb-2">{winnerText}</div>
              <div className="text-2xl text-gray-300 mb-6">Final Score: {maxScore}</div>
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={handlePlayAgain}
                  className="px-8 py-3 bg-brand-lime text-black font-bold rounded-full text-lg hover:bg-brand-lime/90 transition-all hover:scale-105"
                >
                  Play Again
                </button>
                <button
                  onClick={() => {
                    soundManager.stop('victory')
                    window.location.href = '/'
                  }}
                  className="px-8 py-3 bg-gray-700 text-white font-bold rounded-full text-lg hover:bg-gray-600 transition-all hover:scale-105"
                >
                  New Room
                </button>
              </div>
            </div>

            {/* Game Awards */}
            <div ref={gameStatsRef} className="mb-6">
              <GameStats gameState={gameState} />
            </div>
          </>
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
            <div className="text-gray-400 mt-4 text-sm">Round winner coming up...</div>
          </div>
        )}

        {/* Round Winner Announcement */}
        {isRoundWinnerPhase && (
          <div className="mb-6 bg-gradient-to-r from-yellow-900/30 via-yellow-800/20 to-yellow-900/30 border-2 border-yellow-500 rounded-lg shadow-2xl p-4 sm:p-8 text-center backdrop-blur-sm animate-slide-in">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">{roundWinnerPoints === 0 ? '😅' : '🎯'}</div>
            <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider mb-2">Round {gameState.roundNumber}</div>
            {roundWinnerPoints === 0 ? (
              <div className="text-2xl sm:text-4xl font-bold text-yellow-500 mb-2">Nobody won this round!</div>
            ) : (
              <>
                <div className="text-3xl sm:text-5xl font-bold text-yellow-500 mb-2">{roundWinnerText}</div>
                <div className="text-lg sm:text-xl text-gray-300">
                  Earned <span className="font-bold text-yellow-500">{roundWinnerPoints}</span> points this round!
                </div>
              </>
            )}

            {/* Compact Leaderboard */}
            <div className="mt-4 pt-4 border-t border-yellow-500/30">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Standings</div>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {[...gameState.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => {
                    const isLeader = index === 0
                    return (
                      <div
                        key={player.id}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          isLeader
                            ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-400'
                            : 'bg-gray-800/50 border border-gray-700 text-gray-300'
                        }`}
                      >
                        <span className="font-medium">{player.nickname}</span>
                        <span className="ml-2 font-bold">{player.score}</span>
                      </div>
                    )
                  })}
              </div>
            </div>

            <div className="text-gray-400 mt-4 text-xs sm:text-sm">Next round starting soon...</div>
          </div>
        )}

        {/* Bank Panel */}
        <div ref={bankPanelRef} className="mb-6 scroll-mt-4">
          <BankPanel
            gameState={gameState}
            lastRoll={gameState.lastRoll}
            showEffect={!isRolling && !!gameState.lastRoll}
            onBank={handleBank}
            canBank={!hasBanked && !isRolling && !isBustPhase && !isRoundWinnerPhase && gameState.bankValue > 0}
            isRiskyPhase={isRiskyPhase}
            bankedCount={bankedCount}
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
              isBustPhase={isBustPhase || isRoundWinnerPhase}
              currentRollerName={gameState.players.find(p => p.isCurrentRoller)?.nickname || ''}
              turnOrder={turnOrder}
              lastRollAt={gameState.lastRollAt}
              rollCountThisRound={gameState.rollCountThisRound}
              playerId={currentPlayerGameId}
              leadingScore={Math.max(...gameState.players.map(p => p.score))}
              onRoll={handleRoll}
            />
          </div>

          {/* Players Panel - Takes 1 column on large screens */}
          <div className="lg:col-span-1">
            <PlayersPanel players={gameState.players} showLeaderboard={true} currentPlayerNickname={currentPlayerNickname} />
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
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-brand-teal/20 text-brand-teal rounded-lg hover:bg-brand-teal/30 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
