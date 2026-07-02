'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { projects } from '@/lib/data/projects'
import HomeButton from './HomeButton'
import { useWorldStore } from '@/lib/world-store'
import { LiveRadio, nearestStation, type RadioStatus } from './garage/live-radio'
import type { RadioStation } from '@/app/api/radio/route'

const GarageScene = dynamic(() => import('./garage/GarageScene'), { ssr: false })
const NightDrive = dynamic(() => import('./garage/NightDrive'), { ssr: false })

const FREQ_LO = 87.7
const FREQ_HI = 108.0

function regionName(code: string) {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code } catch { return code }
}
function countryFlag(code: string) {
  if (!/^[A-Za-z]{2}$/.test(code)) return '📻'
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)))
}

// ── the analog slide-rule tuning dial ────────────────────────────────────────
function TuningDial({
  freq, stations, onTune, onGesture,
}: {
  freq: number
  stations: RadioStation[]
  onTune: (f: number) => void
  onGesture: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const setFromClientX = useCallback((clientX: number) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
    onTune(Math.round((FREQ_LO + (FREQ_HI - FREQ_LO) * t) * 10) / 10)
  }, [onTune])

  const pct = (f: number) => ((f - FREQ_LO) / (FREQ_HI - FREQ_LO)) * 100

  return (
    <div
      ref={ref}
      onPointerDown={e => {
        e.preventDefault(); onGesture(); dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId); setFromClientX(e.clientX)
      }}
      onPointerMove={e => { if (dragging.current) setFromClientX(e.clientX) }}
      onPointerUp={e => { dragging.current = false; e.currentTarget.releasePointerCapture(e.pointerId) }}
      onWheel={e => { onGesture(); onTune(Math.round((freq + (e.deltaY > 0 ? 0.1 : -0.1)) * 10) / 10) }}
      style={{
        position: 'relative', height: 58, cursor: 'ew-resize',
        background: 'linear-gradient(180deg, #0c1a12 0%, #071009 100%)',
        border: '1px solid rgba(120,255,170,0.14)', borderRadius: 4, overflow: 'hidden',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)', touchAction: 'none', userSelect: 'none',
      }}
    >
      {/* backlit slide-rule scale */}
      {Array.from({ length: 41 }).map((_, i) => {
        const f = FREQ_LO + (FREQ_HI - FREQ_LO) * (i / 40)
        const major = i % 5 === 0
        return (
          <div key={i} style={{
            position: 'absolute', left: `${(i / 40) * 100}%`, top: 4,
            width: 1, height: major ? 12 : 7, background: 'rgba(120,255,170,0.35)',
          }}>
            {major && (
              <div style={{ position: 'absolute', top: 13, left: -8, width: 16, textAlign: 'center',
                fontFamily: '"Space Mono", monospace', fontSize: 6.5, color: 'rgba(120,255,170,0.4)' }}>
                {f.toFixed(0)}
              </div>
            )}
          </div>
        )
      })}
      {/* station call-marks on the dial */}
      {stations.map(s => (
        <div key={s.id} title={s.name} style={{
          position: 'absolute', left: `${pct(s.freq)}%`, bottom: 5, transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 8, lineHeight: 1 }}>{countryFlag(s.country)}</div>
          <div style={{ width: 2, height: 9, background: 'rgba(255,179,71,0.7)', marginTop: 1 }} />
        </div>
      ))}
      {/* the needle */}
      <div style={{
        position: 'absolute', left: `${pct(freq)}%`, top: 0, bottom: 0, width: 2,
        transform: 'translateX(-50%)', background: 'linear-gradient(180deg, #ff5a4a, #b81f10)',
        boxShadow: '0 0 8px rgba(255,80,60,0.9)', pointerEvents: 'none',
      }} />
    </div>
  )
}

