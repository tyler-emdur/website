'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'

const CHANNELS = [2, 4, 7, 9, 11, 13, 99]
const PROJECT_SLIDES = [
  { name: 'DIGGER', desc: 'Spotify music discovery engine. 47 objects in the universe.', year: '2024', stack: 'Next.js · Spotify API · Zustand' },
  { name: 'THIS SITE', desc: 'An anti-portfolio. 9 worlds. You\'re in one now.', year: '2025', stack: 'Next.js · Three.js · React Three Fiber' },
  { name: 'RUNNING LOG', desc: 'Personal trail running tracker and analytics.', year: '2024', stack: 'Python · Strava API · SQLite' },
]

function StaticScreen() {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = 480; c.height = 360
    function draw() {
      const d = ctx.createImageData(480, 360)
      for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.random() < 0.4 ? 200 : Math.floor(Math.random() * 60)
        d.data[i] = v; d.data[i+1] = v; d.data[i+2] = v; d.data[i+3] = 255
      }
      ctx.putImageData(d, 0, 0)
      for (let y = 0; y < 360; y += 2) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, y, 480, 1)
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
        <span style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 12, color: '#fff' }}>
          {quotes[idx]}
        </span>
      </div>
    </div>
  )
}

const TYLER_CONTENT = [
  "Tyler Emdur is a software engineer living in Boulder, Colorado. He builds things for the internet and runs trails on weekends.",
  "His current projects include Digger, a music discovery application, and this website, which has more going on than it appears.",
  "He has run Pikes Peak, summited Mt. Elbert at four in the morning, and deployed code at two in the morning. Sometimes the same week.",
  "He is looking for: interesting problems to solve, people who care about what they're making, and a good trail recommendation.",
  "Contact: healthreinvented at gmail dot com.",
]

const NEWS_QUOTES = [
  "LOCAL BUILDER DEPLOYS AT 2AM, CITES 'MOMENTUM' AS PRIMARY MOTIVATION",
  "BOULDER TRAIL RUNNER DISCOVERS THAT ALTITUDE MAKES EVERYTHING HARDER, CONTINUES ANYWAY",
  "SOFTWARE ENGINEER BUILDS PORTFOLIO AS MULTI-WORLD ARG EXPERIENCE",
  "DIGGER.APP LAUNCHES — 'MUSIC DISCOVERY FOR PEOPLE WHO ACTUALLY CARE ABOUT MUSIC'",
  "47 OBJECTS IN THE UNIVERSE CONFIRMED BY INDEPENDENT SOURCES",
  "ANNUAL REMINDER THAT THE BEST LINE OF CODE YOU EVER WROTE DELETED 400 LINES",
  "WEATHER UPDATE: ABOVE TREELINE CONDITIONS REMAIN HORIZONTAL AND PERSONAL",
  "MAROON BELLS VISITOR NOTES LIGHT AT 5AM LOOKS LIKE 'FIRE FROM INSIDE THE ROCK'",
]

