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
  fadeTimer: number
  floatPhase: number
}

const TEXTS = [
  'BORN: SOMEWHERE IN THE MIDWEST',
  'RELOCATED: BOULDER, CO · 2022',
  'OCCUPATION: BUILDER OF THINGS',
  '47 OBJECTS IN THE UNIVERSE · 14 WORLDS',
  'CURRENTLY RUNNING',
  'DIGGER · MUSIC DISCOVERY · DEPLOYED',
  'NEXT.JS + THREE.JS + ZUSTAND',
  'TRAILS: PIKES PEAK, ELBERT, MAROON BELLS',
  'THE SIGNAL IS CLEAR',
  'YOU FOUND IT ANYWAY',
  'LOOKING FOR: PROBLEMS WORTH SOLVING',
  'HOURS LOGGED: UNCOUNTABLE',
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

export default function World2Depth() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [items, setItems] = useState<DriftItem[]>([])
  const [bgOpacity, setBgOpacity] = useState(0)
  const frameRef = useRef(0)
  const itemsRef = useRef<DriftItem[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const idCounter = useRef(0)
  const doorClickCount = useRef<Record<string, number>>({})

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
    const speed = 0.2 + Math.random() * 0.4

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
      rotation: (Math.random() - 0.5) * 30,
      vr: (Math.random() - 0.5) * 0.02,
      content, opacity: 0, targetOpacity: 0.55 + Math.random() * 0.35,
      fadeTimer: 0,
      floatPhase: Math.random() * Math.PI * 2,
    }
  }, [])

  useEffect(() => {
    // Initial spawn
    const initial: DriftItem[] = []
    for (let i = 0; i < 12; i++) initial.push(spawnItem())
    itemsRef.current = initial
    setItems([...initial])

    // BG breathe
    const bgInterval = setInterval(() => setBgOpacity(o => o === 0 ? 0.2 : 0), 12000)

    // Spawn new items
    const spawnInterval = setInterval(() => {
      if (itemsRef.current.length < 18) {
        const newItem = spawnItem()
        itemsRef.current = [...itemsRef.current, newItem]
      }
    }, 3000)

    function animate() {
      itemsRef.current = itemsRef.current.map(item => {
        const nx = item.x + item.vx + Math.sin(item.floatPhase + Date.now() * 0.0003) * 0.15
        const ny = item.y + item.vy + Math.cos(item.floatPhase + Date.now() * 0.0002) * 0.12
        const nr = item.rotation + item.vr
        const newOpacity = item.opacity + (item.targetOpacity - item.opacity) * 0.02

        // Check if out of bounds
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
      clearInterval(bgInterval)
      clearInterval(spawnInterval)
    }
  }, [spawnItem])

  const handleDoorClick = useCallback((label: string, e: React.MouseEvent) => {
    const count = (doorClickCount.current[label] || 0) + 1
    doorClickCount.current[label] = count
    if (label === 'WHAT YOU WERE LOOKING FOR') {
      navigateTo(9, { type: 'expand-white', origin: { x: e.clientX, y: e.clientY } })
    } else if (label === 'ROOM 47') {
      // Goes to World 6 but only if visible for 12s — track via opacity
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
    const base: React.CSSProperties = {
      position: 'absolute',
      left: item.x,
      top: item.y,
      transform: `rotate(${item.rotation}deg)`,
      opacity: item.opacity,
      transition: 'opacity 0.5s',
      cursor: item.type === 'door' ? 'pointer' : 'default',
    }

    if (item.type === 'polaroid') {
      return (
        <div key={item.id} style={{ ...base, width: 160, height: 180, background: '#f8f4e8', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', padding: '10px 10px 40px' }}>
          <div style={{ width: '100%', height: 120, background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(100,100,120,0.3)' }} />
          </div>
          <div style={{ marginTop: 8, fontFamily: '"Special Elite", cursive', fontSize: 10, color: 'rgba(0,0,0,0.5)', textAlign: 'center', lineHeight: 1.4 }}>{item.content}</div>
        </div>
      )
    }

    if (item.type === 'cassette') {
      return (
        <div key={item.id} style={{ ...base, width: 120, height: 74, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', padding: 8 }}>
          <div style={{ fontSize: 9, fontFamily: '"Special Elite", cursive', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 6 }}>{item.content}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            </div>
            <div style={{ width: 60, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
              <div style={{ width: `${30 + Math.sin(item.id * 47) * 25}%`, height: '100%', background: 'rgba(255,255,255,0.15)' }} />
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            </div>
          </div>
        </div>
      )
    }

    if (item.type === 'door') {
      return (
        <div
          key={item.id}
          style={{ ...base, width: 60, height: 90, background: 'rgba(20,15,10,0.9)', border: '1px solid rgba(255,255,255,0.12)' }}
          onClick={e => handleDoorClick(item.content, e)}
        >
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
          <div style={{ position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)', width: 140, textAlign: 'center', fontFamily: '"Special Elite", cursive', fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{item.content}</div>
        </div>
      )
    }

    if (item.type === 'coord') {
      return (
        <div key={item.id} style={{ ...base, fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>
          {item.content}
        </div>
      )
    }

    if (item.type === 'text') {
      return (
        <div key={item.id} style={{ ...base, fontFamily: '"Special Elite", cursive', fontSize: 13, color: 'rgba(255,255,255,0.3)', maxWidth: 280, lineHeight: 1.5, letterSpacing: '0.04em' }}>
          {item.content}
        </div>
      )
    }
    return null
  }

  return (
    <div
      data-world="2"
      style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* Breathing background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(30,20,50,0.8) 0%, transparent 70%)',
        opacity: bgOpacity,
        transition: 'opacity 3s',
        pointerEvents: 'none',
      }} />

      {/* Items */}
      {items.map(renderItem)}

      {/* Mouse glow */}
      <div style={{
        position: 'absolute', left: mousePos.x, top: mousePos.y,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />

      {/* World label */}
      <div style={{
        position: 'absolute', bottom: 24, right: 32,
        fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.08)',
        letterSpacing: '0.15em',
      }}>
        DEPTH ·  — M
      </div>
      <HomeButton />
    </div>
  )
}
