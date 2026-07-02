'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useWorldStore } from '@/lib/world-store'
import { projects } from '@/lib/data/projects'
import HomeButton from './HomeButton'
import { RadioAudio, RADIO_STATIONS, type RadioStatus } from './garage/radio-audio'

const GarageScene = dynamic(() => import('./garage/GarageScene'), { ssr: false })
const NightDrive = dynamic(() => import('./garage/NightDrive'), { ssr: false })

const SORTED_FREQS = RADIO_STATIONS.map(s => s.freq).sort((a, b) => a - b)

export default function World6Garage() {
  const findSecret = useWorldStore(s => s.findSecret)
  const secretsFound = useWorldStore(s => s.secretsFound)

  const [headlightsOn, setHeadlightsOn] = useState(false)
  const [gloveboxOpen, setGloveboxOpen] = useState(false)
  const [radioOpen, setRadioOpen] = useState(false)
  const [muted, setMuted] = useState(false)
  const [freq, setFreq] = useState(96.9)
  const [status, setStatus] = useState<RadioStatus>({ station: null, closeness: 0, state: 'static' })
  const [toast, setToast] = useState<string | null>(null)
  const [showIntro, setShowIntro] = useState(true)
  const [driving, setDriving] = useState(false)
  const [igniting, setIgniting] = useState(false)
  const audioRef = useRef<RadioAudio | null>(null)

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const r = new RadioAudio()
      r.setStatusListener(setStatus)
      r.start()
      r.setDial(freq)
      audioRef.current = r
    }
    return audioRef.current
  }, [freq])

  useEffect(() => () => { audioRef.current?.stop() }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 5200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  function handleFindCassette(id: string, label: string) {
    if (secretsFound.includes(id)) return
    findSecret(id)
    setToast(label)
  }

  // radio audio follows the dial
  useEffect(() => { audioRef.current?.setDial(freq) }, [freq])
  useEffect(() => { audioRef.current?.setMuted(muted) }, [muted])

  const tuned = status.state === 'live' && status.closeness > 0.45
  const station = status.station

  const seekStation = useCallback((dir: number) => {
    ensureAudio()
    setFreq(f => {
      if (dir > 0) return SORTED_FREQS.find(s => s > f + 0.05) ?? SORTED_FREQS[0]
      return [...SORTED_FREQS].reverse().find(s => s < f - 0.05) ?? SORTED_FREQS[SORTED_FREQS.length - 1]
    })
  }, [ensureAudio])

  const turnKey = useCallback(() => {
    if (driving || igniting) return
    const audio = ensureAudio()
    setIgniting(true)
    audio.engineStart()
    setHeadlightsOn(true)
    setTimeout(() => {
      setIgniting(false)
      setDriving(true)
      findSecret('garage-took-the-drive')
    }, 1500)
  }, [driving, igniting, ensureAudio, findSecret])

  // what the radio readout says, driven by real connection state
  const readoutName = station
    ? (status.state === 'live' ? station.name : status.state === 'connecting' ? 'TUNING…' : status.state === 'dead' ? 'SIGNAL LOST' : station.name)
    : 'STATIC'
  const readoutSub = station
    ? (status.state === 'live' ? `${station.place} · ${station.genre}`
      : status.state === 'connecting' ? `reaching ${station.place.toLowerCase()}…`
      : status.state === 'dead' ? 'no carrier — try another frequency'
      : `${station.place} · ${station.genre}`)
    : 'nothing but the space between stations'

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#05070a', overflow: 'hidden' }}>
      <style>{`
        @keyframes garage-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes garage-static-bar { 0%,100% { transform: scaleY(0.3) } 50% { transform: scaleY(1) } }
      `}</style>

      <GarageScene
        headlightsOn={headlightsOn}
        onToggleHeadlights={() => setHeadlightsOn(v => !v)}
        gloveboxOpen={gloveboxOpen}
        onToggleGlovebox={() => setGloveboxOpen(v => !v)}
        onRadioClick={() => { ensureAudio(); setRadioOpen(v => !v) }}
        radioActive={radioOpen || driving || status.state === 'live'}
        onIgnition={turnKey}
        igniting={igniting}
        foundCassettes={secretsFound}
        onFindCassette={handleFindCassette}
      />

      {/* Title / intro */}
      <div style={{
        position: 'fixed', top: 24, left: 24, zIndex: 50,
        fontFamily: '"Space Mono", monospace', color: 'rgba(255,223,140,0.85)',
        animation: 'garage-fade 0.8s ease',
      }}>
        <div style={{ fontSize: 13, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Midnight Garage</div>
        {showIntro && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6, maxWidth: 280, lineHeight: 1.6 }}>
            drag to look around the cabin · click the radio to tune real stations · the knob is the headlights · the glovebox holds the projects · some tapes are hidden · turn the key to drive
          </div>
        )}
      </div>

      {/* ignition */}
      {!driving && (
        <div
          onClick={turnKey}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 50,
            fontFamily: '"Space Mono", monospace', cursor: igniting ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(10,12,16,0.85)', border: '1px solid rgba(255,223,140,0.3)',
            padding: '12px 16px', backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{
            display: 'inline-block', fontSize: 15, color: '#ffdf8c',
            transform: igniting ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.5s ease',
          }}>⚿</span>
          <span style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(255,223,140,0.85)' }}>
            {igniting ? 'ENGINE TURNING OVER…' : 'TURN THE KEY — DRIVE'}
          </span>
        </div>
      )}

      {/* secret-found toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 60,
          fontFamily: '"Space Mono", monospace', fontSize: 10, letterSpacing: '0.12em',
          color: '#F472B6', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(244,114,182,0.4)',
          padding: '10px 14px', animation: 'garage-fade 0.3s ease', backdropFilter: 'blur(6px)',
        }}>
          ◆ found a tape — {toast}
        </div>
      )}

      {/* Glovebox panel — projects */}
      {gloveboxOpen && (
        <div style={{
          position: 'fixed', right: 24, bottom: 24, top: 24, width: 340, zIndex: 55,
          background: 'rgba(10,12,16,0.92)', border: '1px solid rgba(255,223,140,0.25)',
          backdropFilter: 'blur(10px)', overflowY: 'auto', animation: 'garage-fade 0.35s ease',
          fontFamily: '"Space Mono", monospace',
        }}>
          <div style={{
            position: 'sticky', top: 0, background: 'rgba(10,12,16,0.95)', padding: '14px 16px',
            borderBottom: '1px solid rgba(255,223,140,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,223,140,0.9)' }}>GLOVEBOX — PROJECTS</div>
            <div onClick={() => setGloveboxOpen(false)} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>×</div>
          </div>
          <div style={{ padding: '10px 16px 20px' }}>
            {projects.map(p => (
              <div key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: 12, color: '#fff', fontWeight: 'bold' }}>{p.title}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{p.year}</div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginTop: 4 }}>{p.description}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,223,140,0.6)', marginTop: 6, letterSpacing: '0.06em' }}>{p.tech.join(' · ')}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
                  {p.links.github && <a href={p.links.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#ffb347' }}>github →</a>}
                  {p.links.live && <a href={p.links.live} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#ffb347' }}>live →</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Radio tuner panel — real live stations */}
      {radioOpen && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 55,
          width: 420, maxWidth: 'calc(100vw - 48px)', background: 'rgba(10,12,16,0.92)',
          border: '1px solid rgba(255,179,71,0.3)', backdropFilter: 'blur(10px)', padding: 16,
          fontFamily: '"Space Mono", monospace', animation: 'garage-fade 0.35s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,179,71,0.9)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {readoutName}
              {status.state === 'live' && (
                <span style={{ fontSize: 7, letterSpacing: '0.14em', color: '#ff5a3c', border: '1px solid rgba(255,90,60,0.5)', padding: '1px 4px' }}>● LIVE</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div onClick={() => setMuted(m => !m)} title="mute" style={{ cursor: 'pointer', fontSize: 12, color: muted ? 'rgba(255,90,60,0.8)' : 'rgba(255,179,71,0.7)' }}>{muted ? '🔇' : '🔊'}</div>
              <div onClick={() => setRadioOpen(false)} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>×</div>
            </div>
          </div>

          {/* static visualizer — quiets as the lock tightens */}
          <div style={{ display: 'flex', gap: 2, height: 20, alignItems: 'flex-end', marginBottom: 10, opacity: 0.35 + (1 - status.closeness) * 0.55 }}>
            {Array.from({ length: 34 }).map((_, i) => (
              <div key={i} style={{
                flex: 1, background: tuned ? '#ffb347' : 'rgba(255,255,255,0.3)', height: '100%',
                animation: `garage-static-bar ${0.3 + (i % 5) * 0.07}s ease-in-out infinite`,
                animationDelay: `${i * 0.02}s`,
              }} />
            ))}
          </div>

          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', minHeight: 16, marginBottom: 10 }}>
            {readoutSub}
          </div>

          {/* dial with station ticks */}
          <div style={{ position: 'relative', marginBottom: 4 }}>
            <input
              type="range" min={88} max={108} step={0.1} value={freq}
              onChange={e => { ensureAudio(); setFreq(parseFloat(e.target.value)) }}
              style={{ width: '100%', accentColor: '#ffb347' }}
            />
            <div style={{ position: 'relative', height: 10, marginTop: 2 }}>
              {RADIO_STATIONS.map(s => (
                <div key={s.id} title={`${s.name} — ${s.place}`}
                  onClick={() => { ensureAudio(); setFreq(s.freq) }}
                  style={{
                    position: 'absolute', left: `${((s.freq - 88) / 20) * 100}%`, transform: 'translateX(-50%)',
                    width: 3, height: 7, cursor: 'pointer',
                    background: station?.id === s.id ? '#ffb347' : 'rgba(255,179,71,0.35)',
                  }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            <span>88.0</span>
            <span style={{ color: '#ffb347' }}>{freq.toFixed(1)} FM</span>
            <span>108.0</span>
          </div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', marginTop: 8, letterSpacing: '0.08em', lineHeight: 1.6 }}>
            live streams from paris · köln · san francisco · paradise, ca — tap a tick to jump the dial
          </div>
        </div>
      )}

      {/* the drive */}
      {driving && (
        <NightDrive
          freq={freq}
          stationName={tuned && station ? station.name : (status.state === 'connecting' ? 'tuning…' : 'static')}
          stationPlaying={station ? readoutSub : 'seek with ← →'}
          tuned={tuned}
          onSeek={seekStation}
          onExit={() => setDriving(false)}
          onLongDrive={() => findSecret('garage-every-mile-marker')}
        />
      )}

      <HomeButton />
    </div>
  )
}
