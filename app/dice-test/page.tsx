'use client'

import { useState } from 'react'
import SimpleDice from '@/components/SimpleDice'
import ThreeDDice from '@/components/ThreeDDice'

const ROLL_DURATION = 2500  // Both dice roll for 2.5 seconds

export default function DiceTestPage() {
  const [die1, setDie1] = useState(1)
  const [die2, setDie2] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const [showTotal, setShowTotal] = useState(false)
  const [use3D, setUse3D] = useState(true)
  const [isBouncing, setIsBouncing] = useState(false)

  const handleRoll = () => {
    if (isRolling) return

    setIsRolling(true)
    setShowTotal(false)
    setIsBouncing(false)

    // Generate random roll values
    const newDie1 = Math.floor(Math.random() * 6) + 1
    const newDie2 = Math.floor(Math.random() * 6) + 1

    console.log('Rolling:', newDie1, newDie2)

    // Set values immediately - the ThreeDDice component will animate to them
    setDie1(newDie1)
    setDie2(newDie2)

    // After animation completes, show total and stop rolling
    setTimeout(() => {
      setShowTotal(true)
      setIsRolling(false)
      setIsBouncing(true)
      console.log('Total:', newDie1 + newDie2)

      // Stop bouncing after a few bounces (~1.5 seconds)
      setTimeout(() => {
        setIsBouncing(false)
      }, 1500)
    }, ROLL_DURATION + 500)
  }

  return (
    <div className="min-h-screen bg-background-dark p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-brand-lime mb-8 text-center">
          🎲 Dice Animation Tester
        </h1>

        <div className="bg-[#141414] border border-white/10 rounded-lg p-8 mb-8">
          <div className="mb-4 text-center">
            <button
              onClick={() => setUse3D(!use3D)}
              className="px-4 py-2 bg-brand-teal rounded-lg text-sm font-semibold hover:bg-brand-teal/80 transition-colors"
            >
              {use3D ? '3D Mode' : '2D Mode'} (Click to toggle)
            </button>
          </div>

          {/* Dice + Dice = Total layout */}
          <div className="flex gap-6 items-center justify-center my-8">
            {/* Die 1 */}
            {use3D ? (
              <ThreeDDice value={die1} isRolling={isRolling && !showTotal} duration={ROLL_DURATION} />
            ) : (
              <div className={`transition-all duration-500 ${isRolling && !showTotal ? 'animate-spin' : ''}`}>
                <SimpleDice value={die1} />
              </div>
            )}

            <div className="text-3xl font-bold text-gray-400">+</div>

            {/* Die 2 */}
            {use3D ? (
              <ThreeDDice value={die2} isRolling={isRolling && !showTotal} duration={ROLL_DURATION} />
            ) : (
              <div className={`transition-all duration-500 ${isRolling && !showTotal ? 'animate-spin' : ''}`}>
                <SimpleDice value={die2} />
              </div>
            )}

            <div className="text-3xl font-bold text-gray-400">=</div>

            {/* Total */}
            <div className={`text-5xl font-bold transition-all duration-300 ${
              isRolling && !showTotal ? 'text-gray-400' : 'text-brand-lime'
            } ${isBouncing ? 'animate-bounce' : ''}`}>
              {isRolling && !showTotal ? '?' : die1 + die2}
            </div>
          </div>

          <button
            onClick={handleRoll}
            disabled={isRolling}
            className={`
              w-full py-4 px-6 rounded-full font-bold text-xl transition-all duration-200 transform
              ${
                !isRolling
                  ? 'bg-brand-lime hover:bg-brand-lime/90 hover:scale-105 text-black shadow-lg shadow-brand-lime/20 cursor-pointer'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }
            `}
          >
            {isRolling ? '🎲 Rolling...' : '🎲 Roll Dice'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-brand-teal hover:text-brand-lime transition-colors"
          >
            ← Back to Game
          </a>
        </div>
      </div>
    </div>
  )
}
