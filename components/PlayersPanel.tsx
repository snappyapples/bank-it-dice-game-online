import { Player } from '@/lib/types'

interface PlayersPanelProps {
  players: Player[]
}

export default function PlayersPanel({ players }: PlayersPanelProps) {
  const getStatusBadge = (player: Player) => {
    if (player.hasBankedThisRound) {
      return <span className="px-2 py-1 bg-brand-lime text-black text-xs font-bold rounded">BANKED</span>
    }
    if (player.status === 'out') {
      return <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs font-bold rounded">OUT</span>
    }
    return <span className="px-2 py-1 bg-brand-purple text-white text-xs font-bold rounded">IN</span>
  }

  return (
    <div className="bg-[#141414] border border-white/10 rounded-lg shadow-xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4 text-gray-200 uppercase tracking-wider">Players</h3>
      <div className="space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className={`
              p-4 rounded-lg border transition-all
              ${
                player.isCurrentRoller
                  ? 'bg-brand-lime/10 border-brand-lime shadow-lg shadow-brand-lime/20'
                  : 'bg-black/30 border-white/10'
              }
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{player.nickname}</span>
                {player.isCurrentRoller && (
                  <span className="text-brand-lime text-xl">🎯</span>
                )}
              </div>
              {getStatusBadge(player)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 uppercase tracking-wider">Total Score</span>
              <span className="text-xl font-bold text-gray-200">{player.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
