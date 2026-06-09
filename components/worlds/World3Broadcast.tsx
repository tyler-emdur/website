'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

const CHANNELS = [2, 4, 7, 9, 13, 22, 44, 66, 88]

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

// ── News ─────────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'LOCAL MAN FINDS DOOR · DOOR UNCLEAR ABOUT SITUATION',
  'WEATHER: WEATHER EXPECTED TO CONTINUE · DETAILS AT 11',
  'FREQUENCY 88.7 REPORTS UNUSUAL ACTIVITY · INVESTIGATION PENDING',
  'BOULDER ELEVATION REMAINS 5,430 FT · NO PLANS TO CHANGE',
  'SURVEY TE-∅ OBJECTS INDEXED: 47 · VERIFICATION INCOMPLETE',
  'REPORT: MOST OBJECTS MOVING TOWARD SOMETHING · SIGNIFICANCE DISPUTED',
  'COORDINATES 40.0150°N 105.2705°W — CLASSIFIED',
  'ARCHIVES PARTIALLY RECOVERED · CONTEXT STILL MISSING',
  'ANOMALY DETECTED IN SECTOR 03-Ω · DO NOT APPROACH',
  'THIS HAS BEEN A BROADCAST',
]

function NewsChannel() {
  const [story, setStory] = useState(0)
  const [tickerX, setTickerX] = useState(0)
  const tickerText = TICKER_ITEMS.join(' · · · ')
  const STORIES = [
    { headline: 'REPORTS: FAMILIAR PLACE BECOMES UNRECOGNIZABLE AFTER PROLONGED OBSERVATION', sub: 'Experts disagree on cause. Some call it "Tuesday."', anchor: 'K. MARSH', time: '11:03 PM' },
    { headline: 'OBJECT CATALOGUED AS SIGNIFICANT — SIGNIFICANCE STILL UNSPECIFIED', sub: 'Database entry pending review for third consecutive quarter.', anchor: 'K. MARSH', time: '11:06 PM' },
    { headline: 'DOOR REQUIRING FORM FOUND TO CONTAIN ANOTHER FORM', sub: 'Citizens describe situation as "expected, somehow."', anchor: 'K. MARSH', time: '11:09 PM' },
    { headline: 'LOCAL FREQUENCY CONTINUES BROADCASTING TO NO ACKNOWLEDGED RECEIVER', sub: 'Signal strength: elevated. Content: unclassified.', anchor: 'K. MARSH', time: '11:12 PM' },
  ]
  useEffect(() => {
    const iv = setInterval(() => setStory(s => (s + 1) % STORIES.length), 8000)
    return () => clearInterval(iv)
  }, [])
  useEffect(() => {
    let x = 0
    const iv = setInterval(() => {
      x = (x - 1.5) % (tickerText.length * 8)
      setTickerX(x)
    }, 30)
    return () => clearInterval(iv)
  }, [tickerText])
  const s = STORIES[story]
  return (
    <div style={{ width:'100%', height:'100%', background:'#0a1628', color:'#e8e8e8', display:'flex', flexDirection:'column', fontFamily:'Arial, sans-serif', fontSize:'clamp(8px,1.2vw,13px)', overflow:'hidden' }}>
      <div style={{ background:'#cc0000', padding:'3px 10px', display:'flex', justifyContent:'space-between', fontSize:'0.85em', fontWeight:700, letterSpacing:'0.08em' }}>
        <span>KWND NEWS 4</span><span>{s.time}</span>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'8px 10px 4px' }}>
        <div style={{ background:'rgba(0,0,0,0.5)', padding:'4px 8px', marginBottom:4 }}>
          <div style={{ fontWeight:700, lineHeight:1.3, color:'#fff', fontSize:'1em' }}>{s.headline}</div>
          <div style={{ color:'#aaa', fontSize:'0.78em', marginTop:2 }}>{s.sub}</div>
        </div>
        <div style={{ display:'flex', gap:8, fontSize:'0.75em' }}>
          <div style={{ background:'#cc0000', padding:'1px 6px', fontWeight:700 }}>LIVE</div>
          <div style={{ color:'#aaa' }}>{s.anchor} REPORTING</div>
        </div>
      </div>
      <div style={{ background:'#cc0000', padding:'3px 0', overflow:'hidden', whiteSpace:'nowrap' }}>
        <span style={{ display:'inline-block', transform:`translateX(${tickerX}px)`, fontSize:'0.78em', fontWeight:600, letterSpacing:'0.05em' }}>
          {tickerText} · {tickerText}
        </span>
      </div>
    </div>
  )
}

