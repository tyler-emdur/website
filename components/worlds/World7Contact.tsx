'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── THE ENDPOINT ─────────────────────────────────────────────────────────────
// You got here. This is the last position before the signal normalizes
// completely — the place the whole broadcast was coming from. A single receiver
// in the dark, its carrier buried in static. Press and hold to bring it in: the
// noise falls away, the fragments that recurred across every world (88.7, the
// coordinates, the designation, the object count) lock into place one by one,
// and when the carrier finally goes quiet, the transmission resolves into plain
// text — and the real way to reach the person who was sending it.

const PHOSPHOR = '#46f0a6'

interface Fragment { at: number; garble: string; truth: string }
const FRAGMENTS: Fragment[] = [
  { at: 0.16, garble: '░8▓.7▒ M░z',              truth: '88.7 MHz' },
  { at: 0.36, garble: '4▓.0▒5░°N 1░5.2▓0░°W',    truth: '40.0150°N 105.2705°W' },
  { at: 0.56, garble: 'S▒RV░Y T▓-∅',             truth: 'SURVEY TE-∅' },
  { at: 0.74, garble: '▓7 O░J▒CTS',              truth: '47 OBJECTS CATALOGUED' },
  { at: 0.9,  garble: 'OP░R▒T░R — T.░MD▓R',      truth: 'OPERATOR — T. EMDUR' },
]

// A carrier tone that starts detuned/beating and pitch-corrects toward a single
// clean note as the lock fills, then gates off when the signal normalizes.
class CarrierAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private oscs: OscillatorNode[] = []
  private staticGain: GainNode | null = null

  start() {
    if (this.ctx) return
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)

      // two oscillators a few Hz apart → an audible beat that we'll close as lock rises
      ;[220, 223.5].forEach(f => {
        const o = this.ctx!.createOscillator()
        o.type = 'sine'; o.frequency.value = f
        const g = this.ctx!.createGain(); g.gain.value = 0.06
        o.connect(g).connect(this.master!)
        o.start(); this.oscs.push(o)
      })

      // static bed
      const len = this.ctx.sampleRate * 2
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.4
      const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true
      const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.4
      this.staticGain = this.ctx.createGain(); this.staticGain.gain.value = 0.12
      src.connect(bp).connect(this.staticGain).connect(this.master)
      src.start(); this.oscs.push(src as unknown as OscillatorNode)
    } catch { /* silent */ }
  }

  update(lock: number) {
    if (!this.ctx || !this.staticGain) return
    const t = this.ctx.currentTime
    // close the beat: second osc converges on the first
    if (this.oscs[1] && 'frequency' in this.oscs[1]) {
      this.oscs[1].frequency.setTargetAtTime(220 + (1 - lock) * 3.5, t, 0.1)
    }
    this.staticGain.gain.setTargetAtTime(0.13 * (1 - lock * 0.98), t, 0.1)
    // once normalized, fade the carrier out too — silence is the resolution
    if (this.master) this.master.gain.setTargetAtTime(lock >= 1 ? 0.02 : 0.5, t, 0.4)
  }

  stop() { try { this.oscs.forEach(o => { try { o.stop() } catch {} }); this.ctx?.close() } catch {}; this.ctx = null }
}

// ── the oscilloscope ─────────────────────────────────────────────────────────
function Scope({ lockRef, holdingRef }: { lockRef: React.MutableRefObject<number>; holdingRef: React.MutableRefObject<boolean> }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2 }
    resize()
    window.addEventListener('resize', resize)
    let raf = 0, phase = 0
    const draw = () => {
      const W = c.width, H = c.height, mid = H / 2
      const lock = lockRef.current
      // phosphor persistence
      ctx.fillStyle = 'rgba(2,6,4,0.28)'
      ctx.fillRect(0, 0, W, H)
      phase += 0.05 + lock * 0.03

      // graticule
      ctx.strokeStyle = 'rgba(70,240,166,0.06)'; ctx.lineWidth = 1
      for (let gx = 0; gx <= W; gx += W / 10) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke() }
      for (let gy = 0; gy <= H; gy += H / 6) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke() }

      // the trace: static that resolves to a clean carrier
      ctx.beginPath()
      const noise = (1 - lock) * H * 0.34
      const amp = H * (0.06 + lock * 0.20)
      const freq = 5 + lock * 3
      const settle = lock >= 1 ? 0.15 : 1  // normalized: nearly flat, slow breath
      for (let x = 0; x <= W; x += 2) {
        const u = x / W
        const carrier = Math.sin(u * Math.PI * 2 * freq + phase) * amp * settle
        const jitter = (Math.random() * 2 - 1) * noise
        const y = mid + carrier + jitter
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = PHOSPHOR
      ctx.lineWidth = 2
      ctx.shadowBlur = 12 + lock * 10
      ctx.shadowColor = PHOSPHOR
      ctx.globalAlpha = 0.9
      ctx.stroke()
      ctx.shadowBlur = 0; ctx.globalAlpha = 1

      // lock reticle sweeps to center as it fills
      if (holdingRef.current && lock < 1) {
        ctx.fillStyle = 'rgba(70,240,166,0.5)'
        ctx.fillRect(W / 2 - 1, 0, 2, H)
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [lockRef, holdingRef])
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
}

