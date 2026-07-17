'use client'
import { useEffect, useRef, useState } from 'react'

// The universe's signal relay. It receives, it doesn't transmit — so these are
// things it overheard, half-decoded, and let drift past at the bottom of the sky.
//
// Three bands share the same look so the tiers stay invisible:
//   AMBIENT — always eligible. the baseline hum of the place.
//   NIGHT   — only surfaces in the visitor's local small hours (00:00–04:59).
//             the relay keeps a different watch when no one should be awake.
//   DEEP    — rare. only unlocks after the visitor has lingered a while. the
//             relay quietly noticing it is being read. mystery, kept cryptic.
//
// A couple of lines in AMBIENT/NIGHT are tagged 'gap' — they lean into the
// site-wide "there is no world 4" thread (Broadcast's Channel 88, the
// Answering Machine) and render in a faint red instead of the relay's usual
// green, so the callback reads visually without a word of explanation.

type Tone = 'green' | 'gap'
interface Transmission { text: string; tone?: Tone }

const AMBIENT: Transmission[] = [
  { text: "SIGNAL DETECTED · DEPTH-02 · objects drifting · no origin confirmed" },
  { text: "BROADCAST-03 · ch.11 · signal clear · receiver: unregistered" },
  { text: "PASSAGE-01 · corridor length: undetermined · do not turn around" },
  { text: "FIELD STATION · monitoring active · instrument calibration: overdue" },
  { text: "DOCUMENT · 52 pages · 49 unreadable · content: unknown" },
  { text: "COMMERCE · four stores · operational status: closed · infrastructure intact" },
  { text: "SIGNAL CORRUPTED · partial recovery · integrity: 34%" },
  { text: "ENDPOINT-9 · white room · entry conditions: unclear" },
  { text: "ARCHIVE-∞ · aperture unstable · destination: unconfirmed" },
  { text: "FREQUENCY SHIFT · new band detected · not on any map" },
  { text: "LAB-ECHO · broadcasting on all frequencies · acknowledgment: none" },
  { text: "SECTOR 03-Ω · anomaly near archive core · approach recommended" },
  { text: "SECTOR 04-Δ · passage detected · length estimates unreliable" },
  { text: "SIGNAL LOSS · recovery attempt · hold for reacquisition" },
  { text: "WORMHOLE · coordinates: 40.0150°N 105.2705°W · destination: unconfirmed" },
  { text: "ANOMALY LOG · objects appear after prolonged observation · continue survey" },
  { text: "RELAY-00 · still receiving · not transmitting · cause: unknown" },
  { text: "SURVEY TE-∅ · objects indexed: 47 · verification: incomplete" },
  { text: "ARCHIVE NODE 17 · last sync: 03:12 · next sync: undetermined" },
  { text: "OBJECT EXISTS OUTSIDE INDEX · classification pending · do not discard" },
  // the index gap — never named, never solved
  { text: "INDEX GAP · entry between 03 and 05 · never assigned · do not assign", tone: 'gap' },
  { text: "SECTOR 04 · scanning · scanning · scanning · no return", tone: 'gap' },
]

const NIGHT: Transmission[] = [
  { text: "NIGHT WATCH · sector traffic: none · the relay is awake anyway" },
  { text: "RELAY-00 · 03:00 local · nothing to report · still reporting" },
  { text: "DEPTH-02 · the objects are quieter at this hour · reason unknown" },
  { text: "SIGNAL · someone is here after dark · this is noted, not judged" },
  { text: "ARCHIVE NODE 17 · the small hours sync differently · records softer" },
  { text: "FIELD STATION · lamp still on · operator: presumed asleep · survey continues" },
  { text: "FREQUENCY DRIFT · 88.7 MHz · carries further at night · origin unlit" },
  { text: "PASSAGE-01 · do not turn around · especially not now" },
  { text: "NIGHT WATCH · one receiver active on this frequency · you" },
  { text: "UNLISTED · a light is on in the garage · no one drove there" },
  { text: "the machine took a message at 02:14 · caller: unknown", tone: 'gap' },
  { text: "03:33 · you are still awake · so is the signal", tone: 'gap' },
]

