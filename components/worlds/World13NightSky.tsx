'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── Constellations ────────────────────────────────────────────────────────────

interface Constellation {
  id: string
  name: string
  stars: [number, number][]   // x, y in virtual sky coords (0-3000, 0-2000)
  lines: [number, number][]   // pairs of star indices
  centerX: number
  centerY: number
  story: string[]
  color: string
}

const CONSTELLATIONS: Constellation[] = [
  {
    id: 'marathon',
    name: 'The Long Run',
    stars: [[800,400],[840,430],[870,400],[900,440],[930,410],[960,450],[1000,420]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]],
    centerX: 900, centerY: 425,
    color: '#F97316',
    story: [
      '26.2 miles.',
      'boulder, 2023.',
      'i didn\'t know if i could finish.',
      '',
      'i finished.',
      '',
      'the last 3 miles were the only miles',
      'that ever actually mattered.',
    ],
  },
  {
    id: 'summit',
    name: 'The Summit',
    stars: [[1600,300],[1560,400],[1640,400],[1520,500],[1680,500]],
    lines: [[0,1],[0,2],[1,2],[1,3],[2,4]],
    centerX: 1600, centerY: 400,
    color: '#22C55E',
    story: [
      'pikes peak.',
      '14,115 feet.',
      'i started hiking before sunrise',
      'so nobody would see me struggling.',
      '',
      'everybody struggles at 14,000 feet.',
      'that\'s the point.',
    ],
  },
  {
    id: 'circuit',
    name: 'The Circuit',
    stars: [[400,800],[520,800],[520,920],[400,920],[460,860],[460,800],[520,860]],
    lines: [[0,1],[1,2],[2,3],[3,0],[0,4],[4,5],[4,6]],
    centerX: 460, centerY: 860,
    color: '#60A5FA',
    story: [
      'i build things.',
      '',
      'software, mostly.',
      'sometimes physical things.',
      'occasionally something in between.',
      '',
      'the circuit is never finished.',
      'that\'s not a flaw. that\'s the design.',
    ],
  },
  {
    id: 'station',
    name: 'The Field Station',
    stars: [[2100,700],[2100,750],[2100,810],[2060,760],[2140,760],[2080,700],[2120,700]],
    lines: [[0,1],[1,2],[3,4],[3,1],[4,1],[5,0],[6,0]],
    centerX: 2100, centerY: 755,
    color: '#F59E0B',
    story: [
      'boulder, colorado.',
      '40.0150° n, 105.2705° w.',
      '',
      'there\'s a frequency at 88.7',
      'that doesn\'t appear on the dial.',
      '',
      'i\'ve been logging it for two years.',
      'it hasn\'t repeated yet.',
    ],
  },
  {
    id: 'signal',
    name: 'The Signal',
    stars: [[700,1400],[780,1360],[860,1400],[940,1360],[1020,1400],[1100,1360],[1180,1400]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]],
    centerX: 940, centerY: 1380,
    color: '#E879F9',
    story: [
      'everything is a transmission.',
      '',
      'the question is whether you\'re',
      'oriented to receive it.',
      '',
      'i built a receiver once.',
      'it picked up too much.',
      'i turned some of it off.',
    ],
  },
  {
    id: 'return',
    name: 'The Return',
    stars: [[1800,1200],[1880,1200],[1840,1140],[1840,1260],[1760,1200],[1920,1200]],
    lines: [[2,0],[2,1],[0,3],[1,3],[4,0],[1,5]],
    centerX: 1840, centerY: 1200,
    color: '#A78BFA',
    story: [
      'i always come back.',
      '',
      'to boulder. to the mountains.',
      'to the same questions.',
      '',
      'home isn\'t a place you find.',
      'it\'s a place you keep choosing.',
    ],
  },
  {
    id: 'moth',
    name: 'The Moth',
    stars: [[2400,1500],[2350,1450],[2450,1450],[2370,1540],[2430,1540],[2400,1580]],
    lines: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,5]],
    centerX: 2400, centerY: 1515,
    color: 'rgba(200,180,120,0.7)',
    story: [
      'you found the hidden one.',
      '',
      'the moth orbits the light',
      'because the light is the only reference',
      'in the dark.',
      '',
      'navigate by what\'s brightest.',
      'even if it burns a little.',
    ],
  },
]

// Random background stars
const BG_STARS = Array.from({ length: 600 }, (_, i) => ({
  x: (i * 473 + 117) % 3000,
  y: (i * 311 + 89) % 2000,
  r: i % 8 === 0 ? 1.5 : i % 4 === 0 ? 1.1 : 0.7,
  op: 0.2 + (i % 5) * 0.1,
  twinkle: i % 3 === 0,
}))

// ── Component ─────────────────────────────────────────────────────────────────