export default function World7Contact() {
  const findSecret = useWorldStore(s => s.findSecret)
  const lockRef = useRef(0)
  const holdingRef = useRef(false)
  const audioRef = useRef<CarrierAudio | null>(null)
  const [lock, setLock] = useState(0)
  const [locked, setLocked] = useState(false)
  const [reveal, setReveal] = useState(false)

  // lock integrator: rises while held, ebbs slowly when released (forgiving)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now
      if (!locked) {
        const v = lockRef.current + (holdingRef.current ? 0.26 : -0.11) * dt
        lockRef.current = Math.max(0, Math.min(1, v))
        setLock(lockRef.current)
        audioRef.current?.update(lockRef.current)
        if (lockRef.current >= 1) {
          setLocked(true)
          holdingRef.current = false
          findSecret('endpoint-signal-normalized')
          audioRef.current?.update(1)
          setTimeout(() => setReveal(true), 900)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [locked, findSecret])

  useEffect(() => () => { audioRef.current?.stop() }, [])

  const beginHold = useCallback(() => {
    if (locked) return
    if (!audioRef.current) { audioRef.current = new CarrierAudio(); audioRef.current.start() }
    holdingRef.current = true
  }, [locked])
  const endHold = useCallback(() => { holdingRef.current = false }, [])

  const pct = Math.round(lock * 100)

  return (
    <>
      <style>{`
        @keyframes ep-fade { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes ep-dust { 0%{transform:translateY(0);opacity:0} 12%{opacity:.5} 100%{transform:translateY(-70px);opacity:0} }
        .ep-in { animation: ep-fade 1s ease both }
      `}</style>

      <div
        onPointerDown={beginHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        style={{
          position: 'fixed', inset: 0, overflowY: 'auto', overflowX: 'hidden',
          background: 'radial-gradient(ellipse 90% 70% at 50% 46%, #06120c 0%, #020403 72%)',
          fontFamily: '"Space Mono", "JetBrains Mono", monospace', cursor: locked ? 'auto' : 'pointer',
          userSelect: 'none',
        }}
      >
       <div style={{
         minHeight: '100%', display: 'flex', flexDirection: 'column',
         alignItems: 'center', justifyContent: 'center', padding: '48px 20px',
       }}>
        {/* floating dust in the receiver's glow */}
        {[18, 33, 47, 58, 71, 82].map((l, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${l}%`, top: `${40 + (i % 3) * 8}%`, width: 2, height: 2, borderRadius: '50%',
            background: 'rgba(70,240,166,0.4)', animation: `ep-dust ${9 + i * 2}s ${i}s ease-in-out infinite`, pointerEvents: 'none',
          }} />
        ))}

        <HomeButton />

        {/* header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.4em', color: 'rgba(70,240,166,0.45)' }}>ENDPOINT · TE-∅</div>
          <div style={{ fontSize: 'clamp(16px,3vw,22px)', letterSpacing: '0.14em', color: 'rgba(200,255,230,0.9)', marginTop: 8 }}>
            {locked ? 'SIGNAL NORMALIZED' : 'CARRIER LOST IN NOISE'}
          </div>
        </div>

        {/* the receiver */}
        <div style={{
          width: 'min(680px, 90vw)',
          background: 'linear-gradient(180deg, #0c1712, #060b08)',
          border: '1px solid rgba(70,240,166,0.18)', borderRadius: 10, padding: 14,
          boxShadow: '0 30px 90px rgba(0,0,0,0.8), inset 0 1px 0 rgba(70,240,166,0.08)',
        }}>
          {/* scope */}
          <div style={{
            position: 'relative', aspectRatio: '16/6', borderRadius: 6, overflow: 'hidden',
            background: '#020604', border: '1px solid rgba(70,240,166,0.14)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)',
          }}>
            <Scope lockRef={lockRef} holdingRef={holdingRef} />
            {/* scanlines */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 3px)',
            }} />
          </div>

          {/* lock meter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <span style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(70,240,166,0.6)' }}>CARRIER LOCK</span>
            <div style={{ flex: 1, height: 8, background: 'rgba(70,240,166,0.08)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(70,240,166,0.12)' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: PHOSPHOR, boxShadow: `0 0 10px ${PHOSPHOR}`, transition: 'width 0.05s linear' }} />
            </div>
            <span style={{ fontSize: 11, color: PHOSPHOR, width: 40, textAlign: 'right' }}>{pct}%</span>
          </div>

          {/* resolving anomaly fragments */}
          <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
            {FRAGMENTS.map(f => {
              const resolved = lock >= f.at
              return (
                <div key={f.truth} style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: '0.06em',
                  padding: '4px 8px', borderLeft: `1px solid ${resolved ? PHOSPHOR : 'rgba(70,240,166,0.15)'}`,
                  color: resolved ? 'rgba(200,255,230,0.92)' : 'rgba(70,240,166,0.3)',
                  transition: 'color 0.3s, border-color 0.3s',
                }}>
                  <span>{resolved ? f.truth : f.garble}</span>
                  <span style={{ color: resolved ? PHOSPHOR : 'rgba(70,240,166,0.25)', fontSize: 9 }}>
                    {resolved ? 'LOCKED' : '— — —'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* prompt / resolution */}
        {!locked && (
          <div style={{ marginTop: 20, fontSize: 11, letterSpacing: '0.2em', color: 'rgba(200,255,230,0.55)', textAlign: 'center' }}>
            {holdingRef.current || lock > 0.02 ? 'HOLD IT STEADY…' : 'PRESS AND HOLD ANYWHERE TO BRING THE SIGNAL IN'}
          </div>
        )}

        {locked && reveal && (
          <div className="ep-in" style={{ marginTop: 22, width: 'min(560px, 90vw)', textAlign: 'center' }}>
            <div style={{ fontSize: 12, lineHeight: 2, color: 'rgba(200,255,230,0.8)', marginBottom: 20 }}>
              you reached the end of the signal.<br />
              this is the place it was coming from. it was only ever one person,<br />
              in boulder, making things at 3am and pointing them at the dark.
            </div>

            <div style={{ fontFamily: '"Oxanium", sans-serif', fontSize: 26, fontWeight: 300, color: 'rgba(200,255,230,0.85)', marginBottom: 18 }}>
              Tyler Emdur
            </div>

            {[
              { label: 'TRANSMIT', value: 'healthreinvented@gmail.com', href: 'mailto:healthreinvented@gmail.com' },
              { label: 'SOURCE', value: 'github.com/tyler-emdur', href: 'https://github.com/tyler-emdur' },
              { label: 'ORIGIN', value: 'Boulder, CO · 40.0150°N 105.2705°W · 88.7 MHz', href: null },
            ].map((row, i) => {
              const inner = (
                <>
                  <div style={{ fontSize: 8, letterSpacing: '0.3em', color: 'rgba(70,240,166,0.5)', marginBottom: 4 }}>{row.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(200,255,230,0.85)', letterSpacing: '0.04em' }}>{row.value}</div>
                </>
              )
              const style: React.CSSProperties = {
                display: 'block', textDecoration: 'none', padding: '12px 16px', marginBottom: 8, textAlign: 'left',
                border: '1px solid rgba(70,240,166,0.16)', borderRadius: 4, background: 'rgba(70,240,166,0.04)',
                animation: `ep-fade 0.8s ${0.3 + i * 0.25}s ease both`,
              }
              return row.href
                ? <a key={row.label} href={row.href} target={row.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={style}>{inner}</a>
                : <div key={row.label} style={style}>{inner}</div>
            })}

            <div style={{ fontSize: 8, letterSpacing: '0.28em', color: 'rgba(70,240,166,0.35)', marginTop: 10 }}>
              DESIGNATION T.EMDUR · END OF TRANSMISSION
            </div>
          </div>
        )}
       </div>
      </div>
    </>
  )
}
