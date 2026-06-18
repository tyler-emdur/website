'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── The decoded transmission payload ─────────────────────────────────────────
const SEGMENTS = [
  { id: 0, text: 'SURVEY ORIGIN: T.EMDUR', color: '#4af', waveSeeds: [0.8,0.2,0.9,0.1,0.7,0.3,0.8,0.4] },
  { id: 1, text: 'POSITION: 40.0150°N 105.2705°W', color: '#fa4', waveSeeds: [0.3,0.7,0.1,0.9,0.4,0.6,0.2,0.8] },
  { id: 2, text: 'FREQUENCY: 88.7 MHz', color: '#4fa', waveSeeds: [0.5,0.5,0.8,0.2,0.6,0.4,0.9,0.1] },
  { id: 3, text: 'OBJECT COUNT: 47 [UNVERIFIED]', color: '#f4a', waveSeeds: [0.1,0.9,0.3,0.7,0.2,0.8,0.5,0.5] },
  { id: 4, text: 'STATUS: OBSERVATION ACTIVE', color: '#af4', waveSeeds: [0.6,0.4,0.7,0.3,0.8,0.2,0.1,0.9] },
  { id: 5, text: 'NOTE: YOU ARE BEING OBSERVED', color: '#a4f', waveSeeds: [0.4,0.6,0.5,0.5,0.1,0.9,0.7,0.3] },
]
const CORRECT_ORDER = [0, 1, 2, 3, 4, 5]

const DECODED_LOG = [
  { label: 'PERSONAL LOG — ENTRY 001', text: 'origin: midwest. relocated boulder, co august 2022.\naltitude: 5,430ft. adjustment period: still ongoing.' },
  { label: 'FIELD NOTE — TRAILS', text: 'boulder mountain, green mountain, pikes peak, mt elbert, maroon bells.\nthe mountains don\'t care about your pace.\nthis is a feature, not a bug.' },
  { label: 'PROJECT LOG — DIGGER', text: 'music discovery app. deployed 2024.\nbuilt between 11pm and 2am, mostly.\nstill running. still finding things.' },
  { label: 'OBSERVATION — FREQUENCY', text: 'frequency 88.7 appears in multiple sectors.\nsource unconfirmed. possibly self-referential.\nsignal is real regardless of origin.' },
  { label: 'MARATHON LOG — OCT 2024', text: 'boulder marathon. time: 3:41:22.\nstarted 6am. cold. finished.\nthe last mile was wrong. it was the right one.' },
  { label: 'STATUS — CURRENT', text: 'software engineer. boulder, co.\nbuilds things before they\'re ready.\nships them anyway.\nthis is the archive. you found it.' },
]

// ── Waveform segment drawn on canvas ─────────────────────────────────────────
function WaveSegment({ seeds, color, clarity, w = 140, h = 40 }: {
  seeds: number[]; color: string; clarity: number; w?: number; h?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = w; c.height = h
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0a0f0a'; ctx.fillRect(0, 0, w, h)
    // Noise floor
    for (let x = 0; x < w; x++) {
      const noise = (Math.random() - 0.5) * (1 - clarity) * h * 0.7
      const y = h / 2 + noise
      ctx.fillStyle = `rgba(80,140,80,${0.3 + Math.random() * 0.2})`
      ctx.fillRect(x, y, 1, 1)
    }
    // Signal
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.3 + clarity * 0.7
    ctx.lineWidth = 1.5
    ctx.shadowColor = color; ctx.shadowBlur = clarity * 8
    for (let i = 0; i < seeds.length; i++) {
      const x0 = (i / seeds.length) * w
      const x1 = ((i + 1) / seeds.length) * w
      const y0 = h / 2 + (seeds[i] - 0.5) * h * 0.8
      const y1 = h / 2 + (seeds[(i + 1) % seeds.length] - 0.5) * h * 0.8
      i === 0 ? ctx.moveTo(x0, y0) : ctx.lineTo(x0, y0)
      ctx.lineTo(x1, y1)
    }
    ctx.stroke()
    ctx.globalAlpha = 1; ctx.shadowBlur = 0
    // Grid
    ctx.strokeStyle = 'rgba(0,100,0,0.15)'; ctx.lineWidth = 0.5
    for (let y = 0; y <= h; y += h / 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
    for (let x = 0; x <= w; x += w / 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
  }, [seeds, color, clarity, w, h])
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} />
}

