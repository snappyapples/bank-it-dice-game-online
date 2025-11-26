'use client'

// Sound themes with different sound sets
export type SoundTheme = 'classic' | 'arcade' | 'casino' | 'silly'

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
// Shared sounds used across all themes
const SHARED_ROLL = 'https://soundbible.com/grab.php?id=182&type=mp3'
const SHARED_VICTORY = '/sounds/victory.mp3' // Awards ceremony winner music

const SOUND_THEMES: Record<SoundTheme, ThemeSounds> = {
  classic: {
    roll: SHARED_ROLL,
    bank: 'https://soundbible.com/grab.php?id=333&type=mp3',
    bust: [
      'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3', // Negative fail
    ],
    doubles: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    lucky7: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
    gameOver: 'https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3', // Sad game over
    danger: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    lobbyMusic: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
    victory: SHARED_VICTORY,
  },
  arcade: {
    roll: SHARED_ROLL,
    bank: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Coin collect
    bust: [
      'https://assets.mixkit.co/active_storage/sfx/2953/2953-preview.mp3', // Wrong answer
      'https://assets.mixkit.co/active_storage/sfx/2954/2954-preview.mp3', // Failure
    ],
    doubles: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3', // Power up
    lucky7: 'https://assets.mixkit.co/active_storage/sfx/2021/2021-preview.mp3', // Achievement
    gameOver: 'https://assets.mixkit.co/active_storage/sfx/1432/1432-preview.mp3', // Fanfare
    danger: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3', // Alert
    lobbyMusic: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
    victory: SHARED_VICTORY,
  },
  casino: {
    roll: SHARED_ROLL,
    bank: 'https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3', // Slot machine
    bust: [
      'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
      'https://assets.mixkit.co/active_storage/sfx/470/470-preview.mp3', // Sad trombone
    ],
    doubles: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3', // Jackpot
    lucky7: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
    gameOver: 'https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3', // Sad game over
    danger: 'https://assets.mixkit.co/active_storage/sfx/104/104-preview.mp3', // Tension
    lobbyMusic: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
    victory: SHARED_VICTORY,
  },
  silly: {
    roll: SHARED_ROLL,
    bank: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    bust: [
      'https://assets.mixkit.co/active_storage/sfx/470/470-preview.mp3', // Sad trombone
      'https://assets.mixkit.co/active_storage/sfx/2953/2953-preview.mp3', // Wrong
      'https://assets.mixkit.co/active_storage/sfx/2954/2954-preview.mp3', // Failure
    ],
    doubles: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
    lucky7: 'https://assets.mixkit.co/active_storage/sfx/2021/2021-preview.mp3',
    gameOver: 'https://assets.mixkit.co/active_storage/sfx/1432/1432-preview.mp3',
    danger: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3',
    lobbyMusic: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
    victory: SHARED_VICTORY,
  },
}

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

// Sound manager class with theme support
class SoundManager {
  private enabled: boolean = true
  private volume: number = 0.5
  private theme: SoundTheme = 'classic'
  private lobbyAudio: HTMLAudioElement | null = null
  private initialized: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundEnabled')
      this.enabled = saved !== 'false'
      const savedVol = localStorage.getItem('soundVolume')
      if (savedVol) this.volume = parseFloat(savedVol)
      const savedTheme = localStorage.getItem('soundTheme') as SoundTheme
      if (savedTheme && SOUND_THEMES[savedTheme]) {
        this.theme = savedTheme
      }
    }
  }

  // Call this on first user interaction to unlock audio on iOS
  unlock(): void {
    if (this.initialized) return
    this.initialized = true

    // Pre-load common sounds by creating Audio elements
    const themeSounds = SOUND_THEMES[this.theme]
    getAudioElement(themeSounds.roll, this.volume)
    getAudioElement(themeSounds.bank, this.volume)
    getAudioElement(themeSounds.doubles, this.volume)
  }

  play(effect: SoundEffect): void {
    if (!this.enabled) return
    if (typeof window === 'undefined') return

    // Ensure audio is unlocked
    this.unlock()

    try {
      const themeSounds = SOUND_THEMES[this.theme]
      let url: string

      if (effect === 'bust') {
        // Random bust sound from array
        const bustSounds = themeSounds.bust
        url = bustSounds[Math.floor(Math.random() * bustSounds.length)]
      } else {
        url = themeSounds[effect]
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
      const themeSounds = SOUND_THEMES[this.theme]
      let url: string

      if (effect === 'bust') {
        // Stop all bust sounds
        themeSounds.bust.forEach(bustUrl => {
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
        url = themeSounds[effect]
      }

      if (!url) {
        console.log('[SoundManager] stop: no URL for effect', effect)
        return
      }

      console.log('[SoundManager] stop: stopping', effect, 'url:', url)

      // Stop all audio elements for this URL
      const pool = audioPool.get(url)
      console.log('[SoundManager] stop: pool found:', !!pool, 'size:', pool?.length)
      if (pool) {
        pool.forEach(audio => {
          console.log('[SoundManager] stop: pausing audio, paused:', audio.paused)
          audio.pause()
          audio.currentTime = 0
        })
      }
    } catch (e) {
      console.error('[SoundManager] stop error:', e)
    }
  }

  startLobbyMusic(): Promise<boolean> {
    if (!this.enabled) return Promise.resolve(false)
    if (typeof window === 'undefined') return Promise.resolve(false)

    // Ensure audio is unlocked
    this.unlock()

    try {
      const url = SOUND_THEMES[this.theme].lobbyMusic
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

  setTheme(theme: SoundTheme): void {
    if (SOUND_THEMES[theme]) {
      this.theme = theme
      if (typeof window !== 'undefined') {
        localStorage.setItem('soundTheme', theme)
      }
      // Clear audio pool when theme changes to load new sounds
      audioPool.clear()
    }
  }

  getTheme(): SoundTheme {
    return this.theme
  }

  getAvailableThemes(): SoundTheme[] {
    return Object.keys(SOUND_THEMES) as SoundTheme[]
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
