'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── Channel definitions ─────────────────────────────────────────────────────
const CHANNELS = [2, 4, 7, 9, 13, 22, 44, 66, 88]

// ── Static noise canvas ─────────────────────────────────────────────────────
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
        const v = Math.random() * 200
        img.data[i] = img.data[i+1] = img.data[i+2] = v; img.data[i+3] = 255
      }
      ctx.putImageData(img, 0, 0)
      raf.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf.current)
  }, [])
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
}

// ── News ticker ─────────────────────────────────────────────────────────────
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
    <div style={{ width: '100%', height: '100%', background: '#0a1628', color: '#e8e8e8', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', fontSize: 'clamp(8px,1.2vw,13px)', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{ background: '#cc0000', padding: '3px 10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', fontWeight: 700, letterSpacing: '0.08em' }}>
        <span>KWND NEWS 4</span><span>{s.time}</span>
      </div>
      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '8px 10px 4px' }}>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 8px', marginBottom: 4 }}>
          <div style={{ fontWeight: 700, lineHeight: 1.3, color: '#fff', fontSize: '1em' }}>{s.headline}</div>
          <div style={{ color: '#aaa', fontSize: '0.78em', marginTop: 2 }}>{s.sub}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: '0.75em' }}>
          <div style={{ background: '#cc0000', padding: '1px 6px', fontWeight: 700 }}>LIVE</div>
          <div style={{ color: '#aaa' }}>{s.anchor} REPORTING</div>
        </div>
      </div>
      {/* Ticker */}
      <div style={{ background: '#cc0000', padding: '3px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-block', transform: `translateX(${tickerX}px)`, fontSize: '0.78em', fontWeight: 600, letterSpacing: '0.05em' }}>
          {tickerText} · {tickerText}
        </span>
      </div>
    </div>
  )
}

// ── Infomercial ─────────────────────────────────────────────────────────────
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
    <div style={{ width: '100%', height: '100%', background: '#1a0040', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 16, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ color: '#ffcc00', fontSize: 'clamp(9px,1.5vw,16px)', fontWeight: 900, marginBottom: 8, lineHeight: 1.2, letterSpacing: '0.04em' }}>{p.title}</div>
      <div style={{ color: '#e0e0e0', fontSize: 'clamp(7px,1.1vw,12px)', marginBottom: 12, lineHeight: 1.5, maxWidth: 260 }}>{p.body}</div>
      <div style={{ background: '#cc0000', color: '#fff', padding: '4px 12px', fontWeight: 700, fontSize: 'clamp(7px,1.1vw,11px)', letterSpacing: '0.06em' }}>{p.cta}</div>
    </div>
  )
}

// ── Nature documentary ──────────────────────────────────────────────────────
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
    <div style={{ width: '100%', height: '100%', background: '#0d1a0a', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12, fontFamily: 'Georgia, serif' }}>
      <div style={{ background: 'rgba(0,0,0,0.7)', padding: '6px 10px', borderLeft: '3px solid #4a8' }}>
        <div style={{ color: '#d4e8c4', fontSize: 'clamp(8px,1.2vw,13px)', lineHeight: 1.6, fontStyle: 'italic' }}>
          {NARRATION[line]}
        </div>
      </div>
      <div style={{ fontSize: 'clamp(6px,0.9vw,9px)', color: 'rgba(150,200,130,0.4)', marginTop: 4, letterSpacing: '0.1em' }}>
        NATURE HOUR · SECTOR 04-Δ
      </div>
    </div>
  )
}

