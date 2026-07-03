'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import HomeButton from './HomeButton'
import BroadcastScreen from './broadcast/BroadcastScreen'
import { CHANNELS, DEFAULT_CHANNEL_ID } from '@/lib/broadcast/channels'
import type { ChannelStatus } from '@/app/api/broadcast/route'

// A distinct ambient glow per channel slot — purely cosmetic, gives each number its own identity.
const SLOT_GLOW = [
  'rgba(180,80,40,0.10)',
  'rgba(60,140,60,0.09)',
  'rgba(150,60,200,0.09)',
  'rgba(40,60,200,0.10)',
  'rgba(60,120,200,0.10)',
  'rgba(100,100,160,0.08)',
  'rgba(160,120,60,0.10)',
]

const FAVORITE_KEY = 'broadcast-favorite-tally'

// ── Ambient room tone ────────────────────────────────────────────────────────
// The sound of a CRT that is simply on, in a dark room: a low mains hum, the
// faint high flyback whine older sets give off, and a bed of room hiss. Starts
// only after a user gesture (autoplay policy) and stays under everything.
class TVAmbience {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private nodes: (OscillatorNode | AudioBufferSourceNode)[] = []
  private running = false

  start() {
    if (this.running) return
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.0001
      this.master.connect(this.ctx.destination)
      this.master.gain.exponentialRampToValueAtTime(0.9, this.ctx.currentTime + 1.6)

      const hum = (f: number, g: number) => {
        const o = this.ctx!.createOscillator()
        o.type = 'sine'; o.frequency.value = f
        const gain = this.ctx!.createGain(); gain.gain.value = g
        o.connect(gain).connect(this.master!)
        o.start(); this.nodes.push(o)
      }
      hum(60, 0.020)     // mains hum
      hum(120, 0.010)    // its harmonic
      hum(15734, 0.0035) // CRT flyback whine — barely there

      // room hiss
      const len = this.ctx.sampleRate * 2
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.12
      const src = this.ctx.createBufferSource()
      src.buffer = buf; src.loop = true
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200
      const hiss = this.ctx.createGain(); hiss.gain.value = 0.05
      src.connect(lp).connect(hiss).connect(this.master)
      src.start(); this.nodes.push(src)

      this.running = true
    } catch { /* no audio — silent room */ }
  }

  // a brief swell of static when the channel is knocked over
  blip() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const len = this.ctx.sampleRate * 0.25
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1)
    const src = this.ctx.createBufferSource(); src.buffer = buf
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    src.connect(g).connect(this.master)
    src.start(t); src.stop(t + 0.26)
  }

  stop() {
    try { this.nodes.forEach(n => { try { n.stop() } catch {} }); this.ctx?.close() } catch {}
    this.ctx = null; this.nodes = []; this.running = false
  }
}

// ── CRT animation keyframes ──────────────────────────────────────────────────
const CRT_STYLES = `
  @keyframes screen-flicker {
    0%,88%,100% { opacity:1; }
    89% { opacity:0.95; }
    90% { opacity:1; }
    94% { opacity:0.97; }
    95% { opacity:1; }
    98% { opacity:0.94; }
    99% { opacity:1; }
  }
  @keyframes roll-sweep {
    0%   { top:-8px; opacity:0.5; }
    15%  { opacity:0.25; }
    100% { top:108%; opacity:0; }
  }
  @keyframes bright-flash {
    0%,100% { opacity:0; }
    30%,70% { opacity:1; }
  }
  @keyframes dust-drift-a {
    0%   { transform: translate(0,0);   opacity:0;   }
    10%  { opacity:1; }
    90%  { opacity:0.6; }
    100% { transform: translate(18px,-60px); opacity:0; }
  }
  @keyframes dust-drift-b {
    0%   { transform: translate(0,0);   opacity:0;   }
    10%  { opacity:0.8; }
    90%  { opacity:0.4; }
    100% { transform: translate(-12px,-80px); opacity:0; }
  }
  @keyframes dust-drift-c {
    0%   { transform: translate(0,0);   opacity:0;   }
    15%  { opacity:0.6; }
    85%  { opacity:0.3; }
    100% { transform: translate(8px,-50px);  opacity:0; }
  }
`

