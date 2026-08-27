'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useWorldStore, type WorldId } from '@/lib/world-store'
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

// The saved messages. Nobody here is selling anything — these are calls that
// came in from the other worlds and got left on the tape. Each one is a door
// into somewhere else on the site for anyone listening closely.
const SAVED_TAPES: Tape[] = [
  {
    id: 'saved-wrong-number', saved: true, name: 'unlisted number', at: '2:14 am',
    text: "yeah, hi. i'm trying to reach a marcy. this is the number she wrote down for me. i've called it four times now and every time it picks up in a room i can hear — there's a hum in there, and something further back that isn't the hum. anyway. if you're marcy, it's ray. if you're not marcy, i'm sorry about the room.",
  },
  {
    id: 'saved-coordinates', saved: true, name: 'number withheld', at: '—',
    text: "forty degrees, zero one five zero north. one oh five, two seven zero five west. i'll say it again in case the tape was still winding. forty degrees, zero one five zero north. one oh five, two seven zero five west. that's all it is. that's all it's ever been. please stop putting it on the air.",
  },
  {
    id: 'saved-payphone', saved: true, name: 'pay phone · us-36 west', at: 'mile 41',
    text: "there's still a pay phone out here, which means somebody is still paying for it. i put in a quarter to find out who. it rang you. so i guess it's you. i've got maybe forty seconds left and nothing to report. it's snowing on the pass and the radio's down to one station.",
  },
  {
    id: 'saved-foodmart', saved: true, name: 'foodmart · store #∞', at: 'after 2am',
    text: "this is the courtesy desk calling about an item left in aisle fourteen. we don't have a lost and found. we have an aisle. it's the same aisle. if you'd like to collect it you'll need to come back inside and keep walking. thank you for shopping with us.",
  },
  {
    id: 'saved-website', saved: true, name: 'this website', at: '2026',
    text: "hey. it's the website. you are literally inside me right now, listening to a machine i'm rendering. we should probably talk about the recursion thing. also, there's no world 4. there's never been a world 4. call me back.",
  },
]

const GREETING = "hi, you've reached tyler. i'm out running, or in the garage, or forty files deep in something. leave a message after the tone. someone will hear it. probably me."

// ── the machine keeps its own time ───────────────────────────────────────────
// An answering machine that doesn't know what hour it is isn't really a machine
// in a room. This one reads the *visitor's* local clock and lets it color the
// edges — the greeting, the idle light, the sign-off. Reserved mostly for the
// hours nobody's supposed to be awake, so it stays a thing you stumble into.
type HourMood = 'deepnight' | 'earlymorning' | 'day' | 'evening' | 'latenight'

function currentMood(): HourMood {
  const h = new Date().getHours()
  if (h < 5) return 'deepnight'
  if (h < 8) return 'earlymorning'
  if (h >= 21) return 'latenight'
  if (h >= 17) return 'evening'
  return 'day'
}

const IDLE_LINE: Record<HourMood, string> = {
  deepnight: "the light is blinking. it's the middle of the night where you are.",
  earlymorning: "the light is blinking. you're up early.",
  day: 'the light is blinking.',
  evening: 'the light is blinking.',
  latenight: "the light is blinking. it's getting late.",
}

// appended to the outgoing message — empty during ordinary hours so the
// greeting stays exactly as written; the machine only speaks up off-hours.
const GREETING_TAIL: Record<HourMood, string> = {
  deepnight: ' it is the middle of the night where you are. that is usually when the good messages come in.',
  earlymorning: ' you are up early. or you never slept. no judgment either way.',
  day: '',
  evening: '',
  latenight: ' it is late. the good kind of late.',
}

// ── the room the machine sits in ─────────────────────────────────────────────
// It used to be a machine floating in a vignette. It sits on a counter now,
// against a wall, under a lamp, with a window somewhere off frame that only
// exists while it's light out where the visitor is standing. Same clock as the
// greeting: the room and the tape agree about what hour it is.

const SURFACE = 34   // the sliver of countertop visible in front of the machine
const APRON = 14     // its front edge

