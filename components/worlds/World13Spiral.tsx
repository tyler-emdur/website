'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

interface Branch {
  id: number
  angle: number
  depth: number
  label: string
  world: WorldId
  portal: PortalType
  color: string
}

const BRANCH_POOL: Omit<Branch, 'id' | 'angle' | 'depth'>[] = [
  { label: 'DEPTH', world: 2, portal: 'scatter', color: '#6366f1' },
  { label: 'TV', world: 3, portal: 'expand-white', color: '#92400e' },
  { label: 'HALL', world: 4, portal: 'slide-right', color: '#22c55e' },
  { label: 'STATION', world: 5, portal: 'rotate', color: '#f97316' },
  { label: 'MALL', world: 7, portal: 'cursor-flood', color: '#1a1410' },
  { label: 'FLICKER', world: 11, portal: 'scatter', color: '#ff0064' },
  { label: 'LOOP', world: 10, portal: 'vortex', color: '#818cf8' },
  { label: 'TERM', world: 12, portal: 'nothing', color: '#22c55e' },
  { label: 'DOC', world: 6, portal: 'nothing', color: '#b45309' },
  { label: 'SIG', world: 8, portal: 'fold', color: '#525252' },
  { label: 'PIXEL', world: 14, portal: 'chromatic', color: '#FF006E' },
  { label: 'DIAL', world: 15, portal: 'chromatic', color: '#22c55e' },
  { label: 'INDEX', world: 16, portal: 'fold', color: '#818cf8' },
]

export default function World13Spiral() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const depthRef = useRef(0)
  const branchesRef = useRef<Branch[]>([])
  const branchIdRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0 })
  const [depthDisplay, setDepthDisplay] = useState(0)
  const [hint, setHint] = useState('click a wormhole · scroll to fall faster')
  const caughtRef = useRef(false)

  const spawnBranch = useCallback((depth: number) => {
    const def = BRANCH_POOL[Math.floor(Math.random() * BRANCH_POOL.length)]
    branchesRef.current.push({
      id: branchIdRef.current++,
      angle: Math.random() * Math.PI * 2,
      depth,
      label: def.label,
      world: def.world,
      portal: def.portal,
      color: def.color,
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    let raf = 0

    for (let i = 0; i < 6; i++) spawnBranch(i * 400)

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const onWheel = (e: WheelEvent) => {
      depthRef.current += e.deltaY * 0.5
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('wheel', onWheel, { passive: true })

    function draw() {
      if (caughtRef.current) return
      depthRef.current += 2.8
      const depth = depthRef.current

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      const cx = W / 2
      const cy = H / 2
      const rings = 24
      for (let i = 0; i < rings; i++) {
        const z = ((depth * 0.8 + i * 90) % 2400)
        const scale = 800 / (z + 80)
        const r = scale * 280
        const rot = depth * 0.002 + i * 0.4
        if (r < 4 || r > W * 2) continue
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(rot)
        const hue = (i * 17 + depth * 0.05) % 360
        ctx.strokeStyle = `hsla(${hue}, 60%, 55%, ${Math.min(0.5, scale * 0.8)})`
        ctx.lineWidth = Math.max(0.5, scale * 3)
        ctx.beginPath()
        for (let a = 0; a <= Math.PI * 2; a += 0.12) {
          const w = Math.sin(a * 6 + depth * 0.01) * scale * 20
          const px = Math.cos(a) * (r + w)
          const py = Math.sin(a) * (r + w)
          if (a === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
      }

      // Spawn branches
      const last = branchesRef.current[branchesRef.current.length - 1]
      if (!last || depth - last.depth > 350) {
        spawnBranch(depth + 600)
      }
      branchesRef.current = branchesRef.current.filter(b => depth - b.depth < 3000)

      // Draw branches
      branchesRef.current.forEach(b => {
        const dz = b.depth - depth
        if (dz < 50 || dz > 2500) return
        const scale = 600 / (dz + 50)
        const bx = cx + Math.cos(b.angle) * scale * 200
        const by = cy + Math.sin(b.angle) * scale * 200
        const size = Math.max(8, scale * 40)
        ctx.save()
        ctx.translate(bx, by)
        ctx.rotate(depth * 0.003 + b.angle)
        ctx.fillStyle = b.color + '88'
        ctx.strokeStyle = b.color
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let s = 0; s < 6; s++) {
          const a = (s / 6) * Math.PI * 2
          const px = Math.cos(a) * size
          const py = Math.sin(a) * size
          if (s === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.font = `${Math.max(7, size * 0.35)}px "Share Tech Mono", monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(b.label, 0, 0)
        ctx.restore()
      })

      if (Math.floor(depth / 500) !== Math.floor((depth - 2.8) / 500)) {
        setDepthDisplay(Math.floor(depth / 100))
        if (depth > 2000 && depth < 2100) setHint('the branches multiply the deeper you go')
        if (depth > 5000) setHint('there is no bottom. only more openings.')
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('wheel', onWheel)
    }
  }, [spawnBranch])

  const handleClick = (e: React.MouseEvent) => {
    if (caughtRef.current) return
    const mx = e.clientX
    const my = e.clientY
    const depth = depthRef.current
    let hit: Branch | undefined
    let bestDist = Infinity
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2

    for (const b of branchesRef.current) {
      const dz = b.depth - depth
      if (dz < 50 || dz > 2500) continue
      const scale = 600 / (dz + 50)
      const bx = cx + Math.cos(b.angle) * scale * 200
      const by = cy + Math.sin(b.angle) * scale * 200
      const size = Math.max(8, scale * 40)
      const dist = Math.hypot(mx - bx, my - by)
      if (dist < size * 1.5 && dist < bestDist) {
        bestDist = dist
        hit = b
      }
    }

    if (hit) {
      caughtRef.current = true
      setHint(`entering ${hit.label}...`)
      navigateTo(hit.world, {
        type: hit.portal,
        origin: { x: mx, y: my },
        color: hit.color,
      })
    }
  }

  return (
    <div
      data-world="13"
      style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
      />

      <div style={{
        position: 'absolute',
        top: 24,
        left: 24,
        fontFamily: '"Share Tech Mono", monospace',
        fontSize: 9,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.15em',
        lineHeight: 2,
        pointerEvents: 'none',
      }}>
        <div>THE SPIRAL</div>
        <div>DEPTH: {depthDisplay}</div>
        <div style={{ opacity: 0.6 }}>{hint}</div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: '"Share Tech Mono", monospace',
        fontSize: 8,
        color: 'rgba(255,255,255,0.12)',
        letterSpacing: '0.25em',
        pointerEvents: 'none',
        textAlign: 'center',
      }}>
        ∞ WORMHOLES AHEAD ∞
      </div>

      <HomeButton />
    </div>
  )
}
