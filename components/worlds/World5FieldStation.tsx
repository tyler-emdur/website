'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ─── RADIO FREQUENCIES ──────────────────────────────────────────────────────

const BANDS: { freq: number; label: string; content: string }[] = [
  { freq: 72.4,  label: 'STATIC',       content: '░░▓░░▒░▓▒░░▓░░' },
  { freq: 80.0,  label: 'WEATHER',      content: 'BOULDER · CLEAR · 62°F · WIND 8mph NW · VISIBILITY: 10mi' },
  { freq: 88.7,  label: '─ ─ ─',        content: 'FREQUENCY RECOGNIZED. SIGNAL ORIGIN: UNKNOWN. COORDINATES: 40.0150°N 105.2705°W. DO NOT ADJUST DIAL. THIS FREQUENCY DOES NOT EXIST ON THIS BAND.' },
  { freq: 94.1,  label: 'BROADCAST',    content: 'you are listening to something that is not a radio station. this has been playing for longer than the station has been operating. nobody knows who started it. nobody has turned it off.' },
  { freq: 101.5, label: 'STATIC',       content: '▒░░▓▒░░░░▒▓░▒░' },
  { freq: 107.3, label: 'STATION ID',   content: 'THIS IS SIGNAL RIDGE STATION. OPERATING SINCE 1993. OVER.' },
  { freq: 114.9, label: 'MORSE',        content: '·− −··· −−− ··− ·−·  ·−·−·−  ·−·· · − ·−·· ·' },
]

function freqToStation(f: number) {
  return BANDS.reduce((best, b) => Math.abs(b.freq - f) < Math.abs(best.freq - f) ? b : best)
}

// ─── WINDOW SCENE ────────────────────────────────────────────────────────────

