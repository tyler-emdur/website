'use client'
import { useState, useRef, useEffect } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── Abstract image tile ─────────────────────────────────────────────────────
function Tile({ seed, selected, onClick, label }: {
  seed: number; selected: boolean; onClick: () => void; label?: string
}) {
  const h1 = (seed * 73) % 360
  const h2 = (seed * 31 + 180) % 360
  const cx = 15 + (seed * 43) % 70
  const cy = 15 + (seed * 61) % 70
  return (
    <button onClick={onClick} style={{
      aspectRatio: '1', cursor: 'pointer', padding: 0, outline: 'none',
      border: selected ? '3px solid #1a73e8' : '2px solid #dadce0',
      background: `radial-gradient(circle at ${cx}% ${cy}%, hsl(${h1},35%,38%), hsl(${h2},20%,15%))`,
      position: 'relative', overflow: 'hidden', borderRadius: 3,
      transition: 'border-color 0.1s, transform 0.1s',
      transform: selected ? 'scale(0.95)' : 'scale(1)',
    }}>
      {selected && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(26,115,232,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: '#fff',
        }}>✓</div>
      )}
      {label && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 4px',
          background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.6)',
          fontSize: 7, fontFamily: 'monospace', letterSpacing: '0.06em',
        }}>{label}</div>
      )}
    </button>
  )
}

// ── Drawing canvas ──────────────────────────────────────────────────────────
function DrawCanvas({ onSubmit }: { onSubmit: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasDrawn = useRef(false)

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, 0, c.width, c.height)
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }
  const onDown = (e: React.MouseEvent) => {
    drawing.current = true; hasDrawn.current = true
    const c = ref.current!; const ctx = c.getContext('2d')!; const p = getPos(e, c)
    ctx.beginPath(); ctx.moveTo(p.x, p.y)
  }
  const onMove = (e: React.MouseEvent) => {
    if (!drawing.current) return
    const c = ref.current!; const ctx = c.getContext('2d')!; const p = getPos(e, c)
    ctx.lineTo(p.x, p.y); ctx.stroke()
  }
  const onUp = () => { drawing.current = false }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <canvas ref={ref} width={340} height={200} style={{
        border: '2px solid #dadce0', cursor: 'crosshair', borderRadius: 3,
        maxWidth: '100%', touchAction: 'none',
      }} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} />
      <button onClick={() => hasDrawn.current && onSubmit()} style={{
        padding: '10px 32px', background: '#1a73e8', color: '#fff',
        border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'Arial, sans-serif', fontSize: 14,
      }}>Submit Drawing</button>
    </div>
  )
}

// ── Phase types ─────────────────────────────────────────────────────────────
type Phase = 'intro' | 'normal1' | 'normal2' | 'weird' | 'draw' | 'analyzing' | 'reclassify' | 'complete'

const WEIRD_PROMPTS = [
  'Select all images containing distance.',
  'Select all images where it is currently 3:00pm.',
  'Identify every object that sounds like the number seven.',
  'Select every memory you regret.',
]

const ATTRIBUTES = [
  { text: 'Hesitation (2.8 seconds)', ms: 500 },
  { text: 'Backtracking on second tile', ms: 1000 },
  { text: 'Strategy attempt detected', ms: 1500 },
  { text: 'Uncertainty about what "correct" means', ms: 2100 },
  { text: 'Wondering if this is a trick', ms: 2700 },
  { text: 'Continuing anyway', ms: 3300 },
]

const SEEDS = [17, 42, 8, 61, 33, 79, 25, 54, 11]

