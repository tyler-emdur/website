'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCursor } from '@/components/cursor/CursorContext'

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Cam  { x: number; y: number; z: number }
interface Vec2 { x: number; y: number }

interface Portal {
  id:    string
  label: string
  sub:   string
  color: string
  glow:  string
  wx:    number   // world x
  wy:    number   // world y
  r:     number   // base radius (world)
  path:  string
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  r: number
  col: string
  wo: number; ws: number
  opacity: number
}

// ─── PORTAL DEFINITIONS ──────────────────────────────────────────────────────
const PORTALS: Portal[] = [
  { id:'run',     label:'RUN',     sub:'routes · data · elevation', color:'#FF4422', glow:'rgba(255,68,34,0.25)',   wx:0,    wy:-240, r:80, path:'/run'     },
  { id:'build',   label:'BUILD',   sub:'projects · experiments',     color:'#3B82F6', glow:'rgba(59,130,246,0.25)', wx:280,  wy:80,   r:80, path:'/build'   },
  { id:'archive', label:'ARCHIVE', sub:'photos · notes · memories',  color:'#C8A882', glow:'rgba(200,168,130,0.25)',wx:-280, wy:80,   r:80, path:'/archive' },
  { id:'explore', label:'EXPLORE', sub:'mountains · colorado',       color:'#22C55E', glow:'rgba(34,197,94,0.25)',  wx:170,  wy:310,  r:80, path:'/explore' },
  { id:'lab',     label:'LAB',     sub:'toys · experiments · weird', color:'#A855F7', glow:'rgba(168,85,247,0.25)', wx:-170, wy:310,  r:80, path:'/lab'     },
]

// ─── DRAWING FUNCTIONS ───────────────────────────────────────────────────────
function drawRunPortal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, hover: boolean) {
  const a = r * 0.62, b = r * 0.35
  const alpha = hover ? 0.85 : 0.55

  // Track outline
  ctx.beginPath()
  ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255,68,34,${alpha * 0.35})`
  ctx.lineWidth = r * 0.015
  ctx.stroke()

  // Inner track
  ctx.beginPath()
  ctx.ellipse(cx, cy, a * 0.7, b * 0.7, 0, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255,68,34,${alpha * 0.5})`
  ctx.lineWidth = r * 0.018
  ctx.stroke()

  // Lane lines
  for (let i = 0; i < 3; i++) {
    const factor = 0.5 + i * 0.17
    ctx.beginPath()
    ctx.ellipse(cx, cy, a * factor, b * factor, 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255,68,34,${alpha * 0.15})`
    ctx.lineWidth = r * 0.006
    ctx.stroke()
  }

  // Animated runner dot
  const ang = t * 1.4
  const dx = cx + Math.cos(ang) * a * 0.85
  const dy = cy + Math.sin(ang) * b * 0.85
  ctx.beginPath()
  ctx.arc(dx, dy, r * 0.045, 0, Math.PI * 2)
  ctx.fillStyle = '#FF4422'
  ctx.shadowBlur = 8; ctx.shadowColor = '#FF4422'
  ctx.fill()
  ctx.shadowBlur = 0

  // Pace trail
  for (let i = 1; i <= 5; i++) {
    const ta = ang - i * 0.18
    const tx = cx + Math.cos(ta) * a * 0.85
    const ty = cy + Math.sin(ta) * b * 0.85
    ctx.beginPath()
    ctx.arc(tx, ty, r * 0.022 * (1 - i / 6), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,68,34,${0.4 * (1 - i / 6)})`
    ctx.fill()
  }
}

