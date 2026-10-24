'use client'
import { useEffect, useRef, useState } from 'react'
import { useWorldStore, type PortalConfig } from '@/lib/world-store'
import { DUR, EASE, transition, useReducedMotion } from '@/lib/motion'
import { readEnvironment } from '@/lib/environment'

/**
 * Twelve doors. Each hub gate names the one you go through, so every type in
 * here is on a path somebody actually takes.
 *
 * Two rules hold across all of them. Only `transform` and `opacity` animate —
 * anything else asks the browser to re-run layout sixty times a second, which
 * is what the old white flood did by growing its own `width`. And completion is
 * reported by the animation that finished, not by a second stopwatch that was
 * hand-matched to it and drifted.
 */

/**
 * Waits for the transition to actually end.
 *
 * The timer is a fallback, not the plan: `transitionend` never fires if the
 * element is removed mid-flight or the property was already at its target, so
 * something has to guarantee the portal closes. Previously the timer *was* the
 * plan, and `expand-white` set it to exactly its own 700ms while starting the
 * transition a frame late — so it could call itself finished before the screen
 * had caught up.
 */
function useTransitionDone(
  ref: React.RefObject<HTMLElement | null>,
  ms: number,
  onDone: () => void,
) {
  useEffect(() => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onDone()
    }
    const el = ref.current
    el?.addEventListener('transitionend', finish)
    const t = setTimeout(finish, ms + 120)
    return () => {
      el?.removeEventListener('transitionend', finish)
      clearTimeout(t)
    }
  }, [ms, onDone, ref])
}

/**
 * Drives a canvas portal on elapsed time instead of a frame count.
 *
 * The old versions stopped after a fixed number of frames, which meant they ran
 * for 750ms on a 60Hz panel and 375ms on a 120Hz one — the same crossing taking
 * half as long on a newer phone.
 */
function useTimedFrames(ms: number, draw: (progress: number, dt: number) => void, onDone: () => void) {
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    let last = start
    const tick = (now: number) => {
      const dt = Math.min(now - last, 50)
      last = now
      const progress = Math.min(1, (now - start) / ms)
      draw(progress, dt)
      if (progress < 1) raf = requestAnimationFrame(tick)
      else onDone()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}

/**
 * A flood of daylight out of the point you clicked.
 *
 * It scales a fixed-size circle rather than growing one, and it carries the real
 * sky over Boulder — warm while the sun is up over the city, cold once it is
 * down. The same white either way until you have crossed it at both ends of a
 * day.
 */
function ExpandWhitePortal({ config, onDone }: { config: PortalConfig; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const [geometry] = useState(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0, d: 0 }
    const x = config.origin?.x ?? window.innerWidth / 2
    const y = config.origin?.y ?? window.innerHeight / 2
    const maxR = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 50
    return { x, y, d: maxR * 2 }
  })

  const [flood] = useState(() => {
    const { daylight } = readEnvironment(new Date(), null)
    const mix = (night: number, day: number) => Math.round(night + (day - night) * daylight)
    return `rgb(${mix(228, 255)}, ${mix(235, 250)}, ${mix(247, 238)})`
  })

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useTransitionDone(ref, DUR.travel, onDone)

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: geometry.x,
        top: geometry.y,
        width: geometry.d,
        height: geometry.d,
        marginLeft: -geometry.d / 2,
        marginTop: -geometry.d / 2,
        borderRadius: '50%',
        background: flood,
        zIndex: 9999,
        pointerEvents: 'none',
        transform: open ? 'scale(1)' : 'scale(0)',
        transition: transition('transform', DUR.travel, EASE.enter),
      }}
    />
  )
}

/** The page folds away from you on a horizontal crease. */
function FoldPortal({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [folded, setFolded] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setFolded(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useTransitionDone(ref, DUR.travel, onDone)

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
        background: '#0a0a0a',
        transformOrigin: 'center center',
        transform: `perspective(1200px) rotateX(${folded ? 90 : 0}deg)`,
        transition: transition('transform', DUR.travel, EASE.exit),
      }}
    />
  )
}

