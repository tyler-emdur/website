'use client'
import { useEffect, useRef, useState } from 'react'
import { useWorldStore, type PortalConfig } from '@/lib/world-store'

function ExpandWhitePortal({ config, onDone }: { config: PortalConfig; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const x = config.origin?.x ?? window.innerWidth / 2
    const y = config.origin?.y ?? window.innerHeight / 2
    const maxR = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 50
    const el = ref.current; if (!el) return
    el.style.left = x + 'px'; el.style.top = y + 'px'
    el.style.width = '0px'; el.style.height = '0px'
    el.style.marginLeft = '0'; el.style.marginTop = '0'
    requestAnimationFrame(() => {
      el.style.transition = 'all 0.7s cubic-bezier(0.4,0,0.2,1)'
      el.style.width = maxR * 2 + 'px'; el.style.height = maxR * 2 + 'px'
      el.style.marginLeft = -maxR + 'px'; el.style.marginTop = -maxR + 'px'
    })
    const t = setTimeout(onDone, 700)
    return () => clearTimeout(t)
  }, [])
  return <div ref={ref} style={{ position: 'fixed', borderRadius: '50%', background: '#fff', zIndex: 9999, pointerEvents: 'none' }} />
}

function FoldPortal({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 50)
    const t2 = setTimeout(onDone, 900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
      background: '#0a0a0a',
      transformOrigin: 'center center',
      transform: phase === 0 ? 'perspective(1200px) rotateX(0deg)' : 'perspective(1200px) rotateX(90deg)',
      transition: 'transform 0.8s cubic-bezier(0.4,0,0.6,1)',
    }} />
  )
}

function RotatePortal({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 50)
    const t2 = setTimeout(onDone, 1100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
      background: '#000',
      opacity: phase === 0 ? 0 : 1,
      transition: 'opacity 0.3s',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        transformOrigin: 'center center',
        transform: phase === 0 ? 'rotate(0deg)' : 'rotate(90deg)',
        transition: 'transform 1s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 1, height: '100vh', background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  )
}

function ScatterPortal({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const els = document.querySelectorAll('body > *:not([data-portal])')
    els.forEach(el => {
      const e = el as HTMLElement
      const dx = (Math.random() - 0.5) * window.innerWidth * 1.5
      const dy = (Math.random() - 0.5) * window.innerHeight * 1.5
      const rot = (Math.random() - 0.5) * 180
      e.style.transition = 'transform 0.5s cubic-bezier(0.4,0,1,1), opacity 0.5s'
      e.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`
      e.style.opacity = '0'
    })
    const t = setTimeout(onDone, 700)
    return () => {
      clearTimeout(t)
      els.forEach(el => {
        const e = el as HTMLElement
        e.style.transition = ''; e.style.transform = ''; e.style.opacity = ''
      })
    }
  }, [])
  return <div data-portal style={{ position: 'fixed', inset: 0, zIndex: 9998, background: '#000', pointerEvents: 'none', opacity: 0, transition: 'opacity 0.3s', animation: 'fadeInBlack 0.5s 0.5s both' }} />
}

function LetterExpandPortal({ config, onDone }: { config: PortalConfig; onDone: () => void }) {
  const [size, setSize] = useState(14)
  const letter = config.letter ?? 'T'
  useEffect(() => {
    const t1 = setTimeout(() => setSize(Math.max(window.innerWidth, window.innerHeight) * 2), 50)
    const t2 = setTimeout(onDone, 1000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ fontSize: size, lineHeight: 1, color: '#fff', transition: 'font-size 0.9s cubic-bezier(0.4,0,0.2,1)', fontFamily: 'serif', opacity: 0.9 }}>{letter}</div>
    </div>
  )
}

function CursorFloodPortal({ config, onDone }: { config: PortalConfig; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const W = window.innerWidth, H = window.innerHeight
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!
    const color = config.color ?? '#22C55E'
    let frame = 0
    let raf = 0
    const particles: { x: number; y: number; r: number; gr: number }[] = []
    for (let i = 0; i < 80; i++) {
      particles.push({ x: Math.random() * W, y: Math.random() * H, r: 0, gr: 3 + Math.random() * 8 })
    }
    function draw() {
      ctx.fillStyle = `rgba(0,0,0,0.05)`; ctx.fillRect(0, 0, W, H)
      particles.forEach(p => {
        p.r += p.gr
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = color + Math.floor(Math.max(0, 180 - p.r * 0.5)).toString(16).padStart(2, '0')
        ctx.fill()
      })
      frame++
      if (frame < 45) raf = requestAnimationFrame(draw)
      else onDone()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} />
}

function SlideRightPortal({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 50)
    const t2 = setTimeout(onDone, 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
      background: '#f5f0e8',
      transform: phase === 0 ? 'translateX(100%)' : 'translateX(0%)',
      transition: 'transform 4s cubic-bezier(0.25,0.46,0.45,0.94)',
      boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
    }} />
  )
}

function NothingPortal({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 100)
    return () => clearTimeout(t)
  }, [])
  return null
}

export default function PortalTransition({ config }: { config: PortalConfig }) {
  const completePortal = useWorldStore(s => s.completePortal)

  const props = { config, onDone: completePortal }

  switch (config.type) {
    case 'expand-white': return <ExpandWhitePortal {...props} />
    case 'fold':         return <FoldPortal onDone={completePortal} />
    case 'rotate':       return <RotatePortal onDone={completePortal} />
    case 'scatter':      return <ScatterPortal onDone={completePortal} />
    case 'letter-expand': return <LetterExpandPortal {...props} />
    case 'cursor-flood': return <CursorFloodPortal {...props} />
    case 'slide-right':  return <SlideRightPortal onDone={completePortal} />
    case 'newspaper':    return <FoldPortal onDone={completePortal} />
    case 'nothing':      return <NothingPortal onDone={completePortal} />
    default:             return <FoldPortal onDone={completePortal} />
  }
}
