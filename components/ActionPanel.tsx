'use client'

import { useState, useEffect } from 'react'
import { RollEffect } from '@/lib/types'
import ThreeDDice from './ThreeDDice'

const ROLL_DURATION = 2500  // Dice roll for 2.5 seconds

interface ActionPanelProps {
  isCurrentPlayer: boolean
  hasBanked: boolean
  lastRoll?: RollEffect
  isRolling?: boolean
  isBustPhase?: boolean
  currentRollerName?: string
  onRoll: () => void
  onBank: () => void
}

export default function ActionPanel({
  isCurrentPlayer,
  hasBanked,
  lastRoll,
  isRolling = false,
  isBustPhase = false,
  currentRollerName = '',
  onRoll,
  onBank,
}: ActionPanelProps) {
  const [isBouncing, setIsBouncing] = useState(false)

  // Handle bounce animation when roll completes
  useEffect(() => {
    if (isRolling) {
      setIsBouncing(false)
    } else if (lastRoll) {
      // Small delay to sync with dice animation finishing
      const timer = setTimeout(() => {
        setIsBouncing(true)
        // Stop bouncing after a few bounces
        setTimeout(() => setIsBouncing(false), 1500)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isRolling, lastRoll])

  const die1Value = lastRoll?.die1 ?? 1
  const die2Value = lastRoll?.die2 ?? 1
  const total = die1Value + die2Value

  return (
    <div className="bg-[#141414] border border-white/10 rounded-lg shadow-xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4 text-gray-200 uppercase tracking-wider">Actions</h3>

      {/* 3D Dice Display - dice + dice = total */}
      <div className="mb-6">
        <div className="flex gap-4 items-center justify-center my-6">
          {/* Die 1 */}
          <ThreeDDice
            value={die1Value}
            isRolling={isRolling}
            duration={ROLL_DURATION}
          />

          <div className="text-2xl font-bold text-gray-400">+</div>

          {/* Die 2 */}
          <ThreeDDice
            value={die2Value}
            isRolling={isRolling}
            duration={ROLL_DURATION}
          />

          <div className="text-2xl font-bold text-gray-400">=</div>

          {/* Total */}
          <div className={`text-4xl font-bold transition-all duration-300 min-w-[60px] text-center ${
            isRolling ? 'text-gray-400' : 'text-brand-lime'
          } ${isBouncing ? 'animate-bounce' : ''}`}>
            {isRolling ? '?' : total}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mt-6">
        <button
          onClick={onRoll}
          disabled={!isCurrentPlayer || hasBanked || isRolling || isBustPhase}
          className={`
            w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-200 transform
            ${
              isCurrentPlayer && !hasBanked && !isRolling && !isBustPhase
                ? 'bg-brand-lime hover:bg-brand-lime/90 hover:scale-105 text-black shadow-lg shadow-brand-lime/20 cursor-pointer'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }
          `}
        >
          {isRolling
            ? '🎲 Rolling...'
            : isCurrentPlayer
              ? '🎲 Roll Dice'
              : `🎲 ${currentRollerName}'s turn to roll`}
        </button>

        <button
          onClick={onBank}
          disabled={hasBanked || isRolling || isBustPhase}
          className={`
            w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-200 transform
            ${
              !hasBanked && !isRolling && !isBustPhase
                ? 'bg-brand-teal hover:bg-brand-teal/90 hover:scale-105 text-white shadow-lg shadow-brand-teal/20 cursor-pointer'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }
          `}
        >
          💰 Bank Points
        </button>
      </div>

      {/* Status Text */}
      <div className="mt-4 text-center text-sm text-gray-400">
        {isBustPhase && <p className="text-bust-red">Round ended - new round starting soon...</p>}
        {!isBustPhase && hasBanked && <p>You have banked this round</p>}
        {!isBustPhase && !isCurrentPlayer && !hasBanked && <p>Waiting for other player...</p>}
        {!isBustPhase && isCurrentPlayer && !hasBanked && !isRolling && <p className="text-brand-lime">Your turn to roll!</p>}
      </div>
    </div>
  )
}
