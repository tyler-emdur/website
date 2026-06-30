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
const LINK = '#3366cc'
const GREEN = '#00ff00'

const img = (name: string) => `/retro/${name}.svg`

function getLastUpdated() {
  const raw = process.env.NEXT_PUBLIC_LAST_COMMIT_DATE
  const d = raw ? new Date(raw) : new Date()
  const label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return { label }
}

const WEATHER_LABELS: Record<number, string> = {
  0: 'clear', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'foggy', 48: 'rime fog', 51: 'light drizzle', 53: 'drizzle',
  55: 'heavy drizzle', 61: 'light rain', 63: 'rain', 65: 'heavy rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow', 80: 'showers',
  81: 'rain showers', 82: 'heavy showers', 85: 'snow showers', 95: 'thunderstorm',
}

interface WorldItem { id: number; name: string; bg: string; ac: string }

const ALL_WORLDS: WorldItem[] = [
  { id: 0, name: 'Surface', bg: '#000022', ac: '#00ff88' },
  { id: 1, name: 'Apartment', bg: '#0d001a', ac: '#ff00aa' },
  { id: 2, name: 'Depth', bg: '#000033', ac: '#00ffff' },
  { id: 3, name: 'Broadcast', bg: '#220022', ac: '#ff55ff' },
  { id: 4, name: 'Blackbird', bg: '#040603', ac: '#33ff66' },
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
  { id: 17, name: 'BuildLog', bg: '#008080', ac: '#ffff00' },
  { id: 18, name: 'Applets', bg: '#008080', ac: '#a855f7' },
  { id: 19, name: 'Training', bg: '#f3ecd9', ac: '#cc6622' },
  { id: 20, name: 'Trip Report', bg: '#dff0fa', ac: '#22c55e' },
]

function PanelHeader({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: `linear-gradient(90deg, ${P} 0%, ${P2} 100%)`,
      padding: '3px 7px', color: YELLOW, fontSize: 10, fontWeight: 900,
      letterSpacing: 1, borderBottom: `1px solid ${P}`,
      fontFamily: '"Arial Black", Arial, sans-serif', ...style
    }}>
      {label}
    </div>
  )
}

