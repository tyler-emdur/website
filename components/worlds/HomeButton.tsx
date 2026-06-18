'use client'
import { useState } from 'react'
import { useWorldStore } from '@/lib/world-store'

export default function HomeButton() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={() => navigateTo(1, { type: 'fold' })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 200,
        background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
        fontFamily: '"Space Mono", monospace',
        fontSize: 10,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        padding: '10px 18px',
        cursor: 'pointer',
        transition: 'color 0.2s, border-color 0.2s, background 0.2s',
        backdropFilter: 'blur(6px)',
        borderColor: hovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
        minWidth: 120,
      }}
    >
      ← universe
    </button>
  )
}
