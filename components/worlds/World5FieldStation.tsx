'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useWorldStore } from '@/lib/world-store'

function SignalMeter({ value, label, unit = '', flatline = false }: { value: number; label: string; unit?: string; flatline?: boolean }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(180,220,180,0.6)', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(180,220,180,0.8)' }}>{flatline ? '———' : `${value.toFixed(1)}${unit}`}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: flatline ? '0%' : `${Math.min(100, value)}%`,
          background: flatline ? 'rgba(255,80,80,0.4)' : 'linear-gradient(90deg, rgba(100,200,120,0.6), rgba(150,250,170,0.8))',
          transition: 'width 0.8s, background 0.5s',
          borderRadius: 2,
        }} />
      </div>
    </div>
  )
}

function WorldMapDot() {
  // Boulder, CO: 40.0150°N, 105.2705°W
  const lat = 40.0150, lng = -105.2705
  const x = ((lng + 180) / 360) * 100
  const y = ((90 - lat) / 180) * 100
  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '50%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(100,200,120,0.1)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Simple SVG world map outline */}
        <svg viewBox="0 0 360 180" style={{ width: '100%', height: '100%', opacity: 0.15 }}>
          <rect width="360" height="180" fill="none" />
          {/* Very rough continents */}
          <path d="M60,40 L80,35 L100,38 L115,50 L110,65 L95,72 L75,70 L62,60 Z" fill="rgba(100,200,120,0.6)" />
          <path d="M120,30 L160,28 L175,35 L180,55 L170,75 L155,80 L135,78 L120,65 L115,45 Z" fill="rgba(100,200,120,0.6)" />
          <path d="M70,80 L90,78 L100,90 L95,110 L80,115 L68,105 L65,90 Z" fill="rgba(100,200,120,0.6)" />
          <path d="M165,55 L185,50 L200,60 L205,80 L195,95 L175,95 L162,85 L158,70 Z" fill="rgba(100,200,120,0.6)" />
          <path d="M200,40 L230,35 L260,42 L275,60 L265,80 L240,88 L215,82 L198,65 L195,50 Z" fill="rgba(100,200,120,0.6)" />
          <path d="M230,85 L255,82 L270,95 L265,115 L250,120 L232,115 L225,100 Z" fill="rgba(100,200,120,0.6)" />
          <path d="M295,65 L330,60 L345,75 L340,95 L315,100 L295,88 Z" fill="rgba(100,200,120,0.6)" />
          <path d="M300,110 L330,105 L340,120 L330,140 L305,138 L298,125 Z" fill="rgba(100,200,120,0.6)" />
        </svg>
        {/* Dot for Boulder */}
        <div style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          width: 6, height: 6, borderRadius: '50%',
          background: 'rgba(100,200,120,0.9)',
          boxShadow: '0 0 8px rgba(100,200,120,0.8)',
          transform: 'translate(-50%, -50%)',
          animation: 'mapPulse 2s infinite',
        }} />
        <div style={{ position: 'absolute', left: `${x}%`, top: `${y + 8}%`, transform: 'translateX(-50%)', fontFamily: 'monospace', fontSize: 7, color: 'rgba(100,200,120,0.7)', whiteSpace: 'nowrap', letterSpacing: '0.1em' }}>
          BOULDER · CO
        </div>
      </div>
    </div>
  )
}