/** The whole frame turns a quarter turn around its centre. */
function RotatePortal({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [turned, setTurned] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setTurned(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useTransitionDone(ref, DUR.travel, onDone)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
      background: '#000',
      opacity: turned ? 1 : 0,
      transition: transition('opacity', DUR.state, EASE.enter),
    }}>
      <div
        ref={ref}
        style={{
          position: 'absolute', inset: 0,
          transformOrigin: 'center center',
          transform: `rotate(${turned ? 90 : 0}deg)`,
          transition: transition('transform', DUR.travel, EASE.hinge),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ width: 1, height: '100vh', background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  )
}

/**
 * Everything on the page is thrown off it.
 *
 * This is the one portal that reaches outside React and writes to the live DOM,
 * so it now records each element's own inline `transition`, `transform` and
 * `opacity` first and puts those exact strings back. It used to restore them to
 * the empty string, which silently discarded any inline style a world had set
 * on itself.
 */
function ScatterPortal({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('body > *:not([data-portal])')) as HTMLElement[]
    const prior = els.map(e => ({
      el: e,
      transition: e.style.transition,
      transform: e.style.transform,
      opacity: e.style.opacity,
    }))

    els.forEach(e => {
      const dx = (Math.random() - 0.5) * window.innerWidth * 1.5
      const dy = (Math.random() - 0.5) * window.innerHeight * 1.5
      const rot = (Math.random() - 0.5) * 180
      e.style.transition = `${transition('transform', DUR.cross, EASE.exit)}, ${transition('opacity', DUR.cross, EASE.exit)}`
      e.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`
      e.style.opacity = '0'
    })

    const t = setTimeout(onDone, DUR.travel)
    return () => {
      clearTimeout(t)
      prior.forEach(p => {
        p.el.style.transition = p.transition
        p.el.style.transform = p.transform
        p.el.style.opacity = p.opacity
      })
    }
  }, [])

  return (
    <>
      <div data-portal style={{
        position: 'fixed', inset: 0, zIndex: 9998, background: '#000', pointerEvents: 'none',
        animation: `portalFadeToBlack ${DUR.cross}ms ${DUR.cross}ms ${EASE.enter} both`,
      }} />
      <style>{`@keyframes portalFadeToBlack { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </>
  )
}

/**
 * A single letter swallows the screen.
 *
 * Scaled, not resized. Animating `font-size` re-rasterised the glyph and re-ran
 * text layout on every frame, all the way from 14px to twice the viewport.
 */
function LetterExpandPortal({ config, onDone }: { config: PortalConfig; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const letter = config.letter ?? 'T'

  const BASE = 64
  const [target] = useState(() =>
    typeof window === 'undefined' ? 20 : (Math.max(window.innerWidth, window.innerHeight) * 2) / BASE
  )

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useTransitionDone(ref, DUR.travel, onDone)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', overflow: 'hidden',
    }}>
      <div
        ref={ref}
        style={{
          fontSize: BASE, lineHeight: 1, color: '#fff', fontFamily: 'serif', opacity: 0.9,
          transform: `scale(${open ? target : 14 / BASE})`,
          transition: transition('transform', DUR.travel, EASE.enter),
        }}
      >
        {letter}
      </div>
    </div>
  )
}

/** The cursor's colour floods the screen from eighty points at once. */
function CursorFloodPortal({ config, onDone }: { config: PortalConfig; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{ ctx: CanvasRenderingContext2D; W: number; H: number; particles: { x: number; y: number; r: number; gr: number }[] } | null>(null)
  const color = config.color ?? '#22C55E'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = window.innerWidth, H = window.innerHeight
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: 0, gr: 3 + Math.random() * 8,
    }))
    stateRef.current = { ctx, W, H, particles }
  }, [])

  useTimedFrames(DUR.travel, (_progress, dt) => {
    const s = stateRef.current
    if (!s) return
    const { ctx, W, H, particles } = s
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    ctx.fillRect(0, 0, W, H)
    particles.forEach(p => {
      // Growth is per-millisecond now, normalised against a 60Hz frame, so the
      // flood covers the same ground on a 120Hz display.
      p.r += p.gr * (dt / 16.67)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = color + Math.floor(Math.max(0, 180 - p.r * 0.5)).toString(16).padStart(2, '0')
      ctx.fill()
    })
  }, onDone)

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} />
}

/** A panel slides in from the right, over the top of everything. */
function SlideRightPortal({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [arrived, setArrived] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setArrived(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useTransitionDone(ref, DUR.ceremony, onDone)

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
        background: '#f5f0e8',
        transform: `translateX(${arrived ? 0 : 100}%)`,
        transition: transition('transform', DUR.ceremony, EASE.enter),
        boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
      }}
    />
  )
}

