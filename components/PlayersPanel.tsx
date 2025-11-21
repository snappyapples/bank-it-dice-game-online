import { Player } from '@/lib/types'

interface PlayersPanelProps {
  players: Player[]
}

export default function PlayersPanel({ players }: PlayersPanelProps) {
  // Calculate who is in the lead
  const maxScore = Math.max(...players.map(p => p.score))
  const hasAnyPoints = maxScore > 0

  const isLeader = (player: Player) => hasAnyPoints && player.score === maxScore

  const getStatusBadge = (player: Player) => {
    if (player.hasBankedThisRound) {
      return <span className="px-2 py-1 bg-brand-lime text-black text-xs font-bold rounded">BANKED</span>
    }
    if (player.status === 'out') {
      return <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs font-bold rounded">OUT</span>
    }
    return <span className="px-2 py-1 bg-brand-purple text-white text-xs font-bold rounded">IN</span>
  }

  const getCardClasses = (player: Player) => {
    if (isLeader(player)) {
      // Leader gets gold styling (takes priority over current roller)
      return 'bg-yellow-500/10 border-yellow-500 shadow-lg shadow-yellow-500/20'
    }
    if (player.isCurrentRoller) {
      return 'bg-brand-lime/10 border-brand-lime shadow-lg shadow-brand-lime/20'
    }
    return 'bg-black/30 border-white/10'
  }

  return (
    <div className="bg-[#141414] border border-white/10 rounded-lg shadow-xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4 text-gray-200 uppercase tracking-wider">Players</h3>
      <div className="space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className={`p-4 rounded-lg border transition-all ${getCardClasses(player)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isLeader(player) && (
                  <span className="text-yellow-500 text-xl">👑</span>
                )}
                <span className={`font-semibold text-lg ${isLeader(player) ? 'text-yellow-500' : ''}`}>
                  {player.nickname}
                </span>
                {player.isCurrentRoller && (
                  <span className="text-brand-lime text-xl">🎯</span>
                )}
              </div>
              {getStatusBadge(player)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 uppercase tracking-wider">Total Score</span>
              <span className={`text-xl font-bold ${isLeader(player) ? 'text-yellow-500' : 'text-gray-200'}`}>
                {player.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
