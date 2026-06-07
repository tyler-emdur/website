'use client'
import { useEffect, useRef, useState } from 'react'

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

const TRANSMISSIONS = [
  'SIGNAL LOST · RECONNECTING',
  'WARNING: UNKNOWN MASS DETECTED',
  '⚠ SECTOR INTEGRITY: 12%',
  'NAVIGATION SYSTEM OFFLINE',
  'YOU ARE NOT SUPPOSED TO BE HERE',
  'MEMORY CORRUPTION IN SECTOR 03-Ω',
  '// REDACTED //',
  'TRANSMISSION INTERRUPTED',
  'ERROR CODE: ████████',
  'DO NOT APPROACH THE WORMHOLE',
  'OBJECT COUNT MISMATCH',
  'VISITOR #' + Math.floor(Math.random() * 9000 + 1000),
  'THIS UNIVERSE IS NOT REAL',
  '... ... ...',
  'CLASSIFIED — CLEARANCE REQUIRED',
]

export default function GlitchOverlay() {
  const [burst, setBurst] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [msgVisible, setMsgVisible] = useState(false)

  useEffect(() => {
    // Random static bursts every 45–90 seconds
    const burstTimer = () => {
      const delay = 45000 + Math.random() * 45000
      return setTimeout(() => {
        setBurst(true)
        burstTimer()
      }, delay)
    }
    const bt = burstTimer()

    // Random transmissions every 20–50 seconds
    const txTimer = () => {
      const delay = 20000 + Math.random() * 30000
      return setTimeout(() => {
        const msg = TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)]
        setMessage(msg)
        setMsgVisible(true)
        setTimeout(() => setMsgVisible(false), 3500)
        setTimeout(() => setMessage(null), 4200)
        txTimer()
      }, delay)
    }
    const tt = txTimer()

    return () => { clearTimeout(bt); clearTimeout(tt) }
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
