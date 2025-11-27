'use client'

import { GameState, GameStats as GameStatsType } from '@/lib/types'

interface GameStatsProps {
  gameState: GameState
}

interface Award {
  icon: string
  title: string
  player: string
  value: string
}

export default function GameStats({ gameState }: GameStatsProps) {
  const { stats, players } = gameState

  if (!stats) return null

  const awards: Award[] = []

  // Most Doubles
  const doublesEntries = Object.entries(stats.doublesCount)
  if (doublesEntries.length > 0) {
    const maxDoubles = Math.max(...doublesEntries.map(([, count]) => count))
    if (maxDoubles > 0) {
      const winnerId = doublesEntries.find(([, count]) => count === maxDoubles)?.[0]
      const winner = players.find(p => p.id === winnerId)
      if (winner) {
        awards.push({
          icon: '🎰',
          title: 'Lucky Doubles',
          player: winner.nickname,
          value: `${maxDoubles} doubles`,
        })
      }
    }
  }

  // Most Busts (Risk Taker / Danger Zone)
  const bustEntries = Object.entries(stats.bustCount)
  if (bustEntries.length > 0) {
    const maxBusts = Math.max(...bustEntries.map(([, count]) => count))
    if (maxBusts > 0) {
      const winnerId = bustEntries.find(([, count]) => count === maxBusts)?.[0]
      const winner = players.find(p => p.id === winnerId)
      if (winner) {
        awards.push({
          icon: '💀',
          title: 'Danger Zone',
          player: winner.nickname,
          value: `${maxBusts} busts`,
        })
      }
    }
  }

  // Most 7s in Hazard Mode
  const sevensEntries = Object.entries(stats.sevensInHazard)
  if (sevensEntries.length > 0) {
    const maxSevens = Math.max(...sevensEntries.map(([, count]) => count))
    if (maxSevens > 0) {
      const winnerId = sevensEntries.find(([, count]) => count === maxSevens)?.[0]
      const winner = players.find(p => p.id === winnerId)
      if (winner) {
        awards.push({
          icon: '🎯',
          title: 'Risk Taker',
          player: winner.nickname,
          value: `${maxSevens} hazard 7s`,
        })
      }
    }
  }

  // Biggest Round
  if (stats.biggestRound) {
    awards.push({
      icon: '💎',
      title: 'Biggest Round',
      player: stats.biggestRound.player,
      value: `${stats.biggestRound.points} pts (R${stats.biggestRound.round})`,
    })
  }

  // Luckiest (highest points per roll)
  const rollsEntries = Object.entries(stats.totalRolls)
  if (rollsEntries.length > 0) {
    let bestRatio = 0
    let luckiestPlayer: typeof players[0] | null = null

    for (const [playerId, rolls] of rollsEntries) {
      if (rolls > 0) {
        const player = players.find(p => p.id === playerId)
        if (player && player.score > 0) {
          const ratio = player.score / rolls
          if (ratio > bestRatio) {
            bestRatio = ratio
            luckiestPlayer = player
          }
        }
      }
    }

    if (luckiestPlayer && bestRatio > 0) {
      awards.push({
        icon: '🍀',
        title: 'Luckiest',
        player: luckiestPlayer.nickname,
        value: `${bestRatio.toFixed(1)} pts/roll`,
      })
    }
  }

  // Comeback King
  if (stats.comebackKing) {
    awards.push({
      icon: '👑',
      title: 'Comeback King',
      player: stats.comebackKing.player,
      value: `Overcame ${stats.comebackKing.deficit} pt deficit`,
    })
  }

  if (awards.length === 0) return null

  return (
    <div className="bg-[#141414] border border-white/10 rounded-lg p-4 sm:p-6">
      <h3 className="text-sm font-semibold mb-4 text-gray-400 uppercase tracking-wider text-center">
        Game Awards
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {awards.map((award, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
          >
            <div className="text-2xl mb-1">{award.icon}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">{award.title}</div>
            <div className="text-base font-bold text-brand-lime truncate">{award.player}</div>
            <div className="text-xs text-gray-500">{award.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