export default function World3Broadcast() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [channel, setChannel] = useState(2)
  const [knobAngle, setKnobAngle] = useState(0)
  const [slideIdx, setSlideIdx] = useState(0)
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [ttsIdx, setTtsIdx] = useState(0)

  useEffect(() => {
    const idx = CHANNELS.indexOf(channel)
    setKnobAngle(idx * (180 / (CHANNELS.length - 1)) - 90)
  }, [channel])

  useEffect(() => {
    if (channel !== 4) return
    const iv = setInterval(() => setSlideIdx(i => (i + 1) % PROJECT_SLIDES.length), 4000)
    return () => clearInterval(iv)
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

  const handleKnobClick = useCallback((e: React.MouseEvent) => {
    const idx = CHANNELS.indexOf(channel)
    const nextIdx = (idx + 1) % CHANNELS.length
    if (CHANNELS[nextIdx] === 99) {
      navigateTo(8, { type: 'slide-right' })
    } else {
      setChannel(CHANNELS[nextIdx])
    }
  }, [channel, navigateTo])

  const renderScreen = () => {
    switch (channel) {
      case 2:
        return (
          <div style={{ width: '100%', height: '100%', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
            <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>PUBLIC ACCESS · CHANNEL 2</div>
            <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 15, lineHeight: 1.9, color: 'rgba(255,255,255,0.8)', textAlign: 'center', maxWidth: 380, fontStyle: 'italic', minHeight: 80, transition: 'opacity 0.5s' }}>
              {TYLER_CONTENT[ttsIdx]}
            </div>
          </div>
        )
      case 4:
        return (
          <div style={{ width: '100%', height: '100%', background: '#050510', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
            <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(100,150,255,0.5)', marginBottom: 24 }}>PROJECTS · CHANNEL 4</div>
            <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{PROJECT_SLIDES[slideIdx].name}</div>
            <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 16, maxWidth: 360 }}>{PROJECT_SLIDES[slideIdx].desc}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(100,150,255,0.4)', letterSpacing: '0.1em' }}>{PROJECT_SLIDES[slideIdx].stack}</div>
            <div style={{ position: 'absolute', bottom: 10, right: 14, fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>{slideIdx + 1}/{PROJECT_SLIDES.length}</div>
          </div>
        )
      case 7:
        return (
          <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <StaticScreen />
            <div style={{ position: 'absolute', bottom: 20, fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em' }}>
              TO REACH US: 04-15-92-65-35-89 — 97
            </div>
          </div>
        )
      case 9:
        return (
          <div style={{ width: '100%', height: '100%', background: '#0a0500', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 22, fontWeight: 700, color: '#fff' }}>THE DAILY SIGNAL</div>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>EST. 2024 · BOULDER, CO</div>
            </div>
            <div style={{ position: 'absolute', top: 70, left: 0, right: 0, borderTop: '2px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <NewsTicker quotes={NEWS_QUOTES} />
            </div>
            <div style={{ position: 'absolute', top: 120, left: 20, right: 20, bottom: 20 }}>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.2, marginBottom: 12 }}>
                LOCAL ENGINEER BUILDS ANTI-PORTFOLIO WEBSITE, DENIES IT IS A PORTFOLIO
              </div>
              <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 12, lineHeight: 1.8, color: 'rgba(255,255,255,0.45)' }}>
                Sources close to the project confirm the site contains "at minimum nine discrete realities." When reached for comment, the developer said only: "you'll find it."
              </div>
            </div>
          </div>
        )
      case 11:
        return (
          <iframe
            src="https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=0&rel=0"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )
      case 13:
        return showPortfolio ? (
          <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>LOADING SIGNAL</div>
            <div style={{ width: 200, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'rgba(255,255,255,0.5)', animation: 'tvLoad 90s linear forwards', width: '0%' }} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>PLEASE HOLD</div>
            <style>{`@keyframes tvLoad { to { width: 100% } }`}</style>
          </div>
        )
      default:
        return <StaticScreen />
    }
  }

  return (
    <div
      data-world="3"
      style={{
        position: 'fixed', inset: 0,
        background: '#0d0d0d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Libre Baskerville", serif',
      }}
    >
      {/* TV set */}
      <div style={{
        position: 'relative',
        width: 'min(90vw, 700px)',
        background: '#1c1208',
        border: '3px solid #2a1e0e',
        borderRadius: 16,
        padding: '24px 24px 32px',
        boxShadow: '0 0 80px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.05)',
      }}>
        {/* Channel label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
          <div style={{ fontFamily: '"Libre Baskerville", serif', fontSize: 11, color: 'rgba(255,200,100,0.5)', letterSpacing: '0.2em' }}>PUBLIC ACCESS TELEVISION</div>
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'rgba(255,200,100,0.7)', background: '#000', padding: '2px 10px', border: '1px solid rgba(255,200,100,0.2)' }}>
            CH {channel === 99 ? '??' : channel.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Screen */}
        <div style={{
          position: 'relative',
          paddingTop: '56.25%',
          background: '#000',
          border: '4px solid #0d0a05',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
        }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            {renderScreen()}
          </div>
          {/* Scanline overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
          }} />
          {/* Screen glare */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '30%', pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          }} />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          {/* Channel buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: '70%' }}>
            {CHANNELS.filter(c => c !== 99).map(ch => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                style={{
                  background: channel === ch ? 'rgba(255,200,100,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${channel === ch ? 'rgba(255,200,100,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: channel === ch ? 'rgba(255,200,100,0.9)' : 'rgba(255,255,255,0.35)',
                  fontFamily: 'monospace', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
                  letterSpacing: '0.1em', borderRadius: 2,
                  transition: 'all 0.15s',
                }}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Dial knob */}
          <div
            onClick={handleKnobClick}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #3a2a10, #1a1005)',
              border: '2px solid rgba(100,70,30,0.5)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.3s',
              transform: `rotate(${knobAngle}deg)`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ width: 3, height: 18, background: 'rgba(255,200,100,0.4)', borderRadius: 2, marginTop: -8 }} />
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 20, fontFamily: '"Libre Baskerville", serif', fontSize: 10, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.2em' }}>
        TURN THE DIAL PAST CH13
      </div>
    </div>
  )
}
