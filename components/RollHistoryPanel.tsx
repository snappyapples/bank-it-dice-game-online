import { RollHistoryEntry } from '@/lib/types'

interface RollHistoryPanelProps {
  history: RollHistoryEntry[]
}

export default function RollHistoryPanel({ history }: RollHistoryPanelProps) {
  return (
    <div className="bg-[#141414] border border-white/10 rounded-lg shadow-xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4 text-gray-200 uppercase tracking-wider">Roll History (This Round)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">Roll #</th>
              <th className="text-left py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">Player</th>
              <th className="text-center py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">Dice</th>
              <th className="text-center py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">Result</th>
              <th className="text-left py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">Effect</th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium uppercase tracking-wider">Bank</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, index) => (
              <tr
                key={index}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-3 text-gray-300">{entry.rollNumber}</td>
                <td className="py-3 px-3 font-medium">{entry.playerNickname}</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1">
                    🎲 {entry.die1} + {entry.die2}
                  </span>
                </td>
                <td className="py-3 px-3 text-center font-bold text-brand-lime">
                  {entry.result}
                </td>
                <td className="py-3 px-3 text-sm text-gray-300">{entry.effect}</td>
                <td className="py-3 px-3 text-right font-bold text-bank-green">{entry.bankAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No rolls yet this round
          </div>
        )}
      </div>
    </div>
  )
}