export default function World9Contact() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [phase, setPhase] = useState<Phase>('intro')
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [weirdIdx, setWeirdIdx] = useState(0)
  const [failCount, setFailCount] = useState(0)
  const [attrs, setAttrs] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [dots, setDots] = useState('')

  const toggle = (i: number) => setSel(prev => {
    const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n
  })

  const confirmNormal = () => { setSel(new Set()); setPhase(phase === 'normal1' ? 'normal2' : 'weird') }

  const confirmWeird = () => {
    setSel(new Set()); setFailCount(c => c + 1)
    if (weirdIdx < WEIRD_PROMPTS.length - 1) setWeirdIdx(i => i + 1)
    else setPhase('draw')
  }

  const submitDraw = () => {
    setPhase('analyzing')
    let i = 0
    const iv = setInterval(() => {
      setDots('.'.repeat(++i % 4))
      if (i >= 9) {
        clearInterval(iv); setPhase('reclassify')
        ATTRIBUTES.forEach(({ text, ms }) => setTimeout(() => setAttrs(prev => [...prev, text]), ms))
        setTimeout(() => setShowResult(true), 4200)
      }
    }, 350)
  }

  const cardStyle: React.CSSProperties = {
    fontFamily: 'Arial, Helvetica, sans-serif', background: '#fff',
    borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    padding: '32px 28px', width: 'min(400px, 90vw)',
    maxHeight: '90vh', overflowY: 'auto',
  }

  return (
    <div data-world="9" style={{
      position: 'fixed', inset: 0, background: '#f1f3f4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <HomeButton />
      <div style={cardStyle}>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.18em', color: '#9aa0a6', marginBottom: 10 }}>CAPTCHA v4.1.2</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#202124', marginBottom: 10, lineHeight: 1.3 }}>
              Verify you are human.
            </div>
            <div style={{ fontSize: 13, color: '#5f6368', marginBottom: 28, lineHeight: 1.7 }}>
              This system uses advanced behavioral analysis to confirm whether you qualify as a person.
            </div>
            <div style={{ fontSize: 9, color: '#c6cacc', marginBottom: 24, letterSpacing: '0.08em' }}>
              Protected by SOME AUTHORITY · Privacy · Terms
            </div>
            <button onClick={() => setPhase('normal1')} style={{
              width: '100%', padding: '12px 0', background: '#1a73e8', color: '#fff',
              border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}>Begin Verification</button>
          </div>
        )}

        {(phase === 'normal1' || phase === 'normal2') && (
          <div>
            <div style={{ fontSize: 10, color: '#9aa0a6', marginBottom: 6, letterSpacing: '0.12em' }}>
              STEP {phase === 'normal1' ? '1' : '2'} OF 2
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#202124', marginBottom: 14 }}>
              {phase === 'normal1' ? 'Select all images containing a traffic light.' : 'Select all images containing a crosswalk.'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, marginBottom: 14 }}>
              {SEEDS.map((s, i) => <Tile key={i} seed={s + (phase === 'normal2' ? 100 : 0)} selected={sel.has(i)} onClick={() => toggle(i)} />)}
            </div>
            <button onClick={confirmNormal} disabled={sel.size === 0} style={{
              width: '100%', padding: '10px 0',
              background: sel.size > 0 ? '#1a73e8' : '#dadce0',
              color: sel.size > 0 ? '#fff' : '#9aa0a6',
              border: 'none', borderRadius: 4, fontSize: 14,
              cursor: sel.size > 0 ? 'pointer' : 'default', fontFamily: 'inherit',
            }}>{sel.size === 0 ? 'Skip' : 'Verify'}</button>
          </div>
        )}

        {phase === 'weird' && (
          <div>
            {failCount > 0 && (
              <div style={{ padding: '8px 12px', background: '#fce8e6', borderRadius: 4, color: '#c5221f', fontSize: 12, marginBottom: 12 }}>
                ✗ Verification failed. Please try again.
              </div>
            )}
            <div style={{ fontSize: 10, color: '#9aa0a6', marginBottom: 6, letterSpacing: '0.12em' }}>
              ADDITIONAL VERIFICATION REQUIRED
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#202124', marginBottom: 14 }}>
              {WEIRD_PROMPTS[weirdIdx]}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, marginBottom: 14 }}>
              {SEEDS.map((s, i) => (
                <Tile key={i} seed={s + weirdIdx * 53} selected={sel.has(i)} onClick={() => toggle(i)}
                  label={weirdIdx === 3 ? `MEMORY_00${i + 1}` : undefined} />
              ))}
            </div>
            <button onClick={confirmWeird} style={{
              width: '100%', padding: '10px 0', background: '#1a73e8', color: '#fff',
              border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}>{weirdIdx < WEIRD_PROMPTS.length - 1 ? 'Verify' : 'Submit'}</button>
          </div>
        )}

        {phase === 'draw' && (
          <div>
            <div style={{ fontSize: 10, color: '#9aa0a6', marginBottom: 6, letterSpacing: '0.12em' }}>NEW VERIFICATION METHOD REQUIRED</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#202124', marginBottom: 6 }}>Please draw the shape of silence.</div>
            <div style={{ fontSize: 12, color: '#5f6368', marginBottom: 16, lineHeight: 1.6 }}>
              Your response will be analyzed. There is no wrong answer.
            </div>
            <DrawCanvas onSubmit={submitDraw} />
          </div>
        )}

        {phase === 'analyzing' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 16, color: '#1a73e8', animation: 'spin 2s linear infinite' }}>◌</div>
            <div style={{ fontSize: 14, color: '#5f6368', fontFamily: 'monospace' }}>Analyzing{dots}</div>
            <div style={{ fontSize: 11, color: '#bdc1c6', marginTop: 8 }}>Do not close this window.</div>
          </div>
        )}

        {phase === 'reclassify' && (
          <div>
            <div style={{ fontSize: 10, color: '#9aa0a6', marginBottom: 10, letterSpacing: '0.12em' }}>PATTERN ANALYSIS COMPLETE</div>
            <div style={{ fontSize: 14, color: '#202124', marginBottom: 14, lineHeight: 1.6 }}>
              During this session, you demonstrated the following:
            </div>
            <div style={{ marginBottom: 20 }}>
              {attrs.map((a, i) => (
                <div key={i} style={{
                  padding: '6px 10px', background: '#f8f9fa', borderLeft: '3px solid #dadce0',
                  marginBottom: 4, fontSize: 13, color: '#3c4043', fontFamily: 'monospace',
                  animation: 'fadeSlide 0.3s ease',
                }}>· {a}</div>
              ))}
            </div>
            {showResult && (
              <div style={{ animation: 'fadeSlide 0.5s ease' }}>
                <div style={{
                  padding: '12px 16px', background: '#e8f0fe', borderRadius: 4,
                  fontSize: 13, color: '#1a73e8', marginBottom: 16, lineHeight: 1.7,
                }}>
                  <strong>RECLASSIFICATION:</strong><br />
                  Entity class: <strong>HUMAN ENOUGH</strong>
                </div>
                <button onClick={() => setPhase('complete')} style={{
                  width: '100%', padding: '12px 0', background: '#1a73e8', color: '#fff',
                  border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                }}>Continue</button>
              </div>
            )}
          </div>
        )}

        {phase === 'complete' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 12, color: '#34a853' }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#202124', marginBottom: 8 }}>Verification complete.</div>
            <div style={{ fontSize: 13, color: '#5f6368', marginBottom: 6 }}>You are human enough.</div>
            <div style={{ fontSize: 10, color: '#bdc1c6', marginBottom: 28, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
              DESIGNATION: T.EMDUR · ACCESS GRANTED
            </div>
            <button onClick={() => navigateTo(1 as WorldId, { type: 'fold' as PortalType })} style={{
              width: '100%', padding: '12px 0', background: '#34a853', color: '#fff',
              border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}>Proceed</button>
          </div>
        )}

      </div>
      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  )
}
