'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

interface DriftItem {
  id: number
  type: 'polaroid' | 'cassette' | 'door' | 'coord' | 'text'
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  vr: number
  content: string
  opacity: number
  targetOpacity: number
  floatPhase: number
  depth: number
}

const TEXTS = [
  'BORN: SOMEWHERE IN THE MIDWEST',
  'RELOCATED: BOULDER, CO · 2022',
  'OCCUPATION: BUILDER OF THINGS',
  '47 OBJECTS IN THE UNIVERSE',
  'CURRENTLY RUNNING',
  'DIGGER · MUSIC DISCOVERY · DEPLOYED',
  'NEXT.JS + THREE.JS + ZUSTAND',
  'TRAILS: PIKES PEAK, ELBERT, MAROON BELLS',
  'THE SIGNAL IS CLEAR',
  'YOU FOUND IT ANYWAY',
  'LOOKING FOR: PROBLEMS WORTH SOLVING',
  'FREQUENCY: 88.7',
]

const COORDS = [
  '38.8405°N 105.0442°W · PIKES PEAK',
  '39.1178°N 106.4453°W · MT. ELBERT',
  '40.3428°N 105.6836°W · RMNP',
  '39.0708°N 106.9890°W · MAROON BELLS',
  '40.0150°N 105.2705°W · BOULDER',
]

const CASSETTES = ['SIGNAL MIX 001', 'DIGGER SESSIONS', 'TRAIL MILES', 'LATE NIGHTS', 'BUILDING THINGS']
const DOOR_LABELS = ['BEFORE THE DECISION', 'WHAT YOU WERE LOOKING FOR', 'ROOM 47', 'THE LOOP', 'TERMINAL', '★ PIXEL ★', 'THE DIAL']

function BubbleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width = W
    canvas.height = H

    const bubbles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: H + Math.random() * H,
      r: 1 + Math.random() * 3,
      vy: -(0.3 + Math.random() * 0.6),
      vx: (Math.random() - 0.5) * 0.2,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.05 + Math.random() * 0.15,
    }))

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener('resize', resize)

    let raf = 0
    let t = 0
    function draw() {
      t++
      ctx.clearRect(0, 0, W, H)
      bubbles.forEach(b => {
        b.x += b.vx + Math.sin(t * 0.02 + b.phase) * 0.3
        b.y += b.vy
        if (b.y < -20) {
          b.y = H + 20
          b.x = Math.random() * W
        }
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0,220,200,${b.opacity})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}

export default function World2Depth() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [items, setItems] = useState<DriftItem[]>([])
  const frameRef = useRef(0)
  const itemsRef = useRef<DriftItem[]>([])
  const idCounter = useRef(0)
  const doorClickCount = useRef<Record<string, number>>({})
  const [depth, setDepth] = useState(0)

  const spawnItem = useCallback((): DriftItem => {
    const types: DriftItem['type'][] = ['polaroid', 'cassette', 'door', 'coord', 'text']
    const weights = [3, 2, 1, 2, 4]
    let total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let type: DriftItem['type'] = 'text'
    for (let i = 0; i < types.length; i++) { r -= weights[i]; if (r <= 0) { type = types[i]; break } }

    const side = Math.floor(Math.random() * 4)
    let x = 0, y = 0
    if (side === 0) { x = Math.random() * window.innerWidth; y = -120 }
    else if (side === 1) { x = window.innerWidth + 120; y = Math.random() * window.innerHeight }
    else if (side === 2) { x = Math.random() * window.innerWidth; y = window.innerHeight + 120 }
    else { x = -120; y = Math.random() * window.innerHeight }

    const cx = window.innerWidth / 2, cy = window.innerHeight / 2
    const angle = Math.atan2(cy - y, cx - x) + (Math.random() - 0.5) * 1.5
    const speed = 0.15 + Math.random() * 0.25

    let content = ''
    if (type === 'text') content = TEXTS[Math.floor(Math.random() * TEXTS.length)]
    if (type === 'coord') content = COORDS[Math.floor(Math.random() * COORDS.length)]
    if (type === 'cassette') content = CASSETTES[Math.floor(Math.random() * CASSETTES.length)]
    if (type === 'door') content = DOOR_LABELS[Math.floor(Math.random() * DOOR_LABELS.length)]
    if (type === 'polaroid') content = ['PIKES PEAK · AUG 2024', 'BOULDER MARATHON · OCT 2024', 'MAROON BELLS · SEP 2023', 'MT. ELBERT · 4:00AM', 'THE DEPLOY'][Math.floor(Math.random() * 5)]

    return {
      id: idCounter.current++,
      type, x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: (Math.random() - 0.5) * 20,
      vr: (Math.random() - 0.5) * 0.015,
      content, opacity: 0, targetOpacity: 0.45 + Math.random() * 0.35,
      floatPhase: Math.random() * Math.PI * 2,
      depth: Math.random(),
    }
  }, [])

  useEffect(() => {
    const initial: DriftItem[] = []
    for (let i = 0; i < 14; i++) initial.push(spawnItem())
    itemsRef.current = initial
    setItems([...initial])

    const spawnInterval = setInterval(() => {
      if (itemsRef.current.length < 20) {
        const newItem = spawnItem()
        itemsRef.current = [...itemsRef.current, newItem]
      }
    }, 3500)

    // Slowly increase depth counter
    const depthInterval = setInterval(() => {
      setDepth(d => d + Math.random() * 0.3)
    }, 200)

    function animate() {
      itemsRef.current = itemsRef.current.map(item => {
        const t = Date.now() * 0.001
        const nx = item.x + item.vx + Math.sin(item.floatPhase + t * 0.4) * 0.2
        const ny = item.y + item.vy + Math.cos(item.floatPhase + t * 0.3) * 0.15
        const nr = item.rotation + item.vr
        const newOpacity = item.opacity + (item.targetOpacity - item.opacity) * 0.018

        const margin = 200
        if (nx < -margin || nx > window.innerWidth + margin || ny < -margin || ny > window.innerHeight + margin) {
          return spawnItem()
        }
        return { ...item, x: nx, y: ny, rotation: nr, opacity: newOpacity }
      })
      setItems([...itemsRef.current])
      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameRef.current)
      clearInterval(spawnInterval)
      clearInterval(depthInterval)
    }
  }, [spawnItem])

  const handleDoorClick = useCallback((label: string, e: React.MouseEvent) => {
    const count = (doorClickCount.current[label] || 0) + 1
    doorClickCount.current[label] = count
    if (label === 'WHAT YOU WERE LOOKING FOR') {
      navigateTo(9, { type: 'expand-white', origin: { x: e.clientX, y: e.clientY } })
    } else if (label === 'ROOM 47') {
      navigateTo(6, { type: 'cursor-flood', color: '#f5f0e8' })
    } else if (label === 'BEFORE THE DECISION') {
      navigateTo(1, { type: 'fold' })
    } else if (label === 'THE LOOP') {
      navigateTo(10, { type: 'vortex', origin: { x: e.clientX, y: e.clientY } })
    } else if (label === 'TERMINAL') {
      navigateTo(12, { type: 'nothing' })
    } else if (label === '★ PIXEL ★') {
      navigateTo(14, { type: 'chromatic', origin: { x: e.clientX, y: e.clientY } })
    } else if (label === 'THE DIAL') {
      navigateTo(15, { type: 'chromatic' })
    }
  }, [navigateTo])

  const renderItem = (item: DriftItem) => {
    const depthAlpha = 0.5 + item.depth * 0.5
    const base: React.CSSProperties = {
      position: 'absolute',
      left: item.x,
      top: item.y,
      transform: `rotate(${item.rotation}deg)`,
      opacity: item.opacity * depthAlpha,
      transition: 'opacity 0.5s',
      cursor: item.type === 'door' ? 'pointer' : 'default',
    }

    if (item.type === 'polaroid') {
      return (
        <div key={item.id} style={{
          ...base, width: 150, height: 170,
          background: '#e8f4f0',
          boxShadow: '0 4px 30px rgba(0,120,160,0.4), 0 0 60px rgba(0,180,200,0.1)',
          padding: '8px 8px 36px',
          filter: `blur(${item.depth > 0.7 ? '1px' : '0'})`,
        }}>
          <div style={{ width: '100%', height: 110, background: 'rgba(0,80,120,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,200,200,0.2)', border: '1px solid rgba(0,200,200,0.3)' }} />
          </div>
          <div style={{ marginTop: 6, fontFamily: 'Georgia, serif', fontSize: 9, color: 'rgba(0,80,120,0.7)', textAlign: 'center', lineHeight: 1.4 }}>{item.content}</div>
        </div>
      )
    }

    if (item.type === 'cassette') {
      return (
        <div key={item.id} style={{
          ...base, width: 120, height: 74,
          background: 'rgba(0,20,40,0.85)',
          border: '1px solid rgba(0,200,200,0.15)',
          boxShadow: '0 0 20px rgba(0,200,200,0.08)',
          padding: 8,
        }}>
          <div style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(0,220,200,0.5)', letterSpacing: '0.1em', marginBottom: 6 }}>{item.content}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(0,200,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,200,200,0.3)' }} />
            </div>
            <div style={{ width: 50, height: 6, background: 'rgba(0,200,200,0.08)', borderRadius: 1 }}>
              <div style={{ width: `${30 + Math.sin(item.id * 47) * 25}%`, height: '100%', background: 'rgba(0,200,200,0.2)' }} />
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(0,200,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,200,200,0.3)' }} />
            </div>
          </div>
        </div>
      )
    }

    if (item.type === 'door') {
      return (
        <div
          key={item.id}
          style={{
            ...base, width: 56, height: 84,
            background: 'rgba(0,10,30,0.9)',
            border: '1px solid rgba(0,200,200,0.2)',
            boxShadow: '0 0 30px rgba(0,150,200,0.15)',
          }}
          onClick={e => handleDoorClick(item.content, e)}
        >
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,220,200,0.4)' }} />
          <div style={{
            position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)',
            width: 160, textAlign: 'center',
            fontFamily: 'monospace', fontSize: 7,
            color: 'rgba(0,220,200,0.3)', letterSpacing: '0.08em', whiteSpace: 'nowrap',
          }}>
            {item.content}
          </div>
        </div>
      )
    }

    if (item.type === 'coord') {
      return (
        <div key={item.id} style={{
          ...base, fontFamily: 'monospace', fontSize: 9,
          color: 'rgba(0,220,200,0.35)', letterSpacing: '0.15em', whiteSpace: 'nowrap',
          textShadow: '0 0 10px rgba(0,200,200,0.3)',
        }}>
          {item.content}
        </div>
      )
    }

    if (item.type === 'text') {
      return (
        <div key={item.id} style={{
          ...base, fontFamily: 'Georgia, serif', fontSize: 12,
          color: `rgba(180,240,255,${0.2 + item.depth * 0.15})`,
          maxWidth: 260, lineHeight: 1.6, letterSpacing: '0.04em',
        }}>
          {item.content}
        </div>
      )
    }
    return null
  }

  return (
    <div
      data-world="2"
      style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(180deg, #001520 0%, #000d1a 40%, #000810 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Caustic light — ocean surface light from above */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
        background: 'radial-gradient(ellipse 120% 60% at 50% 0%, rgba(0,120,180,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Caustic ripple lines */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '40%', opacity: 0.06, pointerEvents: 'none' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse key={i}
            cx={`${8 + i * 8}%`} cy="0" rx={`${2 + Math.sin(i * 1.3) * 2}%`} ry="200"
            fill="none" stroke="rgba(0,220,255,1)" strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Depth fog layers */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
        background: 'linear-gradient(0deg, rgba(0,4,12,0.9) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <BubbleCanvas />

      {/* Items */}
      {items.map(renderItem)}

      {/* Depth readout */}
      <div style={{
        position: 'absolute', bottom: 24, left: 32,
        fontFamily: 'monospace', fontSize: 9,
        color: 'rgba(0,220,200,0.3)', letterSpacing: '0.2em',
        lineHeight: 1.8,
      }}>
        <div>DEPTH: {depth.toFixed(1)}m</div>
        <div style={{ opacity: 0.6 }}>40.0150°N 105.2705°W</div>
      </div>

      <div style={{
        position: 'absolute', bottom: 24, right: 32,
        fontFamily: 'monospace', fontSize: 9,
        color: 'rgba(0,220,200,0.15)', letterSpacing: '0.15em',
      }}>
        DEPTH · SECTOR 02
      </div>

      <HomeButton />
    </div>
  )
}