const DEEP: Transmission[] = [
  { text: "· · · someone is reading these · · ·" },
  { text: "RELAY-00 · the cursor has gone still · we noticed · continue" },
  { text: "DEPTH-07 · you have stayed longer than most · the map remembers this" },
  { text: "SURVEY · observer detected · classification: patient · rare" },
  { text: "SIGNAL · there was never a WORLD 4 · you may keep looking anyway", tone: 'gap' },
  { text: "ARCHIVE-∞ · the aperture opens for those who wait · you are waiting" },
  { text: "TE-∅ · the origin was here before the sky · it will outlast the tab" },
  { text: "RECEIVER · this message was left for whoever stayed · it is you" },
]

// after this many ms in the universe, DEEP signals become eligible
const LINGER_MS = 150_000

const GLYPHS = '▓▒░█▚▞◤◥▘·:/\\<>=+*0189'.split('')

export default function AmbientTransmissions() {
  const [message, setMessage] = useState<Transmission | null>(null)
  const [rendered, setRendered] = useState('')
  const [visible, setVisible] = useState(false)
  const decodeRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let fadeOut: ReturnType<typeof setTimeout>
    let next: ReturnType<typeof setTimeout>
    const enteredAt = Date.now()
    // per-band memory so nothing repeats until its band is exhausted
    const used = { AMBIENT: [] as number[], NIGHT: [] as number[], DEEP: [] as number[] }

    const pickFrom = (band: keyof typeof used, pool: Transmission[]) => {
      const seen = used[band]
      let idx: number
      do { idx = Math.floor(Math.random() * pool.length) } while (seen.includes(idx) && seen.length < pool.length)
      if (seen.length >= pool.length) seen.length = 0
      seen.push(idx)
      return pool[idx]
    }

    // resolve the message out of noise — a received signal, not printed text
    const decode = (full: string) => {
      if (decodeRef.current) clearInterval(decodeRef.current)
      const start = performance.now()
      const DUR = 620
      decodeRef.current = setInterval(() => {
        const p = Math.min(1, (performance.now() - start) / DUR)
        // characters lock in left-to-right; the rest stays scrambled
        const locked = Math.floor(p * full.length)
        let out = full.slice(0, locked)
        for (let i = locked; i < full.length; i++) {
          out += full[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        }
        setRendered(out)
        if (p >= 1) {
          setRendered(full)
          if (decodeRef.current) { clearInterval(decodeRef.current); decodeRef.current = null }
        }
      }, 40)
    }

    const show = () => {
      const hour = new Date().getHours()
      const isSmallHours = hour >= 0 && hour < 5
      const lingering = Date.now() - enteredAt > LINGER_MS
      const roll = Math.random()

      let t: Transmission
      // deep signals stay rare even once unlocked — a reward, not a rhythm
      if (lingering && roll < 0.14) t = pickFrom('DEEP', DEEP)
      else if (isSmallHours && roll < 0.5) t = pickFrom('NIGHT', NIGHT)
      else t = pickFrom('AMBIENT', AMBIENT)

      setMessage(t)
      setRendered('')
      setVisible(true)
      decode(t.text)

      fadeOut = setTimeout(() => setVisible(false), 5500)
      next = setTimeout(show, 5500 + 18000 + Math.random() * 15000)
    }

    const initial = setTimeout(show, 10000 + Math.random() * 8000)
    return () => {
      clearTimeout(initial); clearTimeout(fadeOut); clearTimeout(next)
      if (decodeRef.current) clearInterval(decodeRef.current)
    }
  }, [])

  if (!message) return null

  const gap = message.tone === 'gap'

  return (
    <div style={{
      position: 'fixed',
      bottom: 52,
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: '"Space Mono", monospace',
      fontSize: 10,
      letterSpacing: '0.14em',
      color: gap ? 'rgba(255, 140, 140, 0.5)' : 'rgba(34, 197, 94, 0.55)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 1.2s ease',
      pointerEvents: 'none',
      zIndex: 100,
      textAlign: 'center',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      maxWidth: '92vw',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {rendered || message.text}
    </div>
  )
}
