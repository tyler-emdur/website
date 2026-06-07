'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

interface Card {
  id: number
  pairId: number
  label: string
  color: string
  flipped: boolean
  matched: boolean
}

const PAIRS: { label: string; color: string; world?: WorldId; portal?: PortalType }[] = [
  { label: 'DEPTH', color: '#0066cc' },
  { label: 'DEPTH', color: '#0066cc' },
  { label: 'BROADCAST', color: '#ff6600', world: 3, portal: 'rotate' },
  { label: 'BROADCAST', color: '#ff6600', world: 3, portal: 'rotate' },
  { label: 'CORRIDOR', color: '#888888' },
  { label: 'CORRIDOR', color: '#888888' },
  { label: 'MALL', color: '#ff2d78', world: 7, portal: 'vortex' },
  { label: 'MALL', color: '#ff2d78', world: 7, portal: 'vortex' },
  { label: '???', color: '#ffffff' },
  { label: '???', color: '#ffffff' },
  { label: 'SPIRAL', color: '#9933ff', world: 13, portal: 'vortex' },
  { label: 'SPIRAL', color: '#9933ff', world: 13, portal: 'vortex' },
  { label: 'LOOP', color: '#00cc66', world: 10, portal: 'scatter' },
  { label: 'LOOP', color: '#00cc66', world: 10, portal: 'scatter' },
  { label: 'TERMINAL', color: '#33ff33', world: 12, portal: 'nothing' },
  { label: 'TERMINAL', color: '#33ff33', world: 12, portal: 'nothing' },
  { label: 'PIXEL', color: '#ffcc00', world: 14, portal: 'chromatic' },
  { label: 'PIXEL', color: '#ffcc00', world: 14, portal: 'chromatic' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const HIGH_SCORES = [
  { name: 'ACE', score: 2400 },
  { name: 'REX', score: 1800 },
  { name: 'ZAP', score: 1200 },
  { name: 'MAX', score: 900 },
  { name: '???', score: 600 },
]

export default function World11Flicker() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [cards, setCards] = useState<Card[]>(() => shuffle(
    PAIRS.map((p, i) => ({
      id: i,
      pairId: Math.floor(i / 2),
      label: p.label,
      color: p.color,
      flipped: false,
      matched: false,
    }))
  ))
  const [selected, setSelected] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(90)
  const [popup, setPopup] = useState<{ text: string; color: string; x: number; y: number } | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [started, setStarted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const lockRef = useRef(false)
  const popupRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Timer
  useEffect(() => {
    if (!started || gameOver || won) return
    if (timeLeft <= 0) { setGameOver(true); return }
    const iv = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { setGameOver(true); return 0 }
      return t - 1
    }), 1000)
    return () => clearInterval(iv)
  }, [started, gameOver, won, timeLeft])

  const showPopup = useCallback((text: string, color: string, e?: React.MouseEvent) => {
    if (popupRef.current) clearTimeout(popupRef.current)
    setPopup({
      text,
      color,
      x: e ? e.clientX : window.innerWidth / 2,
      y: e ? e.clientY : window.innerHeight / 2,
    })
    popupRef.current = setTimeout(() => setPopup(null), 900)
  }, [])

  const checkMatch = useCallback((next: Card[], sel: number[], e: React.MouseEvent) => {
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

      const newCombo = combo + 1
      setCombo(newCombo)
      const pts = 100 * newCombo
      setScore(s => s + pts)
      showPopup(newCombo > 1 ? `+${pts} COMBO ×${newCombo}!` : `+${pts}`, '#ffcc00', e)

      const pairIdx = next[a].pairId * 2
      const pairDef = PAIRS[pairIdx]
      if (pairDef?.world && pairDef.portal && Math.random() > 0.6) {
        setTimeout(() => {
          navigateTo(pairDef.world!, { type: pairDef.portal! })
        }, 1200)
      }
      if (updated.every(c => c.matched)) setWon(true)
    } else {
      setCombo(0)
      showPopup('MISS!', '#ff3333', e)
      setTimeout(() => {
        setCards(c =>
          c.map((card, i) =>
            i === a || i === b ? { ...card, flipped: false } : card
          )
        )
        setSelected([])
        lockRef.current = false
      }, 600)
    }
  }, [combo, navigateTo, showPopup])

  const handleCard = (index: number, e: React.MouseEvent) => {
    if (!started || lockRef.current || cards[index].flipped || cards[index].matched) return
    lockRef.current = true
    const next = cards.map((c, i) => (i === index ? { ...c, flipped: true } : c))
    setCards(next)
    const sel = [...selected, index]
    setSelected(sel)
    if (sel.length === 2) {
      setTimeout(() => checkMatch(next, sel, e), 350)
    } else {
      lockRef.current = false
    }
  }

  const timerColor = timeLeft > 30 ? '#00ff88' : timeLeft > 10 ? '#ffcc00' : '#ff3333'
  const timerPct = (timeLeft / 90) * 100

  if (!started) {
    return (
      <div data-world="11" style={{
        position: 'fixed', inset: 0,
        background: '#050010',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        overflow: 'hidden',
      }}>
        {/* Scanlines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)', pointerEvents: 'none', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: 'clamp(24px, 5vw, 48px)', color: '#ffcc00', marginBottom: 8, textShadow: '0 0 20px #ffcc00, 0 0 40px #ff9900', letterSpacing: '0.05em' }}>
            THE FLICKER
          </div>
          <div style={{ fontSize: 'clamp(8px, 2vw, 12px)', color: '#ff2d78', marginBottom: 40, textShadow: '0 0 10px #ff2d78', letterSpacing: '0.15em' }}>
            MEMORY MATCH CHALLENGE
          </div>

          {/* High scores */}
          <div style={{
            background: '#0a0020', border: '2px solid #9933ff',
            padding: '20px 32px', marginBottom: 40, textAlign: 'left',
            boxShadow: '0 0 20px rgba(153,51,255,0.3)',
          }}>
            <div style={{ fontSize: 9, color: '#9933ff', letterSpacing: '0.2em', marginBottom: 16, textAlign: 'center' }}>- HIGH SCORES -</div>
            {HIGH_SCORES.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 40, fontSize: 9, color: i === 0 ? '#ffcc00' : 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.1em' }}>
                <span>{i + 1}. {h.name}</span>
                <span>{h.score.toString().padStart(5, '0')}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStarted(true)}
            style={{
              background: '#ff2d78', border: '3px solid #ff85af',
              color: '#fff', fontFamily: '"Press Start 2P", monospace',
              fontSize: 14, padding: '16px 40px', cursor: 'pointer',
              letterSpacing: '0.1em', textShadow: '0 0 10px rgba(255,45,120,0.8)',
              boxShadow: '0 0 30px rgba(255,45,120,0.5), 4px 4px 0 #880022',
              animation: 'btnPulse 1s ease-in-out infinite',
            }}
          >
            PRESS START
          </button>

          <div style={{ marginTop: 24, fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', lineHeight: 2 }}>
            MATCH PAIRS · SOME PAIRS OPEN PORTALS<br />
            90 SECONDS · COMBOS = MORE POINTS
          </div>
        </div>

        <style>{`
          @keyframes btnPulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.03) } }
        `}</style>
        <HomeButton />
      </div>
    )
  }

  return (
    <div
      data-world="11"
      style={{
        position: 'fixed', inset: 0,
        background: '#050010',
        overflow: 'hidden',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }}
    >
      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Popup */}
      {popup && (
        <div style={{
          position: 'fixed',
          left: popup.x, top: popup.y - 20,
          transform: 'translate(-50%, -100%)',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 'clamp(10px, 2vw, 16px)',
          color: popup.color,
          textShadow: `0 0 20px ${popup.color}`,
          pointerEvents: 'none',
          zIndex: 100,
          animation: 'popFloat 0.9s both',
          whiteSpace: 'nowrap',
        }}>
          {popup.text}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* HUD */}
        <div style={{
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', gap: 24,
          borderBottom: '2px solid rgba(153,51,255,0.3)',
          background: 'rgba(0,0,0,0.5)',
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 'clamp(8px, 1.5vw, 11px)', color: '#ffcc00', textShadow: '0 0 10px #ffcc00', letterSpacing: '0.1em' }}>
            SCORE<br />
            <span style={{ fontSize: 'clamp(12px, 2.5vw, 18px)' }}>{score.toString().padStart(6, '0')}</span>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(7px, 1.2vw, 9px)', color: '#9933ff', letterSpacing: '0.2em', marginBottom: 6 }}>TIME</div>
            <div style={{
              height: 12, background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(153,51,255,0.4)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${timerPct}%`,
                background: timerColor,
                boxShadow: `0 0 8px ${timerColor}`,
                transition: 'width 1s linear, background 0.5s',
              }} />
            </div>
            <div style={{ fontSize: 'clamp(8px, 1.5vw, 12px)', color: timerColor, marginTop: 4, textShadow: `0 0 10px ${timerColor}` }}>
              {timeLeft}s
            </div>
          </div>
          <div style={{ fontSize: 'clamp(8px, 1.5vw, 11px)', color: '#ff2d78', textShadow: '0 0 10px #ff2d78', letterSpacing: '0.1em', textAlign: 'right' }}>
            COMBO<br />
            <span style={{ fontSize: 'clamp(12px, 2.5vw, 18px)' }}>×{combo}</span>
          </div>
        </div>

        {/* Card grid */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 8,
            width: 'min(100%, 600px)',
          }}>
            {cards.map((card, i) => (
              <div
                key={card.id}
                onClick={(e) => handleCard(i, e)}
                style={{
                  aspectRatio: '3/4',
                  cursor: card.matched ? 'default' : 'pointer',
                  position: 'relative',
                  transform: selected.includes(i) ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.15s',
                }}
              >
                {/* Card back */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: card.flipped || card.matched ? 'transparent' : '#0a0020',
                  border: `2px solid ${card.flipped || card.matched ? 'transparent' : 'rgba(153,51,255,0.4)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(12px, 2vw, 18px)', color: 'rgba(153,51,255,0.5)',
                  transition: 'all 0.2s',
                  boxShadow: selected.includes(i) ? '0 0 15px rgba(153,51,255,0.6)' : 'none',
                }}>
                  {!card.flipped && !card.matched && '?'}
                </div>

                {/* Card face */}
                {(card.flipped || card.matched) && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: card.matched ? `${card.color}22` : `${card.color}33`,
                    border: `2px solid ${card.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 4,
                    boxShadow: `0 0 ${card.matched ? 20 : 10}px ${card.color}${card.matched ? '80' : '40'}`,
                  }}>
                    <div style={{
                      fontSize: 'clamp(5px, 1vw, 7px)',
                      color: card.color,
                      textShadow: `0 0 8px ${card.color}`,
                      textAlign: 'center',
                      letterSpacing: '0.05em',
                      lineHeight: 1.3,
                      wordBreak: 'break-word',
                    }}>
                      {card.label}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Over / Win overlay */}
      {(gameOver || won) && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 50,
          fontFamily: '"Press Start 2P", monospace',
        }}>
          <div style={{
            fontSize: 'clamp(20px, 5vw, 40px)',
            color: won ? '#ffcc00' : '#ff3333',
            textShadow: `0 0 30px ${won ? '#ffcc00' : '#ff3333'}`,
            marginBottom: 24,
          }}>
            {won ? 'CLEAR!' : 'TIME UP!'}
          </div>
          <div style={{ fontSize: 'clamp(10px, 2vw, 14px)', color: '#fff', marginBottom: 8, letterSpacing: '0.1em' }}>
            FINAL SCORE
          </div>
          <div style={{ fontSize: 'clamp(24px, 5vw, 48px)', color: '#ffcc00', textShadow: '0 0 20px #ffcc00', marginBottom: 32 }}>
            {score.toString().padStart(6, '0')}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              onClick={() => {
                setCards(shuffle(PAIRS.map((p, i) => ({ id: i, pairId: Math.floor(i / 2), label: p.label, color: p.color, flipped: false, matched: false }))))
                setScore(0); setCombo(0); setTimeLeft(90); setGameOver(false); setWon(false)
              }}
              style={{
                background: '#ff2d78', border: '2px solid #ff85af',
                color: '#fff', fontFamily: '"Press Start 2P", monospace',
                fontSize: 'clamp(8px, 1.5vw, 11px)', padding: '10px 20px',
                cursor: 'pointer', letterSpacing: '0.1em',
              }}
            >
              RETRY
            </button>
            <button
              onClick={() => navigateTo(4, { type: 'slide-right' })}
              style={{
                background: 'transparent', border: '2px solid rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.6)', fontFamily: '"Press Start 2P", monospace',
                fontSize: 'clamp(8px, 1.5vw, 11px)', padding: '10px 20px',
                cursor: 'pointer', letterSpacing: '0.1em',
              }}
            >
              CORRIDOR →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popFloat { 0% { opacity:1; transform:translate(-50%,-100%) } 100% { opacity:0; transform:translate(-50%,-200%) } }
      `}</style>
      <HomeButton />
    </div>
  )
}
