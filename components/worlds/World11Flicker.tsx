'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import HomeButton from './HomeButton'

// ── High scores ──────────────────────────────────────────────────────────────
const HIGH_SCORES = [
  { name: 'T.E.', score: 999990 },
  { name: 'AAA', score: 88700 },
  { name: '???', score: 47047 },
  { name: 'AAA', score: 12345 },
  { name: 'AAA', score: 1000 },
]

// ── Memory match game ─────────────────────────────────────────────────────────
const CARD_PAIRS = [
  { label: 'DEPTH', color: '#0066cc' },
  { label: 'SIGNAL', color: '#22c55e' },
  { label: 'MALL', color: '#ff2d78' },
  { label: 'SPIRAL', color: '#9933ff' },
  { label: 'BROADCAST', color: '#ff6600' },
  { label: 'ARCHIVE', color: '#8B6914' },
]

interface Card { id: number; pairId: number; label: string; color: string; flipped: boolean; matched: boolean }

function MemoryGame({ onWin }: { onWin: (score: number) => void }) {
  const [cards, setCards] = useState<Card[]>(() => {
    const base = CARD_PAIRS.flatMap((p, i) => [
      { id: i*2, pairId: i, label: p.label, color: p.color, flipped: false, matched: false },
      { id: i*2+1, pairId: i, label: p.label, color: p.color, flipped: false, matched: false },
    ])
    return base.sort(() => Math.random() - 0.5)
  })
  const [flipped, setFlipped] = useState<number[]>([])
  const [locked, setLocked] = useState(false)
  const [moves, setMoves] = useState(0)
  const [startTime] = useState(Date.now())

  const flip = (id: number) => {
    if (locked) return
    const card = cards.find(c => c.id === id)!
    if (card.flipped || card.matched) return
    const newFlipped = [...flipped, id]
    setCards(cs => cs.map(c => c.id === id ? { ...c, flipped: true } : c))
    if (newFlipped.length === 2) {
      setLocked(true); setMoves(m => m + 1)
      const [a, b] = newFlipped.map(fid => cards.find(c => c.id === fid)!)
      if (a.pairId === b.pairId) {
        setTimeout(() => {
          setCards(cs => cs.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c))
          setFlipped([])
          setLocked(false)
          if (cards.filter(c => c.matched).length + 2 >= cards.length) {
            const t = Math.round((Date.now() - startTime) / 1000)
            onWin(Math.max(1000, 50000 - moves * 200 - t * 50))
          }
        }, 400)
      } else {
        setTimeout(() => {
          setCards(cs => cs.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c))
          setFlipped([])
          setLocked(false)
        }, 900)
      }
    } else {
      setFlipped(newFlipped)
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        {cards.map(card => (
          <div key={card.id} onClick={() => flip(card.id)} style={{
            height: 54, cursor: 'pointer', borderRadius: 3,
            border: card.matched ? `2px solid ${card.color}` : '2px solid #333',
            background: card.flipped || card.matched ? card.color + '22' : '#111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontFamily: '"Press Start 2P", monospace',
            color: card.flipped || card.matched ? card.color : '#333',
            letterSpacing: '0.06em', transition: 'background 0.15s',
            textShadow: card.flipped || card.matched ? `0 0 8px ${card.color}` : 'none',
          }}>
            {card.flipped || card.matched ? card.label : '?'}
          </div>
        ))}
      </div>
      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#666', textAlign: 'right' }}>
        MOVES: {moves}
      </div>
    </div>
  )
}