// ── Emergency alert ─────────────────────────────────────────────────────────
function EmergencyChannel() {
  const [blink, setBlink] = useState(true)
  useEffect(() => {
    const iv = setInterval(() => setBlink(b => !b), 900)
    return () => clearInterval(iv)
  }, [])
  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 16, fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {['#f00','#fa0','#ff0','#0f0','#0af','#00f','#a0f'].map((c,i) => (
          <div key={i} style={{ width: 'clamp(12px,3vw,24px)', height: 'clamp(20px,5vw,40px)', background: c }} />
        ))}
      </div>
      <div style={{ color: blink ? '#ff4400' : '#aa2200', fontSize: 'clamp(9px,1.6vw,16px)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8, textAlign: 'center' }}>
        ⚠ EMERGENCY ALERT SYSTEM ⚠
      </div>
      <div style={{ color: '#e0e0e0', fontSize: 'clamp(7px,1.1vw,11px)', textAlign: 'center', lineHeight: 1.7, maxWidth: 260 }}>
        THIS IS NOT A TEST.<br />
        AN UNMAPPED OBJECT HAS BEEN DETECTED<br />
        IN YOUR IMMEDIATE VICINITY.<br />
        <span style={{ color: '#aaa' }}>PROCEED NORMALLY. DO NOT ACKNOWLEDGE IT.</span><br />
        THIS MESSAGE WILL NOT REPEAT.
      </div>
      <div style={{ marginTop: 10, fontSize: 'clamp(6px,0.9vw,9px)', color: 'rgba(255,100,50,0.4)', letterSpacing: '0.15em' }}>
        BROADCAST AUTHORITY · CHANNEL 13
      </div>
    </div>
  )
}

// ── Kids show ───────────────────────────────────────────────────────────────
function KidsChannel() {
  const [t, setT] = useState(0)
  const SEGMENTS = [
    { bg: '#ff6eb4', text: "Hi! I'm MR. STATIC! Can you say hello? Great! You're doing so well!", color: '#fff' },
    { bg: '#ffd700', text: "Today we're going to count all the objects in the survey! Ready? 47... 46... 44... Hmm.", color: '#333' },
    { bg: '#98fb98', text: "Mr. Static's favorite color is the color of an abandoned room in the afternoon.", color: '#333' },
    { bg: '#9370db', text: "Let's play a game! Find the door! It has been in the same place the whole time. Have you found it? Good.", color: '#fff' },
    { bg: '#1a1a2e', text: "...Mr. Static will be right back.", color: 'rgba(255,255,255,0.3)' },
  ]
  useEffect(() => {
    const iv = setInterval(() => setT(v => (v + 1) % SEGMENTS.length), 5000)
    return () => clearInterval(iv)
  }, [])
  const s = SEGMENTS[t]
  return (
    <div style={{ width: '100%', height: '100%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, transition: 'background 0.5s', textAlign: 'center', fontFamily: '"Comic Sans MS", cursive, Arial' }}>
      <div style={{ color: s.color, fontSize: 'clamp(9px,1.4vw,14px)', lineHeight: 1.7, transition: 'color 0.5s', maxWidth: 260 }}>{s.text}</div>
    </div>
  )
}

// ── Test pattern ─────────────────────────────────────────────────────────────
function TestPattern() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 3, display: 'flex' }}>
        {['#fff','#ff0','#0ff','#0f0','#f0f','#f00','#00f'].map((c,i) => (
          <div key={i} style={{ flex: 1, background: c }} />
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex' }}>
        {['#00f','#000','#f0f','#000','#0ff','#000','#fff'].map((c,i) => (
          <div key={i} style={{ flex: 1, background: c }} />
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 12px', fontFamily: 'monospace', fontSize: 'clamp(7px,1vw,10px)', letterSpacing: '0.2em' }}>
          TECHNICAL DIFFICULTIES · PLEASE STAND BY
        </div>
      </div>
    </div>
  )
}

// ── Security cams ───────────────────────────────────────────────────────────
function SecurityChannel() {
  const [t, setT] = useState(0)
  useEffect(() => { const iv = setInterval(() => setT(v => v + 1), 2000); return () => clearInterval(iv) }, [])
  const CAMS = [
    { id: 'CAM 1', loc: 'SECTOR 02 — TRAIL HEAD', color: '#224' },
    { id: 'CAM 2', loc: 'DEPTH-02 — LEVEL 3', color: '#142' },
    { id: 'CAM 3', loc: 'CORRIDOR B-07 — MID', color: '#221' },
    { id: 'CAM 4', loc: 'FREQ 88.7 — ORIGIN', color: '#321' },
  ]
  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0a', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2, padding: 2 }}>
      {CAMS.map((cam, i) => (
        <div key={i} style={{ background: cam.color, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)' }} />
          <div style={{ position: 'absolute', top: 3, left: 4, fontFamily: 'monospace', fontSize: 'clamp(6px,0.9vw,9px)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>
            {cam.id} · {cam.loc}
          </div>
          <div style={{ position: 'absolute', bottom: 3, right: 4, fontFamily: 'monospace', fontSize: 'clamp(5px,0.8vw,8px)', color: 'rgba(255,255,255,0.35)' }}>
            {String(Math.floor((t * 2) % 60)).padStart(2,'0')}:{String(Math.floor(t % 60)).padStart(2,'0')}
          </div>
          {i === 3 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: `rgba(255,200,100,${0.4 + Math.sin(t * 0.8) * 0.35})`, boxShadow: '0 0 12px rgba(255,200,100,0.6)' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Portal channel (88) ──────────────────────────────────────────────────────
function PortalChannel({ onNavigate }: { onNavigate: () => void }) {
  const [count, setCount] = useState(5)
  useEffect(() => {
    const iv = setInterval(() => setCount(c => {
      if (c <= 1) { clearInterval(iv); onNavigate(); return 0 }
      return c - 1
    }), 1000)
    return () => clearInterval(iv)
  }, [onNavigate])
  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <div style={{ color: 'rgba(34,197,94,0.8)', fontSize: 'clamp(8px,1.2vw,13px)', letterSpacing: '0.2em', marginBottom: 8 }}>FREQUENCY 88.7</div>
      <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 'clamp(6px,0.9vw,9px)', letterSpacing: '0.3em', marginBottom: 20 }}>SIGNAL ACQUIRED</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(7px,1vw,10px)' }}>ROUTING IN {count}...</div>
    </div>
  )
}

// ── Main world ──────────────────────────────────────────────────────────────
export default function World3Broadcast() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [chIdx, setChIdx] = useState(1) // start on CH4 news
  const [switching, setSwitching] = useState(false)

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

  const ch = CHANNELS[chIdx]

  const screenContent = () => {
    if (switching) return <StaticScreen />
    switch (ch) {
      case 2: return <StaticScreen />
      case 4: return <NewsChannel />
      case 7: return <NatureChannel />
      case 9: return <InfomercialChannel />
      case 13: return <EmergencyChannel />
      case 22: return <KidsChannel />
      case 44: return <TestPattern />
      case 66: return <SecurityChannel />
      case 88: return <PortalChannel onNavigate={() => navigateTo(15 as WorldId, { type: 'chromatic' as PortalType })} />
      default: return <StaticScreen />
    }
  }

  return (
    <div data-world="3" style={{
      position: 'fixed', inset: 0, background: '#1a1008',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <HomeButton />

      {/* TV cabinet */}
      <div style={{
        position: 'relative',
        width: 'min(620px, 88vw)',
        background: 'linear-gradient(160deg, #4a3d2a 0%, #2e2518 60%, #1e1810 100%)',
        borderRadius: 18,
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
        padding: '24px 24px 18px',
      }}>
        {/* Screen bezel */}
        <div style={{
          background: '#111',
          borderRadius: 8,
          padding: 6,
          boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.9), 0 0 0 2px #333',
          marginBottom: 14,
        }}>
          {/* Screen */}
          <div style={{
            position: 'relative',
            aspectRatio: '4/3',
            borderRadius: 4,
            overflow: 'hidden',
            background: '#000',
          }}>
            {screenContent()}
            {/* Scanlines overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
            }} />
            {/* CRT vignette */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)',
            }} />
            {/* Channel display */}
            <div style={{
              position: 'absolute', top: 6, right: 8,
              fontFamily: 'monospace', fontSize: 'clamp(9px,1.5vw,14px)',
              color: 'rgba(34,197,94,0.7)',
              letterSpacing: '0.1em', textShadow: '0 0 8px rgba(34,197,94,0.5)',
            }}>CH {ch}</div>
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          {/* Speaker grille */}
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({length: 6}).map((_,i) => (
              <div key={i} style={{ width: 3, height: 22, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }} />
            ))}
          </div>
          {/* Channel controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => changeChannel(-1)} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(145deg, #555, #333)',
              border: '1px solid #222', color: '#aaa', fontSize: 14, cursor: 'pointer',
              boxShadow: '0 3px 6px rgba(0,0,0,0.5)',
            }}>▲</button>
            <div style={{
              fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.4,
            }}>CH<br />{ch}</div>
            <button onClick={() => changeChannel(1)} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(145deg, #555, #333)',
              border: '1px solid #222', color: '#aaa', fontSize: 14, cursor: 'pointer',
              boxShadow: '0 3px 6px rgba(0,0,0,0.5)',
            }}>▼</button>
          </div>
          {/* Power indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a3', boxShadow: '0 0 6px #1f5' }} />
            <div style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>PWR</div>
          </div>
        </div>

        {/* TV legs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px', marginTop: 6 }}>
          {[0,1].map(i => (
            <div key={i} style={{ width: 14, height: 16, background: 'linear-gradient(to bottom, #2e2518, #1a1208)', borderRadius: '0 0 4px 4px' }} />
          ))}
        </div>
      </div>

      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.18)',
        letterSpacing: '0.12em',
      }}>↑ ↓  or  ▲ ▼  to change channel</div>
    </div>
  )
}
