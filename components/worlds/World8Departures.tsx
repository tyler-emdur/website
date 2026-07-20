'use client'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import HomeButton from './HomeButton'
import { useWorldStore } from '@/lib/world-store'

// ── Departures ───────────────────────────────────────────────────────────────
// An airport flip-board, except the arrivals are you.
//
// Every row on this board is a real automated license plate reader, baked from
// OpenStreetMap into public/alpr.json (see scripts/bake-alpr.mjs). Real
// coordinates, real operators, real bearings. Boulder Police Department runs
// thirty-three of them inside one small city.
//
// The board does what a departures board does — it clatters, it re-sorts, it
// never stops — but there is no gate and no destination. The only thing
// arriving is a vehicle, and the board has decided the vehicle is yours.

interface Camera {
  lat: number
  lon: number
  town: string | null
  road: string | null
  cross: string | null
  operator: string | null
  maker: string | null
  facing: string | null
  zone: string | null
}
interface Feed {
  lat: number
  lon: number
  name: string | null
  url: string
  operator: string | null
  lastModified: string | null
  ageHours: number | null
  live: boolean
}
interface AlprPayload {
  generatedAt: string
  count: number
  withStreet: number
  bbox: [number, number, number, number]
  operators: Record<string, number>
  towns: Record<string, number>
  feeds: Feed[]
  cameras: Camera[]
}

const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 &·-'
const ROWS = 19

// Operators write themselves long. Boards do not have the room.
function shortOperator(op: string | null): string {
  // OSM is hand-typed; "Uknown" is a real value in the source data
  if (!op || /^u?n?known$/i.test(op.trim())) return 'UNATTRIBUTED'
  return op
    .replace('Police Department', 'PD')
    .replace("Sheriff's Office", 'SHERIFF')
    .replace('Department of Transportation', 'DOT')
    .replace(/,? Inc\.?$/, '')
    .replace("Owners' Association", 'HOA')
    .toUpperCase()
}

function locationOf(c: Camera): string {
  const road = (c.road ?? c.town ?? 'UNNAMED').toUpperCase()
  const abbrev = (s: string) => s
    .replace(/\bSTREET\b/g, 'ST').replace(/\bAVENUE\b/g, 'AVE')
    .replace(/\bBOULEVARD\b/g, 'BLVD').replace(/\bROAD\b/g, 'RD')
    .replace(/\bDRIVE\b/g, 'DR').replace(/\bHIGHWAY\b/g, 'HWY')
    .replace(/\bPARKWAY\b/g, 'PKWY').replace(/\bCOURT\b/g, 'CT')
    .replace(/\bLANE\b/g, 'LN').replace(/\bCIRCLE\b/g, 'CIR')
  return c.cross ? `${abbrev(road)} & ${abbrev(c.cross.toUpperCase())}` : abbrev(road)
}

// Columns need a gutter that truncation cannot eat, or a full-width cell runs
// into the next one and the board reads as garbage.
const pad = (s: string, n: number) => (s.length > n - 2 ? s.slice(0, n - 2) : s).padEnd(n)

