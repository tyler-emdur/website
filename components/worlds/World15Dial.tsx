'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import HomeButton from './HomeButton'

interface Station {
  freq: number
  label: string
  sub: string
  fake?: string
  broadcast?: string
}

const STATIONS: Station[] = [
  { freq: 88.1, label: 'STATIC', sub: 'nothing here', fake: 'only snow' },
  { freq: 88.8, label: 'DEPTH FM', sub: 'drifting signals',
    broadcast: 'signal from depth. you are 40 meters below the surface. temperature: 4°C. visibility: zero. the floor is soft. this is normal.' },
  { freq: 89.4, label: 'DEAD AIR', sub: '…', fake: 'you imagined it' },
  { freq: 90.2, label: 'PUBLIC ACCESS', sub: 'channel something',
    broadcast: 'channel 22. the host is not present. the set is dressed. the cameras are running. nobody came. this is normal. this has always been normal.' },
  { freq: 91.1, label: '★ PIXEL RADIO ★', sub: '8-bit emergency broadcast',
    broadcast: 'EMERGENCY BROADCAST. collect coins. avoid the gap. the princess is in another castle. that is okay. that has always been okay. keep moving.' },
  { freq: 91.9, label: 'CORRIDOR LOOP', sub: 'do not turn around',
    broadcast: 'please hold. your position in queue: unknown. estimated wait: undefined. the number you are holding is somewhere ahead of you. thank you for holding.' },
  { freq: 92.7, label: 'FIELD STATION', sub: 'boulder uplink',
    broadcast: 'boulder uplink active. winds 12mph NW. trail conditions: good. one runner observed near summit ridge. unidentified. coordinates: 40.0150°N 105.2705°W.' },
  { freq: 93.5, label: 'DOCUMENT FM', sub: 'good evening',
    broadcast: 'good evening. the files have been reviewed. some details remain redacted by request of the subject. the committee notes this. the committee has noted this for some time.' },
  { freq: 94.2, label: 'MALL CLOSED', sub: 'permanently',
    broadcast: 'permanently closed since [DATE REDACTED]. security rounds continue on schedule. the escalator is still running. nobody knows why. nobody has turned it off.' },
  { freq: 94.7, label: 'ROOM 10 REPEAT', sub: 'room 10 · room 10',
    broadcast: 'room 10. you have been here before. you will be here again. the clock reads 11:59. it has always read 11:59. this is the room.' },
  { freq: 95.3, label: 'DOUBLE VISION', sub: 'match match match',
    broadcast: 'DEPTH. SIGNAL. MALL. SPIRAL. BROADCAST. ARCHIVE. match the pairs. order is significant. you already know the pattern. you have always known.' },
  { freq: 96.0, label: 'ROOT SHELL', sub: 'type help',
    broadcast: "login: guest. access: limited. traversal: sealed. what you're looking for is not in this directory. try going deeper. or not. your choice." },
  { freq: 96.8, label: 'VERTICAL DROP', sub: 'falling · falling',
    broadcast: 'depth reading: increasing. no floor detected. wormholes appear at regular intervals. fall velocity: nominal. estimated time to bottom: undefined. keep going.' },
  { freq: 98.2, label: 'SIGNAL CLEAR', sub: 'portfolio normalized',
    broadcast: 'transmission reconstructed. survey origin: T.EMDUR. position: 40.0150°N 105.2705°W. status: observation active. you are being documented.' },
  { freq: 99.0, label: 'WHITE ROOM', sub: 'endpoint',
    broadcast: 'endpoint reached. CAPTCHA complete. entity class: HUMAN ENOUGH. contact info: healthreinvented@gmail.com — leave a message after the tone.  · · ·' },
  { freq: 99.9, label: 'UNIVERSE DIRECT', sub: 'all sectors',
    broadcast: 'all sectors active. 15 worlds mounted. 47 objects detected. origin confirmed. frequency 88.7 recognized. the signal was always there.' },
  { freq: 101.5, label: 'TEST PATTERN', sub: 'color bars', fake: 'this station is a lie' },
  { freq: 102.3, label: 'ECHO CHAMBER', sub: '… … …', fake: 'your voice came back wrong' },
  { freq: 103.1, label: 'NULL', sub: '0 Hz', fake: 'tuning impossible' },
  { freq: 104.0, label: 'WORMHOLE WX', sub: 'weather in another dimension',
    broadcast: 'weather in another dimension: overcast. precipitation: unknown substance. visibility: 6 other dimensions. pressure: unresolvable. dress accordingly.' },
  { freq: 105.5, label: 'LOOPBACK', sub: 'you are the DJ',
    broadcast: 'you are now the DJ. nobody is listening. keep broadcasting anyway. this is what it means to make something. you already knew this.' },
  { freq: 107.9, label: 'END OF DIAL', sub: 'no more frequencies', fake: 'or are there' },
]

