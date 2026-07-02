'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── The Answering Machine ─────────────────────────────────────────────────────
// A dark room. A machine with a blinking light. You can listen. You can speak.

interface Tape {
  id: string
  name: string
  text: string
  at: string
  saved?: boolean // Tyler's saved messages vs. visitor messages
}

// The saved messages: Tyler's projects call and leave voicemails.
// Every fact in here is real — see lib/data/projects.ts.
const SAVED_TAPES: Tape[] = [
  {
    id: 'saved-digger', saved: true, name: 'digger — music discovery engine', at: '2025',
    text: "hey, it's digger. someone connected their spotify at one in the morning and i walked the last.fm similarity graph for them for an hour. surfaced an ambient act with two hundred listeners. they saved nine tracks. this is what you built me for. anyway. call me back.",
  },
  {
    id: 'saved-hailbot', saved: true, name: 'hail bot — discord', at: '2024',
    text: "this is hail bot. it hailed north of denver on tuesday. i posted the alert forty-one seconds after the radar flagged it. nobody said thanks. i don't need thanks. i watch the sky. that's the job.",
  },
  {
    id: 'saved-wildfire', saved: true, name: 'wildfire risk model', at: '2025',
    text: "wildfire model here. red flag warning in the foothills, wind gusting forty. i pulled the open-meteo numbers four times so you don't have to feel it in your stomach. i'm a scikit-learn model. worrying is literally my architecture. stay inside.",
  },
  {
    id: 'saved-strava', saved: true, name: 'strava analytics', at: '2025',
    text: "it's the strava dashboard. i know you stopped at mile six on saturday. gps-confirmed. ninety seconds, at the water fountain. your moving time is safe with me. i tell no one. that is the entire feature.",
  },
  {
    id: 'saved-website', saved: true, name: 'this website', at: '2026',
    text: "hey. it's the website. you are literally inside me right now, listening to a machine i'm rendering. we should probably talk about the recursion thing. also, there's no world 4. there's never been a world 4. call me back.",
  },
]

const GREETING = "hi, you've reached tyler. i'm out running, or in the garage, or forty files deep in something. leave a message after the tone. someone will hear it. probably me."

// ── audio ─────────────────────────────────────────────────────────────────────
class TapeAudio {
  private ctx: AudioContext | null = null
  private hiss: AudioBufferSourceNode | null = null
  private hissGain: GainNode | null = null

  private ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  startHiss() {
    const ctx = this.ensure()
    if (this.hiss) return
    const len = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.18
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 3200
    const gain = ctx.createGain()
    gain.gain.value = 0.0001
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.4)
    src.connect(lp).connect(gain).connect(ctx.destination)
    src.start()
    this.hiss = src
    this.hissGain = gain
  }

  stopHiss() {
    if (!this.ctx || !this.hiss || !this.hissGain) return
    const t = this.ctx.currentTime
    this.hissGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
    const src = this.hiss
    setTimeout(() => { try { src.stop() } catch {} }, 400)
    this.hiss = null
    this.hissGain = null
  }

  beep(long = false) {
    const ctx = this.ensure()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 980
    const d = long ? 0.75 : 0.32
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.02)
    g.gain.setValueAtTime(0.09, ctx.currentTime + d - 0.06)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + d + 0.05)
  }

  click() {
    const ctx = this.ensure()
    const len = ctx.sampleRate * 0.03
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.5
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.value = 0.12
    src.connect(g).connect(ctx.destination)
    src.start()
  }

  dispose() {
    this.stopHiss()
    this.ctx?.close().catch(() => {})
    this.ctx = null
  }
}

// ── the machine's voice: speech synthesis, tuned lo-fi ───────────────────────
function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel() // one caller at a time; the tape does not overlap itself
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.95
  u.pitch = 0.7      // dragged-down, machine-through-a-small-speaker
  u.volume = 0.55
  const voices = window.speechSynthesis.getVoices()
  const en = voices.find(v => v.lang.startsWith('en') && v.localService) ?? voices.find(v => v.lang.startsWith('en'))
  if (en) u.voice = en
  window.speechSynthesis.speak(u)
}
function shutUp() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}

