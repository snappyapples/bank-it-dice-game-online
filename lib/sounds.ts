'use client'

// Sound effect URLs (free sounds from SoundBible and Mixkit)
const SOUND_URLS = {
  roll: 'https://soundbible.com/grab.php?id=182&type=mp3', // Shake and roll dice (SoundBible)
  bank: 'https://soundbible.com/grab.php?id=333&type=mp3', // Cash register cha-ching (SoundBible)
  bust: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3', // Negative / fail
  doubles: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Bonus / win
  lucky7: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // Jackpot / special
  gameOver: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Fanfare / victory
}

export type SoundEffect = keyof typeof SOUND_URLS

// Cache for audio elements
const audioCache: Map<SoundEffect, HTMLAudioElement> = new Map()

// Preload sounds
export function preloadSounds(): void {
  if (typeof window === 'undefined') return

  Object.entries(SOUND_URLS).forEach(([key, url]) => {
    const audio = new Audio(url)
    audio.preload = 'auto'
    audio.volume = 0.5
    audioCache.set(key as SoundEffect, audio)
  })
}

// Play a sound effect
export function playSound(effect: SoundEffect, volume: number = 0.5): void {
  if (typeof window === 'undefined') return

  try {
    // Get cached audio or create new
    let audio = audioCache.get(effect)

    if (!audio) {
      const url = SOUND_URLS[effect]
      if (!url) return
      audio = new Audio(url)
      audioCache.set(effect, audio)
    }

    // Clone the audio to allow overlapping sounds
    const clone = audio.cloneNode() as HTMLAudioElement
    clone.volume = volume
    clone.play().catch(() => {
      // Ignore autoplay errors (user hasn't interacted yet)
    })
  } catch (e) {
    // Ignore errors
  }
}

// Sound manager class for more control
class SoundManager {
  private enabled: boolean = true
  private volume: number = 0.5

  constructor() {
    // Load preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundEnabled')
      this.enabled = saved !== 'false'
      const savedVol = localStorage.getItem('soundVolume')
      if (savedVol) this.volume = parseFloat(savedVol)
    }
  }

  play(effect: SoundEffect): void {
    if (!this.enabled) return
    playSound(effect, this.volume)
  }

  toggle(): boolean {
    this.enabled = !this.enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', String(this.enabled))
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
  }

  getVolume(): number {
    return this.volume
  }
}

// Singleton instance
export const soundManager = new SoundManager()
