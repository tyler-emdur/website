'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

interface Card {
  id: number
  pairId: number
  label: string
  flipped: boolean
  matched: boolean
}

const PAIRS: { label: string; world?: WorldId; portal?: PortalType }[] = [
  { label: 'DEPTH' },
  { label: 'DEPTH' },
  { label: 'BROADCAST', world: 3, portal: 'rotate' },
  { label: 'BROADCAST', world: 3, portal: 'rotate' },
  { label: 'CORRIDOR' },
  { label: 'CORRIDOR' },
  { label: 'MALL', world: 7, portal: 'vortex' },
  { label: 'MALL', world: 7, portal: 'vortex' },
  { label: '???' },
  { label: '???' },
  { label: 'SPIRAL', world: 13, portal: 'vortex' },
  { label: 'SPIRAL', world: 13, portal: 'vortex' },
  { label: 'LOOP', world: 10, portal: 'scatter' },
  { label: 'LOOP', world: 10, portal: 'scatter' },
  { label: 'TERMINAL', world: 12, portal: 'nothing' },
  { label: 'TERMINAL', world: 12, portal: 'nothing' },
  { label: 'PIXEL', world: 14, portal: 'chromatic' },
  { label: 'PIXEL', world: 14, portal: 'chromatic' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function World11Flicker() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [cards, setCards] = useState<Card[]>(() => shuffle(
    PAIRS.map((p, i) => ({
      id: i,
      pairId: Math.floor(i / 2),
      label: p.label,
      flipped: false,
      matched: false,
    }))
  ))
  const [selected, setSelected] = useState<number[]>([])
  const [glitch, setGlitch] = useState(false)
  const [won, setWon] = useState(false)
  const [flickerOff, setFlickerOff] = useState(true)
  const lockRef = useRef(false)

  useEffect(() => {
    const iv = setInterval(() => setFlickerOff(f => !f), 80 + Math.random() * 120)
    return () => clearInterval(iv)
  }, [])

  const checkMatch = useCallback((next: Card[], sel: number[]) => {
    if (sel.length !== 2) return
    const [a, b] = sel
    const match = next[a].pairId === next[b].pairId
    if (match) {
      const updated = next.map((c, i) =>
        i === a || i === b ? { ...c, matched: true, flipped: true } : c
      )
      setCards(updated)
      setSelected([])
      lockRef.current = false
      const pairIdx = next[a].pairId * 2
      const pairDef = PAIRS[pairIdx]
      if (pairDef?.world && pairDef.portal && Math.random() > 0.6) {
        setGlitch(true)
        setTimeout(() => {
          navigateTo(pairDef.world!, { type: pairDef.portal! })
        }, 600)
      }
      if (updated.every(c => c.matched)) setWon(true)
    } else {
      setGlitch(true)
      setTimeout(() => {
        setGlitch(false)
        setCards(c =>
          c.map((card, i) =>
            i === a || i === b ? { ...card, flipped: false } : card
          )
        )
        setSelected([])
        lockRef.current = false
      }, 700)
    }
  }, [navigateTo])

  const handleCard = (index: number) => {
    if (lockRef.current || cards[index].flipped || cards[index].matched) return
    lockRef.current = true
    const next = cards.map((c, i) => (i === index ? { ...c, flipped: true } : c))
    setCards(next)
    const sel = [...selected, index]
    setSelected(sel)
    if (sel.length === 2) {
      setTimeout(() => checkMatch(next, sel), 400)
    } else {
      lockRef.current = false
    }
  }

  return (
    <div
      data-world="11"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        overflow: 'hidden',
        fontFamily: '"Share Tech Mono", monospace',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: glitch
          ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,80,0.03) 2px, rgba(255,0,80,0.03) 4px)'
          : 'none',
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: flickerOff ? 0.92 : 1,
        transition: 'opacity 0.04s',
      }}>
        <div style={{
          position: 'absolute',
          top: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,50,100,0.6)', letterSpacing: '0.3em' }}>
            THE FLICKER
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 8, letterSpacing: '0.15em' }}>
            match pairs · some pairs open doors · some pairs open other pairs
          </div>
        </div>

        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          maxWidth: 420,
          width: '90%',
        }}>
          {cards.map((card, i) => (
            <button
              key={card.id}
              onClick={() => handleCard(i)}
              style={{
                aspectRatio: '3/4',
                background: card.matched
                  ? 'rgba(34,197,94,0.08)'
                  : card.flipped
                    ? 'rgba(30,30,40,0.95)'
                    : 'rgba(20,20,28,0.9)',
                border: `1px solid ${card.matched ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                cursor: card.matched ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: card.label === '???' ? 14 : 9,
                color: card.flipped || card.matched ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)',
                letterSpacing: '0.1em',
                transition: 'background 0.2s, transform 0.15s',
                transform: card.flipped && !card.matched ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {card.flipped || card.matched ? card.label : '?'}
            </button>
          ))}
        </div>

        {won && (
          <div style={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: 12 }}>
              all pairs resolved. the board remembers nothing.
            </div>
            <button
              onClick={() => navigateTo(4, { type: 'slide-right' })}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'inherit',
                fontSize: 9,
                letterSpacing: '0.2em',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              CORRIDOR →
            </button>
          </div>
        )}
      </div>

      <HomeButton />
    </div>
  )
}
