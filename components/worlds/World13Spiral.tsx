'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import HomeButton from './HomeButton'

interface Branch {
  id: number
  angle: number
  depth: number
  label: string
  color: string
}

const BRANCH_POOL: Omit<Branch, 'id' | 'angle' | 'depth'>[] = [
  { label: 'THAT SUMMER', color: '#6366f1' },
  { label: 'THE DECISION', color: '#92400e' },
  { label: 'BEFORE BOULDER', color: '#22c55e' },
  { label: 'THE MARATHON', color: '#f97316' },
  { label: 'LATE NIGHTS', color: '#ff0064' },
  { label: 'THE ARCHIVE', color: '#818cf8' },
  { label: '88.7 MHz', color: '#00dcc0' },
  { label: 'ROOM 47', color: '#b45309' },
  { label: '40.0150°N', color: '#525252' },
  { label: 'OCT 2024', color: '#FF006E' },
  { label: 'POST-MOVE', color: '#4ade80' },
  { label: 'MILESTONE', color: '#a78bfa' },
]

const BRANCH_FRAGMENTS: Record<string, string> = {
  'THAT SUMMER': 'summer 2022. somewhere between "i should probably do this" and "i\'m doing this."\n\nthe midwest was still home, technically.\nthat\'s the last time it was.',
  'THE DECISION': 'it wasn\'t one moment.\nit was three weeks of spreadsheets\nand one morning where it just seemed obvious.\n\nthen it was obvious.',
  'BEFORE BOULDER': 'flat. comfortable in the wrong direction.\nthe kind of place where you stay\nbecause leaving requires a decision.\n\ni made the decision.',
  'THE MARATHON': 'boulder marathon. oct 2024. 3:41:22.\n\nthe last mile was the wrong mile.\nit was the right one.',
  'LATE NIGHTS': 'usually software. sometimes music.\n\ndigger was built between 11pm and 2am.\nso was most of the good stuff.',
  'THE ARCHIVE': 'everything gets kept somewhere.\nnotes, logs, running splits, commit histories.\n\nsome of it makes sense later.\nsome of it is just weight.',
  '88.7 MHz': 'the frequency appears in several worlds.\n\nthere\'s no good explanation for this.\nthere doesn\'t need to be.',
  'ROOM 47': '47 objects. 1 recovered. 46 status unknown.\n\nthe committee has been notified.\nthe committee meets irregularly.',
  '40.0150°N': 'boulder, co. center of gravity.\n\nnorth of downtown, south of the mountains,\nleft of where i started.',
  'OCT 2024': 'marathon month. altitude makes everything harder and better.\n\nboulder at altitude is a thing\nyou can\'t explain without being here.',
  'POST-MOVE': 'the 6 months after moving.\neverything is new and nothing is familiar.\n\ni stayed anyway.\nthat was the right call.',
  'MILESTONE': 'hard to name while you\'re in it.\n\nonly visible in retrospect,\nfrom a certain angle,\nwhen the light is right.',
}

const DEPTH_EVENTS: { depth: number; text: string }[] = [
  { depth: 700,   text: 'still falling.' },
  { depth: 2000,  text: '40.0150°N  105.2705°W' },
  { depth: 3500,  text: "the wormholes don't open from the inside." },
  { depth: 5500,  text: "you've been here before." },
  { depth: 8000,  text: 'something was built here.' },
  { depth: 11000, text: "you won't find the bottom." },
  { depth: 16000, text: 'keep going anyway.' },
  { depth: 25000, text: '— T.E.' },
]

export default function World13Spiral() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const depthRef = useRef(0)
  const branchesRef = useRef<Branch[]>([])
  const branchIdRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0 })
  const triggeredDepths = useRef<Set<number>>(new Set())
  const [depthDisplay, setDepthDisplay] = useState(0)
  const [hint, setHint] = useState('click a wormhole · scroll to fall faster')
  const [fragment, setFragment] = useState('')
  const [fragVisible, setFragVisible] = useState(false)
  const fragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [wormholeCard, setWormholeCard] = useState<{ label: string; text: string; color: string } | null>(null)
  const wormholeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showFragment = useCallback((text: string) => {
    if (fragTimerRef.current) clearTimeout(fragTimerRef.current)
    setFragment(text)
    setFragVisible(true)
    fragTimerRef.current = setTimeout(() => setFragVisible(false), 3200)
  }, [])

  const spawnBranch = useCallback((depth: number) => {
    const def = BRANCH_POOL[Math.floor(Math.random() * BRANCH_POOL.length)]
    branchesRef.current.push({
      id: branchIdRef.current++,
      angle: Math.random() * Math.PI * 2,
      depth,
      label: def.label,
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

  // Check depth events independently from draw loop to avoid stale closures
  useEffect(() => {
    const iv = setInterval(() => {
      const d = depthRef.current
      for (const ev of DEPTH_EVENTS) {
        if (d >= ev.depth && !triggeredDepths.current.has(ev.depth)) {
          triggeredDepths.current.add(ev.depth)
          showFragment(ev.text)
          setHint(ev.text)
          break
        }
      }
    }, 400)
    return () => clearInterval(iv)
  }, [showFragment])

  const handleClick = (e: React.MouseEvent) => {
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
      showFragment(`// ${hit.label}`)
      setHint(`// ${hit.label}`)
      const fragmentText = BRANCH_FRAGMENTS[hit.label]
      if (fragmentText) {
        if (wormholeTimerRef.current) clearTimeout(wormholeTimerRef.current)
        setWormholeCard({ label: hit.label, text: fragmentText, color: hit.color })
        wormholeTimerRef.current = setTimeout(() => setWormholeCard(null), 5000)
      }
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

      {/* Centered depth fragment */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: '"Share Tech Mono", monospace',
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: '0.18em',
        pointerEvents: 'none',
        textAlign: 'center',
        opacity: fragVisible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        textShadow: '0 0 20px rgba(255,255,255,0.3)',
        maxWidth: '60vw',
      }}>
        {fragment}
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
        DEPTH INCREASING · NO FLOOR DETECTED
      </div>

      {/* Wormhole fragment card */}
      {wormholeCard && (
        <div
          onClick={() => setWormholeCard(null)}
          style={{
            position: 'absolute',
            right: 32,
            top: '50%',
            transform: 'translateY(-50%)',
            maxWidth: 260,
            background: 'rgba(0,0,0,0.88)',
            border: `1px solid ${wormholeCard.color}55`,
            padding: '18px 20px',
            cursor: 'pointer',
            animation: 'spiralCardIn 0.4s ease',
          }}
        >
          <div style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 8,
            color: wormholeCard.color,
            letterSpacing: '0.22em',
            marginBottom: 12,
            opacity: 0.9,
          }}>{wormholeCard.label}</div>
          <div style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 11,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.9,
            whiteSpace: 'pre-line',
          }}>{wormholeCard.text}</div>
          <div style={{
            marginTop: 14,
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 7,
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.15em',
          }}>[ click to close ]</div>
        </div>
      )}

      <HomeButton />
      <style>{`
        @keyframes spiralCardIn { from { opacity:0; transform:translateY(-50%) translateX(20px) } to { opacity:1; transform:translateY(-50%) translateX(0) } }
      `}</style>
    </div>
  )
}
