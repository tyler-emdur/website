'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

interface Station {
  freq: number
  label: string
  sub: string
  world?: WorldId
  portal?: PortalType
  fake?: string
}

const STATIONS: Station[] = [
  { freq: 88.1, label: 'STATIC', sub: 'nothing here', fake: 'only snow' },
  { freq: 88.8, label: 'DEPTH FM', sub: 'drifting signals', world: 2, portal: 'scatter' },
  { freq: 89.4, label: 'DEAD AIR', sub: '…', fake: 'you imagined it' },
  { freq: 90.2, label: 'PUBLIC ACCESS', sub: 'channel something', world: 3, portal: 'expand-white' },
  { freq: 91.1, label: '★ PIXEL RADIO ★', sub: '8-bit emergency broadcast', world: 14, portal: 'chromatic' },
  { freq: 91.9, label: 'CORRIDOR LOOP', sub: 'do not turn around', world: 4, portal: 'slide-right' },
  { freq: 92.7, label: 'FIELD STATION', sub: 'boulder uplink', world: 5, portal: 'rotate' },
  { freq: 93.5, label: 'DOCUMENT FM', sub: 'good evening', world: 6, portal: 'nothing' },
  { freq: 94.2, label: 'MALL CLOSED', sub: 'permanently', world: 7, portal: 'cursor-flood' },
  { freq: 94.7, label: 'ROOM 10 REPEAT', sub: 'room 10 · room 10', world: 10, portal: 'vortex' },
  { freq: 95.3, label: 'DOUBLE VISION', sub: 'match match match', world: 11, portal: 'scatter' },
  { freq: 96.0, label: 'ROOT SHELL', sub: 'type help', world: 12, portal: 'nothing' },
  { freq: 96.8, label: 'VERTICAL DROP', sub: 'falling · falling', world: 13, portal: 'vortex' },
  { freq: 97.5, label: 'INDEX ERROR', sub: 'incomplete listing', world: 16, portal: 'fold' },
  { freq: 98.2, label: 'SIGNAL CLEAR', sub: 'portfolio normalized', world: 8, portal: 'fold' },
  { freq: 99.0, label: 'WHITE ROOM', sub: 'endpoint', world: 9, portal: 'expand-white' },
  { freq: 99.9, label: 'UNIVERSE DIRECT', sub: 'all sectors', world: 1, portal: 'fold' },
  { freq: 100.7, label: 'SURFACE NOISE', sub: 'before the door', world: 0, portal: 'door' },
  { freq: 101.5, label: 'TEST PATTERN', sub: 'color bars', fake: 'this station is a lie' },
  { freq: 102.3, label: 'ECHO CHAMBER', sub: '… … …', fake: 'your voice came back wrong' },
  { freq: 103.1, label: 'NULL', sub: '0 Hz', fake: 'tuning impossible' },
  { freq: 104.0, label: 'WORMHOLE WX', sub: 'weather in another dimension', world: 13, portal: 'vortex' },
  { freq: 105.5, label: 'LOOPBACK', sub: 'you are the DJ', world: 15, portal: 'nothing' },
  { freq: 107.9, label: 'END OF DIAL', sub: 'no more frequencies', fake: 'or are there' },
]

