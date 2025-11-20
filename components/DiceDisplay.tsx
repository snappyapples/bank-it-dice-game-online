interface DiceDisplayProps {
  die1: number
  die2: number
  isRolling?: boolean
}

export default function DiceDisplay({ die1, die2, isRolling = false }: DiceDisplayProps) {
  return (
    <div className="flex gap-4 items-center justify-center my-6">
      <div
        className={`
          w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center
          text-3xl font-bold text-gray-800 border-2 border-gray-300 transition-transform
          ${isRolling ? 'animate-spin' : ''}
        `}
      >
        {isRolling ? '?' : die1}
      </div>
      <div className="text-2xl font-bold text-gray-400">+</div>
      <div
        className={`
          w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center
          text-3xl font-bold text-gray-800 border-2 border-gray-300 transition-transform
          ${isRolling ? 'animate-spin' : ''}
        `}
      >
        {isRolling ? '?' : die2}
      </div>
      <div className="text-2xl font-bold text-gray-400">=</div>
      <div className="text-4xl font-bold text-brand-lime">
        {isRolling ? '?' : die1 + die2}
      </div>
    </div>
  )
}
