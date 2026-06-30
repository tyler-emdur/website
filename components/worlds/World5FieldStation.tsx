'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ─── Radio stations as editorial "articles" ───────────────────────────────────

const STATIONS = [
  {
    freq: '72.4',
    label: 'STATIC',
    category: 'NO SIGNAL',
    body: '░░▓░░▒░▓▒░░▓░░\n░▓░▒░░▓▒░▒░░▓░',
    x: 5, y: 18, w: 240, color: '#8a8a7a',
    rotate: '-1deg',
  },
  {
    freq: '80.0',
    label: 'WEATHER',
    category: 'LOCAL REPORT',
    body: 'BOULDER · CLEAR · 62°F\nWIND 8mph NW\nVISIBILITY: 10mi\nALTITUDE: 5,430 ft',
    x: 55, y: 8, w: 220, color: '#4a6a8a',
    rotate: '0.5deg',
  },
  {
    freq: '88.7',
    label: '─ ─ ─',
    category: 'UNKNOWN ORIGIN',
    body: 'FREQUENCY RECOGNIZED.\nSIGNAL ORIGIN: UNKNOWN.\nCOORDINATES: 40.0150°N 105.2705°W\n\nDO NOT ADJUST DIAL.\nTHIS FREQUENCY DOES NOT EXIST ON THIS BAND.',
    x: 8, y: 48, w: 260, color: '#6a3a8a',
    rotate: '1.2deg',
  },
  {
    freq: '94.1',
    label: 'BROADCAST',
    category: 'EDITORIAL',
    body: 'you are listening to something\nthat is not a radio station.\n\nthis has been playing for longer\nthan the station has been operating.\n\nnobody knows who started it.',
    x: 52, y: 42, w: 250, color: '#4a4a3a',
    rotate: '-0.8deg',
  },
  {
    freq: '107.3',
    label: 'STATION ID',
    category: 'IDENTIFICATION',
    body: 'THIS IS SIGNAL RIDGE STATION.\nOPERATING SINCE 1993.\nOVER.',
    x: 30, y: 72, w: 200, color: '#3a5a3a',
    rotate: '0.3deg',
  },
  {
    freq: '114.9',
    label: 'MORSE',
    category: 'TRANSMISSION',
    body: '·− −··· −−− ··· ··−\n·−·−·−\n·−·· · − ·−·· ·',
    x: 62, y: 70, w: 210, color: '#7a5a2a',
    rotate: '-1.5deg',
  },
]

// ─── Draggable card ───────────────────────────────────────────────────────────

interface CardPos { x: number; y: number }

