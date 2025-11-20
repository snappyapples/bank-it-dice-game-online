'use client'

import { useState } from 'react'
import ThreeDDice from '@/components/ThreeDDice'

export default function DiceTestPage() {
  const [die1, setDie1] = useState(1)
  const [die2, setDie2] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const [showTotal, setShowTotal] = useState(false)

  const handleRoll = () => {
    if (isRolling) return

    setIsRolling(true)
    setShowTotal(false)

    // Generate random roll values
    const newDie1 = Math.floor(Math.random() * 6) + 1
    const newDie2 = Math.floor(Math.random() * 6) + 1

    console.log('Rolling:', newDie1, newDie2)

    // First die finishes after 2.5 seconds
    setTimeout(() => {
      setDie1(newDie1)
      console.log('Die 1 landed:', newDie1)
    }, 2500)

    // Second die finishes after 5 seconds (2.5s + 2.5s)
    setTimeout(() => {
      setDie2(newDie2)
      console.log('Die 2 landed:', newDie2)
    }, 5000)

    // Show total after 5.5 seconds (a bit after second die lands)
    setTimeout(() => {
      setShowTotal(true)
      setIsRolling(false)
      console.log('Total:', newDie1 + newDie2)
    }, 5500)
  }

  return (
    <div className="min-h-screen bg-background-dark p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-brand-lime mb-8 text-center">
          🎲 Dice Animation Tester
        </h1>

        <div className="bg-[#141414] border border-white/10 rounded-lg p-8 mb-8">
          <div className="flex justify-center gap-12 mb-8">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-4">Die 1</div>
              <ThreeDDice value={die1} isRolling={isRolling && !showTotal} delay={0} />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-4">Die 2</div>
              <ThreeDDice value={die2} isRolling={isRolling && !showTotal} delay={2500} />
            </div>
          </div>

          {showTotal && (
            <div className="text-center mb-6 animate-bounce">
              <div className="text-lg text-gray-400 mb-2">Total</div>
              <div className="text-6xl font-bold text-brand-lime">
                {die1 + die2}
              </div>
            </div>
          )}

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

        <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-brand-teal">Current Values</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-gray-400 text-sm">Die 1</div>
              <div className="text-3xl font-bold text-white">{die1}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Die 2</div>
              <div className="text-3xl font-bold text-white">{die2}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Total</div>
              <div className="text-3xl font-bold text-brand-lime">{die1 + die2}</div>
            </div>
          </div>
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
