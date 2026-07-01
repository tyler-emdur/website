'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import HomeButton from './HomeButton'
import { runs, formatTime, formatPace } from '@/lib/data/runs'
import { adventures } from '@/lib/data/adventures'
import type { Run, Adventure } from '@/lib/types'

// runs don't carry lat/lng — map each real-world location to its actual coordinates
const RUN_COORDS: Record<string, [number, number]> = {
  'Boulder, CO': [40.0150, -105.2705],
  'Manitou Springs, CO': [38.8597, -104.9172],
  'Denver, CO': [39.7392, -104.9903],
  'Littleton, CO': [39.6133, -105.0166],
  'Golden, CO': [39.7555, -105.2211],
}

const VBW = 1000, VBH = 620, PAD = 60
const LAT_MIN = 37.0, LAT_MAX = 40.6
const LNG_MIN = -113.3, LNG_MAX = -104.6
function projX(lng: number) { return ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (VBW - 2 * PAD) + PAD }
function projY(lat: number) { return (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * (VBH - 2 * PAD) + PAD }

type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'
const TIME_SEQUENCE: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night']
const SKY: Record<TimeOfDay, { top: string; bottom: string; range: string; accent: string; label: string }> = {
  dawn: { top: '#2b2450', bottom: '#e8956b', range: '#4a3a5a', accent: '#ffb37a', label: '5:40 AM · DAWN' },
  day: { top: '#5aa9e6', bottom: '#cfe9ff', range: '#3c6e8f', accent: '#ffffff', label: '1:15 PM · DAY' },
  dusk: { top: '#2a1a3d', bottom: '#c96b4e', range: '#3a2a45', accent: '#ff8f5c', label: '7:50 PM · DUSK' },
  night: { top: '#03040d', bottom: '#0c1330', range: '#151a30', accent: '#8fb2ff', label: '11:20 PM · NIGHT' },
}

function SplitChart({ run }: { run: Run }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    c.width = c.offsetWidth; c.height = c.offsetHeight
    const pts = run.splits.length ? run.splits : [run.pace_min_mi]
    const mn = Math.min(...pts), mx = Math.max(...pts)
    ctx.fillStyle = '#00121f'
    ctx.fillRect(0, 0, c.width, c.height)
    const barW = c.width / pts.length
    pts.forEach((p, i) => {
      const h = mx === mn ? c.height * 0.5 : ((p - mn) / (mx - mn)) * (c.height - 6) + 4
      ctx.fillStyle = '#5ecbe0'
      ctx.fillRect(i * barW + 1, c.height - h, barW - 2, h)
    })
  }, [run])
  return <canvas ref={ref} style={{ width: '100%', height: 44, display: 'block', border: '1px solid #1a3040' }} />
}

function RoutePreview({ run }: { run: Run }) {
  const pts = run.route_points
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const w = 200, h = 60, pad = 6
  const sx = (x: number) => maxX === minX ? w / 2 : ((x - minX) / (maxX - minX)) * (w - pad * 2) + pad
  const sy = (y: number) => maxY === minY ? h / 2 : h - (((y - minY) / (maxY - minY)) * (h - pad * 2) + pad)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 60, background: '#00121f', border: '1px solid #1a3040' }}>
      <path d={d} fill="none" stroke="#5ecbe0" strokeWidth={2} />
    </svg>
  )
}