// ── instrument cluster (idle gauges, the 12:47 clock) ────────────────────────
function Gauge({ label, value, sweep, unit, color = 'rgba(120,255,170,0.85)' }: {
  label: string; value: string; sweep: number; unit?: string; color?: string
}) {
  const a = -130 + sweep * 260
  return (
    <div style={{ position: 'relative', width: 66, height: 66, textAlign: 'center' }}>
      <svg width={66} height={66} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={33} cy={33} r={29} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
        <path d="M 33 33 L 33 10" stroke={color} strokeWidth={1.6} transform={`rotate(${a} 33 33)`} opacity={0.9} />
        <circle cx={33} cy={33} r={2.4} fill={color} />
      </svg>
      <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, fontFamily: '"Space Mono", monospace' }}>
        <div style={{ fontSize: 11, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 6, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{unit ?? label}</div>
      </div>
    </div>
  )
}

const STATUS_LABEL: Record<RadioStatus, string> = {
  off: 'OFF', static: 'STATIC', tuning: 'TUNING…', live: 'ON AIR',
}

export default function World6Garage() {
  const findSecret = useWorldStore(s => s.findSecret)
  const secretsFound = useWorldStore(s => s.secretsFound)

  const [headlightsOn, setHeadlightsOn] = useState(false)
  const [gloveOpen, setGloveOpen] = useState(false)
  const [freq, setFreq] = useState(96.1)
  const [stations, setStations] = useState<RadioStation[]>([])
  const [loadingStations, setLoadingStations] = useState(true)
  const [status, setStatus] = useState<RadioStatus>('static')
  const [liveStation, setLiveStation] = useState<RadioStation | null>(null)
  const [volume, setVolume] = useState(0.75)
  const [muted, setMuted] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showIntro, setShowIntro] = useState(true)
  const [driving, setDriving] = useState(false)
  const [igniting, setIgniting] = useState(false)
  const radioRef = useRef<LiveRadio | null>(null)

  // nearest station + how well it's tuned (for the display, independent of buffering)
  const near = nearestStation(freq, stations)

  const ensureRadio = useCallback(() => {
    if (!radioRef.current) {
      const r = new LiveRadio()
      r.onStatus = (s, st) => { setStatus(s); setLiveStation(st) }
      r.start()
      r.setStations(stations)
      r.setMasterVolume(volume)
      radioRef.current = r
    }
    radioRef.current.resume()
    return radioRef.current
  }, [stations, volume])

  // fetch the live station pool
  useEffect(() => {
    let cancelled = false
    fetch('/api/radio')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const list: RadioStation[] = Array.isArray(d?.stations) ? d.stations : []
        setStations(list)
        setLoadingStations(false)
        radioRef.current?.setStations(list)
        // park the needle on the first station so there's something to catch immediately
        if (list.length) setFreq(list[Math.floor(list.length / 2)].freq)
      })
      .catch(() => setLoadingStations(false))
    return () => { cancelled = true }
  }, [])

  useEffect(() => () => { radioRef.current?.stop() }, [])
  useEffect(() => { const t = setTimeout(() => setShowIntro(false), 6000); return () => clearTimeout(t) }, [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }, [toast])

  // radio follows the dial
  useEffect(() => { radioRef.current?.tune(freq) }, [freq, stations])
  useEffect(() => { radioRef.current?.setMasterVolume(volume) }, [volume])
  useEffect(() => { radioRef.current?.setMuted(muted) }, [muted])

  const tuneTo = useCallback((f: number) => setFreq(Math.max(FREQ_LO, Math.min(FREQ_HI, f))), [])

  const seekStation = useCallback((dir: number) => {
    ensureRadio()
    if (!stations.length) return
    const sorted = [...stations].sort((a, b) => a.freq - b.freq)
    const next = dir > 0
      ? sorted.find(s => s.freq > freq + 0.15) ?? sorted[0]
      : [...sorted].reverse().find(s => s.freq < freq - 0.15) ?? sorted[sorted.length - 1]
    setFreq(next.freq)
    findSecret('garage-tuned-the-world')
  }, [stations, freq, ensureRadio, findSecret])

  const turnKey = useCallback(() => {
    if (driving || igniting) return
    const radio = ensureRadio()
    setIgniting(true)
    radio.engineStart()
    setHeadlightsOn(true)
    setTimeout(() => {
      setIgniting(false)
      setDriving(true)
      findSecret('garage-took-the-drive')
    }, 1600)
  }, [driving, igniting, ensureRadio, findSecret])

  function handleFindCassette(id: string, label: string) {
    if (secretsFound.includes(id)) return
    findSecret(id)
    setToast(label)
  }

  const dashText = 'rgba(255,236,205,0.85)'
  const stationName = liveStation?.name ?? (near.station && near.strength > 0.2 ? near.station.name : null)
  const stationCountry = liveStation?.country ?? near.station?.country

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#050608', overflow: 'hidden' }}>
      <style>{`
        @keyframes garage-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes vfd-flicker { 0%,97%,100%{opacity:1} 98%{opacity:0.85} }
      `}</style>

      {/* the windshield — 3D garage, driver's seat POV */}
      <GarageScene headlightsOn={headlightsOn} engineOn={driving} />

      {/* windshield frame: A-pillars + roofline (decorative, let drags reach canvas) */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '9%', height: '62%',
          background: 'linear-gradient(115deg, rgba(4,5,7,0.96) 40%, transparent)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '9%', height: '62%',
          background: 'linear-gradient(245deg, rgba(4,5,7,0.96) 40%, transparent)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '7%',
          background: 'linear-gradient(180deg, rgba(4,5,7,0.98), transparent)' }} />
        {/* rear-view mirror */}
        <div style={{
          position: 'absolute', top: '4%', left: '50%', transform: 'translateX(-50%)',
          width: 132, height: 34, borderRadius: 17,
          background: 'linear-gradient(180deg, #0b0d11, #05070a)',
          border: '2px solid #16181d', boxShadow: '0 6px 18px rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          <div style={{ width: '92%', height: '68%', borderRadius: 12,
            background: 'radial-gradient(ellipse at 70% 40%, rgba(255,180,120,0.16), rgba(6,7,10,0.9) 70%)' }} />
          <div style={{ position: 'absolute', right: 12, width: 4, height: 4, borderRadius: '50%',
            background: '#ff3b30', boxShadow: '0 0 6px #ff3b30' }} />
        </div>
      </div>

      {/* title / intro */}
      <div style={{ position: 'fixed', top: 20, left: 24, zIndex: 30,
        fontFamily: '"Space Mono", monospace', color: 'rgba(255,223,140,0.85)', animation: 'garage-fade 0.8s ease' }}>
        <div style={{ fontSize: 13, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Midnight Garage</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>12:47 AM · engine off</div>
        {showIntro && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 8, maxWidth: 250, lineHeight: 1.7 }}>
            drag the windshield to look around · tune the radio to real stations from around the world · turn the key to drive
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 60, fontFamily: '"Space Mono", monospace',
          fontSize: 10, letterSpacing: '0.12em', color: '#F472B6', background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(244,114,182,0.4)', padding: '10px 14px', animation: 'garage-fade 0.3s ease' }}>
          ◆ found a tape — {toast}
        </div>
      )}

      <HomeButton />

      {/* ── THE DASHBOARD ────────────────────────────────────────────────── */}
      {!driving && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
          height: 'clamp(230px, 40vh, 300px)',
          background: 'linear-gradient(180deg, rgba(10,10,12,0) 0%, rgba(12,11,10,0.82) 16%, #0c0b0a 46%, #060505 100%)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          gap: 'clamp(10px, 2.4vw, 34px)', padding: '0 clamp(12px,3vw,40px) clamp(14px,3vh,26px)',
          fontFamily: '"Space Mono", monospace',
        }}>
          {/* left: steering wheel + gauges */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
            {/* wheel */}
            <div style={{ position: 'relative', width: 128, height: 78, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                width: 150, height: 150, borderRadius: '50%',
                border: '13px solid #17181c', boxShadow: 'inset 0 0 24px rgba(0,0,0,0.9), 0 -2px 10px rgba(0,0,0,0.6)' }} />
              <div style={{ position: 'absolute', top: 66, left: '50%', transform: 'translateX(-50%)',
                width: 46, height: 30, borderRadius: 8, background: '#17181c',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 8, color: 'rgba(255,223,140,0.5)', letterSpacing: '0.1em' }}>EMDUR</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Gauge label="MPH" value="0" sweep={0} unit="MPH" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingBottom: 4 }}>
                <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 15, color: 'rgba(120,255,170,0.85)',
                  textShadow: '0 0 8px rgba(120,255,170,0.4)' }}>12:47</div>
                <div style={{ fontSize: 6, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>AM · CLOCK</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 6, color: 'rgba(255,90,60,0.7)' }}>▮ FUEL E</span>
                  <span style={{ fontSize: 6, color: 'rgba(120,180,255,0.7)' }}>TEMP C</span>
                </div>
              </div>
            </div>
          </div>

          {/* center: the radio head unit */}
          <div style={{
            flex: '1 1 340px', maxWidth: 440, minWidth: 260,
            background: 'linear-gradient(180deg, #1a1712, #0e0c09)',
            border: '1px solid rgba(255,179,71,0.18)', borderRadius: 8,
            padding: '12px 14px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,220,150,0.06)',
          }}>
            {/* VFD readout */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#050805', border: '1px solid rgba(120,255,170,0.12)', borderRadius: 4,
              padding: '7px 10px', marginBottom: 10, animation: 'vfd-flicker 5s infinite',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 22, color: '#7dffb0', textShadow: '0 0 10px rgba(120,255,170,0.5)', letterSpacing: '0.02em' }}>
                    {freq.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 9, color: 'rgba(120,255,170,0.5)' }}>FM</span>
                  <span style={{
                    fontSize: 8, letterSpacing: '0.14em', padding: '1px 6px', borderRadius: 2,
                    color: status === 'live' ? '#0a0a0a' : 'rgba(255,179,71,0.85)',
                    background: status === 'live' ? '#7dffb0' : 'rgba(255,179,71,0.12)',
                  }}>{muted ? 'MUTED' : STATUS_LABEL[status]}</span>
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,236,205,0.7)', marginTop: 3, minHeight: 12,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
                  {loadingStations ? 'acquiring stations…'
                    : stationName
                      ? `${countryFlag(stationCountry ?? '')} ${stationName} · ${regionName(stationCountry ?? '')}`
                      : '— between stations —'}
                </div>
              </div>
              {/* signal strength */}
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 20 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    width: 3, height: 4 + i * 4,
                    background: near.strength * 5 > i ? '#7dffb0' : 'rgba(255,255,255,0.12)',
                    boxShadow: near.strength * 5 > i ? '0 0 4px rgba(120,255,170,0.6)' : 'none',
                  }} />
                ))}
              </div>
            </div>

            {/* the dial */}
            <TuningDial freq={freq} stations={stations} onTune={tuneTo} onGesture={ensureRadio} />

            {/* controls row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <button onClick={() => seekStation(-1)} style={radioBtn}>◀ SEEK</button>
              <button onClick={() => seekStation(1)} style={radioBtn}>SEEK ▶</button>
              <button onClick={() => { ensureRadio(); setMuted(m => !m) }} style={{ ...radioBtn, color: muted ? '#ff5a4a' : radioBtn.color }}>
                {muted ? 'MUTED' : 'MUTE'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>VOL</span>
                <input type="range" min={0} max={1} step={0.01} value={volume}
                  onChange={e => { ensureRadio(); setVolume(parseFloat(e.target.value)) }}
                  style={{ flex: 1, accentColor: '#ffb347', minWidth: 40 }} />
              </div>
            </div>

            {/* presets */}
            <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
              {stations.slice(0, 6).map((s, i) => (
                <button key={s.id} onClick={() => { ensureRadio(); tuneTo(s.freq) }} title={s.name}
                  style={{
                    ...presetBtn,
                    borderColor: Math.abs(s.freq - freq) < 0.2 ? 'rgba(255,179,71,0.7)' : presetBtn.border as string,
                    color: Math.abs(s.freq - freq) < 0.2 ? '#ffb347' : presetBtn.color,
                  }}>
                  {i + 1} {countryFlag(s.country)}
                </button>
              ))}
            </div>
          </div>

          {/* right: ignition + glovebox + headlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, paddingBottom: 4 }}>
            <button onClick={turnKey} disabled={igniting} style={{
              ...dashCtl, borderColor: 'rgba(255,223,140,0.4)',
              color: 'rgba(255,223,140,0.9)', cursor: igniting ? 'wait' : 'pointer',
            }}>
              <span style={{ display: 'inline-block', marginRight: 6, transition: 'transform 0.5s',
                transform: igniting ? 'rotate(90deg)' : 'none' }}>⚿</span>
              {igniting ? 'STARTING…' : 'TURN KEY · DRIVE'}
            </button>
            <button onClick={() => { setHeadlightsOn(v => !v) }} style={{
              ...dashCtl, color: headlightsOn ? '#fff2d0' : 'rgba(255,255,255,0.5)',
              borderColor: headlightsOn ? 'rgba(255,240,190,0.5)' : 'rgba(255,255,255,0.15)' }}>
              ☀ HEADLIGHTS {headlightsOn ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => { setGloveOpen(true); findSecret('garage-opened-glovebox') }} style={dashCtl}>
              🗄 GLOVEBOX · WORK
            </button>
            {/* cassettes tucked in the console */}
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              {CASSETTES.map(c => {
                const found = secretsFound.includes(c.id)
                return (
                  <div key={c.id} onClick={() => handleFindCassette(c.id, c.label)} title="a cassette tape"
                    style={{
                      width: 26, height: 17, borderRadius: 2, cursor: found ? 'default' : 'pointer',
                      background: found ? 'linear-gradient(180deg,#F472B6,#a02f6e)' : 'linear-gradient(180deg,#3a2f1e,#221a10)',
                      border: '1px solid rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <div style={{ width: 14, height: 6, borderRadius: 1, background: 'rgba(0,0,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
                      <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* glovebox → projects */}
      {gloveOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(2,3,5,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'garage-fade 0.3s ease' }}
          onClick={() => setGloveOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 'min(560px, 92vw)', maxHeight: '84vh', overflowY: 'auto',
            background: 'linear-gradient(180deg, #14110c, #0a0806)', border: '1px solid rgba(255,223,140,0.25)',
            fontFamily: '"Space Mono", monospace', boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
          }}>
            <div style={{ position: 'sticky', top: 0, background: '#14110c', padding: '14px 18px',
              borderBottom: '1px solid rgba(255,223,140,0.2)', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,223,140,0.9)' }}>GLOVEBOX — REGISTRATION &amp; WORK</div>
              <div onClick={() => setGloveOpen(false)} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>×</div>
            </div>
            <div style={{ padding: '4px 18px 20px' }}>
              {projects.map(p => (
                <div key={p.id} style={{ padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{p.title}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{p.year}</div>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginTop: 4 }}>{p.description}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,223,140,0.6)', marginTop: 6 }}>{p.tech.join(' · ')}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
                    {p.links.github && <a href={p.links.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#ffb347' }}>github →</a>}
                    {p.links.live && <a href={p.links.live} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#ffb347' }}>live →</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* the drive */}
      {driving && (
        <NightDrive
          freq={freq}
          station={liveStation ?? (near.strength > 0.3 ? near.station : null)}
          status={status}
          onSeek={seekStation}
          onExit={() => setDriving(false)}
          onLongDrive={() => findSecret('garage-every-mile-marker')}
        />
      )}
    </div>
  )
}

const radioBtn: React.CSSProperties = {
  fontFamily: '"Space Mono", monospace', fontSize: 8, letterSpacing: '0.1em', padding: '5px 8px',
  background: 'rgba(255,179,71,0.06)', border: '1px solid rgba(255,179,71,0.25)', borderRadius: 3,
  color: 'rgba(255,179,71,0.85)', cursor: 'pointer', whiteSpace: 'nowrap',
}
const presetBtn: React.CSSProperties = {
  fontFamily: '"Space Mono", monospace', fontSize: 9, padding: '3px 7px',
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 3,
  color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
}
const dashCtl: React.CSSProperties = {
  fontFamily: '"Space Mono", monospace', fontSize: 9, letterSpacing: '0.1em', padding: '9px 12px',
  background: 'rgba(20,18,14,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
  color: 'rgba(255,255,255,0.7)', cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap',
}

const CASSETTES: Array<{ id: string; label: string }> = [
  { id: 'garage-cassette-shelf', label: 'MIX — SENIOR YEAR, I-70 WEST' },
  { id: 'garage-cassette-undercar', label: "SIDE B — DIDN'T FINISH RECORDING" },
  { id: 'garage-cassette-toolbox', label: 'PRACTICE TAPE — FIRST DEMO, 2016' },
]
