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
  kind?: 'still' | 'video'
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
// Thirty-nine cameras around here will show you what they see, and they split
// three ways.
//
// Twenty-six belong to Parks & Open Space. They run on solar, they refresh
// every ten minutes, and every one is aimed at a trailhead parking lot so you
// can check whether it is full before you drive up. The nearest plate reader
// to any of them is kilometres away.
//
// Four belong to the City of Boulder: live video of signalised intersections.
// At Broadway & Canyon the city's camera and a Boulder PD reader are
// sixty-five metres apart, pointed at the same asphalt. One is showing you the
// intersection. The other is reading you.
//
// Nine belong to the state, and they are the ones that finish the thought.
// CDOT films US 36 continuously from milepost 37 to milepost 45 — the whole
// Boulder-to-Denver turnpike, a camera every mile or so, in order. Nobody
// hides any of this. The stills, the intersections, the entire commute: all of
// it is published, open, no key required. The only cameras in this county you
// cannot look through are the ones looking at your plate.
// HLS plays natively in Safari and on iOS and nowhere else, so everything else
// needs hls.js — a third of a megabyte, for one panel, in one of ten worlds.
// So it is imported here, at the moment a stream actually comes up, and never
// enters the bundle of anyone who does not walk into this room.
function VideoFeed({ url, onFail }: { url: string; onFail: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return

    // Do NOT ask canPlayType whether it can play HLS. Chrome answers "maybe"
    // and then renders a black rectangle forever, which is how this shipped
    // broken the first time. The honest question is whether the browser has
    // Media Source Extensions: if it does, hls.js drives it; if it does not,
    // it is iOS Safari, which is the one browser that really does play a
    // playlist straight from src.
    if (!('MediaSource' in window)) {
      v.src = url
      v.play().catch(() => {})
      const fail = () => onFail()
      v.addEventListener('error', fail)
      return () => { v.removeEventListener('error', fail); v.removeAttribute('src'); v.load() }
    }

    let cancelled = false
    let hls: { destroy: () => void } | null = null
    import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled) return
        // Some iOS versions expose MediaSource but cannot drive hls.js. They
        // can still play a playlist natively, so that is the fallback rather
        // than giving up.
        if (!Hls.isSupported()) {
          if (v.canPlayType('application/vnd.apple.mpegurl')) {
            v.src = url
            v.play().catch(() => {})
          } else {
            onFail()
          }
          return
        }
        // the panel is 232px wide; there is no reason to pull the 1080p ladder
        const h = new Hls({ capLevelToPlayerSize: true, maxBufferLength: 6 })
        hls = h
        h.on(Hls.Events.ERROR, (_evt, data) => { if (data.fatal) onFail() })
        h.loadSource(url)
        h.attachMedia(v)
        v.play().catch(() => {})
      })
      .catch(onFail)

    return () => { cancelled = true; hls?.destroy() }
  }, [url, onFail])

  return (
    <video
      ref={ref}
      muted
      playsInline
      autoPlay
      style={{
        width: '100%', height: '100%', objectFit: 'cover',
        filter: 'saturate(0.7) contrast(1.05)',
      }}
    />
  )
}

function metresBetween(aLat: number, aLon: number, bLat: number, bLon: number) {
  const lat = ((aLat + bLat) / 2) * (Math.PI / 180)
  const x = (bLon - aLon) * (Math.PI / 180) * Math.cos(lat)
  const y = (bLat - aLat) * (Math.PI / 180)
  return Math.sqrt(x * x + y * y) * 6371000
}