/** Rings wind outward from where you clicked. */
function VortexPortal({ config, onDone }: { config: PortalConfig; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{ ctx: CanvasRenderingContext2D; W: number; H: number; cx: number; cy: number } | null>(null)
  const color = config.color ?? '#6366f1'
  const spinRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = window.innerWidth, H = window.innerHeight
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    stateRef.current = {
      ctx, W, H,
      cx: config.origin?.x ?? W / 2,
      cy: config.origin?.y ?? H / 2,
    }
  }, [])

  useTimedFrames(DUR.travel, (progress, dt) => {
    const s = stateRef.current
    if (!s) return
    const { ctx, W, H, cx, cy } = s
    spinRef.current += dt / 16.67
    const spin = spinRef.current
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    ctx.fillRect(0, 0, W, H)
    for (let i = 0; i < 12; i++) {
      const r = progress * Math.max(W, H) * 1.4 + i * 28
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(spin * 0.08 + i * 0.5)
      ctx.strokeStyle = color + Math.floor(Math.max(0, 200 - r * 0.15)).toString(16).padStart(2, '0')
      ctx.lineWidth = 2 + i * 0.3
      ctx.beginPath()
      for (let a = 0; a <= Math.PI * 2; a += 0.15) {
        const wobble = Math.sin(a * 5 + spin * 0.1) * (8 + i * 2)
        const px = Math.cos(a) * (r + wobble)
        const py = Math.sin(a) * (r + wobble)
        if (a === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }
  }, onDone)

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', background: '#000' }}
    />
  )
}

/** You just arrive. The gate to the answering machine uses this. */
function NothingPortal({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, DUR.tap)
    return () => clearTimeout(t)
  }, [])
  return null
}

/** A door on a hinge, swinging away from its left edge. */
function DoorPortal({ config, onDone }: { config: PortalConfig; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const bg = config.color ?? '#f4f1ec'

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useTransitionDone(ref, DUR.travel, onDone)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      perspective: '1400px',
      perspectiveOrigin: '0% 50%',
      pointerEvents: 'none',
    }}>
      <div
        ref={ref}
        style={{
          position: 'absolute', inset: 0,
          background: bg,
          transformOrigin: '0% 50%',
          transform: `rotateY(${open ? -90 : 0}deg)`,
          // A hinge is the one place a symmetric curve is the honest one: the
          // door is heavy at both ends of its swing.
          transition: transition('transform', DUR.travel, EASE.hinge),
          boxShadow: open ? 'none' : '4px 0 40px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  )
}

/** The channels separate, then recombine. */
function ChromaticPortal({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), DUR.tap / 2)
    const t2 = setTimeout(() => setPhase(2), DUR.move)
    const t3 = setTimeout(onDone, DUR.travel)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  const offset = phase === 0 ? 0 : phase === 1 ? 18 : 40
  const split = `${transition('transform', DUR.move, EASE.exit)}, ${transition('opacity', DUR.state, EASE.enter)}`

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#ff0066', mixBlendMode: 'screen', transform: `translateX(${-offset}px)`, opacity: phase > 0 ? 0.85 : 0, transition: split }} />
      <div style={{ position: 'absolute', inset: 0, background: '#00ff88', mixBlendMode: 'screen', transform: `translateX(${offset}px)`, opacity: phase > 0 ? 0.85 : 0, transition: split }} />
      <div style={{ position: 'absolute', inset: 0, background: '#4488ff', mixBlendMode: 'screen', opacity: phase > 1 ? 1 : 0, transition: transition('opacity', DUR.state, EASE.enter) }} />
    </div>
  )
}

/**
 * What a crossing becomes when the visitor asked for less movement.
 *
 * A cut, not a faster swing — a 90ms rotation through ninety degrees is still a
 * rotation through ninety degrees. This is also the only reason the setting now
 * reaches the portals at all: they animate through inline styles, which outrank
 * the `prefers-reduced-motion` block in globals.css.
 */
function CutPortal({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, DUR.state)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
      background: '#0a0a0a',
    }} />
  )
}

export default function PortalTransition({ config }: { config: PortalConfig }) {
  const completePortal = useWorldStore(s => s.completePortal)
  const reduced = useReducedMotion()

  const props = { config, onDone: completePortal }

  if (reduced) return <CutPortal onDone={completePortal} />

  switch (config.type) {
    case 'door':          return <DoorPortal {...props} />
    case 'expand-white':  return <ExpandWhitePortal {...props} />
    case 'fold':          return <FoldPortal onDone={completePortal} />
    case 'rotate':        return <RotatePortal onDone={completePortal} />
    case 'scatter':       return <ScatterPortal onDone={completePortal} />
    case 'letter-expand': return <LetterExpandPortal {...props} />
    case 'cursor-flood':  return <CursorFloodPortal {...props} />
    case 'slide-right':   return <SlideRightPortal onDone={completePortal} />
    case 'newspaper':     return <FoldPortal onDone={completePortal} />
    case 'nothing':       return <NothingPortal onDone={completePortal} />
    case 'vortex':        return <VortexPortal {...props} />
    case 'chromatic':     return <ChromaticPortal onDone={completePortal} />
    default:              return <FoldPortal onDone={completePortal} />
  }
}
