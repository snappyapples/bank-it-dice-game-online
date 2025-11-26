'use client'

import { useState, useEffect, useRef } from 'react'
import { GameState, RollEffect } from '@/lib/types'

interface BankPanelProps {
  gameState: GameState
  lastRoll?: RollEffect
  showEffect?: boolean
  onBank?: () => void
  canBank?: boolean
  isRiskyPhase?: boolean
  bankedCount?: number
}

export default function BankPanel({
  gameState,
  lastRoll,
  showEffect = false,
  onBank,
  canBank = false,
  isRiskyPhase = false,
  bankedCount = 0
}: BankPanelProps) {
  const { bankValue, roundNumber, totalRounds, rollCountThisRound, players } = gameState
  const [isPulsing, setIsPulsing] = useState(false)
  const prevRollCount = useRef(rollCountThisRound)

  // Trigger 3 pulses when entering risky phase (roll #4)
  useEffect(() => {
    // Detect transition into risky phase (from roll 2 to roll 3, meaning entering roll #4)
    if (rollCountThisRound === 3 && prevRollCount.current < 3) {
      setIsPulsing(true)
      // Stop pulsing after ~1.5 seconds (3 pulses at 0.5s each)
      const timer = setTimeout(() => setIsPulsing(false), 1500)
      return () => clearTimeout(timer)
    }
    prevRollCount.current = rollCountThisRound
  }, [rollCountThisRound])

  // Create a unique key for each roll - used to remount the animation element
  const rollKey = lastRoll ? `${gameState.roundNumber}-${gameState.rollCountThisRound}-${lastRoll.die1}-${lastRoll.die2}` : null

  const getEffectColor = (effectType?: string) => {
    if (!effectType) return 'text-gray-400'
    switch (effectType) {
      case 'bust':
        return 'text-bust-red'
      case 'doubleBank':
      case 'add70':
        return 'text-yellow-400'
      default:
        return 'text-brand-lime'
    }
  }

  const borderClass = isRiskyPhase
    ? 'border-red-500/50'
    : 'border-white/10'

  return (
    <div className={`bg-[#141414] border ${borderClass} rounded-lg shadow-2xl p-8 backdrop-blur-sm transition-colors duration-1000 ${isPulsing ? 'animate-pulse-danger' : ''}`}>
      {/* Main Bank Display with Bank Button */}
      <div className="flex items-center justify-center gap-8">
        <div className="text-center flex-1">
          <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Current Bank</div>
          <div className="text-7xl font-bold text-brand-lime mb-2 tracking-tight">
            {bankValue}
          </div>
          <div className="text-lg text-gray-300">points</div>
        </div>

        {/* Bank Button - Next to bank number */}
        {onBank && (
          <div className="flex-shrink-0">
            <button
              onClick={onBank}
              disabled={!canBank}
              className={`
                px-8 py-6 rounded-2xl font-bold text-xl transition-all duration-200 transform
                ${
                  canBank
                    ? 'bg-brand-teal hover:bg-brand-teal/90 hover:scale-105 text-white shadow-lg shadow-brand-teal/20 cursor-pointer'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">💰</span>
                <span>Bank It!</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Floating Effect Message - absolutely positioned to prevent layout shift */}
      <div className="relative h-[28px]">
        {showEffect && lastRoll && (
          <div
            key={rollKey}
            className={`absolute left-1/2 -translate-x-1/2 text-center text-lg font-bold whitespace-nowrap ${getEffectColor(lastRoll.effectType)} animate-fade-in-up`}
          >
            {lastRoll.effectText}
          </div>
        )}
      </div>

      {/* Status Bar - wraps to 2 lines on mobile */}
      <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-evenly gap-y-3">
        {/* Row 1 on mobile: Round and Roll */}
        <div className="flex items-center gap-2 w-1/2 sm:w-auto justify-center sm:justify-start">
          <span className="text-sm text-gray-400">Round</span>
          <span className="text-lg font-bold text-brand-lime">{roundNumber}/{totalRounds}</span>
        </div>
        <div className="flex items-center gap-2 w-1/2 sm:w-auto justify-center sm:justify-start">
          <span className="text-sm text-gray-400">Roll</span>
          <span className={`text-lg font-bold ${isRiskyPhase ? 'text-bust-red' : 'text-brand-teal'}`}>
            #{rollCountThisRound + 1}
          </span>
        </div>
        {/* Row 2 on mobile: Banked and Status */}
        <div className="flex items-center gap-2 w-1/2 sm:w-auto justify-center sm:justify-start">
          <span className="text-sm text-gray-400">Banked</span>
          <span className="text-lg font-bold text-brand-lime">{bankedCount}/{players.length}</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-1/2 sm:w-auto justify-center sm:justify-start ${
          isRiskyPhase
            ? `bg-bust-red/20 text-bust-red ${isPulsing ? 'animate-pulse-danger' : ''}`
            : 'bg-brand-teal/20 text-brand-teal'
        }`}>
          {isRiskyPhase ? (
            <>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-bold uppercase text-sm">Hazard</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold uppercase text-sm">Safe</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