function WindowScene({ time }: { time: Date }) {
  const h = time.getHours()
  const isNight = h < 6 || h >= 20
  const isDusk = (h >= 17 && h < 20) || (h >= 6 && h < 9)

  const skyColor = isNight
    ? 'linear-gradient(180deg, #020510 0%, #060818 60%, #0a0d18 100%)'
    : isDusk
    ? 'linear-gradient(180deg, #1a0820 0%, #6b1e3a 40%, #c45520 80%, #1a0820 100%)'
    : 'linear-gradient(180deg, #0a1a3a 0%, #1a3a6a 50%, #2a5a8a 100%)'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: skyColor, overflow: 'hidden' }}>
      {/* Stars (night only) */}
      {isNight && Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 37 + 11) % 100}%`,
          top: `${(i * 23 + 7) % 65}%`,
          width: i % 5 === 0 ? 2 : 1,
          height: i % 5 === 0 ? 2 : 1,
          borderRadius: '50%',
          background: '#fff',
          opacity: 0.4 + (i % 3) * 0.2,
          animation: `twinkle ${2 + (i % 4)}s ease-in-out infinite`,
          animationDelay: `${(i % 7) * 0.3}s`,
        }} />
      ))}
      {/* Mountain silhouette */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '55%' }}
        viewBox="0 0 400 120" preserveAspectRatio="none">
        <path d="M0,120 L0,80 L30,55 L55,70 L80,30 L110,60 L140,45 L170,65 L200,20 L230,50 L260,35 L290,60 L320,40 L350,70 L380,50 L400,65 L400,120 Z"
          fill={isNight ? '#060810' : '#0a1820'} />
        <path d="M0,120 L0,95 L40,78 L70,85 L100,70 L130,80 L160,72 L200,65 L240,75 L270,68 L300,78 L340,70 L370,80 L400,75 L400,120 Z"
          fill={isNight ? '#08090e' : '#111f2e'} />
      </svg>
      {/* Tree line */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, background: isNight ? '#020204' : '#0a1014' }} />
    </div>
  )
}

// ─── RADIO DIAL ───────────────────────────────────────────────────────────────

function RadioDial({ freq, onChange }: { freq: number; onChange: (f: number) => void }) {
  const dragging = useRef(false)
  const startX = useRef(0)
  const startFreq = useRef(freq)

  const onWheel = (e: React.WheelEvent) => {
    const delta = Math.sign(e.deltaY) * 0.3
    onChange(Math.max(70, Math.min(120, freq + delta)))
  }

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startFreq.current = freq
    e.preventDefault()
  }
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return
    const delta = (e.clientX - startX.current) * 0.18
    onChange(Math.max(70, Math.min(120, startFreq.current + delta)))
  }, [onChange])
  const onMouseUp = useCallback(() => { dragging.current = false }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  const rotation = ((freq - 70) / 50) * 300 - 150

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Knob */}
      <div
        onMouseDown={onMouseDown}
        onWheel={onWheel}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #5a4a2a, #1a1208)',
          border: '2px solid #3a2e14',
          boxShadow: '0 3px 12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,200,80,0.1)',
          cursor: 'ew-resize', position: 'relative', userSelect: 'none',
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.05s',
        }}
      >
        {/* indicator line */}
        <div style={{
          position: 'absolute', top: 4, left: '50%',
          width: 2, height: 18,
          background: 'rgba(255,200,80,0.8)',
          transform: 'translateX(-50%)',
          borderRadius: 1,
        }} />
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,180,60,0.5)', letterSpacing: '0.1em' }}>DRAG</div>
    </div>
  )
}

// ─── NOTEBOOK PAGE ───────────────────────────────────────────────────────────

const NOTEBOOK_PAGES = [
  {
    title: 'Field Notes — Tyler E.',
    lines: [
      'Relocated Boulder CO 2022.',
      'Building things. Mostly software.',
      'Digger: music discovery app — shipped.',
      'This site: in progress (always).',
      '',
      'Stack: Next.js, TS, Three.js,',
      '  Zustand, Canvas API.',
      '',
      'Currently: looking for the',
      '  right problem.',
    ],
  },
  {
    title: 'Trail Log',
    lines: [
      'Pikes Peak — 14,115 ft',
      'Mt. Elbert — 14,439 ft',
      'Maroon Bells — Sep 2023, 5am',
      'Boulder Marathon — 3:41:22',
      'Golden Gate 25K — muddy',
      '',
      '"The light above treeline',
      ' is different."',
      '',
      '— can\'t photograph it correctly.',
    ],
  },
  {
    title: 'Observations',
    lines: [
      'Something on 88.7.',
      'Was there last night. Gone now.',
      '40.0150°N 105.2705°W',
      '',
      'Note to self: check antenna.',
      'The hum is back.',
      '',
      'Coordinates appear elsewhere.',
      'Cross-reference: depth, corridor.',
    ],
  },
  {
    title: 'Contact',
    lines: [
      'healthreinvented@gmail.com',
      '',
      'github.com/tyler-emdur',
      '',
      'Open to new projects.',
      'Interested in hard problems,',
      '  good teams, meaningful work.',
      '',
      'Will read everything.',
      'Response: within one orbit.',
    ],
  },
]

// ─── MORSE DECODER ───────────────────────────────────────────────────────────

const MORSE_DECODED = 'ABOUT · LETTR'

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function World5FieldStation() {
  const [time, setTime] = useState(new Date())
  const [freq, setFreq] = useState(101.5)
  const [notebookPage, setNotebookPage] = useState(0)
  const [lampOn, setLampOn] = useState(true)
  const [mugClicks, setMugClicks] = useState(0)
  const [barReading, setBarReading] = useState(29.92)
  const [logLines, setLogLines] = useState<string[]>([])
  const [transmission, setTransmission] = useState('')
  const [transmitting, setTransmitting] = useState(false)
  const [hatchOpen, setHatchOpen] = useState(false)
  const [hatchClicks, setHatchClicks] = useState(0)
  const sessionStart = useRef(Date.now())

  const station = freqToStation(freq)
  const onStation = Math.abs(freq - station.freq) < 1.5

  // clock + barometer drift
  useEffect(() => {
    const iv = setInterval(() => {
      setTime(new Date())
      setBarReading(b => +(b + (Math.random() - 0.5) * 0.002).toFixed(3))
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  // transmissions trigger on station lock
  useEffect(() => {
    if (!onStation || transmitting) return
    let iv: ReturnType<typeof setInterval> | undefined
    const t = setTimeout(() => {
      setTransmitting(true)
      setTransmission('')
      const msg = station.content
      let i = 0
      iv = setInterval(() => {
        setTransmission(msg.slice(0, i + 1))
        i++
        if (i >= msg.length) {
          clearInterval(iv)
          setLogLines(prev => {
            const line = `[${time.toLocaleTimeString('en-US', { hour12: false })}] ${station.freq} MHz — ${station.label}`
            return prev.includes(line) ? prev : [...prev.slice(-8), line]
          })
          setTimeout(() => setTransmitting(false), 4000)
        }
      }, 60)
    }, 600)
    return () => { clearTimeout(t); if (iv) clearInterval(iv) }
  }, [onStation, station.freq]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFreqNav = useCallback(() => {
    // navigation sealed
  }, [])

  const handleHatch = useCallback(() => {
    const c = hatchClicks + 1
    setHatchClicks(c)
    if (c >= 5) { setHatchOpen(true) }
  }, [hatchClicks])

  const uptime = Math.floor((Date.now() - sessionStart.current) / 1000)
  const h = String(Math.floor(uptime / 3600)).padStart(2, '0')
  const m = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0')
  const s = String(uptime % 60).padStart(2, '0')
  const uptimeStr = `${h}:${m}:${s}`

  return (
    <div
      data-world="5"
      style={{
        position: 'fixed', inset: 0,
        background: '#0c0904',
        fontFamily: 'monospace',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes staticFlicker { 0%,100%{opacity:0.7} 50%{opacity:0.4} }
        @keyframes txBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* Lamp glow — fills room based on lamp state */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: lampOn
          ? 'radial-gradient(ellipse 55% 45% at 72% 62%, rgba(255,160,40,0.14) 0%, transparent 70%)'
          : 'transparent',
        transition: 'background 0.4s',
      }} />

      {/* ── ROOM LAYOUT: 3 zones ── */}
      <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', gridTemplateRows: '1fr', padding: '28px 24px 24px', gap: 20 }}>

        {/* ── LEFT: Window + barometer + hatch ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Window */}
          <div style={{ flex: 1.4, border: '8px solid #2a1e0a', borderRadius: 2, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 0 0 2px #1a1206', overflow: 'hidden', position: 'relative' }}>
            <WindowScene time={time} />
            {/* window pane cross */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 4, background: '#2a1e0a', transform: 'translateX(-50%)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 4, background: '#2a1e0a', transform: 'translateY(-50%)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,220,140,0.4)', letterSpacing: '0.1em', pointerEvents: 'none' }}>
              BOULDER · CO · {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>

          {/* Barometer */}
          <div style={{ background: 'rgba(20,14,4,0.95)', border: '1px solid rgba(100,80,30,0.2)', padding: '10px 14px' }}>
            <div style={{ fontSize: 8, color: 'rgba(200,160,60,0.4)', letterSpacing: '0.2em', marginBottom: 6 }}>BAROMETER</div>
            <div style={{ fontSize: 18, color: 'rgba(220,180,80,0.8)', letterSpacing: '0.05em' }}>{barReading}"</div>
            <div style={{ fontSize: 7, color: 'rgba(200,160,60,0.3)', marginTop: 4 }}>
              {barReading > 30 ? 'FAIR' : barReading > 29.8 ? 'CHANGE' : 'STORM'}
            </div>
          </div>

          {/* Maintenance hatch */}
          <div
            onClick={hatchOpen ? undefined : handleHatch}
            style={{
              background: 'rgba(10,8,4,0.9)', border: `1px solid rgba(100,80,30,${hatchOpen ? 0.8 : 0.15})`,
              padding: '10px 14px', cursor: hatchOpen ? 'default' : 'pointer', position: 'relative',
              transition: 'border-color 0.3s',
            }}
          >
            <div style={{ fontSize: 8, color: 'rgba(200,160,60,0.3)', letterSpacing: '0.2em' }}>FLOOR HATCH</div>
            <div style={{ fontSize: 7, color: hatchOpen ? 'rgba(100,220,120,0.7)' : 'rgba(200,100,60,0.35)', marginTop: 4 }}>
              {hatchOpen ? '[ OPEN ]' : `[ LOCKED ${hatchClicks > 0 ? hatchClicks + '/5' : ''} ]`}
            </div>
            {hatchOpen && (
              <div style={{
                marginTop: 10, paddingTop: 10,
                borderTop: '1px solid rgba(100,80,30,0.2)',
                fontFamily: '"Special Elite", Georgia, serif',
                fontSize: 9, color: 'rgba(200,180,120,0.45)',
                lineHeight: 2,
              }}>
                <div style={{ fontSize: 7, color: 'rgba(200,160,60,0.25)', letterSpacing: '0.15em', marginBottom: 6 }}>HIDDEN LOG — PAGE 47</div>
                <div>[DAY 47]</div>
                <div>conditions: clear. 3am start.</div>
                <div>nothing to report.</div>
                <div style={{ color: 'rgba(200,180,120,0.3)', fontStyle: 'italic' }}>(something to report.)</div>
                <div>freq 88.7 confirmed again.</div>
                <div>coordinates: 40.0150°N</div>
                <div>the hum is consistent tonight.</div>
                <div>leaving at dawn.</div>
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER: Radio transceiver ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Radio unit */}
          <div style={{
            background: 'linear-gradient(160deg, #1e1608 0%, #120e04 60%, #0c0a02 100%)',
            border: '2px solid #2a2010',
            borderRadius: 4,
            padding: '20px 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,200,80,0.05)',
            flex: 1.5,
          }}>
            {/* Brand plate */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(200,160,60,0.4)', letterSpacing: '0.4em' }}>SIGNAL RIDGE</div>
              <div style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(200,160,60,0.2)', letterSpacing: '0.2em' }}>MODEL SR-1 · HAM TRANSCEIVER</div>
            </div>

            {/* Frequency display */}
            <div style={{
              background: '#060400', border: '1px solid rgba(255,140,0,0.2)',
              padding: '10px 16px', marginBottom: 16, textAlign: 'center',
              boxShadow: 'inset 0 0 16px rgba(255,100,0,0.05)',
            }}>
              <div style={{ fontFamily: '"VT323", monospace', fontSize: 36, color: 'rgba(255,140,40,0.9)', letterSpacing: '0.08em', textShadow: '0 0 12px rgba(255,100,0,0.6)' }}>
                {freq.toFixed(1)}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,140,40,0.35)', letterSpacing: '0.2em' }}>MHz FM</div>
            </div>

            {/* Station label when on frequency */}
            <div style={{ minHeight: 16, textAlign: 'center', marginBottom: 14 }}>
              {onStation && (
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(100,220,120,0.7)', letterSpacing: '0.2em', animation: 'txBlink 1s ease-in-out infinite' }}>
                  ● {station.label}
                </div>
              )}
            </div>

            {/* Controls row */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 }}>
              <RadioDial freq={freq} onChange={setFreq} />

              {/* Volume knob (decorative) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #3a2a10, #0c0804)', border: '2px solid #2a2010', boxShadow: '0 2px 8px rgba(0,0,0,0.6)' }} />
                <div style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(200,160,60,0.3)', letterSpacing: '0.1em' }}>VOL</div>
              </div>

              {/* Squelch knob (decorative) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #2a2010, #080604)', border: '1px solid #1a1608' }} />
                <div style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(200,160,60,0.3)', letterSpacing: '0.1em' }}>SQL</div>
              </div>
            </div>

            {/* Speaker grille */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 12px' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 2, background: 'rgba(60,50,20,0.6)', borderRadius: 1 }} />
              ))}
            </div>

            {/* Transmission area */}
            <div style={{ marginTop: 14, minHeight: 44, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(100,80,30,0.15)', padding: '8px 12px' }}>
              {transmitting || transmission ? (
                <div style={{
                  fontFamily: 'monospace', fontSize: 9,
                  color: station.freq === 88.7 ? 'rgba(100,220,180,0.9)' : 'rgba(200,200,180,0.7)',
                  lineHeight: 1.6, letterSpacing: '0.06em',
                  textShadow: station.freq === 88.7 ? '0 0 8px rgba(0,220,180,0.5)' : 'none',
                }}>
                  {transmission}
                  {transmitting && <span style={{ animation: 'txBlink 0.5s step-end infinite' }}>█</span>}
                </div>
              ) : (
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(100,80,30,0.3)', fontStyle: 'italic' }}>
                  {onStation ? 'receiving...' : 'scanning...'}
                </div>
              )}
            </div>

          </div>

          {/* Transmission log */}
          <div style={{ background: 'rgba(8,6,2,0.95)', border: '1px solid rgba(100,80,30,0.1)', padding: '10px 14px', maxHeight: 90, overflowY: 'auto' }}>
            <div style={{ fontSize: 7, color: 'rgba(200,160,60,0.3)', letterSpacing: '0.2em', marginBottom: 6 }}>RX LOG</div>
            {logLines.length === 0 ? (
              <div style={{ fontSize: 7, color: 'rgba(100,80,30,0.25)', fontStyle: 'italic' }}>no transmissions logged</div>
            ) : logLines.map((l, i) => (
              <div key={i} style={{ fontSize: 7, color: 'rgba(200,180,120,0.4)', lineHeight: 1.8 }}>{l}</div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Notebook + lamp + uptime ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Desk lamp */}
          <div
            onClick={() => setLampOn(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0' }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: lampOn ? '#ffb020' : '#1a1408',
              boxShadow: lampOn ? '0 0 16px rgba(255,160,30,0.7)' : 'none',
              border: '1px solid rgba(100,80,30,0.3)',
              transition: 'all 0.2s',
            }} />
            <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,160,60,0.35)', letterSpacing: '0.15em' }}>
              LAMP {lampOn ? 'ON' : 'OFF'}
            </div>
          </div>

          {/* Notebook */}
          <div style={{
            flex: 1, background: 'rgba(245,238,218,0.04)', border: '1px solid rgba(200,180,120,0.12)',
            padding: '14px 16px', position: 'relative', overflow: 'hidden',
          }}>
            {/* Coffee stain */}
            <div style={{ position: 'absolute', top: 20, right: 14, width: 38, height: 38, borderRadius: '50%', border: '2px solid rgba(120,80,40,0.12)', opacity: 0.6 }} />
            <div style={{ position: 'absolute', top: 22, right: 16, width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(120,80,40,0.08)' }} />

            <div style={{ fontFamily: '"Special Elite", Georgia, serif', fontSize: 11, color: 'rgba(220,200,160,0.5)', letterSpacing: '0.06em', marginBottom: 12, fontStyle: 'italic' }}>
              {NOTEBOOK_PAGES[notebookPage].title}
            </div>
            <div style={{ fontFamily: '"Special Elite", Georgia, serif', fontSize: 10, color: 'rgba(200,180,140,0.4)', lineHeight: 2.1 }}>
              {NOTEBOOK_PAGES[notebookPage].lines.map((l, i) => (
                <div key={i} style={{ borderBottom: l ? 'none' : undefined }}>{l || ' '}</div>
              ))}
            </div>
            {/* Ruled lines behind text */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} style={{ position: 'absolute', left: 14, right: 14, top: 44 + i * 20, height: 1, background: 'rgba(180,150,100,0.06)' }} />
              ))}
            </div>

            {/* Page tabs */}
            <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 4 }}>
              {NOTEBOOK_PAGES.map((_, i) => (
                <div key={i} onClick={() => setNotebookPage(i)} style={{ width: 10, height: 10, borderRadius: '50%', background: notebookPage === i ? 'rgba(200,160,60,0.5)' : 'rgba(200,160,60,0.15)', cursor: 'pointer' }} />
              ))}
            </div>
          </div>

          {/* Coffee mug */}
          <div
            onClick={() => { setMugClicks(c => c + 1) }}
            style={{ cursor: 'pointer', padding: '8px 14px', background: 'rgba(10,8,3,0.8)', border: '1px solid rgba(100,80,30,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div style={{ position: 'relative', width: 24, height: 28 }}>
              <div style={{ width: 20, height: 24, background: 'rgba(60,44,16,0.8)', border: '1px solid rgba(100,80,30,0.3)', borderRadius: '0 0 4px 4px' }} />
              <div style={{ position: 'absolute', top: 6, right: -6, width: 8, height: 12, borderRadius: '0 50% 50% 0', border: '1px solid rgba(100,80,30,0.3)', borderLeft: 'none' }} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,160,60,0.3)', lineHeight: 1.8 }}>
              <div>MUG #{mugClicks + 1}</div>
              <div style={{ opacity: 0.6 }}>{mugClicks < 3 ? 'still hot' : mugClicks < 7 ? 'lukewarm' : 'cold'}</div>
            </div>
          </div>

          {/* Station status */}
          <div style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(200,160,60,0.2)', lineHeight: 2.2, padding: '8px 0', letterSpacing: '0.1em' }}>
            <div>UPTIME: {uptimeStr}</div>
            <div>STATUS: MONITORING</div>
            <div>LAT 40.0150°N</div>
            <div>LNG 105.2705°W</div>
            <div>ALT 5,430 ft</div>
          </div>
        </div>
      </div>
      <HomeButton />
    </div>
  )
}
