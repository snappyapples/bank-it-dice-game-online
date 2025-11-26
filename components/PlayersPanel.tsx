import { Player } from '@/lib/types'

interface PlayersPanelProps {
  players: Player[]
  showLeaderboard?: boolean
  currentPlayerNickname?: string
}

export default function PlayersPanel({ players, showLeaderboard = false, currentPlayerNickname }: PlayersPanelProps) {
  // Sort players by score for leaderboard
  const sortedPlayers = showLeaderboard
    ? [...players].sort((a, b) => b.score - a.score)
    : players

  // Calculate who is in the lead
  const maxScore = Math.max(...players.map(p => p.score))
  const hasAnyPoints = maxScore > 0

  const isLeader = (player: Player) => hasAnyPoints && player.score === maxScore

  const getPointsDiff = (player: Player) => {
    if (!hasAnyPoints) return null
    if (isLeader(player)) return null
    return maxScore - player.score
  }

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
    const isCurrentLeader = isLeader(player)
    const isRoller = player.isCurrentRoller

    // Build classes - leader border, but roller gets the background shading
    let classes = 'bg-black/30 border-white/10'

    if (isRoller) {
      classes = 'bg-brand-lime/10 border-brand-lime shadow-lg shadow-brand-lime/20'
    }

    // Leader gets gold border (overrides other borders, but not background)
    if (isCurrentLeader) {
      if (isRoller) {
        // Both leader and roller - keep green bg, gold border
        classes = 'bg-brand-lime/10 border-yellow-500 shadow-lg shadow-yellow-500/20'
      } else {
        // Just leader - no bg shading, gold border
        classes = 'bg-black/30 border-yellow-500 shadow-lg shadow-yellow-500/20'
      }
    }

    return classes
  }

  const isYou = (player: Player) => player.nickname === currentPlayerNickname

  return (
    <div className="bg-[#141414] border border-white/10 rounded-lg shadow-xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4 text-gray-200 uppercase tracking-wider">
        {showLeaderboard ? 'Leaderboard' : 'Players'}
      </h3>
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const pointsDiff = getPointsDiff(player)

          return (
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
                  {isYou(player) && (
                    <span className="text-brand-teal text-sm">👤 You</span>
                  )}
                  {player.isCurrentRoller && (
                    <span className="text-brand-lime text-xl">🎯</span>
                  )}
                </div>
                {getStatusBadge(player)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-bold ${isLeader(player) ? 'text-yellow-500' : 'text-gray-200'}`}>
                    {player.score}
                  </span>
                  {pointsDiff !== null && (
                    <span className="text-sm text-bust-red">
                      -{pointsDiff} behind
                    </span>
                  )}
                  {isLeader(player) && hasAnyPoints && (
                    <span className="text-sm text-yellow-500">
                      Leading
                    </span>
                  )}
                </div>
                {player.pointsEarnedThisRound > 0 && (
                  <span className="text-sm text-brand-lime">
                    +{player.pointsEarnedThisRound} this round
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
