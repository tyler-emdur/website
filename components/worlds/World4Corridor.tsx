'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore, type PortalType, type WorldId } from '@/lib/world-store'
import HomeButton from './HomeButton'

const DOORS: {
  label: string
  sublabel: string
  world: WorldId
  portal: PortalType
  x: number
  sealed?: boolean
  number: string
}[] = [
  { label: 'B-01', sublabel: 'BEFORE THE DECISION', world: 1, portal: 'fold', x: 8, number: '01' },
  { label: 'B-04', sublabel: 'AFTER THE SOUND', world: 5, portal: 'rotate', x: 20, number: '04' },
  { label: 'B-07', sublabel: 'THE SECOND TUESDAY', world: 7, portal: 'cursor-flood', x: 34, number: '07' },
  { label: 'B-12', sublabel: 'WHAT YOU WERE LOOKING FOR', world: 9, portal: 'expand-white', x: 49, number: '12' },
  { label: 'B-??', sublabel: 'THE LOOP', world: 10, portal: 'vortex', x: 64, number: '??' },
  { label: 'B-19', sublabel: 'STATIC BETWEEN WORLDS', world: 15, portal: 'chromatic', x: 77, number: '19' },
  { label: 'B-23', sublabel: 'INCOMPLETE · SHUFFLED', world: 16, portal: 'fold', x: 89, number: '23' },
  { label: 'B-31', sublabel: 'INSERT COIN', world: 14, portal: 'chromatic', x: 99, number: '31' },
  { label: 'DO NOT', sublabel: 'SEALED', world: 0, portal: 'fold', x: 112, number: 'XX', sealed: true },
]

