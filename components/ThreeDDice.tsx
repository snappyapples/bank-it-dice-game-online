'use client'

import { useEffect, useState } from 'react'

interface ThreeDDiceProps {
  value: number
  isRolling: boolean
  delay?: number // Delay in ms before this die starts rolling
}

export default function ThreeDDice({ value, isRolling, delay = 0 }: ThreeDDiceProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isRolling && delay > 0) {
      // Delay before starting animation
      const timer = setTimeout(() => {
        setIsAnimating(true)
      }, delay)
      return () => clearTimeout(timer)
    } else if (isRolling) {
      setIsAnimating(true)
    } else {
      setIsAnimating(false)
    }
  }, [isRolling, delay])

  // Map die value to rotation angles
  const getRotation = (val: number) => {
    switch (val) {
      case 1: return 'rotateX(0deg) rotateY(0deg)'
      case 2: return 'rotateX(0deg) rotateY(90deg)'
      case 3: return 'rotateX(0deg) rotateY(-90deg)'
      case 4: return 'rotateX(90deg) rotateY(0deg)'
      case 5: return 'rotateX(-90deg) rotateY(0deg)'
      case 6: return 'rotateX(180deg) rotateY(0deg)'
      default: return 'rotateX(0deg) rotateY(0deg)'
    }
  }

  return (
    <div className="perspective-container" style={{ perspective: '1000px' }}>
      <div
        className={`dice-3d ${isAnimating ? 'rolling' : ''}`}
        style={{
          transform: isAnimating ? undefined : getRotation(value),
          width: '100px',
          height: '100px',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: isAnimating ? 'none' : 'transform 0.6s ease-out',
        }}
      >
        {/* Face 1 (front) */}
        <div className="dice-face dice-face-1" style={{ transform: 'rotateY(0deg) translateZ(50px)' }}>
          <div className="dot" style={{ gridColumn: '2', gridRow: '2' }}></div>
        </div>

        {/* Face 2 (right) */}
        <div className="dice-face dice-face-2" style={{ transform: 'rotateY(90deg) translateZ(50px)' }}>
          <div className="dot" style={{ gridColumn: '1', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '3' }}></div>
        </div>

        {/* Face 3 (left) */}
        <div className="dice-face dice-face-3" style={{ transform: 'rotateY(-90deg) translateZ(50px)' }}>
          <div className="dot" style={{ gridColumn: '1', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '2', gridRow: '2' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '3' }}></div>
        </div>

        {/* Face 4 (top) */}
        <div className="dice-face dice-face-4" style={{ transform: 'rotateX(90deg) translateZ(50px)' }}>
          <div className="dot" style={{ gridColumn: '1', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '1', gridRow: '3' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '3' }}></div>
        </div>

        {/* Face 5 (bottom) */}
        <div className="dice-face dice-face-5" style={{ transform: 'rotateX(-90deg) translateZ(50px)' }}>
          <div className="dot" style={{ gridColumn: '1', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '2', gridRow: '2' }}></div>
          <div className="dot" style={{ gridColumn: '1', gridRow: '3' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '3' }}></div>
        </div>

        {/* Face 6 (back) */}
        <div className="dice-face dice-face-6" style={{ transform: 'rotateY(180deg) translateZ(50px)' }}>
          <div className="dot" style={{ gridColumn: '1', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '1', gridRow: '2' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '2' }}></div>
          <div className="dot" style={{ gridColumn: '1', gridRow: '3' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '3' }}></div>
        </div>
      </div>

      <style jsx>{`
        .dice-3d.rolling {
          animation: roll 2.5s ease-out;
        }

        @keyframes roll {
          0% {
            transform: rotateX(0deg) rotateY(0deg);
          }
          100% {
            transform: rotateX(${Math.random() * 4 + 3}turn) rotateY(${Math.random() * 4 + 3}turn);
          }
        }

        .dice-face {
          position: absolute;
          width: 100px;
          height: 100px;
          background: linear-gradient(145deg, #ffffff, #e6e6e6);
          border: 2px solid #333;
          border-radius: 12px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          padding: 12px;
          backface-visibility: visible;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .dot {
          width: 12px;
          height: 12px;
          background: #1a1a1a;
          border-radius: 50%;
          margin: auto;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  )
}