// ── one split-flap line ──────────────────────────────────────────────────────
// Rather than a DOM node per character (thousands of them, thirteen rows deep),
// each row is one string that resolves left-to-right: leading characters have
// settled, the frontier is still spinning, the tail is blank. Same read as a
// mechanical board, a fraction of the cost.
function FlapRow({ text, delay, dim }: { text: string; delay: number; dim?: boolean }) {
  const [shown, setShown] = useState('')
  const rafRef = useRef(0)
  const startRef = useRef(0)

  useEffect(() => {
    const CPS = 46          // characters resolved per second
    const SPIN = 4          // chars ahead of the frontier still flipping
    startRef.current = 0
    const step = (t: number) => {
      if (!startRef.current) startRef.current = t
      const elapsed = t - startRef.current - delay
      if (elapsed < 0) { rafRef.current = requestAnimationFrame(step); return }
      const settled = Math.floor((elapsed / 1000) * CPS)
      if (settled >= text.length) { setShown(text); return }
      let out = text.slice(0, settled)
      for (let i = settled; i < Math.min(text.length, settled + SPIN); i++) {
        out += text[i] === ' '
          ? ' '
          : FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)]
      }
      setShown(out)
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)

    // rAF is throttled hard in background/occluded tabs — often to a frame a
    // second or less. The flip is decoration; a legible board is not. This
    // guarantees the row lands even if the animation never gets to run, so
    // coming back to the tab shows a full board rather than a blank one.
    const settleBy = delay + (text.length / CPS) * 1000 + 300
    const fallback = setTimeout(() => setShown(text), settleBy)

    return () => { cancelAnimationFrame(rafRef.current); clearTimeout(fallback) }
  }, [text, delay])

  return (
    <div style={{
      whiteSpace: 'pre',
      color: dim ? 'rgba(255,214,102,0.34)' : '#ffd666',
      textShadow: dim ? 'none' : '0 0 7px rgba(255,190,40,0.45)',
    }}>
      {shown}
    </div>
  )
}