function drawBuildPortal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, hover: boolean) {
  const alpha = hover ? 0.85 : 0.55
  const s = r * 0.7

  // Blueprint grid
  const gs = r * 0.22
  ctx.strokeStyle = `rgba(59,130,246,${alpha * 0.2})`
  ctx.lineWidth = r * 0.008
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(cx - s, cy + i * gs); ctx.lineTo(cx + s, cy + i * gs); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx + i * gs, cy - s); ctx.lineTo(cx + i * gs, cy + s); ctx.stroke()
  }

  // Rotating outer square
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.15)
  ctx.strokeStyle = `rgba(59,130,246,${alpha * 0.7})`
  ctx.lineWidth = r * 0.02
  ctx.strokeRect(-s, -s, s * 2, s * 2)

  // Diagonals
  ctx.strokeStyle = `rgba(59,130,246,${alpha * 0.4})`
  ctx.lineWidth = r * 0.01
  ctx.beginPath(); ctx.moveTo(-s, -s); ctx.lineTo(s, s); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(s, -s); ctx.lineTo(-s, s); ctx.stroke()

  // Center circle
  ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(59,130,246,${alpha * 0.9})`
  ctx.lineWidth = r * 0.02; ctx.stroke()
  ctx.restore()
}

function drawArchivePortal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, hover: boolean) {
  const alpha = hover ? 0.85 : 0.55
  const w = r * 1.1, h = r * 0.75
  const rotations = [-6, 3, -2]
  const offsets   = [r * 0.06, r * 0.03, 0]

  rotations.forEach((rot, i) => {
    const lift = hover && i === 0 ? -r * 0.12 : 0
    ctx.save()
    ctx.translate(cx, cy - offsets[i] + lift)
    ctx.rotate((rot + Math.sin(t * 0.4 + i) * 0.8) * Math.PI / 180)
    const op = alpha * (i === 0 ? 0.85 : 0.5 - i * 0.1)
    ctx.strokeStyle = `rgba(200,168,130,${op})`
    ctx.fillStyle   = `rgba(200,168,130,${op * 0.06})`
    ctx.lineWidth   = r * 0.016
    ctx.beginPath()
    ctx.roundRect(-w / 2, -h / 2, w, h, r * 0.04)
    ctx.fill(); ctx.stroke()
    ctx.restore()
  })
}

function drawExplorePortal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, hover: boolean) {
  const alpha = hover ? 0.85 : 0.55
  const rings = 5

  for (let i = rings; i >= 1; i--) {
    const rad = (i / rings) * r
    const pulse = Math.sin(t * 0.7 + i * 0.5) * r * 0.04
    ctx.beginPath()
    ctx.ellipse(cx, cy, rad + pulse, rad * 0.6 + pulse * 0.6, 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(34,197,94,${alpha * (0.15 + (rings - i) * 0.08)})`
    ctx.lineWidth = r * 0.012
    ctx.stroke()
  }

  // Summit cross
  ctx.strokeStyle = `rgba(34,197,94,${alpha * 0.9})`
  ctx.lineWidth = r * 0.02
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.18); ctx.lineTo(cx, cy + r * 0.18); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx - r * 0.12, cy); ctx.lineTo(cx + r * 0.12, cy); ctx.stroke()
  ctx.lineCap = 'butt'
}

