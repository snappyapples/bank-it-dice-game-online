'use client'

import { useState, useEffect } from 'react'
import { GameState, RollEffect } from '@/lib/types'

interface BankPanelProps {
  gameState: GameState
  lastRoll?: RollEffect
  showEffect?: boolean
}

export default function BankPanel({ gameState, lastRoll, showEffect = false }: BankPanelProps) {
  const { bankValue, roundNumber, totalRounds, rollCountThisRound } = gameState
  const [visibleEffect, setVisibleEffect] = useState<RollEffect | null>(null)

  // Show effect briefly then fade out
  useEffect(() => {
    if (showEffect && lastRoll) {
      setVisibleEffect(lastRoll)
      const timer = setTimeout(() => setVisibleEffect(null), 2500)
      return () => clearTimeout(timer)
    }
  }, [showEffect, lastRoll])

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
  const nextRoll = rollCountThisRound + 1
  const isRiskyPhase = rollCountThisRound >= 3
  const rollPhase = nextRoll <= 3 ? 'special rules' : 'normal rules'

  const borderClass = isRiskyPhase
    ? 'border-red-500/50'
    : 'border-white/10'

  return (
    <div className={`bg-[#141414] border ${borderClass} rounded-lg shadow-2xl p-8 backdrop-blur-sm transition-colors duration-1000`}>
      {/* Main Bank Display */}
      <div className="text-center mb-6 relative">
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Current Bank</div>
        <div className="text-7xl font-bold text-brand-lime mb-2 tracking-tight">
          {bankValue}
        </div>
        <div className="text-lg text-gray-300">points</div>

        {/* Floating Effect Message */}
        {visibleEffect && (
          <div
            className={`absolute left-1/2 -translate-x-1/2 -bottom-2 text-lg font-bold ${getEffectColor(visibleEffect.effectType)} animate-fade-in-up pointer-events-none`}
          >
            {visibleEffect.effectText}
          </div>
        )}
      </div>

      {/* Round Info */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1 uppercase tracking-wider">Round</div>
          <div className="text-2xl font-bold">
            {roundNumber} <span className="text-gray-500">/ {totalRounds}</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1 uppercase tracking-wider">Roll #{nextRoll}</div>
          <div className={`text-sm font-medium ${isRiskyPhase ? 'text-red-400' : 'text-brand-teal'}`}>
            ({rollPhase})
            {isRiskyPhase && <span className="ml-2">⚠️</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
