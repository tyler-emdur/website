'use client'
import { useEffect, useRef, useState } from 'react'
import { useWorldStore } from '@/lib/world-store'

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width = W
    canvas.height = H

    const N = 90
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 1 + Math.random() * 1.4,
    }))

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W; canvas.height = H
    }
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)

    let raf = 0
    function draw() {
      ctx.fillStyle = '#f4f1ec'
      ctx.fillRect(0, 0, W, H)

      pts.forEach(p => {
        const dx = mouse.current.x - p.x
        const dy = mouse.current.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          p.vx -= (dx / dist) * 0.04
          p.vy -= (dy / dist) * 0.04
        }
        p.vx *= 0.992
        p.vy *= 0.992
        p.x = (p.x + p.vx + W) % W
        p.y = (p.y + p.vy + H) % H
      })

      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 110) {
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(28,26,23,${0.06 * (1 - d / 110)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      pts.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(28,26,23,0.18)'
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}

export default function World0Surface() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const findSecret = useWorldStore(s => s.findSecret)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pixelClicks, setPixelClicks] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120)
    return () => clearTimeout(t)
  }, [])

  const enter = (e: React.MouseEvent) => {
    navigateTo(1, { type: 'door', color: '#f4f1ec', origin: { x: e.clientX, y: e.clientY } })
  }

  const handlePixel = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = pixelClicks + 1
    setPixelClicks(next)
    if (next >= 5) {
      findSecret('surface-pixel')
      navigateTo(14, { type: 'chromatic', origin: { x: e.clientX, y: e.clientY } })
    }
  }

  return (
    <>
      {/* Mobile warning — inline display:none guarantees hidden on desktop,
          !important in media query overrides inline to show on mobile */}
      <style>{`
        @media (max-width: 767px), (hover: none) and (pointer: coarse) {
          .surface-mobile  { display: flex !important; }
          .surface-desktop { display: none !important; }
        }
      `}</style>

      {/* Mobile screen — hidden by default via inline style */}
      <div
        className="surface-mobile"
        style={{
          display: 'none',
          position: 'fixed', inset: 0,
          background: '#f4f1ec',
          flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <div style={{
          fontFamily: '"IM Fell English", Georgia, serif',
          fontSize: 'clamp(1.6rem, 6vw, 2.2rem)',
          fontWeight: 400,
          color: '#1c1a17',
          letterSpacing: '-0.02em',
          marginBottom: 36,
        }}>
          Tyler Emdur
        </div>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 14,
          color: 'rgba(28,26,23,0.5)',
          letterSpacing: '0.04em',
          lineHeight: 2,
          maxWidth: 280,
        }}>
          this site is best experienced<br />on a desktop or laptop.
        </div>
        <div style={{
          marginTop: 24,
          fontFamily: 'Georgia, serif',
          fontSize: 11,
          color: 'rgba(28,26,23,0.28)',
          letterSpacing: '0.08em',
          lineHeight: 1.8,
        }}>
          please switch to a computer<br />for the full experience.
        </div>
        <a
          href="mailto:healthreinvented@gmail.com"
          style={{
            display: 'block',
            marginTop: 28,
            fontFamily: 'Georgia, serif',
            fontSize: 11,
            color: 'rgba(28,26,23,0.35)',
            letterSpacing: '0.06em',
            textDecoration: 'none',
          }}
        >
          healthreinvented@gmail.com
        </a>
      </div>

      {/* Desktop screen */}
      <div
        className="surface-desktop"
        onClick={enter}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          position: 'fixed', inset: 0,
          background: '#f4f1ec',
          flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        <ParticleField />

        <div style={{
          position: 'relative', zIndex: 1,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 1s ease, transform 1s ease',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: '"IM Fell English", Georgia, serif',
            fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
            fontWeight: 400,
            color: '#1c1a17',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            Tyler Emdur
          </div>

          <div style={{
            marginTop: 28,
            fontFamily: 'Georgia, serif',
            fontSize: 13,
            color: hovered ? 'rgba(28,26,23,0.55)' : 'rgba(28,26,23,0.35)',
            letterSpacing: '0.18em',
            transition: 'color 0.6s ease',
            textTransform: 'lowercase',
          }}>
            click to enter
          </div>

          <div style={{
            marginTop: 48,
            fontFamily: 'Georgia, serif',
            fontSize: 11,
            color: 'rgba(28,26,23,0.28)',
            letterSpacing: '0.08em',
            textAlign: 'center',
            lineHeight: 1.6,
            textTransform: 'lowercase',
          }}>
            a work in progress · art coding project
          </div>
          <div style={{
            marginTop: 12,
            fontFamily: 'Georgia, serif',
            fontSize: 10,
            color: 'rgba(28,26,23,0.16)',
            letterSpacing: '0.12em',
            textAlign: 'center',
            textTransform: 'lowercase',
          }}>
            16 gates · field notes inside
          </div>
        </div>

        {/* Hidden rainbow pixel */}
        <div
          onClick={handlePixel}
          style={{
            position: 'fixed',
            bottom: 12, right: 12,
            width: 8, height: 8,
            background: pixelClicks > 0
              ? 'linear-gradient(135deg, #FF006E, #FFBE0B, #06FFA5)'
              : 'rgba(28,26,23,0.08)',
            imageRendering: 'pixelated',
            boxShadow: pixelClicks > 2 ? '0 0 12px rgba(255,0,110,0.5)' : 'none',
            transition: 'background 0.2s, box-shadow 0.3s',
            zIndex: 2,
          }}
        />
      </div>
    </>
  )
}
