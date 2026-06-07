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
        background: 'rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)',
        fontFamily: '"Space Mono", monospace',
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        padding: '7px 13px',
        cursor: 'pointer',
        transition: 'color 0.25s, border-color 0.25s',
        backdropFilter: 'blur(6px)',
        borderColor: hovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
      }}
    >
      ← universe
    </button>
  )
}
