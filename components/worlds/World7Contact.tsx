'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import { IDENTITY, MAILTO } from '@/lib/identity'
import { useEnvironment, type DayPhase } from '@/lib/environment'
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
  { at: 0.74, garble: '░L▒V▓N W░RL▒S',           truth: 'ELEVEN WORLDS' },
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

// ── THE ROOM ─────────────────────────────────────────────────────────────────
// World 7 was a receiver centered on black — the exact shape CLAUDE.md names as
// the tell ("one well-drawn object centered in a black void is the default
// output of asking for a scene"). It needed a room, and it already had one in
// canon: the Machine's README says this site is served "out of a closet in
// Boulder, Colorado, on a carrier of 88.7 MHz." So this is that closet.
//
// The technique is World 9's, which is the part PLAN.md says to copy: every
// layer is positioned off the receiver's own box rather than a viewport
// percentage, so the shelf starts exactly where the receiver's feet stop and
// the object sits on something at any window size. The wall grows upward from
// `bottom: 0` for the same reason it does there — downward growth would extend
// the scroll area.
//
// The light under the door is the shared-reality hook (lib/environment.ts): it
// is daylight out in the hallway when it is daylight in Boulder, warm at dusk,
// and almost nothing at 3am. Same clock the hub's survey prints and the garage
// reads. Nothing here invents a value.

const SHELF = 30   // the sliver of shelf board visible in front of the receiver
const APRON = 12   // its front edge

type DoorLight = { rgb: [number, number, number]; gap: number; under: number }

const DOOR_LIGHT: Record<DayPhase, DoorLight> = {
  day:   { rgb: [214, 228, 245], gap: 0.62, under: 0.5 },
  dusk:  { rgb: [255, 166, 102], gap: 0.34, under: 0.3 },
  dawn:  { rgb: [255, 196, 140], gap: 0.3,  under: 0.26 },
  // Nobody left the hall light on. After dark the only thing lighting this
  // closet is the set, which is the whole point of the world.
  night: { rgb: [255, 182, 110], gap: 0.02, under: 0.015 },
}

/**
 * Everything around the receiver. `lock` is the carrier lock from the hold
 * gesture — the phosphor pooling on the wall behind the set brightens as the
 * signal comes in, so the room is downstream of the mechanic rather than a
 * backdrop painted behind it.
 */
