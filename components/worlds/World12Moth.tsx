'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

function DustMotes() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const motes = Array.from({ length: 28 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.5 + Math.random() * 1,
      vy: -(0.06 + Math.random() * 0.14),
      vx: (Math.random() - 0.5) * 0.04,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.05 + Math.random() * 0.18,
    }))
    let frame: number
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const t = Date.now() / 1000
      motes.forEach(m => {
        m.y += m.vy; m.x += m.vx
        if (m.y < -4) { m.y = canvas.height + 4; m.x = Math.random() * canvas.width }
        const a = m.alpha * (0.5 + 0.5 * Math.sin(t * 0.7 + m.phase))
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(160,190,240,${a})`
        ctx.fill()
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
}

// ── Room objects ──────────────────────────────────────────────────────────────

interface RoomObject {
  id: string
  x: number    // % of room width
  y: number    // % of room height
  label: string
  revealRadius: number
  content: string[]
  width: number
  height: number
}

const OBJECTS: RoomObject[] = [
  {
    id: 'bookshelf',
    x: 8, y: 22, width: 14, height: 38,
    label: 'bookshelf',
    revealRadius: 220,
    content: [
      'books owned: 47',
      'books finished: 11',
      'books started: all of them',
      'books that changed things: 3',
    ],
  },
  {
    id: 'window',
    x: 76, y: 10, width: 18, height: 30,
    label: 'window',
    revealRadius: 240,
    content: [
      'the moth keeps returning to this window.',
      'so do i.',
      'neither of us knows why.',
    ],
  },
  {
    id: 'desk',
    x: 38, y: 55, width: 22, height: 20,
    label: 'desk',
    revealRadius: 200,
    content: [
      'to do:',
      '  · everything',
      'done:',
      '  · some of it',
      'pending:',
      '  · the important stuff',
    ],
  },
  {
    id: 'coat',
    x: 85, y: 42, width: 8, height: 24,
    label: 'coat',
    revealRadius: 180,
    content: [
      'the jacket you keep meaning to wash.',
      '',
      'you have been meaning to wash it',
      'for approximately one year.',
    ],
  },
  {
    id: 'floor-lamp',
    x: 22, y: 48, width: 4, height: 30,
    label: 'floor lamp (off)',
    revealRadius: 160,
    content: [
      '— click to turn on —',
    ],
    // special: toggles second light
  },
  {
    id: 'calendar',
    x: 58, y: 14, width: 12, height: 14,
    label: 'calendar',
    revealRadius: 200,
    content: [
      'one date is circled.',
      'the pen is still there.',
      'you circled it a year ago.',
      'you still remember what it was for.',
    ],
  },
]

// ── Moth SVG ─────────────────────────────────────────────────────────────────

function Moth({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: x - 10, top: y - 10,
      width: 20, height: 20,
      transform: `rotate(${angle}deg)`,
      pointerEvents: 'none',
      transition: 'left 0.4s ease, top 0.4s ease',
    }}>
      <svg viewBox="0 0 20 20" style={{ width: '100%', height: '100%', opacity: 0.65 }}>
        {/* wings */}
        <ellipse cx="5" cy="9" rx="5" ry="4" fill="rgba(160,180,230,0.35)" transform="rotate(-20,5,9)"/>
        <ellipse cx="15" cy="9" rx="5" ry="4" fill="rgba(160,180,230,0.35)" transform="rotate(20,15,9)"/>
        <ellipse cx="5" cy="13" rx="3" ry="2.5" fill="rgba(130,160,210,0.28)" transform="rotate(10,5,13)"/>
        <ellipse cx="15" cy="13" rx="3" ry="2.5" fill="rgba(130,160,210,0.28)" transform="rotate(-10,15,13)"/>
        {/* body */}
        <ellipse cx="10" cy="10" rx="1.5" ry="5" fill="rgba(170,190,240,0.7)"/>
        {/* antennae */}
        <line x1="9" y1="6" x2="6" y2="2" stroke="rgba(160,190,240,0.45)" strokeWidth="0.5"/>
        <line x1="11" y1="6" x2="14" y2="2" stroke="rgba(160,190,240,0.45)" strokeWidth="0.5"/>
      </svg>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function World12Moth() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const containerRef = useRef<HTMLDivElement>(null)
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 }) // % of container
  const [mothPos, setMothPos] = useState({ x: 50, y: 50 })
  const [mothAngle, setMothAngle] = useState(0)
  const [lampOn, setLampOn] = useState(false)
  const [openObj, setOpenObj] = useState<string | null>(null)
  const [discovered, setDiscovered] = useState<Set<string>>(new Set())
  const animRef = useRef<number>(0)
  const mothRef = useRef({ x: 50, y: 50, vx: 0, vy: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setLightPos({ x, y })
  }, [])

  // Moth drifts toward light
  useEffect(() => {
    let frame: number
    const tick = () => {
      const m = mothRef.current
      const dx = (lightPos.x - m.x) * 0.02
      const dy = (lightPos.y - m.y) * 0.02
      // Add slight oscillation for organic feel
      const t = Date.now() / 1000
      const oscillate = Math.sin(t * 3) * 0.4
      m.x += dx + oscillate
      m.y += dy + Math.cos(t * 2.5) * 0.3
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
      setMothPos({ x: m.x, y: m.y })
      setMothAngle(angle)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [lightPos])

  // Compute visibility of each object based on distance from light (and optionally lamp)
  function objectVisibility(obj: RoomObject): number {
    const objCx = obj.x + obj.width / 2
    const objCy = obj.y + obj.height / 2
    const dx = objCx - lightPos.x
    const dy = (objCy - lightPos.y) * (window.innerHeight / window.innerWidth) * 1.3
    const dist = Math.sqrt(dx * dx + dy * dy) * (window.innerWidth / 100)
    const fromMain = Math.max(0, 1 - dist / obj.revealRadius)

    let fromLamp = 0
    if (lampOn) {
      // Lamp is at x=22, y=48
      const ldx = objCx - 22
      const ldy = objCy - 48
      const ldist = Math.sqrt(ldx * ldx + ldy * ldy) * (window.innerWidth / 100)
      fromLamp = Math.max(0, 1 - ldist / 280)
    }
    return Math.min(1, fromMain + fromLamp)
  }

  function handleObjClick(obj: RoomObject) {
    if (obj.id === 'floor-lamp') {
      setLampOn(l => !l)
      setDiscovered(d => new Set([...d, obj.id]))
      return
    }
    setOpenObj(openObj === obj.id ? null : obj.id)
    setDiscovered(d => new Set([...d, obj.id]))
  }

  const doorVisible = discovered.size >= 4

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        width: '100vw', height: '100vh',
        background: 'radial-gradient(ellipse 120% 100% at 50% 80%, #060c1a 0%, #020508 70%)',
        position: 'relative', overflow: 'hidden',
        cursor: 'none',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <DustMotes />

      {/* Atmospheric depth layer */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(20,40,80,0.18) 0%, transparent 70%)',
      }} />

      {/* Main light glow following cursor — cool moonbeam */}
      <div style={{
        position: 'absolute',
        left: `${lightPos.x}%`, top: `${lightPos.y}%`,
        transform: 'translate(-50%, -50%)',
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,210,255,0.10) 0%, rgba(140,180,240,0.05) 35%, transparent 70%)',
        pointerEvents: 'none', zIndex: 2,
      }}/>
      {/* Inner bright spot */}
      <div style={{
        position: 'absolute',
        left: `${lightPos.x}%`, top: `${lightPos.y}%`,
        transform: 'translate(-50%, -50%)',
        width: 48, height: 48, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,220,255,0.4) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 2,
      }}/>
      {/* Cursor bulb */}
      <div style={{
        position: 'absolute',
        left: `${lightPos.x}%`, top: `${lightPos.y}%`,
        transform: 'translate(-50%, -50%)',
        width: 6, height: 6, borderRadius: '50%',
        background: 'rgba(210,230,255,0.95)',
        boxShadow: '0 0 12px rgba(180,210,255,0.8)',
        pointerEvents: 'none', zIndex: 3,
      }}/>

      {/* Floor lamp second light — warmer accent when on */}
      {lampOn && (
        <div style={{
          position: 'absolute',
          left: '22%', top: '48%',
          transform: 'translate(-50%, -50%)',
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,220,255,0.06) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 2,
        }}/>
      )}

      {/* Room objects */}
      {OBJECTS.map(obj => {
        const vis = objectVisibility(obj)
        const isOpen = openObj === obj.id
        return (
          <div key={obj.id}>
            {/* Object silhouette */}
            <div
              onClick={() => handleObjClick(obj)}
              style={{
                position: 'absolute',
                left: `${obj.x}%`, top: `${obj.y}%`,
                width: `${obj.width}%`, height: `${obj.height}%`,
                opacity: Math.max(0.03, vis),
                cursor: vis > 0.1 ? 'pointer' : 'default',
                transition: 'opacity 0.9s ease',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                zIndex: 4,
              }}
            >
              <ObjectShape id={obj.id} lampOn={lampOn} />
              {vis > 0.2 && (
                <div style={{
                  position: 'absolute', bottom: -16,
                  fontSize: 7, letterSpacing: '0.2em',
                  color: `rgba(160,190,240,${vis * 0.55})`,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}>
                  {obj.id === 'floor-lamp' ? (lampOn ? 'lamp (on)' : obj.label) : obj.label}
                </div>
              )}
            </div>

            {/* Content card — dark glass Igloo style */}
            {isOpen && (
              <div
                onClick={() => setOpenObj(null)}
                style={{
                  position: 'absolute',
                  left: `${Math.min(obj.x + obj.width + 1, 55)}%`,
                  top: `${obj.y}%`,
                  background: 'rgba(6,10,22,0.92)',
                  border: '1px solid rgba(140,170,220,0.18)',
                  backdropFilter: 'blur(8px)',
                  padding: '16px 20px',
                  fontSize: 10, lineHeight: 2,
                  color: 'rgba(180,200,240,0.75)',
                  letterSpacing: '0.08em',
                  maxWidth: 240,
                  zIndex: 10,
                  animation: 'fadeIn 0.6s ease',
                  cursor: 'pointer',
                  whiteSpace: 'pre',
                }}>
                {obj.content.join('\n')}
              </div>
            )}
          </div>
        )
      })}

      {/* Moth */}
      <Moth x={(mothPos.x / 100) * window.innerWidth} y={(mothPos.y / 100) * window.innerHeight} angle={mothAngle} />

      {/* Door — unlocks after 4 objects discovered */}
      {doorVisible && (
        <div
          onClick={() => navigateTo(1, { type: 'fold' })}
          style={{
            position: 'absolute', right: '3%', top: '30%',
            width: '5%', height: '35%',
            border: '1px solid rgba(140,170,220,0.16)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 1.5s ease', zIndex: 5,
          }}
        >
          <div style={{
            position: 'absolute', right: 8, top: '50%',
            width: 4, height: 4, borderRadius: '50%',
            background: 'rgba(140,170,220,0.25)',
            transform: 'translateY(-50%)',
          }}/>
        </div>
      )}

      {/* Hint */}
      {discovered.size === 0 && (
        <div style={{
          position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(140,170,220,0.18)', fontSize: 9, letterSpacing: '0.25em',
          textTransform: 'uppercase', pointerEvents: 'none',
          animation: 'fadeIn 2.5s ease', zIndex: 5,
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          move the light
        </div>
      )}

      <HomeButton />

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </div>
  )
}

function ObjectShape({ id, lampOn }: { id: string; lampOn: boolean }) {
  const color = 'rgba(140,170,220,0.65)'
  const dim = 'rgba(60,80,120,0.55)'

  if (id === 'bookshelf') return (
    <svg viewBox="0 0 60 120" style={{ width: '100%', height: '100%' }}>
      <rect x="2" y="2" width="56" height="116" fill="none" stroke={color} strokeWidth="2"/>
      {[28, 55, 82].map((y, i) => (
        <line key={i} x1="2" y1={y} x2="58" y2={y} stroke={color} strokeWidth="1"/>
      ))}
      {/* Books */}
      {[0,1,2].map(shelf => [4,10,18,24,32,40,47].slice(0, 5 + shelf).map((x, j) => (
        <rect key={j} x={x} y={shelf * 27 + 6} width={4 + (j % 3) * 2} height={16 + shelf * 2}
          fill={dim} stroke={color} strokeWidth="0.3"/>
      )))}
    </svg>
  )

  if (id === 'window') return (
    <svg viewBox="0 0 80 110" style={{ width: '100%', height: '100%' }}>
      <rect x="2" y="2" width="76" height="106" fill="rgba(10,15,30,0.8)" stroke={color} strokeWidth="2"/>
      <line x1="40" y1="2" x2="40" y2="108" stroke={color} strokeWidth="1.5"/>
      <line x1="2" y1="54" x2="78" y2="54" stroke={color} strokeWidth="1.5"/>
      {/* Stars in window */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <circle key={i} cx={(i * 23 + 8) % 72 + 4} cy={(i * 17 + 5) % 48 + 4} r="0.8" fill="white" opacity="0.5"/>
      ))}
    </svg>
  )

  if (id === 'desk') return (
    <svg viewBox="0 0 90 60" style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="10" width="90" height="8" fill={color}/>
      <rect x="4" y="18" width="8" height="40" fill={dim}/>
      <rect x="78" y="18" width="8" height="40" fill={dim}/>
      {/* Items on desk */}
      <rect x="15" y="2" width="22" height="10" rx="1" fill={dim} stroke={color} strokeWidth="0.5"/>
      <rect x="45" y="4" width="12" height="8" rx="1" fill={dim}/>
    </svg>
  )

  if (id === 'coat') return (
    <svg viewBox="0 0 30 80" style={{ width: '100%', height: '100%' }}>
      <line x1="15" y1="0" x2="15" y2="10" stroke={color} strokeWidth="2"/>
      <path d="M5,10 Q15,18 25,10 L28,40 Q28,45 15,45 Q2,45 2,40 Z" fill={dim} stroke={color} strokeWidth="1"/>
      <rect x="6" y="45" width="18" height="35" rx="2" fill={dim} stroke={color} strokeWidth="1"/>
    </svg>
  )

  if (id === 'floor-lamp') return (
    <svg viewBox="0 0 20 100" style={{ width: '100%', height: '100%' }}>
      <line x1="10" y1="90" x2="10" y2="20" stroke={color} strokeWidth="2"/>
      <ellipse cx="10" cy="90" rx="8" ry="3" fill={dim} stroke={color} strokeWidth="1"/>
      <path d="M2,20 Q10,8 18,20 Z" fill={lampOn ? 'rgba(180,210,255,0.7)' : dim} stroke={color} strokeWidth="1"/>
    </svg>
  )

  if (id === 'calendar') return (
    <svg viewBox="0 0 50 50" style={{ width: '100%', height: '100%' }}>
      <rect x="2" y="8" width="46" height="40" fill={dim} stroke={color} strokeWidth="1.5"/>
      <rect x="2" y="8" width="46" height="10" fill={color} opacity="0.4"/>
      <line x1="8" y1="2" x2="8" y2="14" stroke={color} strokeWidth="2"/>
      <line x1="42" y1="2" x2="42" y2="14" stroke={color} strokeWidth="2"/>
      {/* Date grid */}
      {[0,1,2,3,4,5,6].map(i => (
        <circle key={i} cx={10 + (i % 7) * 6} cy={24 + Math.floor(i / 7) * 7} r="1.5" fill={dim}/>
      ))}
      {/* Circled date */}
      <circle cx="34" cy="36" r="5" fill="none" stroke={color} strokeWidth="1.2"/>
    </svg>
  )

  return null
}