function LiveFeed({ feeds: all, readers, cameras }: { feeds: Feed[]; readers: number; cameras: Camera[] }) {
  // Left in file order the four streams sit at the end, behind twenty-six
  // stills — three minutes of parking lots before the good part. So they get
  // interleaved: a stream every third slot, so the thing worth seeing is never
  // more than twenty seconds away.
  const feeds = useMemo(() => {
    const live = all.filter(f => f.live)
    const vids = live.filter(f => f.kind === 'video')
    const stills = live.filter(f => f.kind !== 'video')
    if (!vids.length) return stills
    const out: Feed[] = []
    let vi = 0
    for (let s = 0; s < stills.length; s++) {
      if (s % 2 === 0) out.push(vids[vi++ % vids.length])
      out.push(stills[s])
    }
    return out
  }, [all])
  const frozen = useMemo(() => all.filter(f => !f.live), [all])
  const oldest = frozen.reduce((m, f) => Math.max(m, f.ageHours ?? 0), 0)
  const liveCount = useMemo(() => all.filter(f => f.live).length, [all])
  const videoCount = useMemo(() => all.filter(f => f.live && f.kind === 'video').length, [all])
  const [i, setI] = useState(0)
  const [bust, setBust] = useState(() => Date.now())
  const [broken, setBroken] = useState(false)
  const onFail = useCallback(() => setBroken(true), [])

  // a still has nothing to show after the first frame; a stream is the only
  // thing on this board that is actually moving, so it gets to stay up
  useEffect(() => {
    if (feeds.length < 2) return
    const dwell = feeds[i % feeds.length]?.kind === 'video' ? 15000 : 7000
    const id = setTimeout(() => { setI(v => (v + 1) % feeds.length); setBroken(false) }, dwell)
    return () => clearTimeout(id)
  }, [feeds, i])

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
  // The board already knows where all seventy-four readers stand, so it can
  // answer the only question that matters about any camera on this list: how
  // close is the nearest one that reads plates. At the open space properties
  // the answer is kilometres. At Broadway & Canyon it is sixty-five metres.
  const nearest = cameras.reduce(
    (m, c) => Math.min(m, metresBetween(f.lat, f.lon, c.lat, c.lon)),
    Infinity,
  )
  const nearestLabel = nearest < 1000
    ? `${Math.round(nearest)} M`
    : `${(nearest / 1000).toFixed(nearest < 10000 ? 1 : 0)} KM`

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flex: 1, justifyContent: 'flex-end', minWidth: 260 }}>
      <div style={{ fontSize: 10, lineHeight: 1.9, opacity: 0.65, textAlign: 'right' }}>
        <div style={{ opacity: 0.5, letterSpacing: 2 }}>FEEDS AVAILABLE</div>
        <div style={{ fontSize: 22, letterSpacing: 3, color: '#ffd666' }}>{liveCount} / {readers}</div>
        <div style={{ opacity: 0.6, maxWidth: 200 }}>
          {liveCount - videoCount} watch a parking lot.<br />
          {videoCount} watch a road.<br />
          none of them read plates.
        </div>
        <div style={{ marginTop: 8, opacity: 0.8 }}>
          <span style={{ opacity: 0.55, letterSpacing: 1 }}>NEAREST READER</span><br />
          <span style={{ fontSize: 15, letterSpacing: 2, color: '#ffd666' }}>{nearestLabel}</span>
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
        ) : f.kind === 'video' ? (
          <VideoFeed key={f.url} url={f.url} onFail={onFail} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${f.url}${f.url.includes('?') ? '&' : '?'}t=${bust}`}
            alt=""
            onError={onFail}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.7) contrast(1.05)' }}
          />
        )}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: '3px 6px',
          background: 'linear-gradient(180deg, transparent, rgba(8,6,3,0.9))',
          fontSize: 8, letterSpacing: 1, display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{(f.name ?? 'OPEN SPACE').toUpperCase().slice(0, 26)}</span>
          <span style={{ color: '#8fdc7a' }}>● {f.kind === 'video' ? 'LIVE VIDEO' : 'LIVE'}</span>
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

          <LiveFeed feeds={data.feeds} readers={data.count} cameras={data.cameras} />
        </div>
      </div>
    </div>
  )
}
