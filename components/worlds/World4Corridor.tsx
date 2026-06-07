'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'

const DOORS = [
  { label: 'BEFORE THE DECISION', sublabel: 'you know which one', world: 1 as const, portal: 'fold' as const, x: 15 },
  { label: 'AFTER THE SOUND',     sublabel: 'nothing was the same', world: 5 as const, portal: 'rotate' as const, x: 35 },
  { label: 'THE SECOND TUESDAY',  sublabel: 'of a month you\'d rather not name', world: 7 as const, portal: 'cursor-flood' as const, x: 55 },
  { label: 'WHAT YOU WERE LOOKING FOR', sublabel: 'exactly that', world: 9 as const, portal: 'expand-white' as const, x: 75 },
  { label: 'DO NOT',              sublabel: '← locked', world: 0 as const, portal: 'fold' as const, x: 90 },
]

export default function World4Corridor() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [scrollX, setScrollX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [scrollStart, setScrollStart] = useState(0)
  const [floorText, setFloorText] = useState('')
  const [doNotTries, setDoNotTries] = useState(0)
  const [lockedShake, setLockedShake] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const targetName = 'TYLER EMDUR'
  const totalWidth = 3000
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200

  // Floor text gradually resolves to Tyler's name over 3 mins
  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ·'
    let progress = 0
    const iv = setInterval(() => {
      progress = Math.min(progress + 1, targetName.length)
      let out = ''
      for (let i = 0; i < targetName.length; i++) {
        out += i < progress ? targetName[i] : chars[Math.floor(Math.random() * chars.length)]
      }
      setFloorText(out)
    }, 180000 / targetName.length / 30)
    return () => clearInterval(iv)
  }, [])

  // Randomize floor text continuously
  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—'
    let resolved = 0
    const iv = setInterval(() => {
      if (resolved >= targetName.length) { clearInterval(iv); return }
      const now = Date.now()
      const frac = Math.min((now % 180000) / 180000, 1)
      resolved = Math.floor(frac * targetName.length)
      let out = ''
      for (let i = 0; i < targetName.length; i++) {
        out += i < resolved ? targetName[i] : chars[Math.floor(Math.random() * chars.length)]
      }
      setFloorText(out)
    }, 300)
    return () => clearInterval(iv)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart(e.clientX)
    setScrollStart(scrollX)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const delta = e.clientX - dragStart
    const newX = Math.max(0, Math.min(totalWidth - screenWidth, scrollStart - delta))
    setScrollX(newX)
  }, [isDragging, dragStart, scrollStart, screenWidth])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleDoorClick = useCallback((door: typeof DOORS[0], e: React.MouseEvent) => {
    if (door.label === 'DO NOT') {
      const tries = doNotTries + 1
      setDoNotTries(tries)
      setLockedShake(true)
      setTimeout(() => setLockedShake(false), 500)
      if (tries >= 3) {
        setTimeout(() => navigateTo(0, { type: 'fold' }), 600)
      }
      return
    }
    navigateTo(door.world, { type: door.portal, origin: { x: e.clientX, y: e.clientY } })
  }, [doNotTries, navigateTo])

  // Perspective calculation based on scroll position
  const centerX = scrollX + screenWidth / 2
  const vp = { x: 0.5, y: 0.4 } // vanishing point (relative)

  return (
    <div
      data-world="4"
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0,
        background: '#0a0806',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        fontFamily: '"Oxanium", monospace',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Corridor - rendered as perspective grid */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-scrollX}px)`, width: totalWidth }}>
        <svg width={totalWidth} height="100vh" style={{ position: 'absolute', top: 0, left: 0 }}>
          {/* Floor perspective lines */}
          {Array.from({ length: 20 }).map((_, i) => {
            const x = i * (totalWidth / 19)
            const topX = totalWidth * vp.x + (x - totalWidth * vp.x) * 0.15
            return (
              <g key={i}>
                <line x1={topX} y1="40vh" x2={x} y2="100vh" stroke="rgba(120,80,40,0.12)" strokeWidth="0.5" />
              </g>
            )
          })}
          {/* Horizontal grid lines */}
          {Array.from({ length: 12 }).map((_, i) => {
            const y = 40 + (i / 11) * 60 // percent of vh
            const squeeze = 1 - (i / 11) * 0.85
            return (
              <line key={i}
                x1={totalWidth * 0.5 - (totalWidth * 0.5 * squeeze)}
                y1={`${y}vh`}
                x2={totalWidth * 0.5 + (totalWidth * 0.5 * squeeze)}
                y2={`${y}vh`}
                stroke={`rgba(120,80,40,${0.05 + (1 - i/11) * 0.1})`}
                strokeWidth="0.5"
              />
            )
          })}
          {/* Ceiling lines */}
          {Array.from({ length: 20 }).map((_, i) => {
            const x = i * (totalWidth / 19)
            const topX = totalWidth * vp.x + (x - totalWidth * vp.x) * 0.15
            return <line key={i} x1={topX} y1="0" x2={x} y2="40vh" stroke="rgba(120,80,40,0.08)" strokeWidth="0.5" />
          })}
        </svg>

        {/* Ceiling light strip */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '40vh', background: 'linear-gradient(180deg, rgba(255,200,100,0.04) 0%, transparent 100%)', pointerEvents: 'none' }} />

        {/* DOORS */}
        {DOORS.map((door) => {
          const doorCenterX = (door.x / 100) * totalWidth
          const distFromCenter = Math.abs(doorCenterX - centerX)
          const scale = Math.max(0.3, 1 - distFromCenter / 1000)
          const perspective = 1 - (distFromCenter / totalWidth) * 0.5
          const doorWidth = 90 * scale
          const doorHeight = Math.min(window.innerHeight * 0.45, 280) * scale
          const doorY = window.innerHeight * 0.4 - doorHeight

          return (
            <div
              key={door.label}
              onClick={(e) => handleDoorClick(door, e)}
              style={{
                position: 'absolute',
                left: doorCenterX - doorWidth / 2,
                top: doorY,
                width: doorWidth,
                height: doorHeight,
                background: door.label === 'DO NOT' ? 'rgba(30,5,5,0.95)' : 'rgba(20,15,8,0.9)',
                border: `2px solid rgba(${door.label === 'DO NOT' ? '200,50,50' : '120,80,40'},${0.2 + scale * 0.4})`,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                animation: door.label === 'DO NOT' && lockedShake ? 'doorShake 0.1s infinite' : 'none',
              }}
            >
              {/* Doorknob */}
              <div style={{
                position: 'absolute', right: '15%', top: '50%',
                width: Math.max(4, 8 * scale), height: Math.max(4, 8 * scale), borderRadius: '50%',
                background: door.label === 'DO NOT' ? 'rgba(200,50,50,0.6)' : 'rgba(180,140,80,0.6)',
              }} />
              {/* Label */}
              <div style={{
                position: 'absolute', bottom: -(28 * scale + 8), left: '50%', transform: 'translateX(-50%)',
                textAlign: 'center', width: 200,
              }}>
                <div style={{
                  fontFamily: '"Oxanium", monospace', fontSize: Math.max(7, 11 * scale),
                  color: `rgba(${door.label === 'DO NOT' ? '200,50,50' : '200,160,80'},${0.3 + scale * 0.5})`,
                  letterSpacing: '0.12em', whiteSpace: 'nowrap',
                }}>
                  {door.label}
                </div>
                <div style={{
                  fontFamily: '"Oxanium", monospace', fontSize: Math.max(6, 9 * scale),
                  color: `rgba(200,160,80,${0.1 + scale * 0.15})`, letterSpacing: '0.08em',
                  whiteSpace: 'nowrap', marginTop: 2,
                }}>
                  {door.sublabel}
                </div>
              </div>
              {door.label === 'DO NOT' && doNotTries > 0 && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: '"Oxanium", monospace', fontSize: 9, color: 'rgba(200,50,50,0.7)' }}>
                  {3 - doNotTries > 0 ? `${3 - doNotTries} left` : '...'}
                </div>
              )}
            </div>
          )
        })}

        {/* Floor text */}
        <div style={{
          position: 'absolute', bottom: 20, left: scrollX + screenWidth / 2 - 200, width: 400,
          textAlign: 'center', fontFamily: '"Oxanium", monospace', fontSize: 14,
          letterSpacing: '0.35em', color: 'rgba(255,200,100,0.08)',
        }}>
          {floorText || '· · · · · · · · · ·'}
        </div>

        {/* Drag hint */}
        <div style={{
          position: 'fixed', bottom: 20, right: 32,
          fontFamily: '"Oxanium", monospace', fontSize: 9,
          color: 'rgba(200,160,80,0.2)', letterSpacing: '0.15em',
        }}>
          DRAG TO TRAVERSE
        </div>
      </div>

      <style>{`
        @keyframes doorShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  )
}
