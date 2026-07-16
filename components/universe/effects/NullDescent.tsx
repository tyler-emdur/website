'use client'
import { useEffect, useState, useRef } from 'react'
import { useUniverseStore } from '@/lib/universe-store'

// ── World 4 ──────────────────────────────────────────────────────────────────
// There is no world 4. CORRIDOR-A is the only gate that points at it. When a
// visitor commits to the traverse, the universe tries to resolve a world that
// was never built, fails, and lets them back out where they started. Nothing
// is explained. Nothing persists but the fact that you looked.
//
// The beats are driven off a requestAnimationFrame loop (paced against the live
// render loop) computing elapsed time, rather than chained setTimeouts — a busy
// WebGL thread bunches timers into catch-up bursts, but reading elapsed on each
// frame stays self-correcting. A setTimeout failsafe guarantees release even if
// rAF is throttled away entirely.

const GLYPHS = ['4', '4', '4', '█', '4', '?', '4', '░', '4', ' ', '4']

// beat boundaries, in ms from the moment you commit to the traverse
const T_RESOLVE = 1100  // WORLD 04 tries to lock
const T_FAIL = 2900     // it doesn't
const T_TRUTH = 3900    // the quiet line
const T_LETGO = 6200    // begin releasing
const T_DONE = 7100     // back at the corridor mouth
const FADE_IN = 650
const FADE_OUT = 800

export default function NullDescent() {
  const active = useUniverseStore(s => s.nullDescent)
  const end = useUniverseStore(s => s.endNullDescent)
  const [phase, setPhase] = useState(0)
  const [op, setOp] = useState(0)
  const [digit, setDigit] = useState('4')
  const skippedRef = useRef(false)
  const elapsedRef = useRef(0)

  useEffect(() => {
    if (!active) { setPhase(0); setOp(0); setDigit('4'); skippedRef.current = false; elapsedRef.current = 0; return }
    let raf = 0
    let start = 0
    let skipStart = 0
    let frame = 0
    const tick = (ts: number) => {
      if (!start) start = ts
      let e = ts - start
      if (skippedRef.current) {                       // pulled out early: jump to the release fade
        if (!skipStart) skipStart = ts
        e = Math.max(e, T_LETGO + (ts - skipStart))
      }
      elapsedRef.current = e

      const p = e < T_RESOLVE ? 1 : e < T_FAIL ? 2 : e < T_TRUTH ? 3 : e < T_LETGO ? 4 : 5
      setPhase(p)
      setOp(e < T_LETGO ? Math.min(1, e / FADE_IN) : Math.max(0, 1 - (e - T_LETGO) / FADE_OUT))
      if (p === 2 && frame % 6 === 0) setDigit(GLYPHS[frame % GLYPHS.length])
      frame++

      if (e >= T_DONE) { end(); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const failsafe = setTimeout(end, T_DONE + 4000)   // never let the overlay stick
    return () => { cancelAnimationFrame(raf); clearTimeout(failsafe) }
  }, [active, end])

  // once you've seen the point, any input pulls you out early
  useEffect(() => {
    if (!active) return
    const skip = () => { if (elapsedRef.current >= T_FAIL) skippedRef.current = true }
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [active])

  if (!active) return null

  return (
    <div
      style={{
        // above drei's <Html> labels in CartographyLayer, which portal to a
        // ~16.7M z-index — otherwise scene text bleeds over the descent.
        position: 'fixed', inset: 0, zIndex: 2147483000, pointerEvents: 'auto',
        backgroundColor: '#04040c',
        backgroundImage: 'radial-gradient(ellipse 120% 90% at 50% 42%, #0a0a16 0%, #04040c 55%, #000000 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: op, overflow: 'hidden',
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        cursor: phase >= 3 ? 'pointer' : 'default',
      }}
    >
      <style>{`
        @keyframes nd-descend {
          0%   { transform: translateY(-70vh) scaleY(0.5); opacity: 0 }
          18%  { opacity: 0.55 }
          82%  { opacity: 0.55 }
          100% { transform: translateY(70vh) scaleY(1.3); opacity: 0 }
        }
        @keyframes nd-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
      `}</style>

      {/* the shaft: thin threads of light falling past you */}
      {[0, 1].map(i => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: `${44 + i * 12}%`,
          width: 1, height: '34vh',
          background: 'linear-gradient(180deg, transparent, rgba(129,140,248,0.6), transparent)',
          animation: `nd-descend ${3.2 + i * 0.8}s linear ${i * 0.6}s infinite`,
        }} />
      ))}

      {/* centre readout */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '0 24px', maxWidth: 520 }}>

        {phase === 1 && (
          <div style={{ animation: 'nd-in 0.6s ease both' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.34em', color: 'rgba(150,160,255,0.55)' }}>
              CORRIDOR-A · TRAVERSE INITIATED
            </div>
            <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.24)', marginTop: 10 }}>
              exit vector: unknown
            </div>
          </div>
        )}

        {phase === 2 && (
          <div style={{ animation: 'nd-in 0.4s ease both' }}>
            <div style={{
              fontSize: 'clamp(30px, 8vw, 58px)', letterSpacing: '0.08em', lineHeight: 1,
              color: 'rgba(200,210,255,0.92)',
              textShadow: '0 0 22px rgba(129,140,248,0.5), 2px 0 rgba(255,0,80,0.25), -2px 0 rgba(0,200,255,0.25)',
            }}>
              WORLD 0<span style={{ display: 'inline-block', minWidth: '0.7em' }}>{digit}</span>
            </div>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(150,160,255,0.5)', marginTop: 16 }}>
              ESTABLISHING LINK
            </div>
          </div>
        )}

        {phase === 3 && (
          <div style={{ animation: 'nd-in 0.4s ease both' }}>
            <div style={{
              fontSize: 'clamp(11px, 2vw, 15px)', letterSpacing: '0.14em',
              color: 'rgba(255,110,110,0.85)', textShadow: '0 0 14px rgba(255,60,60,0.4)',
            }}>
              [ SIGNAL NOT FOUND ]
            </div>
            <div style={{ fontSize: 9, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.32)', marginTop: 14 }}>
              W█RLD 0█ — DOES NOT RESOLVE
            </div>
          </div>
        )}

        {phase >= 4 && (
          <div style={{ animation: 'nd-in 1.2s ease both' }}>
            <div style={{ fontSize: 'clamp(13px, 2.4vw, 17px)', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.85)' }}>
              there is no world 4.
            </div>
            <div style={{
              fontSize: 'clamp(9px, 1.4vw, 11px)', letterSpacing: '0.14em', marginTop: 16,
              color: 'rgba(255,255,255,0.34)', animation: 'nd-in 1.4s ease 1.1s both',
            }}>
              you already knew that.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
