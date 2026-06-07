'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

const CHANNELS = [2, 4, 7, 9, 11, 13, 14, 88, 99]

const QUIZ_QUESTIONS = [
  { q: 'How many objects are in the universe?', opts: ['42', '47', '∞', '13'], correct: 1, wrong: ['close', 'too round', 'check your math'] },
  { q: "What is Boulder's elevation?", opts: ['2,000 ft', '3,400 ft', '5,430 ft', '14,000 ft'], correct: 2, wrong: ['keep guessing', 'sea level is showing', "that's Elbert"] },
  { q: 'Which world has mannequins?', opts: ['World 3', 'World 7', 'World 11', 'All of them'], correct: 1, wrong: ['no', 'try again', "you're in World 3"] },
  { q: 'The best line of code you wrote was:', opts: ['The first one', 'The one that deleted 400 lines', 'The one nobody reviewed', 'No answer'], correct: 1, wrong: ['incorrect', 'try the other one', 'bold choice'] },
  { q: 'What does DIGGER do?', opts: ['Digs holes', 'Finds music', 'Mines data', 'Delivers static'], correct: 1, wrong: ['no', 'technically yes but no', 'not really'] },
]

const SHOP_ITEMS = [
  { name: 'REGRET (UNOPENED)', price: '$0.00', stock: 'surplus', btn: 'ADD TO CART', result: 'already in cart\n(was always in cart)' },
  { name: 'ONE PERFECT TUESDAY', price: '$44.00', stock: 'last one', btn: 'BUY NOW', result: 'sold to someone else\n3 seconds ago' },
  { name: 'THE ORIGINAL WORRY', price: 'free', stock: 'overstock', btn: 'CLAIM', result: 'you already have this\ncheck your pockets' },
  { name: 'MOMENTUM (BOTTLED)', price: '$12.99', stock: 'limited', btn: 'PURCHASE', result: 'dispensing...\n[bottle is empty]\n[this is normal]' },
  { name: 'CERTAINTY', price: '$999.99', stock: '0 in stock', btn: 'NOTIFY ME', result: 'you have been notified\n(this is not certainty)' },
  { name: 'THE FEELING AT 5AM\nABOVE TREELINE', price: 'priceless', stock: 'cannot ship', btn: 'INQUIRE', result: 'you have to go there\nno substitutes' },
]

const TYLER_CONTENT = [
  "Tyler Emdur is a software engineer living in Boulder, Colorado. He builds things for the internet and runs trails on weekends.",
  "His current projects include Digger, a music discovery application, and this website, which has more going on than it appears.",
  "He has run Pikes Peak, summited Mt. Elbert at four in the morning, and deployed code at two in the morning. Sometimes the same week.",
  "He is looking for: interesting problems to solve, people who care about what they're making, and a good trail recommendation.",
  "Contact: healthreinvented at gmail dot com.",
]

const NEWS_QUOTES = [
  "LOCAL BUILDER DEPLOYS AT 2AM, CITES 'MOMENTUM' AS PRIMARY MOTIVATION",
  "BOULDER TRAIL RUNNER DISCOVERS ALTITUDE MAKES EVERYTHING HARDER, CONTINUES ANYWAY",
  "SOFTWARE ENGINEER BUILDS PORTFOLIO AS MULTI-WORLD ARG EXPERIENCE",
  "DIGGER.APP LAUNCHES — MUSIC DISCOVERY FOR PEOPLE WHO ACTUALLY CARE",
  "47 OBJECTS IN THE UNIVERSE CONFIRMED BY INDEPENDENT SOURCES",
  "ANNUAL REMINDER: BEST LINE OF CODE YOU EVER WROTE DELETED 400 LINES",
  "WEATHER UPDATE: ABOVE TREELINE CONDITIONS REMAIN HORIZONTAL AND PERSONAL",
]

function StaticCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = 480; c.height = 360
    function draw() {
      const d = ctx.createImageData(480, 360)
      for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.random() < 0.35 ? 180 + Math.random() * 60 : Math.floor(Math.random() * 40)
        d.data[i] = v; d.data[i+1] = v; d.data[i+2] = v; d.data[i+3] = 255
      }
      ctx.putImageData(d, 0, 0)
      for (let y = 0; y < 360; y += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, y, 480, 1)
      }
      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf.current)
  }, [])
  return <canvas ref={ref} style={{ width: '100%', height: '100%', imageRendering: 'pixelated', display: 'block' }} />
}

function NewsTicker({ quotes }: { quotes: string[] }) {
  const [idx, setIdx] = useState(0)
  const [pos, setPos] = useState(480)
  const rafRef = useRef(0)
  const posRef = useRef(480)
  const idxRef = useRef(0)
  const textRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function tick() {
      posRef.current -= 1.5
      if (textRef.current && posRef.current < -(textRef.current.offsetWidth + 50)) {
        idxRef.current = (idxRef.current + 1) % quotes.length
        setIdx(idxRef.current)
        posRef.current = 480
      }
      setPos(posRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [quotes])
  return (
    <div style={{ position: 'relative', height: 28, background: '#0a0a2a', overflow: 'hidden', borderTop: '1px solid rgba(255,255,100,0.3)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: '#cc0000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        <span style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.1em' }}>LIVE</span>
      </div>
      <div ref={textRef} style={{ position: 'absolute', left: pos, top: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', height: '100%', paddingLeft: 90 }}>
        <span style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 12, color: '#fff' }}>{quotes[idx]}</span>
      </div>
    </div>
  )
}

const CHANNEL_GLOW: Record<number, string> = {
  2: '#1a2a8a',
  4: '#3a1a6a',
  7: '#6a2a0a',
  9: '#1a3a6a',
  11: '#1a2a5a',
  13: '#2a2a2a',
  88: '#0a3a1a',
}

export default function World3Broadcast() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [channel, setChannel] = useState(2)
  const [transitioning, setTransitioning] = useState(false)
  const [knobAngle, setKnobAngle] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const [ttsIdx, setTtsIdx] = useState(0)
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [qIdx, setQIdx] = useState(0)
  const [qScore, setQScore] = useState(0)
  const [qAnswered, setQAnswered] = useState<number | null>(null)
  const [qWrongIdx, setQWrongIdx] = useState(0)
  const [shopResult, setShopResult] = useState<string | null>(null)
  const [shopIdx, setShopIdx] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const idx = CHANNELS.indexOf(channel)
    setKnobAngle(idx * (200 / (CHANNELS.length - 1)) - 100)
  }, [channel])

  useEffect(() => {
    if (channel !== 2) return
    const iv = setInterval(() => setTtsIdx(i => (i + 1) % TYLER_CONTENT.length), 5000)
    return () => clearInterval(iv)
  }, [channel])

  useEffect(() => {
    if (channel !== 13) return
    const t = setTimeout(() => setShowPortfolio(true), 90000)
    return () => clearTimeout(t)
  }, [channel])

  const changeChannel = useCallback((direction: 1 | -1 = 1) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      const idx = CHANNELS.indexOf(channel)
      const nextIdx = (idx + direction + CHANNELS.length) % CHANNELS.length
      const next = CHANNELS[nextIdx]
      if (next === 99) {
        navigateTo(8, { type: 'slide-right' })
      } else if (next === 14) {
        navigateTo(14, { type: 'chromatic' })
      } else if (next === 88) {
        navigateTo(15, { type: 'chromatic' })
      } else {
        setChannel(next)
        setTransitioning(false)
      }
    }, 320)
  }, [channel, transitioning, navigateTo])

  const glowColor = CHANNEL_GLOW[channel] || '#1a1a1a'

  const renderScreen = () => {
    if (transitioning) return <StaticCanvas />
    switch (channel) {
      case 2:
        return (
          <div style={{ width: '100%', height: '100%', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
            <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 10, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 18 }}>PUBLIC ACCESS · CHANNEL 2</div>
            <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 14, lineHeight: 1.9, color: 'rgba(255,255,255,0.8)', textAlign: 'center', maxWidth: 380, fontStyle: 'italic', minHeight: 80 }}>
              {TYLER_CONTENT[ttsIdx]}
            </div>
          </div>
        )
      case 4: {
        const q = QUIZ_QUESTIONS[qIdx % QUIZ_QUESTIONS.length]
        return (
          <div style={{ width: '100%', height: '100%', background: '#080020', display: 'flex', flexDirection: 'column', padding: '14px 18px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,200,100,0.6)' }}>★ QUIZ NIGHT WITH DEREK ★</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,200,100,0.5)' }}>SCORE: {qScore}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 13, color: '#fff', lineHeight: 1.4, textAlign: 'center' }}>{q.q}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                {q.opts.map((opt, i) => {
                  const isCorrect = i === q.correct
                  const isSelected = qAnswered === i
                  let bg = 'rgba(255,255,255,0.06)'; let border = 'rgba(255,255,255,0.12)'; let color = 'rgba(255,255,255,0.7)'
                  if (qAnswered !== null) {
                    if (isCorrect) { bg = 'rgba(100,255,100,0.12)'; border = 'rgba(100,255,100,0.5)'; color = '#6fff6f' }
                    else if (isSelected) { bg = 'rgba(255,80,80,0.1)'; border = 'rgba(255,80,80,0.4)'; color = '#ff8080' }
                  }
                  return (
                    <button key={i} onClick={() => {
                      if (qAnswered !== null) return
                      setQAnswered(i)
                      if (isCorrect) setQScore(s => s + 1)
                      else setQWrongIdx(w => w + 1)
                      setTimeout(() => { setQAnswered(null); setQIdx(n => n + 1) }, 1800)
                    }} style={{ background: bg, border: `1px solid ${border}`, color, fontFamily: '"Libre Baskerville", serif', fontSize: 10, padding: '7px 9px', cursor: qAnswered !== null ? 'default' : 'pointer', letterSpacing: '0.03em', textAlign: 'left', transition: 'all 0.2s' }}>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {qAnswered !== null && (
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: qAnswered === q.correct ? 'rgba(100,255,100,0.7)' : 'rgba(255,150,80,0.7)', textAlign: 'center', letterSpacing: '0.1em' }}>
                  {qAnswered === q.correct ? 'CORRECT' : q.wrong[qWrongIdx % q.wrong.length]}
                </div>
              )}
            </div>
          </div>
        )
      }
      case 7:
        return (
          <div style={{ width: '100%', height: '100%', background: '#0a0500', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: '#cc0000', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.08em' }}>IMPOSSIBLES HOME SHOPPING</div>
              <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em' }}>OPERATORS STANDING BY (PROBABLY)</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {SHOP_ITEMS.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: shopIdx === i ? 'rgba(255,200,50,0.06)' : 'rgba(0,0,0,0.3)', border: `1px solid ${shopIdx === i ? 'rgba(255,200,50,0.2)' : 'rgba(255,255,255,0.05)'}`, gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 10, color: 'rgba(255,255,255,0.8)', lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>{item.name}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(255,200,50,0.5)', marginTop: 2 }}>{item.price} · {item.stock}</div>
                    {shopIdx === i && shopResult && <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,150,80,0.7)', marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{shopResult}</div>}
                  </div>
                  <button onClick={() => { setShopIdx(i); setShopResult(item.result); setTimeout(() => { setShopIdx(null); setShopResult(null) }, 3000) }}
                    style={{ background: 'rgba(255,200,50,0.1)', border: '1px solid rgba(255,200,50,0.3)', color: 'rgba(255,200,50,0.8)', fontFamily: 'monospace', fontSize: 8, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.1em', flexShrink: 0 }}>
                    {item.btn}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      case 9:
        return (
          <div style={{ width: '100%', height: '100%', background: '#050510', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>THE DAILY SIGNAL</div>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>EST. 2024 · BOULDER, CO</div>
            </div>
            <div style={{ position: 'absolute', top: 60, left: 0, right: 0 }}><NewsTicker quotes={NEWS_QUOTES} /></div>
            <div style={{ position: 'absolute', top: 105, left: 18, right: 18, bottom: 16 }}>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.2, marginBottom: 10 }}>
                LOCAL ENGINEER BUILDS ANTI-PORTFOLIO WEBSITE, DENIES IT IS A PORTFOLIO
              </div>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 11, lineHeight: 1.8, color: 'rgba(255,255,255,0.45)' }}>
                Sources confirm the site contains "at minimum nine discrete realities." Developer said only: "you'll find it."
              </div>
            </div>
          </div>
        )
      case 11:
        return <iframe src="https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=0&rel=0" style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      case 13:
        return showPortfolio ? (
          <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em' }}>LOADING SIGNAL</div>
            <div style={{ width: 180, height: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'rgba(255,255,255,0.5)', animation: 'tvLoad 90s linear forwards', width: '0%' }} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.2em' }}>PLEASE HOLD</div>
          </div>
        )
      case 88:
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <StaticCanvas />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(0,0,0,0.5)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(34,197,94,0.6)', letterSpacing: '0.2em' }}>FM 88.0 — 108.0 · THE DIAL</div>
              <button onClick={() => navigateTo(15, { type: 'chromatic' })} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80', fontFamily: 'monospace', fontSize: 9, padding: '7px 14px', cursor: 'pointer', letterSpacing: '0.15em' }}>
                TUNE IN →
              </button>
            </div>
          </div>
        )
      default:
        return <StaticCanvas />
    }
  }

  return (
    <div
      data-world="3"
      style={{
        position: 'fixed', inset: 0,
        background: '#060402',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: '"Libre Baskerville", serif',
      }}
    >
      {/* Room atmosphere — TV light spills onto walls */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${glowColor}44, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'background 1.2s ease',
        zIndex: 0,
      }} />

      {/* Floor — subtle dark gradient at very bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%',
        background: 'linear-gradient(0deg, #030201 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Ceiling crease */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '12%',
        background: 'linear-gradient(180deg, #020100 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ─── TV SET ─── */}
      <div style={{ position: 'relative', zIndex: 1, width: 'min(88vw, 680px)' }}>

        {/* Antenna */}
        <div style={{
          position: 'absolute', top: -52, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 56, pointerEvents: 'none',
        }}>
          <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 22, height: 10, background: '#1e1810', borderRadius: '2px 2px 0 0' }} />
          <div style={{ position: 'absolute', bottom: 10, left: '50%', width: 2, height: 50, background: '#2a2218', transform: 'translateX(-50%) rotate(-22deg)', transformOrigin: 'bottom center', borderRadius: 1 }} />
          <div style={{ position: 'absolute', bottom: 10, left: '50%', width: 2, height: 50, background: '#2a2218', transform: 'translateX(-50%) rotate(22deg)', transformOrigin: 'bottom center', borderRadius: 1 }} />
        </div>

        {/* Housing */}
        <div style={{
          background: 'linear-gradient(160deg, #28200e 0%, #1a1408 40%, #120e04 100%)',
          borderRadius: '10px 10px 6px 6px',
          padding: '20px 22px 22px',
          boxShadow: `
            0 0 0 1px rgba(80,60,20,0.3),
            0 12px 80px rgba(0,0,0,0.95),
            0 4px 20px rgba(0,0,0,0.8),
            inset 0 1px 0 rgba(255,240,180,0.07),
            inset 0 -3px 6px rgba(0,0,0,0.5)
          `,
        }}>
          {/* Brand nameplate */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 10, color: 'rgba(200,180,110,0.3)', letterSpacing: '0.45em', textTransform: 'uppercase' }}>
              S I G N A L
            </span>
          </div>

          {/* Screen bezel + screen */}
          <div style={{
            background: '#0a0806',
            borderRadius: 6,
            padding: 10,
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
          }}>
            <div style={{
              position: 'relative',
              paddingTop: '60%',
              background: '#000',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: `
                inset 0 0 40px rgba(0,0,0,0.6),
                0 0 0 2px #0d0a06
              `,
            }}>
              {/* Content */}
              <div style={{ position: 'absolute', inset: 0 }}>
                {renderScreen()}
              </div>

              {/* Scanlines */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.09) 2px, rgba(0,0,0,0.09) 3px)',
              }} />

              {/* CRT vignette */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
                background: 'radial-gradient(ellipse 92% 92% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)',
              }} />

              {/* Screen glare */}
              <div style={{
                position: 'absolute', top: '6%', left: '6%', width: '28%', height: '22%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.035) 0%, transparent 100%)',
                borderRadius: '50%', pointerEvents: 'none', zIndex: 5,
              }} />

              {/* Channel number OSD */}
              <div style={{
                position: 'absolute', top: 8, right: 10,
                fontFamily: '"VT323", monospace', fontSize: 18,
                color: 'rgba(255,255,255,0.5)',
                pointerEvents: 'none', zIndex: 6, letterSpacing: '0.05em',
              }}>
                {channel.toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Control panel below screen */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 16, padding: '0 4px',
          }}>
            {/* Speaker grille */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ width: 52, height: 1.5, background: 'rgba(180,155,80,0.2)', borderRadius: 1 }} />
              ))}
            </div>

            {/* LED channel display */}
            <div style={{
              background: '#030200',
              border: '1px solid rgba(255,100,30,0.25)',
              borderRadius: 2,
              padding: '5px 16px',
              fontFamily: '"VT323", monospace', fontSize: 28,
              color: 'rgba(255,120,40,0.9)',
              letterSpacing: '0.1em',
              textShadow: '0 0 12px rgba(255,100,30,0.7)',
              minWidth: 90, textAlign: 'center',
            }}>
              CH {channel.toString().padStart(2, '0')}
            </div>

            {/* Knob cluster */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {/* Brightness knob — decorative */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'radial-gradient(circle at 32% 28%, #2e2416, #120e06)',
                border: '1px solid rgba(100,80,40,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
              }}>
                <div style={{ width: 2, height: 10, background: 'rgba(200,170,100,0.3)', borderRadius: 1, marginTop: -5 }} />
              </div>

              {/* Channel knob — interactive */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div
                  onClick={() => changeChannel(1)}
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'radial-gradient(circle at 33% 28%, #3e3018, #1a1206)',
                    border: '2px solid rgba(120,90,40,0.45)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: `rotate(${knobAngle}deg)`,
                    transition: 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
                    position: 'relative',
                  }}
                >
                  <div style={{ width: 2.5, height: 18, background: 'rgba(230,200,120,0.55)', borderRadius: 1, marginTop: -9 }} />
                </div>
                {showHint && (
                  <div style={{ fontSize: 7, color: 'rgba(200,170,100,0.3)', letterSpacing: '0.1em', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    CLICK TO CHANGE
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TV base/feet */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
          <div style={{ width: 40, height: 8, background: '#110e05', borderRadius: '0 0 4px 4px', boxShadow: '0 4px 12px rgba(0,0,0,0.8)' }} />
          <div style={{ width: 40, height: 8, background: '#110e05', borderRadius: '0 0 4px 4px', boxShadow: '0 4px 12px rgba(0,0,0,0.8)' }} />
        </div>
      </div>

      {/* Hint: CH14 CH88 beyond CH13 */}
      <div style={{
        position: 'absolute', bottom: 20,
        fontFamily: 'monospace', fontSize: 9,
        color: 'rgba(255,255,255,0.08)', letterSpacing: '0.2em',
        zIndex: 1,
      }}>
        CH 14 · CH 88 · BEYOND CH 13
      </div>

      <style>{`@keyframes tvLoad { to { width: 100% } }`}</style>
      <HomeButton />
    </div>
  )
}