// ── Phosphor / noise canvas overlay ─────────────────────────────────────────
function PhosphorOverlay() {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  const tick = useRef(0)

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!

    const draw = () => {
      tick.current++
      if (tick.current % 3 === 0) {
        const W = c.offsetWidth || 320
        const H = c.offsetHeight || 240
        if (c.width !== W || c.height !== H) { c.width = W; c.height = H }
        const img = ctx.createImageData(W, H)
        for (let i = 0; i < img.data.length; i += 4) {
          const v = Math.random() < 0.97 ? 0 : Math.random() * 30
          img.data[i] = img.data[i+1] = img.data[i+2] = v
          img.data[i+3] = v > 0 ? 20 : 0
        }
        ctx.putImageData(img, 0, 0)
      }
      raf.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return (
    <canvas ref={ref} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', opacity: 0.06, mixBlendMode: 'screen',
    }} />
  )
}

// ── Glitch overlays ──────────────────────────────────────────────────────────
type GlitchType = 'none' | 'roll' | 'bright' | 'tear'

function GlitchOverlay({ type, tearY }: { type: GlitchType; tearY: number }) {
  if (type === 'none') return null

  if (type === 'roll') return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:12, overflow:'hidden' }}>
      <div style={{
        position:'absolute', left:0, right:0, height:4,
        background:'rgba(255,255,230,0.18)',
        animation:'roll-sweep 0.42s linear forwards',
      }} />
    </div>
  )

  if (type === 'bright') return (
    <div style={{
      position:'absolute', inset:0, pointerEvents:'none', zIndex:12,
      background:'rgba(255,255,220,0.06)',
      animation:'bright-flash 0.12s ease forwards',
    }} />
  )

  if (type === 'tear') return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:12, overflow:'hidden' }}>
      <div style={{
        position:'absolute', top:`${tearY}%`, left:0, right:0, height:1,
        background:'rgba(255,255,255,0.4)',
      }} />
      <div style={{
        position:'absolute', top:`${tearY + 0.4}%`, left:0, right:0, height:2,
        background:'rgba(0,0,0,0.6)',
      }} />
    </div>
  )

  return null
}

// ── Static noise ─────────────────────────────────────────────────────────────
function StaticScreen() {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    const draw = () => {
      const W = c.offsetWidth || 320, H = c.offsetHeight || 240
      if (c.width !== W) c.width = W; if (c.height !== H) c.height = H
      const img = ctx.createImageData(W, H)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 180 + 20
        img.data[i] = img.data[i+1] = img.data[i+2] = v; img.data[i+3] = 255
      }
      ctx.putImageData(img, 0, 0)
      raf.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf.current)
  }, [])
  return <canvas ref={ref} style={{ width:'100%', height:'100%', display:'block' }} />
}

// A single frame that looks like it might belong to another channel — the
// rare "channel 88 bleeds into the real channels" wink from the brief.
const BLEED_CITIES = [...CHANNELS.filter(c => c.kind !== 'custom').map(c => c.city), '??']
function BleedFlash() {
  const city = useRef(BLEED_CITIES[Math.floor(Math.random() * BLEED_CITIES.length)])
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 13, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', fontSize: 'clamp(10px,1.6vw,14px)',
      color: 'rgba(255,60,60,0.8)', letterSpacing: '0.2em',
    }}>
      {city.current}
    </div>
  )
}

// ── Dust particles in the beam ───────────────────────────────────────────────
function DustParticles() {
  const DUST = [
    { delay:'0s',   dur:'14s',  left:'44%', top:'28%', anim:'dust-drift-a', size:1,   op:0.35 },
    { delay:'3s',   dur:'18s',  left:'52%', top:'35%', anim:'dust-drift-b', size:0.8, op:0.25 },
    { delay:'6s',   dur:'11s',  left:'49%', top:'22%', anim:'dust-drift-c', size:1.2, op:0.30 },
    { delay:'2s',   dur:'16s',  left:'47%', top:'40%', anim:'dust-drift-a', size:0.7, op:0.20 },
    { delay:'9s',   dur:'13s',  left:'53%', top:'31%', anim:'dust-drift-b', size:1,   op:0.28 },
    { delay:'5s',   dur:'20s',  left:'46%', top:'25%', anim:'dust-drift-c', size:0.9, op:0.22 },
    { delay:'11s',  dur:'15s',  left:'50%', top:'38%', anim:'dust-drift-a', size:0.6, op:0.18 },
    { delay:'7s',   dur:'12s',  left:'51%', top:'44%', anim:'dust-drift-b', size:1.1, op:0.26 },
  ]
  return (
    <>
      {DUST.map((d, i) => (
        <div key={i} style={{
          position:'absolute', left:d.left, top:d.top,
          width:`${d.size}px`, height:`${d.size}px`,
          borderRadius:'50%',
          background:`rgba(255,220,160,${d.op})`,
          animation:`${d.anim} ${d.dur} ${d.delay} ease-in-out infinite`,
          pointerEvents:'none',
        }} />
      ))}
    </>
  )
}

