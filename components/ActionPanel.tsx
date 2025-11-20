import { RollEffect } from '@/lib/types'
import RollingDice from './RollingDice'

interface ActionPanelProps {
  isCurrentPlayer: boolean
  hasBanked: boolean
  lastRoll?: RollEffect
  isRolling?: boolean
  onRoll: () => void
  onBank: () => void
}

export default function ActionPanel({
  isCurrentPlayer,
  hasBanked,
  lastRoll,
  isRolling = false,
  onRoll,
  onBank,
}: ActionPanelProps) {
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

  return (
    <div className="bg-[#141414] border border-white/10 rounded-lg shadow-xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4 text-gray-200 uppercase tracking-wider">Actions</h3>

      {/* Last Roll Display */}
      {lastRoll && (
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Last Roll</div>
          <RollingDice die1={lastRoll.die1} die2={lastRoll.die2} isRolling={isRolling} />
          <div className={`text-center text-lg font-semibold ${getEffectColor(lastRoll.effectType)}`}>
            {lastRoll.effectText}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 mt-6">
        <button
          onClick={onRoll}
          disabled={!isCurrentPlayer || hasBanked}
          className={`
            w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-200 transform
            ${
              isCurrentPlayer && !hasBanked
                ? 'bg-brand-lime hover:bg-brand-lime/90 hover:scale-105 text-black shadow-lg shadow-brand-lime/20 cursor-pointer'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }
          `}
        >
          🎲 Roll Dice
        </button>

        <button
          onClick={onBank}
          disabled={hasBanked}
          className={`
            w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-200 transform
            ${
              !hasBanked
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
        {hasBanked && <p>You have banked this round</p>}
        {!isCurrentPlayer && !hasBanked && <p>Waiting for other player...</p>}
        {isCurrentPlayer && !hasBanked && <p className="text-brand-lime">Your turn to roll!</p>}
      </div>
    </div>
  )
}