function StationCard({
  station, pos, onDragEnd, zIndex, onPointerDown,
}: {
  station: typeof STATIONS[number]
  pos: CardPos
  onDragEnd: (pos: CardPos) => void
  zIndex: number
  onPointerDown: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
  const posRef = useRef(pos)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => { posRef.current = pos }, [pos])

  const onPD = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.card-body')) return
    onPointerDown()
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: pos.x, oy: pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const onPM = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const nx = dragRef.current.ox + (e.clientX - dragRef.current.startX)
    const ny = dragRef.current.oy + (e.clientY - dragRef.current.startY)
    if (cardRef.current) {
      cardRef.current.style.left = `${nx}px`
      cardRef.current.style.top = `${ny}px`
    }
    posRef.current = { x: nx, y: ny }
  }

  const onPU = () => {
    if (!dragRef.current) return
    dragRef.current = null
    onDragEnd(posRef.current)
  }

  return (
    <div
      ref={cardRef}
      onPointerDown={onPD}
      onPointerMove={onPM}
      onPointerUp={onPU}
      style={{
        position: 'absolute',
        left: pos.x, top: pos.y,
        width: station.w,
        background: '#faf7f2',
        borderTop: `3px solid ${station.color}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.08)',
        transform: `rotate(${station.rotate})`,
        cursor: 'grab',
        zIndex,
        userSelect: 'none',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Freq header */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <span style={{
          fontFamily: '"IM Fell English", serif',
          fontSize: 22, color: '#1a1a1a',
          letterSpacing: '-0.01em',
        }}>{station.freq} MHz</span>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 7, letterSpacing: '0.18em',
          color: station.color, textTransform: 'uppercase',
        }}>{station.category}</span>
      </div>

      {/* Label */}
      <div style={{
        padding: '6px 14px 0',
        fontFamily: '"IM Fell English", serif',
        fontSize: 13, fontStyle: 'italic',
        color: '#333',
      }}>{station.label}</div>

      {/* Body toggle */}
      <div
        className="card-body"
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '6px 14px 12px',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 8.5, lineHeight: 2,
          color: '#5a5a5a', letterSpacing: '0.04em',
          whiteSpace: 'pre',
          maxHeight: expanded ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          cursor: 'pointer',
        }}
      >
        {station.body}
      </div>
      <div
        className="card-body"
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '0 14px 10px',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 7, color: '#aaa', letterSpacing: '0.12em',
          cursor: 'pointer',
        }}
      >{expanded ? '▲ collapse' : '▼ read'}</div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function World5FieldStation() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize card positions from station defaults
  const [positions, setPositions] = useState<CardPos[]>(() =>
    STATIONS.map(s => ({ x: (window?.innerWidth ?? 1200) * s.x / 100, y: (window?.innerHeight ?? 800) * s.y / 100 }))
  )
  const [zOrders, setZOrders] = useState<number[]>(() => STATIONS.map((_, i) => i))
  const zCounter = useRef(STATIONS.length)

  const bringToFront = useCallback((i: number) => {
    zCounter.current++
    setZOrders(z => z.map((v, idx) => idx === i ? zCounter.current : v))
  }, [])

  // Recompute positions on first client render from vw/vh
  useEffect(() => {
    setPositions(STATIONS.map(s => ({
      x: window.innerWidth * s.x / 100,
      y: window.innerHeight * s.y / 100,
    })))
  }, [])

  const updatePos = (i: number, pos: CardPos) => {
    setPositions(prev => prev.map((p, idx) => idx === i ? pos : p))
  }

  return (
    <div
      ref={containerRef}
      data-world="5"
      style={{
        position: 'fixed', inset: 0,
        background: '#f2ede4',
        overflow: 'hidden',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap');
      `}</style>

      {/* Editorial header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '16px 28px',
        borderBottom: '2px solid #1a1a1a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        background: '#f2ede4', zIndex: 100,
      }}>
        <div style={{
          fontFamily: '"IM Fell English", serif',
          fontSize: 28, letterSpacing: '-0.01em',
          color: '#1a1a1a',
        }}>Signal Ridge</div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 8, letterSpacing: '0.22em',
          color: '#888', textTransform: 'uppercase',
        }}>Field Station · Boulder CO · 40.0150°N · Drag to arrange</div>
      </div>

      {/* Horizontal rule under header */}
      <div style={{ position: 'absolute', top: 63, left: 28, right: 28, height: '1px', background: 'rgba(0,0,0,0.06)', zIndex: 100 }} />

      {/* Cards */}
      {STATIONS.map((station, i) => (
        <StationCard
          key={station.freq}
          station={station}
          pos={positions[i]}
          zIndex={zOrders[i]}
          onPointerDown={() => bringToFront(i)}
          onDragEnd={(pos) => updatePos(i, pos)}
        />
      ))}

      {/* Bottom masthead */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '10px 28px',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        display: 'flex', justifyContent: 'space-between',
        background: '#f2ede4', zIndex: 100,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 7, letterSpacing: '0.18em', color: '#bbb',
      }}>
        <span>OPERATING SINCE 1993</span>
        <span
          onClick={() => navigateTo(1, { type: 'door' })}
          style={{ cursor: 'pointer', color: '#888' }}
        >← back to universe</span>
        <span>SIGNAL RIDGE STATION · SR-1</span>
      </div>

      <HomeButton />
    </div>
  )
}