// ── Infomercial ──────────────────────────────────────────────────────────────
function InfomercialChannel() {
  const [page, setPage] = useState(0)
  const PAGES = [
    { title: 'ARE YOU TIRED OF HAVING TOO MANY DOORS?', body: 'Introducing DOOR-LESS™, the revolutionary solution that eliminates all your doors and replaces them with the memory of doors.', cta: 'CALL NOW: 1-800-NO-DOORS' },
    { title: 'TESTIMONIAL', body: '"I used DOOR-LESS™ and now I can\'t find the room. But I remember it perfectly." — K. from somewhere. Results not typical. Room may be irretrievable.', cta: 'ORDER IN THE NEXT 47 MINUTES' },
    { title: 'BUT WAIT — THERE\'S MORE', body: 'Order now and receive a FREE bottle of CERTAINTY (1 oz). WARNING: Contents disputed. Do not open if you prefer things the way they are.', cta: '$19.99 + S&H (S&H: $847.00)' },
    { title: 'THE DOOR-LESS™ SYSTEM', body: 'Step 1: Identify your doors. Step 2: Remember them fondly. Step 3: Proceed.', cta: 'OPERATORS ARE STANDING BY (PROBABLY)' },
  ]
  useEffect(() => {
    const iv = setInterval(() => setPage(p => (p + 1) % PAGES.length), 6000)
    return () => clearInterval(iv)
  }, [])
  const p = PAGES[page]
  return (
    <div style={{ width:'100%', height:'100%', background:'#1a0040', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:16, textAlign:'center', fontFamily:'Arial, sans-serif' }}>
      <div style={{ color:'#ffcc00', fontSize:'clamp(9px,1.5vw,16px)', fontWeight:900, marginBottom:8, lineHeight:1.2, letterSpacing:'0.04em' }}>{p.title}</div>
      <div style={{ color:'#e0e0e0', fontSize:'clamp(7px,1.1vw,12px)', marginBottom:12, lineHeight:1.5, maxWidth:260 }}>{p.body}</div>
      <div style={{ background:'#cc0000', color:'#fff', padding:'4px 12px', fontWeight:700, fontSize:'clamp(7px,1.1vw,11px)', letterSpacing:'0.06em' }}>{p.cta}</div>
    </div>
  )
}

// ── Nature ───────────────────────────────────────────────────────────────────
function NatureChannel() {
  const [line, setLine] = useState(0)
  const NARRATION = [
    'Here, in the deepest part of the index, the unclassified object waits.',
    'It has no natural predators. Largely because no one has confirmed it exists.',
    'The survey team observed it for eleven minutes before their instruments disagreed.',
    'When approached, it becomes the same size as the distance between two thoughts.',
    'Remarkably, it appears to be transmitting on frequency 88.7.',
    'We do not know if it is aware of the camera.',
    '...It may be aware of the camera.',
  ]
  useEffect(() => {
    const iv = setInterval(() => setLine(l => (l + 1) % NARRATION.length), 5500)
    return () => clearInterval(iv)
  }, [])
  return (
    <div style={{ width:'100%', height:'100%', background:'#0d1a0a', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:12, fontFamily:'Georgia, serif' }}>
      <div style={{ background:'rgba(0,0,0,0.7)', padding:'6px 10px', borderLeft:'3px solid #4a8' }}>
        <div style={{ color:'#d4e8c4', fontSize:'clamp(8px,1.2vw,13px)', lineHeight:1.6, fontStyle:'italic' }}>
          {NARRATION[line]}
        </div>
      </div>
      <div style={{ fontSize:'clamp(6px,0.9vw,9px)', color:'rgba(150,200,130,0.4)', marginTop:4, letterSpacing:'0.1em' }}>
        NATURE HOUR · SECTOR 04-Δ
      </div>
    </div>
  )
}