function drawLabPortal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, hover: boolean) {
  const alpha = hover ? 0.85 : 0.55
  const pts = 8

  // Morphing polygon
  ctx.beginPath()
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2 - Math.PI / 2
    const noise = Math.sin(t * 1.1 + i * 1.4) * r * 0.15 + Math.cos(t * 0.7 + i * 2.1) * r * 0.08
    const rad = r * 0.7 + noise
    const x = cx + Math.cos(a) * rad
    const y = cy + Math.sin(a) * rad
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.strokeStyle = `rgba(168,85,247,${alpha * 0.7})`
  ctx.lineWidth = r * 0.018
  ctx.stroke()

  // Inner web
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2
    const noise = Math.sin(t * 0.9 + i * 1.8) * r * 0.1
    const rad = r * 0.4 + noise
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
    ctx.strokeStyle = `rgba(168,85,247,${alpha * 0.2})`
    ctx.lineWidth = r * 0.008
    ctx.stroke()
  }

  // Pulsing core
  const pulse = 1 + Math.sin(t * 2.5) * 0.3
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.1 * pulse, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(168,85,247,${alpha * 0.8})`
  ctx.shadowBlur = 12; ctx.shadowColor = '#A855F7'
  ctx.fill(); ctx.shadowBlur = 0
}

const DRAW_FNS = { run: drawRunPortal, build: drawBuildPortal, archive: drawArchivePortal, explore: drawExplorePortal, lab: drawLabPortal }

// ─── HUB PAGE ────────────────────────────────────────────────────────────────
export default function HubPage() {
  const router   = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { setArea, setMode } = useCursor()

  // State refs (avoid re-renders in animation loop)
  const cam       = useRef<Cam>({ x: 0, y: 0, z: 1 })
  const targetCam = useRef<Cam>({ x: 0, y: 0, z: 1 })
  const dragging  = useRef(false)
  const dragStart = useRef<Vec2>({ x: 0, y: 0 })
  const camOnDrag = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const mouse     = useRef<Vec2>({ x: -9999, y: -9999 })
  const hoveredPortal = useRef<string | null>(null)
  const hoverAlpha    = useRef<Record<string, number>>({})
  const particles = useRef<Particle[]>([])
  const t         = useRef(0)
  const raf       = useRef(0)
  const areasVisited = useRef<Set<string>>(new Set())
  const transitioning = useRef(false)

  // Load visited areas from session
  useEffect(() => {
    try {
      const v = sessionStorage.getItem('visited')
      if (v) areasVisited.current = new Set(JSON.parse(v))
    } catch {}
    setArea('hub')
    return () => setArea(null)
  }, [setArea])

  // World ↔ screen transforms
  const w2s = useCallback((wx: number, wy: number): Vec2 => {
    const c = canvasRef.current!
    return {
      x: (wx - cam.current.x) * cam.current.z + c.width  / 2,
      y: (wy - cam.current.y) * cam.current.z + c.height / 2,
    }
  }, [])

  const s2w = useCallback((sx: number, sy: number): Vec2 => {
    const c = canvasRef.current!
    return {
      x: (sx - c.width  / 2) / cam.current.z + cam.current.x,
      y: (sy - c.height / 2) / cam.current.z + cam.current.y,
    }
  }, [])

  // Portal hit test
  const hitPortal = useCallback((wx: number, wy: number): Portal | null => {
    for (const p of PORTALS) {
      const dist = Math.hypot(wx - p.wx, wy - p.wy)
      if (dist < p.r * 1.3) return p
    }
    return null
  }, [])

  // Initialize particles
  useEffect(() => {
    const cols = ['#FF4422', '#3B82F6', '#C8A882', '#22C55E', '#A855F7']
    particles.current = Array.from({ length: 180 }, () => ({
      x: (Math.random() - 0.5) * 1200,
      y: (Math.random() - 0.5) * 900,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r:  Math.random() * 1.8 + 0.8,
      col: cols[Math.floor(Math.random() * cols.length)],
      wo: Math.random() * Math.PI * 2,
      ws: Math.random() * 0.008 + 0.003,
      opacity: Math.random() * 0.4 + 0.2,
    }))
    PORTALS.forEach(p => { hoverAlpha.current[p.id] = 0 })
  }, [])

  // Canvas resize
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current; if (!c) return
      c.width  = window.innerWidth
      c.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Navigate to area
  const navigateTo = useCallback((portal: Portal, clickX: number, clickY: number) => {
    if (transitioning.current) return
    transitioning.current = true

    // Store visited
    areasVisited.current.add(portal.id)
    try { sessionStorage.setItem('visited', JSON.stringify([...areasVisited.current])) } catch {}

    // Flash overlay + route
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position:fixed;inset:0;background:${portal.color};
      clip-path:circle(0px at ${clickX}px ${clickY}px);
      z-index:1000;transition:clip-path 0.65s cubic-bezier(0.4,0,0.2,1);pointer-events:none;
    `
    document.body.appendChild(overlay)
    requestAnimationFrame(() => {
      overlay.style.clipPath = `circle(200vmax at ${clickX}px ${clickY}px)`
    })
    setTimeout(() => router.push(portal.path), 420)
  }, [router])

  // Main draw loop
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!

    function draw() {
      if (!c) return
      t.current += 0.012

      // Lerp camera
      cam.current.x += (targetCam.current.x - cam.current.x) * 0.09
      cam.current.y += (targetCam.current.y - cam.current.y) * 0.09
      cam.current.z += (targetCam.current.z - cam.current.z) * 0.09

      const W = c.width, H = c.height

      // ── BACKGROUND ───────────────────────────────────────────
      const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7)
      grad.addColorStop(0, '#0d0d1a')
      grad.addColorStop(1, '#070710')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // Apply world transform
      ctx.save()
      ctx.translate(W/2, H/2)
      ctx.scale(cam.current.z, cam.current.z)
      ctx.translate(-cam.current.x, -cam.current.y)

      // ── FAINT GRID ───────────────────────────────────────────
      const gs = 80, range = 3000
      ctx.strokeStyle = 'rgba(255,255,255,0.025)'
      ctx.lineWidth = 0.5
      for (let x = -range; x <= range; x += gs) {
        ctx.beginPath(); ctx.moveTo(x,-range); ctx.lineTo(x,range); ctx.stroke()
      }
      for (let y = -range; y <= range; y += gs) {
        ctx.beginPath(); ctx.moveTo(-range,y); ctx.lineTo(range,y); ctx.stroke()
      }

      // ── NEBULA BLOBS ─────────────────────────────────────────
      PORTALS.forEach(p => {
        const r = p.r * 4.5 + Math.sin(t.current * 0.3 + p.wx * 0.01) * p.r * 0.8
        const ng = ctx.createRadialGradient(p.wx, p.wy, 0, p.wx, p.wy, r)
        const ha = hoverAlpha.current[p.id] ?? 0
        ng.addColorStop(0,   p.glow.replace('0.25', String(0.08 + ha * 0.12)))
        ng.addColorStop(0.5, p.glow.replace('0.25', String(0.03 + ha * 0.05)))
        ng.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = ng
        ctx.beginPath(); ctx.arc(p.wx, p.wy, r, 0, Math.PI*2); ctx.fill()
      })

      // ── PARTICLES ────────────────────────────────────────────
      const mw = s2w(mouse.current.x, mouse.current.y)
      particles.current.forEach(p => {
        p.wo += p.ws
        p.vx += Math.cos(p.wo) * 0.004
        p.vy += Math.sin(p.wo) * 0.004
        p.vx *= 0.99; p.vy *= 0.99
        const spd = Math.hypot(p.vx, p.vy); if (spd > 0.6) { p.vx=p.vx/spd*0.6; p.vy=p.vy/spd*0.6 }
        const mdx = p.x - mw.x, mdy = p.y - mw.y, md = Math.hypot(mdx, mdy)
        if (md < 120 && md > 0) { const f=(120-md)/120*0.25; p.vx+=mdx/md*f; p.vy+=mdy/md*f }
        p.x += p.vx; p.y += p.vy
        if (p.x < -600) p.x = 600; if (p.x > 600) p.x = -600
        if (p.y < -450) p.y = 450; if (p.y > 450) p.y = -450
      })

      // Particle connections
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i+1; j < particles.current.length; j++) {
          const a = particles.current[i], b = particles.current[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 120) {
            ctx.beginPath()
            ctx.strokeStyle = a.col; ctx.globalAlpha = (1 - d/120) * 0.1
            ctx.lineWidth = 0.4
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1

      // Particle dots
      particles.current.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = p.col; ctx.globalAlpha = p.opacity * 0.5
        ctx.fill()
      }); ctx.globalAlpha = 1

      // ── PORTAL CONNECTORS ────────────────────────────────────
      for (let i = 0; i < PORTALS.length; i++) {
        for (let j = i+1; j < PORTALS.length; j++) {
          const a = PORTALS[i], b = PORTALS[j]
          ctx.beginPath()
          ctx.strokeStyle = `rgba(255,255,255,0.04)`
          ctx.lineWidth = 0.5
          ctx.setLineDash([4, 8])
          ctx.moveTo(a.wx, a.wy); ctx.lineTo(b.wx, b.wy); ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // ── PORTALS ──────────────────────────────────────────────
      const mwPortal = hitPortal(mw.x, mw.y)
      hoveredPortal.current = mwPortal?.id ?? null

      PORTALS.forEach(p => {
        const isHover = hoveredPortal.current === p.id
        const ha = hoverAlpha.current[p.id] ?? 0
        hoverAlpha.current[p.id] = ha + (isHover ? 1 : -1) * 0.06 * (isHover ? (1-ha) : ha)

        const dimOther = hoveredPortal.current && !isHover
        ctx.globalAlpha = dimOther ? 0.28 : 1

        // Glow ring
        if (ha > 0.01) {
          ctx.beginPath(); ctx.arc(p.wx, p.wy, p.r * (1 + ha * 0.4), 0, Math.PI*2)
          ctx.strokeStyle = p.color; ctx.globalAlpha = ha * (dimOther ? 0.1 : 0.25)
          ctx.lineWidth = 1; ctx.shadowBlur = 20; ctx.shadowColor = p.color
          ctx.stroke(); ctx.shadowBlur = 0
        }
        ctx.globalAlpha = dimOther ? 0.28 : 1

        // Portal outer circle
        ctx.beginPath(); ctx.arc(p.wx, p.wy, p.r * (1 + ha * 0.18), 0, Math.PI*2)
        ctx.strokeStyle = p.color; ctx.lineWidth = (isHover ? 1.5 : 1)
        ctx.globalAlpha = (0.2 + ha * 0.5) * (dimOther ? 0.3 : 1)
        ctx.stroke()
        ctx.globalAlpha = dimOther ? 0.28 : 1

        // Portal inner drawing
        const fn = DRAW_FNS[p.id as keyof typeof DRAW_FNS]
        if (fn) fn(ctx, p.wx, p.wy, p.r, t.current, isHover)

        ctx.globalAlpha = 1
      })

      // ── SECRET CONSTELLATION (zoom out to see) ───────────────
      if (cam.current.z < 0.45) {
        const opacity = (0.45 - cam.current.z) / 0.2
        ctx.globalAlpha = Math.min(1, opacity) * 0.15
        ctx.fillStyle = '#fff'
        // TE constellation points
        const stars = [
          [-500,-400],[-400,-400],[-300,-400], // T top
          [-400,-400],[-400,-250],              // T stem
          [-200,-400],[-100,-400],              // E top
          [-200,-400],[-200,-250],              // E middle
          [-200,-325],[-130,-325],              // E middle bar
          [-200,-250],[-100,-250],              // E bottom
        ]
        stars.forEach(([sx,sy]) => {
          ctx.beginPath(); ctx.arc(sx as number, sy as number, 6, 0, Math.PI*2); ctx.fill()
        })
        ctx.globalAlpha = 1
      }

      // ── SCREEN-SPACE UI ──────────────────────────────────────
      ctx.restore()

      // Coordinates
      const mwUI = s2w(W*0.5, H*0.5)
      ctx.font = '10px monospace'
      ctx.fillStyle = 'rgba(240,237,232,0.15)'
      ctx.textAlign = 'right'
      ctx.fillText(`${Math.round(mwUI.x)}, ${Math.round(mwUI.y)}  z:${cam.current.z.toFixed(2)}`, W - 20, H - 20)
      ctx.textAlign = 'left'

      // Portal labels (visible on hover)
      PORTALS.forEach(p => {
        const ha = hoverAlpha.current[p.id] ?? 0
        if (ha < 0.01) return
        const sc = w2s(p.wx, p.wy)

        ctx.globalAlpha = ha
        ctx.font = `bold ${Math.round(14 * cam.current.z + 2)}px monospace`
        ctx.fillStyle = p.color
        ctx.textAlign = 'center'
        ctx.fillText(p.label, sc.x, sc.y + p.r * cam.current.z + 24)

        ctx.font = `${Math.round(10 * cam.current.z)}px monospace`
        ctx.fillStyle = 'rgba(240,237,232,0.6)'
        ctx.fillText(p.sub, sc.x, sc.y + p.r * cam.current.z + 38)
        ctx.textAlign = 'left'
        ctx.globalAlpha = 1
      })

      // Hint (on first load, fade out)
      if (t.current < 5) {
        ctx.globalAlpha = Math.max(0, 1 - t.current / 3) * 0.4
        ctx.font = '10px monospace'
        ctx.fillStyle = '#F0EDE8'
        ctx.textAlign = 'center'
        ctx.fillText('drag to explore · scroll to zoom', W/2, H - 28)
        ctx.textAlign = 'left'
        ctx.globalAlpha = 1
      }

      raf.current = requestAnimationFrame(draw)
    }

    raf.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf.current)
  }, [w2s, s2w, hitPortal])

  // ── MOUSE EVENTS ─────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    mouse.current = { x: e.clientX, y: e.clientY }
    const wPos = s2w(e.clientX, e.clientY)
    const p = hitPortal(wPos.x, wPos.y)
    if (p) setMode('hover'); else setMode('default')
  }, [s2w, hitPortal, setMode])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    camOnDrag.current = { x: cam.current.x, y: cam.current.y }
    setMode('drag')
  }, [setMode])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    const moved = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y)
    if (moved < 5) {
      // Click — check portal
      const wPos = s2w(e.clientX, e.clientY)
      const p = hitPortal(wPos.x, wPos.y)
      if (p) navigateTo(p, e.clientX, e.clientY)
    }
    dragging.current = false
    setMode('default')
  }, [s2w, hitPortal, navigateTo, setMode])

  const onMouseMoveGlobal = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return
    const dx = (e.clientX - dragStart.current.x) / cam.current.z
    const dy = (e.clientY - dragStart.current.y) / cam.current.z
    targetCam.current.x = camOnDrag.current.x - dx
    targetCam.current.y = camOnDrag.current.y - dy
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY * 0.001
    const next = Math.max(0.25, Math.min(2.5, targetCam.current.z + delta * targetCam.current.z))

    // Zoom toward mouse
    const mouseWorld = s2w(e.clientX, e.clientY)
    const scale = next / targetCam.current.z
    targetCam.current.x = mouseWorld.x + (targetCam.current.x - mouseWorld.x) / scale
    targetCam.current.y = mouseWorld.y + (targetCam.current.y - mouseWorld.y) / scale
    targetCam.current.z = next
  }, [s2w])

  // Touch support
  const lastTouchDist = useRef(0)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragging.current = true
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      camOnDrag.current = { x: cam.current.x, y: cam.current.y }
    } else if (e.touches.length === 2) {
      lastTouchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && dragging.current) {
      const dx = (e.touches[0].clientX - dragStart.current.x) / cam.current.z
      const dy = (e.touches[0].clientY - dragStart.current.y) / cam.current.z
      targetCam.current.x = camOnDrag.current.x - dx
      targetCam.current.y = camOnDrag.current.y - dy
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      const scale = dist / lastTouchDist.current
      targetCam.current.z = Math.max(0.25, Math.min(2.5, targetCam.current.z * scale))
      lastTouchDist.current = dist
    }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0]
      const moved = Math.hypot(touch.clientX - dragStart.current.x, touch.clientY - dragStart.current.y)
      if (moved < 12) {
        const wPos = s2w(touch.clientX, touch.clientY)
        const p = hitPortal(wPos.x, wPos.y)
        if (p) navigateTo(p, touch.clientX, touch.clientY)
      }
    }
    dragging.current = false
  }, [s2w, hitPortal, navigateTo])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      onMouseMove={(e) => { onMouseMove(e); onMouseMoveGlobal(e) }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={() => { dragging.current = false; setMode('default') }}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ cursor: 'none' }}
    />
  )
}
