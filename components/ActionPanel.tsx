'use client'

import { useState, useEffect, useMemo } from 'react'
import { RollEffect, Player } from '@/lib/types'
import ThreeDDice from './ThreeDDice'

const ROLL_DURATION = 2500  // Dice roll for 2.5 seconds
const BANKING_WINDOW_MS = 3000  // Must match lib/gameLogic.ts

// Hook to detect mobile screen size
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 500)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

interface ActionPanelProps {
  isCurrentPlayer: boolean
  hasBanked: boolean
  lastRoll?: RollEffect
  isRolling?: boolean
  isBustPhase?: boolean
  currentRollerName?: string
  turnOrder?: Player[]
  lastRollAt?: number
  rollCountThisRound: number
  onRoll: () => void
}

export default function ActionPanel({
  isCurrentPlayer,
  hasBanked,
  lastRoll,
  isRolling = false,
  isBustPhase = false,
  currentRollerName = '',
  turnOrder = [],
  lastRollAt,
  rollCountThisRound,
  onRoll,
}: ActionPanelProps) {
  const [isBouncing, setIsBouncing] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const isMobile = useIsMobile()
  const diceSize = isMobile ? 70 : 100

  // Calculate and update banking window countdown
  useEffect(() => {
    // No countdown for first roll of round
    if (rollCountThisRound === 0 || !lastRollAt) {
      setCountdownSeconds(0)
      return
    }

    const updateCountdown = () => {
      const elapsed = Date.now() - lastRollAt
      const remaining = Math.max(0, BANKING_WINDOW_MS - elapsed)
      setCountdownSeconds(Math.ceil(remaining / 1000))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 100) // Update every 100ms for smooth countdown

    return () => clearInterval(interval)
  }, [lastRollAt, rollCountThisRound])

  const isInBankingWindow = countdownSeconds > 0

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
      <h3 className="text-xl font-bold mb-4 text-gray-200 uppercase tracking-wider">Roll the Dice</h3>

      {/* 3D Dice Display - dice + dice = total */}
      <div className="mb-6">
        <div className={`flex items-center justify-center my-6 ${isMobile ? 'gap-2' : 'gap-4'}`}>
          {/* Die 1 */}
          <ThreeDDice
            value={die1Value}
            isRolling={isRolling}
            duration={ROLL_DURATION}
            size={diceSize}
          />

          <div className={`font-bold text-gray-400 ${isMobile ? 'text-xl' : 'text-2xl'}`}>+</div>

          {/* Die 2 */}
          <ThreeDDice
            value={die2Value}
            isRolling={isRolling}
            duration={ROLL_DURATION}
            size={diceSize}
          />

          <div className={`font-bold text-gray-400 ${isMobile ? 'text-xl' : 'text-2xl'}`}>=</div>

          {/* Total */}
          <div className={`font-bold transition-all duration-300 text-center ${
            isMobile ? 'text-3xl min-w-[50px]' : 'text-4xl min-w-[60px]'
          } ${isRolling ? 'text-gray-400' : 'text-brand-lime'} ${isBouncing ? 'animate-bounce' : ''}`}>
            {isRolling ? '?' : total}
          </div>
        </div>
      </div>

      {/* Roll Button or Up Next - min-height to prevent layout jumping */}
      <div className="mt-6 min-h-[72px]">
        {isCurrentPlayer ? (
          // Current player: show button when not rolling, hide during roll
          !isRolling && (
            <button
              onClick={onRoll}
              disabled={hasBanked || isBustPhase || isInBankingWindow}
              className={`
                w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-200 transform
                ${
                  !hasBanked && !isBustPhase && !isInBankingWindow
                    ? 'bg-brand-lime hover:bg-brand-lime/90 hover:scale-105 text-black shadow-lg shadow-brand-lime/20 cursor-pointer'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }
              `}
            >
              {isInBankingWindow ? `Wait ${countdownSeconds}s...` : '🎲 Roll Dice'}
            </button>
          )
        ) : (
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
              <span>Up Next:</span>
              {isInBankingWindow && (
                <span className="text-brand-lime font-bold animate-pulse">
                  Bank now! ({countdownSeconds}s)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {turnOrder.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap ${
                    index === 0
                      ? 'bg-brand-lime text-black font-bold'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  {index === 0 && <span>🎯</span>}
                  {player.nickname}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Text - fixed height placeholder to prevent layout jumping */}
      <div className="mt-4 min-h-[24px] text-center text-sm text-gray-400">
        {isBustPhase && <p className="text-bust-red">Round ended - new round starting soon...</p>}
        {!isBustPhase && hasBanked && <p>You have banked this round</p>}
      </div>
    </div>
  )
}