export default function World13NightSky() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [offset, setOffset] = useState({ x: -600, y: -400 })
  const [hover, setHover] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [found, setFound] = useState<Set<string>>(new Set())
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 3000, window.innerHeight / 2000) * 2.2 : 0.5

  function toScreen(cx: number, cy: number) {
    return {
      sx: cx * scale + offset.x,
      sy: cy * scale + offset.y,
    }
  }

  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('.constellation-card')) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (dragRef.current) {
      setOffset({
        x: dragRef.current.ox + (e.clientX - dragRef.current.startX),
        y: dragRef.current.oy + (e.clientY - dragRef.current.startY),
      })
      return
    }

    // Hover detection
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let closest: string | null = null
    let minDist = 80
    for (const c of CONSTELLATIONS) {
      const { sx, sy } = toScreen(c.centerX, c.centerY)
      const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2)
      if (dist < minDist) { minDist = dist; closest = c.id }
    }
    setHover(closest)
  }

  function onMouseUp() { dragRef.current = null }

  function onConstellationClick(id: string) {
    setOpen(open === id ? null : id)
    setFound(f => new Set([...f, id]))
  }

  const allFound = found.size >= CONSTELLATIONS.length

  return (
    <div
      style={{
        width: '100vw', height: '100vh',
        background: 'linear-gradient(160deg, #0b0d2e 0%, #12103a 30%, #0e1840 60%, #060d28 100%)',
        overflow: 'hidden', position: 'relative',
        cursor: dragRef.current ? 'grabbing' : 'grab',
        fontFamily: '"Space Mono", monospace',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Nebula wash layers */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 30% 60%, rgba(60,40,120,0.18) 0%, transparent 70%)',
      }}/>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 40% 30% at 75% 30%, rgba(20,60,100,0.14) 0%, transparent 65%)',
      }}/>

      <svg
        ref={svgRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {/* Background stars */}
        {BG_STARS.map((s, i) => {
          const { sx, sy } = toScreen(s.x, s.y)
          return (
            <circle key={i} cx={sx} cy={sy} r={s.r} fill="white" opacity={s.op}/>
          )
        })}

        {/* Constellations */}
        {CONSTELLATIONS.map(c => {
          const isHovered = hover === c.id
          const isFound = found.has(c.id)
          const isOpen = open === c.id
          const vis = isHovered || isFound

          return (
            <g
              key={c.id}
              onClick={() => onConstellationClick(c.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Connecting lines */}
              {vis && c.lines.map(([a, b], li) => {
                const sa = toScreen(c.stars[a][0], c.stars[a][1])
                const sb = toScreen(c.stars[b][0], c.stars[b][1])
                return (
                  <line key={li}
                    x1={sa.sx} y1={sa.sy} x2={sb.sx} y2={sb.sy}
                    stroke={c.color} strokeWidth="0.8" opacity={isOpen ? 0.7 : 0.4}
                  />
                )
              })}

              {/* Stars */}
              {c.stars.map(([sx0, sy0], si) => {
                const { sx, sy } = toScreen(sx0, sy0)
                return (
                  <g key={si}>
                    {vis && <circle cx={sx} cy={sy} r={5} fill={c.color} opacity="0.1"/>}
                    <circle cx={sx} cy={sy} r={vis ? 2.2 : 1.4}
                      fill={vis ? c.color : 'rgba(255,255,255,0.6)'}
                      opacity={vis ? 0.9 : 0.5}
                    />
                  </g>
                )
              })}

              {/* Name label */}
              {vis && (() => {
                const { sx, sy } = toScreen(c.centerX, c.centerY)
                return (
                  <text x={sx} y={sy - 18} textAnchor="middle"
                    fontSize="10" fill={c.color} opacity={0.7}
                    fontFamily='"Space Mono", monospace' letterSpacing="0.1em"
                  >
                    {c.name.toUpperCase()}
                  </text>
                )
              })()}
            </g>
          )
        })}
      </svg>

      {/* Story card — cream observatory log */}
      {open && (() => {
        const c = CONSTELLATIONS.find(x => x.id === open)!
        return (
          <div
            className="constellation-card"
            onClick={e => { e.stopPropagation(); setOpen(null) }}
            style={{
              position: 'fixed', right: 28, top: '50%', transform: 'translateY(-50%)',
              width: 280,
              background: '#f5f0e4',
              borderTop: `4px solid ${c.color}`,
              padding: '20px 22px 18px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.25s ease',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 7, letterSpacing: '0.2em', color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>
              FIELD LOG · {c.id.toUpperCase()}
            </div>
            <div style={{ fontFamily: '"IM Fell English", Georgia, serif', fontSize: 20, color: '#1a1a1a', marginBottom: 14, lineHeight: 1.1, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 10 }}>
              {c.name}
            </div>
            {c.story.map((line, i) => (
              <div key={i} style={{
                fontFamily: '"IM Fell English", Georgia, serif',
                fontStyle: 'italic',
                color: line ? '#333' : 'transparent',
                fontSize: line ? 12 : 0, lineHeight: 1.85,
                height: line ? 'auto' : 10,
              }}>
                {line || ' '}
              </div>
            ))}
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.08)', fontFamily: '"JetBrains Mono", monospace', fontSize: 7, color: '#aaa', letterSpacing: '0.12em' }}>
              click to close
            </div>
          </div>
        )
      })()}

      {/* HUD */}
      <div style={{
        position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(200,210,255,0.2)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase',
        pointerEvents: 'none',
      }}>
        {found.size} / {CONSTELLATIONS.length} constellations found · drag to explore
      </div>

      {allFound && (
        <div
          onClick={() => navigateTo(1, { type: 'scatter' })}
          style={{
            position: 'fixed', bottom: 80, right: 32,
            color: 'rgba(200,210,255,0.4)', fontSize: 9, letterSpacing: '0.2em',
            cursor: 'pointer', textTransform: 'uppercase',
            animation: 'fadeIn 1s ease',
            border: '1px solid rgba(200,210,255,0.15)',
            padding: '10px 18px',
          }}
        >
          ← return
        </div>
      )}

      <HomeButton />

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideIn { from { opacity:0; transform: translateY(-50%) translateX(20px) } to { opacity:1; transform: translateY(-50%) translateX(0) } }
      `}</style>
    </div>
  )
}