// ── Reaction game ─────────────────────────────────────────────────────────────
function ReactionGame({ onWin }: { onWin: (score: number) => void }) {
  const [state, setState] = useState<'wait' | 'ready' | 'now' | 'result'>('wait')
  const [result, setResult] = useState<number | null>(null)
  const [early, setEarly] = useState(false)
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)
  const greenAt = useRef<number>(0)

  useEffect(() => {
    if (state === 'wait') {
      const delay = 2000 + Math.random() * 3000
      t.current = setTimeout(() => { greenAt.current = Date.now(); setState('now') }, delay)
    }
    return () => { if (t.current) clearTimeout(t.current) }
  }, [state])

  const handleClick = () => {
    if (state === 'wait') { setEarly(true); setState('result'); setResult(null) }
    else if (state === 'now') {
      const ms = Date.now() - greenAt.current
      setResult(ms)
      setState('result')
      onWin(Math.max(500, 5000 - ms * 8))
    }
  }

  return (
    <div>
      <div onClick={handleClick} style={{
        height: 120, borderRadius: 4, cursor: 'pointer',
        background: state === 'now' ? '#00ff00' : state === 'result' ? '#333' : '#cc2200',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: '2px solid #444',
        transition: 'background 0.05s',
      }}>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 11, color: state === 'now' ? '#000' : '#fff', marginBottom: 6 }}>
          {state === 'wait' && 'WAIT...'}
          {state === 'now' && 'NOW!'}
          {state === 'result' && (early ? 'TOO EARLY' : `${result}ms`)}
        </div>
        {state === 'result' && !early && (
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#aaa' }}>
            {result! < 250 ? 'EXCELLENT' : result! < 350 ? 'GOOD' : 'SLOW'}
          </div>
        )}
      </div>
      {state === 'result' && (
        <button onClick={() => { setState('wait'); setEarly(false); setResult(null) }} style={{
          marginTop: 8, padding: '6px 16px', background: '#222', color: '#ff006e',
          border: '1px solid #ff006e', fontFamily: '"Press Start 2P", monospace',
          fontSize: 8, cursor: 'pointer', width: '100%',
        }}>PLAY AGAIN</button>
      )}
    </div>
  )
}

// ── Cabinet screen ────────────────────────────────────────────────────────────
type Mode = 'attract' | 'select' | 'memory' | 'reaction' | 'scores'