// ── the map ──────────────────────────────────────────────────────────────────
// Every reader, plotted where it actually stands. The pulse is the row the
// board is currently clattering through.
function CameraMap({ cameras, bbox, activeIdx }: {
  cameras: Camera[]
  bbox: [number, number, number, number]
  activeIdx: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const cx = cv.getContext('2d')
    if (!cx) return
    let raf = 0
    let t = 0
    const [S, W, N, E] = bbox
    const resize = () => {
      const r = cv.getBoundingClientRect()
      cv.width = r.width * devicePixelRatio
      cv.height = r.height * devicePixelRatio
      cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      t += 0.016
      const w = cv.width / devicePixelRatio
      const h = cv.height / devicePixelRatio
      cx.clearRect(0, 0, w, h)

      const px = (lon: number) => ((lon - W) / (E - W)) * w
      const py = (lat: number) => (1 - (lat - S) / (N - S)) * h

      // grid
      cx.strokeStyle = 'rgba(255,214,102,0.07)'
      cx.lineWidth = 1
      for (let i = 1; i < 6; i++) {
        cx.beginPath(); cx.moveTo((w / 6) * i, 0); cx.lineTo((w / 6) * i, h); cx.stroke()
        cx.beginPath(); cx.moveTo(0, (h / 6) * i); cx.lineTo(w, (h / 6) * i); cx.stroke()
      }

      cameras.forEach((c, i) => {
        const x = px(c.lon), y = py(c.lat)
        const active = i === activeIdx
        if (active) {
          const pulse = (t * 1.6) % 1
          cx.beginPath()
          cx.arc(x, y, 3 + pulse * 16, 0, Math.PI * 2)
          cx.strokeStyle = `rgba(255,120,90,${0.8 * (1 - pulse)})`
          cx.lineWidth = 1.5
          cx.stroke()
        }
        cx.beginPath()
        cx.arc(x, y, active ? 2.6 : 1.5, 0, Math.PI * 2)
        cx.fillStyle = active ? '#ff8a5c' : 'rgba(255,214,102,0.5)'
        cx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [cameras, bbox, activeIdx])

  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
}

// ── the only thing on this board you can actually see ────────────────────────
// Of every camera in Boulder, four publish a picture. None of them are plate
// readers. They are pointed at open space, and they refresh every two minutes
// whether or not anyone is looking.
function LiveFeed({ feeds: all, readers }: { feeds: Feed[]; readers: number }) {
  const feeds = useMemo(() => all.filter(f => f.live), [all])
  const frozen = useMemo(() => all.filter(f => !f.live), [all])
  const oldest = frozen.reduce((m, f) => Math.max(m, f.ageHours ?? 0), 0)
  const [i, setI] = useState(0)
  const [bust, setBust] = useState(() => Date.now())
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    if (feeds.length < 2) return
    const id = setInterval(() => { setI(v => (v + 1) % feeds.length); setBroken(false) }, 7000)
    return () => clearInterval(id)
  }, [feeds.length])

  // the source caches for 120s; re-request a little slower than that
  useEffect(() => {
    const id = setInterval(() => setBust(Date.now()), 130000)
    return () => clearInterval(id)
  }, [])

  if (!feeds.length) {
    return (
      <div style={{ fontSize: 10, lineHeight: 2, opacity: 0.55, minWidth: 200, textAlign: 'right', flex: 1 }}>
        <div style={{ opacity: 0.5, letterSpacing: 2 }}>FEEDS AVAILABLE</div>
        <div style={{ fontSize: 22, letterSpacing: 4, color: '#ffd666' }}>0 / {readers}</div>
      </div>
    )
  }

  const f = feeds[i]
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flex: 1, justifyContent: 'flex-end', minWidth: 260 }}>
      <div style={{ fontSize: 10, lineHeight: 1.9, opacity: 0.65, textAlign: 'right' }}>
        <div style={{ opacity: 0.5, letterSpacing: 2 }}>FEEDS AVAILABLE</div>
        <div style={{ fontSize: 22, letterSpacing: 3, color: '#ffd666' }}>{feeds.length} / {readers}</div>
        <div style={{ opacity: 0.6, maxWidth: 200 }}>
          none of them read plates.<br />all of them face away from town.
        </div>
        {frozen.length > 0 && (
          <div style={{ marginTop: 8, opacity: 0.42, maxWidth: 200 }}>
            {frozen.length} more still answer,<br />
            and have not moved in {Math.round(oldest / 24)} days.
          </div>
        )}
      </div>
      <div style={{
        width: 'clamp(150px, 20vw, 232px)', height: 'clamp(90px, 15vh, 150px)',
        border: '1px solid rgba(255,214,102,0.25)', position: 'relative', flexShrink: 0,
        background: '#120f08', overflow: 'hidden',
      }}>
        {broken ? (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 9, opacity: 0.5, letterSpacing: 1,
          }}>FEED DOWN</div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${f.url}${f.url.includes('?') ? '&' : '?'}t=${bust}`}
            alt=""
            onError={() => setBroken(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.7) contrast(1.05)' }}
          />
        )}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: '3px 6px',
          background: 'linear-gradient(180deg, transparent, rgba(8,6,3,0.9))',
          fontSize: 8, letterSpacing: 1, display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{(f.name ?? 'OPEN SPACE').toUpperCase().slice(0, 22)}</span>
          <span style={{ color: '#8fdc7a' }}>● LIVE</span>
        </div>
      </div>
    </div>
  )
}

export default function World8Departures() {
  const findSecret = useWorldStore(s => s.findSecret)
  const [data, setData] = useState<AlprPayload | null>(null)
  const [failed, setFailed] = useState(false)
  const [offset, setOffset] = useState(0)
  const [cycle, setCycle] = useState(0)
  const enteredAt = useRef(Date.now())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    fetch('/alpr.json')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true))
  }, [])

  // the board re-sorts on its own, forever
  useEffect(() => {
    if (!data) return
    const id = setInterval(() => {
      setOffset(o => (o + ROWS) % Math.max(1, data.cameras.length))
      setCycle(c => c + 1)
    }, 9000)
    return () => clearInterval(id)
  }, [data])

  // clock
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // stay long enough and the board stops being about the cameras
  useEffect(() => {
    if (cycle >= 3) findSecret('departures-watched-the-board')
  }, [cycle, findSecret])

  const rows = useMemo(() => {
    if (!data) return []
    const out: { key: string; text: string }[] = []
    for (let i = 0; i < ROWS; i++) {
      const idx = (offset + i) % data.cameras.length
      const c = data.cameras[idx]
      const mins = (i * 7 + cycle * 13) % 60
      const hrs = (4 + Math.floor((i * 7 + cycle * 13) / 60)) % 24
      const time = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
      out.push({
        key: `${cycle}-${idx}`,
        text:
          `${time}  ${pad((c.town ?? '—').toUpperCase(), 16)}${pad(locationOf(c), 30)}` +
          `${pad(shortOperator(c.operator), 20)}${pad(c.facing ?? '—', 6)}${i % 4 === 3 ? 'HOLD' : 'READ'}`,
      })
    }
    return out
  }, [data, offset, cycle])

  const activeIdx = data ? (offset + (Math.floor(Date.now() / 900) % ROWS)) % data.cameras.length : 0
  const reads = 40331 + Math.floor((Date.now() - enteredAt.current) / 1000) * 3

  const shell: React.CSSProperties = {
    position: 'fixed', inset: 0, background: '#0a0906', overflow: 'hidden',
    fontFamily: '"Space Mono", ui-monospace, monospace', color: '#ffd666',
  }

  if (failed) {
    return (
      <div style={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <HomeButton />
        <div style={{ fontSize: 12, opacity: 0.5, letterSpacing: 2 }}>BOARD OFFLINE — NO READER DATA</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <HomeButton />
        <div style={{ fontSize: 11, opacity: 0.45, letterSpacing: 3 }}>ACQUIRING READERS…</div>
      </div>
    )
  }

  const clock = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <div style={shell}>
      <HomeButton />

      {/* the board */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        padding: 'clamp(16px, 3vw, 40px)', gap: 14,
      }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 'clamp(15px, 2.4vw, 24px)', letterSpacing: 6, fontWeight: 700 }}>
            DEPARTURES
          </div>
          <div style={{ fontSize: 11, opacity: 0.55, letterSpacing: 2 }}>
            BOULDER · {data.count} READERS ON FILE · {clock}
          </div>
        </div>

        {/* column heads */}
        <div style={{
          whiteSpace: 'pre', fontSize: 'clamp(8px, 1.05vw, 12px)',
          color: 'rgba(255,214,102,0.4)', borderBottom: '1px solid rgba(255,214,102,0.18)',
          paddingBottom: 6, letterSpacing: 1,
        }}>
          {`TIME   ${pad('TOWN', 16)}${pad('LOCATION', 30)}${pad('OPERATOR', 20)}${pad('FACE', 6)}STATUS`}
        </div>

        {/* rows */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(2px, 0.7vh, 8px)',
          fontSize: 'clamp(8px, 1.05vw, 12px)', letterSpacing: 1, overflow: 'hidden',
        }}>
          {rows.map((r, i) => (
            <FlapRow key={r.key} text={r.text} delay={i * 55} dim={r.text.endsWith('HOLD')} />
          ))}
        </div>

        {/* footer: the map, and the part that is about you */}
        <div style={{
          display: 'flex', gap: 18, alignItems: 'stretch',
          borderTop: '1px solid rgba(255,214,102,0.18)', paddingTop: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 'clamp(150px, 22vw, 260px)', height: 'clamp(90px, 15vh, 150px)',
            border: '1px solid rgba(255,214,102,0.18)', flexShrink: 0,
          }}>
            <CameraMap cameras={data.cameras} bbox={data.bbox} activeIdx={activeIdx} />
          </div>

          <div style={{ fontSize: 10, lineHeight: 2, opacity: 0.75, minWidth: 240, flex: 1 }}>
            <div style={{ opacity: 0.5, letterSpacing: 2, marginBottom: 4 }}>VEHICLE ON FILE</div>
            <div>PLATE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ███ ████</div>
            <div>FIRST SEEN&nbsp;&nbsp; 2019 · you do not remember 2019</div>
            <div>READS ON FILE {reads.toLocaleString()}</div>
            <div>RETENTION&nbsp;&nbsp;&nbsp;&nbsp; 30 DAYS <span style={{ opacity: 0.55 }}>(RENEWING)</span></div>
          </div>

          <LiveFeed feeds={data.feeds} readers={data.count} />
        </div>
      </div>
    </div>
  )
}
