'use client'

import { useEffect, useState, useRef } from 'react'

interface ThreeDDiceProps {
  value: number
  isRolling: boolean
  delay?: number // Delay in ms before this die starts rolling
  duration?: number // Duration of the roll animation in ms
  size?: number // Size in pixels (default 100, use smaller for mobile)
}

export default function ThreeDDice({ value, isRolling, delay = 0, duration = 2500, size = 100 }: ThreeDDiceProps) {
  const translateZ = size / 2
  const [displayValue, setDisplayValue] = useState(value)
  const diceRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<Animation | null>(null)

  // Map die value to rotation angles (to show face flat to viewer)
  // Face positions: 1=front, 2=right, 3=left, 4=top, 5=bottom, 6=back
  const getRotation = (val: number) => {
    switch (val) {
      case 1: return { x: 0, y: 0 }       // Front face - no rotation
      case 2: return { x: 0, y: -90 }     // Right face - rotate cube left
      case 3: return { x: 0, y: 90 }      // Left face - rotate cube right
      case 4: return { x: -90, y: 0 }     // Top face - tilt cube down
      case 5: return { x: 90, y: 0 }      // Bottom face - tilt cube up
      case 6: return { x: 0, y: 180 }     // Back face - rotate 180
      default: return { x: 0, y: 0 }
    }
  }

  // Store the target value in a ref so animation can access latest value without restarting
  const targetValueRef = useRef(value)
  targetValueRef.current = value

  useEffect(() => {
    if (!diceRef.current) return

    if (isRolling) {
      const startAnimation = () => {
        if (!diceRef.current) return

        // Get the final rotation for the target value
        const finalRotation = getRotation(targetValueRef.current)

        // Calculate spins that will land exactly on the target face
        // Use whole number of spins + the final rotation to ensure correct landing
        const baseSpinsX = Math.floor(Math.random() * 3) + 6 // 6-8 full rotations
        const baseSpinsY = Math.floor(Math.random() * 4) + 8 // 8-11 full rotations

        // Total rotation = full spins + final position
        const totalX = (baseSpinsX * 360) + finalRotation.x
        const totalY = (baseSpinsY * 360) + finalRotation.y

        console.log(`[Dice] Animating to value ${targetValueRef.current}, final rotation: (${finalRotation.x}, ${finalRotation.y})`)

        // Cancel any existing animation
        if (animationRef.current) {
          animationRef.current.cancel()
        }

        // Single animation that spins and lands on correct face
        animationRef.current = diceRef.current.animate(
          [
            { transform: 'rotateX(0deg) rotateY(0deg)' },
            { transform: `rotateX(${totalX}deg) rotateY(${totalY}deg)` }
          ],
          {
            duration: duration,
            easing: 'cubic-bezier(0.15, 0, 0.2, 1)', // Fast start, slow end for natural deceleration
            fill: 'forwards'
          }
        )

        animationRef.current.onfinish = () => {
          console.log(`[Dice] Animation finished, showing value ${targetValueRef.current}`)
          setDisplayValue(targetValueRef.current)
          // Set the final transform to the normalized rotation (without all the extra spins)
          if (diceRef.current) {
            diceRef.current.style.transform = `rotateX(${finalRotation.x}deg) rotateY(${finalRotation.y}deg)`
          }
          animationRef.current = null
        }
      }

      if (delay > 0) {
        console.log(`[Dice] Will start in ${delay}ms`)
        const timer = setTimeout(startAnimation, delay)
        return () => clearTimeout(timer)
      } else {
        startAnimation()
      }
    } else {
      // Not rolling - show the current value
      if (animationRef.current) {
        animationRef.current.cancel()
        animationRef.current = null
      }
      const rotation = getRotation(value)
      if (diceRef.current) {
        diceRef.current.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
      }
      setDisplayValue(value)
    }
  }, [isRolling, delay, duration]) // Removed 'value' from dependencies

  // Update display when value prop changes (when not rolling)
  useEffect(() => {
    if (!isRolling) {
      setDisplayValue(value)
      const rotation = getRotation(value)
      if (diceRef.current) {
        diceRef.current.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
      }
    }
  }, [value, isRolling])

  const dotSize = Math.max(8, size * 0.12) // Scale dots proportionally
  const padding = Math.max(8, size * 0.12)
  const borderRadius = Math.max(8, size * 0.12)

  return (
    <div className="perspective-container" style={{ perspective: '1000px' }}>
      <div
        ref={diceRef}
        className="dice-3d"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${getRotation(displayValue).x}deg) rotateY(${getRotation(displayValue).y}deg)`,
        }}
      >
        {/* Face 1 (front) */}
        <div className="dice-face" style={{ transform: `rotateY(0deg) translateZ(${translateZ}px)` }}>
          <div className="dot" style={{ gridColumn: '2', gridRow: '2' }}></div>
        </div>

        {/* Face 2 (right) */}
        <div className="dice-face" style={{ transform: `rotateY(90deg) translateZ(${translateZ}px)` }}>
          <div className="dot" style={{ gridColumn: '1', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '3' }}></div>
        </div>

        {/* Face 3 (left) */}
        <div className="dice-face" style={{ transform: `rotateY(-90deg) translateZ(${translateZ}px)` }}>
          <div className="dot" style={{ gridColumn: '1', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '2', gridRow: '2' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '3' }}></div>
        </div>

        {/* Face 4 (top) */}
        <div className="dice-face" style={{ transform: `rotateX(90deg) translateZ(${translateZ}px)` }}>
          <div className="dot" style={{ gridColumn: '1', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '1', gridRow: '3' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '3' }}></div>
        </div>

        {/* Face 5 (bottom) */}
        <div className="dice-face" style={{ transform: `rotateX(-90deg) translateZ(${translateZ}px)` }}>
          <div className="dot" style={{ gridColumn: '1', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '2', gridRow: '2' }}></div>
          <div className="dot" style={{ gridColumn: '1', gridRow: '3' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '3' }}></div>
        </div>

        {/* Face 6 (back) */}
        <div className="dice-face" style={{ transform: `rotateY(180deg) translateZ(${translateZ}px)` }}>
          <div className="dot" style={{ gridColumn: '1', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '1' }}></div>
          <div className="dot" style={{ gridColumn: '1', gridRow: '2' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '2' }}></div>
          <div className="dot" style={{ gridColumn: '1', gridRow: '3' }}></div>
          <div className="dot" style={{ gridColumn: '3', gridRow: '3' }}></div>
        </div>
      </div>

      <style jsx>{`
        .dice-face {
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(145deg, #ffffff, #e6e6e6);
          border: 2px solid #333;
          border-radius: ${borderRadius}px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          padding: ${padding}px;
          backface-visibility: visible;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .dot {
          width: ${dotSize}px;
          height: ${dotSize}px;
          background: #1a1a1a;
          border-radius: 50%;
          margin: auto;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  )
}
