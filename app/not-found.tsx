'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

// Every other dead end on this site is furnished. This one was the stock Next
// screen — system font, no way back — which is the one page a mistyped URL or
// a stale link actually lands on. Same survey voice as the endpoint: a
// coordinate that was catalogued and then wasn't there.

function Static() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const cx = cv.getContext('2d')
    if (!cx) return
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const resize = () => {
      cv.width = cv.clientWidth
      cv.height = cv.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const { width: W, height: H } = cv
      cx.clearRect(0, 0, W, H)
      cx.fillStyle = '#4ade80'
      for (let i = 0; i < 260; i++) {
        cx.globalAlpha = Math.random() * 0.16
        cx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5)
      }
      cx.globalAlpha = 1
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}
    />
  )
}

export default function NotFound() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#04060a', color: '#4ade80',
      fontFamily: '"Space Mono", ui-monospace, monospace',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <Static />
      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, opacity: 0.5, textTransform: 'uppercase' }}>
          survey te-ø · no carrier
        </div>
        <h1 style={{
          fontSize: 'clamp(38px, 9vw, 68px)', letterSpacing: 6, margin: '18px 0 0',
          fontWeight: 400, textShadow: '0 0 18px rgba(74,222,128,0.35)',
        }}>
          404
        </h1>
        <div style={{ fontSize: 13, letterSpacing: 2, opacity: 0.85, marginTop: 6 }}>
          COORDINATE NOT ON FILE
        </div>
        <p style={{
          fontSize: 12, lineHeight: 1.9, opacity: 0.5, marginTop: 22,
          color: 'rgba(255,255,255,0.65)',
        }}>
          Something was catalogued here. It isn&apos;t anymore.
          <br />
          The signal keeps transmitting from the origin.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block', marginTop: 30, padding: '9px 20px',
            border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80',
            fontSize: 11, letterSpacing: 2, textDecoration: 'none', textTransform: 'uppercase',
          }}
        >
          ← return to the signal
        </Link>
      </div>
    </div>
  )
}
