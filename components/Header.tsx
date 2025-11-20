'use client'

import { useState } from 'react'
import HowToPlayModal from './HowToPlayModal'

export default function Header() {
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  return (
    <>
      <header className="flex items-center justify-between px-4 py-4 sm:px-10 whitespace-nowrap">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="text-brand-lime size-6 sm:size-8 flex-shrink-0">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-brand-lime" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"></path>
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tighter">Bank It</h2>
        </div>
        <div className="flex items-center gap-4 sm:gap-9 flex-shrink-0">
          <button
            onClick={() => setShowHowToPlay(true)}
            className="text-xs sm:text-sm font-medium leading-normal text-gray-300 transition-colors hover:text-brand-lime"
          >
            How to Play
          </button>
        </div>
      </header>

      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </>
  )
}
