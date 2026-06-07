'use client'
import { useEffect, useState } from 'react'
import { useWorldStore } from '@/lib/world-store'

export default function World0Surface() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120)
    return () => clearTimeout(t)
  }, [])

  const enter = (e: React.MouseEvent) => {
    navigateTo(1, { type: 'door', color: '#f4f1ec', origin: { x: e.clientX, y: e.clientY } })
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
    </div>
  )
}