export default function World11Flicker() {
  const [mode, setMode] = useState<Mode>('attract')
  const [credits, setCredits] = useState(0)
  const [score, setScore] = useState(0)
  const [blink, setBlink] = useState(true)
  const [attractIdx, setAttractIdx] = useState(0)

  useEffect(() => { const iv = setInterval(() => setBlink(b => !b), 600); return () => clearInterval(iv) }, [])
  useEffect(() => {
    if (mode !== 'attract') return
    const iv = setInterval(() => setAttractIdx(i => (i + 1) % 3), 3000)
    return () => clearInterval(iv)
  }, [mode])

  const insertCoin = () => { setCredits(c => c + 1); setMode('select') }

  const handleWin = (s: number) => {
    setScore(prev => prev + s)
    setTimeout(() => setMode('scores'), 800)
  }

  const ATTRACT_MSGS = ['FLICKER ARCADE', '★★★★★', 'INSERT COIN']

  return (
    <div data-world="11" style={{
      position: 'fixed', inset: 0, background: '#0a0005',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <HomeButton />

      {/* Cabinet body */}
      <div style={{
        width: 'min(380px, 92vw)',
        background: 'linear-gradient(160deg, #1a0a30, #0d0520)',
        border: '2px solid #2a1a4a',
        borderRadius: 8,
        boxShadow: '0 0 60px rgba(180,0,255,0.15), 0 0 20px rgba(255,0,110,0.1)',
        overflow: 'hidden',
      }}>
        {/* Marquee */}
        <div style={{
          background: 'linear-gradient(90deg, #ff006e, #8338ec, #3a86ff)',
          padding: '6px 0', textAlign: 'center',
          fontFamily: '"Press Start 2P", monospace', fontSize: 10,
          color: '#fff', letterSpacing: '0.15em',
          textShadow: '0 0 10px #fff',
        }}>
          ★ FLICKER ARCADE ★
        </div>

        {/* Screen */}
        <div style={{
          margin: 12, background: '#000',
          border: '3px solid #1a0a30',
          borderRadius: 4,
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)',
          padding: 16,
          minHeight: 260,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)',
          }} />

          {/* Credits + score */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#ff006e', marginBottom: 12 }}>
            <span>CREDITS {credits}</span>
            <span>SCORE {String(score).padStart(6, '0')}</span>
          </div>

          {/* ATTRACT */}
          {mode === 'attract' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: attractIdx === 0 ? 16 : 11, color: '#ff006e', marginBottom: 16, textShadow: '0 0 15px #ff006e', transition: 'font-size 0.2s' }}>
                {ATTRACT_MSGS[attractIdx]}
              </div>
              {blink && (
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#ffbe0b', letterSpacing: '0.1em' }}>
                  PRESS COIN TO CONTINUE
                </div>
              )}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#444', marginBottom: 8 }}>HI-SCORES</div>
                {HIGH_SCORES.slice(0,3).map((s,i) => (
                  <div key={i} style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: i === 0 ? '#ffbe0b' : '#666', marginBottom: 4, display: 'flex', justifyContent: 'space-between', padding: '0 20px' }}>
                    <span>{i + 1}. {s.name}</span><span>{s.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SELECT */}
          {mode === 'select' && (
            <div>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#fff', textAlign: 'center', marginBottom: 16 }}>SELECT GAME</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'MEMORY MATCH', sub: 'find the pairs', action: () => setMode('memory') },
                  { label: 'REACTION TEST', sub: 'press when green', action: () => setMode('reaction') },
                  { label: 'HIGH SCORES', sub: 'view leaderboard', action: () => setMode('scores') },
                ].map((opt, i) => (
                  <button key={i} onClick={opt.action} style={{
                    padding: '10px 14px', background: '#0d0520', border: '1px solid #2a1a4a',
                    color: '#ff006e', fontFamily: '"Press Start 2P", monospace', fontSize: 8,
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                    ▸ {opt.label}
                    <div style={{ color: '#444', fontSize: 7, marginTop: 3 }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MEMORY */}
          {mode === 'memory' && <MemoryGame onWin={handleWin} />}

          {/* REACTION */}
          {mode === 'reaction' && <ReactionGame onWin={handleWin} />}

          {/* SCORES */}
          {mode === 'scores' && (
            <div>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#ffbe0b', textAlign: 'center', marginBottom: 14 }}>HALL OF RECORDS</div>
              {[...HIGH_SCORES, { name: 'YOU', score }].sort((a,b) => b.score - a.score).slice(0,6).map((s,i) => (
                <div key={i} style={{
                  fontFamily: '"Press Start 2P", monospace', fontSize: 8,
                  color: s.name === 'T.E.' ? '#ffbe0b' : s.name === 'YOU' ? '#06ffa5' : '#888',
                  display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '4px 8px',
                  background: s.name === 'T.E.' ? 'rgba(255,190,11,0.05)' : 'transparent',
                }}>
                  <span>{i+1}. {s.name}</span><span>{s.score.toLocaleString()}</span>
                </div>
              ))}
              <button onClick={() => setMode('select')} style={{
                marginTop: 8, padding: '6px 0', width: '100%',
                background: '#0d0520', border: '1px solid #333',
                color: '#666', fontFamily: '"Press Start 2P", monospace', fontSize: 7, cursor: 'pointer',
              }}>← BACK</button>
            </div>
          )}
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 14px' }}>
          <button onClick={insertCoin} style={{
            padding: '8px 14px', background: '#1a0a30', border: '1px solid #3a1a5a',
            color: '#ffbe0b', fontFamily: '"Press Start 2P", monospace', fontSize: 7,
            cursor: 'pointer', letterSpacing: '0.08em',
          }}>INSERT COIN</button>
          <div style={{ display: 'flex', gap: 6 }}>
            {['◁','△','▷'].map((b,i) => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: '50%',
                background: ['#ff006e','#8338ec','#3a86ff'][i],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: '#fff', boxShadow: `0 0 6px ${['#ff006e','#8338ec','#3a86ff'][i]}`,
              }}>{b}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
