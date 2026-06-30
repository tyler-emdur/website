'use client'
import { useEffect, useRef, useState } from 'react'
import { useWorldStore } from '@/lib/world-store'

const LETTERS_LINE1 = ['T','Y','L','E','R']
const LETTERS_LINE2 = ['E','M','D','U','R']

const AMBIENT: { text: string; x: number; y: number; size: number; rot?: number; opacity: number }[] = [
  { text: 'ENGINEER',    x: 68,  y: 7,  size: 8,  opacity: 0.028 },
  { text: 'BUILDER',     x: 3,   y: 18, size: 7,  rot: -90, opacity: 0.022 },
  { text: '40.015°N',    x: 52,  y: 4,  size: 7,  opacity: 0.02  },
  { text: 'COLORADO',    x: 78,  y: 72, size: 10, opacity: 0.03  },
  { text: 'TRAIL RUNNER',x: 10,  y: 78, size: 7,  opacity: 0.022 },
  { text: '105.270°W',   x: 38,  y: 92, size: 7,  opacity: 0.02  },
  { text: 'SIGNAL',      x: 90,  y: 32, size: 6,  rot: 90, opacity: 0.025 },
  { text: '3:41:22',     x: 22,  y: 42, size: 8,  rot: -90, opacity: 0.022 },
  { text: 'MULTIVERSE',  x: 60,  y: 85, size: 9,  opacity: 0.028 },
  { text: 'ARCHIVE',     x: 43,  y: 3,  size: 7,  opacity: 0.02  },
  { text: 'DIGGER',      x: 84,  y: 18, size: 6,  opacity: 0.022 },
  { text: 'PIKES PEAK',  x: 5,   y: 55, size: 7,  opacity: 0.02  },
  { text: 'DEPTH',       x: 16,  y: 90, size: 8,  rot: 0, opacity: 0.025 },
  { text: 'BOULDER',     x: 74,  y: 50, size: 7,  rot: 90, opacity: 0.022 },
]

// Per-letter drift parameters — different for each letter so motion is non-uniform
const DRIFT = [
  { fx: 0.41, fy: 0.31, px: 0.0,  py: 1.1,  sx: 7,  sy: 4  },
  { fx: 0.55, fy: 0.43, px: 0.9,  py: 0.4,  sx: 5,  sy: 6  },
  { fx: 0.38, fy: 0.52, px: 1.7,  py: 2.2,  sx: 8,  sy: 3  },
  { fx: 0.62, fy: 0.37, px: 2.4,  py: 0.8,  sx: 4,  sy: 7  },
  { fx: 0.47, fy: 0.61, px: 0.6,  py: 1.5,  sx: 9,  sy: 5  },
  { fx: 0.53, fy: 0.44, px: 1.2,  py: 2.6,  sx: 6,  sy: 4  },
  { fx: 0.36, fy: 0.58, px: 2.1,  py: 0.3,  sx: 5,  sy: 8  },
  { fx: 0.68, fy: 0.33, px: 0.3,  py: 1.9,  sx: 7,  sy: 3  },
  { fx: 0.44, fy: 0.49, px: 1.8,  py: 2.0,  sx: 8,  sy: 6  },
  { fx: 0.57, fy: 0.65, px: 0.7,  py: 0.6,  sx: 4,  sy: 5  },
]