export default function World15Dial() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const findSecret = useWorldStore(s => s.findSecret)
  const [freq, setFreq] = useState(91.1)
  const [dragging, setDragging] = useState(false)
  const [tuned, setTuned] = useState<Station | null>(null)
  const [foundCount, setFoundCount] = useState(0)
  const foundRef = useRef(new Set<number>())
  const scopeRef = useRef<HTMLCanvasElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const nearest = useCallback((f: number) => {
    let best: Station | null = null
    let bestD = Infinity
    for (const s of STATIONS) {
      const d = Math.abs(s.freq - f)
      if (d < bestD) { bestD = d; best = s }
    }
    return bestD < 0.35 ? best : null
  }, [])

  useEffect(() => {
    setTuned(nearest(freq))
  }, [freq, nearest])

  useEffect(() => {
    const canvas = scopeRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = 280
    canvas.height = 80
    let raf = 0
    function draw() {
      ctx.fillStyle = '#0a1a0a'
      ctx.fillRect(0, 0, 280, 80)
      ctx.strokeStyle = 'rgba(34,197,94,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x < 280; x++) {
        const noise = tuned && !tuned.fake ? Math.sin(x * 0.08 + Date.now() * 0.005) * 8 : (Math.random() - 0.5) * (tuned ? 12 : 28)
        const y = 40 + noise
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.strokeStyle = tuned && tuned.world ? '#22c55e' : 'rgba(34,197,94,0.5)'
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [tuned])

  const tuneFromX = (clientX: number) => {
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setFreq(88 + t * 20)
  }

  const handleEnter = () => {
    if (!tuned?.world || !tuned.portal) return
    if (!foundRef.current.has(tuned.freq)) {
      foundRef.current.add(tuned.freq)
      setFoundCount(foundRef.current.size)
      findSecret(`dial-${tuned.freq}`)
    }
    if (foundRef.current.size >= 8) findSecret('dial-8-stations')
    navigateTo(tuned.world, { type: tuned.portal })
  }

  return (
    <div
      data-world="15"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #0f1a0f 0%, #050805 70%)',
        overflow: 'hidden',
        fontFamily: '"Share Tech Mono", monospace',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: tuned
          ? `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(34,197,94,${tuned.world ? 0.02 : 0.06}) 3px, rgba(34,197,94,0.06) 6px)`
          : 'none',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(520px, 92vw)',
      }}>
        <div style={{ fontSize: 10, color: 'rgba(34,197,94,0.5)', letterSpacing: '0.35em', marginBottom: 24, textAlign: 'center' }}>
          THE DIAL · FM 88.0 — 108.0
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(34,197,94,0.2)',
          padding: 24,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 28, color: tuned?.world ? '#4ade80' : 'rgba(34,197,94,0.7)' }}>
              {freq.toFixed(1)}
            </span>
            <span style={{ fontSize: 9, color: 'rgba(34,197,94,0.3)', letterSpacing: '0.15em' }}>MHz</span>
          </div>
          <canvas ref={scopeRef} style={{ width: '100%', height: 80, display: 'block', marginBottom: 16 }} />
          <div
            ref={barRef}
            onMouseDown={e => { setDragging(true); tuneFromX(e.clientX) }}
            onMouseMove={e => dragging && tuneFromX(e.clientX)}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onTouchStart={e => tuneFromX(e.touches[0].clientX)}
            onTouchMove={e => tuneFromX(e.touches[0].clientX)}
            style={{
              height: 32,
              background: 'linear-gradient(90deg, #1a2a1a, #0a3a0a, #1a2a1a)',
              border: '1px solid rgba(34,197,94,0.25)',
              position: 'relative',
              cursor: 'ew-resize',
            }}
          >
            <div style={{
              position: 'absolute',
              left: `${((freq - 88) / 20) * 100}%`,
              top: -4,
              width: 2,
              height: 40,
              background: '#22c55e',
              boxShadow: '0 0 12px #22c55e',
              transform: 'translateX(-1px)',
            }} />
          </div>
        </div>

        <div style={{ minHeight: 100, textAlign: 'center' }}>
          {tuned ? (
            <>
              <div style={{ fontSize: 14, color: tuned.world ? '#4ade80' : 'rgba(34,197,94,0.4)', letterSpacing: '0.2em', marginBottom: 8 }}>
                {tuned.label}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>{tuned.sub}</div>
              {tuned.fake && (
                <div style={{ fontSize: 9, color: 'rgba(255,80,80,0.5)', fontStyle: 'italic' }}>{tuned.fake}</div>
              )}
              {tuned.world && (
                <button
                  onClick={handleEnter}
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.4)',
                    color: '#4ade80',
                    fontFamily: 'inherit',
                    fontSize: 9,
                    letterSpacing: '0.25em',
                    padding: '10px 20px',
                    cursor: 'pointer',
                  }}
                >
                  TUNE IN →
                </button>
              )}
            </>
          ) : (
            <div style={{ fontSize: 10, color: 'rgba(34,197,94,0.25)', letterSpacing: '0.15em' }}>
              static between stations · keep turning
            </div>
          )}
        </div>

        <div style={{ marginTop: 32, fontSize: 8, color: 'rgba(34,197,94,0.2)', textAlign: 'center', letterSpacing: '0.1em' }}>
          stations found: {foundCount} · some frequencies lie · arrow keys work too
        </div>
      </div>

      <DialKeys freq={freq} setFreq={setFreq} />

      <HomeButton />
    </div>
  )
}

function DialKeys({ freq, setFreq }: { freq: number; setFreq: (f: number) => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setFreq(Math.max(88, freq - 0.1))
      if (e.key === 'ArrowRight') setFreq(Math.min(108, freq + 0.1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [freq, setFreq])
  return null
}
