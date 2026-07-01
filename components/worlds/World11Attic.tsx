'use client'
import { useState } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── Artifacts as catalog entries ──────────────────────────────────────────────

const CATALOG = [
  {
    lot: 'LOT 001',
    title: 'Television Remote Control',
    provenance: 'World 3 — Broadcast',
    condition: 'Heavy use. Channel 13 still functions.',
    description: 'A remote control recovered from the television room. The channel buttons are worn smooth from repeated use. Batteries unknown. Channel 13 still works. You haven\'t tried it in a while.',
    estimate: 'UNKNOWN ORIGIN',
    dims: '6.2 × 1.8 in',
  },
  {
    lot: 'LOT 002',
    title: 'Form B-7 (Revised)',
    provenance: 'World 4 — Blackbird',
    condition: 'Department of Unresolved Matters. Void after 30 days.',
    description: 'A bureaucratic document recovered from the Department of Unresolved Matters. This form must be completed in order to obtain Form A-3. Form A-3 requires Form B-7. Issued: [unknown]. Void after 30 days from an unknown start date.',
    estimate: 'NOT FOR SALE',
    dims: '8.5 × 11 in',
  },
  {
    lot: 'LOT 003',
    title: 'Film Negatives (Strip of 5)',
    provenance: 'World 8 — Darkroom',
    condition: 'Partially developed. One frame appears corrupted.',
    description: 'A strip of 35mm film negatives developed in the darkroom. Held to light: a mountain at 4am; a finish line; a desk; a city looking east; something corrupted. The fifth frame does not resolve.',
    estimate: 'PRICELESS / WORTHLESS',
    dims: '35mm strip',
  },
  {
    lot: 'LOT 004',
    title: 'A Coin',
    provenance: 'UNKNOWN — record purged',
    condition: 'Both sides identical. Does not add up.',
    description: 'A single coin of unconfirmed origin. One side: the number 1. Other side: also the number 1. Source sector could not be located in the index. Not legal tender in any documented jurisdiction.',
    estimate: '$0.00 / $∞',
    dims: '0.75 in diameter',
  },
  {
    lot: 'LOT 005',
    title: 'Field Notebook (2021–2024)',
    provenance: 'UNKNOWN — record purged',
    condition: 'Pages torn from Day 113 onward.',
    description: 'Personal field notes spanning 2021–2024. Coordinates: 40.0150°N 105.2705°W. Day 1: arrived. Equipment functioning. Day 47: signal at 88.7 again. Day 112: still no source found. Day ...: [pages torn out].',
    estimate: 'NOT VERIFIED',
    dims: '5 × 8 in, 112 readable pages',
  },
]

// ── Simple world map as small index card ──────────────────────────────────────
const MAP_WORLDS = [
  { id: 0, label: 'SURFACE' },    { id: 1, label: 'UNIVERSE' },
  { id: 2, label: 'EXPLORER' },   { id: 3, label: 'BROADCAST' },
  { id: 4, label: 'BLACKBIRD' },  { id: 5, label: 'MALL' },
  { id: 6, label: 'GARAGE' },     { id: 7, label: 'CONTACT' },
  { id: 9, label: 'MOTH' },       { id: 10, label: 'NIGHT SKY' },
  { id: 11, label: 'ATTIC' },     { id: 12, label: 'DEV OS' },
  { id: 13, label: 'APPLETS' },   { id: 14, label: 'AISLE' },
]

