'use client'
import { useRef, useEffect, useState } from 'react'
import type { RadioStation } from '@/app/api/radio/route'
import type { RadioStatus } from './live-radio'

// The drive. A 2D-canvas night highway out of the garage, rendered with a real
// perspective camera: you sit in the right lane at eye height, low beams reach
// about eighty meters, and everything past them falls into darkness. The road
// curves, crests and dips, and the country changes as the odometer turns.
// Mile-marker signs are the years of your projects. The live radio rides along.

interface NightDriveProps {
  freq: number
  station: RadioStation | null
  status: RadioStatus
  onSeek: (dir: number) => void
  onExit: () => void
  onLongDrive: () => void
}

function flag(code: string) {
  if (!/^[A-Za-z]{2}$/.test(code)) return '📻'
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)))
}

interface Sign { label: string; sub: string }

// Atmospheric highway signage — a loop that roughly tracks the phases of the
// drive: leaving town, the open highway, the canyon, the storm, the descent.
const SIGNS: Sign[] = [
  { label: 'BOULDER', sub: 'ELEV 5430' },
  { label: 'CITY LIMIT', sub: 'RESUME SPEED' },
  { label: 'NEXT SERVICES', sub: '42 MILES' },
  { label: 'US-36 WEST', sub: 'THE FOOTHILLS' },
  { label: 'RUNAWAY TRUCK', sub: 'RAMP 1 MILE' },
  { label: 'FALLING ROCK', sub: 'NEXT 8 MI' },
  { label: 'THE CANYON', sub: 'NARROW ROAD' },
  { label: 'ELEV 9000 FT', sub: 'THINNER AIR' },
  { label: 'BRIDGE', sub: 'ICES BEFORE ROAD' },
  { label: 'HIGH WINDS', sub: 'STORM AHEAD' },
  { label: 'CONTINENTAL', sub: 'DIVIDE' },
  { label: 'STEEP GRADE', sub: 'DOWNSHIFT' },
  { label: 'LAST EXIT', sub: 'NO RETURN' },
  { label: 'I-70 WEST', sub: 'THE MOUNTAINS' },
]

// ── the country: phases of the drive, keyed to distance ─────────────────────
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
const PHASE_LEN = 5200          // world-distance length of each phase (legacy scenery units)
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
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

// ── road geometry constants (meters) ─────────────────────────────────────────
const MPH = 0.44704            // mph → m/s
const CAM_H = 1.15             // eye height above the road
const LANE = 1.85              // camera sits centered in the right lane
const ROAD_HALF = 3.55         // paint-to-paint half width (two-lane rural highway)
const SHOULDER = 1.6           // gravel beyond the edge line
const Z_FAR = 420

