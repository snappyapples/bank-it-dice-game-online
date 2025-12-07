'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface JoinGameModalProps {
  isOpen: boolean
  onClose: () => void
  initialRoomCode?: string
}

// Generate a unique player ID and store in localStorage
function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return ''

  let playerId = localStorage.getItem('playerId')
  if (!playerId) {
    playerId = 'player-' + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('playerId', playerId)
  }
  return playerId
}

export default function JoinGameModal({ isOpen, onClose, initialRoomCode = '' }: JoinGameModalProps) {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState(initialRoomCode)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Load saved nickname from localStorage and set initial room code
  useEffect(() => {
    if (isOpen) {
      const savedNickname = localStorage.getItem('nickname')
      if (savedNickname) {
        setNickname(savedNickname)
      }
      if (initialRoomCode) {
        setRoomCode(initialRoomCode.toUpperCase())
      }
    }
  }, [isOpen, initialRoomCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !roomCode.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const playerId = getOrCreatePlayerId()
      const response = await fetch(`/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          nickname: nickname.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room')
      }

      // Store nickname and room ID in localStorage
      localStorage.setItem('nickname', nickname.trim())
      localStorage.setItem('activeRoomId', roomCode.toUpperCase())

      router.push(`/room/${roomCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room')
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-lg bg-[#141414] border border-white/10 p-8 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between">
          <h2 className="text-3xl font-bold text-white">Join a Game</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="rounded-lg bg-bust-red/20 border border-bust-red px-4 py-3 text-sm text-bust-red">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300" htmlFor="nickname-join">
              Your Nickname
            </label>
            <input
              className="rounded-lg border-2 border-gray-600 bg-gray-900 px-4 py-3 text-white transition-colors focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal"
              id="nickname-join"
              name="nickname"
              placeholder="e.g. DiceRoller"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300" htmlFor="room-code">
              Room Code
            </label>
            <input
              className="rounded-lg border-2 border-gray-600 bg-gray-900 px-4 py-3 text-center text-lg font-bold uppercase tracking-wider text-white transition-colors focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal"
              id="room-code"
              name="roomCode"
              placeholder="ENTER CODE"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={12}
              disabled={isLoading}
            />
          </div>

          <button
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-teal text-lg font-bold tracking-wide text-white shadow-lg shadow-brand-teal/20 transition-all duration-300 hover:scale-105 hover:bg-brand-teal/90 hover:shadow-brand-teal/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Game'}
            {!isLoading && (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