const ROOM_LIGHT: Record<HourMood, { win: [number, number, number]; day: number; lamp: number }> = {
  deepnight:    { win: [120, 150, 200], day: 0,    lamp: 1 },
  earlymorning: { win: [150, 180, 225], day: 0.34, lamp: 0.92 },
  day:          { win: [196, 218, 248], day: 0.9,  lamp: 0.5 },
  evening:      { win: [255, 152, 92],  day: 0.5,  lamp: 0.86 },
  latenight:    { win: [120, 150, 200], day: 0.07, lamp: 1 },
}

const END_LINE: Record<HourMood, string> = {
  deepnight: 'no more messages. just you and the hiss now. the tape keeps going anyway.',
  earlymorning: 'no more messages. the tape keeps going anyway.',
  day: 'no more messages. the tape keeps going anyway.',
  evening: 'no more messages. the tape keeps going anyway.',
  latenight: 'no more messages. just you and the hiss now. the tape keeps going anyway.',
}

// ── the phantom ───────────────────────────────────────────────────────────────
// A message that is not on the counter. It only surfaces if you let the tape
// keep running after the last real message — the END card already warns you it
// "keeps going anyway." It is a fragment from the world that was never there.
// It deepens the world-4 mystery. It does not explain it.
const PHANTOM_HEADER = 'MESSAGE ██ — NO CALLER · ██·██·████'
// What the reader sees, with the line dropping out on the em-dashes.
const PHANTOM_TEXT = "— sorry. i know it's late. i'm calling from the fourth— —you don't have to say anything. i know there isn't one. that's sort of the point. the light's still on over here. leave it blinking for me. ...okay. goodnight, whoever you are."
// What the machine says aloud — the hiss markers stripped out.
const PHANTOM_SPOKEN = "sorry. i know it's late. i'm calling from the fourth. you don't have to say anything. i know there isn't one. that's sort of the point. the light's still on over here. leave it blinking for me. okay. goodnight, whoever you are."

// ── the tape that knows where you've been ────────────────────────────────────
// A message with no caller. The machine noticed which worlds you wandered
// through — it reads the trail back to you. It never explains how it knows.
// Built client-side from your persistent `visited` state; never sent anywhere.
const ECHO_LINES: Partial<Record<WorldId, string>> = {
  1: 'you drifted through the dark between the worlds, and touched nothing.',
  2: "you traced a stranger's runs across boulder until the light moved.",
  3: 'you left a channel playing. it is still on somewhere, with no one watching.',
  5: 'you woke the old machine. it has your fingerprints now.',
  6: 'you sat in the car at 12:47 and never turned the key.',
  7: 'you followed the signal all the way down to where it ends.',
  14: "you walked into the aisle. it didn't end. they never do.",
}

function buildEchoTape(visited: WorldId[]): Tape | null {
  const trail: WorldId[] = []
  for (const w of visited) {
    if (ECHO_LINES[w] != null && !trail.includes(w)) trail.push(w)
  }
  if (trail.length < 2) return null // only for people who actually wandered
  const body = trail.map(w => ECHO_LINES[w]).join(' ')
  const text =
    "i'm not a caller. i'm the machine. i don't sleep, so i notice things. " +
    body +
    " i keep the tape running while you move from room to room. i keep everything. " +
    "someday you'll leave a message of your own, and i'll play it for whoever comes next."
  return { id: 'echo-trail', name: 'no caller id', at: '████', text }
}

