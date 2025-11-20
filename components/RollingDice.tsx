'use client'

interface RollingDiceProps {
  die1: number
  die2: number
  isRolling?: boolean
}

export default function RollingDice({ die1, die2, isRolling = false }: RollingDiceProps) {
  const renderDots = (value: number) => {
    const positions = [
      [], // 0 (not used)
      ['center'], // 1
      ['top-left', 'bottom-right'], // 2
      ['top-left', 'center', 'bottom-right'], // 3
      ['top-left', 'top-right', 'bottom-left', 'bottom-right'], // 4
      ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'], // 5
      ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'], // 6
    ]

    return positions[value]?.map((pos, idx) => {
      const positionClasses: Record<string, string> = {
        'top-left': 'top-3 left-3',
        'top-right': 'top-3 right-3',
        'middle-left': 'top-1/2 left-3 -translate-y-1/2',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'middle-right': 'top-1/2 right-3 -translate-y-1/2',
        'bottom-left': 'bottom-3 left-3',
        'bottom-right': 'bottom-3 right-3',
      }

      return (
        <div
          key={idx}
          className={`absolute w-3 h-3 bg-black rounded-full ${positionClasses[pos]}`}
        ></div>
      )
    })
  }

  return (
    <div className="flex gap-6 items-center justify-center my-8">
      {/* First Die */}
      <div className="relative w-24 h-24 bg-gradient-to-br from-brand-lime to-green-400 rounded-lg shadow-lg border-3 border-black/20">
        {renderDots(die1)}
        {isRolling && (
          <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="text-3xl font-bold text-gray-400">+</div>

      {/* Second Die */}
      <div className="relative w-24 h-24 bg-gradient-to-br from-brand-lime to-green-400 rounded-lg shadow-lg border-3 border-black/20">
        {renderDots(die2)}
        {isRolling && (
          <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="text-3xl font-bold text-gray-400">=</div>
      <div className={`text-5xl font-bold transition-colors ${isRolling ? 'text-gray-400' : 'text-brand-lime'}`}>
        {isRolling ? '?' : die1 + die2}
      </div>
    </div>
  )
}