// ── Draggable slot ────────────────────────────────────────────────────────────
function Slot({ seg, idx, onDrop, isCorrect }: {
  seg: typeof SEGMENTS[number] | null; idx: number; onDrop: (from: number, to: number) => void; isCorrect: boolean
}) {
  const [dragOver, setDragOver] = useState(false)
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const from = parseInt(e.dataTransfer.getData('idx')); onDrop(from, idx) }}
      style={{
        height: 52, border: `1px solid ${isCorrect ? '#4af' : dragOver ? '#6a6' : '#1a3a1a'}`,
        background: isCorrect ? 'rgba(64,170,255,0.06)' : dragOver ? 'rgba(80,160,80,0.12)' : 'rgba(0,30,0,0.5)',
        borderRadius: 3, overflow: 'hidden', transition: 'border-color 0.15s, background 0.15s',
        position: 'relative',
      }}
    >
      {seg ? (
        <div
          draggable
          onDragStart={e => { e.dataTransfer.setData('idx', String(idx)) }}
          style={{ width: '100%', height: '100%', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <div style={{ flex: 1, height: '100%' }}>
            <WaveSegment seeds={seg.waveSeeds} color={seg.color} clarity={isCorrect ? 1 : 0.35} />
          </div>
          {isCorrect && (
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: seg.color, whiteSpace: 'nowrap', paddingRight: 8, letterSpacing: '0.06em' }}>
              {seg.text}
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 9, color: 'rgba(80,140,80,0.2)', letterSpacing: '0.15em' }}>
          — SLOT {idx + 1} —
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function World8Signal() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  // Scrambled initial order
  const [order, setOrder] = useState<(number | null)[]>(() => {
    const shuffled = [...CORRECT_ORDER].sort(() => Math.random() - 0.5)
    return shuffled
  })
  const [phase, setPhase] = useState<'lab' | 'decoding' | 'complete'>('lab')
  const [decodeProgress, setDecodeProgress] = useState(0)

  const correctSlots = order.map((id, i) => id === CORRECT_ORDER[i])
  const correctCount = correctSlots.filter(Boolean).length
  const clarity = correctCount / SEGMENTS.length

  const handleDrop = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    setOrder(prev => {
      const next = [...prev]
      ;[next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]]
      return next
    })
  }

  // Auto-decode when all correct
  useEffect(() => {
    if (correctCount < SEGMENTS.length) return
    setPhase('decoding')
    let p = 0
    const iv = setInterval(() => {
      p += 1.2
      setDecodeProgress(Math.min(p, 100))
      if (p >= 100) { clearInterval(iv); setPhase('complete') }
    }, 40)
    return () => clearInterval(iv)
  }, [correctCount])

  const mono: React.CSSProperties = { fontFamily: 'monospace' }

  return (
    <div data-world="8" style={{
      position: 'fixed', inset: 0,
      background: '#030a03',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <HomeButton />

      {/* Monitor frame */}
      <div style={{
        width: 'min(560px, 94vw)',
        background: '#0d1a0d',
        border: '1px solid #1a3a1a',
        borderRadius: 4,
        padding: 20,
        boxShadow: '0 0 60px rgba(0,80,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, ...mono }}>
          <div style={{ fontSize: 10, color: '#4af', letterSpacing: '0.2em' }}>SIGNAL RECONSTRUCTION — UNIT 08</div>
          <div style={{ fontSize: 9, color: 'rgba(80,200,80,0.4)' }}>
            CLARITY: {Math.round(clarity * 100)}%
          </div>
        </div>

        {/* Clarity meter */}
        <div style={{ height: 3, background: '#0a1a0a', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: `hsl(${120 + clarity * 60},80%,55%)`,
            width: `${clarity * 100}%`, transition: 'width 0.3s, background 0.3s',
            boxShadow: `0 0 8px hsl(${120 + clarity * 60},80%,55%)`,
          }} />
        </div>

        {/* Instruction */}
        <div style={{ fontSize: 9, color: 'rgba(80,200,80,0.45)', ...mono, letterSpacing: '0.12em', marginBottom: 12 }}>
          {phase === 'lab' && 'DRAG SEGMENTS TO RECONSTRUCT TRANSMISSION · ORDER IS SIGNIFICANT'}
          {phase === 'decoding' && `DECODING... ${Math.round(decodeProgress)}%`}
          {phase === 'complete' && 'TRANSMISSION RECOVERED'}
        </div>

        {/* Slots */}
        {phase !== 'complete' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {order.map((segId, i) => (
              <Slot
                key={i}
                idx={i}
                seg={segId !== null ? SEGMENTS[segId] : null}
                onDrop={handleDrop}
                isCorrect={correctSlots[i]}
              />
            ))}
          </div>
        )}

        {/* Decoding bar */}
        {phase === 'decoding' && (
          <div style={{ height: 2, background: '#0a1a0a', borderRadius: 1, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#4af', width: `${decodeProgress}%`, transition: 'width 0.08s' }} />
          </div>
        )}

        {/* Complete — show full message */}
        {phase === 'complete' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
              {SEGMENTS.map((seg, i) => (
                <div key={i} style={{
                  padding: '5px 8px', background: 'rgba(0,20,0,0.8)',
                  border: `1px solid ${seg.color}33`,
                  fontFamily: 'monospace', fontSize: 10, color: seg.color,
                  letterSpacing: '0.08em',
                  animation: `fadeIn 0.4s ease ${i * 0.12}s both`,
                }}>
                  {seg.text}
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'rgba(64,170,255,0.15)', margin: '12px 0' }} />

            <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(80,200,80,0.35)', letterSpacing: '0.2em', marginBottom: 10 }}>
              DECODED LOG — PERSONAL ARCHIVE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {DECODED_LOG.map((entry, i) => (
                <div key={i} style={{
                  padding: '8px 10px', background: 'rgba(0,15,0,0.9)',
                  border: '1px solid rgba(80,180,80,0.15)',
                  animation: `fadeIn 0.5s ease ${(SEGMENTS.length * 0.12) + i * 0.2}s both`,
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(80,200,80,0.5)', letterSpacing: '0.15em', marginBottom: 5 }}>
                    {entry.label}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(160,230,180,0.75)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {entry.text}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigateTo(1 as WorldId, { type: 'fold' as PortalType })}
              style={{
                width: '100%', padding: '10px 0', background: 'rgba(64,170,255,0.1)',
                border: '1px solid #4af', color: '#4af', fontFamily: 'monospace',
                fontSize: 10, letterSpacing: '0.2em', cursor: 'pointer',
              }}
            >ARCHIVE AND EXIT</button>
          </div>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }`}</style>
    </div>
  )
}
