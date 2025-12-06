'use client'

import { useState, useEffect, useMemo } from 'react'
import { RollEffect, Player } from '@/lib/types'
import ThreeDDice from './ThreeDDice'

const ROLL_DURATION = 2500  // Dice roll for 2.5 seconds
const BANKING_WINDOW_MS = 7000  // Must match lib/gameLogic.ts

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
  playerId?: string
  leadingScore?: number
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
  playerId,
  leadingScore = 0,
  onRoll,
}: ActionPanelProps) {
  const [isBouncing, setIsBouncing] = useState(false)
  const [tick, setTick] = useState(0) // Used to trigger re-renders for countdown
  const isMobile = useIsMobile()
  const diceSize = isMobile ? 70 : 100

  // Calculate remaining banking window time synchronously on each render
  // This runs on every render (tick updates trigger re-renders)
  let countdownSeconds = 0
  if (rollCountThisRound > 0 && lastRollAt && turnOrder.length > 1) {
    const elapsed = Date.now() - lastRollAt
    countdownSeconds = Math.max(0, Math.ceil((BANKING_WINDOW_MS - elapsed) / 1000))
  }

  // Force re-render every 100ms to update countdown display
  useEffect(() => {
    // No countdown needed
    if (rollCountThisRound === 0 || !lastRollAt || turnOrder.length <= 1) {
      return
    }

    // Check if we're still in the window
    const elapsed = Date.now() - lastRollAt
    if (elapsed >= BANKING_WINDOW_MS) {
      return
    }

    const interval = setInterval(() => {
      setTick(n => n + 1)
    }, 100)

    return () => clearInterval(interval)
  }, [lastRollAt, rollCountThisRound, turnOrder.length])

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

      {/* Roll Button - show for current player when not rolling */}
      {isCurrentPlayer && !isRolling && (
        <div className="mt-6">
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
        </div>
      )}

      {/* Up Next - always shown */}
      <div className={`${isCurrentPlayer && !isRolling ? 'mt-4' : 'mt-6'}`}>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
            <span>Up Next:</span>
            {!isCurrentPlayer && isInBankingWindow && (
              <span className="text-brand-lime font-bold animate-pulse">
                Bank now! ({countdownSeconds}s)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {turnOrder.map((player, index) => {
              const isYou = player.id === playerId
              const pointsBehind = leadingScore - player.score

              return (
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
                  {isYou && pointsBehind > 0 && (
                    <span className={index === 0 ? 'text-black/70' : 'text-bust-red'}>
                      (-{pointsBehind})
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Status Text - fixed height placeholder to prevent layout jumping */}
      <div className="mt-4 min-h-[24px] text-center text-sm text-gray-400">
        {isBustPhase && <p className="text-bust-red">Round ended - new round starting soon...</p>}
        {!isBustPhase && hasBanked && <p>You have banked this round</p>}
      </div>
    </div>
  )
}
