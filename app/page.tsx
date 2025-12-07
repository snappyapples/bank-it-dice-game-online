'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import AnimatedDice from '@/components/AnimatedDice'
import CreateGameModal from '@/components/CreateGameModal'
import JoinGameModal from '@/components/JoinGameModal'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { canInstall, promptInstall } = useInstallPrompt()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [initialRoomCode, setInitialRoomCode] = useState('')
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

  // Check for active game in localStorage
  useEffect(() => {
    const roomId = localStorage.getItem('activeRoomId')
    if (roomId) {
      setActiveRoomId(roomId)
    }
  }, [])

  // Check for room code in URL params (from shared links)
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setInitialRoomCode(code.toUpperCase())
      setShowJoinModal(true)
    }
  }, [searchParams])

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        {/* Hero Section */}
        <div className="w-full max-w-2xl text-center mb-12 px-4">
          <AnimatedDice />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter mt-6">
            <span className="whitespace-nowrap">Welcome to</span> <span className="text-brand-lime whitespace-nowrap">Bank It</span>
          </h1>
          <p className="text-gray-400 mt-4 max-w-md mx-auto">
            The ultimate online dice game of risk and reward. Create a game or join one to start playing!
          </p>
        </div>

        {/* Rejoin Active Game Banner */}
        {activeRoomId && (
          <div className="w-full max-w-4xl mb-8">
            <button
              onClick={() => router.push(`/room/${activeRoomId}`)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-lime/20 border-2 border-brand-lime rounded-lg text-brand-lime font-bold text-lg hover:bg-brand-lime/30 transition-all"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Rejoin Game ({activeRoomId.toUpperCase()})
            </button>
          </div>
        )}

        {/* Action Cards */}
        <div className="flex w-full max-w-4xl flex-col items-stretch gap-8 md:flex-row">
          {/* Create Game Card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex flex-1 cursor-pointer flex-col gap-6 rounded-lg border-2 border-brand-purple bg-brand-purple/10 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-brand-purple/80 hover:bg-brand-purple/20 hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]"
          >
            <div className="flex items-center justify-center rounded-lg bg-brand-purple p-3 text-4xl text-white size-16">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex flex-col gap-2 text-left">
              <h3 className="text-3xl font-bold">Create Game</h3>
              <p className="text-gray-300">Start a new room and invite your friends.</p>
            </div>
          </button>

          {/* Join Game Card */}
          <button
            onClick={() => setShowJoinModal(true)}
            className="group flex flex-1 cursor-pointer flex-col gap-6 rounded-lg border-2 border-brand-teal bg-brand-teal/10 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-brand-teal/80 hover:bg-brand-teal/20 hover:shadow-[0_0_40px_rgba(20,184,166,0.5)]"
          >
            <div className="flex items-center justify-center rounded-lg bg-brand-teal p-3 text-4xl text-white size-16">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="flex flex-col gap-2 text-left">
              <h3 className="text-3xl font-bold">Join Game</h3>
              <p className="text-gray-300">Enter a room code to play now.</p>
            </div>
          </button>
        </div>

        {/* Install App Banner */}
        {canInstall && (
          <div className="w-full max-w-4xl mt-8">
            <button
              onClick={promptInstall}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Install App for Quick Access
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGameModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <JoinGameModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} initialRoomCode={initialRoomCode} />
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-gray-400 text-xl">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
