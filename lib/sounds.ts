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

// Cache for audio elements
const audioCache: Map<string, HTMLAudioElement> = new Map()

// Sound manager class with theme support
class SoundManager {
  private enabled: boolean = true
  private volume: number = 0.5
  private theme: SoundTheme = 'classic'
  private lobbyAudio: HTMLAudioElement | null = null

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

  play(effect: SoundEffect): void {
    if (!this.enabled) return
    if (typeof window === 'undefined') return

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

      // Get or create cached audio
      const cacheKey = `${this.theme}-${effect}-${url}`
      let audio = audioCache.get(cacheKey)

      if (!audio) {
        audio = new Audio(url)
        audioCache.set(cacheKey, audio)
      }

      // Clone for overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement
      clone.volume = this.volume
      clone.play().catch(() => {})
    } catch (e) {
      // Ignore errors
    }
  }

  startLobbyMusic(): Promise<boolean> {
    if (!this.enabled) return Promise.resolve(false)
    if (typeof window === 'undefined') return Promise.resolve(false)

    try {
      const url = SOUND_THEMES[this.theme].lobbyMusic
      if (!url) return Promise.resolve(false)

      if (this.lobbyAudio) {
        this.stopLobbyMusic()
      }

      this.lobbyAudio = new Audio(url)
      this.lobbyAudio.volume = this.volume * 0.3 // Quieter for background
      this.lobbyAudio.loop = true
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
      // Lobby music continues playing - no restart needed since all themes use same music
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
  // No longer needed with on-demand loading
}

export function playSound(effect: SoundEffect, volume: number = 0.5): void {
  soundManager.play(effect)
}
