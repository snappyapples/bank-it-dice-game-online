'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CreateGameModalProps {
  isOpen: boolean
  onClose: () => void
}

type RoundPreset = 'short' | 'medium' | 'long' | 'custom'

const ROUND_PRESETS: Record<RoundPreset, { label: string; rounds: number | null }> = {
  short: { label: 'Short', rounds: 5 },
  medium: { label: 'Medium', rounds: 20 },
  long: { label: 'Long', rounds: 40 },
  custom: { label: 'Custom', rounds: null },
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
  const [selectedPreset, setSelectedPreset] = useState<RoundPreset>('short')
  const [customRounds, setCustomRounds] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Load saved nickname from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedNickname = localStorage.getItem('nickname')
      if (savedNickname) {
        setNickname(savedNickname)
      }
    }
  }, [isOpen])

  const getRounds = () => {
    if (selectedPreset === 'custom') {
      return customRounds
    }
    return ROUND_PRESETS[selectedPreset].rounds!
  }

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
          totalRounds: getRounds(),
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

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-300">
              Game Length
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(ROUND_PRESETS) as RoundPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  className={`py-3 px-2 rounded-lg font-medium text-sm transition-all ${
                    selectedPreset === preset
                      ? 'bg-brand-lime text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div>{ROUND_PRESETS[preset].label}</div>
                  {preset !== 'custom' && (
                    <div className="text-xs opacity-70">{ROUND_PRESETS[preset].rounds} rounds</div>
                  )}
                </button>
              ))}
            </div>

            {selectedPreset === 'custom' && (
              <div className="mt-2">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="3"
                    max="50"
                    value={customRounds}
                    onChange={(e) => setCustomRounds(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-lime"
                  />
                  <div className="w-16 text-center">
                    <span className="text-2xl font-bold text-brand-lime">{customRounds}</span>
                    <span className="text-xs text-gray-400 block">rounds</span>
                  </div>
                </div>
              </div>
            )}
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
