'use client'
import { useEffect, useState } from 'react'
import { useWorldStore } from '@/lib/world-store'

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
    <div
      onClick={enter}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed', inset: 0,
        background: '#f4f1ec',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{
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
      </div>

      {/* Hidden rainbow pixel — wrong dimension leaking through */}
      <div
        onClick={handlePixel}
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          width: 8,
          height: 8,
          background: pixelClicks > 0
            ? `linear-gradient(135deg, #FF006E, #FFBE0B, #06FFA5)`
            : 'rgba(28,26,23,0.08)',
          cursor: 'crosshair',
          imageRendering: 'pixelated',
          boxShadow: pixelClicks > 2 ? '0 0 12px rgba(255,0,110,0.5)' : 'none',
          transition: 'background 0.2s, box-shadow 0.3s',
        }}
        title=""
      />
    </div>
  )
}
