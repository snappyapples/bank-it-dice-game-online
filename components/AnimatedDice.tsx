export default function AnimatedDice() {
  return (
    <div className="inline-flex h-20 w-20 items-center justify-center p-4" style={{ perspective: '800px' }}>
      <div className="dice-container">
        <div className="dice-face face-1">
          <div className="dots-grid">
            <div className="dot col-start-2 row-start-2"></div>
          </div>
        </div>
        <div className="dice-face face-2">
          <div className="dots-grid">
            <div className="dot col-start-3 row-start-1"></div>
            <div className="dot col-start-1 row-start-3"></div>
          </div>
        </div>
        <div className="dice-face face-3">
          <div className="dots-grid">
            <div className="dot col-start-3 row-start-1"></div>
            <div className="dot col-start-2 row-start-2"></div>
            <div className="dot col-start-1 row-start-3"></div>
          </div>
        </div>
        <div className="dice-face face-4">
          <div className="dots-grid">
            <div className="dot col-start-1 row-start-1"></div>
            <div className="dot col-start-3 row-start-1"></div>
            <div className="dot col-start-1 row-start-3"></div>
            <div className="dot col-start-3 row-start-3"></div>
          </div>
        </div>
        <div className="dice-face face-5">
          <div className="dots-grid">
            <div className="dot col-start-1 row-start-1"></div>
            <div className="dot col-start-3 row-start-1"></div>
            <div className="dot col-start-2 row-start-2"></div>
            <div className="dot col-start-1 row-start-3"></div>
            <div className="dot col-start-3 row-start-3"></div>
          </div>
        </div>
        <div className="dice-face face-6">
          <div className="dots-grid">
            <div className="dot col-start-1 row-start-1"></div>
            <div className="dot col-start-3 row-start-1"></div>
            <div className="dot col-start-1 row-start-2"></div>
            <div className="dot col-start-3 row-start-2"></div>
            <div className="dot col-start-1 row-start-3"></div>
            <div className="dot col-start-3 row-start-3"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dice-container {
          width: 80px;
          height: 80px;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateX(-35deg) rotateY(45deg);
          animation: rotate-dice 20s infinite linear;
        }

        @keyframes rotate-dice {
          0% {
            transform: rotateX(-35deg) rotateY(45deg);
          }
          100% {
            transform: rotateX(-35deg) rotateY(405deg);
          }
        }

        .dice-face {
          position: absolute;
          width: 80px;
          height: 80px;
          background-color: #a3e635;
          border: 2px solid #0a0a0a;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px;
          box-sizing: border-box;
        }

        .face-1 {
          transform: rotateY(0deg) translateZ(40px);
        }
        .face-2 {
          transform: rotateY(90deg) translateZ(40px);
        }
        .face-3 {
          transform: rotateY(180deg) translateZ(40px);
        }
        .face-4 {
          transform: rotateY(-90deg) translateZ(40px);
        }
        .face-5 {
          transform: rotateX(90deg) translateZ(40px);
        }
        .face-6 {
          transform: rotateX(-90deg) translateZ(40px);
        }

        .dot {
          width: 12px;
          height: 12px;
          background-color: #0a0a0a;
          border-radius: 50%;
        }

        .dots-grid {
          display: grid;
          width: 100%;
          height: 100%;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          place-items: center;
        }
      `}</style>
    </div>
  )
}
