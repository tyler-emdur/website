'use client'
import { useRef, useEffect, useState } from 'react'
import { projects } from '@/lib/data/projects'

// The drive. A 2D-canvas night highway out of the garage. The road curves and
// rolls, and the country changes as the odometer turns: the edge of town, open
// highway, a canyon, a storm on the high plain. Mile-marker signs are the years
// of your projects. Radio on the dash.

interface NightDriveProps {
  freq: number
  stationName: string
  stationPlaying: string
  tuned: boolean
  onSeek: (dir: number) => void
  onExit: () => void
  onLongDrive: () => void
}

interface Sign { label: string; sub: string }

const SIGNS: Sign[] = [
  ...projects
    .slice()
    .sort((a, b) => a.year - b.year)
    .map(p => ({ label: `${p.year}`, sub: p.title.toUpperCase() })),
  { label: 'BOULDER', sub: 'ELEV 5430' },
  { label: 'NEXT EXIT', sub: 'NO SERVICES' },
  { label: 'I-70 W', sub: 'MOUNTAINS' },
]

// ── the country: phases of the drive, keyed to distance ─────────────────────
// Each phase describes the world outside the windshield. Phases crossfade.
interface Phase {
  name: string
  town: number      // streetlights + building silhouettes
  canyon: number    // rock walls closing in on both sides
  storm: number     // cloud bank + lightning on the horizon
  tower: number     // distant radio tower, blinking red
  ridgeAmp: number  // mountain silhouette height
}

const PHASES: Phase[] = [
  { name: 'LEAVING TOWN',      town: 1, canyon: 0, storm: 0, tower: 0, ridgeAmp: 0.6 },
  { name: 'OPEN HIGHWAY',      town: 0, canyon: 0, storm: 0, tower: 1, ridgeAmp: 1.0 },
  { name: 'THE CANYON',        town: 0, canyon: 1, storm: 0, tower: 0, ridgeAmp: 0.4 },
  { name: 'HIGH PLAIN · STORM AHEAD', town: 0, canyon: 0, storm: 1, tower: 0, ridgeAmp: 0.5 },
  { name: 'THE LONG DESCENT',  town: 0, canyon: 0, storm: 0.3, tower: 1, ridgeAmp: 1.3 },
]
const PHASE_LEN = 5200          // world-distance length of each phase
const PHASE_FADE = 900          // crossfade window at each boundary

