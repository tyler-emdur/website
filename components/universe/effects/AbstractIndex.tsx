'use client'
import { useEffect, useState } from 'react'

// ─── SURVEY MARKERS ───────────────────────────────────────────────────────────
// Scattered across the viewport — feel like markers left on a survey map

const MARKERS = [
  'UNMAPPED OBJECT',
  'CATALOG ENTRY MISSING',
  'SURVEY INCOMPLETE',
  'OBSERVATION FRAGMENT',
  'NO RECORD FOUND',
  'TRANSMISSION LOSS',
  'POSITION DISPUTED',
  'UNCLASSIFIED',
  'ENTRY CORRUPTED',
  'LAST VERIFIED 03:12',
  'SIGNAL DETECTED',
  'ORIGIN UNKNOWN',
  'SECTOR REDACTED',
  'REPEAT OBSERVATION REQUIRED',
  'OBJECT EXISTS OUTSIDE INDEX',
]

// ─── STATUS LINES ─────────────────────────────────────────────────────────────
// Rotate through these in the corner terminal

const STATUS_LINES = [
  'OBSERVATION ONGOING',
  'CATALOG INCOMPLETE',
  'INDEX SYNCHRONIZING',
  'SIGNAL DRIFT DETECTED',
  'INTEGRITY CHECK PENDING',
  'ARCHIVE PARTIALLY RECOVERED',
  'TRANSMISSION RECEIVED',
  'NO NEW OBJECTS FOUND',
  'SURVEY PROTOCOL ACTIVE',
  'OBJECT COUNT UNVERIFIED',
  'DESIGNATION DISPUTED',
  'POSITION CORRECTION REQUIRED',
]

// Fixed positions — irregular, not centered or evenly spaced
const MARKER_POSITIONS = [
  { top: '7%',  left: '4%',   rot: -1.2 },
  { top: '14%', left: '72%',  rot:  0.8 },
  { top: '28%', left: '88%',  rot: -0.5 },
  { top: '38%', left: '8%',   rot:  1.8 },
  { top: '52%', left: '82%',  rot: -1.1 },
  { top: '61%', left: '3%',   rot:  0.4 },
  { top: '73%', left: '67%',  rot: -0.9 },
  { top: '82%', left: '18%',  rot:  1.3 },
  { top: '91%', left: '85%',  rot: -0.6 },
]

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function AbstractIndex() {
  const [mounted, setMounted] = useState(false)
  const [statusLine, setStatusLine] = useState(STATUS_LINES[0])
  const [objectCount, setObjectCount] = useState(47)
  const [time, setTime] = useState('03:12:47')
  const [markerTexts] = useState(() =>
    MARKER_POSITIONS.map(() => pick(MARKERS))
  )
  const [visibleMarkers, setVisibleMarkers] = useState<Set<number>>(new Set())

  useEffect(() => {
    setMounted(true)

    // Stagger marker appearance
    MARKER_POSITIONS.forEach((_, i) => {
      setTimeout(() => {
        setVisibleMarkers(prev => new Set([...prev, i]))
      }, 2000 + i * 1400 + Math.random() * 800)
    })

    // Status line rotation
    const statusIv = setInterval(() => {
      setStatusLine(pick(STATUS_LINES))
    }, 4500)

    // Object count occasionally "corrects" itself
    const countIv = setInterval(() => {
      setObjectCount(c => {
        const drift = Math.floor((Math.random() - 0.5) * 3)
        return Math.max(44, Math.min(51, c + drift))
      })
    }, 7000)

    // Clock — drifts slightly, does not match real time
    let t = Date.now()
    const clockIv = setInterval(() => {
      // drift forward at inconsistent rate
      t += 980 + Math.floor(Math.random() * 80)
      const d = new Date(t)
      setTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`)
    }, 1000)

    return () => {
      clearInterval(statusIv)
      clearInterval(countIv)
      clearInterval(clockIv)
    }
  }, [])

  if (!mounted) return null

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5 }}>

      {/* ── Scattered survey markers ── */}
      {MARKER_POSITIONS.map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            transform: `rotate(${pos.rot}deg)`,
            opacity: visibleMarkers.has(i) ? 1 : 0,
            transition: 'opacity 1.8s ease',
            fontFamily: 'monospace',
            fontSize: 8,
            letterSpacing: '0.22em',
            color: 'rgba(180,180,180,0.18)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {/* marker dot */}
          <span style={{
            width: 3, height: 3, borderRadius: '50%',
            background: 'rgba(180,180,180,0.25)',
            display: 'inline-block', flexShrink: 0,
          }} />
          {markerTexts[i]}
        </div>
      ))}

      {/* ── Corner terminal — bottom left ── */}
      {/* Name only appears as a single data field, never announced */}
      <div style={{
        position: 'fixed',
        bottom: 28,
        left: 28,
        fontFamily: 'monospace',
        fontSize: 9,
        letterSpacing: '0.14em',
        color: 'rgba(160,160,160,0.22)',
        lineHeight: 2,
        userSelect: 'none',
      }}>
        <div>SURVEY   TE-∅</div>
        <div>OPERATOR T.EMDUR</div>
        <div>OBJECTS  {objectCount} <span style={{ opacity: 0.5 }}>[UNVERIFIED]</span></div>
        <div style={{ opacity: 0.7 }}>STATUS   {statusLine}</div>
        <div style={{ opacity: 0.45 }}>SYNC     {time}</div>
      </div>

    </div>
  )
}