export default function World5FieldStation() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const interactionCount = useWorldStore(s => s.interactionCount)
  const [time, setTime] = useState('')
  const [signalStrength, setSignalStrength] = useState(87)
  const [flatline, setFlatline] = useState(false)
  const [flatlineMsg, setFlatlineMsg] = useState('')
  const [hatchClicks, setHatchClicks] = useState(0)
  const [antennaClicks, setAntennaClicks] = useState(0)
  const [uptime, setUptime] = useState(0)
  const sessionStart = useWorldStore(s => s.sessionStart)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setUptime(Math.floor((Date.now() - sessionStart) / 1000))
      // Signal fluctuation
      setSignalStrength(s => {
        const target = 85 + Math.sin(Date.now() * 0.0003) * 12
        return s + (target - s) * 0.05
      })
    }
    tick()
    const iv = setInterval(tick, 1000)
    // Flatline after 30s
    const ft = setTimeout(() => {
      setFlatline(true)
      setFlatlineMsg('BUILDER OF THINGS. RUNNER OF TRAILS. INTERESTED IN INTERESTING PROBLEMS.')
    }, 30000)
    return () => { clearInterval(iv); clearTimeout(ft) }
  }, [sessionStart])

  const handleAntennaClick = useCallback((e: React.MouseEvent) => {
    const c = antennaClicks + 1
    setAntennaClicks(c)
    if (c >= 2) navigateTo(3, { type: 'expand-white', origin: { x: e.clientX, y: e.clientY } })
  }, [antennaClicks, navigateTo])

  const handleHatchClick = useCallback((e: React.MouseEvent) => {
    const c = hatchClicks + 1
    setHatchClicks(c)
    if (c >= 7) navigateTo(6, { type: 'nothing' })
  }, [hatchClicks, navigateTo])

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`
  }

  return (
    <div
      data-world="5"
      style={{
        position: 'fixed', inset: 0,
        background: '#020a04',
        fontFamily: '"Playfair Display", serif',
        overflow: 'hidden',
      }}
    >
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(100,200,120,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(100,200,120,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', padding: '32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(100,200,120,0.5)', marginBottom: 6 }}>MONITORING STATION · SECTOR 05</div>
            <div style={{ fontSize: 28, fontWeight: 400, color: '#fff', letterSpacing: '-0.01em' }}>FIELD STATION</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 22, color: 'rgba(100,200,120,0.9)', letterSpacing: '0.1em' }}>{time}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(100,200,120,0.35)', letterSpacing: '0.15em', marginTop: 4 }}>LOCAL TIME · UTC-7</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, flex: 1 }}>

          {/* Signal panel */}
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(100,200,120,0.1)', padding: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(100,200,120,0.45)', marginBottom: 16 }}>SIGNAL ANALYSIS</div>
            <SignalMeter value={signalStrength} label="Primary Signal" unit="%" flatline={flatline} />
            <SignalMeter value={72} label="Uplink Quality" unit="%" />
            <SignalMeter value={interactionCount * 4 % 100} label="Interaction Index" unit="%" />
            <SignalMeter value={uptime % 100} label="Session Uptime" unit="s" />
            {flatline && (
              <div style={{ marginTop: 16, padding: '12px', background: 'rgba(255,100,100,0.05)', border: '1px solid rgba(255,100,100,0.15)', fontFamily: '"Playfair Display", serif', fontSize: 11, color: 'rgba(255,200,150,0.7)', lineHeight: 1.7, letterSpacing: '0.05em', fontStyle: 'italic' }}>
                "{flatlineMsg}"
              </div>
            )}
          </div>

          {/* Map panel */}
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(100,200,120,0.1)', padding: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(100,200,120,0.45)', marginBottom: 16 }}>LOCATION MATRIX</div>
            <WorldMapDot />
            <div style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 9, color: 'rgba(100,200,120,0.35)', lineHeight: 1.8 }}>
              <div>LAT · 40.0150°N</div>
              <div>LNG · 105.2705°W</div>
              <div>ALT · 5,430 ft</div>
              <div>ZONE · MST</div>
            </div>
            <div style={{ marginTop: 12, fontFamily: '"Playfair Display", serif', fontSize: 10, color: 'rgba(100,200,120,0.4)', fontStyle: 'italic' }}>
              Boulder, Colorado
            </div>
          </div>

          {/* Systems panel */}
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(100,200,120,0.1)', padding: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(100,200,120,0.45)', marginBottom: 16 }}>SYSTEMS</div>

            {/* Antenna — click to go to World 3 */}
            <div
              onClick={handleAntennaClick}
              style={{ cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ position: 'relative', width: 24, height: 48 }}>
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 3, height: 40, background: 'rgba(100,200,120,0.5)' }} />
                {[-1, 0, 1].map(i => (
                  <div key={i} style={{
                    position: 'absolute', bottom: i === -1 ? 30 : i === 0 ? 20 : 10,
                    left: '50%', transform: `translateX(-50%) rotate(${i * 45}deg)`,
                    width: 2, height: 14, background: `rgba(100,200,120,${0.3 + antennaClicks * 0.1})`,
                    transformOrigin: 'bottom center',
                  }} />
                ))}
              </div>
              <div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 11, color: `rgba(100,200,120,${0.4 + antennaClicks * 0.2})` }}>ANTENNA</div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(100,200,120,0.25)', letterSpacing: '0.1em' }}>{antennaClicks > 0 ? 'TUNING...' : 'IDLE'}</div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(100,200,120,0.06)', marginBottom: 16 }} />

            {/* Maintenance hatch — 7 clicks → World 6 */}
            <div
              onClick={handleHatchClick}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 32, height: 24, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(100,200,120,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 16, height: 2, background: `rgba(100,200,120,${0.2 + (hatchClicks / 7) * 0.6})` }} />
                {hatchClicks > 0 && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontFamily: 'monospace', fontSize: 8, color: 'rgba(100,200,120,0.5)', whiteSpace: 'nowrap' }}>
                    {hatchClicks}/7
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 11, color: 'rgba(100,200,120,0.35)' }}>MAINTENANCE HATCH</div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(100,200,120,0.2)', letterSpacing: '0.1em' }}>RESTRICTED</div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(100,200,120,0.2)', lineHeight: 2, letterSpacing: '0.1em' }}>
                <div>SESSION: {formatUptime(uptime)}</div>
                <div>INTERACTIONS: {interactionCount}</div>
                <div>STATUS: MONITORING</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mapPulse {
          0%, 100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          50% { opacity: 0.5; transform: translate(-50%,-50%) scale(1.4); }
        }
      `}</style>
    </div>
  )
}
