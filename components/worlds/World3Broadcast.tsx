'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import HomeButton from './HomeButton'

const CHANNELS = [2, 4, 7, 9, 13, 22, 44, 66, 88]

// A distinct ambient glow per channel slot — purely cosmetic, gives each number its own identity.
const SLOT_GLOW = [
  'rgba(180,80,40,0.10)',
  'rgba(60,100,180,0.09)',
  'rgba(60,140,60,0.09)',
  'rgba(150,60,200,0.09)',
  'rgba(40,60,200,0.10)',
  'rgba(60,120,200,0.10)',
  'rgba(100,100,160,0.08)',
  'rgba(0,160,80,0.08)',
  'rgba(160,120,60,0.10)',
]

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
      // Re-render noise only every 3 frames to avoid expense
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

// ── World Feed — every channel is a live broadcast from somewhere on Earth ───
interface LiveChannelInfo { id: string; name: string; country: string; language: string | null; url: string }

function regionName(code: string) {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code } catch { return code }
}
function languageName(code: string) {
  try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code } catch { return code }
}
function countryFlag(code: string) {
  if (!/^[A-Za-z]{2}$/.test(code)) return ''
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)))
}

// The server pre-verifies streams actually load before handing them to us, so a channel
// usually connects on the first try — this only covers the rare case one goes dead between
// verification and viewing.
function WorldFeedChannel({ info, onDead, soundOn, onRequestSound }: { info: LiveChannelInfo | null | undefined; onDead: () => void; soundOn: boolean; onRequestSound: () => void }) {
  const [live, setLive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDeadRef = useRef(onDead)
  useEffect(() => { onDeadRef.current = onDead }, [onDead])

  // Sound has to start muted (autoplay policy) — once the user has unmuted once, keep new
  // channels unmuted too, since browsers treat that as an established preference for the tab.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !soundOn
  }, [soundOn, live])

  useEffect(() => {
    setLive(false)
    if (!info) return
    const video = videoRef.current
    if (!video) return
    video.muted = !soundOn
    let cancelled = false
    let resolved = false
    let hls: import('hls.js').default | null = null

    const fail = () => {
      if (cancelled || resolved) return
      resolved = true
      onDeadRef.current()
    }
    const succeed = () => {
      if (cancelled || resolved) return
      resolved = true
      setLive(true)
    }

    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return
      if (Hls.isSupported()) {
        hls = new Hls({ maxBufferLength: 15 })
        hls.loadSource(info.url)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_evt, data) => { if (data.fatal) fail() })
        video.addEventListener('playing', succeed, { once: true })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = info.url
        video.addEventListener('playing', succeed, { once: true })
        video.addEventListener('error', fail, { once: true })
        video.play().catch(() => {})
      } else {
        fail()
      }
    }).catch(fail)

    const timeout = setTimeout(fail, 5000)

    return () => {
      cancelled = true
      clearTimeout(timeout)
      video.removeEventListener('playing', succeed)
      hls?.destroy()
    }
  }, [info])

  const handleClick = () => {
    if (!info) return
    // First click just turns sound on (a real user gesture, so browsers allow it); once sound
    // is already on, clicking spins the dial to a new channel instead.
    if (!soundOn) { onRequestSound(); return }
    onDeadRef.current()
  }

  return (
    <div onClick={handleClick} style={{ position:'relative', width:'100%', height:'100%', background:'#000', cursor: info ? 'pointer' : 'default' }}>
      <video ref={videoRef} autoPlay muted={!soundOn} playsInline style={{
        position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
        opacity: live ? 1 : 0, transition:'opacity 0.3s ease',
      }} />

      {!live && <StaticScreen />}

      {info === null && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace', color:'rgba(255,255,255,0.5)', fontSize:'clamp(7px,1vw,10px)', letterSpacing:'0.15em', textAlign:'center', padding:16 }}>
          NO SIGNAL FROM ORBIT
        </div>
      )}

      {!live && info && (
        <div style={{ position:'absolute', bottom:8, left:8, right:8, fontFamily:'monospace', fontSize:'clamp(6px,0.9vw,9px)', color:'rgba(255,255,255,0.55)', letterSpacing:'0.1em' }}>
          TUNING {countryFlag(info.country)} {regionName(info.country)}…
        </div>
      )}

      {info === undefined && (
        <div style={{ position:'absolute', bottom:8, left:8, right:8, fontFamily:'monospace', fontSize:'clamp(6px,0.9vw,9px)', color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>
          LOCATING SATELLITE…
        </div>
      )}

      {live && info && (
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 10px 8px', background:'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', fontFamily:'monospace' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'#fff', fontSize:'clamp(9px,1.3vw,13px)', fontWeight:700 }}>
            <span>{countryFlag(info.country)}</span>
            <span>{regionName(info.country)}</span>
            <span style={{ background:'#cc0000', padding:'1px 5px', fontSize:'0.7em' }}>LIVE</span>
          </div>
          <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'clamp(7px,1vw,10px)', marginTop:2, letterSpacing:'0.06em' }}>
            {info.name}{info.language ? ` · ${languageName(info.language)}` : ''}
          </div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'clamp(6px,0.85vw,8px)', marginTop:3, letterSpacing:'0.1em' }}>
            {soundOn ? 'CLICK SCREEN TO SPIN THE DIAL' : 'CLICK SCREEN FOR SOUND 🔇'}
          </div>
        </div>
      )}
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

