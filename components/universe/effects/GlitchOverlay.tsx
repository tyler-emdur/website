'use client'
import { useEffect, useRef, useState } from 'react'
import { getAllObjects, useUniverseStore } from '@/lib/universe-store'

// Random static burst that covers the screen briefly
function StaticBurst({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  const frames = useRef(0)

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = window.innerWidth; c.height = window.innerHeight

    const TOTAL = 8 + Math.floor(Math.random() * 6)

    const draw = () => {
      frames.current++
      if (frames.current > TOTAL) { onDone(); return }

      ctx.clearRect(0, 0, c.width, c.height)
      const slices = 6 + Math.floor(Math.random() * 10)
      for (let i = 0; i < slices; i++) {
        const y = Math.random() * c.height
        const h = 2 + Math.random() * 40
        const offset = (Math.random() - 0.5) * 80
        ctx.drawImage(c, offset, y, c.width, h, 0, y, c.width, h)
        const alpha = Math.random() * 0.6
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '168,85,247' : '255,255,255'},${alpha})`
        ctx.fillRect(0, y, c.width, h * Math.random())
      }
      // Scanline flash
      if (Math.random() > 0.6) {
        ctx.fillStyle = `rgba(0,0,0,${0.4 + Math.random() * 0.4})`
        ctx.fillRect(0, 0, c.width, c.height)
      }
      raf.current = requestAnimationFrame(draw)
    }

    // Seed with noise
    const imgData = ctx.createImageData(c.width, c.height)
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = Math.random() * 255
      imgData.data[i] = v; imgData.data[i+1] = v; imgData.data[i+2] = v
      imgData.data[i+3] = Math.random() * 180
    }
    ctx.putImageData(imgData, 0, 0)
    raf.current = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(raf.current)
  }, [onDone])

  return (
    <canvas ref={ref} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      pointerEvents: 'none', mixBlendMode: 'screen',
    }} />
  )
}

// The pool was seventeen strings long and most of them named things that do
// not exist — sector 03-Ω, archive node 17, an integrity percentage, a count
// mismatch the survey now contradicts. What's left either names something the
// store actually holds, or says nothing at all.
//
// The last line is the interesting one: it reads back the object you opened
// most recently. Nobody tells you it's doing that.
function transmissions(): string[] {
  const { discoveredIds } = useUniverseStore.getState()
  const lastId = discoveredIds[discoveredIds.length - 1]
  const last = lastId ? getAllObjects().find(o => o.id === lastId) : undefined
  return [
    'DESIGNATION: T.EMDUR',
    '... ... ...',
    'WARNING: UNKNOWN MASS DETECTED',
    'DO NOT APPROACH THE WORMHOLE',
    ...(last ? [`${last.label} · ACCESS LOGGED`] : []),
  ]
}

export default function GlitchOverlay() {
  const [burst, setBurst] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [msgVisible, setMsgVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    let burstId: ReturnType<typeof setTimeout>
    let txId: ReturnType<typeof setTimeout>

    // Random static bursts every 45–90 seconds
    const scheduleBurst = () => {
      const delay = 45000 + Math.random() * 45000
      burstId = setTimeout(() => {
        if (cancelled) return
        setBurst(true)
        scheduleBurst()
      }, delay)
    }

    // Random transmissions every 20–50 seconds
    const scheduleTx = () => {
      const delay = 20000 + Math.random() * 30000
      txId = setTimeout(() => {
        if (cancelled) return
        const pool = transmissions()
        const msg = pool[Math.floor(Math.random() * pool.length)]
        setMessage(msg)
        setMsgVisible(true)
        setTimeout(() => { if (!cancelled) setMsgVisible(false) }, 3500)
        setTimeout(() => { if (!cancelled) setMessage(null) }, 4200)
        scheduleTx()
      }, delay)
    }

    scheduleBurst()
    scheduleTx()

    return () => { cancelled = true; clearTimeout(burstId); clearTimeout(txId) }
  }, [])

  return (
    <>
      {burst && <StaticBurst onDone={() => setBurst(false)} />}

      {message && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 150, pointerEvents: 'none',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(10px, 1.5vw, 14px)',
          letterSpacing: '0.25em',
          color: 'rgba(168,85,247,0.9)',
          textAlign: 'center',
          opacity: msgVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          textShadow: '0 0 20px rgba(168,85,247,0.5)',
          padding: '10px 20px',
          border: msgVisible ? '1px solid rgba(168,85,247,0.2)' : 'none',
          background: 'rgba(0,0,8,0.7)',
          backdropFilter: 'blur(4px)',
        }}>
          {message}
        </div>
      )}
    </>
  )
}
