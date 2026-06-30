'use client'
import { useState, useRef, useEffect } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── Atmospheric particles (Igloo aesthetic) ─────────────────────────────────
function AtmosphereParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = window.innerWidth, H = window.innerHeight
    canvas.width = W; canvas.height = H

    interface Mote { x: number; y: number; vy: number; vx: number; r: number; opacity: number; phase: number }
    const motes: Mote[] = Array.from({ length: 38 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vy: -(0.08 + Math.random() * 0.14),
      vx: (Math.random() - 0.5) * 0.05,
      r:  0.5 + Math.random() * 1.1,
      opacity: 0.06 + Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2,
    }))

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener('resize', resize)

    let t = 0
    function draw() {
      ctx.clearRect(0, 0, W, H)
      t += 0.008
      motes.forEach(m => {
        m.y += m.vy
        m.x += m.vx + Math.sin(t + m.phase) * 0.03
        if (m.y < -5) { m.y = H + 5; m.x = Math.random() * W }
        const alpha = m.opacity * (0.5 + 0.5 * Math.sin(t * 1.1 + m.phase))
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(140,170,220,${alpha})`
        ctx.fill()
      })
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}

// ── Abstract image tile (muted, atmospheric) ────────────────────────────────
function Tile({ seed, selected, onClick, label }: {
  seed: number; selected: boolean; onClick: () => void; label?: string
}) {
  const h1 = ((seed * 73) % 60) + 200 // cool hues only
  const h2 = ((seed * 31 + 60) % 60) + 220
  const cx = 15 + (seed * 43) % 70
  const cy = 15 + (seed * 61) % 70
  return (
    <button
      onClick={onClick}
      style={{
        aspectRatio: '1', padding: 0, outline: 'none',
        border: selected ? '1px solid rgba(140,170,220,0.7)' : '1px solid rgba(140,170,220,0.15)',
        background: `radial-gradient(circle at ${cx}% ${cy}%, hsl(${h1},22%,22%), hsl(${h2},14%,10%))`,
        position: 'relative', overflow: 'hidden',
        borderRadius: 2,
        transition: 'border-color 0.4s, transform 0.4s',
        transform: selected ? 'scale(0.95)' : 'scale(1)',
        boxShadow: selected ? '0 0 12px rgba(140,170,220,0.15)' : 'none',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(140,170,220,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(200,220,255,0.7)', fontSize: 14,
        }}>✓</div>
      )}
      {label && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 4px',
          background: 'rgba(0,0,0,0.5)', color: 'rgba(140,170,220,0.4)',
          fontSize: 6, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.06em',
        }}>{label}</div>
      )}
    </button>
  )
}

// ── Drawing canvas ──────────────────────────────────────────────────────────
function DrawCanvas({ onSubmit }: { onSubmit: () => void }) {
  const ref      = useRef<HTMLCanvasElement>(null)
  const drawing  = useRef(false)
  const hasDrawn = useRef(false)

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = 'rgba(8,12,22,1)'; ctx.fillRect(0, 0, c.width, c.height)
    ctx.strokeStyle = 'rgba(140,170,220,0.7)'; ctx.lineWidth = 1.5
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <canvas
        ref={ref} width={320} height={180}
        style={{
          border: '1px solid rgba(140,170,220,0.18)', borderRadius: 2,
          maxWidth: '100%', touchAction: 'none', display: 'block',
        }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      />
      <button
        onClick={() => hasDrawn.current && onSubmit()}
        style={{
          padding: '9px 28px',
          background: 'rgba(140,170,220,0.1)',
          color: 'rgba(200,220,255,0.7)',
          border: '1px solid rgba(140,170,220,0.25)',
          borderRadius: 2, fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
        }}
      >Submit</button>
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
  { text: 'Hesitation (2.8 seconds)',              ms: 600  },
  { text: 'Backtracking on second tile',           ms: 1200 },
  { text: 'Strategy attempt detected',             ms: 1900 },
  { text: 'Uncertainty about what "correct" means',ms: 2700 },
  { text: 'Wondering if this is a trick',          ms: 3500 },
  { text: 'Continuing anyway',                     ms: 4200 },
]

const SEEDS = [17, 42, 8, 61, 33, 79, 25, 54, 11]

export default function World9Contact() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [phase,      setPhase]      = useState<Phase>('intro')
  const [sel,        setSel]        = useState<Set<number>>(new Set())
  const [weirdIdx,   setWeirdIdx]   = useState(0)
  const [failCount,  setFailCount]  = useState(0)
  const [attrs,      setAttrs]      = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [dots,       setDots]       = useState('')
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const timersRef    = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    timersRef.current.forEach(clearTimeout)
  }, [])

  const toggle = (i: number) => setSel(prev => {
    const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n
  })

  const confirmNormal = () => { setSel(new Set()); setPhase(phase === 'normal1' ? 'normal2' : 'weird') }
  const confirmWeird  = () => {
    setSel(new Set()); setFailCount(c => c + 1)
    if (weirdIdx < WEIRD_PROMPTS.length - 1) setWeirdIdx(i => i + 1)
    else setPhase('draw')
  }

  const submitDraw = () => {
    setPhase('analyzing')
    let i = 0
    intervalRef.current = setInterval(() => {
      setDots('.'.repeat(++i % 4))
      if (i >= 9) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPhase('reclassify')
        ATTRIBUTES.forEach(({ text, ms }) => {
          timersRef.current.push(setTimeout(() => setAttrs(prev => [...prev, text]), ms))
        })
        timersRef.current.push(setTimeout(() => setShowResult(true), 5000))
      }
    }, 380)
  }

  // ── Shared card style (dark atmospheric glass) ──────────────────────────
  const card: React.CSSProperties = {
    background: 'rgba(6,10,20,0.85)',
    border: '1px solid rgba(140,170,220,0.14)',
    borderRadius: 4,
    padding: '36px 32px',
    width: 'min(400px, 88vw)',
    maxHeight: '88vh',
    overflowY: 'auto',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 24px 80px rgba(0,0,8,0.7), 0 0 0 1px rgba(0,0,0,0.4)',
  }

  const label: React.CSSProperties = {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 9, letterSpacing: '0.26em',
    color: 'rgba(140,170,220,0.45)',
    textTransform: 'uppercase',
    marginBottom: 10,
  }

  const heading: React.CSSProperties = {
    fontFamily: '"Oxanium", sans-serif',
    fontSize: 17, fontWeight: 400,
    color: 'rgba(200,220,255,0.82)',
    lineHeight: 1.45, marginBottom: 18,
  }

  const sub: React.CSSProperties = {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 11, color: 'rgba(140,170,220,0.45)',
    lineHeight: 1.85, marginBottom: 24,
  }

  const btn: React.CSSProperties = {
    width: '100%', padding: '12px 0',
    background: 'rgba(140,170,220,0.08)',
    color: 'rgba(200,220,255,0.7)',
    border: '1px solid rgba(140,170,220,0.22)',
    borderRadius: 2,
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 10, letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'background 0.5s, border-color 0.5s',
  }

  const btnActive: React.CSSProperties = {
    ...btn,
    background: 'rgba(140,170,220,0.15)',
    borderColor: 'rgba(140,170,220,0.4)',
    color: 'rgba(220,235,255,0.9)',
  }

  return (
    <>
      <style>{`
        @keyframes w9-fadein  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes w9-spin    { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @keyframes w9-pulse   { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        .w9-attr { animation: w9-fadein 0.7s ease both; }
        .w9-card { animation: w9-fadein 0.9s ease both; }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse 120% 100% at 50% 80%, #060c1a 0%, #020508 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <AtmosphereParticles />

        {/* Soft center light source — like a lamp in a dark room */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(140,170,220,0.04) 0%, transparent 70%)',
        }} />

        <HomeButton />

        <div style={card} className="w9-card">

          {phase === 'intro' && (
            <div style={{ textAlign: 'center' }}>
              <div style={label}>CAPTCHA v4.1.2</div>
              <div style={heading}>Verify you are human.</div>
              <div style={sub}>
                This system uses advanced behavioral analysis<br />
                to confirm whether you qualify as a person.
              </div>
              <div style={{ ...label, marginBottom: 28, opacity: 0.5 }}>
                Protected by SOME AUTHORITY · Privacy · Terms
              </div>
              <button onClick={() => setPhase('normal1')} style={btnActive}>
                Begin Verification
              </button>
            </div>
          )}

          {(phase === 'normal1' || phase === 'normal2') && (
            <div>
              <div style={label}>Step {phase === 'normal1' ? '1' : '2'} of 2</div>
              <div style={heading}>
                {phase === 'normal1'
                  ? 'Select all images containing a traffic light.'
                  : 'Select all images containing a crosswalk.'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3, marginBottom: 18 }}>
                {SEEDS.map((s, i) => (
                  <Tile key={i} seed={s + (phase === 'normal2' ? 100 : 0)} selected={sel.has(i)} onClick={() => toggle(i)} />
                ))}
              </div>
              <button onClick={confirmNormal} disabled={sel.size === 0} style={sel.size > 0 ? btnActive : btn}>
                {sel.size === 0 ? 'Skip' : 'Verify'}
              </button>
            </div>
          )}

          {phase === 'weird' && (
            <div>
              {failCount > 0 && (
                <div style={{
                  padding: '8px 12px', marginBottom: 14,
                  background: 'rgba(200,60,60,0.08)',
                  border: '1px solid rgba(200,60,60,0.2)',
                  borderRadius: 2,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10, color: 'rgba(220,100,100,0.7)', letterSpacing: '0.1em',
                }}>
                  ✗ Verification failed. Please try again.
                </div>
              )}
              <div style={label}>Additional Verification Required</div>
              <div style={heading}>{WEIRD_PROMPTS[weirdIdx]}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3, marginBottom: 18 }}>
                {SEEDS.map((s, i) => (
                  <Tile key={i} seed={s + weirdIdx * 53} selected={sel.has(i)} onClick={() => toggle(i)}
                    label={weirdIdx === 3 ? `MEMORY_00${i + 1}` : undefined} />
                ))}
              </div>
              <button onClick={confirmWeird} style={btnActive}>
                {weirdIdx < WEIRD_PROMPTS.length - 1 ? 'Verify' : 'Submit'}
              </button>
            </div>
          )}

          {phase === 'draw' && (
            <div>
              <div style={label}>New Verification Method Required</div>
              <div style={heading}>Please draw the shape of silence.</div>
              <div style={sub}>Your response will be analyzed. There is no wrong answer.</div>
              <DrawCanvas onSubmit={submitDraw} />
            </div>
          )}

          {phase === 'analyzing' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                width: 28, height: 28, margin: '0 auto 20px',
                border: '1px solid rgba(140,170,220,0.4)',
                borderTopColor: 'rgba(140,170,220,0.9)',
                borderRadius: '50%',
                animation: 'w9-spin 1.4s linear infinite',
              }} />
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10, letterSpacing: '0.24em',
                color: 'rgba(140,170,220,0.55)',
                textTransform: 'uppercase',
              }}>Analyzing{dots}</div>
              <div style={{ ...sub, marginBottom: 0, marginTop: 10 }}>Do not close this window.</div>
            </div>
          )}

          {phase === 'reclassify' && (
            <div>
              <div style={label}>Pattern Analysis Complete</div>
              <div style={sub} >During this session, you demonstrated the following:</div>
              <div style={{ marginBottom: 24 }}>
                {attrs.map((a, i) => (
                  <div key={i} className="w9-attr" style={{
                    padding: '8px 12px',
                    borderLeft: '1px solid rgba(140,170,220,0.25)',
                    marginBottom: 6,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10, letterSpacing: '0.06em',
                    color: 'rgba(140,170,220,0.65)',
                    animationDelay: `${i * 0.1}s`,
                  }}>· {a}</div>
                ))}
              </div>
              {showResult && (
                <div style={{ animation: 'w9-fadein 0.9s ease' }}>
                  <div style={{
                    padding: '14px 16px', marginBottom: 20,
                    background: 'rgba(140,170,220,0.06)',
                    border: '1px solid rgba(140,170,220,0.18)',
                    borderRadius: 2,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10, letterSpacing: '0.08em',
                    color: 'rgba(140,170,220,0.65)',
                    lineHeight: 2,
                  }}>
                    RECLASSIFICATION:<br />
                    Entity class: <span style={{ color: 'rgba(200,220,255,0.85)', letterSpacing: '0.14em' }}>HUMAN ENOUGH</span>
                  </div>
                  <button onClick={() => setPhase('complete')} style={btnActive}>Continue</button>
                </div>
              )}
            </div>
          )}

          {phase === 'complete' && (
            <div>
              <div style={{ ...label, marginBottom: 6 }}>Verification Complete</div>

              {/* Slow-reveal contact block — the atmospheric Igloo payoff */}
              <div style={{
                marginBottom: 28, paddingTop: 8,
                animation: 'w9-fadein 1.4s 0.3s ease both',
              }}>
                <div style={{
                  fontFamily: '"Oxanium", sans-serif',
                  fontSize: 28, fontWeight: 300,
                  color: 'rgba(200,220,255,0.7)',
                  lineHeight: 1.15, letterSpacing: '-0.01em',
                  marginBottom: 24,
                }}>
                  Tyler Emdur.
                </div>

                {/* Email */}
                <a href="mailto:healthreinvented@gmail.com" style={{
                  display: 'block', textDecoration: 'none',
                  padding: '14px 16px', marginBottom: 8,
                  border: '1px solid rgba(140,170,220,0.1)',
                  borderRadius: 2,
                  background: 'rgba(140,170,220,0.04)',
                  transition: 'border-color 0.6s, background 0.6s',
                  animation: 'w9-fadein 1s 0.6s ease both',
                }}>
                  <div style={{ ...label, marginBottom: 4 }}>Email</div>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11, color: 'rgba(140,170,220,0.75)',
                    letterSpacing: '0.04em',
                  }}>
                    healthreinvented@gmail.com
                  </div>
                </a>

                {/* GitHub */}
                <a href="https://github.com/tyler-emdur" target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', textDecoration: 'none',
                  padding: '14px 16px', marginBottom: 8,
                  border: '1px solid rgba(140,170,220,0.1)',
                  borderRadius: 2,
                  background: 'rgba(140,170,220,0.04)',
                  transition: 'border-color 0.6s, background 0.6s',
                  animation: 'w9-fadein 1s 0.9s ease both',
                }}>
                  <div style={{ ...label, marginBottom: 4 }}>GitHub</div>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11, color: 'rgba(140,170,220,0.75)',
                    letterSpacing: '0.04em',
                  }}>
                    github.com/tyler-emdur
                  </div>
                </a>

                {/* Location */}
                <div style={{
                  padding: '14px 16px',
                  border: '1px solid rgba(140,170,220,0.1)',
                  borderRadius: 2,
                  background: 'rgba(140,170,220,0.04)',
                  animation: 'w9-fadein 1s 1.2s ease both',
                }}>
                  <div style={{ ...label, marginBottom: 4 }}>Location</div>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11, color: 'rgba(140,170,220,0.75)',
                    letterSpacing: '0.04em',
                  }}>
                    Boulder, CO · 40.0150°N 105.2705°W
                  </div>
                </div>
              </div>

              <div style={{ ...label, marginBottom: 0, opacity: 0.35, animation: 'w9-fadein 1s 1.8s ease both' }}>
                Designation: T.EMDUR · Access granted
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
