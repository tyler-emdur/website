'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useWorldStore, WorldId } from '@/lib/world-store'

/* ── Authentic early internet palette ── */
const NAVY = '#000066'
const P = '#7700bb'
const P2 = '#5500aa'
const YELLOW = '#ffff00'
const YELLOW_DIM = '#b8a038'
const BORDER = '#3333aa'
const BORDER_LIGHT = '#5a5a9a'
const BEIGE = '#eeeeee'
const BEIGE_DARK = '#dcdcdc'
const LINK = '#3366cc'
const GREEN = '#00ff00'
const GREEN_DIM = '#00aa00'

const SITE_LAUNCH = new Date('2026-06-01T00:00:00')
const img = (name: string) => `/retro/${name}.svg`

const QUOTES = [
  '"The web is more a social creation than a technical one." — Tim Berners-Lee',
  '"Best viewed in Netscape Navigator 4.0 at 800×600." — every site, 1998',
  '"This page is permanently under construction." — also every site, 1998',
  '"There are 17 worlds inside. Please do not feed them after midnight." — T.E.',
  '"Damage caused by creative overreach is not covered by warranty." — Captain\'s Log',
  '"If you can read this, your browser supports text. Congratulations." — Webmaster',
  '"The multiverse was not built in a day. Or was it? Time is weird here." — T.E.',
  '"Sign my guestbook. I will sign yours back. This is the social contract." — GeoCities, 1999',
  '"Running code is just writing that forgot it was supposed to be temporary." — T.E.',
  '"Boulder elevation: 5,430 ft. Attitude: higher." — local knowledge',
]

const WEATHER_LABELS: Record<number, string> = {
  0: 'clear', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'foggy', 48: 'rime fog', 51: 'light drizzle', 53: 'drizzle',
  55: 'heavy drizzle', 61: 'light rain', 63: 'rain', 65: 'heavy rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow', 80: 'showers',
  81: 'rain showers', 82: 'heavy showers', 85: 'snow showers', 95: 'thunderstorm',
}

interface WorldItem {
  id: number
  name: string
  bg: string
  ac: string
}

const ALL_WORLDS: WorldItem[] = [
  { id: 0, name: 'Surface', bg: '#000022', ac: '#00ff88' },
  { id: 1, name: 'Apartment', bg: '#0d001a', ac: '#ff00aa' },
  { id: 2, name: 'Depth', bg: '#000033', ac: '#00ffff' },
  { id: 3, name: 'Broadcast', bg: '#220022', ac: '#ff55ff' },
  { id: 4, name: 'Corridor', bg: '#111111', ac: '#aaaaaa' },
  { id: 5, name: 'Field Station', bg: '#002200', ac: '#55ff55' },
  { id: 6, name: 'Document', bg: '#332211', ac: '#ffaa00' },
  { id: 7, name: 'Mall', bg: '#440044', ac: '#ff0055' },
  { id: 8, name: 'Signal', bg: '#000044', ac: '#00ccff' },
  { id: 9, name: 'Contact', bg: '#220044', ac: '#aa55ff' },
  { id: 10, name: 'Darkroom', bg: '#110000', ac: '#ff2222' },
  { id: 11, name: 'Flicker', bg: '#222200', ac: '#ffff33' },
  { id: 12, name: 'Moth', bg: '#1a1a00', ac: '#cccc00' },
  { id: 13, name: 'Night Sky', bg: '#000022', ac: '#44bbff' },
  { id: 14, name: 'Pixel', bg: '#110022', ac: '#ff00bb' },
  { id: 15, name: 'Kitchen', bg: '#221100', ac: '#ff7700' },
  { id: 16, name: 'Attic', bg: '#111122', ac: '#9999ff' },
]

function daysSinceLaunch() {
  return Math.floor((Date.now() - SITE_LAUNCH.getTime()) / 86400000)
}

function getMoonPhase() {
  const lp = 2551443
  const ref = new Date('2024-01-11T11:57:00').getTime()
  const phase = ((Date.now() - ref) / 1000 % lp) / lp
  const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
  const ascii = ['( )', '(,)', '(D)', '(G)', '(O)', '(G)', '(C)', '(,)']
  const idx = Math.floor(phase * 8) % 8
  return { name: names[idx], symbol: ascii[idx], pct: Math.round(phase * 100) }
}

function PanelHeader({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: `linear-gradient(90deg, ${P} 0%, ${P2} 100%)`,
      padding: '3px 7px',
      color: YELLOW,
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: 1,
      borderBottom: `1px solid ${P}`,
      fontFamily: '"Arial Black", Arial, sans-serif',
      ...style
    }}>
      {label}
    </div>
  )
}

function MiniPanel({ label, children, style, headerStyle }: { label: string; children: React.ReactNode; style?: React.CSSProperties; headerStyle?: React.CSSProperties }) {
  return (
    <div style={{ border: `2px solid ${BORDER}`, margin: 4, background: '#000033', ...style }}>
      <PanelHeader label={label} style={headerStyle} />
      <div style={{ padding: '6px 8px' }}>{children}</div>
    </div>
  )
}

function WorldThumbnail({ world, onClick }: { world: WorldItem; onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')
    if (!cx) return

    // Draw retro pixel pattern
    cx.fillStyle = world.bg
    cx.fillRect(0, 0, 80, 60)

    // Draw random pixel noise
    cx.fillStyle = world.ac
    for (let i = 0; i < 16; i++) {
      cx.globalAlpha = Math.random() * 0.65 + 0.2
      cx.fillRect(Math.floor(Math.random() * 76) + 2, Math.floor(Math.random() * 56) + 2, 2, 2)
    }

    // Radial gradient glow
    cx.globalAlpha = 1
    const grad = cx.createRadialGradient(40, 30, 0, 40, 30, 16)
    grad.addColorStop(0, world.ac + 'cc')
    grad.addColorStop(1, 'transparent')
    cx.beginPath()
    cx.arc(40, 30, 16, 0, Math.PI * 2)
    cx.fillStyle = grad
    cx.fill()

    // Crosshairs
    cx.strokeStyle = 'rgba(255,255,255,0.18)'
    cx.lineWidth = 1
    cx.beginPath()
    cx.moveTo(40, 5)
    cx.lineTo(40, 55)
    cx.moveTo(5, 30)
    cx.lineTo(75, 30)
    cx.stroke()
  }, [world])

  return (
    <button onClick={onClick} className="wt" style={{
      flexShrink: 0, width: 84, height: 64, border: `2px groove ${BORDER_LIGHT}`,
      cursor: 'pointer', background: world.bg, display: 'block', position: 'relative', padding: 0
    }}>
      <canvas ref={canvasRef} width={80} height={60} style={{ display: 'block', width: '100%', height: '100%' }} />
      <div className="wlbl" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,.8)', color: '#00ccff', fontSize: 7,
        fontFamily: '"Press Start 2P", monospace', textAlign: 'center', padding: '1px 0'
      }}>
        W{world.id}: {world.name.slice(0, 8)}
      </div>
    </button>
  )
}