function AdventurePanel({ a }: { a: Adventure }) {
  return (
    <div style={{ fontFamily: '"Space Mono", monospace', color: '#e6f0f5', fontSize: 11, lineHeight: 1.7 }}>
      <div style={{
        height: 90, marginBottom: 10, background: `linear-gradient(135deg, ${a.color}55, ${a.color}11)`,
        border: `1px solid ${a.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28,
      }}>🏔</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: a.color }}>{a.location}, {a.state}</div>
      <div style={{ fontSize: 9, color: '#8aa', marginBottom: 8 }}>{a.date} · {a.elevation_ft.toLocaleString()} ft</div>
      <div>{a.description}</div>
    </div>
  )
}

function RunPanel({ r }: { r: Run }) {
  return (
    <div style={{ fontFamily: '"Space Mono", monospace', color: '#e6f0f5', fontSize: 11, lineHeight: 1.7 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#5ecbe0' }}>{r.name}</div>
      <div style={{ fontSize: 9, color: '#8aa', marginBottom: 8 }}>{r.date} · {r.location}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10, fontSize: 10 }}>
        <div>DIST <span style={{ color: '#fff' }}>{r.distance_mi.toFixed(1)} mi</span></div>
        <div>TIME <span style={{ color: '#fff' }}>{formatTime(r.time_s)}</span></div>
        <div>PACE <span style={{ color: '#fff' }}>{formatPace(r.pace_min_mi)}/mi</span></div>
        <div>GAIN <span style={{ color: '#fff' }}>+{r.elevation_ft.toLocaleString()} ft</span></div>
      </div>
      <div style={{ fontSize: 9, color: '#8aa', marginBottom: 4 }}>PACE SPLITS</div>
      <SplitChart run={r} />
      <div style={{ fontSize: 9, color: '#8aa', margin: '10px 0 4px' }}>ROUTE SHAPE</div>
      <RoutePreview run={r} />
    </div>
  )
}

type Marker =
  | { id: string; kind: 'adventure'; lat: number; lng: number; color: string; data: Adventure }
  | { id: string; kind: 'run'; lat: number; lng: number; color: string; data: Run }
  | { id: string; kind: 'story'; lat: number; lng: number; color: string }

export default function World2Explorer() {
  const [timeIdx, setTimeIdx] = useState(1)
  const [selected, setSelected] = useState<Marker | null>(null)
  const [visited, setVisited] = useState<Set<string>>(new Set())
  const time = TIME_SEQUENCE[timeIdx]
  const sky = SKY[time]

  const markers: Marker[] = useMemo(() => {
    const advMarkers: Marker[] = adventures.map(a => ({ id: `a:${a.id}`, kind: 'adventure', lat: a.lat, lng: a.lng, color: a.color, data: a }))
    const runMarkers: Marker[] = runs
      .filter(r => RUN_COORDS[r.location])
      .map(r => {
        const [lat, lng] = RUN_COORDS[r.location]
        return { id: `r:${r.id}`, kind: 'run', lat, lng, color: '#5ecbe0', data: r }
      })
    return [...advMarkers, ...runMarkers]
  }, [])

  const storyMarker: Marker = { id: 'story:goldengate', kind: 'story', lat: 39.79, lng: -105.42, color: '#F472B6' }

  function selectMarker(mk: Marker) {
    setSelected(mk)
    setVisited(prev => new Set(prev).add(mk.id))
  }

  return (
    <div data-world="2" style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: sky.top }}>
      <style>{`
        @keyframes w2-twinkle { 0%,100% { opacity: 0.2 } 50% { opacity: 0.9 } }
        .w2-star { animation: w2-twinkle 3s ease-in-out infinite; }
        .w2-pin { cursor: pointer; transition: r 0.15s; }
        .w2-pin:hover { r: 9; }
      `}</style>
      <HomeButton />

      {/* header */}
      <div style={{
        position: 'fixed', top: 20, left: 24, zIndex: 20, fontFamily: '"Space Mono", monospace', color: sky.accent,
      }}>
        <div style={{ fontSize: 13, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Boulder Explorer</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{markers.length} places · click a pin to unlock it · {visited.size}/{markers.length} explored</div>
      </div>

      {/* time of day control */}
      <div
        onClick={() => setTimeIdx(i => (i + 1) % TIME_SEQUENCE.length)}
        style={{
          position: 'fixed', top: 20, right: 24, zIndex: 20, cursor: 'pointer', fontFamily: '"Space Mono", monospace',
          fontSize: 10, letterSpacing: '0.15em', color: sky.accent, border: `1px solid ${sky.accent}55`,
          padding: '8px 14px', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
        }}
      >
        {sky.label} → click to advance
      </div>

      <svg viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky.top} />
            <stop offset="100%" stopColor={sky.bottom} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={VBW} height={VBH} fill="url(#sky)" />

        {time === 'night' && Array.from({ length: 60 }).map((_, i) => {
          const x = (i * 137) % VBW, y = (i * 89) % (VBH * 0.6)
          return <circle key={i} className="w2-star" cx={x} cy={y} r={1} fill="#fff" style={{ animationDelay: `${i % 10 * 0.3}s` }} />
        })}

        {/* stylized mountain range silhouettes, parallax layers */}
        <path d={`M0,${VBH} L0,420 L120,340 L220,400 L340,300 L460,390 L580,320 L720,410 L860,330 L1000,400 L${VBW},${VBH} Z`} fill={sky.range} opacity={0.5} />
        <path d={`M0,${VBH} L0,480 L150,420 L280,470 L400,400 L540,460 L680,410 L820,470 L960,430 L${VBW},480 L${VBW},${VBH} Z`} fill={sky.range} opacity={0.8} />

        {/* topo contour lines */}
        {[0.55, 0.62, 0.7, 0.78].map((f, i) => (
          <path key={i} d={`M40,${VBH * f} Q 260,${VBH * f - 30} 500,${VBH * f} T ${VBW - 40},${VBH * f}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        ))}

        {/* markers */}
        {markers.map(mk => {
          const x = projX(mk.lng), y = projY(mk.lat)
          const isVisited = visited.has(mk.id)
          return (
            <g key={mk.id} transform={`translate(${x},${y})`} onClick={() => selectMarker(mk)} className="w2-pin">
              <circle r={9} fill={mk.color} opacity={0.15} />
              <circle r={5} fill={isVisited ? mk.color : '#0a0e14'} stroke={mk.color} strokeWidth={1.5} />
            </g>
          )
        })}

        {/* hidden story marker — only surfaces at night */}
        {time === 'night' && (
          <g transform={`translate(${projX(storyMarker.lng)},${projY(storyMarker.lat)})`} onClick={() => selectMarker(storyMarker)} className="w2-pin">
            <circle r={12} fill={storyMarker.color} opacity={0.25}>
              <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r={5} fill={storyMarker.color} stroke="#fff" strokeWidth={1} />
          </g>
        )}
      </svg>

      {/* info panel */}
      {selected && (
        <div style={{
          position: 'fixed', right: 24, bottom: 24, top: 84, width: 320, maxWidth: 'calc(100vw - 48px)',
          background: 'rgba(6,10,18,0.92)', border: '1px solid rgba(94,203,224,0.3)', backdropFilter: 'blur(10px)',
          padding: 16, overflowY: 'auto', zIndex: 30,
        }}>
          <div onClick={() => setSelected(null)} style={{ position: 'absolute', top: 10, right: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>×</div>
          {selected.kind === 'adventure' && <AdventurePanel a={selected.data} />}
          {selected.kind === 'run' && <RunPanel r={selected.data} />}
          {selected.kind === 'story' && (
            <div style={{ fontFamily: '"Space Mono", monospace', color: '#e6f0f5', fontSize: 11, lineHeight: 1.8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F472B6', marginBottom: 8 }}>★ Golden Gate Canyon, logged twice</div>
              <div>
                This place shows up in two different logs. The running log has it as a 25K race —
                mile 10 onward felt personal, the course record stood, mine didn&apos;t. The adventure
                log has the same afternoon filed as scenery.
                <br /><br />
                Same trail. Two different parts of my brain were keeping notes.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