function Room({ phase, daylight, lock }: { phase: DayPhase; daylight: number; lock: number }) {
  const D = DOOR_LIGHT[phase] ?? DOOR_LIGHT.night
  // `daylight` only scales the two bright phases; a warm bulb at 3am does not
  // get dimmer because the sun is further down.
  const scale = phase === 'day' || phase === 'dusk' ? Math.max(0.35, daylight) : 1
  const door = (a: number) => `rgba(${D.rgb[0]},${D.rgb[1]},${D.rgb[2]},${+(a * scale).toFixed(3)})`
  const glow = (a: number) => `rgba(70,240,166,${+(a * (0.45 + lock * 0.55)).toFixed(3)})`
  const span = {
    position: 'absolute' as const, left: '50%', transform: 'translateX(-50%)',
    width: '100vw', pointerEvents: 'none' as const,
  }

  return (
    <>
      {/* back wall of the closet — unfinished drywall, and the set's own glow on it */}
      <div style={{
        ...span, bottom: 0, height: '240vh', zIndex: 0,
        background: [
          `radial-gradient(ellipse 420px 230px at 50% calc(100% + 10px), ${glow(0.16)}, ${glow(0.05)} 42%, transparent 74%)`,
          `radial-gradient(ellipse 900px 540px at 50% 100%, rgba(70,240,166,0.022), transparent 64%)`,
          'linear-gradient(180deg, #030604 0%, #050b08 48%, #09150f 82%, #0c1a12 100%)',
        ].join(','),
      }} />

      {/* the taped drywall seam behind the set. scale, and nothing else. */}
      <div style={{
        position: 'absolute', left: 'calc(50% + 196px)', bottom: 0, width: 2, height: '240vh',
        background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.028) 30%, rgba(255,255,255,0.045))',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* The closet door, just off the right edge of the set. Only its light is
          in here: a hairline down the jamb and the spill it throws on the wall.
          Both are anchored off the receiver's own box, not a viewport percent —
          pinned to a percentage the shaft sat *behind* the set at some widths
          and beside it at others, because the set has a max-width and the
          viewport does not. */}
      <div style={{
        position: 'absolute', left: 'calc(100% + 76px)', bottom: -(SHELF + APRON),
        width: 4, height: '240vh', zIndex: 0, mixBlendMode: 'screen', pointerEvents: 'none',
        background: `linear-gradient(90deg, ${door(D.gap * 0.5)}, ${door(D.gap * 1.35)} 45%, ${door(D.gap * 0.5)})`,
      }} />
      <div style={{
        position: 'absolute', left: 'calc(100% + 6px)', bottom: -(SHELF + APRON),
        width: 220, height: '240vh', zIndex: 0, mixBlendMode: 'screen', pointerEvents: 'none',
        background: `linear-gradient(90deg, transparent, ${door(D.gap * 0.16)} 34%, transparent 62%)`,
      }} />

      {/* ── the shelf the receiver is standing on ── */}
      {/* front edge first, then the board laid over its top lip, so the apron
          reads as thickness instead of a line under the object */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '100vw',
        top: `calc(100% + ${SHELF}px)`, height: APRON, pointerEvents: 'none', zIndex: 1,
        background: 'linear-gradient(180deg, #0a0d0b 0%, #060908 60%, #030504 100%)',
        borderTop: '1px solid rgba(160,200,180,0.07)',
      }} />
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '100vw',
        top: '100%', height: SHELF, pointerEvents: 'none', zIndex: 1,
        background: [
          `radial-gradient(ellipse 340px 46px at 50% 0%, ${glow(0.12)}, transparent 70%)`,
          // the door's light landing on the shelf board on that side
          `radial-gradient(ellipse 260px 26px at calc(50% + 350px) 0%, ${door(D.under * 0.55)}, transparent 72%)`,
          'linear-gradient(180deg, #0d1210 0%, #090d0b 55%, #070a09 100%)',
        ].join(','),
      }} />

      {/* masking tape on the shelf edge, with the frequency written on it in
          marker. the kind of label a person actually puts on their own gear. */}
      <div style={{
        position: 'absolute', left: 'calc(50% - 150px)', top: `calc(100% + ${SHELF - 1}px)`,
        width: 52, height: APRON + 2, pointerEvents: 'none', zIndex: 2,
        background: 'rgba(226,214,180,0.16)', transform: 'rotate(-0.8deg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: '"Space Mono", monospace', fontSize: 8, letterSpacing: '0.04em',
          color: 'rgba(235,228,200,0.5)',
        }}>88.7</span>
      </div>

      {/* shelf bracket, under the board, off to the left */}
      <svg width="46" height="40" viewBox="0 0 46 40" style={{
        position: 'absolute', right: 'calc(100% + 24px)', top: `calc(100% + ${SHELF + APRON - 1}px)`,
        overflow: 'visible', pointerEvents: 'none', zIndex: 1,
      }}>
        <path d="M2 0 L2 34 M2 0 L40 0 M2 26 L30 0" fill="none"
          stroke="rgba(150,185,170,0.085)" strokeWidth="2" />
      </svg>

      {/* the antenna lead. it leaves the back of the set, takes a strain loop,
          and goes up out of frame — which is how the carrier gets out of a closet. */}
      <svg width="150" height="300" viewBox="0 0 150 300" style={{
        position: 'absolute', left: 'calc(100% - 42px)', bottom: 'calc(100% - 26px)',
        overflow: 'visible', pointerEvents: 'none', zIndex: 0,
      }}>
        <path d="M14 300 C 14 250, 44 236, 52 206 C 60 176, 26 164, 34 128 C 40 100, 74 92, 78 48 L 80 -40"
          fill="none" stroke="rgba(14,22,18,0.95)" strokeWidth="5" strokeLinecap="round" />
        <path d="M14 300 C 14 250, 44 236, 52 206 C 60 176, 26 164, 34 128 C 40 100, 74 92, 78 48 L 80 -40"
          fill="none" stroke="rgba(150,185,170,0.1)" strokeWidth="1.2" strokeLinecap="round" />
        {/* the zip tie holding the loop */}
        <rect x="46" y="200" width="13" height="4" rx="1.5" fill="rgba(150,185,170,0.12)" />
      </svg>

      {/* the corner of the machine that serves this site, on the same shelf,
          almost entirely out of frame. World 5's README puts the 486 in this
          closet; this is the three inches of it you can see from here. */}
      <div style={{
        position: 'absolute', right: 'calc(100% + 18px)', top: `calc(100% + ${SHELF}px)`,
        width: 190, height: 112, pointerEvents: 'none', zIndex: 2,
        transform: 'translateY(-112px)',
        background: 'linear-gradient(100deg, #1a1a16 0%, #23231d 62%, #2a2a22 100%)',
        borderRight: '1px solid rgba(190,186,160,0.1)',
        borderTop: '1px solid rgba(190,186,160,0.07)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.8)',
      }}>
        {/* vent slots */}
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} style={{
            position: 'absolute', right: 14, top: 22 + i * 7, width: 34, height: 2,
            background: 'rgba(0,0,0,0.45)', borderRadius: 1,
          }} />
        ))}
        {/* power LED, amber, still on */}
        <span style={{
          position: 'absolute', right: 15, bottom: 20, width: 5, height: 5, borderRadius: '50%',
          background: 'rgba(255,176,64,0.75)', boxShadow: '0 0 7px 2px rgba(255,150,40,0.3)',
        }} />
      </div>

      {/* power strip on the shelf, and the one cord that matters */}
      <div style={{
        position: 'absolute', left: 'calc(100% + 30px)', top: `calc(100% + ${SHELF - 20}px)`,
        width: 86, height: 15, pointerEvents: 'none', zIndex: 2,
        background: 'linear-gradient(180deg, #121613 0%, #0a0d0b 100%)',
        border: '1px solid rgba(150,185,170,0.07)', borderRadius: 2,
        display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 7,
      }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: glow(0.5) }} />
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 7, height: 5, background: 'rgba(0,0,0,0.55)', borderRadius: 1 }} />
        ))}
      </div>
      <svg width="80" height="70" viewBox="0 0 80 70" style={{
        position: 'absolute', left: 'calc(100% - 6px)', top: `calc(100% + ${SHELF - 14}px)`,
        overflow: 'visible', pointerEvents: 'none', zIndex: 1,
      }}>
        <path d="M0 2 C 16 2, 24 22, 36 22 C 44 22, 44 8, 40 6" fill="none"
          stroke="rgba(12,18,15,0.95)" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </>
  )
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
      ctx.fillStyle = 'rgba(2,6,4,0.46)'
      ctx.fillRect(0, 0, W, H)
      phase += 0.05 + lock * 0.03

      // graticule
      ctx.strokeStyle = 'rgba(70,240,166,0.06)'; ctx.lineWidth = 1
      for (let gx = 0; gx <= W; gx += W / 10) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke() }
      for (let gy = 0; gy <= H; gy += H / 6) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke() }

      // the trace: static that resolves to a clean carrier
      ctx.beginPath()
      const noise = (1 - lock) * H * 0.17
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
  // The hallway light under the closet door runs on Boulder's real clock.
  const env = useEnvironment()

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
          background: '#020403',
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

        {/* header — above the room's wall, which grows up past it */}
        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.4em', color: 'rgba(70,240,166,0.45)' }}>ENDPOINT · TE-∅</div>
          <div style={{ fontSize: 'clamp(16px,3vw,22px)', letterSpacing: '0.14em', color: 'rgba(200,255,230,0.9)', marginTop: 8 }}>
            {locked ? 'SIGNAL NORMALIZED' : 'CARRIER LOST IN NOISE'}
          </div>
        </div>

        {/* the receiver, on a shelf, in the closet the site is served out of */}
        <div style={{ position: 'relative', width: 'min(680px, 90vw)' }}>
         <Room phase={env.phase} daylight={env.daylight} lock={lock} />
         <div style={{
          position: 'relative', zIndex: 2, width: '100%',
          background: 'linear-gradient(180deg, #0c1712, #060b08)',
          border: '1px solid rgba(70,240,166,0.18)', borderRadius: 10, padding: 14,
          boxShadow: '0 30px 90px rgba(0,0,0,0.8), 0 2px 0 rgba(0,0,0,0.9), inset 0 1px 0 rgba(70,240,166,0.08)',
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
        </div>

        {/* prompt / resolution */}
        {!locked && (
          <div style={{ position: 'relative', zIndex: 3, marginTop: 20 + SHELF + APRON, fontSize: 11, letterSpacing: '0.2em', color: 'rgba(200,255,230,0.62)', textAlign: 'center' }}>
            {holdingRef.current || lock > 0.02 ? 'HOLD IT STEADY…' : 'PRESS AND HOLD ANYWHERE TO BRING THE SIGNAL IN'}
          </div>
        )}

        {locked && reveal && (
          <div className="ep-in" style={{ position: 'relative', zIndex: 3, marginTop: 22 + SHELF + APRON, width: 'min(560px, 90vw)', textAlign: 'center' }}>
            <div style={{ fontSize: 12, lineHeight: 2, color: 'rgba(200,255,230,0.8)', marginBottom: 20 }}>
              this is the end of the signal.<br />
              one person in boulder wrote all eleven of the rooms behind you.<br />
              the address below is real, and goes to a person rather than a form.
            </div>

            <div style={{ fontFamily: '"Oxanium", sans-serif', fontSize: 26, fontWeight: 300, color: 'rgba(200,255,230,0.85)', marginBottom: 18 }}>
              {IDENTITY.name}
            </div>

            {[
              { label: 'TRANSMIT', value: IDENTITY.email, href: MAILTO },
              { label: 'SOURCE', value: IDENTITY.githubLabel, href: IDENTITY.github },
              { label: 'ORIGIN', value: `${IDENTITY.locationShort} · ${IDENTITY.coords} · 88.7 MHz`, href: null },
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
              END OF TRANSMISSION
            </div>
          </div>
        )}
       </div>
      </div>
    </>
  )
}