const NAV = [
  { icon: 'icon-doc', label: "What's New?", action: 'scroll' as const },
  { icon: 'rocket', label: 'Enter Universe', action: 'enter' as const },
  { icon: 'icon-download', label: 'Source Code', href: 'https://github.com/tyler-emdur' },
  { icon: 'icon-gear', label: 'Contact', href: 'mailto:tyler@tyleremdur.com' },
  { icon: 'globe', label: '17 Worlds', action: 'worlds' as const },
  { icon: 'icon-owl', label: "Captain's Log", action: 'log' as const },
]

export default function World0Surface() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [time, setTime] = useState('')
  const [count, setCount] = useState(10951)
  const [playing, setPlaying] = useState(false)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [weather, setWeather] = useState<{ temp: number; label: string } | null>(null)
  const [moon, setMoon] = useState(getMoonPhase)
  const [daysOld] = useState(daysSinceLaunch)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const go = useCallback(() => navigateTo(1, { type: 'door' }), [navigateTo])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  // Active Moon Phase Rotation
  useEffect(() => {
    const iv = setInterval(() => {
      setMoon(prev => {
        const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
        const ascii = ['( )', '(,)', '(D)', '(G)', '(O)', '(G)', '(C)', '(,)']
        const idx = names.indexOf(prev.name)
        const nextIdx = (idx + 1) % 8
        return {
          name: names[nextIdx],
          symbol: ascii[nextIdx],
          pct: Math.round(((nextIdx + 1) / 8) * 100)
        }
      })
    }, 4500)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      let h = d.getHours()
      const m = d.getMinutes().toString().padStart(2, '0')
      const ap = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setTime(`${h.toString().padStart(2, '0')}:${m} ${ap}`)
    }
    tick()
    const iv = setInterval(tick, 10000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() < 0.06) setCount(c => c + 1)
    }, 2500)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 12000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=40.0150&longitude=-105.2705&current=temperature_2m,weather_code&temperature_unit=fahrenheit')
      .then(r => r.json())
      .then(d => {
        const code = d?.current?.weather_code ?? 0
        const temp = Math.round(d?.current?.temperature_2m ?? 0)
        setWeather({ temp, label: WEATHER_LABELS[code] ?? 'unknown' })
      })
      .catch(() => setWeather({ temp: 0, label: 'offline' }))
  }, [])

  useEffect(() => {
    const cv = canvasRef.current
    const hero = heroRef.current
    if (!cv || !hero) return
    const cx = cv.getContext('2d')
    if (!cx) return

    let stars: { x: number; y: number; r: number; spd: number; tw: number; col: string; isCross: boolean }[] = []
    let raf = 0
    let lastTime = performance.now()

    // Comet and satellite state
    const comet = { x: -100, y: -100, vx: 0, vy: 0, active: false, timer: 3.0 }
    const uconSatellite = { x: -150, y: 70, active: false, timer: 12.0 }

    const planets = [
      { xPct: 0.16, yPct: 0.38, r: 8, col: '#ff5533', ring: true, ringCol: '#ffaa66' },
      { xPct: 0.74, yPct: 0.22, r: 12, col: '#33aaff', ring: false, ringCol: '' },
      { xPct: 0.88, yPct: 0.75, r: 5, col: '#ffcc33', ring: true, ringCol: '#eeee55' },
    ]

    const resize = () => {
      cv.width = hero.offsetWidth
      cv.height = hero.offsetHeight
      stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        r: Math.random() * 1.5 + 0.12,
        spd: Math.random() * 0.12 + 0.02,
        tw: Math.random() * Math.PI * 2,
        col: ['#ccccdd', '#aaaacc', '#bbaabb', '#aabbcc', '#cccaaa'][Math.floor(Math.random() * 5)],
        isCross: Math.random() < 0.08,
      }))
    }

    const frame = () => {
      const now = performance.now()
      const dt = (now - lastTime) / 1000
      lastTime = now

      cx.clearRect(0, 0, cv.width, cv.height)

      // 1. Stars (with twinkling)
      stars.forEach(s => {
        s.tw += 0.012
        s.x -= s.spd
        if (s.x < 0) s.x = cv.width
        
        cx.beginPath()
        if (s.isCross) {
          cx.strokeStyle = s.col
          cx.lineWidth = 0.8
          cx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(s.tw))
          cx.moveTo(s.x - 3, s.y)
          cx.lineTo(s.x + 3, s.y)
          cx.moveTo(s.x, s.y - 3)
          cx.lineTo(s.x, s.y + 3)
          cx.stroke()
        } else {
          cx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          cx.fillStyle = s.col
          cx.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(s.tw))
          cx.fill()
        }
      })
      cx.globalAlpha = 1

      // 2. Planets
      planets.forEach(p => {
        const px = p.xPct * cv.width
        const py = p.yPct * cv.height
        cx.beginPath()
        cx.arc(px, py, p.r, 0, Math.PI * 2)
        cx.fillStyle = p.col
        cx.fill()
        const grad = cx.createRadialGradient(px - p.r * 0.3, py - p.r * 0.3, 0, px, py, p.r)
        grad.addColorStop(0, 'rgba(255,255,255,0.25)')
        grad.addColorStop(0.5, 'transparent')
        grad.addColorStop(1, 'rgba(0,0,0,0.55)')
        cx.beginPath()
        cx.arc(px, py, p.r, 0, Math.PI * 2)
        cx.fillStyle = grad
        cx.fill()
        if (p.ring) {
          cx.strokeStyle = p.ringCol
          cx.lineWidth = 1.5
          cx.beginPath()
          cx.ellipse(px, py, p.r * 1.6, p.r * 0.45, -Math.PI / 8, 0, Math.PI * 2)
          cx.stroke()
        }
      })

      // 3. Comet
      if (!comet.active) {
        comet.timer -= dt
        if (comet.timer <= 0) {
          comet.active = true
          comet.x = Math.random() * cv.width * 0.6
          comet.y = 0
          comet.vx = Math.random() * 120 + 100
          comet.vy = Math.random() * 70 + 60
        }
      } else {
        const tailGrad = cx.createLinearGradient(comet.x, comet.y, comet.x - comet.vx * 0.12, comet.y - comet.vy * 0.12)
        tailGrad.addColorStop(0, 'rgba(255,255,255,0.7)')
        tailGrad.addColorStop(1, 'transparent')
        cx.strokeStyle = tailGrad
        cx.lineWidth = 1.5
        cx.beginPath()
        cx.moveTo(comet.x, comet.y)
        cx.lineTo(comet.x - comet.vx * 0.12, comet.y - comet.vy * 0.12)
        cx.stroke()
        comet.x += comet.vx * dt
        comet.y += comet.vy * dt
        if (comet.x > cv.width || comet.y > cv.height) {
          comet.active = false
          comet.timer = Math.random() * 12 + 8
        }
      }

      // 4. Under Construction Satellite (drifting every 30s)
      if (!uconSatellite.active) {
        uconSatellite.timer -= dt
        if (uconSatellite.timer <= 0) {
          uconSatellite.active = true
          uconSatellite.x = -100
          uconSatellite.y = Math.random() * (cv.height - 80) + 40
        }
      } else {
        uconSatellite.x += 35 * dt
        const sx = uconSatellite.x
        const sy = uconSatellite.y
        cx.fillStyle = '#33aaff'
        cx.fillRect(sx - 15, sy - 3, 6, 6)
        cx.fillRect(sx + 9, sy - 3, 6, 6)
        cx.strokeStyle = '#888'
        cx.lineWidth = 1
        cx.beginPath()
        cx.moveTo(sx - 9, sy)
        cx.lineTo(sx + 9, sy)
        cx.stroke()
        cx.fillStyle = '#bbbbbb'
        cx.beginPath()
        cx.arc(sx, sy, 4, 0, Math.PI * 2)
        cx.fill()
        cx.fillStyle = '#ffcc00'
        cx.fillRect(sx - 20, sy + 8, 40, 7)
        cx.strokeStyle = '#000'
        cx.lineWidth = 0.5
        cx.strokeRect(sx - 20, sy + 8, 40, 7)
        cx.fillStyle = '#000'
        cx.font = '5px monospace'
        cx.textAlign = 'center'
        cx.fillText('UNDER CONST', sx, sy + 13)
        if (uconSatellite.x > cv.width + 30) {
          uconSatellite.active = false
          uconSatellite.timer = 30.0
        }
      }

      raf = requestAnimationFrame(frame)
    }

    resize()
    frame()
    const ro = new ResizeObserver(resize)
    ro.observe(hero)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  const linkStyle: React.CSSProperties = { color: LINK, textDecoration: 'underline', cursor: 'pointer' }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      background: NAVY, fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 12,
      userSelect: 'none', border: '3px ridge #3333aa',
      backgroundImage: `radial-gradient(ellipse at 50% 0%, #110033 0%, transparent 60%), radial-gradient(ellipse at 0% 100%, #110022 0%, transparent 50%)`
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        .w0-link { color:${LINK}; text-decoration:underline; cursor:pointer; background:none; border:none; font:inherit; padding:0 }
        .w0-link:hover { color:${YELLOW} }
        .w0-link:visited { color:#8866aa }
        .w0-pixel { font-family:"Press Start 2P","Courier New",monospace }
        .w0-mono { font-family:"Courier New",monospace }
        .w0-img { image-rendering:pixelated; display:block }
        .w0-scroll::-webkit-scrollbar { width:10px; height:8px; background:#000033 }
        .w0-scroll::-webkit-scrollbar-thumb { background:#440088 }
        .w0-scroll::-webkit-scrollbar-button { background:#330066; height:12px }
        
        /* Windows 95 Outset Buttons */
        .w0-ibtn {
          display:block; background:linear-gradient(180deg,#ffff55,#cccc00);
          color:#000033; font-family:"Arial Black",Arial,sans-serif;
          font-size:11px; font-weight:900; text-align:center; text-decoration:none;
          padding:5px 8px; border:2px outset #ffff99; margin:3px; letter-spacing:1px; cursor:pointer;
          box-shadow: 1px 1px 0px #000;
        }
        .w0-ibtn:hover { filter:brightness(1.12) }
        .w0-ibtn:active { border-style:inset; transform:translate(1px,1px); box-shadow:none; }

        /* Enter Buttons - Retro Software Feel */
        .w0-ebtn {
          display:inline-block; padding:10px 24px;
          font-family:"Arial Black",Arial,sans-serif; font-size:15px; font-weight:900;
          text-transform:uppercase; border:3px outset #ffffff; cursor:pointer;
          letter-spacing:1px; text-align:center; line-height:1.1;
          box-shadow: 2px 2px 0px #000, inset 1px 1px 0px rgba(255,255,255,0.4);
          text-shadow: 1px 1px 0px #000;
        }
        .w0-ebtn:hover {
          filter:brightness(1.18);
          box-shadow: 0 0 6px rgba(0,255,0,0.6), inset 1px 1px 0px rgba(255,255,255,0.4);
        }
        .w0-ebtn:active {
          border-style:inset;
          transform:translate(1.5px, 1.5px);
          box-shadow: none;
        }

        .w0-npb {
          background:#111144; border:2px outset ${BORDER}; color:#fff;
          width:24px; height:19px; display:flex; align-items:center; justify-content:center;
          font-size:9px; cursor:pointer;
        }
        .w0-npb:active { border-style:inset }

        @keyframes w0-pulse { 0%,100%{opacity:1;box-shadow:0 0 6px #00ff00} 50%{opacity:.3;box-shadow:0 0 2px #00ff00} }
        .w0-led { animation:w0-pulse 2s ease-in-out infinite }
        
        @keyframes w0-spin { to { transform:rotate(360deg) } }
        .w0-spin { animation:w0-spin 9s linear infinite }
        
        @keyframes w0-blink { 50% { opacity:0 } }
        .w0-blink { animation:w0-blink 1.2s step-end infinite }
        
        @keyframes w0-construct {
          0% { background-position:0 0 }
          100% { background-position:40px 0 }
        }
        .w0-construct {
          height:14px;
          background:repeating-linear-gradient(-45deg,#c8a030,#c8a030 8px,#1a1028 8px,#1a1028 16px);
          background-size:40px 40px;
          animation:w0-construct 1s linear infinite;
          border-bottom:1px solid ${BORDER};
        }

        .w0-ticker-wrap { overflow:hidden; white-space:nowrap; }
        .w0-ticker { display:inline-block; animation:w0-scroll 32s linear infinite; color:#00ff00; font-family:"Courier New",monospace; font-size:11px; padding-left:100% }
        @keyframes w0-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-100%)} }
        
        /* White Welcome card with subtle CRT scanlines overlay */
        .w0-welcome {
          background-color:${BEIGE};
          border-right:2px solid ${BORDER};
          font-family:Arial,Helvetica,sans-serif;
          position:relative;
          overflow:hidden;
        }
        .w0-welcome::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.05),
            rgba(0, 0, 0, 0.05) 1px,
            transparent 1px,
            transparent 2px
          );
          pointer-events: none;
          z-index: 10;
        }

        .w0-welcome hr { border:none; border-top:1px solid #aaaaaa; margin:6px 0; position:relative; z-index:11; }
        .w0-wobble { display:inline-block; transform:rotate(-0.5deg) }
        
        /* World cards pulse on hover */
        .wt {
          flex-shrink: 0; width: 84px; height: 64px; border: 2px groove ${BORDER_LIGHT};
          cursor: pointer; position: relative; overflow: hidden;
          text-decoration: none; display: block;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .wt:hover {
          transform: scale(1.06);
          border-color: ${YELLOW} !important;
          box-shadow: 0 0 8px ${YELLOW};
          z-index: 20;
        }
        .wlbl {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(0,0,0,.85);
          color: #00ccff; font-size: 7px;
          font-family: 'Courier New', monospace;
          text-align: center; padding: 2px;
        }

        /* Title pixel CRT glow & fringe */
        .w0-title-crt {
          font-family: "Press Start 2P", "Courier New", monospace;
          font-size: clamp(15px, 2.5vw, 26px);
          color: #ffffff;
          text-shadow: 
            0 0 4px rgba(0, 255, 0, 0.6), 
            3px 0 0 rgba(255, 0, 0, 0.75), 
            -3px 0 0 rgba(0, 255, 255, 0.75), 
            4px 4px 0px #060012;
          letter-spacing: 1px;
          line-height: 1.45;
          filter: blur(0.3px);
        }

        /* Flashing Red Retro Ad Badge */
        @keyframes w0-flash-ad {
          0%, 49% { background-color: #ff0000; color: #ffffff; border-color: #ffff00; }
          50%, 100% { background-color: #ffff00; color: #ff0000; border-color: #ff0000; }
        }
        .w0-flash-ad {
          animation: w0-flash-ad 0.6s step-end infinite;
          border: 2px solid #ffff00;
          font-family: "Press Start 2P", sans-serif;
          font-size: 8px !important;
          padding: 2px 6px;
          font-weight: bold;
          display: inline-block;
          text-shadow: none;
          position:relative; z-index:11;
        }

        /* Rocket Drift Animation */
        @keyframes w0-rocket-drift {
          0%, 100% { transform: translateY(0) rotate(-18deg); }
          50% { transform: translateY(-7px) rotate(-16deg); }
        }
        .w0-rocket {
          animation: w0-rocket-drift 5.5s ease-in-out infinite;
        }

        /* Odometer Flicker Animation */
        @keyframes w0-flicker {
          0%, 100% { opacity: 1; }
          93% { opacity: 1; }
          94% { opacity: 0.88; }
          95% { opacity: 0.96; }
          96% { opacity: 0.78; }
          97% { opacity: 0.94; }
        }
        .w0-flicker {
          animation: w0-flicker 5.5s infinite;
        }

        /* Mainframe Shake Animation */
        @keyframes w0-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-2px, -2px) rotate(-0.4deg); }
          20% { transform: translate(2px, -1px) rotate(0.4deg); }
          30% { transform: translate(-1px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -2px) rotate(0.4deg); }
          50% { transform: translate(-2px, 1px) rotate(-0.4deg); }
          60% { transform: translate(2px, 2px) rotate(0deg); }
          72% { transform: translate(-1px, -1px) rotate(0.4deg); }
          80% { transform: translate(2px, -2px) rotate(-0.4deg); }
          90% { transform: translate(-2px, 2px) rotate(0deg); }
        }
        .w0-shake {
          animation: w0-shake 0.25s ease-in-out infinite;
        }

        /* === GIF-like Decorations === */
        @keyframes w0-star-spin {
          0%   { transform: rotate(0deg);   color: #ffff00; }
          25%  { transform: rotate(90deg);  color: #ff00ff; }
          50%  { transform: rotate(180deg); color: #00ffff; }
          75%  { transform: rotate(270deg); color: #ff8800; }
          100% { transform: rotate(360deg); color: #ffff00; }
        }
        .w0-gif-star { animation: w0-star-spin 0.9s linear infinite; display: inline-block; line-height: 1; user-select:none; }

        @keyframes w0-mail-bounce {
          0%,100% { transform: translateY(0) rotate(0deg); }
          30% { transform: translateY(-6px) rotate(-8deg); }
          60% { transform: translateY(-2px) rotate(4deg); }
        }
        .w0-gif-mail { animation: w0-mail-bounce 1.2s ease-in-out infinite; display: inline-block; }

        @keyframes w0-award-pulse {
          0%,100% { box-shadow: 0 0 6px #ffd700, 0 0 12px #ff8800; border-color: #ffd700; }
          50%      { box-shadow: 0 0 16px #fff, 0 0 28px #ffd700, 0 0 40px #ff8800; border-color: #fff; }
        }
        .w0-award { animation: w0-award-pulse 1.8s ease-in-out infinite; }

        @keyframes w0-rainbow {
          0%  { color: #ff0000; }
          17% { color: #ff8800; }
          33% { color: #ffff00; }
          50% { color: #00ff00; }
          67% { color: #0088ff; }
          83% { color: #cc00ff; }
          100%{ color: #ff0000; }
        }
        .w0-rainbow { animation: w0-rainbow 2.2s linear infinite; }

        @keyframes w0-cursor-blink {
          0%,49% { opacity: 1; }
          50%,100% { opacity: 0; }
        }
        .w0-cursor { animation: w0-cursor-blink 0.9s step-end infinite; font-weight:900; }
      `}</style>

      {/* Browser chrome */}
      <div style={{
        height: 40, background: 'linear-gradient(#ddd,#999)', display: 'flex',
        alignItems: 'center', gap: 5, padding: '0 8px', borderBottom: '3px ridge #666', flexShrink: 0,
      }}>
        {['◀', '▶', '↻', 'HOME'].map((b, i) => (
          <button key={i} className="w0-pixel" style={{
            width: i > 1 ? 36 : 28, height: 26, background: '#c0c0c0',
            border: '2px outset #ddd', color: '#444', fontSize: i > 1 ? 7 : 11,
            cursor: 'pointer', padding: 0, lineHeight: 1,
          }}>{b}</button>
        ))}
        <div style={{
          flex: 1, maxWidth: '55%', height: 24, background: '#fff',
          border: '2px inset #aaa', padding: '0 8px', display: 'flex', alignItems: 'center',
          fontSize: 13, color: '#000',
        }}>
          http://www.tyleremdur.com/index.html
        </div>
        <img className="w0-img" src={img('browser-globe')} alt="" style={{ width: 22, height: 22, marginLeft: 'auto' }} />
        <span style={{ fontSize: 10, color: '#222' }}>Viewable With Any Browser</span>
      </div>

      {/* Ticker */}
      <div style={{ background: '#000033', borderBottom: `1px solid ${BORDER}`, padding: '2px 0', flexShrink: 0 }} className="w0-ticker-wrap">
        <div className="w0-ticker">
          * WELCOME TO TYLER EMDUR&apos;S MULTIVERSE * 17 WORLDS INSIDE * BOULDER, COLORADO *
          SITE UPDATED {daysOld} DAYS AGO * YOU ARE VISITOR #{String(count).padStart(6, '0')} *
          MOON: {moon.name.toUpperCase()} * {weather ? `BOULDER: ${weather.temp}F ${weather.label.toUpperCase()}` : 'LOADING WEATHER...'} *
        </div>
      </div>

      {/* 3-column body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT */}
        <div style={{ width: 175, flexShrink: 0, overflowY: 'auto', background: '#000033' }} className="w0-scroll">

          {/* Symmetrical imperfection: slight margin offset on header and different background gradient */}
          <div style={{
            background: '#000080', padding: '10px 10px 12px', margin: '4px 6px 4px 2px',
            border: `2px groove ${BORDER}`,
            backgroundImage: 'radial-gradient(1px 1px at 30px 20px,rgba(255,255,255,.4),transparent),radial-gradient(1px 1px at 90px 40px,rgba(255,255,255,.3),transparent)',
          }}>
            <div className="w0-pixel" style={{ fontSize: 10, color: YELLOW, lineHeight: 1.6, textShadow: '1px 1px 0px #ff0000' }}>
              <span className="w0-gif-star" style={{ fontSize: 12 }}>✦</span>{' '}TYLER&apos;S WEB ZONE{' '}<span className="w0-gif-star" style={{ fontSize: 12, animationDelay: '0.45s' }}>✦</span>
            </div>
            <div style={{ fontSize: 10, color: '#00ccff', marginTop: 4, fontFamily: 'Comic Sans MS, cursive' }}>on the World Wide Web!!!</div>
          </div>

          <MiniPanel label="NAVIGATION">
            <ul style={{ listStyle: 'none', margin: '-6px -8px' }}>
              {NAV.map(({ icon, label, action, href }) => (
                <li key={label} style={{ borderBottom: `1px solid #111155` }}>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px', ...linkStyle, textDecoration: 'none', fontSize: 11 }}>
                      <span className="ico"><img className="w0-img" src={img(icon)} alt="" style={{ width: 16, height: 16 }} /></span>
                      {label}
                    </a>
                  ) : (
                    <button className="w0-link" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px', width: '100%', textAlign: 'left', fontSize: 11 }}
                      onClick={() => {
                        if (action === 'enter') go()
                        else if (action === 'scroll') scrollTo('hero')
                        else if (action === 'worlds') scrollTo('worlds-strip')
                        else if (action === 'log') scrollTo('log-box')
                      }}>
                      <span className="ico" style={{ transform: label === '17 Worlds' ? 'rotate(-5deg)' : undefined }}><img className="w0-img" src={img(icon)} alt="" style={{ width: 16, height: 16 }} /></span>
                      {label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </MiniPanel>

          {/* Symmetrical imperfection: dashed borders on visitor panel */}
          <MiniPanel label="> VISITOR COUNTER" style={{ border: '2px dashed #33aa33' }}>
            <div style={{ textAlign: 'center' }}>
              <div id="globe" className="w0-spin" style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 7px' }}></div>
              <div id="odo" className="w0-mono w0-flicker" style={{
                fontSize: 22, fontWeight: 'bold', color: GREEN, letterSpacing: 3,
                background: '#000', border: '2px inset #333', padding: '3px 8px', display: 'inline-block',
                textShadow: '0 0 9px #00FF00'
              }}>
                {String(count).padStart(6, '0')}
              </div>
              <div className="ctr-lbl" style={{ fontSize: 9, color: '#777799', marginTop: 5 }}>visitors since June 2026</div>
            </div>
          </MiniPanel>

          <MiniPanel label="> QUOTE OF THE VISIT">
            <div style={{ fontSize: 10, lineHeight: 1.65, color: '#9999aa', fontStyle: 'italic', minHeight: 48 }}>
              {QUOTES[quoteIdx]}
            </div>
            <button className="w0-link" style={{ fontSize: 8, color: '#666680', marginTop: 4 }}
              onClick={() => setQuoteIdx(i => (i + 7) % QUOTES.length)}>
              [ another quote ]
            </button>
          </MiniPanel>

          <MiniPanel label="> MOON PHASE">
            <div className="w0-mono" style={{ fontSize: 11, color: '#888899', lineHeight: 1.7 }}>
              <span style={{ fontSize: 16, color: YELLOW, letterSpacing: 2 }}>{moon.symbol}</span><br />
              {moon.name}<br />
              <span style={{ fontSize: 9, color: '#555568' }}>illumination ~{moon.pct}%</span>
            </div>
          </MiniPanel>

          <MiniPanel label="> SYSTEM STATUS">
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span className="w0-led" style={{ width: 11, height: 11, borderRadius: '50%', background: GREEN, display: 'inline-block', flexShrink: 0, boxShadow: '0 0 6px #00ff00' }} />
              <span className="w0-mono" style={{ fontSize: 10, color: GREEN }}>STATUS: Online</span>
            </div>
            <div className="w0-mono" style={{ fontSize: 9, color: '#00ff77', borderTop: '1px solid #111155', paddingTop: 4, marginTop: 4 }}>
              ● Creative Engine Running<br />
              ● Building World 17...
            </div>
            <div style={{ fontSize: 9, color: '#777799', marginTop: 5, lineHeight: 1.6 }}>
              LAST UPDATED:<br />{daysOld} days ago<br />
              <span style={{ fontSize: 8 }}>(June 2026 launch)</span>
            </div>
          </MiniPanel>

          <MiniPanel label="> ABOUT TYLER">
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <img className="w0-img" src={img('profile')} alt="" style={{ width: 52, height: 52, border: `2px groove ${BORDER}`, flexShrink: 0 }} />
              <div style={{ fontSize: 10, lineHeight: 1.65, color: '#CCCCCC' }}>
                Software engineer.<br />Builder of worlds.<br />Boulder, Colorado.
              </div>
            </div>
            <button className="w0-link" onClick={go} style={{ fontSize: 10, color: '#00ccff' }}>More about me &rarr;</button>
          </MiniPanel>
        </div>

        {/* CENTER */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

          <div style={{
            background: 'linear-gradient(90deg, #330077, #110055)',
            color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', padding: '3px 8px', margin: '4px 4px 0', border: `2px solid ${BORDER}`, borderBottom: 'none'
          }}>
            Tyler Emdur&apos;s Multiverse World!
          </div>

          {/* Hero / starfield */}
          <div id="hero" ref={heroRef} style={{
            position: 'relative', flex: '1 1 42%', minHeight: 200,
            background: '#000005', overflow: 'hidden', textAlign: 'center',
            border: `2px solid ${BORDER}`, borderTop: 'none', margin: '0 4px',
          }}>
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
            <div style={{ position: 'relative', zIndex: 5, padding: '22px 20px' }}>
              <div id="sf-wel" style={{ fontSize: 18, letterSpacing: 4, color: '#00ff00', textShadow: '0 0 10px #00ff00', fontFamily: 'VT323, monospace', marginBottom: 4 }}>
                WELCOME TO
              </div>
              <div className="w0-title-crt" style={{ marginBottom: 12 }}>
                TYLER EMDUR&apos;S<br />MULTIVERSE
              </div>
              <div id="sf-tag" style={{ fontFamily: 'VT323, monospace', fontSize: 22, color: '#00ff00', textShadow: '0 0 8px #00ff00', marginBottom: 4 }}>
                17 worlds. Infinite possibilities.
              </div>
              <div style={{ fontSize: 11, color: '#aaaacc', marginBottom: 6 }}>
                Choose your destination<span className="w0-cursor">_</span>
              </div>
              <div style={{ fontSize: 10, color: '#00ff88', fontFamily: '"Press Start 2P", monospace', marginBottom: 10, letterSpacing: 1 }}>
                <span className="w0-gif-star" style={{ fontSize: 10 }}>✦</span>
                {' '}SIGN MY GUESTBOOK{' '}
                <span className="w0-gif-star" style={{ fontSize: 10, animationDelay: '0.3s' }}>✦</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <button className="w0-ebtn ebtn-a" onClick={go}>
                    ENTER
                    <span className="ebtn-sub">the Galaxy</span>
                  </button>
                  <div className="bdate">Updated June 2026</div>
                </div>
                <div>
                  <button className="w0-ebtn ebtn-b" onClick={go}>
                    ENTER
                    <span className="ebtn-sub">seriously, enter</span>
                  </button>
                  <div className="bdate">Updated June 2026</div>
                </div>
              </div>
            </div>
            <img className="w0-img w0-spin" src={img('globe')} alt="" style={{ position: 'absolute', bottom: 12, left: 20, width: 48, height: 48, zIndex: 4, opacity: 0.75, animationDuration: '14s' }} />
            <img className="w0-img w0-rocket" src={img('rocket')} alt="" style={{ position: 'absolute', top: '36%', right: '5%', width: 68, height: 42, transform: 'rotate(-18deg)', zIndex: 4, opacity: 0.85 }} />
          </div>

          {/* Welcome + Log — vintage welcome card */}
          <div id="cbot" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `2px solid ${BORDER}`, borderTop: 'none', margin: '0 4px', background: '#000033', flex: '0 0 auto' }}>
            <div className="w0-welcome" style={{ padding: 0 }}>
              <div className="w0-construct" title="under construction" />
              <div style={{ padding: '8px 10px 10px', position: 'relative', zIndex: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <span className="w0-gif-star" style={{ fontSize: 16, marginRight: 4 }}>★</span>
                  <span className="w0-flash-ad">NEW!</span>
                  {' '}
                  <span className="w0-rainbow w0-wobble" style={{ fontSize: 12, fontWeight: 'bold', fontFamily: '"Comic Sans MS",cursive' }}>
                    WELCOME TO MY HOMEPAGE!!!
                  </span>
                  {' '}
                  <span className="w0-gif-star" style={{ fontSize: 16, marginLeft: 4, animationDelay: '0.6s' }}>★</span>
                </div>
                <hr />
                <p style={{ fontSize: 11, lineHeight: 1.7, color: '#222', marginBottom: 7, textAlign: 'center', position: 'relative', zIndex: 12 }}>
                  <b>Hello and welcome!</b> I&apos;m a software engineer and everything I build is cool.
                </p>
                <p style={{ fontSize: 11, lineHeight: 1.7, color: '#222', marginBottom: 7, position: 'relative', zIndex: 12 }}>
                  So the following multiverse of <b>17 websites</b> represents my work and interests.
                  Please sign my guestbook. Tell your friends. Add me to your webring.
                </p>
                <hr />
                <div style={{ fontSize: 10, color: '#444', marginBottom: 5, textAlign: 'center', position: 'relative', zIndex: 12 }}>
                  <i>{QUOTES[quoteIdx]}</i>
                </div>
                <hr />
                <p style={{ fontSize: 11, lineHeight: 1.6, color: '#222', marginBottom: 5, position: 'relative', zIndex: 12 }}>
                  Boulder, CO &bull; <span className="w0-gif-mail" style={{ fontSize: 13 }}>✉</span>{' '}
                  <a href="mailto:tyler@tyleremdur.com" style={{ color: '#0000cc' }}>tyler@tyleremdur.com</a><br />
                  github: <a href="https://github.com/tyler-emdur" target="_blank" rel="noopener noreferrer" style={{ color: '#0000cc' }}>tyler-emdur</a>
                </p>
                <div className="retnav" style={{ fontSize: 11, marginBottom: 5, position: 'relative', zIndex: 12 }}>
                  <span style={{ color: '#0000cc', textDecoration: 'underline', cursor: 'pointer' }} onClick={go}>[ Enter the Multiverse &rarr; ]</span>{' '}
                  <span style={{ color: '#0000cc', textDecoration: 'underline', cursor: 'pointer' }} onClick={go}>[ About Me ]</span>{' '}
                  <a href="/build" style={{ color: '#0000cc' }}>[ Projects ]</a>
                </div>
                <div style={{ fontSize: 9, color: '#666', borderTop: `1px dotted ${BORDER}`, paddingTop: 5, textAlign: 'center', position: 'relative', zIndex: 12 }}>
                  Site updated <b>{daysOld}</b> day{daysOld !== 1 ? 's' : ''} ago &bull;
                  Best viewed at 800&times;600 &bull;
                  You are visitor <b>#{String(count).padStart(6, '0')}</b>
                </div>
              </div>
            </div>

            <div id="log-box" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="log-ph">LATEST LOG ENTRY</div>
              <div id="logscroll" className="w0-scroll w0-mono" style={{
                flex: 1, height: 130, overflowY: 'scroll', padding: '7px 8px',
                fontSize: 10, lineHeight: 1.85, background: '#000022', color: '#9999cc',
              }}>
                <div style={{ color: '#00ccff', fontWeight: 'bold', marginBottom: 4 }}>Monday, 30th June, 2026</div>
                <div>
                  Production of the page commenced.<br />
                  Building world 17. This is taking longer<br />
                  than expected but I am not an expert<br />
                  at multiverse architecture.<br /><br />
                  <button className="w0-link" style={{ color: '#00ff77' }}>Captain&apos;s log &mdash; 51589.7</button><br />
                  We are approaching world base 16.<br />
                  We will visit all sectors. Damage<br />
                  caused by creative overreach.<br /><br />
                  &mdash; T.E.
                </div>
              </div>
            </div>
          </div>

          {/* Worlds strip — Horizontal scrolling gallery of 17 worlds */}
          <div id="worlds" style={{ border: `2px solid ${BORDER}`, borderTop: 'none', margin: '0 4px 4px', background: '#000022', flex: '0 0 auto' }}>
            <PanelHeader label="17 WORLDS INSIDE" />
            <div id="wstrip" className="w0-scroll" style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 3, padding: 4, background: '#000' }}>
              {ALL_WORLDS.map((w) => (
                <WorldThumbnail
                  key={w.id}
                  world={w}
                  onClick={() => navigateTo(w.id as WorldId, { type: 'door' })}
                />
              ))}
              <button onClick={go} className="morebtn" style={{
                flexShrink: 0, width: 62, height: 62, background: '#110033', border: '2px solid #440088',
                color: YELLOW, fontFamily: '"Arial Black",Arial,sans-serif', fontSize: 9,
                cursor: 'pointer', lineHeight: 1.3,
              }}>
                &amp; MORE
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ width: 210, flexShrink: 0, overflowY: 'auto', background: '#000033' }} className="w0-scroll">

          {/* Symmetrical imperfection: different shade of purple on INDEX headers */}
          <MiniPanel label="INDEX" headerStyle={{ background: 'linear-gradient(90deg, #aa0088 0%, #770055 100%)', borderBottom: '1px solid #c900aa' }}>
            <div style={{ margin: '-6px -8px', padding: 4 }}>
              {['WORLDS', 'ABOUT', 'PROJECTS', 'CONTACT', 'SOURCE CODE'].map(t => (
                t === 'PROJECTS'
                  ? <a key={t} href="/build" className="w0-ibtn">{t}</a>
                  : t === 'CONTACT'
                    ? <a key={t} href="mailto:tyler@tyleremdur.com" className="w0-ibtn">{t}</a>
                    : t === 'SOURCE CODE'
                      ? <a key={t} href="https://github.com/tyler-emdur" target="_blank" rel="noopener noreferrer" className="w0-ibtn">{t}</a>
                      : <button key={t} className="w0-ibtn" onClick={go} style={{ width: '100%' }}>{t}</button>
              ))}
            </div>
          </MiniPanel>

          {/* Asymmetry: Weather panel is made significantly shorter */}
          <MiniPanel label="BOULDER WEATHER" style={{ padding: 2, margin: '2px 4px 4px' }}>
            <div className="w0-mono" style={{ fontSize: 10, color: '#888899', lineHeight: 1.45, padding: '2px 4px' }}>
              {weather ? (
                <>
                  <span style={{ fontSize: 14, color: YELLOW }}>{weather.temp}&deg;F</span>{' '}
                  <span style={{ fontSize: 9 }}>({weather.label})</span><br />
                  <span style={{ fontSize: 8, color: '#555568' }}>40.01&deg;N 105.27&deg;W | 5,430 ft</span>
                </>
              ) : (
                <span style={{ fontSize: 9, color: '#555568' }}>connecting...</span>
              )}
            </div>
          </MiniPanel>

          {/* Symmetrical imperfection: Magenta-themed player box header */}
          <MiniPanel label="♪ NOW PLAYING" headerStyle={{ background: 'linear-gradient(90deg, #990088 0%, #660055 100%)', borderBottom: '1px solid #b90088' }}>
            <div className="w0-mono" style={{ fontSize: 10 }}>
              <div style={{ color: '#00ff00', fontWeight: 'bold' }}>media.exe</div>
              <div style={{ color: '#666699', marginBottom: 7 }}>by tyler emdur</div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <div className="w0-npb">&#9664;&#9664;</div>
                <div className="w0-npb" onClick={() => setPlaying(p => !p)}>{playing ? '||' : '▶'}</div>
                <div className="w0-npb">&#9632;</div>
                <div style={{ flex: 1, height: 5, background: '#1a1a1a', marginLeft: 4, border: '1px inset #333', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '38%', background: GREEN_DIM }} />
                </div>
              </div>
            </div>
          </MiniPanel>

          {/* One Weird Thing: Danger zone shake button */}
          <MiniPanel label="⚠️ DANGER ZONE" headerStyle={{ background: 'linear-gradient(90deg, #ee0000 0%, #990000 100%)', borderBottom: '1px solid #ff3333' }}>
            <div style={{ textAlign: 'center', padding: '2px 0' }}>
              <div style={{ fontSize: 8, color: '#ffaaaa', marginBottom: 5, fontFamily: '"Press Start 2P", monospace' }}>DO NOT PRESS</div>
              <button className="w0-ibtn" style={{
                background: 'linear-gradient(180deg, #ff3333, #880000)',
                color: '#fff', borderColor: '#ff9999', margin: '0 auto', fontSize: 10, width: '90%'
              }} onClick={() => {
                alert("WARNING: Mainframe connection destabilized! Restructuring space-time anomaly...")
                document.body.classList.add('w0-shake')
                setTimeout(() => document.body.classList.remove('w0-shake'), 1200)
              }}>
                [ ACTIVATE ]
              </button>
            </div>
          </MiniPanel>

          {/* Asymmetry: New Media panel is made taller with extra padding and indicators */}
          <MiniPanel label="NEW MEDIA / NEW ART" style={{ margin: '4px' }}>
            <div className="w0-mono" style={{ fontSize: 10, lineHeight: 1.8, color: '#888899', padding: '8px 4px' }}>
              <span style={{ color: '#00ccff', fontWeight: 'bold' }}>tyler emdur</span> &bull; 2026<br />
              boulder colorado<br />
              software &bull; running &bull; art<br />
              17 worlds inside<br />
              <span style={{ color: GREEN_DIM }}>creative engine active</span><br />
              <span style={{ fontSize: 9, color: '#555568' }}>updated {daysOld}d ago</span>
            </div>
            <button className="w0-link" onClick={go} style={{ color: '#00ff77', display: 'block', marginTop: 5, fontSize: 10, paddingLeft: 4 }}>&rarr; enter.now</button>
          </MiniPanel>

          {/* Asymmetry: Link Log panel is made shorter */}
          <MiniPanel label="LINK LOG" style={{ margin: '2px 4px 4px' }} headerStyle={{ background: 'linear-gradient(90deg, #993300 0%, #551100 100%)', borderBottom: '1px solid #b94411' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 9.5, lineHeight: 1.5, color: '#888899', flex: 1 }}>
                An <button className="w0-link" style={{ color: '#00ccff' }}>IN SYNC WITH &apos;N SYNC</button> fan site.<br />
                <button className="w0-link" onClick={go} style={{ color: '#00ccff' }}>Join the club now &rarr;</button>
              </div>
              <img className="w0-img" src={img('group')} alt="" style={{ width: 44, height: 44, flexShrink: 0, border: `1px inset ${BORDER}` }} />
            </div>
          </MiniPanel>

          <MiniPanel label="SITE AWARD" headerStyle={{ background: 'linear-gradient(90deg, #bb7700 0%, #774400 100%)', borderBottom: '1px solid #ddaa00' }}>
            <div style={{ textAlign: 'center', padding: '4px 2px' }}>
              <div className="w0-award" style={{
                display: 'inline-block', border: '3px solid #ffd700',
                borderRadius: 3, padding: '6px 12px', background: 'linear-gradient(135deg, #1a0800, #2a1200)',
                marginBottom: 5,
              }}>
                <div className="w0-gif-star" style={{ fontSize: 26, display: 'block', marginBottom: 2 }}>★</div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#ffd700', lineHeight: 1.7 }}>
                  GEOCITIES<br />HOT SITE<br />AWARD &lsquo;99
                </div>
              </div>
              <div style={{ fontSize: 8, color: '#886600', lineHeight: 1.5, fontFamily: '"Comic Sans MS",cursive' }}>
                Cool Site of<br />the Millennium!!
              </div>
            </div>
          </MiniPanel>

          <MiniPanel label="WEB RING">
            <div style={{ fontSize: 9, color: '#666680', lineHeight: 1.7, textAlign: 'center' }}>
              <span style={{ color: '#66aaff', cursor: 'pointer' }}>[ &lt;&lt; Prev ]</span>
              {' '}
              <img className="w0-img w0-spin" src={img('globe')} alt="" style={{ width: 20, height: 20, display: 'inline-block', verticalAlign: 'middle', animationDuration: '6s' }} />
              {' '}
              <span style={{ color: '#66aaff', cursor: 'pointer' }}>[ Next &gt;&gt; ]</span>
              <br /><br />
              <span style={{ fontSize: 8 }}>Member of the Multiverse Webring<br />since June 2026</span>
            </div>
          </MiniPanel>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: '#000022', borderTop: `2px solid ${BORDER}`, padding: '5px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 10, color: '#777799', flexWrap: 'wrap', gap: 6, flexShrink: 0,
      }}>
        <span>
          This is a <button className="w0-link" onClick={go} style={{ color: YELLOW_DIM, fontWeight: 'bold' }}>TYLER EMDUR MULTIVERSE</button> site.
          {' '}| updated {daysOld}d ago | {moon.symbol} {moon.name}
        </span>
        <span>
          [ <button className="w0-link" style={{ color: '#66aaff' }}>Prev</button> ]
          &nbsp;[ <button className="w0-link" onClick={go} style={{ color: '#66aaff' }}>Enter</button> ]
          &nbsp;[ <button className="w0-link" style={{ color: '#66aaff' }}>Random</button> ]
          &nbsp;[ <button className="w0-link" style={{ color: '#66aaff' }}>List Sites</button> ]
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            border: '2px outset #cccccc', background: 'linear-gradient(90deg,#003399,#000066)',
            color: '#ffffff', fontSize: 7, fontFamily: '"Press Start 2P",monospace',
            padding: '2px 5px', letterSpacing: 1, lineHeight: 1.5,
            display: 'inline-block',
          }}>
            NETSCAPE<br />NOW!
          </span>
          <span style={{
            border: '2px outset #999966', background: 'linear-gradient(90deg,#333300,#111100)',
            color: '#ffff00', fontSize: 7, fontFamily: '"Press Start 2P",monospace',
            padding: '2px 5px', letterSpacing: 1, lineHeight: 1.5, display: 'inline-block',
          }}>
            BEST AT<br />800x600
          </span>
        </span>
        <span className="w0-mono" style={{ color: '#00ff00' }}>
          {time}
        </span>
      </div>
    </div>
  )
}
