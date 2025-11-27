'use client'

import { useState } from 'react'

// Sound URLs (matching the simplified sound system)
const SOUNDS: Record<string, string | string[]> = {
  roll: 'https://soundbible.com/grab.php?id=182&type=mp3',
  bank: 'https://soundbible.com/grab.php?id=333&type=mp3',
  bust: [
    'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
    'https://assets.mixkit.co/active_storage/sfx/470/470-preview.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2953/2953-preview.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2954/2954-preview.mp3',
  ],
  doubles: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  lucky7: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  gameOver: 'https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3',
  danger: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  lobbyMusic: '/sounds/lobby.mp3',
  victory: '/sounds/victory.mp3',
}

type SoundStatus = 'idle' | 'playing' | 'success' | 'error'

export default function TestSoundsPage() {
  const [statuses, setStatuses] = useState<Record<string, SoundStatus>>({})
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  const playSound = async (url: string, key: string) => {
    // Stop any currently playing sound
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    setStatuses(prev => ({ ...prev, [key]: 'playing' }))

    try {
      const audio = new Audio(url)
      setCurrentAudio(audio)

      audio.onended = () => {
        setStatuses(prev => ({ ...prev, [key]: 'success' }))
      }

      audio.onerror = () => {
        setStatuses(prev => ({ ...prev, [key]: 'error' }))
      }

      await audio.play()
    } catch (err) {
      setStatuses(prev => ({ ...prev, [key]: 'error' }))
    }
  }

  const stopAll = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
    }
  }

  const getStatusColor = (status: SoundStatus) => {
    switch (status) {
      case 'playing': return 'bg-yellow-500'
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-600'
    }
  }

  const getStatusText = (status: SoundStatus) => {
    switch (status) {
      case 'playing': return 'Playing...'
      case 'success': return 'OK'
      case 'error': return 'FAILED'
      default: return 'Click to test'
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Sound Test Page</h1>
          <button
            onClick={stopAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop All
          </button>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-brand-lime">Game Sounds</h2>

          <div className="grid gap-4">
            {Object.entries(SOUNDS).map(([soundName, urlOrUrls]) => {
              const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls]

              return (
                <div key={soundName} className="space-y-2">
                  <div className="text-sm text-gray-400 uppercase tracking-wider">{soundName}</div>
                  <div className="flex flex-wrap gap-2">
                    {urls.map((url, index) => {
                      const key = `${soundName}-${index}`
                      const status = statuses[key] || 'idle'

                      return (
                        <button
                          key={key}
                          onClick={() => playSound(url, key)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${getStatusColor(status)} hover:opacity-80`}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-white">
                              {urls.length > 1 ? `${soundName} ${index + 1}` : soundName}
                            </span>
                            <span className="text-xs opacity-75">{getStatusText(status)}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <div className="text-xs text-gray-500 break-all">
                    {urls.map((url, i) => (
                      <div key={i}>{url}</div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8 bg-[#141414] border border-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-brand-teal">Legend</h2>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
              <span>Not tested</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Playing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Working</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Failed/Broken</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>Note: lobby.mp3 requires you to download from Udio and place in public/sounds/</p>
        </div>
      </div>
    </div>
  )
}