export default function World0Surface() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const findSecret  = useWorldStore(s => s.findSecret)
  const [ready,       setReady]       = useState(false)
  const [hovered,     setHovered]     = useState(false)
  const [pixelClicks, setPixelClicks] = useState(0)

  const mouseRef    = useRef({ x: 0, y: 0 })
  const line1Refs   = useRef<(HTMLSpanElement | null)[]>([])
  const line2Refs   = useRef<(HTMLSpanElement | null)[]>([])
  const frameRef    = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth  - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      }
    }
    window.addEventListener('mousemove', onMove)

    function tick() {
      const t  = Date.now() / 1000
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      const all = [
        ...line1Refs.current.map((el, i) => ({ el, d: DRIFT[i] })),
        ...line2Refs.current.map((el, i) => ({ el, d: DRIFT[i + 5] })),
      ]
      all.forEach(({ el, d }) => {
        if (!el || !d) return
        const dx = Math.sin(t * d.fx + d.px) * 1.1 + mx * d.sx
        const dy = Math.cos(t * d.fy + d.py) * 0.7 + my * d.sy
        el.style.transform = `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px)`
      })

      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const enter = (e: React.MouseEvent) => {
    navigateTo(1, { type: 'door', color: '#080806', origin: { x: e.clientX, y: e.clientY } })
  }

  const handlePixel = (e: React.MouseEvent) => {
    e.stopPropagation()
    const n = pixelClicks + 1
    setPixelClicks(n)
    if (n >= 5) {
      findSecret('surface-pixel')
      navigateTo(14, { type: 'chromatic', origin: { x: e.clientX, y: e.clientY } })
    }
  }

  return (
    <>
      <style>{`
        .s0-letter { display: inline-block; will-change: transform; }

        .s0-grain {
          position: fixed; inset: 0; z-index: 50; pointer-events: none;
          opacity: 0.07;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 300px;
          animation: s0-grain-move 0.11s steps(1) infinite;
          mix-blend-mode: overlay;
        }
        @keyframes s0-grain-move {
          0%  { transform: translate(0, 0) }
          14% { transform: translate(-3%, -4%) }
          28% { transform: translate(4%,   2%) }
          43% { transform: translate(-2%,  4%) }
          57% { transform: translate(3%,  -3%) }
          71% { transform: translate(-4%,  1%) }
          85% { transform: translate(2%,  -2%) }
        }

        @media (max-width: 767px), (hover: none) and (pointer: coarse) {
          .s0-mobile  { display: flex !important; }
          .s0-desktop { display: none !important; }
        }
      `}</style>

      <div className="s0-grain" />

      {/* ── Mobile ──────────────────────────────────────────────────── */}
      <div
        className="s0-mobile"
        style={{
          display: 'none', position: 'fixed', inset: 0,
          background: '#080806',
          flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end',
          padding: '10vw 10vw 14vw',
        }}
      >
        <div style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(3rem, 20vw, 6rem)',
          lineHeight: 0.88, letterSpacing: '-0.01em',
          color: '#f0ece4', marginBottom: '6vh',
        }}>
          TYLER<br />EMDUR
        </div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, letterSpacing: '0.28em',
          color: 'rgba(240,236,228,0.28)', lineHeight: 2.2,
          textTransform: 'uppercase',
        }}>
          Desktop only<br />
          healthreinvented@gmail.com
        </div>
      </div>

      {/* ── Desktop ─────────────────────────────────────────────────── */}
      <div
        className="s0-desktop"
        onClick={enter}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', position: 'fixed', inset: 0,
          background: '#080806',
          overflow: 'hidden', userSelect: 'none',
        }}
      >
        {/* Ambient typographic debris */}
        {AMBIENT.map((a, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${a.x}%`, top: `${a.y}%`,
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: a.size, letterSpacing: '0.35em',
              color: `rgba(240,236,228,${a.opacity})`,
              transform: a.rot ? `rotate(${a.rot}deg)` : undefined,
              transformOrigin: 'top left',
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}
          >
            {a.text}
          </div>
        ))}

        {/* Main name block — bottom left */}
        <div style={{
          position: 'absolute', left: '7vw', bottom: '10vh',
          opacity: ready ? 1 : 0,
          transform: ready ? 'none' : 'translateY(14px)',
          transition: 'opacity 1.6s ease, transform 1.6s ease',
        }}>
          {/* TYLER */}
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(3.5rem, 13vw, 15rem)',
            lineHeight: 0.88, letterSpacing: '-0.01em',
            color: '#f0ece4', display: 'flex',
          }}>
            {LETTERS_LINE1.map((l, i) => (
              <span
                key={i}
                ref={el => { line1Refs.current[i] = el }}
                className="s0-letter"
              >{l}</span>
            ))}
          </div>

          {/* EMDUR */}
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(3.5rem, 13vw, 15rem)',
            lineHeight: 0.88, letterSpacing: '-0.01em',
            color: '#f0ece4', display: 'flex',
          }}>
            {LETTERS_LINE2.map((l, i) => (
              <span
                key={i}
                ref={el => { line2Refs.current[i] = el }}
                className="s0-letter"
              >{l}</span>
            ))}
          </div>

          {/* Enter prompt */}
          <div style={{
            marginTop: '5vh',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10, letterSpacing: '0.42em',
            color: hovered ? 'rgba(240,236,228,0.55)' : 'rgba(240,236,228,0.18)',
            textTransform: 'uppercase',
            transition: 'color 1s ease',
          }}>
            enter ↗
          </div>
        </div>

        {/* Top-right metadata */}
        <div style={{
          position: 'absolute', top: '7vh', right: '6vw',
          textAlign: 'right',
          opacity: ready ? 1 : 0,
          transition: 'opacity 2.2s 1s ease',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9, letterSpacing: '0.22em',
          color: 'rgba(240,236,228,0.22)', lineHeight: 2.4,
          textTransform: 'uppercase', pointerEvents: 'none',
        }}>
          Boulder, CO<br />
          Software<br />
          2026<br />
          16 worlds inside<br />
          <span style={{ color: 'rgba(240,236,228,0.12)', fontSize: 8 }}>work in progress</span>
        </div>

        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 90% 80% at 40% 60%, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }} />

        {/* Hidden pixel easter egg */}
        <div
          onClick={handlePixel}
          style={{
            position: 'fixed', bottom: 12, right: 12,
            width: 5, height: 5, zIndex: 60,
            background: pixelClicks > 0
              ? 'rgba(240,236,228,0.4)'
              : 'rgba(240,236,228,0.05)',
            transition: 'background 0.4s',
          }}
        />
      </div>
    </>
  )
}