export default function World15Dial() {
  const [freq, setFreq] = useState(91.1)
  const [dragging, setDragging] = useState(false)
  const [tuned, setTuned] = useState<Station | null>(null)
  const [broadcastText, setBroadcastText] = useState('')
  const scopeRef = useRef<HTMLCanvasElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const broadcastTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nearest = useCallback((f: number) => {
    let best: Station | null = null
    let bestD = Infinity
    for (const s of STATIONS) {
      const d = Math.abs(s.freq - f)
      if (d < bestD) { bestD = d; best = s }
    }
    return bestD < 0.35 ? best : null
  }, [])

  useEffect(() => {
    setTuned(nearest(freq))
  }, [freq, nearest])

  // Typing effect for broadcast
  useEffect(() => {
    if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current)
    setBroadcastText('')

    if (!tuned || tuned.fake || !tuned.broadcast) return

    const text = tuned.broadcast
    let idx = 0
    broadcastTimerRef.current = setInterval(() => {
      idx++
      setBroadcastText(text.slice(0, idx))
      if (idx >= text.length) clearInterval(broadcastTimerRef.current!)
    }, 28)

    return () => {
      if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current)
    }
  }, [tuned])

  useEffect(() => {
    const canvas = scopeRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = 280
    canvas.height = 80
    let raf = 0
    function draw() {
      ctx.fillStyle = '#0a1a0a'
      ctx.fillRect(0, 0, 280, 80)
      ctx.strokeStyle = 'rgba(34,197,94,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x < 280; x++) {
        const noise = tuned && !tuned.fake ? Math.sin(x * 0.08 + Date.now() * 0.005) * 8 : (Math.random() - 0.5) * (tuned ? 12 : 28)
        const y = 40 + noise
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.strokeStyle = tuned && !tuned.fake ? '#22c55e' : 'rgba(34,197,94,0.5)'
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [tuned])

  const tuneFromX = (clientX: number) => {
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setFreq(88 + t * 20)
  }

  return (
    <div
      data-world="15"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #0f1a0f 0%, #050805 70%)',
        overflow: 'hidden',
        fontFamily: '"Share Tech Mono", monospace',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: tuned
          ? `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(34,197,94,${tuned.fake ? 0.06 : 0.02}) 3px, rgba(34,197,94,0.06) 6px)`
          : 'none',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(520px, 92vw)',
      }}>
        <div style={{ fontSize: 10, color: 'rgba(34,197,94,0.5)', letterSpacing: '0.35em', marginBottom: 24, textAlign: 'center' }}>
          THE DIAL · FM 88.0 — 108.0
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(34,197,94,0.2)',
          padding: 24,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 28, color: tuned && !tuned.fake ? '#4ade80' : 'rgba(34,197,94,0.7)' }}>
              {freq.toFixed(1)}
            </span>
            <span style={{ fontSize: 9, color: 'rgba(34,197,94,0.3)', letterSpacing: '0.15em' }}>MHz</span>
          </div>
          <canvas ref={scopeRef} style={{ width: '100%', height: 80, display: 'block', marginBottom: 16 }} />
          <div
            ref={barRef}
            onMouseDown={e => { setDragging(true); tuneFromX(e.clientX) }}
            onMouseMove={e => dragging && tuneFromX(e.clientX)}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onTouchStart={e => tuneFromX(e.touches[0].clientX)}
            onTouchMove={e => tuneFromX(e.touches[0].clientX)}
            style={{
              height: 32,
              background: 'linear-gradient(90deg, #1a2a1a, #0a3a0a, #1a2a1a)',
              border: '1px solid rgba(34,197,94,0.25)',
              position: 'relative',
              cursor: 'ew-resize',
            }}
          >
            <div style={{
              position: 'absolute',
              left: `${((freq - 88) / 20) * 100}%`,
              top: -4,
              width: 2,
              height: 40,
              background: '#22c55e',
              boxShadow: '0 0 12px #22c55e',
              transform: 'translateX(-1px)',
            }} />
          </div>
        </div>

        <div style={{ minHeight: 140, textAlign: 'center' }}>
          {tuned ? (
            <>
              <div style={{ fontSize: 14, color: 'rgba(34,197,94,0.7)', letterSpacing: '0.2em', marginBottom: 8 }}>
                {tuned.label}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>{tuned.sub}</div>
              {tuned.fake && (
                <div style={{ fontSize: 9, color: 'rgba(255,80,80,0.5)', fontStyle: 'italic', marginBottom: 12 }}>{tuned.fake}</div>
              )}
              {!tuned.fake && broadcastText && (
                <div style={{
                  fontSize: 10,
                  color: 'rgba(34,197,94,0.55)',
                  lineHeight: 1.8,
                  letterSpacing: '0.04em',
                  textAlign: 'left',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(34,197,94,0.1)',
                  minHeight: 60,
                }}>
                  {broadcastText}
                  <span style={{ opacity: 0.5, animation: 'dialBlink 0.7s step-end infinite' }}>█</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 10, color: 'rgba(34,197,94,0.25)', letterSpacing: '0.15em' }}>
              static between stations · keep turning
            </div>
          )}
        </div>

        <div style={{ marginTop: 32, fontSize: 8, color: 'rgba(34,197,94,0.2)', textAlign: 'center', letterSpacing: '0.1em' }}>
          some frequencies lie · arrow keys work too
        </div>
      </div>

      <style>{`@keyframes dialBlink { 0%,100%{opacity:0.5} 50%{opacity:0} }`}</style>

      <DialKeys freq={freq} setFreq={setFreq} />

      <HomeButton />
    </div>
  )
}

function DialKeys({ freq, setFreq }: { freq: number; setFreq: (f: number) => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setFreq(Math.max(88, freq - 0.1))
      if (e.key === 'ArrowRight') setFreq(Math.min(108, freq + 0.1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [freq, setFreq])
  return null
}
