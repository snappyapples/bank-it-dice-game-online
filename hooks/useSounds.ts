'use client'

import { useEffect, useCallback, useState } from 'react'
import { soundManager, preloadSounds, SoundEffect } from '@/lib/sounds'

export function useSounds() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    // Preload sounds on mount
    preloadSounds()
    setEnabled(soundManager.isEnabled())
  }, [])

  const play = useCallback((effect: SoundEffect) => {
    soundManager.play(effect)
  }, [])

  const toggle = useCallback(() => {
    const newState = soundManager.toggle()
    setEnabled(newState)
    return newState
  }, [])

  return {
    play,
    toggle,
    enabled,
  }
}