function MiniPanel({ label, children, style, headerStyle, noPad }: {
  label: string; children: React.ReactNode; style?: React.CSSProperties; headerStyle?: React.CSSProperties; noPad?: boolean
}) {
  return (
    <div style={{ border: `2px solid ${BORDER}`, margin: 4, background: '#000033', overflow: 'hidden', ...style }}>
      <PanelHeader label={label} style={headerStyle} />
      <div style={noPad ? undefined : { padding: '6px 8px' }}>{children}</div>
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
    cx.fillStyle = world.bg
    cx.fillRect(0, 0, 80, 60)
    cx.fillStyle = world.ac
    for (let i = 0; i < 16; i++) {
      cx.globalAlpha = Math.random() * 0.65 + 0.2
      cx.fillRect(Math.floor(Math.random() * 76) + 2, Math.floor(Math.random() * 56) + 2, 2, 2)
    }
    cx.globalAlpha = 1
    const grad = cx.createRadialGradient(40, 30, 0, 40, 30, 16)
    grad.addColorStop(0, world.ac + 'cc')
    grad.addColorStop(1, 'transparent')
    cx.beginPath()
    cx.arc(40, 30, 16, 0, Math.PI * 2)
    cx.fillStyle = grad
    cx.fill()
    cx.strokeStyle = 'rgba(255,255,255,0.18)'
    cx.lineWidth = 1
    cx.beginPath()
    cx.moveTo(40, 5); cx.lineTo(40, 55)
    cx.moveTo(5, 30); cx.lineTo(75, 30)
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
  { icon: 'rocket', label: 'Enter Universe', action: 'enter' as const },
  { icon: 'icon-download', label: 'Source Code', href: 'https://github.com/tyler-emdur/website' },
  { icon: 'icon-gear', label: 'Contact', href: 'mailto:tyler@tyleremdur.com' },
]

export default function World0Surface() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [time, setTime] = useState('')
  const [weather, setWeather] = useState<{ temp: number; label: string } | null>(null)
  const [ghCommits, setGhCommits] = useState<{ label: string; shortDate: string; message: string }[] | null>(null)
  const { label: lastUpdatedLabel } = getLastUpdated()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const trafficRef = useRef<HTMLDivElement>(null)
  const ipRef = useRef<HTMLDivElement>(null)
  const lastSparkleRef = useRef<number>(0)

  const go = useCallback(() => navigateTo(1, { type: 'door' }), [navigateTo])
  const goProjects = useCallback(() => navigateTo(17, { type: 'door' }), [navigateTo])

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
    fetch('https://api.github.com/repos/tyler-emdur/website/commits?per_page=5')
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return
        const commits = d.map(commit => {
          const dateStr = commit?.commit?.committer?.date
          const date = dateStr ? new Date(dateStr) : null
          return {
            label: date ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
            shortDate: date ? date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '.') : '',
            message: ((commit?.commit?.message ?? '').split('\n')[0]) as string,
          }
        }).filter(c => c.shortDate)
        if (commits.length) setGhCommits(commits)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const container = trafficRef.current
    if (!container) return
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = '//cdn.livetrafficfeed.com/static/v6/live.js?bc=000011&tc=00ff88&brd1=006633&lnk=00ccff&hc=003322&hfc=00ff88&nc=ffff00&vv=255&tft=10&ro=0&res=0'
    container.appendChild(script)
    return () => { if (container.contains(script)) container.removeChild(script) }
  }, [])

  useEffect(() => {
    const container = ipRef.current
    if (!container) return
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = '//cdn.livetrafficfeed.com/static/ip-widget/live.v3.js?ro=0&un=0&type=1'
    container.appendChild(script)
    return () => { if (container.contains(script)) container.removeChild(script) }
  }, [])

  useEffect(() => {
    const chars = ['★', '✦', '✺', '·', '*', '♦', '✨']
    const colors = ['#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#00ff00', '#ffffff', '#ff00aa']
    const onMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastSparkleRef.current < 35) return
      lastSparkleRef.current = now
      const el = document.createElement('span')
      el.textContent = chars[Math.floor(Math.random() * chars.length)]
      const sz = Math.floor(Math.random() * 10) + 8
      el.style.cssText = `position:fixed;pointer-events:none;z-index:99999;left:${e.clientX - sz / 2}px;top:${e.clientY - sz / 2}px;font-size:${sz}px;color:${colors[Math.floor(Math.random() * colors.length)]};animation:w0-sparkle-fade 0.75s ease-out forwards;user-select:none;line-height:1`
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 800)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
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

      stars.forEach(s => {
        s.tw += 0.012
        s.x -= s.spd
        if (s.x < 0) s.x = cv.width
        cx.beginPath()
        if (s.isCross) {
          cx.strokeStyle = s.col
          cx.lineWidth = 0.8
          cx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(s.tw))
          cx.moveTo(s.x - 3, s.y); cx.lineTo(s.x + 3, s.y)
          cx.moveTo(s.x, s.y - 3); cx.lineTo(s.x, s.y + 3)
          cx.stroke()
        } else {
          cx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          cx.fillStyle = s.col
          cx.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(s.tw))
          cx.fill()
        }
      })
      cx.globalAlpha = 1

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
        cx.moveTo(sx - 9, sy); cx.lineTo(sx + 9, sy)
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

        .w0-ibtn {
          display:block; background:linear-gradient(180deg,#ffff55,#cccc00);
          color:#000033; font-family:"Arial Black",Arial,sans-serif;
          font-size:11px; font-weight:900; text-align:center; text-decoration:none;
          padding:5px 8px; border:2px outset #ffff99; margin:3px; letter-spacing:1px; cursor:pointer;
          box-shadow: 1px 1px 0px #000;
        }
        .w0-ibtn:hover { filter:brightness(1.12) }
        .w0-ibtn:active { border-style:inset; transform:translate(1px,1px); box-shadow:none; }

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
        .w0-ebtn:active { border-style:inset; transform:translate(1.5px,1.5px); box-shadow:none; }

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

        .w0-welcome {
          background-color:${BEIGE};
          border-right:2px solid ${BORDER};
          font-family:Arial,Helvetica,sans-serif;
          position:relative; overflow:hidden;
        }
        .w0-welcome::after {
          content:" "; display:block; position:absolute; top:0; left:0; bottom:0; right:0;
          background:repeating-linear-gradient(0deg,rgba(0,0,0,0.05),rgba(0,0,0,0.05) 1px,transparent 1px,transparent 2px);
          pointer-events:none; z-index:10;
        }
        .w0-welcome hr { border:none; border-top:1px solid #aaaaaa; margin:6px 0; position:relative; z-index:11; }
        .w0-wobble { display:inline-block; transform:rotate(-0.5deg) }

        .wt {
          flex-shrink:0; width:84px; height:64px; border:2px groove ${BORDER_LIGHT};
          cursor:pointer; position:relative; overflow:hidden;
          text-decoration:none; display:block;
          transition:transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .wt:hover { transform:scale(1.06); border-color:${YELLOW} !important; box-shadow:0 0 8px ${YELLOW}; z-index:20; }
        .wlbl {
          position:absolute; bottom:0; left:0; right:0;
          background:rgba(0,0,0,.85); color:#00ccff; font-size:7px;
          font-family:'Courier New',monospace; text-align:center; padding:2px;
        }

        .w0-title-crt {
          font-family:"Press Start 2P","Courier New",monospace;
          font-size:clamp(15px,2.5vw,26px); color:#ffffff;
          text-shadow:0 0 4px rgba(0,255,0,0.6),3px 0 0 rgba(255,0,0,0.75),-3px 0 0 rgba(0,255,255,0.75),4px 4px 0px #060012;
          letter-spacing:1px; line-height:1.45; filter:blur(0.3px);
        }

        @keyframes w0-flash-ad {
          0%,49% { background-color:#ff0000; color:#ffffff; border-color:#ffff00; }
          50%,100% { background-color:#ffff00; color:#ff0000; border-color:#ff0000; }
        }
        .w0-flash-ad {
          animation:w0-flash-ad 0.6s step-end infinite;
          border:2px solid #ffff00; font-family:"Press Start 2P",sans-serif;
          font-size:8px !important; padding:2px 6px; font-weight:bold;
          display:inline-block; text-shadow:none; position:relative; z-index:11;
        }

        @keyframes w0-rocket-drift {
          0%,100% { transform:translateY(0) rotate(-18deg); }
          50% { transform:translateY(-7px) rotate(-16deg); }
        }
        .w0-rocket { animation:w0-rocket-drift 5.5s ease-in-out infinite; }

        @keyframes w0-mail-bounce {
          0%,100% { transform:translateY(0) rotate(0deg); }
          30% { transform:translateY(-6px) rotate(-8deg); }
          60% { transform:translateY(-2px) rotate(4deg); }
        }
        .w0-gif-mail { animation:w0-mail-bounce 1.2s ease-in-out infinite; display:inline-block; }

        @keyframes w0-rainbow {
          0%{color:#ff0000} 17%{color:#ff8800} 33%{color:#ffff00}
          50%{color:#00ff00} 67%{color:#0088ff} 83%{color:#cc00ff} 100%{color:#ff0000}
        }
        .w0-rainbow { animation:w0-rainbow 2.2s linear infinite; }

        @keyframes w0-cursor-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        .w0-cursor { animation:w0-cursor-blink 0.9s step-end infinite; font-weight:900; }

        /* ===  More GIF-like retro decorations === */
        @keyframes w0-bounce {
          0%,100% { transform: translateY(0) rotate(0deg); }
          30% { transform: translateY(-11px) rotate(-6deg); }
          60% { transform: translateY(-5px) rotate(4deg); }
        }
        .w0-bounce { animation: w0-bounce 0.85s ease-in-out infinite; display: inline-block; }

        @keyframes w0-wiggle-gif {
          0%,100% { transform: rotate(-8deg) scale(1); }
          50% { transform: rotate(8deg) scale(1.1); }
        }
        .w0-wiggle-gif { animation: w0-wiggle-gif 0.38s ease-in-out infinite; display: inline-block; }

        @keyframes w0-twinkle {
          0%,100% { opacity:1; transform:scale(1) rotate(0deg); color:#ffff00; }
          25% { opacity:0.25; transform:scale(0.75) rotate(20deg); color:#ff00ff; }
          50% { opacity:1; transform:scale(1.25) rotate(0deg); color:#00ffff; }
          75% { opacity:0.5; transform:scale(0.85) rotate(-20deg); color:#ff8800; }
        }
        .w0-twinkle   { animation: w0-twinkle 1.1s ease-in-out infinite; display:inline-block; }
        .w0-twinkle-b { animation: w0-twinkle 1.1s ease-in-out infinite 0.37s; display:inline-block; }
        .w0-twinkle-c { animation: w0-twinkle 1.1s ease-in-out infinite 0.74s; display:inline-block; }

        @keyframes w0-rainbow-hr {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .w0-hr-rainbow {
          height: 5px; border: none; margin: 7px 0;
          background: linear-gradient(90deg,#ff0000,#ff8800,#ffff00,#00ff00,#00ffff,#0066ff,#cc00ff,#ff0000);
          background-size: 200% auto;
          animation: w0-rainbow-hr 1.4s linear infinite;
        }

        @keyframes w0-click-pulse {
          0%,100% { transform:scale(1); box-shadow:0 0 4px #ff0; }
          50% { transform:scale(1.04); box-shadow:0 0 14px #ff0, 0 0 28px #f80; }
        }
        .w0-click-here {
          animation: w0-click-pulse 0.9s ease-in-out infinite;
          display:inline-block; background:linear-gradient(180deg,#ff4400,#cc0000);
          color:#fff; font-family:"Press Start 2P",monospace; font-size:8px;
          padding:6px 16px; border:3px outset #ff8800; cursor:pointer;
          text-shadow:1px 1px 0 #000; letter-spacing:1px;
        }

        @keyframes w0-pixel-float {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(5deg); }
          66% { transform: translateY(-4px) rotate(-3deg); }
        }
        .w0-pixel-float { animation: w0-pixel-float 3s ease-in-out infinite; display:inline-block; }

        @keyframes w0-sparkle-fade {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-22px) scale(0.2); }
        }

        @keyframes w0-award-glow {
          0%,100% { color: #ffff00; text-shadow: 0 0 5px #ffff00; }
          33% { color: #ff00ff; text-shadow: 0 0 5px #ff00ff; }
          66% { color: #00ffff; text-shadow: 0 0 5px #00ffff; }
        }
        .w0-award-text { animation: w0-award-glow 1.8s step-end infinite; }

        @keyframes w0-note-dance {
          0%,100% { transform: rotate(-14deg) translateY(0); }
          50% { transform: rotate(14deg) translateY(-4px); }
        }
        .w0-note { animation: w0-note-dance 0.5s ease-in-out infinite; display: inline-block; }

        .w0-marquee-band {
          display:inline-block; animation:w0-scroll 30s linear infinite;
          font-family:"Comic Sans MS",cursive; font-size:11px; font-weight:bold;
          letter-spacing:1px; padding-left:100%; color:#ffff00; white-space:nowrap;
        }
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
          * WELCOME TO TYLER EMDUR&apos;S MULTIVERSE * {ALL_WORLDS.length} WORLDS INSIDE * BOULDER, COLORADO *
          LAST UPDATED {lastUpdatedLabel.toUpperCase()} *
          {weather ? ` BOULDER: ${weather.temp}F ${weather.label.toUpperCase()} *` : ' LOADING WEATHER... *'}
        </div>
      </div>

      {/* 3-column body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT */}
        <div style={{ width: 170, flexShrink: 0, overflow: 'hidden', background: '#000033' }}>

          <div style={{
            background: '#000080', padding: '10px 10px 12px', margin: '4px 6px 4px 2px',
            border: `2px groove ${BORDER}`,
            backgroundImage: 'radial-gradient(1px 1px at 30px 20px,rgba(255,255,255,.4),transparent),radial-gradient(1px 1px at 90px 40px,rgba(255,255,255,.3),transparent)',
          }}>
            <div className="w0-pixel" style={{ fontSize: 10, color: YELLOW, lineHeight: 1.6, textShadow: '1px 1px 0px #ff0000' }}>
              TYLER&apos;S WEB ZONE
            </div>
            <div style={{ fontSize: 10, color: '#00ccff', marginTop: 4, fontFamily: 'Comic Sans MS, cursive' }}>on the World Wide Web!!!</div>
          </div>

          <MiniPanel label="NAVIGATION">
            <ul style={{ listStyle: 'none', margin: '-6px -8px' }}>
              {NAV.map(({ icon, label, action, href }) => (
                <li key={label} style={{ borderBottom: `1px solid #111155` }}>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px', ...linkStyle, textDecoration: 'none', fontSize: 11 }}>
                      <img className="w0-img" src={img(icon)} alt="" style={{ width: 16, height: 16 }} />
                      {label}
                    </a>
                  ) : (
                    <button className="w0-link" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px', width: '100%', textAlign: 'left', fontSize: 11 }}
                      onClick={go}>
                      <img className="w0-img" src={img(icon)} alt="" style={{ width: 16, height: 16 }} />
                      {label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </MiniPanel>

          <MiniPanel label="> ABOUT TYLER">
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <img className="w0-img" src={img('profile')} alt="" style={{ width: 52, height: 52, border: `2px groove ${BORDER}`, flexShrink: 0 }} />
              <div style={{ fontSize: 10, lineHeight: 1.65, color: '#CCCCCC' }}>
                Software engineer.<br />Builder of worlds.<br />Boulder, Colorado.
              </div>
            </div>
            <div style={{ fontSize: 9, color: '#555568', borderTop: `1px solid #111155`, paddingTop: 5 }}>
              Updated {lastUpdatedLabel}
            </div>
          </MiniPanel>

          <MiniPanel label="> STATUS">
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span className="w0-led" style={{ width: 11, height: 11, borderRadius: '50%', background: GREEN, display: 'inline-block', flexShrink: 0, boxShadow: '0 0 6px #00ff00' }} />
              <span className="w0-mono" style={{ fontSize: 10, color: GREEN }}>Online</span>
            </div>
            <div className="w0-mono" style={{ fontSize: 9, color: '#00ff77' }}>
              Last updated: <b>{ghCommits?.[0]?.label ?? lastUpdatedLabel}</b>
              {ghCommits?.[0]?.message && (
                <><br />&quot;{ghCommits[0].message}&quot;</>
              )}
            </div>
            <div style={{ fontSize: 9, marginTop: 4 }}>
              <a href="https://github.com/tyler-emdur/website" target="_blank" rel="noopener noreferrer" style={{ color: LINK }}>
                view on github &rarr;
              </a>
            </div>
          </MiniPanel>

          <MiniPanel label="> INCOMING CONNECTION" headerStyle={{ background: 'linear-gradient(90deg, #004400 0%, #002200 100%)', borderBottom: '1px solid #006600' }} noPad>
            <div ref={ipRef} style={{ width: '100%', overflow: 'hidden' }} />
          </MiniPanel>

          {/* GeoCities decoration strip */}
          <div style={{ padding: '6px 4px', textAlign: 'center', borderTop: `2px groove ${BORDER}`, background: '#000044' }}>
            <div style={{ fontSize: 18, lineHeight: 1.4, letterSpacing: 4 }}>
              <span className="w0-twinkle">★</span>
              <span className="w0-bounce" style={{ fontSize: 16 }}>✦</span>
              <span className="w0-twinkle-b">✺</span>
              <span className="w0-wiggle-gif" style={{ fontSize: 14 }}>♦</span>
              <span className="w0-twinkle-c">★</span>
            </div>
            <div style={{ fontSize: 18, lineHeight: 1.4, letterSpacing: 4, marginTop: 6 }}>
              <span className="w0-twinkle-c">★</span>
              <span className="w0-wiggle-gif" style={{ fontSize: 14 }}>♦</span>
              <span className="w0-twinkle-b">✺</span>
              <span className="w0-bounce" style={{ fontSize: 16 }}>✦</span>
              <span className="w0-twinkle">★</span>
            </div>
          </div>

        </div>

        {/* CENTER */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

          <div style={{
            background: 'linear-gradient(90deg, #330077, #110055)',
            color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', padding: '3px 8px',
            margin: '4px 4px 0', border: `2px solid ${BORDER}`, borderBottom: 'none'
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
            <div style={{ position: 'relative', zIndex: 5, padding: '10px 20px 6px' }}>
              <div style={{ fontSize: 13, letterSpacing: 4, color: '#00ff00', textShadow: '0 0 10px #00ff00', fontFamily: 'VT323, monospace', marginBottom: 1 }}>
                WELCOME TO
              </div>
              <div className="w0-title-crt" style={{ marginBottom: 4, fontSize: 'clamp(14px,2.2vw,23px)' }}>
                TYLER EMDUR&apos;S<br />MULTIVERSE
              </div>
              <div style={{ fontFamily: 'VT323, monospace', fontSize: 16, color: '#00ff00', textShadow: '0 0 8px #00ff00', marginBottom: 1 }}>
                {ALL_WORLDS.length} worlds. Infinite possibilities.
              </div>
              <div style={{ fontSize: 10, color: '#aaaacc', marginBottom: 6 }}>
                Choose your destination<span className="w0-cursor">_</span>
              </div>
              <div>
                <span className="w0-twinkle" style={{ fontSize: 18 }}>✦ </span>
                <button className="w0-click-here" onClick={go} style={{ fontSize: 14, padding: '10px 36px', letterSpacing: 2 }}>
                  CLICK TO ENTER
                </button>
                <span className="w0-twinkle-b" style={{ fontSize: 18 }}> ✦</span>
              </div>
            </div>
            <img className="w0-img w0-spin" src={img('globe')} alt="" style={{ position: 'absolute', bottom: 12, left: 20, width: 48, height: 48, zIndex: 4, opacity: 0.75, animationDuration: '14s' }} />
            <img className="w0-img w0-rocket" src={img('rocket')} alt="" style={{ position: 'absolute', top: '36%', right: '5%', width: 68, height: 42, transform: 'rotate(-18deg)', zIndex: 4, opacity: 0.85 }} />
            {/* Floating decorative GIF-like elements */}
            <span className="w0-pixel-float" style={{ position: 'absolute', top: '12%', left: '8%', fontSize: 22, zIndex: 4 }}>
              <span className="w0-twinkle">✺</span>
            </span>
            <span className="w0-pixel-float" style={{ position: 'absolute', top: '20%', right: '18%', fontSize: 18, zIndex: 4, animationDelay: '1s' }}>
              <span className="w0-twinkle-b">★</span>
            </span>
            <span className="w0-pixel-float" style={{ position: 'absolute', bottom: '25%', right: '22%', fontSize: 20, zIndex: 4, animationDelay: '2s' }}>
              <span className="w0-twinkle-c">✦</span>
            </span>
            <span className="w0-pixel-float" style={{ position: 'absolute', bottom: '18%', left: '30%', fontSize: 16, zIndex: 4, animationDelay: '0.5s' }}>
              <span className="w0-twinkle">♦</span>
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: 10, background: 'linear-gradient(90deg,#ff0000,#ff8800,#ffff00,#00ff00,#00ffff,#0066ff,#cc00ff,#ff0000)', flexShrink: 0 }} />

          {/* Welcome + Log */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `2px solid ${BORDER}`, borderTop: 'none', margin: '0 4px', background: '#000033', flex: '1 1 50%', minHeight: 0 }}>
            <div className="w0-welcome w0-scroll" style={{ padding: 0, minHeight: 0, overflowY: 'auto' }}>
              <div className="w0-construct" title="under construction" />
              <div style={{ padding: '8px 10px 10px', position: 'relative', zIndex: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <span className="w0-twinkle" style={{ fontSize: 16, marginRight: 4 }}>★</span>
                  <span className="w0-flash-ad">LIVE</span>
                  {' '}
                  <span className="w0-rainbow w0-wobble" style={{ fontSize: 12, fontWeight: 'bold', fontFamily: '"Comic Sans MS",cursive' }}>
                    MISSION CONTROL
                  </span>
                  {' '}
                  <span className="w0-twinkle-b" style={{ fontSize: 16, marginLeft: 4 }}>★</span>
                </div>
                <div className="w0-hr-rainbow" />
                <div style={{
                  background: '#001100', border: '2px inset #003300', padding: '8px 9px', margin: '2px 0 7px',
                  position: 'relative', zIndex: 12, fontFamily: '"Courier New",monospace', fontSize: 10,
                  lineHeight: 1.6, color: '#33ff66', textAlign: 'left',
                }}>
                  <div style={{ marginBottom: 1 }}>
                    <span className="w0-led" style={{ width: 7, height: 7, borderRadius: '50%', background: '#33ff66', display: 'inline-block', marginRight: 5, boxShadow: '0 0 4px #33ff66' }} />
                    STATUS: <b style={{ color: '#fff' }}>Building World 17</b>
                  </div>
                  <div>LATEST ADDITION: <b style={{ color: '#fff' }}>{ghCommits?.[0]?.message ?? 'Weather System'}</b></div>
                  <div style={{ marginBottom: 6 }}>NEXT PLANNED WORLD: <b style={{ color: '#fff' }}>????</b></div>
                  <div style={{ color: '#88ffaa', borderTop: '1px dotted #115522', paddingTop: 5, marginBottom: 3 }}>RECENT TRANSMISSIONS:</div>
                  {ghCommits ? ghCommits.slice(0, 4).map((c, i) => (
                    <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: '#117733' }}>{c.shortDate}</span> &mdash; {c.message}
                    </div>
                  )) : (
                    <div style={{ color: '#117733' }}>connecting to mission log&hellip;</div>
                  )}
                </div>
                <div className="w0-hr-rainbow" />
                <p style={{ fontSize: 11, lineHeight: 1.6, color: '#222', marginBottom: 5, position: 'relative', zIndex: 12 }}>
                  Boulder, CO &bull; <span className="w0-gif-mail" style={{ fontSize: 13 }}>✉</span>{' '}
                  <a href="mailto:tyler@tyleremdur.com" style={{ color: '#0000cc' }}>tyler@tyleremdur.com</a><br />
                  github: <a href="https://github.com/tyler-emdur/website" target="_blank" rel="noopener noreferrer" style={{ color: '#0000cc' }}>tyler-emdur/website</a>
                </p>
                <div className="retnav" style={{ fontSize: 11, marginBottom: 5, position: 'relative', zIndex: 12 }}>
                  <span style={{ color: '#0000cc', textDecoration: 'underline', cursor: 'pointer' }} onClick={go}>[ Enter the Multiverse &rarr; ]</span>{' '}
                  <span style={{ color: '#0000cc', textDecoration: 'underline', cursor: 'pointer' }} onClick={goProjects}>[ Projects ]</span>
                </div>
                <div style={{ fontSize: 9, color: '#666', borderTop: `1px dotted ${BORDER}`, paddingTop: 5, textAlign: 'center', position: 'relative', zIndex: 12 }}>
                  Site updated <b>{lastUpdatedLabel}</b> &bull; Best viewed at 800&times;600
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <PanelHeader label="ABOUT THIS SITE" />
              <div className="w0-scroll w0-mono" style={{
                flex: 1, overflowY: 'auto', padding: '7px 8px',
                fontSize: 10, lineHeight: 1.85, background: '#000022', color: '#9999cc',
              }}>
                <div style={{ color: '#00ccff', fontWeight: 'bold', marginBottom: 6 }}>Welcome to my digital multiverse.</div>
                <div>
                  This website is made up of <span style={{ color: '#ffffff' }}>{ALL_WORLDS.length} different &quot;worlds&quot;</span>,
                  each one being its own mini website with a unique design, purpose, and personality.
                  Every world explores a different part of my work, interests, projects, and random ideas.<br /><br />
                  Some worlds are serious and functional. Some are experimental. Some are just for fun.<br /><br />
                  The multiverse is still a work in progress, and many of these worlds are actively being
                  built and expanded. Think of it as a living project that grows over time as I create
                  new things and explore new ideas.<br /><br />
                  <span style={{ color: '#00ff77' }}>Built by Tyler Emdur</span><br />
                  Boulder, Colorado.
                </div>
              </div>
            </div>
          </div>

          {/* Worlds strip */}
          <div style={{ border: `2px solid ${BORDER}`, borderTop: 'none', margin: '0 4px 4px', background: '#000022', flex: '0 0 auto' }}>
            <PanelHeader label={`${ALL_WORLDS.length} WORLDS INSIDE`} />
            <div className="w0-scroll" style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 3, padding: 4, background: '#000' }}>
              {ALL_WORLDS.map((w) => (
                <WorldThumbnail key={w.id} world={w} onClick={() => navigateTo(w.id as WorldId, { type: 'door' })} />
              ))}
              <button onClick={go} style={{
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
        <div style={{ width: 210, flexShrink: 0, overflow: 'hidden', background: '#000033' }}>

          <MiniPanel label="INDEX" headerStyle={{ background: 'linear-gradient(90deg, #aa0088 0%, #770055 100%)', borderBottom: '1px solid #c900aa' }}>
            <div style={{ margin: '-6px -8px', padding: 4 }}>
              <button className="w0-ibtn" onClick={go} style={{ width: '100%' }}>WORLDS</button>
              <button className="w0-ibtn" onClick={goProjects} style={{ width: '100%' }}>PROJECTS</button>
              <a href="mailto:tyler@tyleremdur.com" className="w0-ibtn">CONTACT</a>
              <a href="https://github.com/tyler-emdur/website" target="_blank" rel="noopener noreferrer" className="w0-ibtn">SOURCE CODE</a>
            </div>
          </MiniPanel>

          <MiniPanel label="BOULDER WEATHER">
            <div className="w0-mono" style={{ fontSize: 10, color: '#888899', lineHeight: 1.6 }}>
              {weather ? (
                <>
                  <span style={{ fontSize: 18, color: YELLOW }}>{weather.temp}&deg;F</span>{' '}
                  <span style={{ fontSize: 9 }}>{weather.label}</span><br />
                  <span style={{ fontSize: 8, color: '#555568' }}>40.01&deg;N 105.27&deg;W &bull; 5,430 ft</span>
                </>
              ) : (
                <span style={{ fontSize: 9, color: '#555568' }}>connecting...</span>
              )}
            </div>
          </MiniPanel>

          <MiniPanel label="> WHO'S WATCHING" style={{ border: '2px dashed #006633' }} headerStyle={{ background: 'linear-gradient(90deg, #003322 0%, #001111 100%)', borderBottom: '1px solid #006633' }} noPad>
            <div ref={trafficRef} style={{ width: '100%', overflow: 'hidden' }} />
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
          <button className="w0-link" onClick={go} style={{ color: YELLOW_DIM, fontWeight: 'bold' }}>TYLER EMDUR MULTIVERSE</button>
          {' '}| updated {lastUpdatedLabel}
        </span>
        <span>
          [ <button className="w0-link" onClick={go} style={{ color: '#66aaff' }}>Enter</button> ]
          &nbsp;[{' '}<a href="https://github.com/tyler-emdur/website" target="_blank" rel="noopener noreferrer" style={{ color: '#66aaff' }}>Source</a>{' '}]
          &nbsp;[ <a href="mailto:tyler@tyleremdur.com" style={{ color: '#66aaff' }}>Contact</a> ]
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            border: '2px outset #cccccc', background: 'linear-gradient(90deg,#003399,#000066)',
            color: '#ffffff', fontSize: 7, fontFamily: '"Press Start 2P",monospace',
            padding: '2px 5px', letterSpacing: 1, lineHeight: 1.5, display: 'inline-block',
          }}>NETSCAPE<br />NOW!</span>
          <span style={{
            border: '2px outset #999966', background: 'linear-gradient(90deg,#333300,#111100)',
            color: '#ffff00', fontSize: 7, fontFamily: '"Press Start 2P",monospace',
            padding: '2px 5px', letterSpacing: 1, lineHeight: 1.5, display: 'inline-block',
          }}>BEST AT<br />800x600</span>
        </span>
        <span className="w0-mono" style={{ color: '#00ff00' }}>{time}</span>
      </div>
    </div>
  )
}