// The one the counter never counts. It's only here for whoever notices the
// light is blinking — and presses it. Nothing on screen says you can.
const HIDDEN_TAPE = {
  header: '⟁ MESSAGE — · NOT LOGGED · 3:03 AM',
  text: "…i don't think i have the right number. i was trying to reach whoever built the rooms — the one that runs the hills, the one that broadcasts all night, the one that keeps a car warm in a garage that doesn't exist. tell him the little red light kept blinking, and somebody finally pressed it. tell him it was worth making. …okay. sorry to wake the machine.",
}

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

  beep(long = false, freq = 980) {
    const ctx = this.ensure()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
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

/**
 * Everything around the machine.
 *
 * Every layer is positioned off the machine's own box, not off the viewport —
 * the counter starts exactly where the machine's feet stop, so the object sits
 * on something at any window size instead of hovering near a percentage.
 *
 * `lineLive` is the phone line, and it is not decoration: it draws plugged when
 * the tape writes to disk and lying loose on the counter when it doesn't. The
 * machine says the same thing in words after you record. This says it before.
 */
function Room({ mood, lineLive }: { mood: HourMood; lineLive: boolean | null }) {
  const L = ROOM_LIGHT[mood]
  const win = (a: number) => `rgba(${L.win[0]},${L.win[1]},${L.win[2]},${+(a * L.day).toFixed(3)})`
  const lamp = (a: number) => `rgba(255,186,110,${+(a * L.lamp).toFixed(3)})`
  const span = { position: 'absolute' as const, left: '50%', transform: 'translateX(-50%)', width: '100vw', pointerEvents: 'none' as const }

  return (
    <>
      {/* wall — its base is the counter's back edge, hidden behind the machine */}
      <div style={{
        ...span, bottom: 0, height: '240vh',
        background: [
          `radial-gradient(ellipse 460px 250px at 50% calc(100% + 12px), ${lamp(0.34)}, ${lamp(0.12)} 40%, transparent 72%)`,
          `radial-gradient(ellipse 1000px 620px at 50% 100%, ${lamp(0.05)}, transparent 62%)`,
          'linear-gradient(180deg, #030302 0%, #050403 52%, #0a0806 82%, #0e0b08 100%)',
        ].join(','),
      }} />

      {/* the window is off frame to the left; only its light is in the room */}
      {L.day > 0.02 && (
        <div style={{
          ...span, bottom: -(SURFACE + APRON), height: '240vh', mixBlendMode: 'screen',
          background: [
            `linear-gradient(103deg, transparent 19.5%, ${win(0.04)} 20.5%, ${win(0.17)} 23%, ${win(0.19)} 37%, ${win(0.05)} 40%, transparent 41%)`,
            `linear-gradient(103deg, transparent 43.5%, ${win(0.03)} 44.5%, ${win(0.12)} 47%, ${win(0.13)} 58%, ${win(0.03)} 61%, transparent 62%)`,
          ].join(','),
        }} />
      )}

      {/* the seam where two drops of wallpaper meet — scale, and nothing else */}
      <div style={{
        ...span, bottom: 0, height: 400,
        background: 'linear-gradient(90deg, transparent calc(50% - 234px), rgba(0,0,0,0.55) calc(50% - 233px), rgba(255,205,155,0.09) calc(50% - 232px), transparent calc(50% - 231px))',
        WebkitMaskImage: 'linear-gradient(to top, #000 0%, transparent 100%)',
        maskImage: 'linear-gradient(to top, #000 0%, transparent 100%)',
      }} />

      {/* the machine's shadow, thrown up the wall by the lamp in front of it */}
      <div style={{
        position: 'absolute', left: -14, right: -14, top: '6%', bottom: -4,
        background: 'rgba(0,0,0,0.72)', borderRadius: 18, filter: 'blur(26px)',
        transform: 'translate(-10px, -14px)', pointerEvents: 'none',
      }} />

      {/* floor */}
      <div style={{
        ...span, top: `calc(100% + ${SURFACE + APRON}px)`, height: '140vh',
        background: `radial-gradient(ellipse 620px 260px at 50% -30px, ${lamp(0.12)}, transparent 68%), linear-gradient(180deg, #0d0a07 0%, #070504 38%, #020202 100%)`,
      }} />

      {/* counter — front edge first, then the surface laid over its top lip */}
      <div style={{
        ...span, top: `calc(100% + ${SURFACE}px)`, height: APRON,
        background: `radial-gradient(ellipse 480px 40px at 50% 0%, ${lamp(0.1)}, transparent 70%), linear-gradient(180deg, #1d1509 0%, #110c06 55%, #080503)`,
        boxShadow: '0 16px 30px rgba(0,0,0,0.9)',
      }} />
      <div style={{
        ...span, top: `calc(100% + ${SURFACE}px)`, height: 2, background: lamp(0.62),
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 24%, #000 76%, transparent 100%)',
        maskImage: 'linear-gradient(90deg, transparent 0%, #000 24%, #000 76%, transparent 100%)',
      }} />
      <div style={{
        ...span, top: '100%', height: SURFACE,
        background: `radial-gradient(ellipse 430px 60px at 50% 130%, ${lamp(0.5)}, ${lamp(0.14)} 55%, transparent 78%), linear-gradient(180deg, #241a10 0%, #302416 45%, #3a2c1b 100%)`,
        boxShadow: `inset 0 1px 0 rgba(0,0,0,0.55)`,
      }} />

      {L.day > 0.02 && (
        <div style={{
          ...span, top: '100%', height: SURFACE + APRON, mixBlendMode: 'screen',
          background: [
            `linear-gradient(103deg, transparent 19%, ${win(0.03)} 20%, ${win(0.1)} 22.5%, ${win(0.11)} 36.5%, ${win(0.03)} 39.5%, transparent 40.5%)`,
            `linear-gradient(103deg, transparent 43%, ${win(0.02)} 44%, ${win(0.07)} 46.5%, ${win(0.08)} 57.5%, ${win(0.02)} 60.5%, transparent 61.5%)`,
          ].join(','),
        }} />
      )}

      {/* what the machine is plugged into */}
      <div className="room-prop" style={{ position: 'absolute', left: 'calc(100% + 58px)', bottom: 26, width: 40, height: 66, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 4,
          background: `linear-gradient(102deg, ${lamp(0.62)}, rgba(196,180,154,0.3) 52%, rgba(96,86,74,0.16))`,
          boxShadow: '0 4px 14px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,240,214,0.3), inset 0 -1px 0 rgba(0,0,0,0.5)',
        }} />
        {/* the sockets, and both plugs already in them */}
        {[6, 36].map((y, i) => (
          <div key={y}>
            <div style={{
              position: 'absolute', left: 7, top: y, width: 26, height: 24, borderRadius: 3,
              background: 'radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.55), rgba(0,0,0,0.25))',
            }} />
            <div style={{
              position: 'absolute', left: 5, top: y + 1, width: 30, height: 22, borderRadius: 3,
              background: `linear-gradient(102deg, ${lamp(0.3)}, #2a241e 45%, #14110d)`,
              boxShadow: '0 3px 7px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,235,200,0.13)',
            }} />
            <div style={{
              position: 'absolute', left: 5, top: y + (i ? 18 : 1), width: 30, height: 5,
              background: 'rgba(0,0,0,0.55)', filter: 'blur(2px)',
            }} />
          </div>
        ))}
      </div>

      {/* the two cords leaving that outlet. one goes to the machine. */}
      <svg className="room-prop" width="70" height="120" viewBox="0 0 70 120" style={{ position: 'absolute', left: 'calc(100% - 4px)', bottom: -6, overflow: 'visible', pointerEvents: 'none' }}>
        <path d="M66 78 C 52 84, 44 96, 30 100 C 18 104, 8 102, -2 104" fill="none" stroke="#080605" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M66 78 C 52 84, 44 96, 30 100 C 18 104, 8 102, -2 104" fill="none" stroke={lamp(0.16)} strokeWidth="1" strokeLinecap="round" transform="translate(0,-1)" />
      </svg>
      {/* and one goes down behind the counter, to nothing in this room */}
      <svg className="room-prop" width="40" height="90" viewBox="0 0 40 90" style={{ position: 'absolute', left: 'calc(100% + 68px)', bottom: 0, overflow: 'visible', pointerEvents: 'none' }}>
        <path d="M8 4 C 10 22, 2 34, 6 52 C 9 66, 7 78, 9 94" fill="none" stroke="#080605" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M8 4 C 10 22, 2 34, 6 52 C 9 66, 7 78, 9 94" fill="none" stroke={lamp(0.12)} strokeWidth="1" strokeLinecap="round" transform="translate(-1,0)" />
      </svg>

      {/* the phone line out */}
      <svg className="room-prop" width="120" height="420" viewBox="0 0 120 420" style={{ position: 'absolute', right: 'calc(100% - 52px)', top: 'calc(100% - 12px)', overflow: 'visible', pointerEvents: 'none' }}>
        {lineLive === false ? (
          <>
            {/* not in anything. it just lies there. */}
            <path d="M118 14 C 104 20, 96 26, 84 27 C 70 28, 62 22, 52 26 C 44 29, 44 34, 52 35 C 60 36, 66 31, 62 27" fill="none" stroke="#0a0706" strokeWidth="3" strokeLinecap="round" />
            <rect x="30" y="28" width="14" height="9" rx="2" fill="#211c17" stroke={lamp(0.35)} strokeWidth="0.7" />
            <rect x="35" y="25" width="5" height="4" rx="1" fill="#211c17" stroke={lamp(0.25)} strokeWidth="0.6" />
            <path d="M44 32 L 52 33" stroke="#0a0706" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* over the front edge, down, out of the room */}
            <path d="M118 14 C 104 20, 92 24, 80 28 C 68 32, 60 40, 58 62 C 55 110, 63 200, 52 300 C 46 356, 50 390, 44 420" fill="none" stroke="#0a0706" strokeWidth="3" strokeLinecap="round" />
            <path d="M118 14 C 104 20, 92 24, 80 28 C 68 32, 60 40, 58 62" fill="none" stroke={lamp(0.13)} strokeWidth="0.9" strokeLinecap="round" transform="translate(0,-1)" />
          </>
        )}
      </svg>

      {/* mail nobody opened, squared up against the machine */}
      <div className="room-prop" style={{ position: 'absolute', right: 'calc(100% + 96px)', top: `calc(100% + ${SURFACE - 20}px)`, width: 108, height: 20, pointerEvents: 'none' }}>
        {/* the two underneath, just edges */}
        <div style={{ position: 'absolute', left: 2, top: 12, width: 106, height: 4, transform: 'rotate(0.7deg)', background: 'linear-gradient(180deg, #2b2419, #14100b)', boxShadow: '0 3px 7px rgba(0,0,0,0.8)' }} />
        <div style={{ position: 'absolute', left: -1, top: 9, width: 104, height: 4, transform: 'rotate(-0.5deg)', background: 'linear-gradient(180deg, #322a1d, #17130d)' }} />
        {/* the one on top, foreshortened, catching the lamp */}
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 104, height: 11, transform: 'rotate(-1.2deg)',
          background: `linear-gradient(178deg, ${lamp(0.5)}, ${lamp(0.22)} 62%, rgba(58,50,38,0.5))`,
          boxShadow: '0 2px 5px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(0,0,0,0.4)',
        }}>
          {/* the window in the envelope. nothing legible through it. */}
          <div style={{ position: 'absolute', left: 58, top: 4, width: 32, height: 4, background: 'rgba(20,16,10,0.4)' }} />
        </div>
      </div>

      {/* where the machine touches the counter */}
      <div style={{
        position: 'absolute', left: -26, right: -26, top: '100%', height: SURFACE,
        background: 'radial-gradient(ellipse 52% 150% at 50% -20%, rgba(0,0,0,0.97), rgba(0,0,0,0.6) 48%, transparent 74%)',
        filter: 'blur(3px)', pointerEvents: 'none',
      }} />
    </>
  )
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
  const [mood, setMood] = useState<HourMood>('day') // resolved on mount to avoid hydration mismatch
  const [phantom, setPhantom] = useState(false) // the sixth message that isn't on the counter
  const [hidden, setHidden] = useState(false) // the unlisted message is on the reel
  const [lineLive, setLineLive] = useState<boolean | null>(null) // does the phone line out go anywhere
  const voiceOnRef = useRef(true)
  const audioRef = useRef<TapeAudio | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const playTokenRef = useRef(0)
  const heardRef = useRef<Set<string>>(new Set())

  useEffect(() => { voiceOnRef.current = voiceOn; if (!voiceOn) shutUp() }, [voiceOn])

  useEffect(() => {
    audioRef.current = new TapeAudio()
    setMood(currentMood()) // the room learns what hour it is where you're standing
    return () => { timersRef.current.forEach(clearTimeout); audioRef.current?.dispose(); shutUp() }
  }, [])

  // load visitor messages: server + local, then the tape that knows your trail
  useEffect(() => {
    const local = loadLocalTapes()
    const echo = buildEchoTape(useWorldStore.getState().visited)
    const withEcho = (base: Tape[]) => (echo ? [...base, echo] : base)
    fetch('/api/tape')
      .then(r => r.json())
      .then(d => {
        const server: Tape[] = Array.isArray(d?.messages) ? d.messages : []
        const seen = new Set(server.map(m => m.id))
        setLineLive(!!d?.live)
        setTapes(withEcho([...SAVED_TAPES, ...server, ...local.filter(m => !seen.has(m.id))]))
      })
      .catch(() => { setLineLive(false); setTapes(withEcho([...SAVED_TAPES, ...local])) })
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
    setPhantom(false)
    setHidden(false)
  }, [])

  // The blinking light. Nothing labels it. Press it and the machine coughs up
  // one message it never counted — for whoever was curious enough to try.
  const playHidden = useCallback(async () => {
    const audio = audioRef.current!
    const token = ++playTokenRef.current
    audio.click()
    audio.startHiss()
    setHidden(true)
    setTrackIdx(-1)
    setMode('playing')
    await wait(650)
    if (playTokenRef.current !== token) return
    audio.beep()
    await wait(600)
    if (playTokenRef.current !== token) return
    if (voiceOnRef.current) speak(HIDDEN_TAPE.text)
    const ok = await typeOut(HIDDEN_TAPE.header, HIDDEN_TAPE.text, token)
    if (!ok) return
    findSecret('tape-blinking-light')
    await wait(1300)
    if (playTokenRef.current !== token) return
    audio.beep(true)
    await typeOut('END OF MESSAGES', 'the counter never counted that one. check it. it never will.', token)
    audio.stopHiss()
    setHidden(false)
    setMode('idle')
  }, [typeOut, findSecret])

  const play = useCallback(async (startIdx = -1) => {
    const audio = audioRef.current!
    const token = ++playTokenRef.current
    audio.click()
    audio.startHiss()
    setMode('playing')

    if (startIdx === -1) {
      setTrackIdx(-1)
      const greeting = GREETING + GREETING_TAIL[currentMood()]
      if (voiceOnRef.current) speak(greeting)
      const ok = await typeOut('OUTGOING MESSAGE', greeting, token)
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
      if (t.id === 'echo-trail') findSecret('tape-knows-your-trail')
      if (SAVED_TAPES.every(s => heardRef.current.has(s.id))) findSecret('tape-heard-saved')
      await wait(1400)
    }
    if (playTokenRef.current !== token) return
    audio.beep(true)
    await typeOut('END OF MESSAGES', END_LINE[currentMood()], token)

    // The tape keeps going anyway. If you listened to every real message and
    // you don't reach for STOP, the machine plays back something that was never
    // logged — a message from the fourth. Reward for patience; a fragment, not
    // an answer.
    const heardEverything = SAVED_TAPES.every(s => heardRef.current.has(s.id))
    if (heardEverything) {
      // a long, unsettling stretch of nothing but tape hiss — most people stop here
      await wait(7000)
      if (playTokenRef.current !== token) { return }
      setPhantom(true)
      setTrackIdx(-2) // sentinel: not a real track
      audio.beep(true, 322) // detuned, wrong — the tone from the other side
      await wait(1100)
      if (playTokenRef.current !== token) { setPhantom(false); return }
      if (voiceOnRef.current) speak(PHANTOM_SPOKEN)
      const ok = await typeOut(PHANTOM_HEADER, PHANTOM_TEXT, token)
      if (!ok) { setPhantom(false); return }
      findSecret('tape-fourth')
      await wait(2600)
      setPhantom(false)
    }

    if (playTokenRef.current !== token) return
    audio.stopHiss()
    setMode('idle')
    setTrackIdx(-1)
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
    setLineLive(persisted) // the cord answers to what actually happened
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
      background: '#020202',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      fontFamily: '"Space Mono", monospace',
    }}>
      <style>{`
        @keyframes tape-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0.15 } }
        @keyframes reel-spin { to { transform: rotate(360deg) } }
        @keyframes phantom-flicker { 0%, 96%, 100% { opacity: 1 } 97% { opacity: 0.55 } 98.5% { opacity: 0.85 } }
        .tape-btn { transition: transform 0.06s, filter 0.15s; cursor: pointer; }
        .tape-btn:hover { filter: brightness(1.25); }
        .tape-btn:active { transform: translateY(1px); }
        /* narrow windows keep the counter and the wall; the room's furniture
           would only be hanging off the edge of the frame. */
        @media (max-width: 720px) { .room-prop { display: none } }
        /* standing back from the counter costs vertical room; short windows
           can't spare it without clipping the tape's display. */
        .w9-scene { margin-bottom: 88px }
        @media (max-height: 780px) { .w9-scene { margin-bottom: 0 } }
      `}</style>
      <HomeButton />

      <div className="w9-scene" style={{ position: 'relative', width: 'min(480px, calc(100vw - 40px))' }}>

        {/* display card above the machine — what the tape is "saying".
            `relative` is load-bearing: the room's wall is absolutely
            positioned and would otherwise paint straight over this text. */}
        <div style={{ position: 'relative', zIndex: 2, minHeight: 150, marginBottom: 26, padding: '0 8px' }}>
          {display && (
            <div style={{ animation: phantom ? 'phantom-flicker 3.2s linear infinite' : 'none' }}>
              <div style={{ fontSize: 8, letterSpacing: '0.28em', color: phantom ? 'rgba(150,180,220,0.55)' : 'rgba(255,190,110,0.5)', marginBottom: 12 }}>
                {display.header}
              </div>
              <div style={{ fontSize: 14, lineHeight: 2, color: phantom ? 'rgba(205,220,240,0.82)' : 'rgba(255,235,205,0.88)', textShadow: phantom ? '0 0 18px rgba(150,180,230,0.18)' : '0 0 18px rgba(255,190,110,0.15)' }}>
                {display.text}
                {!display.done && <span style={{ opacity: 0.6 }}>▌</span>}
              </div>
            </div>
          )}
          {mode === 'idle' && !display && (
            <div style={{ fontSize: 10, lineHeight: 2.2, color: 'rgba(255,235,205,0.28)', letterSpacing: '0.12em', textAlign: 'center', paddingTop: 40 }}>
              {IDLE_LINE[mood]}
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

        {/* the machine, and the room it is standing in */}
        <div style={{ position: 'relative' }}>
        <Room mood={mood} lineLive={lineLive} />
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
              {/* blinking LED — nothing says it does anything. it does. */}
              <button
                className="tape-btn"
                onClick={() => { if (mode === 'idle') playHidden() }}
                aria-label="indicator light"
                style={{
                  background: 'none', border: 'none', padding: 7, margin: -7,
                  lineHeight: 0, cursor: mode === 'idle' ? 'pointer' : 'default',
                }}
              >
                <div style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: '#ff4433', boxShadow: '0 0 10px rgba(255,68,51,0.9)',
                  animation: playing ? 'none' : 'tape-blink 1.6s step-end infinite',
                }} />
              </button>
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
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 7, letterSpacing: '0.3em', color: phantom ? 'rgba(150,180,220,0.4)' : 'rgba(255,235,200,0.18)' }}>
              {phantom
                ? 'MSG ██/██'
                : playing
                  ? (hidden ? '· · ·' : trackIdx === -1 ? 'GREETING' : `MSG ${trackIdx + 1}/${msgCount}`)
                  : 'TAPE OK'}
            </div>
          </div>

          {/* caller ID strip */}
          <div style={{
            background: '#050807', border: '1px solid rgba(120,255,170,0.16)', borderRadius: 3,
            padding: '5px 10px', marginBottom: 14, fontSize: 9, letterSpacing: '0.16em',
            color: phantom ? 'rgba(150,180,220,0.7)' : (playing && trackIdx >= 0) || hidden ? 'rgba(120,255,170,0.85)' : 'rgba(120,255,170,0.25)',
            textShadow: phantom ? '0 0 8px rgba(150,180,230,0.45)' : (playing && trackIdx >= 0) || hidden ? '0 0 8px rgba(120,255,170,0.4)' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {phantom
              ? 'INCOMING · ████ · CALL FROM 4'
              : hidden && playing
                ? 'INCOMING · —— UNKNOWN —— · 3:03 AM'
                : playing && trackIdx >= 0 && tapes[trackIdx]
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

        </div>

        <div style={{ textAlign: 'center', marginTop: SURFACE + APRON + 34, fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,235,205,0.16)' }}>
          {msgCount} MESSAGE{msgCount === 1 ? '' : 'S'} ON TAPE · SOME ARE MINE · ONE COULD BE YOURS
        </div>
      </div>
    </div>
  )
}
