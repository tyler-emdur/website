'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ─── SCENE OBJECTS ─────────────────────────────────────────────────────────

interface DeepObj {
  id: number
  nx: number    // 0..1 normalized screen position
  ny: number
  depth: number // 0=shallow 1=abyss — affects fade speed and color
  type: 'text' | 'coord' | 'door' | 'creature' | 'signal'
  label: string
  worldId?: number
  portal?: string
  glow: number  // 0..1 current visibility
  phase: number // float phase
}

const SCENE: Omit<DeepObj, 'glow' | 'phase'>[] = [
  { id:1,  nx:0.22, ny:0.18, depth:0.05, type:'text',    label:'BORN: MIDWEST, RELOCATED: BOULDER CO 2022' },
  { id:2,  nx:0.65, ny:0.28, depth:0.1,  type:'coord',   label:'40.0150°N  105.2705°W' },
  { id:3,  nx:0.38, ny:0.35, depth:0.15, type:'text',    label:'BUILDER OF THINGS · RUNNER OF TRAILS' },
  { id:4,  nx:0.78, ny:0.42, depth:0.2,  type:'creature',label:'' },
  { id:5,  nx:0.15, ny:0.48, depth:0.25, type:'door',    label:'BEFORE THE DECISION', worldId:1, portal:'fold' },
  { id:6,  nx:0.55, ny:0.52, depth:0.3,  type:'signal',  label:'FREQUENCY: 88.7' },
  { id:7,  nx:0.82, ny:0.58, depth:0.35, type:'coord',   label:'38.8405°N  105.0442°W · PIKES PEAK' },
  { id:8,  nx:0.30, ny:0.62, depth:0.4,  type:'text',    label:'DIGGER · MUSIC DISCOVERY · DEPLOYED 2024' },
  { id:9,  nx:0.68, ny:0.66, depth:0.45, type:'creature',label:'' },
  { id:10, nx:0.12, ny:0.70, depth:0.5,  type:'door',    label:'ROOM 47', worldId:6, portal:'cursor-flood' },
  { id:11, nx:0.48, ny:0.73, depth:0.55, type:'text',    label:'NEXT.JS · THREE.JS · TYPESCRIPT · ZUSTAND' },
  { id:12, nx:0.85, ny:0.77, depth:0.6,  type:'coord',   label:'39.1178°N  106.4453°W · MT. ELBERT' },
  { id:13, nx:0.25, ny:0.81, depth:0.65, type:'signal',  label:'──────  88.7  ──────' },
  { id:14, nx:0.60, ny:0.84, depth:0.7,  type:'door',    label:'WHAT YOU WERE LOOKING FOR', worldId:9, portal:'expand-white' },
  { id:15, nx:0.40, ny:0.88, depth:0.75, type:'creature',label:'' },
  { id:16, nx:0.72, ny:0.91, depth:0.8,  type:'text',    label:'BOULDER MARATHON · 3:41:22 · OCT 2024' },
  { id:17, nx:0.18, ny:0.93, depth:0.85, type:'door',    label:'THE LOOP', worldId:10, portal:'vortex' },
  { id:18, nx:0.50, ny:0.96, depth:0.95, type:'signal',  label:'[signal lost]' },
]

// ─── SONAR RING ─────────────────────────────────────────────────────────────

interface Ring {
  id: number
  ox: number  // origin pixel
  oy: number
  r: number   // current radius
  maxR: number
  alpha: number
  speed: number
}

let ringId = 0

