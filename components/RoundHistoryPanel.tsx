import { RoundHistoryEntry } from '@/lib/types'

interface RoundHistoryPanelProps {
  history: RoundHistoryEntry[]
  currentPlayerNickname: string
}

export default function RoundHistoryPanel({ history, currentPlayerNickname }: RoundHistoryPanelProps) {
  if (history.length === 0) {
    return null
  }

  // Calculate cumulative totals and overall leaders for each round
  const historyWithTotals = history.map((entry, index) => {
    // Calculate cumulative scores up to this round
    const cumulativeScores = new Map<string, number>()

    // Sum up all rounds up to and including current round
    for (let i = 0; i <= index; i++) {
      history[i].playerResults.forEach(result => {
        const current = cumulativeScores.get(result.playerNickname) || 0
        cumulativeScores.set(result.playerNickname, current + result.pointsEarned)
      })
    }

    // Find overall leader after this round
    let maxScore = 0
    let overallWinner = ''
    cumulativeScores.forEach((score, player) => {
      if (score > maxScore) {
        maxScore = score
        overallWinner = player
      }
    })

    // Get current player's data
    const myResult = entry.playerResults.find(r => r.playerNickname === currentPlayerNickname)
    const myPoints = myResult?.pointsEarned || 0
    const myTotal = cumulativeScores.get(currentPlayerNickname) || 0

    return {
      ...entry,
      myPoints,
      myTotal,
      overallWinner,
      overallWinnerScore: maxScore,
    }
  })

  return (
    <div className="bg-[#141414] border border-white/10 rounded-lg shadow-xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4 text-gray-200 uppercase tracking-wider">Round History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">Round</th>
              <th className="text-center py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">My Points</th>
              <th className="text-center py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">My Total Points</th>
              <th className="text-left py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">Round Winner</th>
              <th className="text-left py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">Overall Winner</th>
            </tr>
          </thead>
          <tbody>
            {historyWithTotals.map((entry, index) => (
              <tr
                key={index}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-3 text-gray-300 font-medium">Round {entry.roundNumber}</td>
                <td className="py-3 px-3 text-center font-bold text-white">
                  {entry.myPoints}
                </td>
                <td className="py-3 px-3 text-center font-bold text-brand-lime">
                  {entry.myTotal}
                </td>
                <td className="py-3 px-3 text-sm">
                  {entry.topPoints > 0 ? (
                    <span className={entry.topPlayer === currentPlayerNickname ? 'text-brand-lime font-semibold' : 'text-white'}>
                      {entry.topPlayer} ({entry.topPoints})
                    </span>
                  ) : (
                    <span className="text-gray-600">No winner</span>
                  )}
                </td>
                <td className="py-3 px-3 text-sm">
                  <span className={entry.overallWinner === currentPlayerNickname ? 'text-brand-lime font-semibold' : 'text-white'}>
                    {entry.overallWinner} ({entry.overallWinnerScore})
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
