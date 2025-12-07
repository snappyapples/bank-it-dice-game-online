'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import HowToPlayModal from './HowToPlayModal'
import { useHeaderContext } from '@/contexts/HeaderContext'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export default function Header() {
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { autoHide } = useHeaderContext()
  const { canInstall, promptInstall } = useInstallPrompt()

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle auto-hide behavior on desktop
  useEffect(() => {
    if (!autoHide || isMobile) {
      setIsVisible(true)
      return
    }

    // Hide header when auto-hide is enabled on desktop
    setIsVisible(false)

    const handleMouseMove = (e: MouseEvent) => {
      // Show header when mouse is within 60px of top
      if (e.clientY <= 60) {
        setIsVisible(true)
      } else if (e.clientY > 100) {
        // Hide when mouse moves past 100px from top
        setIsVisible(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [autoHide, isMobile])

  return (
    <>
      <header
        className={`flex items-center justify-between px-4 py-4 sm:px-10 whitespace-nowrap transition-all duration-300 ${
          autoHide && !isMobile
            ? `fixed top-0 left-0 right-0 z-50 bg-background-dark/95 backdrop-blur-sm ${
                isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
              }`
            : ''
        }`}
      >
        <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 hover:opacity-80 transition-opacity">
          <div className="text-brand-lime size-6 sm:size-8 flex-shrink-0">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-brand-lime" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"></path>
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tighter">Bank It</h2>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <button
            onClick={() => setShowHowToPlay(true)}
            className="text-xs sm:text-sm font-medium leading-normal text-gray-300 transition-colors hover:text-brand-lime"
          >
            How to Play
          </button>
          {canInstall && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-300 transition-colors hover:text-brand-lime"
              title="Install App"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Install</span>
            </button>
          )}
        </div>
      </header>

      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </>
  )
}