// ─── CREATURE SHAPE ─────────────────────────────────────────────────────────
function drawCreature(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number, t: number, id: number) {
  const pulse = 0.7 + 0.3 * Math.sin(t * 0.002 + id)
  ctx.save()
  ctx.globalAlpha = alpha * pulse
  const r = 18 + id * 3
  // body
  ctx.beginPath()
  ctx.ellipse(x, y, r * 0.9, r * 0.45, Math.sin(t * 0.001 + id) * 0.3, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(0,220,180,${alpha})`
  ctx.lineWidth = 0.8
  ctx.stroke()
  // tentacles
  for (let i = 0; i < 5; i++) {
    const tx2 = x + (i - 2) * 7
    const ty2 = y + r * 0.45
    ctx.beginPath()
    ctx.moveTo(tx2, ty2)
    ctx.quadraticCurveTo(tx2 + Math.sin(t * 0.003 + i) * 6, ty2 + 10, tx2, ty2 + 18)
    ctx.strokeStyle = `rgba(0,180,160,${alpha * 0.5})`
    ctx.lineWidth = 0.6
    ctx.stroke()
  }
  // eye glow
  ctx.beginPath()
  ctx.arc(x - 6, y - 3, 3, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(0,255,200,${alpha * 0.8})`
  ctx.fill()
  ctx.restore()
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function World2Depth() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ringsRef = useRef<Ring[]>([])
  const objsRef = useRef<DeepObj[]>(
    SCENE.map(o => ({ ...o, glow: 0, phase: Math.random() * Math.PI * 2 }))
  )
  const rafRef = useRef(0)
  const [depth, setDepth] = useState(0)
  const [pressure, setPressure] = useState(1.0)
  const [pings, setPings] = useState(0)
  const [revealedDoors, setRevealedDoors] = useState<Set<number>>(new Set())
  const sizeRef = useRef({ W: 0, H: 0 })

  // depth creep
  useEffect(() => {
    const iv = setInterval(() => {
      setDepth(d => +(d + 0.08 + Math.random() * 0.04).toFixed(2))
      setPressure(p => +(p + 0.0012).toFixed(4))
    }, 200)
    return () => clearInterval(iv)
  }, [])

  // resize
  useEffect(() => {
    const resize = () => {
      const W = window.innerWidth, H = window.innerHeight
      sizeRef.current = { W, H }
      const c = canvasRef.current
      if (c) { c.width = W; c.height = H }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let t = 0

    function render() {
      t++
      const { W, H } = sizeRef.current
      if (W === 0) { rafRef.current = requestAnimationFrame(render); return }

      ctx.clearRect(0, 0, W, H)

      // ── Ocean gradient ──
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#001a2e')
      bg.addColorStop(0.3, '#000e1c')
      bg.addColorStop(0.7, '#000810')
      bg.addColorStop(1, '#000204')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // ── Caustic surface light ──
      const caustic = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, H * 0.4)
      caustic.addColorStop(0, 'rgba(0,80,140,0.18)')
      caustic.addColorStop(1, 'transparent')
      ctx.fillStyle = caustic
      ctx.fillRect(0, 0, W, H * 0.4)

      // ── Faint sonar grid (depth lines) ──
      for (let i = 1; i <= 5; i++) {
        const y = H * (i / 6)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.strokeStyle = `rgba(0,180,160,0.03)`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // ── Advance + draw sonar rings ──
      ringsRef.current = ringsRef.current.filter(ring => ring.alpha > 0.005)
      for (const ring of ringsRef.current) {
        ring.r += ring.speed
        ring.alpha *= 0.985

        // hit test objects
        for (const obj of objsRef.current) {
          const ox = obj.nx * W, oy = obj.ny * H
          const dist = Math.hypot(ox - ring.ox, oy - ring.oy)
          if (Math.abs(dist - ring.r) < 12) {
            const fadeMult = 1 - obj.depth * 0.65
            obj.glow = Math.min(1, obj.glow + ring.alpha * 2.5 * fadeMult)
            if (obj.type === 'door' && obj.glow > 0.3) {
              setRevealedDoors(prev => new Set([...prev, obj.id]))
            }
          }
        }

        ctx.beginPath()
        ctx.arc(ring.ox, ring.oy, ring.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0,220,180,${ring.alpha * 0.6})`
        ctx.lineWidth = 1.2
        ctx.stroke()

        // inner echo
        if (ring.r > 30) {
          ctx.beginPath()
          ctx.arc(ring.ox, ring.oy, ring.r * 0.7, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(0,180,160,${ring.alpha * 0.2})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // ── Fade objects over time ──
      for (const obj of objsRef.current) {
        obj.glow = Math.max(0, obj.glow - 0.003 - obj.depth * 0.004)
        obj.phase += 0.008
      }

      // ── Draw objects ──
      for (const obj of objsRef.current) {
        if (obj.glow < 0.01) continue
        const ox = obj.nx * W, oy = obj.ny * H
        const a = obj.glow
        const float = Math.sin(obj.phase) * 3

        if (obj.type === 'creature') {
          drawCreature(ctx, ox, oy + float, a, t, obj.id)
          continue
        }

        if (obj.type === 'signal') {
          ctx.save()
          ctx.globalAlpha = a
          ctx.font = '10px monospace'
          ctx.fillStyle = `rgba(0,255,200,${a})`
          ctx.textAlign = 'center'
          ctx.shadowColor = 'rgba(0,255,180,0.8)'
          ctx.shadowBlur = 12
          ctx.fillText(obj.label, ox, oy + float)
          ctx.restore()
          continue
        }

        if (obj.type === 'door') {
          const dw = 44, dh = 66
          ctx.save()
          ctx.globalAlpha = a
          ctx.fillStyle = 'rgba(0,8,20,0.92)'
          ctx.strokeStyle = `rgba(0,220,180,${a * 0.8})`
          ctx.lineWidth = 1
          ctx.fillRect(ox - dw / 2, oy + float - dh / 2, dw, dh)
          ctx.strokeRect(ox - dw / 2, oy + float - dh / 2, dw, dh)
          // knob
          ctx.beginPath()
          ctx.arc(ox + dw / 2 - 8, oy + float, 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0,220,180,${a * 0.6})`
          ctx.fill()
          // label below
          ctx.font = '8px monospace'
          ctx.fillStyle = `rgba(0,220,180,${a * 0.7})`
          ctx.textAlign = 'center'
          ctx.shadowColor = 'rgba(0,200,180,0.6)'
          ctx.shadowBlur = 6
          ctx.fillText(obj.label, ox, oy + float + dh / 2 + 14)
          ctx.restore()
          continue
        }

        if (obj.type === 'coord') {
          ctx.save()
          ctx.globalAlpha = a
          ctx.font = '9px monospace'
          ctx.fillStyle = `rgba(100,240,220,${a * 0.9})`
          ctx.textAlign = 'center'
          ctx.shadowColor = 'rgba(0,220,200,0.5)'
          ctx.shadowBlur = 8
          ctx.fillText(obj.label, ox, oy + float)
          ctx.restore()
          continue
        }

        // text
        ctx.save()
        ctx.globalAlpha = a * 0.85
        ctx.font = '11px Georgia, serif'
        ctx.fillStyle = `rgba(180,240,255,${a})`
        ctx.textAlign = 'center'
        ctx.fillText(obj.label, ox, oy + float)
        ctx.restore()
      }

      // ── Vignette ──
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.9)
      vig.addColorStop(0, 'transparent')
      vig.addColorStop(1, 'rgba(0,0,4,0.7)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, W, H)

      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { W, H } = sizeRef.current
    const mx = e.clientX, my = e.clientY

    // Check if clicking a revealed door
    for (const obj of objsRef.current) {
      if (obj.type !== 'door' || obj.glow < 0.2) continue
      const ox = obj.nx * W, oy = obj.ny * H
      if (Math.abs(mx - ox) < 28 && Math.abs(my - oy) < 40) {
        if (obj.worldId != null && obj.portal) {
          navigateTo(obj.worldId as Parameters<typeof navigateTo>[0], {
            type: obj.portal as Parameters<typeof navigateTo>[1]['type'],
            origin: { x: mx, y: my },
          })
          return
        }
      }
    }

    // Fire sonar ping
    const maxR = Math.hypot(W, H) * 0.85
    ringsRef.current.push({
      id: ringId++,
      ox: mx, oy: my,
      r: 0, maxR,
      alpha: 0.85,
      speed: 4 + depth * 0.01,
    })
    setPings(p => p + 1)
  }, [navigateTo, depth])

  const pingHint = pings === 0

  return (
    <div data-world="2" style={{ position: 'fixed', inset: 0, overflow: 'hidden', cursor: 'crosshair' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0 }}
        onClick={handleClick}
      />

      {/* Click hint */}
      {pingHint && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '1px solid rgba(0,220,180,0.25)',
            animation: 'sonarPulse 2s ease-out infinite',
          }} />
          <div style={{
            fontFamily: 'monospace', fontSize: 10,
            color: 'rgba(0,220,180,0.35)', letterSpacing: '0.25em',
          }}>CLICK TO PING</div>
        </div>
      )}

      {/* HUD */}
      <div style={{
        position: 'absolute', bottom: 28, left: 32,
        fontFamily: 'monospace', fontSize: 9,
        color: 'rgba(0,180,160,0.45)', letterSpacing: '0.18em',
        lineHeight: 2.2, pointerEvents: 'none',
      }}>
        <div>DEPTH   {depth.toFixed(1)} m</div>
        <div>PRESSURE {pressure.toFixed(3)} atm</div>
        <div style={{ opacity: 0.5 }}>40.0150°N  105.2705°W</div>
      </div>

      <div style={{
        position: 'absolute', bottom: 28, right: 32,
        fontFamily: 'monospace', fontSize: 9,
        color: 'rgba(0,180,160,0.2)', letterSpacing: '0.15em',
        textAlign: 'right', pointerEvents: 'none',
      }}>
        <div>SECTOR 02</div>
        <div>PINGS: {pings}</div>
        {revealedDoors.size > 0 && (
          <div style={{ color: 'rgba(0,220,180,0.4)' }}>{revealedDoors.size} DOOR{revealedDoors.size > 1 ? 'S' : ''} FOUND</div>
        )}
      </div>

      <style>{`
        @keyframes sonarPulse {
          0%   { transform: scale(0.8); opacity: 0.6; }
          50%  { transform: scale(1.8); opacity: 0.2; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>
      <HomeButton />
    </div>
  )
}