// ── Emergency ────────────────────────────────────────────────────────────────
function EmergencyChannel() {
  const [blink, setBlink] = useState(true)
  useEffect(() => {
    const iv = setInterval(() => setBlink(b => !b), 900)
    return () => clearInterval(iv)
  }, [])
  return (
    <div style={{ width:'100%', height:'100%', background:'#000', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:16, fontFamily:'monospace' }}>
      <div style={{ display:'flex', gap:3, marginBottom:12 }}>
        {['#f00','#fa0','#ff0','#0f0','#0af','#00f','#a0f'].map((c,i) => (
          <div key={i} style={{ width:'clamp(12px,3vw,24px)', height:'clamp(20px,5vw,40px)', background:c }} />
        ))}
      </div>
      <div style={{ color:blink ? '#ff4400' : '#aa2200', fontSize:'clamp(9px,1.6vw,16px)', fontWeight:700, letterSpacing:'0.12em', marginBottom:8, textAlign:'center' }}>
        ⚠ EMERGENCY ALERT SYSTEM ⚠
      </div>
      <div style={{ color:'#e0e0e0', fontSize:'clamp(7px,1.1vw,11px)', textAlign:'center', lineHeight:1.7, maxWidth:260 }}>
        THIS IS NOT A TEST.<br />
        AN UNMAPPED OBJECT HAS BEEN DETECTED<br />
        IN YOUR IMMEDIATE VICINITY.<br />
        <span style={{ color:'#aaa' }}>PROCEED NORMALLY. DO NOT ACKNOWLEDGE IT.</span><br />
        THIS MESSAGE WILL NOT REPEAT.
      </div>
      <div style={{ marginTop:10, fontSize:'clamp(6px,0.9vw,9px)', color:'rgba(255,100,50,0.4)', letterSpacing:'0.15em' }}>
        BROADCAST AUTHORITY · CHANNEL 13
      </div>
    </div>
  )
}

// ── Kids show ────────────────────────────────────────────────────────────────
function KidsChannel() {
  const [t, setT] = useState(0)
  const SEGMENTS = [
    { bg:'#ff6eb4', text:"Hi! I'm MR. STATIC! Can you say hello? Great! You're doing so well!", color:'#fff' },
    { bg:'#ffd700', text:"Today we're going to count all the objects in the survey! Ready? 47... 46... 44... Hmm.", color:'#333' },
    { bg:'#98fb98', text:"Mr. Static's favorite color is the color of an abandoned room in the afternoon.", color:'#333' },
    { bg:'#9370db', text:"Let's play a game! Find the door! It has been in the same place the whole time. Have you found it? Good.", color:'#fff' },
    { bg:'#1a1a2e', text:"...Mr. Static will be right back.", color:'rgba(255,255,255,0.3)' },
  ]
  useEffect(() => {
    const iv = setInterval(() => setT(v => (v + 1) % SEGMENTS.length), 5000)
    return () => clearInterval(iv)
  }, [])
  const s = SEGMENTS[t]
  return (
    <div style={{ width:'100%', height:'100%', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:16, transition:'background 0.5s', textAlign:'center', fontFamily:'"Comic Sans MS", cursive, Arial' }}>
      <div style={{ color:s.color, fontSize:'clamp(9px,1.4vw,14px)', lineHeight:1.7, transition:'color 0.5s', maxWidth:260 }}>{s.text}</div>
    </div>
  )
}

