'use client'

interface HowToPlayModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#141414] border border-white/10 rounded-lg shadow-2xl w-[70%] max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-lime">How to Play Bank It</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 text-gray-300">
            {/* Objective */}
            <div>
              <h3 className="text-xl font-bold text-brand-teal mb-1">Objective</h3>
              <p>Be the player with the most points after all rounds are complete!</p>
            </div>

            {/* How to Play */}
            <div>
              <h3 className="text-xl font-bold text-brand-teal mb-1">How to Play</h3>
              <ul className="list-disc list-inside">
                <li>Players take turns rolling two dice</li>
                <li>Each roll adds points to a shared "bank"</li>
                <li>You can <strong className="text-brand-lime">bank your points</strong> at any time to add them to your score</li>
                <li>Once you bank, you're done for the round and wait for others</li>
                <li>The round continues until all players have banked or someone busts</li>
              </ul>
            </div>

            {/* Special Rules */}
            <div>
              <h3 className="text-xl font-bold text-brand-teal mb-1">Rolling Rules</h3>

              <div className="mb-3">
                <h4 className="font-semibold text-brand-lime mb-1">First 3 Rolls (Safe Zone)</h4>
                <ul className="list-disc list-inside ml-4">
                  <li>All dice rolls add their face value to the bank</li>
                  <li><strong>Rolling a 7:</strong> Adds <span className="text-brand-lime">70 points</span> to the bank (not just 7!)</li>
                  <li>No risk of busting during these rolls</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-bust-red mb-1">Roll 4+ (Risky Zone ⚠️)</h4>
                <ul className="list-disc list-inside ml-4">
                  <li><strong>Rolling a 7:</strong> <span className="text-bust-red">BUST!</span> The bank empties and all non-banked players get nothing</li>
                  <li><strong>Rolling doubles:</strong> <span className="text-brand-lime">DOUBLES</span> the entire bank value!</li>
                  <li>Any other roll adds its face value to the bank</li>
                </ul>
              </div>
            </div>

            {/* Strategy Tips */}
            <div>
              <h3 className="text-xl font-bold text-brand-teal mb-1">Strategy Tips</h3>
              <ul className="list-disc list-inside">
                <li>The first 3 rolls are safe - no reason to bank early!</li>
                <li>After roll 3, every roll is a risk vs. reward decision</li>
                <li>Rolling a 7 (1/6 chance) will bust everyone who hasn't banked</li>
                <li>Rolling doubles can massively increase the bank value</li>
                <li>Watch what other players do - sometimes it's better to bank early if others are greedy!</li>
              </ul>
            </div>

            {/* Winning */}
            <div>
              <h3 className="text-xl font-bold text-brand-teal mb-1">Winning the Game</h3>
              <p>After all rounds are complete, the player with the highest total score wins!</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full py-3 bg-brand-lime text-black font-bold rounded-lg text-lg hover:bg-brand-lime/90 transition-all"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
