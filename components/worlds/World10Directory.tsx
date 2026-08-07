'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import HomeButton from './HomeButton'
import { CATALOGUE } from './catalogue-data'
import { generateSigil } from '@/lib/sigil'

// ── The Directory ────────────────────────────────────────────────────────────
// A catalogue, not a portfolio. Twelve real repositories, most of them stalled
// mid-build, presented one at a time — the mechanic borrowed from a gallery
// site whose whole trick is that geography-of-attention IS the interface: one
// object in focus, its neighbors peeking, everything else gone. The honest
// read on each project is included. Nothing here has been cleaned up.

const FONT = '"JetBrains Mono", monospace'
const N = CATALOGUE.length

function Sigil({ seed, dim = false }: { seed: string; dim?: boolean }) {
  const spec = useMemo(() => generateSigil(seed), [seed])
  const stroke = dim ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.82)'
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      {spec.ring && (
        <circle cx={50} cy={50} r={spec.ring.r} fill="none" stroke={stroke} strokeWidth={0.5} opacity={0.5} />
      )}
      {spec.ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={stroke} strokeWidth={1} strokeLinecap="round" />
      ))}
      <polygon points={spec.poly} fill="none" stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" />
      <circle cx={50} cy={50} r={spec.dotR} fill={stroke} />
    </svg>
  )
}

export default function World10Directory() {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<'film' | 'grid'>('film')
  const [aboutOpen, setAboutOpen] = useState(false)
  const wheelLock = useRef(false)

  const go = useCallback((delta: number) => {
    setIndex(i => Math.max(0, Math.min(N - 1, i + delta)))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== 'film') {
        if (e.key === 'g' || e.key === 'Escape') setMode('film')
        return
      }
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'g') setMode('grid')
      else if (e.key === 'Escape') setAboutOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, go])

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (mode !== 'film') return
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(delta) < 12 || wheelLock.current) return
      wheelLock.current = true
      go(delta > 0 ? 1 : -1)
      setTimeout(() => { wheelLock.current = false }, 380)
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [mode, go])

  const entry = CATALOGUE[index]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#050505', color: '#fff',
      fontFamily: FONT, overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Top-left mark */}
      <div style={{
        position: 'fixed', top: 24, left: 24, zIndex: 20,
        fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.5)',
      }}>
        the directory
      </div>

      {/* About toggle */}
      <button
        onClick={() => setAboutOpen(v => !v)}
        style={{
          position: 'fixed', top: 20, right: 24, zIndex: 21,
          width: 30, height: 30, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.4)',
          color: 'rgba(255,255,255,0.7)', fontFamily: FONT, fontSize: 12, cursor: 'pointer',
        }}
        aria-label="about"
      >
        {aboutOpen ? '×' : '?'}
      </button>

      {aboutOpen && (
        <div style={{
          position: 'fixed', top: 62, right: 24, zIndex: 21, width: 300,
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          padding: '18px 20px', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)',
        }}>
          Twelve repositories. Most of them stalled mid-build, a couple finished
          and unread, one with no backup at all. The read on each one was
          written before any of it was public — nothing here has been cleaned
          up for display.
          <div style={{ marginTop: 10, opacity: 0.5, fontSize: 11 }}>— T.E.</div>
        </div>
      )}

      {/* Index indicator */}
      <div style={{
        position: 'fixed', top: 52, left: 24, zIndex: 20,
        fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em',
      }}>
        {String(index + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
      </div>

      {/* View toggle */}
      <button
        onClick={() => setMode(m => (m === 'film' ? 'grid' : 'film'))}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 20,
          border: '1px solid rgba(255,255,255,0.25)', borderRadius: 6,
          background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.6)',
          fontFamily: FONT, fontSize: 10, letterSpacing: '0.15em',
          padding: '8px 14px', cursor: 'pointer', textTransform: 'uppercase',
        }}
      >
        {mode === 'film' ? 'grid' : 'filmstrip'}
      </button>

      {mode === 'film' ? (
        <Filmstrip index={index} setIndex={setIndex} go={go} entry={entry} />
      ) : (
        <Grid onPick={(i) => { setIndex(i); setMode('film') }} />
      )}

      <HomeButton />
    </div>
  )
}

function Filmstrip({
  index, setIndex, go, entry,
}: {
  index: number
  setIndex: (i: number) => void
  go: (delta: number) => void
  entry: typeof CATALOGUE[number]
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* left arrow */}
      <NavArrow dir="left" disabled={index === 0} onClick={() => go(-1)} />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 0, height: '70vh', maxWidth: '100vw', overflow: 'hidden',
      }}>
        {CATALOGUE.map((item, i) => {
          const dist = Math.abs(i - index)
          if (dist > 2) return null
          const focused = dist === 0
          const width = focused
            ? 'min(560px, 62vw)'
            : dist === 1
              ? 'min(140px, 14vw)'
              : 'min(40px, 4vw)'
          return (
            <div
              key={item.id}
              onClick={() => !focused && setIndex(i)}
              style={{
                width, flexShrink: 0, height: '100%',
                transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.45s',
                opacity: focused ? 1 : dist === 1 ? 0.5 : 0.15,
                overflow: 'hidden', cursor: focused ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 6px',
              }}
            >
              {focused ? (
                <FocusedCard entry={item} />
              ) : (
                <div style={{ width: '70%', aspectRatio: '1' }}>
                  <Sigil seed={item.id} dim />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <NavArrow dir="right" disabled={index === N - 1} onClick={() => go(1)} />
    </div>
  )
}

function NavArrow({ dir, disabled, onClick }: { dir: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flexShrink: 0, width: 56, height: 56, borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
        color: disabled ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)',
        fontSize: 18, cursor: disabled ? 'default' : 'pointer', zIndex: 15,
        transition: 'color 0.2s, border-color 0.2s',
      }}
      aria-label={dir}
    >
      {dir === 'left' ? '←' : '→'}
    </button>
  )
}

function FocusedCard({ entry }: { entry: typeof CATALOGUE[number] }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14,
      padding: '0 20px',
    }}>
      <div style={{ width: 84, height: 84, flexShrink: 0 }}>
        <Sigil seed={entry.id} />
      </div>

      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {entry.repos.map(r => (
          <span key={r} style={{
            fontSize: 10, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '2px 7px',
          }}>
            {r}
          </span>
        ))}
      </div>

      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(200,220,255,0.55)' }}>
        {entry.status}
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.7)', maxWidth: 460 }}>
        {entry.summary}
      </p>

      <div style={{ width: 36, height: 1, background: 'rgba(255,255,255,0.15)' }} />

      <div>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,110,110,0.55)', marginBottom: 8, textTransform: 'uppercase' }}>
          the rip
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.75, color: 'rgba(255,255,255,0.55)', maxWidth: 440, fontStyle: 'italic' }}>
          {entry.rip}
        </p>
      </div>
    </div>
  )
}

function Grid({ onPick }: { onPick: (i: number) => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, paddingTop: 90, paddingBottom: 60,
      overflowY: 'auto', display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
      gap: 2, padding: '90px 24px 60px',
    }}>
      {CATALOGUE.map((item, i) => (
        <button
          key={item.id}
          onClick={() => onPick(i)}
          style={{
            aspectRatio: '1', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: 14, color: '#fff',
          }}
        >
          <div style={{ width: '48%', aspectRatio: '1' }}>
            <Sigil seed={item.id} />
          </div>
          <div style={{
            fontSize: 9, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)',
            textAlign: 'center', lineHeight: 1.5,
          }}>
            {item.repos[0]}
          </div>
        </button>
      ))}
    </div>
  )
}
