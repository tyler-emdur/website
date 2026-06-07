'use client'
import { useEffect, useState } from 'react'

const TRANSMISSIONS = [
  "SIGNAL DETECTED · DEPTH-02 · objects drifting · no origin confirmed",
  "BROADCAST-03 · ch.11 · signal clear · receiver: unregistered",
  "PASSAGE-01 · corridor length: undetermined · do not turn around",
  "FIELD STATION · monitoring active · instrument calibration: overdue",
  "DOCUMENT · 52 pages · 49 unreadable · content: unknown",
  "COMMERCE · four stores · operational status: closed · infrastructure intact",
  "SIGNAL CORRUPTED · partial recovery · integrity: 34%",
  "ENDPOINT-9 · white room · entry conditions: unclear",
  "ARCHIVE-∞ · aperture unstable · destination: unconfirmed",
  "FREQUENCY SHIFT · new band detected · not on any map",
  "LAB-ECHO · broadcasting on all frequencies · acknowledgment: none",
  "SECTOR 03-Ω · anomaly near archive core · approach recommended",
  "SECTOR 04-Δ · passage detected · length estimates unreliable",
  "SIGNAL LOSS · recovery attempt · hold for reacquisition",
  "WORMHOLE · coordinates: 40.0150°N 105.2705°W · destination: unconfirmed",
  "ANOMALY LOG · objects appear after prolonged observation · continue survey",
  "RELAY-00 · still receiving · not transmitting · cause: unknown",
  "SURVEY TE-∅ · objects indexed: 47 · verification: incomplete",
  "ARCHIVE NODE 17 · last sync: 03:12 · next sync: undetermined",
  "OBJECT EXISTS OUTSIDE INDEX · classification pending · do not discard",
]

export default function AmbientTransmissions() {
  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let fadeOut: ReturnType<typeof setTimeout>
    let next: ReturnType<typeof setTimeout>
    let used: number[] = []

    const show = () => {
      let idx: number
      do { idx = Math.floor(Math.random() * TRANSMISSIONS.length) } while (used.includes(idx) && used.length < TRANSMISSIONS.length)
      if (used.length >= TRANSMISSIONS.length) used = []
      used.push(idx)

      setMessage(TRANSMISSIONS[idx])
      setVisible(true)

      fadeOut = setTimeout(() => setVisible(false), 5500)
      next = setTimeout(show, 5500 + 18000 + Math.random() * 15000)
    }

    const initial = setTimeout(show, 10000 + Math.random() * 8000)
    return () => { clearTimeout(initial); clearTimeout(fadeOut); clearTimeout(next) }
  }, [])

  if (!message) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 52,
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: '"Space Mono", monospace',
      fontSize: 10,
      letterSpacing: '0.14em',
      color: 'rgba(34, 197, 94, 0.55)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 1.2s ease',
      pointerEvents: 'none',
      zIndex: 100,
      textAlign: 'center',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  )
}
