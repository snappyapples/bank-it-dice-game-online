'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CreateGameModalProps {
  isOpen: boolean
  onClose: () => void
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

export default function CreateGameModal({ isOpen, onClose }: CreateGameModalProps) {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [rounds, setRounds] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const playerId = getOrCreatePlayerId()
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          nickname: nickname.trim(),
          totalRounds: rounds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      // Store nickname in localStorage
      localStorage.setItem('nickname', nickname.trim())

      router.push(`/room/${data.roomId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
      setIsLoading(false)
    }
  }

  const incrementRounds = () => setRounds(Math.min(rounds + 1, 20))
  const decrementRounds = () => setRounds(Math.max(rounds - 1, 3))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-lg bg-[#141414] border border-white/10 p-8 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between">
          <h2 className="text-3xl font-bold text-white">Create Your Game</h2>
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
            <label className="text-sm font-medium text-gray-300" htmlFor="nickname-create">
              Your Nickname
            </label>
            <input
              className="rounded-lg border-2 border-gray-600 bg-gray-900 px-4 py-3 text-white transition-colors focus:border-brand-lime focus:outline-none focus:ring-1 focus:ring-brand-lime"
              id="nickname-create"
              name="nickname"
              placeholder="e.g. DiceMaster"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300" htmlFor="rounds">
              Number of Rounds
            </label>
            <div className="relative flex items-center">
              <button
                className="absolute left-0 flex h-full w-12 items-center justify-center rounded-l-lg text-gray-400 transition-colors hover:bg-brand-purple hover:text-white"
                type="button"
                onClick={decrementRounds}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                className="form-input-number w-full rounded-lg border-2 border-gray-600 bg-gray-900 px-4 py-3 text-center text-lg font-bold text-white transition-colors focus:border-brand-lime focus:outline-none focus:ring-1 focus:ring-brand-lime"
                id="rounds"
                name="rounds"
                type="number"
                value={rounds}
                onChange={(e) => setRounds(Math.max(3, Math.min(20, parseInt(e.target.value) || 5)))}
              />
              <button
                className="absolute right-0 flex h-full w-12 items-center justify-center rounded-r-lg text-gray-400 transition-colors hover:bg-brand-purple hover:text-white"
                type="button"
                onClick={incrementRounds}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          <button
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-lime text-lg font-bold tracking-wide text-black shadow-lg shadow-brand-lime/20 transition-all duration-300 hover:scale-105 hover:bg-brand-lime/90 hover:shadow-brand-lime/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Generate & Start'}
            {!isLoading && (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
