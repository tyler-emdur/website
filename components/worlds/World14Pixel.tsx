'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

const TILE = 20
const GRAVITY = 0.55
const JUMP = -11
const MOVE = 4.2

const PALETTE = ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06FFA5', '#FF4365', '#00F5FF']

// #: block  C: coin  P: spawn  1-9: warp id  ^: mover  !: spring
const LEVEL = [
  '################################################################################################################################',
  '#..............C....C....C...................................C....C....C....C..........C....C....C..............................#',
  '#...####...#######...#######...#######...#######...#######...#######...#######...#######...#######...#######...#######......#',
  '#...#..#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#......#',
  '#...#..#####.....#...#..^..#...#..1..#...#..2..#...#..3..#...#..4..#...#..!..#...#..5..#...#..6..#...#..7..#...#..8..#......#',
  '#...#............#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#......#',
  '#...####...#######...#######...#######...#######...#######...#######...#######...#######...#######...#######...#######......#',
  '#.......C...............C...............C...............C...............C...............C...............C...............C....#',
  '#...####...#######...#######...#######...#######...#######...#######...#######...#######...#######...#######...#######......#',
  '#...#..#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#......#',
  '#...#..#...#..^..#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#..9..#......#',
  '#...#..#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#...#.....#......#',
  '#...#..#####.....#...#######...#######...#######...#######...#######...#######...#######...#######...#######...#######......#',
  '#...#............#...........................................................................................................#',
  '#...####...#######...#######...#######...#######...#######...#######...#######...#######...#######...#######...#######......#',
  '#.......C..........C..........C..........C..........C..........C..........C..........C..........C..........C..........C......#',
  '#...........................................................................................................................#',
  '#...........................................................................................................................#',
  '#...........................................................................................................................#',
  '#...........................................................................................................................#',
  '#...........................................................................................................................#',
  '#...........................................................................................................................#',
  '#...........................................................................................................................#',
  '#...........................................................................................................................#',
  '#...........................................................................................................................#',
  '#...........................................................................................................................#',
  '################################################################################################################################',
  '#P............................................................................................................................#',
  '################################################################################################################################',
]

const WARPS: Record<string, { world: WorldId; portal: PortalType; label: string }> = {
  '1': { world: 7, portal: 'chromatic', label: 'MALL' },
  '2': { world: 3, portal: 'chromatic', label: 'TV' },
  '3': { world: 13, portal: 'vortex', label: 'SPIRAL' },
  '4': { world: 11, portal: 'scatter', label: 'FLICKER' },
  '5': { world: 10, portal: 'vortex', label: 'LOOP' },
  '6': { world: 15, portal: 'chromatic', label: 'DIAL' },
  '7': { world: 4, portal: 'slide-right', label: 'HALL' },
  '8': { world: 16, portal: 'fold', label: 'INDEX' },
  '9': { world: 1, portal: 'fold', label: 'UNIVERSE' },
}

interface Mover { x: number; y: number; dir: number; minX: number; maxX: number }

interface Player {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  grounded: boolean
  onMover: Mover | null
}

function parseLevel() {
  const rows = LEVEL.length
  const cols = LEVEL[0].length
  const solids = new Set<string>()
  const coins = new Set<string>()
  const warps = new Map<string, string>()
  const springs = new Set<string>()
  const movers: Mover[] = []
  let spawn = { x: 2 * TILE, y: 2 * TILE }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = LEVEL[y][x]
      const key = `${x},${y}`
      if (ch === '#') solids.add(key)
      else if (ch === 'C') coins.add(key)
      else if (ch === 'P') spawn = { x: x * TILE, y: y * TILE - 8 }
      else if (ch === '!') springs.add(key)
      else if (ch === '^') {
        solids.add(key)
        movers.push({ x: x * TILE, y: y * TILE, dir: 1, minX: (x - 3) * TILE, maxX: (x + 3) * TILE })
      } else if (ch >= '1' && ch <= '9') warps.set(key, ch)
    }
  }
  return { rows, cols, solids, coins, warps, springs, movers, spawn }
}

const LEVEL_DATA = parseLevel()

