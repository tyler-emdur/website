'use client'
import { useRef, useState } from 'react'
import { IDENTITY, MAILTO } from '@/lib/identity'

// The five-second version, for whoever gets here cold. Everything after
// this is the multiverse, exactly as it already exists — this screen adds
// a beat in front of it, it doesn't replace anything.
//
// onEnter fires immediately on click, so the world can mount underneath
// while this component still owns the screen. onDone fires once the
// reveal animation finishes, so the parent can unmount this for good.
export default function FrontDoor({ onEnter, onDone }: { onEnter: () => void; onDone: () => void }) {
  const [opening, setOpening] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  const enter = (e: React.MouseEvent) => {
    if (opening) return
    setOpening(true)

    const x = e.clientX || window.innerWidth / 2
    const y = e.clientY || window.innerHeight / 2

    onEnter()

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTimeout(onDone, 200)
      return
    }

    const flash = flashRef.current
    if (flash) {
      flash.style.left = x + 'px'
      flash.style.top = y + 'px'
      flash.style.transition = 'none'
      flash.style.transform = 'translate(-50%,-50%) scale(0)'
      flash.style.opacity = '1'
      requestAnimationFrame(() => {
        flash.style.transition = 'transform 550ms cubic-bezier(0.2,0,0.2,1), opacity 550ms ease-out'
        flash.style.transform = 'translate(-50%,-50%) scale(70)'
        flash.style.opacity = '0'
      })
    }

    const maxR = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    ) + 40
    const duration = 720
    const ringBase = 20 // base radius of the ring element, px
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const start = performance.now()

    // The reveal below is driven by requestAnimationFrame, which browsers pause
    // entirely in a backgrounded tab. Switch away mid-entrance and the loop
    // stops, so `onDone` never fires and you come back to a door that will
    // never open. This guarantees the handoff regardless of whether a single
    // frame ever runs; `finished` keeps the two paths from both firing.
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      clearTimeout(safety)
      onDone()
    }
    const safety = setTimeout(finish, duration + 600)

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const r = maxR * ease(t)

      const overlay = overlayRef.current
      if (overlay) {
        const mask = `radial-gradient(circle at ${x}px ${y}px, transparent 0px, transparent ${r}px, white ${r + 70}px)`
        overlay.style.maskImage = mask
        overlay.style.setProperty('-webkit-mask-image', mask)
      }

      const ring = ringRef.current
      if (ring) {
        const s = r / ringBase
        ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${s})`
        ring.style.opacity = String(Math.max(0, 1 - t * 1.15))
      }

      if (t < 1) requestAnimationFrame(tick)
      else finish()
    }
    requestAnimationFrame(tick)
  }

  return (
    <>
      <div
        ref={overlayRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#000000',
        }}
      >
        <button
          onClick={enter}
          style={{
            position: 'fixed', top: 28, right: 32, background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.25)', opacity: opening ? 0 : 1, transition: 'opacity 200ms ease',
          }}
        >
          skip
        </button>

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          opacity: opening ? 0 : 1, transform: opening ? 'scale(0.94)' : 'scale(1)',
          transition: 'opacity 260ms ease, transform 260ms ease',
        }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,0.95)',
          }}>
            {IDENTITY.name}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 12, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
          }}>
            {IDENTITY.location}
          </div>

          <div style={{ display: 'flex', gap: 28, marginTop: 36, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <a href={IDENTITY.github} target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              GitHub
            </a>
            <a href={MAILTO}
              style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              Email
            </a>
          </div>

          <button
            onClick={enter}
            style={{
              marginTop: 56, padding: '14px 32px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.85)', transition: 'border-color 200ms ease, background 200ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent' }}
          >
            enter →
          </button>
        </div>
      </div>

      {/* Light burst + shockwave ring, both outside the masked overlay so the
          growing hole doesn't clip them at their own edge. */}
      <div ref={flashRef} style={{
        position: 'fixed', top: 0, left: 0, width: 4, height: 4, borderRadius: '50%', zIndex: 9999,
        background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)',
        opacity: 0, pointerEvents: 'none',
      }} />
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0, width: 40, height: 40, borderRadius: '50%', zIndex: 9998,
        border: '1px solid rgba(255,255,255,0.75)', boxShadow: '0 0 30px 6px rgba(255,255,255,0.45)',
        opacity: 0, pointerEvents: 'none',
      }} />
    </>
  )
}