function phaseMix(dist: number): { a: Phase; b: Phase; t: number; label: string } {
  const total = PHASES.length * PHASE_LEN
  const d = ((dist % total) + total) % total
  const i = Math.floor(d / PHASE_LEN)
  const local = d - i * PHASE_LEN
  const a = PHASES[i]
  const b = PHASES[(i + 1) % PHASES.length]
  const t = local > PHASE_LEN - PHASE_FADE ? (local - (PHASE_LEN - PHASE_FADE)) / PHASE_FADE : 0
  return { a, b, t, label: t > 0.5 ? b.name : a.name }
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t

export default function NightDrive({ freq, stationName, stationPlaying, tuned, onSeek, onExit, onLongDrive }: NightDriveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signIdx, setSignIdx] = useState(0)
  const [odometer, setOdometer] = useState(0)
  const [phaseLabel, setPhaseLabel] = useState(PHASES[0].name)
  const speedRef = useRef(64)
  const passedRef = useRef(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit()
      if (e.key === 'ArrowLeft') onSeek(-1)
      if (e.key === 'ArrowRight') onSeek(1)
      if (e.key === 'ArrowUp') speedRef.current = Math.min(90, speedRef.current + 4)
      if (e.key === 'ArrowDown') speedRef.current = Math.max(35, speedRef.current - 4)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit, onSeek])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')!
    let raf = 0
    let dist = 0            // world distance travelled
    let signZ = 900         // distance to next sign
    let currentSign = 0
    let last = performance.now()
    let lastPhaseName = PHASES[0].name

    const stars = Array.from({ length: 140 }, (_, i) => ({
      x: (i * 379 + 83) % 1000 / 1000,
      y: ((i * 211 + 37) % 420) / 1000,
      r: i % 7 === 0 ? 1.4 : 0.8,
      tw: (i * 977) % 100 / 100,
    }))

    // oncoming car: a pair of headlights in the opposite lane
    const oncoming = { z: -1, timer: 5 }        // z in (0..1], 1 = horizon
    // car ahead: taillights you slowly gain on
    const ahead = { z: -1, timer: 14 }
    // lightning state
    const bolt = { flash: 0, timer: 4 }

    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const W = cv.width, H = cv.height
      const speed = speedRef.current
      dist += speed * dt * 8

      const { a: pa, b: pb, t: pt, label } = phaseMix(dist)
      if (label !== lastPhaseName) { lastPhaseName = label; setPhaseLabel(label) }
      const town = mix(pa.town, pb.town, pt)
      const canyon = mix(pa.canyon, pb.canyon, pt)
      const storm = mix(pa.storm, pb.storm, pt)
      const tower = mix(pa.tower, pb.tower, pt)
      const ridgeAmp = mix(pa.ridgeAmp, pb.ridgeAmp, pt)

      // ── road geometry: curvature + hills ──────────────────────────────────
      // curvature: where the vanishing point sits laterally; drifts with distance
      const curve = Math.sin(dist / 2600) * 0.55 + Math.sin(dist / 990 + 2.1) * 0.3
      // hills: horizon breathes up and down
      const hill = Math.sin(dist / 3400 + 1.2) * 0.045 + Math.sin(dist / 1300) * 0.02
      const horizon = H * (0.46 + hill)
      const cxm = W / 2

      // lightning fires from the storm bank
      if (storm > 0.25) {
        bolt.timer -= dt
        if (bolt.timer <= 0) { bolt.flash = 1; bolt.timer = 1.4 + Math.random() * 4 }
      }
      bolt.flash = Math.max(0, bolt.flash - dt * 3.2)
      const flash = bolt.flash * storm

      // ── sky ────────────────────────────────────────────────────────────────
      const sky = cx.createLinearGradient(0, 0, 0, horizon)
      sky.addColorStop(0, flash > 0.02 ? `rgb(${8 + flash * 40},${9 + flash * 42},${20 + flash * 60})` : '#04050c')
      sky.addColorStop(0.7, '#0a0c1a')
      sky.addColorStop(1, town > 0.3 ? '#1c1424' : '#141326')  // town throws light pollution up
      cx.fillStyle = sky
      cx.fillRect(0, 0, W, horizon)

      // moon — a thin, patient crescent
      const moonX = W * 0.78, moonY = H * 0.13
      cx.fillStyle = 'rgba(230,235,245,0.85)'
      cx.beginPath(); cx.arc(moonX, moonY, 14, 0, Math.PI * 2); cx.fill()
      cx.fillStyle = '#06070f'
      cx.beginPath(); cx.arc(moonX - 6, moonY - 3, 13, 0, Math.PI * 2); cx.fill()
      cx.fillStyle = 'rgba(230,235,245,0.05)'
      cx.beginPath(); cx.arc(moonX, moonY, 26, 0, Math.PI * 2); cx.fill()

      // stars
      stars.forEach(s => {
        cx.globalAlpha = (0.25 + 0.55 * Math.abs(Math.sin(now / 900 + s.tw * 7))) * (1 - storm * 0.6)
        cx.fillStyle = '#cdd4e8'
        cx.beginPath()
        cx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        cx.fill()
      })
      cx.globalAlpha = 1

      // storm bank on the horizon: heavy cloud mass, lit from inside by lightning
      if (storm > 0.02) {
        const bankH = H * 0.24 * storm
        // billowing top edge, two lobed layers
        const cloudLayer = (yOff: number, alpha: number, lit: number) => {
          cx.fillStyle = `rgba(${18 + flash * lit},${18 + flash * lit},${30 + flash * lit * 1.3},${alpha * storm})`
          cx.beginPath()
          cx.moveTo(0, horizon)
          for (let x = 0; x <= W; x += 12) {
            const t = x / 170 + dist / 4000
            const lobes = Math.sin(t) * 0.5 + Math.sin(t * 2.3 + 1.7) * 0.3 + Math.sin(t * 0.6 + 4) * 0.7
            cx.lineTo(x, horizon - yOff - bankH * (0.45 + 0.3 * lobes))
          }
          cx.lineTo(W, horizon + 2)
          cx.lineTo(0, horizon + 2)
          cx.fill()
        }
        cloudLayer(bankH * 0.35, 0.55, 120)
        cloudLayer(0, 0.85, 70)
        // the bolt itself, occasionally visible
        if (flash > 0.55) {
          cx.strokeStyle = `rgba(235,240,255,${flash})`
          cx.lineWidth = 1.5
          cx.beginPath()
          let bx = W * (0.3 + ((dist | 0) % 40) / 100), by = horizon - bankH * 0.9
          cx.moveTo(bx, by)
          for (let s = 0; s < 5; s++) {
            bx += (Math.random() - 0.5) * 40
            by += bankH * 0.2
            cx.lineTo(bx, by)
          }
          cx.stroke()
        }
      }

      // mountain silhouettes, two parallax layers
      const ridge = (seed: number, amp: number, yBase: number, color: string, scrollDiv: number) => {
        cx.fillStyle = color
        cx.beginPath()
        cx.moveTo(0, yBase)
        const scroll = dist / scrollDiv
        for (let x = 0; x <= W; x += 8) {
          const t = (x + scroll) / 190
          const y = yBase - (Math.sin(t + seed) + Math.sin(t * 2.7 + seed * 3) * 0.5 + Math.sin(t * 0.4 + seed * 7) * 1.4) * amp
          cx.lineTo(x, y)
        }
        cx.lineTo(W, horizon + 2)
        cx.lineTo(0, horizon + 2)
        cx.fill()
      }
      ridge(2.1, 26 * ridgeAmp, horizon - 8, flash > 0.05 ? `rgba(${16 + flash * 30},${18 + flash * 30},${30 + flash * 40},1)` : '#0b0d18', 90)
      ridge(5.7, 40 * ridgeAmp, horizon + 2, '#06070f', 45)

      // distant radio tower with blinking red light
      if (tower > 0.05) {
        const tx = ((dist / 14) % (W * 1.6)) // slow parallax drift
        const towerX = W * 1.1 - tx
        if (towerX > -20 && towerX < W + 20) {
          const th = H * 0.11
          cx.strokeStyle = `rgba(60,62,72,${0.8 * tower})`
          cx.lineWidth = 1
          cx.beginPath()
          cx.moveTo(towerX - 5, horizon); cx.lineTo(towerX, horizon - th)
          cx.moveTo(towerX + 5, horizon); cx.lineTo(towerX, horizon - th)
          cx.moveTo(towerX - 3.4, horizon - th * 0.35); cx.lineTo(towerX + 3.4, horizon - th * 0.35)
          cx.moveTo(towerX - 2, horizon - th * 0.68); cx.lineTo(towerX + 2, horizon - th * 0.68)
          cx.stroke()
          const blink = Math.sin(now / 480) > 0.35
          if (blink) {
            cx.fillStyle = `rgba(255,60,50,${0.9 * tower})`
            cx.beginPath(); cx.arc(towerX, horizon - th, 2.2, 0, Math.PI * 2); cx.fill()
            cx.fillStyle = `rgba(255,60,50,${0.18 * tower})`
            cx.beginPath(); cx.arc(towerX, horizon - th, 7, 0, Math.PI * 2); cx.fill()
          }
        }
      }

      // town: building silhouettes with lit windows, thinning out as you leave
      if (town > 0.03) {
        const B = 9
        for (let i = 0; i < B; i++) {
          const bseed = i * 131 + 7
          const bx = ((bseed * 97) % 1000) / 1000
          const scroll = (dist / (30 + (i % 4) * 10)) % (W * 1.7)
          const x = ((bx * W * 1.7 - scroll) % (W * 1.7) + W * 1.7) % (W * 1.7) - W * 0.35
          if (x < -80 || x > W + 80) continue
          const bw = 34 + (bseed % 40)
          const bh = (H * 0.05 + ((bseed * 13) % 50)) * town
          cx.fillStyle = `rgba(10,11,18,${0.9 * town})`
          cx.fillRect(x, horizon - bh, bw, bh)
          // windows — a few warm squares, some lit
          cx.fillStyle = `rgba(255,190,110,${0.5 * town})`
          for (let wy = 0; wy < 3; wy++) for (let wx = 0; wx < 3; wx++) {
            if (((bseed + wx * 7 + wy * 13) % 5) < 2) {
              cx.fillRect(x + 5 + wx * (bw / 3.4), horizon - bh + 6 + wy * (bh / 3.6), 3, 4)
            }
          }
        }
      }

      // ── ground ─────────────────────────────────────────────────────────────
      cx.fillStyle = '#07080c'
      cx.fillRect(0, horizon, W, H - horizon)

      // perspective projector: z in [0=car .. 1=horizon]; the road bends by `curve`
      const roadHalfBottom = W * 0.42
      const roadHalfTop = W * 0.012
      const proj = (z: number, lateral: number) => {
        const p = 1 - Math.pow(1 - z, 2.2) // ease so near-field moves fast
        const y = H - (H - horizon) * p
        const half = roadHalfBottom + (roadHalfTop - roadHalfBottom) * p
        const bend = curve * p * p * W * 0.18   // curvature pulls the far road sideways
        return { x: cxm + bend + lateral * half, y, scale: 1 - p }
      }

      // road surface: drawn as strips so it follows the curve
      cx.fillStyle = '#101116'
      cx.beginPath()
      const STRIPS = 24
      for (let s = 0; s <= STRIPS; s++) {
        const p = proj(s / STRIPS, -0.98)
        if (s === 0) cx.moveTo(p.x, p.y); else cx.lineTo(p.x, p.y)
      }
      for (let s = STRIPS; s >= 0; s--) {
        const p = proj(s / STRIPS, 0.98)
        cx.lineTo(p.x, p.y)
      }
      cx.closePath()
      cx.fill()

      // canyon walls: rock masses rising from both shoulders, tallest nearest you.
      // Drawn as one polygon per side: down the shoulder toward the horizon, then
      // back along a jagged rim whose height falls off with distance.
      if (canyon > 0.03) {
        ;[-1, 1].forEach(side => {
          const lat = side * 1.12
          cx.fillStyle = `rgba(10,11,16,${0.97 * canyon})`
          cx.beginPath()
          const near = proj(0, lat)
          cx.moveTo(side < 0 ? -4 : W + 4, H + 4)
          cx.lineTo(near.x, H + 4)
          // shoulder line, near → far
          const FAR = 0.96
          for (let s = 0; s <= 14; s++) {
            const p = proj((s / 14) * FAR, lat)
            cx.lineTo(p.x, p.y)
          }
          // rim line, far → near; wall height scales with proximity
          for (let s = 14; s >= 0; s--) {
            const z = (s / 14) * FAR
            const p = proj(z, lat)
            const rough = (Math.sin(z * 17 + dist / 300 + side * 3) + Math.sin(z * 41 + side * 9) * 0.4) * 0.12
            const wallH = (H - horizon) * canyon * (1.35 + rough) * Math.pow(1 - z, 1.6) + 10 * canyon
            cx.lineTo(p.x, p.y - wallH)
          }
          cx.lineTo(side < 0 ? -4 : W + 4, near.y - (H - horizon) * canyon * 1.5)
          cx.closePath()
          cx.fill()
        })
      }

      // edge lines follow the curve
      ;[-0.92, 0.92].forEach(lat => {
        cx.strokeStyle = 'rgba(220,220,190,0.28)'
        cx.lineWidth = 2
        cx.beginPath()
        for (let s = 0; s <= 20; s++) {
          const p = proj((s / 20) * 0.995, lat)
          if (s === 0) cx.moveTo(p.x, p.y); else cx.lineTo(p.x, p.y)
        }
        cx.stroke()
      })

      // center dashes
      const DASH_SPACING = 110
      const offset = (dist % DASH_SPACING) / DASH_SPACING
      for (let i = 0; i < 14; i++) {
        const zNear = (i + offset) / 14
        const zFar = zNear + 0.024
        if (zFar >= 1) continue
        const a = proj(zNear, 0), b = proj(zFar, 0)
        const wNear = Math.max(1.5, 7 * a.scale)
        cx.strokeStyle = `rgba(230,210,120,${0.15 + a.scale * 0.6})`
        cx.lineWidth = wNear
        cx.beginPath()
        cx.moveTo(a.x, a.y)
        cx.lineTo(b.x, b.y)
        cx.stroke()
      }

      // reflector posts
      const POST_SPACING = 260
      const postOffset = (dist % POST_SPACING) / POST_SPACING
      for (let i = 0; i < 8; i++) {
        const z = (i + postOffset) / 8
        if (z >= 0.98) continue
        ;[-1.05, 1.05].forEach(lat => {
          const p = proj(z, lat)
          const h = Math.max(2, 26 * p.scale)
          cx.fillStyle = `rgba(180,180,190,${0.12 + p.scale * 0.3})`
          cx.fillRect(p.x - 1, p.y - h, 2, h)
          cx.fillStyle = `rgba(255,120,80,${0.2 + p.scale * 0.7})`
          cx.fillRect(p.x - 1.5, p.y - h, 3, 3)
        })
      }

      // streetlights in the town phase: sodium cones over the road
      if (town > 0.05) {
        const SL_SPACING = 520
        const slOffset = (dist % SL_SPACING) / SL_SPACING
        for (let i = 0; i < 5; i++) {
          const z = (i + slOffset) / 5
          if (z >= 0.97) continue
          const p = proj(z, -1.25)
          const s = p.scale
          const poleH = 120 * s
          if (poleH < 3) continue
          cx.strokeStyle = `rgba(70,72,80,${(0.25 + s * 0.4) * town})`
          cx.lineWidth = Math.max(1, 3 * s)
          cx.beginPath()
          cx.moveTo(p.x, p.y)
          cx.lineTo(p.x, p.y - poleH)
          cx.lineTo(p.x + 34 * s, p.y - poleH)
          cx.stroke()
          // sodium lamp + cone of light
          const lx = p.x + 34 * s, ly = p.y - poleH
          cx.fillStyle = `rgba(255,178,80,${0.85 * town})`
          cx.beginPath(); cx.arc(lx, ly, Math.max(1.2, 3.4 * s), 0, Math.PI * 2); cx.fill()
          const cone = cx.createRadialGradient(lx, ly, 0, lx, ly + poleH * 0.7, poleH)
          cone.addColorStop(0, `rgba(255,170,70,${0.13 * town})`)
          cone.addColorStop(1, 'transparent')
          cx.fillStyle = cone
          cx.beginPath()
          cx.moveTo(lx, ly)
          cx.lineTo(lx - poleH * 0.55, p.y + 8)
          cx.lineTo(lx + poleH * 0.55, p.y + 8)
          cx.closePath()
          cx.fill()
        }
      }

      // ── traffic ────────────────────────────────────────────────────────────
      // oncoming: headlights growing out of the horizon in the left lane
      if (oncoming.z < 0) {
        oncoming.timer -= dt
        if (oncoming.timer <= 0) { oncoming.z = 0.985; oncoming.timer = 6 + Math.random() * 14 }
      } else {
        oncoming.z -= dt * (0.16 + speed / 700)   // closing speed
        if (oncoming.z <= 0.005) { oncoming.z = -1 }
        else {
          const p = proj(oncoming.z, -0.45)
          const s = p.scale
          const sep = Math.max(1.5, 26 * s)
          const r = Math.max(0.8, 5.5 * s)
          // glow first
          const g = cx.createRadialGradient(p.x, p.y - 8 * s, 0, p.x, p.y - 8 * s, r * 9)
          g.addColorStop(0, `rgba(255,244,207,${0.5 * (0.3 + s)})`)
          g.addColorStop(1, 'transparent')
          cx.fillStyle = g
          cx.beginPath(); cx.arc(p.x, p.y - 8 * s, r * 9, 0, Math.PI * 2); cx.fill()
          cx.fillStyle = 'rgba(255,248,225,0.95)'
          cx.beginPath(); cx.arc(p.x - sep / 2, p.y - 8 * s, r, 0, Math.PI * 2); cx.fill()
          cx.beginPath(); cx.arc(p.x + sep / 2, p.y - 8 * s, r, 0, Math.PI * 2); cx.fill()
        }
      }

      // car ahead: red taillights you slowly gain on, then pass
      if (ahead.z < 0) {
        ahead.timer -= dt
        if (ahead.timer <= 0) { ahead.z = 0.93; ahead.timer = 18 + Math.random() * 20 }
      } else {
        ahead.z -= dt * ((speed - 58) / 900)      // you only gain if you're fast
        if (ahead.z <= 0.01 || ahead.z > 0.985) { ahead.z = -1 }
        else {
          const p = proj(ahead.z, 0.4)
          const s = p.scale
          const sep = Math.max(1.5, 22 * s)
          const r = Math.max(0.7, 3.6 * s)
          cx.fillStyle = `rgba(50,10,10,${0.5 + s * 0.4})`
          cx.fillRect(p.x - sep, p.y - 22 * s, sep * 2, 14 * s)
          const tg = cx.createRadialGradient(p.x, p.y - 14 * s, 0, p.x, p.y - 14 * s, r * 7)
          tg.addColorStop(0, `rgba(255,40,26,${0.35})`)
          tg.addColorStop(1, 'transparent')
          cx.fillStyle = tg
          cx.beginPath(); cx.arc(p.x, p.y - 14 * s, r * 7, 0, Math.PI * 2); cx.fill()
          cx.fillStyle = 'rgba(255,52,36,0.95)'
          cx.beginPath(); cx.arc(p.x - sep / 2, p.y - 14 * s, r, 0, Math.PI * 2); cx.fill()
          cx.beginPath(); cx.arc(p.x + sep / 2, p.y - 14 * s, r, 0, Math.PI * 2); cx.fill()
        }
      }

      // approaching sign
      signZ -= speed * dt * 8
      if (signZ <= -60) {
        signZ = 1400 + Math.random() * 700
        currentSign = (currentSign + 1) % SIGNS.length
        passedRef.current++
        setSignIdx(currentSign)
        if (passedRef.current === SIGNS.length) onLongDrive()
      }
      if (signZ < 1400) {
        const z = Math.max(0, Math.min(0.985, 1 - signZ / 1400))
        const p = proj(z, 1.55)
        const s = Math.max(0.05, p.scale)
        const sw = 200 * s, sh = 100 * s
        if (sw > 3) {
          const sign = SIGNS[currentSign]
          // post
          cx.fillStyle = `rgba(120,120,125,${0.3 + s * 0.4})`
          cx.fillRect(p.x - 2 * s, p.y - sh - 60 * s, 4 * s, 60 * s + sh)
          // panel
          cx.fillStyle = `rgba(14,62,38,${0.5 + s * 0.5})`
          cx.strokeStyle = `rgba(220,225,220,${0.3 + s * 0.5})`
          cx.lineWidth = Math.max(0.5, 2 * s)
          cx.fillRect(p.x - sw / 2, p.y - sh - 60 * s, sw, sh)
          cx.strokeRect(p.x - sw / 2, p.y - sh - 60 * s, sw, sh)
          if (sw > 40) {
            cx.fillStyle = `rgba(235,240,235,${0.4 + s * 0.6})`
            cx.textAlign = 'center'
            cx.font = `bold ${Math.max(6, 26 * s)}px "Arial Narrow", Arial, sans-serif`
            cx.fillText(sign.label, p.x, p.y - sh - 60 * s + sh * 0.42)
            cx.font = `${Math.max(5, 16 * s)}px "Arial Narrow", Arial, sans-serif`
            cx.fillText(sign.sub, p.x, p.y - sh - 60 * s + sh * 0.78)
          }
        }
      }

      // headlight glow on the road
      const glow = cx.createRadialGradient(cxm, H * 1.05, 40, cxm, H * 0.9, W * 0.55)
      glow.addColorStop(0, 'rgba(255,235,180,0.14)')
      glow.addColorStop(0.5, 'rgba(255,225,160,0.05)')
      glow.addColorStop(1, 'transparent')
      cx.fillStyle = glow
      cx.fillRect(0, horizon, W, H - horizon)

      // lightning also washes the road for a frame or two
      if (flash > 0.05) {
        cx.fillStyle = `rgba(210,220,255,${flash * 0.06})`
        cx.fillRect(0, 0, W, H)
      }

      // ── windshield: you are inside the car ────────────────────────────────
      // A-pillars — dark slants at both edges
      cx.fillStyle = 'rgba(3,3,5,0.88)'
      cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(W * 0.045, 0); cx.lineTo(0, H * 0.6); cx.closePath(); cx.fill()
      cx.beginPath(); cx.moveTo(W, 0); cx.lineTo(W - W * 0.045, 0); cx.lineTo(W, H * 0.6); cx.closePath(); cx.fill()
      // roofline
      const roof = cx.createLinearGradient(0, 0, 0, H * 0.07)
      roof.addColorStop(0, 'rgba(3,3,5,0.95)')
      roof.addColorStop(1, 'transparent')
      cx.fillStyle = roof
      cx.fillRect(0, 0, W, H * 0.07)
      // faint dash reflection breathing on the glass
      const refl = cx.createLinearGradient(0, H * 0.62, 0, H)
      refl.addColorStop(0, 'transparent')
      refl.addColorStop(1, `rgba(255,180,90,${0.025 + Math.sin(now / 2400) * 0.008})`)
      cx.fillStyle = refl
      cx.fillRect(0, H * 0.62, W, H * 0.38)

      setOdometer(Math.floor(dist / 160))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [onLongDrive])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#04050c', animation: 'garage-fade 1.2s ease' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* dashboard */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 92,
        background: 'linear-gradient(180deg, rgba(8,7,6,0) 0%, rgba(10,9,8,0.94) 34%, #0b0a09 100%)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 40,
        paddingBottom: 18, fontFamily: '"Space Mono", monospace',
      }}>
        {/* speed */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, color: 'rgba(120,255,170,0.8)', textShadow: '0 0 12px rgba(120,255,170,0.4)' }}>
            {Math.round(speedRef.current)}
          </div>
          <div style={{ fontSize: 7, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)' }}>MPH · ↑↓</div>
        </div>

        {/* radio readout */}
        <div style={{ textAlign: 'center', minWidth: 260 }}>
          <div style={{ fontSize: 11, color: tuned ? 'rgba(255,179,71,0.95)' : 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textShadow: tuned ? '0 0 10px rgba(255,179,71,0.4)' : 'none' }}>
            {freq.toFixed(1)} FM {tuned ? `· ${stationName}` : '· static'}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 3, minHeight: 12 }}>
            {tuned ? stationPlaying : 'seek with ← →'}
          </div>
        </div>

        {/* odometer + exit */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'rgba(255,235,205,0.6)' }}>{String(odometer).padStart(5, '0')}</div>
          <div style={{ fontSize: 7, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>MILES</div>
        </div>
      </div>

      <div
        onClick={onExit}
        style={{
          position: 'absolute', top: 20, right: 24, fontFamily: '"Space Mono", monospace',
          fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,235,205,0.45)',
          border: '1px solid rgba(255,235,205,0.18)', padding: '8px 14px', cursor: 'pointer',
          background: 'rgba(0,0,0,0.4)',
        }}
      >
        PULL OVER · ESC
      </div>

      <div style={{
        position: 'absolute', top: 20, left: 24, fontFamily: '"Space Mono", monospace',
        fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,235,205,0.4)',
      }}>
        {phaseLabel} · SIGN {signIdx + 1}/{SIGNS.length}
      </div>
    </div>
  )
}