export default function World14Pixel() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const findSecret = useWorldStore(s => s.findSecret)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const playerRef = useRef<Player>({ x: LEVEL_DATA.spawn.x, y: LEVEL_DATA.spawn.y, vx: 0, vy: 0, w: 14, h: 16, grounded: false, onMover: null })
  const coinsRef = useRef(new Set(LEVEL_DATA.coins))
  const moversRef = useRef(LEVEL_DATA.movers.map(m => ({ ...m })))
  const camRef = useRef(0)
  const rafRef = useRef(0)
  const warpLock = useRef(false)
  const [coinCount, setCoinCount] = useState(0)
  const [msg, setMsg] = useState('← → move · space jump · numbered doors warp · collect every coin')

  const totalCoins = LEVEL_DATA.coins.size

  const tryWarp = useCallback((id: string) => {
    if (warpLock.current) return
    const w = WARPS[id]
    if (!w) return
    warpLock.current = true
    setMsg(`WARP → ${w.label}`)
    findSecret(`pixel-warp-${id}`)
    setTimeout(() => navigateTo(w.world, { type: w.portal, color: '#FF006E' }), 400)
  }, [navigateTo, findSecret])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
    }
    const up = (e: KeyboardEvent) => { keysRef.current[e.code] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W
    canvas.height = H

    function tileAt(tx: number, ty: number, solids: Set<string>) {
      if (tx < 0 || ty < 0 || tx >= LEVEL_DATA.cols || ty >= LEVEL_DATA.rows) return true
      return solids.has(`${tx},${ty}`)
    }

    function collide(px: number, py: number, pw: number, ph: number, solids: Set<string>) {
      const left = Math.floor(px / TILE)
      const right = Math.floor((px + pw - 1) / TILE)
      const top = Math.floor(py / TILE)
      const bottom = Math.floor((py + ph - 1) / TILE)
      for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
          if (tileAt(tx, ty, solids)) return true
        }
      }
      return false
    }

    function loop() {
      const p = playerRef.current
      const keys = keysRef.current
      const movers = moversRef.current

      movers.forEach(m => {
        m.x += m.dir * 1.2
        if (m.x <= m.minX || m.x >= m.maxX) m.dir *= -1
      })

      const solids = new Set(LEVEL_DATA.solids)
      movers.forEach(m => {
        const tx = Math.floor(m.x / TILE)
        const ty = Math.floor(m.y / TILE)
        solids.add(`${tx},${ty}`)
      })

      if (keys.ArrowLeft || keys.KeyA) p.vx = -MOVE
      else if (keys.ArrowRight || keys.KeyD) p.vx = MOVE
      else p.vx *= 0.72

      if ((keys.Space || keys.ArrowUp || keys.KeyW) && p.grounded) {
        p.vy = JUMP
        p.grounded = false
      }

      p.vy += GRAVITY
      if (p.vy > 14) p.vy = 14

      let nx = p.x + p.vx
      if (!collide(nx, p.y, p.w, p.h, solids)) p.x = nx
      else p.vx = 0

      let ny = p.y + p.vy
      p.grounded = false
      p.onMover = null
      if (!collide(p.x, ny, p.w, p.h, solids)) {
        p.y = ny
      } else {
        if (p.vy > 0) {
          p.y = Math.floor((p.y + p.h) / TILE) * TILE - p.h
          p.grounded = true
          p.vy = 0
          movers.forEach(m => {
            const tx = Math.floor(m.x / TILE)
            const ty = Math.floor(m.y / TILE)
            const px = Math.floor((p.x + p.w / 2) / TILE)
            const py = Math.floor((p.y + p.h) / TILE)
            if (px === tx && py === ty) {
              p.onMover = m
              p.x += m.dir * 1.2
            }
          })
        } else {
          p.y = (Math.floor(p.y / TILE) + 1) * TILE
          p.vy = 0
        }
      }

      const ptx = Math.floor((p.x + p.w / 2) / TILE)
      const pty = Math.floor((p.y + p.h / 2) / TILE)
      const pkey = `${ptx},${pty}`

      if (LEVEL_DATA.springs.has(pkey) && p.grounded) {
        p.vy = JUMP * 1.45
        p.grounded = false
      }

      if (coinsRef.current.has(pkey)) {
        coinsRef.current.delete(pkey)
        const c = totalCoins - coinsRef.current.size
        setCoinCount(c)
        if (c === totalCoins) {
          findSecret('pixel-coins-max')
          setMsg(`ALL ${totalCoins} COINS. vault unlocked in the index.`)
        }
      }

      const warpId = LEVEL_DATA.warps.get(pkey)
      if (warpId) tryWarp(warpId)

      const targetCam = p.x - W * 0.35
      camRef.current += (targetCam - camRef.current) * 0.1
      const camX = Math.max(0, Math.min(camRef.current, LEVEL_DATA.cols * TILE - W))

      // sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#1a0a2e')
      grad.addColorStop(0.5, '#3d0a6b')
      grad.addColorStop(1, '#ff006e')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // stars
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 137 + camX * 0.2) % (W + 100)) - 50
        const sy = (i * 89) % (H * 0.6)
        ctx.fillStyle = `rgba(255,255,255,${0.2 + (i % 5) * 0.1})`
        ctx.fillRect(sx, sy, 2, 2)
      }

      ctx.save()
      ctx.translate(-camX, 0)

      for (let y = 0; y < LEVEL_DATA.rows; y++) {
        for (let x = 0; x < LEVEL_DATA.cols; x++) {
          const key = `${x},${y}`
          const ch = LEVEL[y]?.[x]
          const px = x * TILE
          const py = y * TILE

          if (ch === '#') {
            const col = PALETTE[(x + y) % PALETTE.length]
            ctx.fillStyle = col
            ctx.fillRect(px, py, TILE, TILE)
            ctx.fillStyle = 'rgba(255,255,255,0.25)'
            ctx.fillRect(px, py, TILE, 3)
            ctx.fillStyle = 'rgba(0,0,0,0.2)'
            ctx.fillRect(px, py + TILE - 3, TILE, 3)
          }
          if (ch === '^') {
            const mx = movers.find(m => Math.floor(m.x / TILE) === x && Math.floor(m.y / TILE) === y)
            const ox = mx ? mx.x : px
            ctx.fillStyle = '#00F5FF'
            ctx.fillRect(ox, py + 8, TILE, 8)
          }
          if (ch === '!') {
            ctx.fillStyle = '#FFBE0B'
            ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8)
            ctx.fillStyle = '#FF006E'
            ctx.font = '10px "Press Start 2P", monospace'
            ctx.fillText('!', px + 6, py + 14)
          }
          if (ch >= '1' && ch <= '9') {
            const hue = parseInt(ch) * 40
            ctx.fillStyle = `hsl(${hue}, 90%, 55%)`
            ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4)
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4)
            ctx.fillStyle = '#fff'
            ctx.font = '8px "Press Start 2P", monospace'
            ctx.fillText(ch, px + 6, py + 14)
          }
          if (coinsRef.current.has(key)) {
            ctx.fillStyle = '#FFBE0B'
            ctx.beginPath()
            ctx.arc(px + TILE / 2, py + TILE / 2, 5, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = '#FB5607'
            ctx.fillRect(px + TILE / 2 - 2, py + TILE / 2 - 1, 4, 2)
          }
        }
      }

      // player
      ctx.fillStyle = '#06FFA5'
      ctx.fillRect(p.x, p.y, p.w, p.h)
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(p.x + 3, p.y + 4, 3, 3)
      ctx.fillRect(p.x + 8, p.y + 4, 3, 3)
      ctx.fillStyle = '#FF006E'
      ctx.fillRect(p.x + 4, p.y + 11, 6, 2)

      ctx.restore()

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tryWarp, findSecret, totalCoins])

  return (
    <div data-world="14" style={{ position: 'fixed', inset: 0, background: '#1a0a2e', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', imageRendering: 'pixelated' }} />
      <div style={{
        position: 'fixed',
        top: 16,
        left: 16,
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 8,
        color: '#FFBE0B',
        lineHeight: 2.2,
        textShadow: '2px 2px 0 #FF006E',
        pointerEvents: 'none',
        maxWidth: 320,
      }}>
        <div>★ PIXEL QUEST ★</div>
        <div style={{ color: '#06FFA5', fontSize: 7 }}>COINS {coinCount}/{totalCoins}</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 6, marginTop: 8, lineHeight: 1.8 }}>{msg}</div>
      </div>
      <HomeButton />
    </div>
  )
}
