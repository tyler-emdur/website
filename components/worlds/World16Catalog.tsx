'use client'
import { useState, useEffect } from 'react'
import HomeButton from './HomeButton'

const ENTRIES = [
  { id: '00', name: 'SECTOR_SURFACE',     gate: 'SURFACE-00',   status: 'indexed' },
  { id: '01', name: 'SECTOR_UNIVERSE',    gate: 'UNIVERSE-01',  status: 'indexed' },
  { id: '02', name: 'SECTOR_DEPTH',       gate: 'DEPTH-02',     status: 'indexed' },
  { id: '03', name: 'SECTOR_BROADCAST',   gate: 'ON-AIR-03',    status: 'indexed' },
  { id: '04', name: 'SECTOR_CORRIDOR',    gate: 'HALL-04',      status: 'indexed' },
  { id: '05', name: 'SECTOR_FIELD',       gate: 'FIELD-05',     status: 'indexed' },
  { id: '06', name: 'SECTOR_DOCUMENT',    gate: 'DOSSIER-06',   status: 'indexed' },
  { id: '07', name: 'SECTOR_MALL',        gate: 'MALL-07',      status: 'indexed' },
  { id: '08', name: 'SECTOR_SIGNAL',      gate: 'SIGNAL-08',    status: 'indexed' },
  { id: '09', name: 'SECTOR_CONTACT',     gate: 'CONTACT-09',   status: 'indexed' },
  { id: '10', name: 'SECTOR_LOOP',        gate: 'SYSTEM-10',    status: 'indexed' },
  { id: '11', name: 'SECTOR_FLICKER',     gate: 'FLICKER-11',   status: 'indexed' },
  { id: '12', name: 'SECTOR_TERMINAL',    gate: 'ROOT-12',      status: 'indexed' },
  { id: '13', name: 'SECTOR_SPIRAL',      gate: 'DESCENT-13',   status: 'indexed' },
  { id: '14', name: 'SECTOR_PIXEL',       gate: 'CHROMATIC-14', status: 'indexed' },
  { id: '15', name: 'SECTOR_DIAL',        gate: 'RECEIVER-15',  status: 'indexed' },
  { id: '16', name: 'SECTOR_CATALOG',     gate: 'CATALOG-16',   status: 'current' },
  { id: '??', name: '████████████████',   gate: '???',          status: 'missing' },
]

export default function World16Catalog() {
  const [tick, setTick] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setTick(n => n + 1), 900)
    return () => clearInterval(iv)
  }, [])

  const glitch = tick % 7 === 0

  return (
    <div
      data-world="16"
      style={{
        position: 'fixed', inset: 0,
        background: '#020408',
        fontFamily: '"JetBrains Mono", "Space Mono", monospace',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(100,160,255,0.015) 3px, rgba(100,160,255,0.015) 6px)',
      }} />

      <div style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease',
        width: 'min(680px, 90vw)',
      }}>
        {/* header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 9, color: 'rgba(100,160,255,0.35)', letterSpacing: '0.4em', marginBottom: 6 }}>
            SECTOR DATABASE
          </div>
          <div style={{ fontSize: 16, color: 'rgba(180,210,255,0.7)', letterSpacing: '0.12em', marginBottom: 4 }}>
            MASTER CATALOG
          </div>
          <div style={{ fontSize: 8, color: 'rgba(100,160,255,0.25)', letterSpacing: '0.2em' }}>
            SORT ORDER: UNVERIFIED · TOTAL ENTRIES: DISPUTED · REVISION: INCOMPLETE
          </div>
        </div>

        {/* divider */}
        <div style={{ height: 1, background: 'rgba(100,160,255,0.1)', marginBottom: 20 }} />

        {/* listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {ENTRIES.map((e, i) => {
            const isMissing = e.status === 'missing'
            const isCurrent = e.status === 'current'
            const baseColor = isMissing
              ? `rgba(255,80,80,${glitch && i === ENTRIES.length - 1 ? 0.7 : 0.3})`
              : isCurrent
              ? 'rgba(100,255,160,0.65)'
              : 'rgba(100,160,255,0.4)'

            return (
              <div key={e.id} style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 80px 1fr',
                gap: 12,
                fontSize: 9,
                color: baseColor,
                letterSpacing: '0.08em',
                lineHeight: 2,
                fontFamily: '"JetBrains Mono", monospace',
                opacity: isMissing && glitch ? 0.4 : 1,
                transition: 'opacity 0.1s',
              }}>
                <span style={{ opacity: 0.5 }}>{e.id}</span>
                <span>{isMissing && glitch ? '????????????????' : e.name}</span>
                <span style={{ opacity: 0.35 }}>
                  {e.status === 'indexed' ? '···' : e.status === 'current' ? '▶' : '░░░'}
                </span>
                <span style={{ opacity: isMissing ? 0.4 : 0.6, fontSize: 8 }}>
                  {isCurrent ? `${e.gate} ← YOU ARE HERE` : e.gate}
                </span>
              </div>
            )
          })}
        </div>

        {/* footer */}
        <div style={{ height: 1, background: 'rgba(100,160,255,0.1)', margin: '20px 0 16px' }} />
        <div style={{ fontSize: 7, color: 'rgba(100,160,255,0.2)', letterSpacing: '0.2em', lineHeight: 2.4 }}>
          <span>16 ENTRIES INDEXED · 1 UNRESOLVED · CATALOG IS INCOMPLETE</span>
          <span style={{ marginLeft: 24, opacity: 0.5 }}>last sync: unknown</span>
        </div>
      </div>

      <HomeButton />
    </div>
  )
}