// ── Test pattern ─────────────────────────────────────────────────────────────
function TestPattern() {
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ flex:3, display:'flex' }}>
        {['#fff','#ff0','#0ff','#0f0','#f0f','#f00','#00f'].map((c,i) => (
          <div key={i} style={{ flex:1, background:c }} />
        ))}
      </div>
      <div style={{ flex:1, display:'flex' }}>
        {['#00f','#000','#f0f','#000','#0ff','#000','#fff'].map((c,i) => (
          <div key={i} style={{ flex:1, background:c }} />
        ))}
      </div>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
        <div style={{ background:'rgba(0,0,0,0.7)', color:'#fff', padding:'4px 12px', fontFamily:'monospace', fontSize:'clamp(7px,1vw,10px)', letterSpacing:'0.2em' }}>
          TECHNICAL DIFFICULTIES · PLEASE STAND BY
        </div>
      </div>
    </div>
  )
}

// ── Security cams — each feed has its own hardware identity ──────────────────
function SecurityChannel() {
  const [t, setT] = useState(0)
  // Uneasy state — independent per-camera events
  const [cam01drift, setCam01drift] = useState(false)
  const [cam03bar, setCam03bar] = useState(-1) // y% of interference bar, -1 = none
  const [cam04frozen, setCam04frozen] = useState(false)
  const [frozenSec, setFrozenSec] = useState(0)
  const [anomalyLabel, setAnomalyLabel] = useState<number | null>(null) // which cam shows wrong label

  useEffect(() => {
    const iv = setInterval(() => setT(v => v + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  // CAM 01: occasional frame roll / horizontal drift
  useEffect(() => {
    const sched = () => {
      const d = 14000 + Math.random() * 22000
      setTimeout(() => {
        setCam01drift(true)
        setTimeout(() => { setCam01drift(false); sched() }, 220 + Math.random() * 180)
      }, d)
    }
    sched()
  }, [])

  // CAM 03: dirty lens — interference bar appears and disappears
  useEffect(() => {
    const sched = () => {
      const d = 4000 + Math.random() * 9000
      setTimeout(() => {
        setCam03bar(15 + Math.floor(Math.random() * 60))
        setTimeout(() => { setCam03bar(-1); sched() }, 180 + Math.random() * 340)
      }, d)
    }
    sched()
  }, [])

  // CAM 04: feed freezes for a few seconds
  useEffect(() => {
    const sched = () => {
      const d = 18000 + Math.random() * 35000
      setTimeout(() => {
        setFrozenSec(t)
        setCam04frozen(true)
        setTimeout(() => { setCam04frozen(false); sched() }, 2800 + Math.random() * 3500)
      }, d)
    }
    sched()
  }, [])

  // Anomalous label change — one camera shows a different label for ~80ms
  useEffect(() => {
    const sched = () => {
      const d = 25000 + Math.random() * 45000
      setTimeout(() => {
        setAnomalyLabel(Math.floor(Math.random() * 4))
        setTimeout(() => { setAnomalyLabel(null); sched() }, 80)
      }, d)
    }
    sched()
  }, [])

  const fmt = (s: number) => `${String(Math.floor(s / 60) % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

  const cam04time = cam04frozen ? frozenSec : t
  // CAM 01: occasionally shows negative timestamp for one second
  const cam01TimeStr = (anomalyLabel === 0) ? `-00:${String(t % 60).padStart(2,'0')}` : fmt(t)

  return (
    <div style={{ width:'100%', height:'100%', background:'#060606', display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:2, padding:2 }}>

      {/* CAM 01 — archive feed, cool/blue, low contrast */}
      <div style={{ background:'#0b111e', position:'relative', overflow:'hidden', transform: cam01drift ? 'translateY(2px)' : 'none', transition: cam01drift ? 'none' : 'transform 0.1s' }}>
        {/* Subtle blue tint overlay */}
        <div style={{ position:'absolute', inset:0, background:'rgba(20,40,80,0.18)' }} />
        {/* Horizontal drift bars */}
        <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg, transparent, transparent 14px, rgba(100,140,200,0.025) 14px, rgba(100,140,200,0.025) 15px)' }} />
        {/* Low-contrast scanlines */}
        <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)' }} />
        <div style={{ position:'absolute', top:3, left:4, fontFamily:'monospace', fontSize:'clamp(5px,0.8vw,8px)', color:'rgba(140,170,220,0.55)', letterSpacing:'0.06em' }}>
          {anomalyLabel === 0 ? 'NULL FEED / UNASSIGNED' : 'ARCHIVE FEED A-1 / SEC A-07'}
        </div>
        <div style={{ position:'absolute', top:3, right:4, fontFamily:'monospace', fontSize:'clamp(5px,0.7vw,7px)', color:'rgba(120,150,200,0.4)' }}>
          REC ● {cam01TimeStr}
        </div>
        {/* Faded scene — just darkness with a very faint horizon line */}
        <div style={{ position:'absolute', bottom:'38%', left:0, right:0, height:1, background:'rgba(80,100,140,0.12)' }} />
        <div style={{ position:'absolute', bottom:3, left:4, fontFamily:'monospace', fontSize:'clamp(4px,0.65vw,6px)', color:'rgba(100,130,180,0.3)', letterSpacing:'0.08em' }}>
          SIGNAL DEGRADED
        </div>
      </div>

      {/* CAM 02 — green phosphor monochrome, surveillance */}
      <div style={{ background:'#040a04', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,30,0,0.3)' }} />
        {/* Tight green scanlines */}
        <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,20,0,0.3) 2px, rgba(0,20,0,0.3) 3px)' }} />
        {/* Surveillance crosshair */}
        <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'rgba(0,180,0,0.06)' }} />
        <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'rgba(0,180,0,0.06)' }} />
        {/* Corner crosshair marks */}
        {[[8,8],[8,'calc(100% - 8px)'],['calc(100% - 8px)',8],['calc(100% - 8px)','calc(100% - 8px)']].map(([x,y],i) => (
          <div key={i} style={{
            position:'absolute', left:x as string|number, top:y as string|number,
            width:6, height:6,
            borderTop: i < 2 ? '1px solid rgba(0,160,0,0.25)' : 'none',
            borderBottom: i >= 2 ? '1px solid rgba(0,160,0,0.25)' : 'none',
            borderLeft: [0,2].includes(i) ? '1px solid rgba(0,160,0,0.25)' : 'none',
            borderRight: [1,3].includes(i) ? '1px solid rgba(0,160,0,0.25)' : 'none',
            transform: i < 2 ? 'translateY(-50%)' : 'translateY(50%)',
          }} />
        ))}
        <div style={{ position:'absolute', top:3, left:4, fontFamily:'monospace', fontSize:'clamp(5px,0.8vw,8px)', color:'rgba(0,180,0,0.55)', letterSpacing:'0.06em' }}>
          {anomalyLabel === 1 ? '??? / UNRESOLVED' : 'SRV-02 / LEVEL -3'}
        </div>
        <div style={{ position:'absolute', top:3, right:4, fontFamily:'monospace', fontSize:'clamp(5px,0.7vw,7px)', color:'rgba(0,160,0,0.4)' }}>
          {String(Math.floor(t / 3600)).padStart(2,'0')}:{fmt(t)}
        </div>
        <div style={{ position:'absolute', bottom:3, left:4, fontFamily:'monospace', fontSize:'clamp(4px,0.65vw,6px)', color:'rgba(0,150,0,0.35)', letterSpacing:'0.1em' }}>
          MOTION: NONE
        </div>
      </div>

      {/* CAM 03 — dirty lens, intermittent interference */}
      <div style={{ background:'#100c0a', position:'relative', overflow:'hidden' }}>
        {/* Dirty lens: darkened edges, brownish cast */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 65% at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
        {/* Warm tint suggesting old camera lens */}
        <div style={{ position:'absolute', inset:0, background:'rgba(40,20,0,0.15)' }} />
        {/* Scanlines */}
        <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.14) 3px, rgba(0,0,0,0.14) 4px)' }} />
        {/* Interference bar */}
        {cam03bar >= 0 && (
          <div style={{
            position:'absolute', top:`${cam03bar}%`, left:0, right:0,
            height:3,
            background:'linear-gradient(90deg, transparent, rgba(255,220,150,0.4) 20%, rgba(255,240,200,0.5) 50%, rgba(255,220,150,0.4) 80%, transparent)',
          }} />
        )}
        <div style={{ position:'absolute', top:3, left:4, fontFamily:'monospace', fontSize:'clamp(5px,0.8vw,8px)', color:'rgba(200,160,100,0.45)', letterSpacing:'0.06em' }}>
          {anomalyLabel === 2 ? 'FEED ORIGIN / UNKNOWN' : 'CAM-03 / SECTOR B-07'}
        </div>
        <div style={{ position:'absolute', top:3, right:4, fontFamily:'monospace', fontSize:'clamp(5px,0.7vw,7px)', color:'rgba(180,140,80,0.35)' }}>
          {fmt(t + 3)}
        </div>
        <div style={{ position:'absolute', bottom:3, left:4, fontFamily:'monospace', fontSize:'clamp(4px,0.65vw,6px)', color: cam03bar >= 0 ? 'rgba(255,160,60,0.6)' : 'rgba(160,120,60,0.25)', letterSpacing:'0.08em' }}>
          {cam03bar >= 0 ? 'INTERFERENCE DETECTED' : 'ARCHIVE FEED'}
        </div>
      </div>

      {/* CAM 04 — overexposed, signal instability, 88.7MHz origin */}
      <div style={{ background:'#100a04', position:'relative', overflow:'hidden' }}>
        {/* Overexposed center glow */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 55% 50% at center, rgba(255,220,160,0.08) 0%, transparent 70%)' }} />
        {/* Signal instability — washed edges */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(200,160,80,0.06) 0%, transparent 30%, transparent 70%, rgba(200,160,80,0.04) 100%)' }} />
        {/* Scanlines */}
        <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)' }} />
        {/* The signal source — pulsing */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{
            width:5, height:5, borderRadius:'50%',
            background:`rgba(255,200,100,${cam04frozen ? 0.75 : (0.4 + Math.sin(t * 0.8) * 0.3)})`,
            boxShadow:`0 0 ${cam04frozen ? 20 : 12}px rgba(255,180,80,0.5)`,
            transition:'box-shadow 0.8s',
          }} />
        </div>
        <div style={{ position:'absolute', top:3, left:4, fontFamily:'monospace', fontSize:'clamp(5px,0.8vw,8px)', color:'rgba(220,170,80,0.5)', letterSpacing:'0.06em' }}>
          {anomalyLabel === 3 ? 'ORIGIN / ?' : 'FEED-04 / 88.7 MHz'}
        </div>
        <div style={{ position:'absolute', top:3, right:4, fontFamily:'monospace', fontSize:'clamp(5px,0.7vw,7px)', color:'rgba(200,150,60,0.4)' }}>
          {fmt(cam04time)}
        </div>
        <div style={{ position:'absolute', bottom:3, left:4, fontFamily:'monospace', fontSize:'clamp(4px,0.65vw,6px)', color: cam04frozen ? 'rgba(255,140,50,0.6)' : 'rgba(180,130,50,0.28)', letterSpacing:'0.08em' }}>
          {cam04frozen ? 'NO RECORD AVAILABLE' : 'SIGNAL SOURCE ACTIVE'}
        </div>
      </div>

    </div>
  )
}

// ── Portal (88) ───────────────────────────────────────────────────────────────
const CH88_TRANSMISSION = [
  'signal confirmed.',
  'this is not a scheduled broadcast.',
  '',
  'origin: field station · boulder co',
  'coordinates: 40.0150°N  105.2705°W',
  'altitude: 5430 ft',
  '',
  'you are not supposed to be on this frequency.',
  'neither are we.',
  '',
  'there is no portal.',
  'there was never a portal.',
  '',
  'there is only the signal',
  'and the decision to keep listening.',
  '',
  '— T.E.',
]

function PortalChannel() {
  const [count, setCount] = useState(5)
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [displayed, setDisplayed] = useState<string[]>([])
  const [curLine, setCurLine] = useState('')

  useEffect(() => {
    const iv = setInterval(() => setCount(c => {
      if (c <= 1) { clearInterval(iv); return 0 }
      return c - 1
    }), 1000)
    return () => clearInterval(iv)
  }, [])

  // Start transmission after countdown
  useEffect(() => {
    if (count !== 0) return
    let li = 0, ci = 0
    const iv = setInterval(() => {
      const line = CH88_TRANSMISSION[li]
      if (line === undefined) { clearInterval(iv); return }
      if (ci < line.length) {
        setCurLine(line.slice(0, ci + 1))
        ci++
      } else {
        setDisplayed(prev => [...prev, line])
        setCurLine('')
        setLineIdx(li + 1)
        li++; ci = 0
      }
    }, 40)
    return () => clearInterval(iv)
  }, [count])

  return (
    <div style={{ width:'100%', height:'100%', background:'#000', display:'flex', flexDirection:'column', fontFamily:'monospace', padding:'8px 10px', overflow:'hidden' }}>
      <div style={{ color:'rgba(34,197,94,0.7)', fontSize:'clamp(7px,1.1vw,11px)', letterSpacing:'0.25em', marginBottom:4 }}>FREQUENCY 88.7</div>
      <div style={{ flex:1, borderTop:'1px solid rgba(34,197,94,0.15)', paddingTop:6, overflowY:'hidden' }}>
        {count > 0 ? (
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'clamp(7px,1vw,10px)', letterSpacing:'0.1em', marginTop:4 }}>
            ROUTING IN {count}...
          </div>
        ) : (
          <div>
            {displayed.map((l, i) => (
              <div key={i} style={{ color: l.startsWith('—') ? 'rgba(34,197,94,0.5)' : l === '' ? undefined : 'rgba(200,240,200,0.7)', fontSize:'clamp(6px,0.9vw,9px)', lineHeight:1.9, minHeight:'1.2em', letterSpacing:'0.04em' }}>{l}</div>
            ))}
            {lineIdx < CH88_TRANSMISSION.length && (
              <div style={{ color:'rgba(200,240,200,0.7)', fontSize:'clamp(6px,0.9vw,9px)', lineHeight:1.9 }}>
                {curLine}<span style={{ opacity:0.5, animation:'txBlink 0.5s step-end infinite' }}>█</span>
              </div>
            )}
            <style>{`@keyframes txBlink{0%,100%{opacity:0.5}50%{opacity:0}}`}</style>
          </div>
        )}
      </div>
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

// ── Main world ───────────────────────────────────────────────────────────────
export default function World3Broadcast() {
  const [chIdx, setChIdx] = useState(1)
  const [switching, setSwitching] = useState(false)
  const [glitch, setGlitch] = useState<GlitchType>('none')
  const [tearY, setTearY] = useState(40)

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
  const screenContent = () => {
    if (switching) return <StaticScreen />
    switch (ch) {
      case 2:  return <StaticScreen />
      case 4:  return <NewsChannel />
      case 7:  return <NatureChannel />
      case 9:  return <InfomercialChannel />
      case 13: return <EmergencyChannel />
      case 22: return <KidsChannel />
      case 44: return <TestPattern />
      case 66: return <SecurityChannel />
      case 88: return <PortalChannel />
      default: return <StaticScreen />
    }
  }

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
        {/* Screen glow spreading into room */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse 55% 45% at 50% 48%, rgba(160,120,60,0.10) 0%, rgba(100,80,30,0.04) 45%, transparent 72%)',
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
              {screenContent()}

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