export default function NightDrive({ freq, station, status, onSeek, onExit, onLongDrive }: NightDriveProps) {
  const tuned = status === 'live' || status === 'tuning'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const [signIdx, setSignIdx] = useState(0)
  const [odometer, setOdometer] = useState(0)
  const [speedView, setSpeedView] = useState(64)
  const [phaseLabel, setPhaseLabel] = useState(PHASES[0].name)
  const speedRef = useRef(64)
  const passedRef = useRef(0)
  // Latest-ref so an unstable callback prop can't tear down the render loop —
  // re-running the main effect resets the entire drive to mile zero.
  const onLongDriveRef = useRef(onLongDrive)
  useEffect(() => { onLongDriveRef.current = onLongDrive }, [onLongDrive])

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
    let distM = 0           // meters travelled
    let bobPhase = 0        // suspension oscillator
    let signZ = 85          // meters to the next sign
    let currentSign = 0
    let last = performance.now()
    let lastPhaseName = PHASES[0].name

    const stars = Array.from({ length: 140 }, (_, i) => ({
      x: (i * 379 + 83) % 1000 / 1000,
      y: ((i * 211 + 37) % 420) / 1000,
      r: i % 7 === 0 ? 1.4 : 0.8,
      tw: (i * 977) % 100 / 100,
    }))

    // oncoming car: headlights in the opposite lane (meters ahead)
    const oncoming = { z: -1, timer: 5 }
    // car ahead: taillights in your lane you slowly gain on
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
      const mps = speed * MPH
      distM += mps * dt
      const dist = distM * 18   // legacy scenery scale (phases, parallax, town)

      const { a: pa, b: pb, t: pt, label } = phaseMix(dist)
      if (label !== lastPhaseName) { lastPhaseName = label; setPhaseLabel(label) }
      const town = mix(pa.town, pb.town, pt)
      const canyon = mix(pa.canyon, pb.canyon, pt)
      const storm = mix(pa.storm, pb.storm, pt)
      const tower = mix(pa.tower, pb.tower, pt)
      const ridgeAmp = mix(pa.ridgeAmp, pb.ridgeAmp, pt)

      // ── camera ─────────────────────────────────────────────────────────────
      // curvature: signed, slowly wandering. Positive bends right. Kept gentle
      // so the far road leans into a bend instead of swimming across the frame.
      const curve = Math.sin(distM / 250) * 0.38 + Math.sin(distM / 104 + 2.1) * 0.2
      // vertical: crests and sags. Positive = road falls away (you see less of
      // it). Softened so the road rarely cuts off hard over a crest.
      const hillV = Math.sin(distM / 360 + 1.2) * 0.5 + Math.sin(distM / 155) * 0.18
      // horizon breathes a little with terrain
      const horizon = H * 0.46 + Math.sin(distM / 260) * H * 0.012
      const cxm = W / 2
      const f = H * 1.15  // focal length in px

      // suspension: small vertical bob + high-frequency road buzz, scaled by speed
      bobPhase += dt * (1.4 + speed / 45)
      const bobY =
        Math.sin(bobPhase * 2.1) * 1.3 +
        Math.sin(bobPhase * 3.7 + 1.3) * 0.8 +
        Math.sin(bobPhase * 9.1) * 0.5 * (speed / 64)
      const camLat = LANE + Math.sin(now / 2600) * 0.07 - curve * 0.12  // drift in lane, lean into curves
      const camH = CAM_H + Math.sin(bobPhase * 1.3) * 0.008

      // world → screen. lat in meters (0 = road centerline), z in meters ahead.
      const proj = (z: number, lat: number) => {
        const zz = Math.max(z, 0.8)
        // horizontal curvature: lateral offset grows with z², clamped so the far
        // end of a hard bend leans off the road rather than swinging off-screen
        const bend = Math.max(-9, Math.min(9, curve * zz * zz * 0.0009))
        const y = horizon + (f * camH) / zz + (f * hillV * zz) / 3500 + bobY
        const x = cxm + (f * (lat + bend - camLat)) / zz
        return { x, y, s: f / zz }                     // s = px per meter at this depth
      }

      // headlights: low beams reach ~85 m; a whisper of moonlight past that
      const lit = (z: number) => clamp01(1.18 - z / 85)
      const amb = 0.05

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
      sky.addColorStop(1, town > 0.3 ? '#1c1424' : '#141326')
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

      // storm bank on the horizon
      if (storm > 0.02) {
        const bankH = H * 0.24 * storm
        const cloudLayer = (yOff: number, alpha: number, litAmt: number) => {
          cx.fillStyle = `rgba(${18 + flash * litAmt},${18 + flash * litAmt},${30 + flash * litAmt * 1.3},${alpha * storm})`
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
        const tx = ((dist / 14) % (W * 1.6))
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
          cx.fillStyle = `rgba(255,190,110,${0.5 * town})`
          for (let wy = 0; wy < 3; wy++) for (let wx = 0; wx < 3; wx++) {
            if (((bseed + wx * 7 + wy * 13) % 5) < 2) {
              cx.fillRect(x + 5 + wx * (bw / 3.4), horizon - bh + 6 + wy * (bh / 3.6), 3, 4)
            }
          }
        }
      }

      // ── ground ─────────────────────────────────────────────────────────────
      cx.fillStyle = '#05060a'
      cx.fillRect(0, horizon, W, H - horizon)
      // headlight spill onto the near ground, before the road is drawn
      const spill = cx.createRadialGradient(cxm, H * 1.06, 30, cxm, H * 0.98, W * 0.5)
      spill.addColorStop(0, 'rgba(120,110,85,0.10)')
      spill.addColorStop(1, 'transparent')
      cx.fillStyle = spill
      cx.fillRect(0, horizon, W, H - horizon)

      // ── the road, sliced by depth ──────────────────────────────────────────
      // Geometric slice distribution: dense near the car where everything moves
      // fast, sparse in the dark. Slices stop at a crest — the road genuinely
      // disappears over the hill.
      const zBottom = (f * camH) / (H + 40 - horizon)
      const SLICES = 90
      const ratio = Math.pow(Z_FAR / zBottom, 1 / SLICES)
      let zCut = Z_FAR
      let prev = { z: zBottom, L: proj(zBottom, -ROAD_HALF - SHOULDER), R: proj(zBottom, ROAD_HALF + SHOULDER), eL: proj(zBottom, -ROAD_HALF), eR: proj(zBottom, ROAD_HALF) }
      let prevY = prev.eL.y
      for (let i = 1; i <= SLICES; i++) {
        const z = zBottom * Math.pow(ratio, i)
        const eL = proj(z, -ROAD_HALF), eR = proj(z, ROAD_HALF)
        if (eL.y >= prevY - 0.25) { zCut = prev.z; break }  // crest: road vanishes
        const L = proj(z, -ROAD_HALF - SHOULDER), R = proj(z, ROAD_HALF + SHOULDER)
        const li = lit((z + prev.z) / 2)
        // asphalt: worn gray under the beams, gone black past them. A faint
        // per-band jitter streams past — the texture of the surface itself.
        const band = Math.floor((distM + z) / 2.2)
        const jit = (hash(band) - 0.5) * 0.10
        const v = amb * 14 + li * (34 + jit * 90)
        cx.fillStyle = `rgb(${v + 2 | 0},${v + 3 | 0},${v + 6 | 0})`
        cx.beginPath()
        cx.moveTo(prev.eL.x, prev.eL.y); cx.lineTo(prev.eR.x, prev.eR.y)
        cx.lineTo(eR.x, eR.y); cx.lineTo(eL.x, eL.y)
        cx.closePath(); cx.fill()
        // gravel shoulders, a touch warmer and dimmer
        const g = amb * 10 + li * 20
        cx.fillStyle = `rgb(${g + 6 | 0},${g + 4 | 0},${g | 0})`
        cx.beginPath()
        cx.moveTo(prev.L.x, prev.L.y); cx.lineTo(prev.eL.x, prev.eL.y)
        cx.lineTo(eL.x, eL.y); cx.lineTo(L.x, L.y)
        cx.closePath(); cx.fill()
        cx.beginPath()
        cx.moveTo(prev.eR.x, prev.eR.y); cx.lineTo(prev.R.x, prev.R.y)
        cx.lineTo(R.x, R.y); cx.lineTo(eR.x, eR.y)
        cx.closePath(); cx.fill()
        // tire tracks: four darker wear bands where wheels have polished the lane
        if (li > 0.02) {
          cx.fillStyle = `rgba(0,0,0,${0.16 * li})`
          ;[-2.65, -0.95, 0.95, 2.65].forEach(latT => {
            const a = proj(prev.z, latT - 0.18), b = proj(prev.z, latT + 0.18)
            const c = proj(z, latT + 0.18), d = proj(z, latT - 0.18)
            cx.beginPath()
            cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.lineTo(c.x, c.y); cx.lineTo(d.x, d.y)
            cx.closePath(); cx.fill()
          })
        }
        prev = { z, L, R, eL, eR }
        prevY = eL.y
      }

      // paint quad helper: a stripe of paint from z0→z1 at lateral `lat`, width in m
      const paintQuad = (z0: number, z1: number, lat: number, wM: number, color: (li: number) => string) => {
        if (z0 >= zCut) return
        const zz1 = Math.min(z1, zCut)
        const a = proj(z0, lat - wM / 2), b = proj(z0, lat + wM / 2)
        const c = proj(zz1, lat + wM / 2), d = proj(zz1, lat - wM / 2)
        cx.fillStyle = color(lit((z0 + zz1) / 2))
        cx.beginPath()
        cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.lineTo(c.x, c.y); cx.lineTo(d.x, d.y)
        cx.closePath(); cx.fill()
      }

      // edge lines: solid white, retroreflective — they hold brightness deep
      // into the beam throw and are the last thing to fade
      const SEG = 5 // meters per paint segment
      for (let z = zBottom; z < Math.min(180, zCut); z += SEG) {
        const paint = (li: number) => `rgba(225,228,215,${0.05 + Math.pow(li, 0.6) * 0.55})`
        paintQuad(z, z + SEG, -ROAD_HALF + 0.15, 0.12, paint)
        paintQuad(z, z + SEG, ROAD_HALF - 0.15, 0.12, paint)
      }

      // center line: dashed yellow, 3 m dash / 9 m gap, anchored to the world
      const CYCLE = 12
      const firstDash = Math.floor((distM + zBottom) / CYCLE) * CYCLE - distM
      for (let zd = firstDash; zd < Math.min(200, zCut); zd += CYCLE) {
        const z0 = Math.max(zd, zBottom), z1 = zd + 3
        if (z1 <= z0) continue
        paintQuad(z0, z1, 0, 0.13, li => `rgba(235,205,110,${0.05 + Math.pow(li, 0.6) * 0.6})`)
      }

      // canyon walls: rock masses rising from both shoulders
      if (canyon > 0.03) {
        ;[-1, 1].forEach(side => {
          const latW = side * (ROAD_HALF + SHOULDER + 2.5)
          cx.fillStyle = `rgba(10,11,16,${0.97 * canyon})`
          cx.beginPath()
          const near = proj(zBottom, latW)
          cx.moveTo(side < 0 ? -4 : W + 4, H + 4)
          cx.lineTo(near.x, H + 4)
          const FAR = Math.min(260, zCut)
          const N = 16
          for (let s = 0; s <= N; s++) {
            const z = zBottom + (FAR - zBottom) * (s / N)
            const p = proj(z, latW)
            cx.lineTo(p.x, p.y)
          }
          for (let s = N; s >= 0; s--) {
            const z = zBottom + (FAR - zBottom) * (s / N)
            const p = proj(z, latW)
            const rough = (Math.sin(z * 0.9 + distM * 0.06 + side * 3) + Math.sin(z * 2.3 + side * 9) * 0.4) * 0.18
            const wallM = (12 + rough * 20) * canyon
            cx.lineTo(p.x, p.y - p.s * wallM)
          }
          cx.lineTo(side < 0 ? -4 : W + 4, Math.max(0, near.y - near.s * 16 * canyon))
          cx.closePath()
          cx.fill()
          // headlights brush the near rock face
          const brush = proj(14, latW)
          const bg = cx.createRadialGradient(brush.x, brush.y, 0, brush.x, brush.y, brush.s * 9)
          bg.addColorStop(0, `rgba(120,105,80,${0.08 * canyon})`)
          bg.addColorStop(1, 'transparent')
          cx.fillStyle = bg
          cx.beginPath(); cx.arc(brush.x, brush.y, brush.s * 9, 0, Math.PI * 2); cx.fill()
        })
      }

      // reflector posts: every 45 m on both shoulders. Retroreflective heads
      // flare hardest in the middle distance, where high beams catch them.
      const POST_GAP = 45
      const firstPost = Math.floor((distM + zBottom) / POST_GAP) * POST_GAP - distM + POST_GAP
      for (let zp = firstPost; zp < Math.min(320, zCut); zp += POST_GAP) {
        ;[-1, 1].forEach(side => {
          const p = proj(zp, side * (ROAD_HALF + 0.9))
          const hPx = p.s * 1.0
          if (hPx < 1.5) return
          const li = lit(zp)
          cx.fillStyle = `rgba(150,150,155,${0.06 + li * 0.3})`
          cx.fillRect(p.x - Math.max(0.6, p.s * 0.045), p.y - hPx, Math.max(1.2, p.s * 0.09), hPx)
          // reflector: white right side, red/amber left side (as in the US)
          const flare = clamp01(1.25 - Math.abs(zp - 55) / 70)
          const r = Math.max(0.8, p.s * 0.09)
          cx.fillStyle = side > 0 ? `rgba(255,255,240,${0.25 + flare * 0.75})` : `rgba(255,150,60,${0.2 + flare * 0.6})`
          cx.beginPath(); cx.arc(p.x, p.y - hPx, r, 0, Math.PI * 2); cx.fill()
          if (flare > 0.4) {
            cx.fillStyle = side > 0 ? `rgba(255,255,240,${flare * 0.12})` : `rgba(255,150,60,${flare * 0.08})`
            cx.beginPath(); cx.arc(p.x, p.y - hPx, r * 4, 0, Math.PI * 2); cx.fill()
          }
        })
      }

      // streetlights in the town phase: sodium pools every 50 m
      if (town > 0.05) {
        const SL_GAP = 50
        const firstSL = Math.floor((distM + zBottom) / SL_GAP) * SL_GAP - distM + SL_GAP
        for (let zs = firstSL; zs < Math.min(300, zCut); zs += SL_GAP) {
          const p = proj(zs, -(ROAD_HALF + SHOULDER + 1.2))
          const poleH = p.s * 9
          if (poleH < 4) continue
          cx.strokeStyle = `rgba(70,72,80,${(0.2 + clamp01(60 / zs) * 0.4) * town})`
          cx.lineWidth = Math.max(1, p.s * 0.12)
          cx.beginPath()
          cx.moveTo(p.x, p.y)
          cx.lineTo(p.x, p.y - poleH)
          cx.lineTo(p.x + p.s * 3.2, p.y - poleH)
          cx.stroke()
          const lx = p.x + p.s * 3.2, ly = p.y - poleH
          cx.fillStyle = `rgba(255,178,80,${0.85 * town})`
          cx.beginPath(); cx.arc(lx, ly, Math.max(1.2, p.s * 0.28), 0, Math.PI * 2); cx.fill()
          // pool of sodium light on the pavement below
          const pool = proj(zs, -1.2)
          const pg = cx.createRadialGradient(lx, pool.y, 0, lx, pool.y, p.s * 7)
          pg.addColorStop(0, `rgba(255,170,70,${0.10 * town})`)
          pg.addColorStop(1, 'transparent')
          cx.fillStyle = pg
          cx.beginPath(); cx.ellipse(lx, pool.y, p.s * 7, p.s * 2.6, 0, 0, Math.PI * 2); cx.fill()
        }
      }

      // ── traffic ────────────────────────────────────────────────────────────
      // oncoming: a glare on the horizon that resolves into two headlights
      let glare = 0
      if (oncoming.z < 0) {
        oncoming.timer -= dt
        if (oncoming.timer <= 0) { oncoming.z = 340; oncoming.timer = 7 + Math.random() * 14 }
      } else {
        oncoming.z -= dt * (mps + 26)   // closing speed: theirs + yours
        if (oncoming.z <= 2) { oncoming.z = -1 }
        else if (oncoming.z < zCut + 30) {
          const p = proj(oncoming.z, -LANE)
          const ly = p.y - p.s * 0.65   // headlight height
          const sep = p.s * 1.35
          const r = Math.max(0.9, p.s * 0.22)
          glare = clamp01(1 - oncoming.z / 45)
          const g = cx.createRadialGradient(p.x, ly, 0, p.x, ly, r * 10 + 6)
          g.addColorStop(0, `rgba(255,244,207,${0.35 + glare * 0.4})`)
          g.addColorStop(1, 'transparent')
          cx.fillStyle = g
          cx.beginPath(); cx.arc(p.x, ly, r * 10 + 6, 0, Math.PI * 2); cx.fill()
          if (sep > 2.2) {
            cx.fillStyle = 'rgba(255,248,225,0.95)'
            cx.beginPath(); cx.arc(p.x - sep / 2, ly, r, 0, Math.PI * 2); cx.fill()
            cx.beginPath(); cx.arc(p.x + sep / 2, ly, r, 0, Math.PI * 2); cx.fill()
          } else {
            cx.fillStyle = 'rgba(255,248,225,0.9)'
            cx.beginPath(); cx.arc(p.x, ly, r * 1.2, 0, Math.PI * 2); cx.fill()
          }
        }
      }

      // car ahead: taillights in your lane you slowly gain on
      if (ahead.z < 0) {
        ahead.timer -= dt
        if (ahead.timer <= 0) { ahead.z = 130; ahead.timer = 18 + Math.random() * 20 }
      } else {
        ahead.z -= dt * ((speed - 58) * MPH * 2.2)
        if (ahead.z <= 6 || ahead.z > 320) { ahead.z = -1 }
        else if (ahead.z < zCut + 20) {
          const p = proj(ahead.z, LANE)
          const ty = p.y - p.s * 0.85
          const sep = p.s * 1.3
          const r = Math.max(0.7, p.s * 0.14)
          const li = lit(ahead.z)
          if (li > 0.05) {  // your beams pick out the car body
            cx.fillStyle = `rgba(30,28,32,${li * 0.8})`
            cx.fillRect(p.x - p.s * 0.85, p.y - p.s * 1.45, p.s * 1.7, p.s * 1.45)
          }
          const tg = cx.createRadialGradient(p.x, ty, 0, p.x, ty, r * 7)
          tg.addColorStop(0, 'rgba(255,40,26,0.35)')
          tg.addColorStop(1, 'transparent')
          cx.fillStyle = tg
          cx.beginPath(); cx.arc(p.x, ty, r * 7, 0, Math.PI * 2); cx.fill()
          cx.fillStyle = 'rgba(255,52,36,0.95)'
          cx.beginPath(); cx.arc(p.x - sep / 2, ty, r, 0, Math.PI * 2); cx.fill()
          cx.beginPath(); cx.arc(p.x + sep / 2, ty, r, 0, Math.PI * 2); cx.fill()
        }
      }

      // approaching sign: green panel on the right shoulder, retroreflective
      signZ -= mps * dt
      if (signZ <= -4) {
        signZ = 240 + Math.random() * 120
        currentSign = (currentSign + 1) % SIGNS.length
        passedRef.current++
        setSignIdx(currentSign)
        if (passedRef.current === SIGNS.length) onLongDriveRef.current()
      }
      if (signZ > 2 && signZ < Math.min(300, zCut + 40)) {
        const p = proj(signZ, ROAD_HALF + SHOULDER + 1.6)
        const sw = p.s * 3.4, sh = p.s * 1.7
        if (sw > 4) {
          const sign = SIGNS[currentSign]
          const glow = 0.15 + Math.pow(lit(signZ * 0.55), 0.7) * 0.85  // sheeting bounces light back early
          const py = p.y - p.s * 2.1
          cx.fillStyle = `rgba(110,112,118,${0.15 + glow * 0.3})`
          cx.fillRect(p.x - Math.max(0.8, p.s * 0.06), py, Math.max(1.6, p.s * 0.12), p.y - py)
          cx.fillStyle = `rgba(${14 + glow * 20},${62 + glow * 60},${38 + glow * 30},${0.4 + glow * 0.6})`
          cx.strokeStyle = `rgba(220,225,220,${glow * 0.8})`
          cx.lineWidth = Math.max(0.5, p.s * 0.05)
          cx.fillRect(p.x - sw / 2, py - sh, sw, sh)
          cx.strokeRect(p.x - sw / 2, py - sh, sw, sh)
          if (sw > 34) {
            cx.fillStyle = `rgba(235,240,235,${0.25 + glow * 0.75})`
            cx.textAlign = 'center'
            cx.font = `bold ${Math.max(6, p.s * 0.62)}px "Arial Narrow", Arial, sans-serif`
            cx.fillText(sign.label, p.x, py - sh * 0.52)
            cx.font = `${Math.max(5, p.s * 0.38)}px "Arial Narrow", Arial, sans-serif`
            cx.fillText(sign.sub, p.x, py - sh * 0.17)
          }
        }
      }

      // ── your own light ─────────────────────────────────────────────────────
      // twin low-beam wedges laid on the pavement, slightly right-biased the
      // way US beams are cut
      ;[-0.7, 0.85].forEach(latB => {
        const nearP = proj(zBottom + 1, latB)
        const farP = proj(46, latB + 0.5)
        const beam = cx.createLinearGradient(nearP.x, H, farP.x, farP.y)
        beam.addColorStop(0, 'rgba(255,240,200,0.085)')
        beam.addColorStop(1, 'transparent')
        cx.fillStyle = beam
        cx.beginPath()
        cx.moveTo(nearP.x - W * 0.1, H + 2)
        cx.lineTo(farP.x - W * 0.015, farP.y)
        cx.lineTo(farP.x + W * 0.015, farP.y)
        cx.lineTo(nearP.x + W * 0.1, H + 2)
        cx.closePath()
        cx.fill()
      })

      // oncoming glare veils the whole windshield when they're close
      if (glare > 0.03) {
        cx.fillStyle = `rgba(255,246,220,${glare * 0.07})`
        cx.fillRect(0, 0, W, H)
      }

      // lightning washes the road for a frame or two
      if (flash > 0.05) {
        cx.fillStyle = `rgba(210,220,255,${flash * 0.06})`
        cx.fillRect(0, 0, W, H)
      }

      // ── you are inside the car: headliner, pillars, dashboard ─────────────
      // headliner across the top of the glass
      const liner = cx.createLinearGradient(0, 0, 0, H * 0.13)
      liner.addColorStop(0, 'rgba(6,6,9,0.98)')
      liner.addColorStop(0.55, 'rgba(6,6,9,0.5)')
      liner.addColorStop(1, 'transparent')
      cx.fillStyle = liner
      cx.fillRect(0, 0, W, H * 0.13)
      // two sun visors folded up against the headliner
      cx.fillStyle = 'rgba(10,10,13,0.92)'
      cx.fillRect(W * 0.10, H * 0.052, W * 0.30, H * 0.032)
      cx.fillRect(W * 0.60, H * 0.052, W * 0.30, H * 0.032)

      // A-pillars — thick, angled, framing the glass down to the dash corners
      cx.fillStyle = 'rgba(5,5,8,0.97)'
      cx.beginPath()
      cx.moveTo(0, 0); cx.lineTo(W * 0.125, 0); cx.lineTo(W * 0.045, H * 0.84); cx.lineTo(0, H * 0.84)
      cx.closePath(); cx.fill()
      cx.beginPath()
      cx.moveTo(W, 0); cx.lineTo(W - W * 0.125, 0); cx.lineTo(W - W * 0.045, H * 0.84); cx.lineTo(W, H * 0.84)
      cx.closePath(); cx.fill()
      // interior trim highlight on the inner pillar edge
      cx.strokeStyle = 'rgba(120,132,155,0.07)'; cx.lineWidth = 1.5
      cx.beginPath(); cx.moveTo(W * 0.125, 0); cx.lineTo(W * 0.045, H * 0.84); cx.stroke()
      cx.beginPath(); cx.moveTo(W - W * 0.125, 0); cx.lineTo(W - W * 0.045, H * 0.84); cx.stroke()

      // windshield tint — a faint amber sky reflection low on the glass
      const refl = cx.createLinearGradient(0, H * 0.55, 0, H * 0.80)
      refl.addColorStop(0, 'transparent')
      refl.addColorStop(1, `rgba(255,180,90,${0.02 + Math.sin(now / 2400) * 0.006})`)
      cx.fillStyle = refl
      cx.fillRect(0, H * 0.55, W, H * 0.25)

      // ── the dashboard cowl: padded top of the dash, bobs with the road ────
      const dashTop = H * 0.80 + bobY * 0.5
      const apexX = cxm - curve * W * 0.02
      // instrument-cluster glow washing up into the glass above the dash
      const clusterGlow = cx.createLinearGradient(0, dashTop - H * 0.15, 0, dashTop)
      clusterGlow.addColorStop(0, 'transparent')
      clusterGlow.addColorStop(1, `rgba(90,255,170,${0.02 + (tuned ? 0.02 : 0)})`)
      cx.fillStyle = clusterGlow
      cx.fillRect(0, dashTop - H * 0.15, W, H * 0.15)
      // the dash surface
      const dg = cx.createLinearGradient(0, dashTop - H * 0.02, 0, H)
      dg.addColorStop(0, '#0e1117')
      dg.addColorStop(0.45, '#080a0f')
      dg.addColorStop(1, '#040509')
      cx.fillStyle = dg
      cx.beginPath()
      cx.moveTo(-2, H + 2)
      cx.lineTo(-2, dashTop + H * 0.02)
      cx.quadraticCurveTo(apexX - W * 0.33, dashTop - H * 0.012, apexX, dashTop + H * 0.004)
      cx.quadraticCurveTo(apexX + W * 0.33, dashTop - H * 0.012, W + 2, dashTop + H * 0.02)
      cx.lineTo(W + 2, H + 2)
      cx.closePath()
      cx.fill()
      // soft top edge of the dash catching the sky/lightning
      cx.strokeStyle = `rgba(150,170,205,${0.08 + flash * 0.28 + town * 0.05 + glare * 0.22})`
      cx.lineWidth = 1.3
      cx.beginPath()
      cx.moveTo(0, dashTop + H * 0.02)
      cx.quadraticCurveTo(apexX - W * 0.33, dashTop - H * 0.012, apexX, dashTop + H * 0.004)
      cx.quadraticCurveTo(apexX + W * 0.33, dashTop - H * 0.012, W, dashTop + H * 0.02)
      cx.stroke()

      // steering wheel follows the road
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${(curve * 30).toFixed(2)}deg)`

      setOdometer(Math.floor(distM / 290))
      setSpeedView(Math.round(speed))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#04050c', animation: 'garage-fade 1.2s ease' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* rear-view mirror — the road you already drove, receding */}
      <div style={{
        position: 'absolute', top: '3.5%', left: '50%', transform: 'translateX(-50%)', zIndex: 101,
        width: 150, height: 34, borderRadius: 17, pointerEvents: 'none',
        background: 'linear-gradient(180deg, #0b0d11, #05070a)',
        border: '2px solid #14161b', boxShadow: '0 6px 18px rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <div style={{ width: '92%', height: '66%', borderRadius: 12,
          background: 'radial-gradient(ellipse at 50% 120%, rgba(255,60,50,0.18), rgba(6,7,10,0.95) 62%)' }} />
        <div style={{ position: 'absolute', left: '38%', bottom: 7, width: 3, height: 3, borderRadius: '50%',
          background: 'rgba(255,60,50,0.7)', boxShadow: '0 0 5px rgba(255,60,50,0.8)' }} />
        <div style={{ position: 'absolute', right: '38%', bottom: 7, width: 3, height: 3, borderRadius: '50%',
          background: 'rgba(255,60,50,0.7)', boxShadow: '0 0 5px rgba(255,60,50,0.8)' }} />
      </div>

      {/* cockpit — a solid dashboard the instruments actually sit on */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 101,
        height: 'clamp(150px, 21vh, 205px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        gap: 'clamp(16px, 4vw, 56px)', paddingBottom: 'clamp(14px, 2.4vh, 26px)',
        background: 'linear-gradient(180deg, rgba(10,12,16,0) 0%, rgba(9,11,15,0.7) 20%, #0a0c11 52%, #050609 100%)',
        fontFamily: '"Space Mono", monospace', pointerEvents: 'none',
      }}>
        {/* steering wheel, counter-steering with the road */}
        <div style={{ position: 'relative', width: 168, height: 96, overflow: 'hidden', flexShrink: 0 }}>
          <div ref={wheelRef} style={{
            position: 'absolute', top: 10, left: '50%', width: 190, height: 190, marginLeft: -95,
            borderRadius: '50%', border: '14px solid #17181c',
            boxShadow: 'inset 0 0 26px rgba(0,0,0,0.9), 0 -2px 12px rgba(0,0,0,0.65)',
          }}>
            {/* spokes + hub */}
            <div style={{ position: 'absolute', top: '50%', left: -6, right: -6, height: 12, marginTop: -6,
              background: 'linear-gradient(180deg, #1b1c21, #101114)', borderRadius: 6 }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 52, height: 34,
              transform: 'translate(-50%, -38%)', borderRadius: 8, background: '#17181c',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 8, color: 'rgba(255,223,140,0.5)', letterSpacing: '0.1em' }}>EMDUR</span>
            </div>
          </div>
        </div>

        {/* instrument cluster: live speed + odometer */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexShrink: 0, paddingBottom: 2 }}>
          <div style={{ position: 'relative', width: 72, height: 72, textAlign: 'center' }}>
            <svg width={72} height={72} style={{ position: 'absolute', inset: 0 }}>
              <circle cx={36} cy={36} r={32} fill="rgba(5,8,6,0.85)" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
              {Array.from({ length: 9 }).map((_, i) => {
                const a = (-130 + i * 32.5) * Math.PI / 180
                return <line key={i} x1={36 + Math.sin(a) * 26} y1={36 - Math.cos(a) * 26}
                  x2={36 + Math.sin(a) * 30} y2={36 - Math.cos(a) * 30}
                  stroke="rgba(120,255,170,0.35)" strokeWidth={1} />
              })}
              <path d="M 36 36 L 36 9" stroke="rgba(120,255,170,0.9)" strokeWidth={1.8}
                transform={`rotate(${-130 + Math.max(0, Math.min(1, (speedView - 30) / 65)) * 260} 36 36)`} />
              <circle cx={36} cy={36} r={2.6} fill="rgba(120,255,170,0.9)" />
            </svg>
            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0 }}>
              <div style={{ fontSize: 13, color: 'rgba(120,255,170,0.9)', lineHeight: 1, textShadow: '0 0 8px rgba(120,255,170,0.4)' }}>{speedView}</div>
              <div style={{ fontSize: 6, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>MPH · ↑↓</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', paddingBottom: 8 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,235,205,0.65)', background: 'rgba(5,5,4,0.7)', padding: '3px 8px', borderRadius: 3, border: '1px solid rgba(255,235,205,0.12)', letterSpacing: '0.1em' }}>
              {String(odometer).padStart(5, '0')}
            </div>
            <div style={{ fontSize: 6, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>MILES</div>
          </div>
        </div>

        {/* radio head unit — the live station rides along */}
        <div style={{
          minWidth: 250, maxWidth: 330, padding: '9px 13px 10px', marginBottom: 2,
          background: 'linear-gradient(180deg, rgba(26,23,18,0.95), rgba(14,12,9,0.95))',
          border: '1px solid rgba(255,179,71,0.2)', borderRadius: 7,
          boxShadow: '0 8px 26px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,220,150,0.06)',
          pointerEvents: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 17, color: '#7dffb0', textShadow: '0 0 10px rgba(120,255,170,0.5)' }}>{freq.toFixed(1)}</span>
            <span style={{ fontSize: 8, color: 'rgba(120,255,170,0.5)' }}>FM</span>
            <span style={{
              fontSize: 7, letterSpacing: '0.14em', padding: '1px 6px', borderRadius: 2,
              color: status === 'live' ? '#0a0a0a' : 'rgba(255,179,71,0.85)',
              background: status === 'live' ? '#7dffb0' : 'rgba(255,179,71,0.12)',
            }}>{tuned ? (status === 'live' ? 'ON AIR' : 'TUNING…') : 'STATIC'}</span>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,236,205,0.75)', marginTop: 4, minHeight: 12,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>
            {station ? `${flag(station.country)} ${station.name}${station.city ? ` · ${station.city}` : ''}` : '— between stations —'}
          </div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: '0.1em' }}>
            ← → seek stations
          </div>
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
