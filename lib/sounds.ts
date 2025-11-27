'use client'

// Simplified sound system - single theme with all the best sounds
interface ThemeSounds {
  roll: string
  bank: string
  bust: string[]  // Array for random selection
  doubles: string
  lucky7: string
  gameOver: string
  danger: string
  lobbyMusic: string
  victory: string
}

// Free sound URLs from various royalty-free sources
const SHARED_ROLL = 'https://soundbible.com/grab.php?id=182&type=mp3'
const SHARED_VICTORY = '/sounds/victory.mp3'
const LOBBY_MUSIC = '/sounds/lobby.mp3' // User-provided Udio track

// All unique bust sounds consolidated for random selection
const ALL_BUST_SOUNDS = [
  'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3', // Negative fail
  'https://assets.mixkit.co/active_storage/sfx/470/470-preview.mp3',   // Sad trombone
  'https://assets.mixkit.co/active_storage/sfx/2953/2953-preview.mp3', // Wrong answer
  'https://assets.mixkit.co/active_storage/sfx/2954/2954-preview.mp3', // Failure
]

const SOUNDS: ThemeSounds = {
  roll: SHARED_ROLL,
  bank: 'https://soundbible.com/grab.php?id=333&type=mp3',
  bust: ALL_BUST_SOUNDS,
  doubles: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  lucky7: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  gameOver: 'https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3',
  danger: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  lobbyMusic: LOBBY_MUSIC,
  victory: SHARED_VICTORY,
}

// Keep type export for backward compatibility but it's no longer used
export type SoundTheme = 'classic'

export type SoundEffect = 'roll' | 'bank' | 'bust' | 'doubles' | 'lucky7' | 'gameOver' | 'danger' | 'lobbyMusic' | 'victory'

// Audio element pool for playing multiple sounds simultaneously
// Using HTMLAudioElement instead of Web Audio API because:
// 1. HTMLAudioElement can play cross-origin audio without CORS headers
// 2. Creating new Audio elements each time works on iOS (unlike cloneNode)
const audioPool: Map<string, HTMLAudioElement[]> = new Map()

// Get or create an available audio element for a URL
function getAudioElement(url: string, volume: number): HTMLAudioElement {
  // Get existing pool for this URL or create new one
  let pool = audioPool.get(url)
  if (!pool) {
    pool = []
    audioPool.set(url, pool)
  }

  // Find an available (not playing) element
  for (const audio of pool) {
    if (audio.paused || audio.ended) {
      audio.currentTime = 0
      audio.volume = volume
      return audio
    }
  }

  // Create new element if none available (limit pool size)
  if (pool.length < 5) {
    const audio = new Audio(url)
    audio.volume = volume
    pool.push(audio)
    return audio
  }

  // Reuse oldest if pool is full
  const audio = pool[0]
  audio.currentTime = 0
  audio.volume = volume
  return audio
}

// Play a sound using HTMLAudioElement
function playAudioElement(url: string, volume: number): void {
  if (typeof window === 'undefined') return

  try {
    const audio = getAudioElement(url, volume)
    audio.play().catch(() => {
      // Ignore autoplay failures - usually due to no user interaction yet
    })
  } catch (e) {
    // Ignore errors
  }
}

// Sound manager class (simplified - no theme selection)
class SoundManager {
  private enabled: boolean = true
  private volume: number = 0.5
  private lobbyAudio: HTMLAudioElement | null = null
  private initialized: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundEnabled')
      this.enabled = saved !== 'false'
      const savedVol = localStorage.getItem('soundVolume')
      if (savedVol) this.volume = parseFloat(savedVol)
    }
  }

  // Call this on first user interaction to unlock audio on iOS
  unlock(): void {
    if (this.initialized) return
    this.initialized = true

    // Pre-load common sounds by creating Audio elements
    getAudioElement(SOUNDS.roll, this.volume)
    getAudioElement(SOUNDS.bank, this.volume)
    getAudioElement(SOUNDS.doubles, this.volume)
  }

  play(effect: SoundEffect): void {
    if (!this.enabled) return
    if (typeof window === 'undefined') return

    // Ensure audio is unlocked
    this.unlock()

    try {
      let url: string

      if (effect === 'bust') {
        // Random bust sound from array
        url = SOUNDS.bust[Math.floor(Math.random() * SOUNDS.bust.length)]
      } else {
        url = SOUNDS[effect]
      }

      if (!url) return

      // Play using HTMLAudioElement
      playAudioElement(url, this.volume)
    } catch (e) {
      // Ignore errors
    }
  }

  stop(effect: SoundEffect): void {
    if (typeof window === 'undefined') return

    try {
      let url: string

      if (effect === 'bust') {
        // Stop all bust sounds
        SOUNDS.bust.forEach(bustUrl => {
          const pool = audioPool.get(bustUrl)
          if (pool) {
            pool.forEach(audio => {
              audio.pause()
              audio.currentTime = 0
            })
          }
        })
        return
      } else {
        url = SOUNDS[effect]
      }

      if (!url) return

      // Stop all audio elements for this URL
      const pool = audioPool.get(url)
      if (pool) {
        pool.forEach(audio => {
          audio.pause()
          audio.currentTime = 0
        })
      }
    } catch (e) {
      // Ignore errors
    }
  }

  startLobbyMusic(): Promise<boolean> {
    if (!this.enabled) return Promise.resolve(false)
    if (typeof window === 'undefined') return Promise.resolve(false)

    // Ensure audio is unlocked
    this.unlock()

    try {
      const url = SOUNDS.lobbyMusic
      if (!url) return Promise.resolve(false)

      if (this.lobbyAudio) {
        this.stopLobbyMusic()
      }

      this.lobbyAudio = new Audio(url)
      this.lobbyAudio.volume = this.volume * 0.3 // Quieter for background
      this.lobbyAudio.loop = true

      // For iOS, we need to handle the play promise
      return this.lobbyAudio.play()
        .then(() => true)
        .catch(() => false)
    } catch (e) {
      return Promise.resolve(false)
    }
  }

  stopLobbyMusic(): void {
    if (this.lobbyAudio) {
      this.lobbyAudio.pause()
      this.lobbyAudio.currentTime = 0
      this.lobbyAudio = null
    }
  }

  toggle(): boolean {
    this.enabled = !this.enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', String(this.enabled))
    }
    if (!this.enabled) {
      this.stopLobbyMusic()
    }
    return this.enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundVolume', String(this.volume))
    }
    if (this.lobbyAudio) {
      this.lobbyAudio.volume = this.volume * 0.3
    }
  }

  getVolume(): number {
    return this.volume
  }

  // Keep these methods for backward compatibility but they're no-ops now
  setTheme(_theme: SoundTheme): void {
    // No-op - single theme only
  }

  getTheme(): SoundTheme {
    return 'classic'
  }

  getAvailableThemes(): SoundTheme[] {
    return ['classic']
  }
}

// Singleton instance
export const soundManager = new SoundManager()

// Legacy exports for compatibility
export function preloadSounds(): void {
  soundManager.unlock()
}

export function playSound(effect: SoundEffect, volume: number = 0.5): void {
  soundManager.play(effect)
}
