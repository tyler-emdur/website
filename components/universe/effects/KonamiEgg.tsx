'use client'
import { useEffect, useState } from 'react'

const SEQUENCE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

export default function KonamiEgg() {
  const [progress, setProgress] = useState(0)
  const [activated, setActivated] = useState(false)
  const [phase, setPhase] = useState(0)

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
    const t = setInterval(() => setPhase(p => p + 1), 80)
    const done = setTimeout(() => { setActivated(false); setPhase(0) }, 5000)
    return () => { clearInterval(t); clearTimeout(done) }
  }, [activated])

  if (!activated) return null

  const chars = '01アイウエオ█▓▒░ΨΩΔ∞≠≈'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      pointerEvents: 'none', overflow: 'hidden',
      fontFamily: 'var(--font-mono)',
    }}>
      {/* Matrix rain */}
      {Array.from({ length: 30 }).map((_, col) => (
        <div key={col} style={{
          position: 'absolute',
          left: `${col * 3.4}%`,
          top: 0,
          fontSize: 12,
          letterSpacing: '0.1em',
          color: '#A855F7',
          opacity: 0.6 + Math.random() * 0.4,
          animation: `matrixDrop ${1.5 + Math.random() * 2}s linear infinite`,
          animationDelay: `${-Math.random() * 2}s`,
          whiteSpace: 'pre',
          lineHeight: 1.4,
        }}>
          {Array.from({ length: 30 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join('\n')}
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
        <div style={{ fontSize: '0.55em', marginTop: 12, opacity: 0.5, letterSpacing: '0.5em' }}>SECTOR 05-Ψ · CLEARANCE GRANTED</div>
      </div>

      <style>{`
        @keyframes matrixDrop {
          from { transform: translateY(-100vh); }
          to   { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  )
}