// ── local fallback storage ────────────────────────────────────────────────────
function loadLocalTapes(): Tape[] {
  try {
    const raw = localStorage.getItem('tape_local')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
function saveLocalTape(t: Tape) {
  try {
    const all = [...loadLocalTapes(), t].slice(-40)
    localStorage.setItem('tape_local', JSON.stringify(all))
  } catch {}
}

type Mode = 'idle' | 'playing' | 'recording' | 'recorded'

export default function World9Answering() {
  const findSecret = useWorldStore(s => s.findSecret)
  const [mode, setMode] = useState<Mode>('idle')
  const [tapes, setTapes] = useState<Tape[]>(SAVED_TAPES)
  const [display, setDisplay] = useState<{ header: string; text: string; done: boolean } | null>(null)
  const [trackIdx, setTrackIdx] = useState(-1) // -1 = greeting
  const [recName, setRecName] = useState('')
  const [recText, setRecText] = useState('')
  const [recNote, setRecNote] = useState<string | null>(null)
  const [voiceOn, setVoiceOn] = useState(true)
  const voiceOnRef = useRef(true)
  const audioRef = useRef<TapeAudio | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const playTokenRef = useRef(0)
  const heardRef = useRef<Set<string>>(new Set())

  useEffect(() => { voiceOnRef.current = voiceOn; if (!voiceOn) shutUp() }, [voiceOn])

  useEffect(() => {
    audioRef.current = new TapeAudio()
    return () => { timersRef.current.forEach(clearTimeout); audioRef.current?.dispose(); shutUp() }
  }, [])

  // load visitor messages: server + local
  useEffect(() => {
    const local = loadLocalTapes()
    fetch('/api/tape')
      .then(r => r.json())
      .then(d => {
        const server: Tape[] = Array.isArray(d?.messages) ? d.messages : []
        const seen = new Set(server.map(m => m.id))
        setTapes([...SAVED_TAPES, ...server, ...local.filter(m => !seen.has(m.id))])
      })
      .catch(() => setTapes([...SAVED_TAPES, ...local]))
  }, [])

  const wait = (ms: number) => new Promise<void>(res => {
    const t = setTimeout(res, ms)
    timersRef.current.push(t)
  })

  const typeOut = useCallback(async (header: string, text: string, token: number) => {
    setDisplay({ header, text: '', done: false })
    for (let i = 0; i <= text.length; i++) {
      if (playTokenRef.current !== token) return false
      setDisplay({ header, text: text.slice(0, i), done: false })
      await wait(text[i - 1] === '.' ? 220 : text[i - 1] === ',' ? 120 : 26 + Math.random() * 22)
    }
    setDisplay({ header, text, done: true })
    return true
  }, [])

  const stop = useCallback(() => {
    playTokenRef.current++
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    audioRef.current?.stopHiss()
    shutUp()
    setMode('idle')
    setDisplay(null)
    setTrackIdx(-1)
  }, [])

  const play = useCallback(async (startIdx = -1) => {
    const audio = audioRef.current!
    const token = ++playTokenRef.current
    audio.click()
    audio.startHiss()
    setMode('playing')

    if (startIdx === -1) {
      setTrackIdx(-1)
      if (voiceOnRef.current) speak(GREETING)
      const ok = await typeOut('OUTGOING MESSAGE', GREETING, token)
      if (!ok) return
      await wait(600)
      if (playTokenRef.current !== token) return
      audio.beep(true)
      await wait(900)
      if (playTokenRef.current !== token) return
      startIdx = 0
    }

    for (let i = startIdx; i < tapes.length; i++) {
      if (playTokenRef.current !== token) return
      const t = tapes[i]
      setTrackIdx(i)
      audio.beep()
      await wait(500)
      if (playTokenRef.current !== token) return
      const header = `MESSAGE ${i + 1} OF ${tapes.length} — ${t.name.toUpperCase()} · ${t.at.slice(0, 10)}`
      if (voiceOnRef.current) speak(t.text)
      const ok = await typeOut(header, t.text, token)
      if (!ok) return
      heardRef.current.add(t.id)
      if (SAVED_TAPES.every(s => heardRef.current.has(s.id))) findSecret('tape-heard-saved')
      await wait(1400)
    }
    if (playTokenRef.current !== token) return
    audio.beep(true)
    await typeOut('END OF MESSAGES', 'no more messages. the tape keeps going anyway.', token)
    audio.stopHiss()
    setMode('idle')
  }, [tapes, typeOut, findSecret])

  const startRecording = useCallback(async () => {
    const audio = audioRef.current!
    playTokenRef.current++
    audio.click()
    setMode('recording')
    setDisplay(null)
    setRecNote(null)
    await wait(400)
    audio.beep(true)
  }, [])

  const submitRecording = useCallback(async () => {
    const text = recText.trim()
    if (!text) return
    const audio = audioRef.current!
    audio.click()
    let msg: Tape = {
      id: 'local-' + Math.random().toString(36).slice(2, 8),
      name: recName.trim() || 'unknown caller',
      text: text.slice(0, 280),
      at: new Date().toISOString(),
    }
    let persisted = false
    try {
      const res = await fetch('/api/tape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: msg.name, text: msg.text }),
      })
      const d = await res.json()
      if (d?.message) { msg = d.message; persisted = !!d.persisted }
    } catch {}
    if (!persisted) saveLocalTape(msg)
    setTapes(prev => [...prev, msg])
    setRecText('')
    setRecName('')
    setRecNote(persisted
      ? 'message recorded. the next visitor will hear it.'
      : 'message recorded to this machine. (the phone line out is unplugged — it stays here.)')
    setMode('recorded')
    findSecret('tape-left-message')
  }, [recText, recName, findSecret])

  const playing = mode === 'playing'
  const msgCount = tapes.length

  return (
    <div data-world="9" style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: 'radial-gradient(ellipse 90% 70% at 50% 62%, #17110a 0%, #0a0705 45%, #030202 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      fontFamily: '"Space Mono", monospace',
    }}>
      <style>{`
        @keyframes tape-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0.15 } }
        @keyframes reel-spin { to { transform: rotate(360deg) } }
        .tape-btn { transition: transform 0.06s, filter 0.15s; cursor: pointer; }
        .tape-btn:hover { filter: brightness(1.25); }
        .tape-btn:active { transform: translateY(1px); }
      `}</style>
      <HomeButton />

      {/* pool of lamp light */}
      <div style={{
        position: 'absolute', left: '50%', top: '58%', transform: 'translate(-50%,-50%)',
        width: 720, height: 520, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(255,190,110,0.10) 0%, rgba(255,170,90,0.03) 45%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', width: 'min(480px, calc(100vw - 40px))' }}>

        {/* display card above the machine — what the tape is "saying" */}
        <div style={{ minHeight: 150, marginBottom: 26, padding: '0 8px' }}>
          {display && (
            <>
              <div style={{ fontSize: 8, letterSpacing: '0.28em', color: 'rgba(255,190,110,0.5)', marginBottom: 12 }}>
                {display.header}
              </div>
              <div style={{ fontSize: 14, lineHeight: 2, color: 'rgba(255,235,205,0.88)', textShadow: '0 0 18px rgba(255,190,110,0.15)' }}>
                {display.text}
                {!display.done && <span style={{ opacity: 0.6 }}>▌</span>}
              </div>
            </>
          )}
          {mode === 'idle' && !display && (
            <div style={{ fontSize: 10, lineHeight: 2.2, color: 'rgba(255,235,205,0.28)', letterSpacing: '0.12em', textAlign: 'center', paddingTop: 40 }}>
              the light is blinking.
            </div>
          )}
          {mode === 'recording' && (
            <div>
              <div style={{ fontSize: 8, letterSpacing: '0.28em', color: 'rgba(255,120,90,0.6)', marginBottom: 12 }}>
                ● RECORDING — SPEAK AFTER THE TONE
              </div>
              <input
                value={recName}
                onChange={e => setRecName(e.target.value.slice(0, 40))}
                placeholder="who is this? (optional)"
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255,190,110,0.2)', outline: 'none',
                  color: 'rgba(255,235,205,0.85)', fontFamily: 'inherit', fontSize: 11,
                  padding: '6px 2px', marginBottom: 10,
                }}
              />
              <textarea
                value={recText}
                onChange={e => setRecText(e.target.value.slice(0, 280))}
                placeholder="your message…"
                autoFocus
                rows={3}
                style={{
                  width: '100%', background: 'rgba(255,190,110,0.03)', resize: 'none',
                  border: '1px solid rgba(255,190,110,0.15)', outline: 'none',
                  color: 'rgba(255,235,205,0.9)', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.8,
                  padding: '10px 12px',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 8, color: 'rgba(255,235,205,0.3)' }}>{280 - recText.length}</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="tape-btn" onClick={stop} style={{ background: 'none', border: '1px solid rgba(255,235,205,0.2)', color: 'rgba(255,235,205,0.5)', fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.15em', padding: '7px 14px' }}>HANG UP</button>
                  <button className="tape-btn" onClick={submitRecording} style={{ background: 'rgba(255,120,90,0.12)', border: '1px solid rgba(255,120,90,0.4)', color: 'rgba(255,160,130,0.9)', fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.15em', padding: '7px 14px' }}>LEAVE MESSAGE</button>
                </div>
              </div>
            </div>
          )}
          {mode === 'recorded' && recNote && (
            <div style={{ fontSize: 11, lineHeight: 2, color: 'rgba(255,235,205,0.6)', textAlign: 'center', paddingTop: 40, letterSpacing: '0.06em' }}>
              {recNote}
            </div>
          )}
        </div>

        {/* the machine */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(170deg, #4a4238 0%, #35302a 50%, #262220 100%)',
          borderRadius: 10,
          padding: '18px 20px 16px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,235,200,0.08), 0 0 80px rgba(255,170,90,0.05)',
        }}>
          {/* brand + counter row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.22em', color: 'rgba(255,235,200,0.3)' }}>
              PHONEMATE <span style={{ opacity: 0.5 }}>· MODEL 9</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* voice toggle */}
              <div
                className="tape-btn"
                onClick={() => setVoiceOn(v => !v)}
                title="the machine reads the tape out loud"
                style={{
                  fontSize: 7, letterSpacing: '0.18em', padding: '3px 7px', cursor: 'pointer',
                  border: `1px solid ${voiceOn ? 'rgba(120,255,170,0.35)' : 'rgba(255,235,200,0.15)'}`,
                  color: voiceOn ? 'rgba(120,255,170,0.8)' : 'rgba(255,235,200,0.3)',
                }}
              >
                VOICE {voiceOn ? 'ON' : 'OFF'}
              </div>
              {/* message counter */}
              <div style={{
                background: '#0d0906', border: '1px solid rgba(255,80,60,0.25)', padding: '2px 8px',
                fontSize: 14, color: '#ff5a3c', textShadow: '0 0 8px rgba(255,90,60,0.7)', letterSpacing: 2,
              }}>
                {String(msgCount).padStart(2, '0')}
              </div>
              {/* blinking LED */}
              <div style={{
                width: 9, height: 9, borderRadius: '50%',
                background: '#ff4433', boxShadow: '0 0 10px rgba(255,68,51,0.9)',
                animation: playing ? 'none' : 'tape-blink 1.6s step-end infinite',
              }} />
            </div>
          </div>

          {/* cassette window */}
          <div style={{
            background: '#0d0b08', borderRadius: 4, padding: '12px 18px', marginBottom: 16,
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '2px solid rgba(255,235,200,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: playing ? `reel-spin ${i === 0 ? 2.2 : 3.4}s linear infinite` : 'none',
              }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px dashed rgba(255,235,200,0.3)' }} />
              </div>
            ))}
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 7, letterSpacing: '0.3em', color: 'rgba(255,235,200,0.18)' }}>
              {playing ? (trackIdx === -1 ? 'GREETING' : `MSG ${trackIdx + 1}/${msgCount}`) : 'TAPE OK'}
            </div>
          </div>

          {/* caller ID strip */}
          <div style={{
            background: '#050807', border: '1px solid rgba(120,255,170,0.16)', borderRadius: 3,
            padding: '5px 10px', marginBottom: 14, fontSize: 9, letterSpacing: '0.16em',
            color: playing && trackIdx >= 0 ? 'rgba(120,255,170,0.85)' : 'rgba(120,255,170,0.25)',
            textShadow: playing && trackIdx >= 0 ? '0 0 8px rgba(120,255,170,0.4)' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {playing && trackIdx >= 0 && tapes[trackIdx]
              ? `INCOMING · ${tapes[trackIdx].name.toUpperCase()} · ${tapes[trackIdx].at.slice(0, 10)}`
              : playing
                ? 'INCOMING · — · —'
                : 'CALLER ID · NO NEW CALLS'}
          </div>

          {/* buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: '▶ PLAY', act: () => play(-1), active: playing, disabled: mode === 'recording' },
              { label: '■ STOP', act: stop, disabled: mode === 'idle' },
              { label: '⏭ NEXT', act: () => { if (playing && trackIdx < tapes.length - 1) { play(trackIdx + 1) } }, disabled: !playing },
              { label: '● REC', act: startRecording, red: true, disabled: mode === 'recording' },
            ].map(b => (
              <button
                key={b.label}
                className="tape-btn"
                onClick={b.act}
                disabled={b.disabled}
                style={{
                  flex: 1, padding: '11px 0',
                  background: b.red ? 'linear-gradient(180deg, #5a2820, #3a1a14)' : 'linear-gradient(180deg, #3e3830, #2a2620)',
                  border: '1px solid rgba(0,0,0,0.6)',
                  borderTop: '1px solid rgba(255,235,200,0.1)',
                  borderRadius: 3,
                  color: b.red ? 'rgba(255,150,130,0.9)' : 'rgba(255,235,200,0.65)',
                  fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.12em',
                  opacity: b.disabled ? 0.35 : 1,
                  boxShadow: '0 3px 6px rgba(0,0,0,0.5)',
                }}
              >{b.label}</button>
            ))}
          </div>
        </div>

        {/* table edge */}
        <div style={{
          height: 10, marginTop: 0,
          background: 'linear-gradient(180deg, #2a1e12, #150f08)',
          borderRadius: '0 0 4px 4px',
          boxShadow: '0 18px 30px rgba(0,0,0,0.8)',
        }} />

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,235,205,0.16)' }}>
          {msgCount} MESSAGE{msgCount === 1 ? '' : 'S'} ON TAPE · SOME ARE MINE · ONE COULD BE YOURS
        </div>
      </div>
    </div>
  )
}