function loadFavoriteIndex(): number {
  if (typeof window === 'undefined') return CHANNELS.findIndex(c => c.id === DEFAULT_CHANNEL_ID)
  try {
    const raw = localStorage.getItem(FAVORITE_KEY)
    const tally: Record<string, number> = raw ? JSON.parse(raw) : {}
    let best: string | null = null
    let bestCount = 0
    for (const [id, count] of Object.entries(tally)) {
      if (count > bestCount) { best = id; bestCount = count }
    }
    const idx = best ? CHANNELS.findIndex(c => c.id === best) : -1
    return idx >= 0 ? idx : CHANNELS.findIndex(c => c.id === DEFAULT_CHANNEL_ID)
  } catch {
    return CHANNELS.findIndex(c => c.id === DEFAULT_CHANNEL_ID)
  }
}

function recordTune(id: string) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(FAVORITE_KEY)
    const tally: Record<string, number> = raw ? JSON.parse(raw) : {}
    tally[id] = (tally[id] ?? 0) + 1
    localStorage.setItem(FAVORITE_KEY, JSON.stringify(tally))
  } catch { /* ignore */ }
}

// ── Main world ───────────────────────────────────────────────────────────────
export default function World3Broadcast() {
  const [chIdx, setChIdx] = useState(() => loadFavoriteIndex())
  const [switching, setSwitching] = useState(false)
  const [glitch, setGlitch] = useState<GlitchType>('none')
  const [bleed, setBleed] = useState(false)
  const [tearY, setTearY] = useState(40)
  const [soundOn, setSoundOn] = useState(false)
  const [status, setStatus] = useState<Record<string, ChannelStatus>>({})
  const [dead, setDead] = useState<Record<string, boolean>>({})
  const ambienceRef = useRef<TVAmbience | null>(null)

  // Ambient room tone — starts on the first user gesture, then runs quietly.
  useEffect(() => {
    const startAmbience = () => {
      if (!ambienceRef.current) { ambienceRef.current = new TVAmbience(); ambienceRef.current.start() }
    }
    window.addEventListener('pointerdown', startAmbience, { once: true })
    window.addEventListener('keydown', startAmbience, { once: true })
    return () => {
      window.removeEventListener('pointerdown', startAmbience)
      window.removeEventListener('keydown', startAmbience)
      ambienceRef.current?.stop()
    }
  }, [])

  // Server-checked liveness for the whole lineup, fetched once. Cached and
  // cheap, so this typically resolves before anyone's looking closely —
  // channels never block on it, they just start "on" and settle if a check
  // says otherwise.
  useEffect(() => {
    fetch('/api/broadcast')
      .then(r => r.json())
      .then(d => setStatus(d?.status ?? {}))
      .catch(() => {})
  }, [])

  useEffect(() => {
    recordTune(CHANNELS[chIdx].id)
  }, [chIdx])

  const changeChannel = useCallback((dir: number) => {
    ambienceRef.current?.blip()
    setSwitching(true)
    setTimeout(() => {
      setChIdx(i => (i + dir + CHANNELS.length) % CHANNELS.length)
      setSwitching(false)
    }, 180)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') changeChannel(1)
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') changeChannel(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [changeChannel])

  // Glitch scheduler — occasional random events, and much more rarely a
  // "bleed" where the screen cuts to a one-frame flash of another channel.
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>
    const sched = () => {
      const delay = 9000 + Math.random() * 22000
      tid = setTimeout(() => {
        if (Math.random() < 0.08) {
          setBleed(true)
          ambienceRef.current?.blip()
          setTimeout(() => { setBleed(false); sched() }, 200)
          return
        }
        const types: GlitchType[] = ['roll', 'bright', 'tear', 'roll']
        const type = types[Math.floor(Math.random() * types.length)]
        if (type === 'tear') setTearY(18 + Math.floor(Math.random() * 55))
        setGlitch(type)
        const dur = type === 'roll' ? 440 : type === 'tear' ? 180 : 110
        setTimeout(() => { setGlitch('none'); sched() }, dur)
      }, delay)
    }
    sched()
    return () => clearTimeout(tid)
  }, [])

  const channel = CHANNELS[chIdx]
  const channelStatus = status[channel.id]
  const effectiveLive = dead[channel.id] ? false : (channelStatus?.live ?? true)
  const roomGlow = switching ? 'rgba(20,20,20,0.05)' : SLOT_GLOW[chIdx % SLOT_GLOW.length]

  return (
    <>
      <style>{CRT_STYLES}</style>

      {/* Room — near-black, TV glow dominates */}
      <div data-world="3" style={{
        position:'fixed', inset:0,
        background:'#030201',
        display:'flex', alignItems:'center', justifyContent:'center',
        overflow:'hidden',
      }}>
        {/* Screen glow spreading into room — reacts to channel */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:`radial-gradient(ellipse 60% 50% at 50% 48%, ${roomGlow} 0%, transparent 72%)`,
          transition: 'background 1.2s ease',
        }} />
        {/* Deep room vignette beyond monitor */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.65) 80%, rgba(0,0,0,0.92) 100%)',
        }} />

        {/* Dust in the beam */}
        <DustParticles />

        <HomeButton />

        {/* TV cabinet */}
        <div style={{
          position:'relative',
          width:'min(620px, 88vw)',
          background:'linear-gradient(160deg, #3a3018 0%, #28200e 55%, #1c1808 85%, #161305 100%)',
          borderRadius:16,
          boxShadow:[
            '0 28px 80px rgba(0,0,0,0.95)',
            '0 8px 24px rgba(0,0,0,0.7)',
            'inset 0 1px 0 rgba(255,255,200,0.05)',
            'inset 0 -1px 0 rgba(0,0,0,0.4)',
            '0 0 120px rgba(140,110,50,0.12)',
          ].join(', '),
          padding:'22px 22px 16px',
        }}>

          <div style={{
            position:'absolute', top:0, left:0, right:0, height:24,
            background:'linear-gradient(to bottom, rgba(0,0,0,0.15), transparent)',
            borderRadius:'16px 16px 0 0',
            pointerEvents:'none',
          }} />

          <div style={{
            position:'absolute', top:10, left:22,
            fontFamily:'monospace', fontSize:'clamp(5px,0.75vw,7px)',
            color:'rgba(255,240,180,0.22)',
            letterSpacing:'0.15em',
            lineHeight:1.4,
          }}>
            VERITAS SYSTEMS<br/>
            <span style={{ opacity:0.6 }}>MODEL VT-14A</span>
          </div>

          <div style={{
            position:'absolute', inset:0,
            background:'repeating-linear-gradient(82deg, transparent, transparent 60px, rgba(255,255,255,0.007) 60px, rgba(255,255,255,0.007) 61px)',
            borderRadius:16,
            pointerEvents:'none',
          }} />

          <div style={{
            background:'#0a0905',
            borderRadius:6,
            padding:7,
            boxShadow:[
              'inset 0 2px 16px rgba(0,0,0,0.98)',
              'inset 0 0 0 1px rgba(0,0,0,0.8)',
              '0 0 0 1px rgba(30,25,10,0.6)',
            ].join(', '),
            marginBottom:12,
          }}>
            <div style={{
              position:'relative',
              aspectRatio:'4/3',
              borderRadius:6,
              overflow:'hidden',
              background:'#000',
              animation:'screen-flicker 6s ease-in-out infinite',
              boxShadow:'inset 0 0 30px rgba(0,0,0,0.5)',
            }}>
              {/* Channel content */}
              {switching
                ? <StaticScreen />
                : (
                  <BroadcastScreen
                    key={channel.id}
                    channel={channel}
                    live={effectiveLive}
                    soundOn={soundOn}
                    onRequestSound={() => setSoundOn(true)}
                    onAdvance={() => changeChannel(1)}
                    onDead={() => setDead(prev => ({ ...prev, [channel.id]: true }))}
                    onSignalCut={() => ambienceRef.current?.blip()}
                  />
                )}

              {bleed && !switching && <BleedFlash />}

              <PhosphorOverlay />

              <div style={{
                position:'absolute', inset:0, pointerEvents:'none', zIndex:4,
                background:`repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.16) 2px,
                  rgba(0,0,0,0.16) 4px
                )`,
              }} />

              <div style={{
                position:'absolute', inset:0, pointerEvents:'none', zIndex:5,
                background:'radial-gradient(ellipse 100% 100% at center, transparent 72%, rgba(0,0,0,0.55) 88%, rgba(0,0,0,0.85) 100%)',
              }} />

              <div style={{
                position:'absolute', inset:0, pointerEvents:'none', zIndex:6,
                background:'linear-gradient(90deg, rgba(255,0,0,0.025) 0%, transparent 8%, transparent 92%, rgba(0,80,255,0.025) 100%)',
                mixBlendMode:'screen',
              }} />

              <div style={{
                position:'absolute', inset:0, pointerEvents:'none', zIndex:7,
                background:'linear-gradient(135deg, rgba(255,255,240,0.055) 0%, rgba(255,255,240,0.018) 28%, transparent 50%)',
              }} />
              <div style={{
                position:'absolute', inset:0, pointerEvents:'none', zIndex:7,
                boxShadow:'inset 1px 1px 0 rgba(255,255,220,0.06), inset -1px -1px 0 rgba(0,0,0,0.3)',
              }} />

              <GlitchOverlay type={glitch} tearY={tearY} />

              {/* Channel readout — city name only. No flags, no categories, no explanations. */}
              <div style={{
                position:'absolute', top:5, right:7, zIndex:8,
                fontFamily:'monospace', fontSize:'clamp(8px,1.3vw,11px)',
                color:'rgba(34,197,94,0.65)',
                letterSpacing:'0.08em',
                textShadow:'0 0 10px rgba(34,197,94,0.4)',
                textAlign:'right',
              }}>
                CH {channel.ch}<br/>
                <span style={{ opacity:0.75, fontSize:'0.85em' }}>{channel.city}</span>
              </div>

              {!soundOn && (
                <div style={{
                  position:'absolute', bottom:6, left:0, right:0, zIndex:8,
                  textAlign:'center', fontFamily:'monospace', fontSize:'clamp(6px,0.85vw,8px)',
                  color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em',
                }}>
                  CLICK SCREEN FOR SOUND 🔇
                </div>
              )}
            </div>
          </div>

          {/* Controls row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4px' }}>
            <div style={{ display:'flex', gap:2.5 }}>
              {Array.from({length: 9}).map((_,i) => (
                <div key={i} style={{
                  width:2.5, height:20,
                  background:`rgba(255,255,200,${0.04 + (i % 3 === 1 ? 0.02 : 0)})`,
                  borderRadius:1,
                }} />
              ))}
            </div>

            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button onClick={() => changeChannel(-1)} style={{
                width:34, height:34, borderRadius:'50%',
                background:'linear-gradient(145deg, #3a3020, #1e1808)',
                border:'1px solid #120f05',
                color:'rgba(255,240,180,0.5)', fontSize:12, cursor:'pointer',
                boxShadow:'0 3px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,180,0.06)',
              }}>▲</button>
              <div style={{
                fontFamily:'monospace', fontSize:9, color:'rgba(255,240,160,0.2)',
                letterSpacing:'0.08em', textAlign:'center', lineHeight:1.5,
              }}>CH<br />{channel.ch}</div>
              <button onClick={() => changeChannel(1)} style={{
                width:34, height:34, borderRadius:'50%',
                background:'linear-gradient(145deg, #3a3020, #1e1808)',
                border:'1px solid #120f05',
                color:'rgba(255,240,180,0.5)', fontSize:12, cursor:'pointer',
                boxShadow:'0 3px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,180,0.06)',
              }}>▼</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#1a4a1a', boxShadow:'0 0 5px rgba(30,180,30,0.6)' }} />
              <div style={{ fontFamily:'monospace', fontSize:6, color:'rgba(255,255,180,0.12)', letterSpacing:'0.08em' }}>PWR</div>
              <div style={{
                fontFamily:'monospace', fontSize:'clamp(3px,0.5vw,5px)',
                color:'rgba(255,240,180,0.10)',
                letterSpacing:'0.06em', marginTop:4, textAlign:'center', lineHeight:1.3,
              }}>SERVICE<br/>REQUIRED</div>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', padding:'0 44px', marginTop:5 }}>
            {[0,1].map(i => (
              <div key={i} style={{
                width:14, height:14,
                background:'linear-gradient(to bottom, #241c08, #100e04)',
                borderRadius:'0 0 3px 3px',
                boxShadow:'inset 1px 0 0 rgba(0,0,0,0.4)',
              }} />
            ))}
          </div>
        </div>

        <div style={{
          position:'fixed', bottom:22, left:'50%', transform:'translateX(-50%)',
          fontFamily:'monospace', fontSize:8, color:'rgba(255,255,200,0.14)',
          letterSpacing:'0.12em',
        }}>↑ ↓  or  ▲ ▼  to change channel</div>
      </div>
    </>
  )
}
