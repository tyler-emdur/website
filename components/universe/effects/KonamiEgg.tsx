'use client'
import { useEffect, useRef, useState } from 'react'
import { useUniverseStore } from '@/lib/universe-store'
import { getAllObjects } from '@/lib/universe-store'

const SEQUENCE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

// The animation CSS, injected once via useEffect so it doesn't accumulate on remounts
const MATRIX_KEYFRAMES = `
@keyframes matrixDrop {
  from { transform: translateY(-100vh); }
  to   { transform: translateY(100vh); }
}
`

export default function KonamiEgg() {
  const [progress, setProgress] = useState(0)
  const [activated, setActivated] = useState(false)
  const [phase, setPhase] = useState(0)
  const styleRef = useRef<HTMLStyleElement | null>(null)
  const { discover, flyTo } = useUniverseStore()

  // Inject animation CSS once, clean up on unmount
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = MATRIX_KEYFRAMES
    document.head.appendChild(el)
    styleRef.current = el
    return () => { el.remove() }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      setProgress(p => {
        if (e.key === SEQUENCE[p]) {
          const next = p + 1
          if (next === SEQUENCE.length) {
            setActivated(true)
            return 0
          }
          return next
        }
        return e.key === SEQUENCE[0] ? 1 : 0
      })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!activated) return

    // Actually unlock the quantum gate — discover the lab wormhole and fly there
    const objs = getAllObjects()
    const quantumGate = objs.find(o => o.id === 'lab-quantum')
    if (quantumGate) {
      discover(quantumGate)
      // Fly toward it after a short delay (let the animation play first)
      setTimeout(() => {
        flyTo(
          [quantumGate.position[0], quantumGate.position[1], quantumGate.position[2] + 300],
          [quantumGate.position[0], quantumGate.position[1], quantumGate.position[2]]
        )
      }, 3000)
    }

    const t = setInterval(() => setPhase(p => p + 1), 80)
    const done = setTimeout(() => { setActivated(false); setPhase(0) }, 5000)
    return () => { clearInterval(t); clearTimeout(done) }
  }, [activated, discover, flyTo])

  if (!activated) return null

  const chars = '01アイウエオ█▓▒░ΨΩΔ∞≠≈'
  // Use phase to seed deterministic character selection
  const getChar = (col: number, row: number) =>
    chars[(col * 13 + row * 7 + phase) % chars.length]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      pointerEvents: 'none', overflow: 'hidden',
      fontFamily: 'var(--font-mono)',
    }}>
      {/* Matrix rain — use phase-seeded characters to avoid hydration issues */}
      {Array.from({ length: 30 }).map((_, col) => (
        <div key={col} style={{
          position: 'absolute',
          left: `${col * 3.4}%`,
          top: 0,
          fontSize: 12,
          letterSpacing: '0.1em',
          color: '#A855F7',
          opacity: 0.6 + ((col * 17) % 100) / 250,
          animation: `matrixDrop ${1.5 + (col % 5) * 0.4}s linear infinite`,
          animationDelay: `${-(col % 7) * 0.3}s`,
          whiteSpace: 'pre',
          lineHeight: 1.4,
        }}>
          {Array.from({ length: 30 }).map((_, row) => getChar(col, row)).join('\n')}
        </div>
      ))}

      {/* Center message */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: '#fff',
        fontSize: 'clamp(14px, 2vw, 20px)',
        letterSpacing: '0.3em',
        textShadow: '0 0 30px #A855F7',
      }}>
        <div style={{ fontSize: '3em', marginBottom: 16 }}>⬆⬆⬇⬇⬅➡⬅➡</div>
        <div>QUANTUM GATE UNLOCKED</div>
        <div style={{ fontSize: '0.55em', marginTop: 12, opacity: 0.5, letterSpacing: '0.5em' }}>
          SECTOR 05-Ψ · CLEARANCE GRANTED · NAVIGATING
        </div>
      </div>
    </div>
  )
}