const WALL_STAMPS = [
  '4.2m × 3.1m',
  'LOAD BEARING',
  'FIRE RATING: 2HR',
  'INSPECT DATE: ??',
  'SEE DWG B-12',
  'NOT TO SCALE',
  '88.7',
  '40.0150°N',
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
  const [doorShifts, setDoorShifts] = useState<Record<string, number>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const targetName = 'TYLER EMDUR'
  const totalWidth = 4200
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200

  // Floor text resolves to name
  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—'
    let resolved = 0
    const iv = setInterval(() => {
      if (resolved >= targetName.length) { clearInterval(iv); return }
      const now = Date.now()
      const frac = Math.min((now % 120000) / 120000, 1)
      resolved = Math.floor(frac * targetName.length)
      let out = ''
      for (let i = 0; i < targetName.length; i++) {
        out += i < resolved ? targetName[i] : chars[Math.floor(Math.random() * chars.length)]
      }
      setFloorText(out)
    }, 250)
    return () => clearInterval(iv)
  }, [])

  // Doors occasionally shift position (the corridor is unreliable)
  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() < 0.3) {
        const doorIdx = Math.floor(Math.random() * (DOORS.length - 1))
        const door = DOORS[doorIdx]
        setDoorShifts(prev => ({
          ...prev,
          [door.label]: (Math.random() - 0.5) * 40,
        }))
      }
    }, 4000)
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
    if (door.sealed) {
      const tries = doNotTries + 1
      setDoNotTries(tries)
      setLockedShake(true)
      setTimeout(() => setLockedShake(false), 500)
      if (tries >= 3) setTimeout(() => navigateTo(0, { type: 'fold' }), 600)
      return
    }
    navigateTo(door.world, { type: door.portal, origin: { x: e.clientX, y: e.clientY } })
  }, [doNotTries, navigateTo])

  const centerX = scrollX + screenWidth / 2

  return (
    <div
      data-world="4"
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0,
        background: '#1e1c1c',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-scrollX}px)`, width: totalWidth }}>

        {/* Ceiling — harsh concrete with overhead light strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '38%',
          background: 'linear-gradient(180deg, #2a2828 0%, #232121 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Overhead fluorescent light strips */}
          {Array.from({ length: Math.floor(totalWidth / 300) }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: i * 300 + 100,
              top: 0,
              width: 100, height: '100%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 80%)',
              pointerEvents: 'none',
            }} />
          ))}
          {/* Ceiling grid lines */}
          <svg width={totalWidth} height="38vh" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.12 }}>
            {Array.from({ length: Math.floor(totalWidth / 100) }).map((_, i) => (
              <line key={i} x1={i * 100} y1="0" x2={i * 100} y2="100%" stroke="#ccc" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i} x1="0" y1={`${i * 12.5}%`} x2={totalWidth} y2={`${i * 12.5}%`} stroke="#ccc" strokeWidth="0.5" />
            ))}
          </svg>
        </div>

        {/* Floor — rough concrete */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
          background: '#252323',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Floor texture */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }} />
          {/* Floor expansion joints */}
          {Array.from({ length: Math.floor(totalWidth / 200) }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', top: 0, left: i * 200, width: 1, height: '100%',
              background: 'rgba(0,0,0,0.3)',
            }} />
          ))}
        </div>

        {/* Left wall */}
        <div style={{
          position: 'absolute', top: '38%', left: 0, right: 0, height: '32%',
          background: 'linear-gradient(180deg, #1a1818 0%, #232121 50%, #1a1818 100%)',
        }}>
          {/* Horizontal baseboard lines */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.05)' }} />

          {/* Wall stamps / markings */}
          {WALL_STAMPS.map((stamp, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: 80 + i * Math.floor(totalWidth / WALL_STAMPS.length),
              top: '50%',
              transform: `translateY(-50%) rotate(${i % 2 === 0 ? 0 : 90}deg)`,
              fontFamily: '"Arial Black", monospace',
              fontSize: 9,
              color: 'rgba(255,255,255,0.05)',
              letterSpacing: '0.15em',
              whiteSpace: 'nowrap',
            }}>
              {stamp}
            </div>
          ))}
        </div>

        {/* DOORS */}
        {DOORS.map((door) => {
          const doorCenterX = (door.x / 100) * totalWidth
          const distFromCenter = Math.abs(doorCenterX - centerX)
          const scale = Math.max(0.25, 1 - distFromCenter / 1200)
          const doorWidth = 80 * scale
          const doorHeight = Math.min(window.innerHeight * 0.42, 260) * scale
          const doorY = window.innerHeight * 0.38 - doorHeight
          const shift = doorShifts[door.label] || 0

          return (
            <div
              key={door.label}
              onClick={(e) => handleDoorClick(door, e)}
              style={{
                position: 'absolute',
                left: doorCenterX - doorWidth / 2 + shift,
                top: doorY,
                width: doorWidth,
                height: doorHeight,
                background: door.sealed ? '#0d0505' : '#181616',
                border: `${Math.max(1, 2 * scale)}px solid rgba(${door.sealed ? '150,30,30' : '180,180,170'},${0.15 + scale * 0.35})`,
                cursor: 'pointer',
                transition: 'left 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.2s',
                animation: door.sealed && lockedShake ? 'doorShake 0.08s infinite' : 'none',
              }}
            >
              {/* Door frame — thick concrete reveal */}
              <div style={{
                position: 'absolute', inset: 0,
                boxShadow: `inset 0 0 0 ${Math.max(1, 3 * scale)}px rgba(${door.sealed ? '100,20,20' : '100,98,95'},0.2)`,
                pointerEvents: 'none',
              }} />

              {/* Doorknob */}
              <div style={{
                position: 'absolute', right: '12%', top: '50%',
                width: Math.max(3, 7 * scale), height: Math.max(3, 7 * scale),
                borderRadius: '50%',
                background: door.sealed ? 'rgba(150,30,30,0.5)' : 'rgba(160,155,148,0.4)',
              }} />

              {/* Sealed bars */}
              {door.sealed && (
                <>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', width: '120%', height: `${Math.max(1, 2 * scale)}px`, background: 'rgba(150,30,30,0.4)', transform: 'rotate(25deg)' }} />
                    <div style={{ position: 'absolute', width: '120%', height: `${Math.max(1, 2 * scale)}px`, background: 'rgba(150,30,30,0.4)', transform: 'rotate(-25deg)' }} />
                  </div>
                </>
              )}

              {/* Room number plate */}
              <div style={{
                position: 'absolute', top: `-${Math.max(20, 20 * scale)}px`,
                left: '50%', transform: 'translateX(-50%)',
              }}>
                <div style={{
                  background: door.sealed ? 'rgba(60,10,10,0.9)' : 'rgba(30,28,28,0.9)',
                  border: `1px solid rgba(${door.sealed ? '150,30,30' : '180,180,170'},0.2)`,
                  padding: `${Math.max(2, 3 * scale)}px ${Math.max(4, 6 * scale)}px`,
                }}>
                  <div style={{
                    fontFamily: '"Arial Black", "Impact", sans-serif',
                    fontSize: Math.max(7, 10 * scale),
                    color: `rgba(${door.sealed ? '180,60,60' : '200,196,190'},${0.5 + scale * 0.4})`,
                    letterSpacing: '0.15em', whiteSpace: 'nowrap',
                  }}>
                    {door.label}
                  </div>
                </div>
              </div>

              {/* Sublabel — stencil style */}
              <div style={{
                position: 'absolute',
                bottom: -(28 * scale + 4),
                left: '50%', transform: 'translateX(-50%)',
                textAlign: 'center', width: 220,
              }}>
                <div style={{
                  fontFamily: '"Arial", monospace',
                  fontSize: Math.max(6, 9 * scale),
                  color: `rgba(${door.sealed ? '180,60,60' : '180,175,165'},${0.15 + scale * 0.25})`,
                  letterSpacing: '0.1em', whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}>
                  {door.sublabel}
                </div>
              </div>

              {door.sealed && doNotTries > 0 && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  fontFamily: '"Arial Black", monospace', fontSize: 7,
                  color: 'rgba(180,60,60,0.6)', letterSpacing: '0.1em',
                }}>
                  {3 - doNotTries > 0 ? `${3 - doNotTries}` : '...'}
                </div>
              )}
            </div>
          )
        })}

        {/* Perspective vanishing lines */}
        <svg
          width={totalWidth}
          height="100vh"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {Array.from({ length: 16 }).map((_, i) => {
            const x = i * (totalWidth / 15)
            const topX = totalWidth * 0.5 + (x - totalWidth * 0.5) * 0.12
            return (
              <g key={i}>
                <line x1={topX} y1="38vh" x2={x} y2="100vh" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
                <line x1={topX} y1="0" x2={x} y2="38vh" stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" />
              </g>
            )
          })}
        </svg>

        {/* Floor text — stencil */}
        <div style={{
          position: 'absolute', bottom: 16, left: scrollX + screenWidth / 2 - 200, width: 400,
          textAlign: 'center', fontFamily: '"Arial Black", monospace', fontSize: 11,
          letterSpacing: '0.4em', color: 'rgba(255,255,255,0.05)',
          textTransform: 'uppercase',
        }}>
          {floorText || '· · · · · · · · ·'}
        </div>

        {/* Emergency exit sign */}
        <div style={{
          position: 'fixed', top: '42%', left: 24,
          background: 'rgba(180,0,0,0.7)', padding: '4px 8px',
          fontFamily: '"Arial Black", monospace', fontSize: 8,
          color: '#fff', letterSpacing: '0.15em',
        }}>
          EXIT →
        </div>
      </div>

      {/* Drag hint */}
      <div style={{
        position: 'fixed', bottom: 20, right: 32,
        fontFamily: '"Arial", monospace', fontSize: 9,
        color: 'rgba(255,255,255,0.12)', letterSpacing: '0.15em',
      }}>
        DRAG TO TRAVERSE
      </div>

      <style>{`
        @keyframes doorShake {
          0%, 100% { transform: translateX(0) }
          25% { transform: translateX(-4px) }
          75% { transform: translateX(4px) }
        }
      `}</style>
      <HomeButton />
    </div>
  )
}
