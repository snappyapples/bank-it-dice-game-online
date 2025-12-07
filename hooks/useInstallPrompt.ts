'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Detect iOS Safari (only browser that can install PWAs on iOS)
function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  // Chrome/Firefox on iOS still report Safari in UA, but also report CriOS/FxiOS
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
  return isIOS && isSafari
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if already installed as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true

    if (isStandalone) {
      // Already installed, don't show install button
      return
    }

    // Check if iOS Safari - show manual instructions
    if (isIOSSafari()) {
      setShowIOSInstructions(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Also listen for successful install
    const handleAppInstalled = () => {
      setCanInstall(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setCanInstall(false)
    }

    // Clear the deferred prompt - it can only be used once
    setDeferredPrompt(null)
  }, [deferredPrompt])

  // Dismiss iOS instructions (user can hide it)
  const dismissIOSInstructions = useCallback(() => {
    setShowIOSInstructions(false)
    // Remember dismissal in localStorage
    localStorage.setItem('iosInstallDismissed', 'true')
  }, [])

  // Check if user previously dismissed iOS instructions
  useEffect(() => {
    if (showIOSInstructions && localStorage.getItem('iosInstallDismissed') === 'true') {
      setShowIOSInstructions(false)
    }
  }, [showIOSInstructions])

  return {
    canInstall,
    showIOSInstructions,
    promptInstall,
    dismissIOSInstructions,
  }
}