export default function World11Attic() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [open, setOpen] = useState<number | null>(null)
  const [chestCode, setChestCode] = useState('')
  const [chestOpen, setChestOpen] = useState(false)
  const [chestError, setChestError] = useState(false)

  function tryChest() {
    if (chestCode === '1247') { setChestOpen(true); setChestError(false) }
    else { setChestError(true); setTimeout(() => setChestError(false), 700) }
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#f0ebe0',
      overflow: 'auto',
      fontFamily: '"JetBrains Mono", monospace',
      position: 'relative',
    }}>

      {/* Auction house header */}
      <div style={{
        borderBottom: '2px solid #1a1a1a',
        padding: '18px 40px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        background: '#f0ebe0',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontFamily: '"IM Fell English", Georgia, serif', fontSize: 26, color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            Objects & Effects
          </div>
          <div style={{ fontSize: 7, letterSpacing: '0.2em', color: '#888', marginTop: 2, textTransform: 'uppercase' }}>
            Recovered Items · Provenance Unverified · Sale 16
          </div>
        </div>
        <div style={{ fontSize: 7, letterSpacing: '0.15em', color: '#aaa', textAlign: 'right', textTransform: 'uppercase', lineHeight: 2 }}>
          The Attic<br/>
          Est. Unknown
        </div>
      </div>

      {/* Catalog grid */}
      <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Introductory text */}
        <div style={{
          borderLeft: '2px solid #1a1a1a', paddingLeft: 16, marginBottom: 40,
          fontFamily: '"IM Fell English", Georgia, serif',
          fontSize: 13, color: '#444', lineHeight: 1.8, fontStyle: 'italic',
          maxWidth: 520,
        }}>
          The following objects were recovered from various sectors of the multiverse.
          Provenance is partially documented. Condition as noted. All sales final.
        </div>

        {CATALOG.map((item, i) => (
          <div
            key={i}
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              borderTop: i === 0 ? '1px solid #1a1a1a' : '1px solid rgba(0,0,0,0.12)',
              padding: '22px 0',
              cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: '80px 1fr 140px',
              gap: '0 24px',
              transition: 'background 0.1s',
              background: open === i ? 'rgba(0,0,0,0.03)' : 'transparent',
              paddingLeft: open === i ? 12 : 0,
            }}
          >
            {/* Lot number */}
            <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#999', paddingTop: 3, textTransform: 'uppercase' }}>
              {item.lot}
            </div>

            {/* Title + description */}
            <div>
              <div style={{
                fontFamily: '"IM Fell English", Georgia, serif',
                fontSize: 17, color: '#1a1a1a', marginBottom: 4,
              }}>{item.title}</div>
              <div style={{ fontSize: 8, color: '#888', letterSpacing: '0.1em', marginBottom: open === i ? 12 : 0, textTransform: 'uppercase' }}>
                {item.provenance}
              </div>
              {open === i && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: '"IM Fell English", Georgia, serif', fontStyle: 'italic', fontSize: 12, color: '#444', lineHeight: 1.8, marginBottom: 10 }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: 7, color: '#aaa', letterSpacing: '0.1em', lineHeight: 2, textTransform: 'uppercase' }}>
                    Condition: {item.condition}<br />
                    Dimensions: {item.dims}
                  </div>
                </div>
              )}
            </div>

            {/* Estimate */}
            <div style={{ textAlign: 'right', paddingTop: 3 }}>
              <div style={{ fontSize: 7, letterSpacing: '0.12em', color: '#aaa', marginBottom: 4, textTransform: 'uppercase' }}>Estimate</div>
              <div style={{ fontFamily: '"IM Fell English", Georgia, serif', fontSize: 12, color: '#333' }}>{item.estimate}</div>
            </div>
          </div>
        ))}

        {/* Last row border */}
        <div style={{ borderTop: '1px solid #1a1a1a', marginTop: 0 }} />

        {/* Locked chest as "sealed lot" */}
        <div style={{ marginTop: 40, padding: '22px 0', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px', gap: '0 24px' }}>
            <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#999', paddingTop: 3, textTransform: 'uppercase' }}>LOT 006</div>
            <div>
              <div style={{ fontFamily: '"IM Fell English", Georgia, serif', fontSize: 17, color: '#1a1a1a', marginBottom: 4 }}>
                {chestOpen ? 'Contents of Sealed Box' : 'Sealed Box — Contents Unknown'}
              </div>
              <div style={{ fontSize: 8, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                Requires Access Code
              </div>
              {!chestOpen ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={chestCode}
                    onChange={e => setChestCode(e.target.value.slice(0, 4))}
                    onKeyDown={e => e.key === 'Enter' && tryChest()}
                    placeholder="_ _ _ _"
                    maxLength={4}
                    style={{
                      width: 70, background: 'transparent',
                      border: `1px solid ${chestError ? 'rgba(180,0,0,0.6)' : 'rgba(0,0,0,0.2)'}`,
                      color: chestError ? 'rgba(180,0,0,0.8)' : '#333',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 13, textAlign: 'center', padding: '4px 0',
                      letterSpacing: '0.25em', outline: 'none',
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                  <button
                    onClick={e => { e.stopPropagation(); tryChest() }}
                    style={{
                      background: 'transparent', border: '1px solid rgba(0,0,0,0.2)',
                      color: '#555', fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 8, letterSpacing: '0.15em', padding: '5px 12px',
                      cursor: 'pointer', textTransform: 'uppercase',
                    }}
                  >Open</button>
                </div>
              ) : (
                <div style={{ fontFamily: '"IM Fell English", Georgia, serif', fontStyle: 'italic', fontSize: 12, color: '#444', lineHeight: 1.8, maxWidth: 400 }}>
                  you already knew this number.<br/>
                  <span style={{ opacity: 0.5 }}>it means nothing. it means everything.</span>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', paddingTop: 3 }}>
              <div style={{ fontSize: 7, letterSpacing: '0.12em', color: '#aaa', marginBottom: 4, textTransform: 'uppercase' }}>Estimate</div>
              <div style={{ fontFamily: '"IM Fell English", Georgia, serif', fontSize: 12, color: '#333' }}>—</div>
            </div>
          </div>
        </div>

        {/* World index as small appendix */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 7, letterSpacing: '0.2em', color: '#bbb', marginBottom: 16, textTransform: 'uppercase' }}>Appendix — All Sectors</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px' }}>
            {MAP_WORLDS.map(w => (
              <div key={w.id} style={{ fontSize: 7, color: '#999', letterSpacing: '0.1em', lineHeight: 2, textTransform: 'uppercase' }}>
                {String(w.id).padStart(2, '0')} — {w.label}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 40, paddingTop: 16,
          borderTop: '2px solid #1a1a1a',
          display: 'flex', justifyContent: 'space-between',
          fontSize: 7, color: '#bbb', letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          <span>Objects & Effects — Sale 16</span>
          <span
            onClick={() => navigateTo(1, { type: 'fold' })}
            style={{ cursor: 'pointer', color: '#888' }}
          >← Return to Universe</span>
          <span>All provenance unverified</span>
        </div>
      </div>

      <HomeButton />

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </div>
  )
}
