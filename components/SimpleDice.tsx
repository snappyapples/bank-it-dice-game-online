import React from 'react'

interface SimpleDiceProps {
  value: number
}

export default function SimpleDice({ value }: SimpleDiceProps) {
  // Render dice face with dots
  const renderDots = () => {
    const dots: React.ReactElement[] = []

    // Dot positions based on dice value
    const positions: { [key: number]: string[] } = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
    }

    const dotPositions = positions[value] || []

    dotPositions.forEach((pos, i) => {
      let className = 'absolute w-4 h-4 bg-gray-900 rounded-full '

      switch (pos) {
        case 'top-left':
          className += 'top-3 left-3'
          break
        case 'top-right':
          className += 'top-3 right-3'
          break
        case 'middle-left':
          className += 'top-1/2 -translate-y-1/2 left-3'
          break
        case 'center':
          className += 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          break
        case 'middle-right':
          className += 'top-1/2 -translate-y-1/2 right-3'
          break
        case 'bottom-left':
          className += 'bottom-3 left-3'
          break
        case 'bottom-right':
          className += 'bottom-3 right-3'
          break
      }

      dots.push(<div key={i} className={className} />)
    })

    return dots
  }

  return (
    <div className="relative w-24 h-24 bg-white border-4 border-gray-300 rounded-lg shadow-lg">
      {renderDots()}
    </div>
  )
}