const MAX_ATTEMPTS_PER_SLOT = 6

// ── Main world ───────────────────────────────────────────────────────────────
export default function World3Broadcast() {
  const [chIdx, setChIdx] = useState(1)
  const [switching, setSwitching] = useState(false)
  const [glitch, setGlitch] = useState<GlitchType>('none')
  const [tearY, setTearY] = useState(40)
  const [soundOn, setSoundOn] = useState(false)

  // One pinned live channel per slot, assigned once the verified feed pool loads and kept
  // stable across channel flips — undefined = still loading, null = exhausted/unavailable.
  const [pins, setPins] = useState<(LiveChannelInfo | null | undefined)[]>(() => CHANNELS.map(() => undefined))
  const feedPoolRef = useRef<LiveChannelInfo[]>([])
  const usedIdsRef = useRef<Set<string>>(new Set())
  const attemptsRef = useRef<number[]>(CHANNELS.map(() => 0))

  useEffect(() => {
    fetch('/api/livetv')
      .then(r => r.json())
      .then(d => {
        const list: LiveChannelInfo[] = Array.isArray(d?.channels) ? d.channels : []
        feedPoolRef.current = list
        const shuffled = [...list]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        const initial = CHANNELS.map((_, i) => shuffled[i] ?? null)
        initial.forEach(c => { if (c) usedIdsRef.current.add(c.id) })
        setPins(initial)
      })
      .catch(() => setPins(CHANNELS.map(() => null)))
  }, [])

  const replaceChannel = useCallback((index: number) => {
    attemptsRef.current[index] += 1
    if (attemptsRef.current[index] > MAX_ATTEMPTS_PER_SLOT) {
      setPins(prev => { const next = [...prev]; next[index] = null; return next })
      return
    }
    const candidates = feedPoolRef.current.filter(c => !usedIdsRef.current.has(c.id))
    if (candidates.length === 0) {
      setPins(prev => { const next = [...prev]; next[index] = null; return next })
      return
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    usedIdsRef.current.add(pick.id)
    setPins(prev => { const next = [...prev]; next[index] = pick; return next })
  }, [])

  const changeChannel = useCallback((dir: number) => {
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

  // Glitch scheduler — occasional random events
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>
    const sched = () => {
      const delay = 9000 + Math.random() * 22000
      tid = setTimeout(() => {
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

  const ch = CHANNELS[chIdx]
  const roomGlow = switching ? 'rgba(20,20,20,0.05)' : SLOT_GLOW[chIdx]

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
          // Aged, yellowed plastic — warm cream-brown, not pure wood
          background:'linear-gradient(160deg, #3a3018 0%, #28200e 55%, #1c1808 85%, #161305 100%)',
          borderRadius:16,
          boxShadow:[
            '0 28px 80px rgba(0,0,0,0.95)',
            '0 8px 24px rgba(0,0,0,0.7)',
            'inset 0 1px 0 rgba(255,255,200,0.05)',
            'inset 0 -1px 0 rgba(0,0,0,0.4)',
            // TV glow on cabinet face
            '0 0 120px rgba(140,110,50,0.12)',
          ].join(', '),
          padding:'22px 22px 16px',
        }}>

          {/* Cabinet top — dust accumulation gradient */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:24,
            background:'linear-gradient(to bottom, rgba(0,0,0,0.15), transparent)',
            borderRadius:'16px 16px 0 0',
            pointerEvents:'none',
          }} />

          {/* Brand plate */}
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

          {/* Scratches overlay on cabinet */}
          <div style={{
            position:'absolute', inset:0,
            background:'repeating-linear-gradient(82deg, transparent, transparent 60px, rgba(255,255,255,0.007) 60px, rgba(255,255,255,0.007) 61px)',
            borderRadius:16,
            pointerEvents:'none',
          }} />

          {/* Screen bezel */}
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
            {/* Screen + CRT layers */}
            <div style={{
              position:'relative',
              aspectRatio:'4/3',
              // CRT curvature — slightly rounded corners
              borderRadius:6,
              overflow:'hidden',
              background:'#000',
              // Screen flicker via animation
              animation:'screen-flicker 6s ease-in-out infinite',
              // Slight screen glow bleed
              boxShadow:'inset 0 0 30px rgba(0,0,0,0.5)',
            }}>
              {/* Channel content */}
              {switching
                ? <StaticScreen />
                : <WorldFeedChannel key={chIdx} info={pins[chIdx]} onDead={() => replaceChannel(chIdx)} soundOn={soundOn} onRequestSound={() => setSoundOn(true)} />}

              {/* Phosphor noise */}
              <PhosphorOverlay />

              {/* Scanlines — slight opacity variation creates imperfection */}
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

              {/* CRT curvature mask — soft curved edges */}
              <div style={{
                position:'absolute', inset:0, pointerEvents:'none', zIndex:5,
                background:'radial-gradient(ellipse 100% 100% at center, transparent 72%, rgba(0,0,0,0.55) 88%, rgba(0,0,0,0.85) 100%)',
              }} />

              {/* Chromatic aberration — very subtle color fringe at edges */}
              <div style={{
                position:'absolute', inset:0, pointerEvents:'none', zIndex:6,
                background:'linear-gradient(90deg, rgba(255,0,0,0.025) 0%, transparent 8%, transparent 92%, rgba(0,80,255,0.025) 100%)',
                mixBlendMode:'screen',
              }} />

              {/* Glass surface — diagonal glare highlight */}
              <div style={{
                position:'absolute', inset:0, pointerEvents:'none', zIndex:7,
                background:'linear-gradient(135deg, rgba(255,255,240,0.055) 0%, rgba(255,255,240,0.018) 28%, transparent 50%)',
              }} />
              {/* Glass — faint edge highlight suggesting curvature */}
              <div style={{
                position:'absolute', inset:0, pointerEvents:'none', zIndex:7,
                boxShadow:'inset 1px 1px 0 rgba(255,255,220,0.06), inset -1px -1px 0 rgba(0,0,0,0.3)',
              }} />

              {/* Glitch overlay */}
              <GlitchOverlay type={glitch} tearY={tearY} />

              {/* Channel readout */}
              <div style={{
                position:'absolute', top:5, right:7, zIndex:8,
                fontFamily:'monospace', fontSize:'clamp(9px,1.5vw,13px)',
                color:'rgba(34,197,94,0.65)',
                letterSpacing:'0.08em',
                textShadow:'0 0 10px rgba(34,197,94,0.4)',
              }}>CH {ch}</div>
            </div>
          </div>

          {/* Controls row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4px' }}>
            {/* Speaker grille — more bars, slightly worn */}
            <div style={{ display:'flex', gap:2.5 }}>
              {Array.from({length: 9}).map((_,i) => (
                <div key={i} style={{
                  width:2.5, height:20,
                  background:`rgba(255,255,200,${0.04 + (i % 3 === 1 ? 0.02 : 0)})`,
                  borderRadius:1,
                }} />
              ))}
            </div>

            {/* Channel selector */}
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
              }}>CH<br />{ch}</div>
              <button onClick={() => changeChannel(1)} style={{
                width:34, height:34, borderRadius:'50%',
                background:'linear-gradient(145deg, #3a3020, #1e1808)',
                border:'1px solid #120f05',
                color:'rgba(255,240,180,0.5)', fontSize:12, cursor:'pointer',
                boxShadow:'0 3px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,180,0.06)',
              }}>▼</button>
            </div>

            {/* Power indicator + service sticker */}
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

          {/* Legs */}
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

        {/* Instruction hint */}
        <div style={{
          position:'fixed', bottom:22, left:'50%', transform:'translateX(-50%)',
          fontFamily:'monospace', fontSize:8, color:'rgba(255,255,200,0.14)',
          letterSpacing:'0.12em',
        }}>↑ ↓  or  ▲ ▼  to change channel</div>
      </div>
    </>
  )
}
