import { GameState } from '@/lib/types'

interface BankPanelProps {
  gameState: GameState
}

export default function BankPanel({ gameState }: BankPanelProps) {
  const { bankValue, roundNumber, totalRounds, rollCountThisRound } = gameState
  const nextRoll = rollCountThisRound + 1
  const isRiskyPhase = rollCountThisRound >= 3
  const rollPhase = nextRoll <= 3 ? 'special rules' : 'normal rules'

  const borderClass = isRiskyPhase
    ? 'border-red-500/50'
    : 'border-white/10'

  return (
    <div className={`bg-[#141414] border ${borderClass} rounded-lg shadow-2xl p-8 backdrop-blur-sm transition-colors duration-1000`}>
      {/* Main Bank Display */}
      <div className="text-center mb-6">
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Current Bank</div>
        <div className="text-7xl font-bold text-brand-lime mb-2 tracking-tight">
          {bankValue}
        </div>
        <div className="text-lg text-gray-300">points</div>
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
