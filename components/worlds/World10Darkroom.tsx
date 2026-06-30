'use client'
import { useState, useRef, useEffect } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'
import { memories } from '@/lib/data/memories'
import type { Memory } from '@/lib/types'

// ── Procedural memory art — each memory gets a unique seeded image ─────────────

function seedHash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973
  return h
}

function MemoryArt({ memory }: { memory: Memory }) {
  const seed = seedHash(memory.id)
  const hue = (seed * 137.5) % 360
  const caption = memory.title.length > 22 ? memory.title.slice(0, 20) + '…' : memory.title

  if (memory.type === 'photo') {
    return (
      <svg viewBox="0 0 100 70" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id={`g-${memory.id}`} cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor={`hsl(${hue},35%,20%)`} />
            <stop offset="100%" stopColor={`hsl(${hue + 25},25%,5%)`} />
          </radialGradient>
        </defs>
        <rect width="100" height="70" fill={`url(#g-${memory.id})`} />
        <polygon points={`${20 + (seed % 20)},52 ${5 + (seed % 10)},22 ${40 + (seed % 15)},52`} fill="#111" opacity="0.7" />
        <polygon points={`${55 + (seed % 15)},52 ${70 - (seed % 10)},14 ${95 - (seed % 8)},52`} fill="#0c0c0c" opacity="0.7" />
        {Array.from({ length: 16 }).map((_, i) => (
          <circle key={i} cx={(i * 41 + seed) % 100} cy={(i * 17 + seed) % 26} r="0.6" fill="#fff" opacity={0.25 + (i % 3) * 0.15} />
        ))}
        <rect x="0" y="56" width="100" height="14" fill="#0a0a0a" />
        <text x="50" y="65" textAnchor="middle" fontSize="5" fill="#666" fontFamily="monospace">{caption}</text>
      </svg>
    )
  }

  if (memory.type === 'object') {
    return (
      <svg viewBox="0 0 100 70" style={{ width: '100%', height: '100%' }}>
        <rect width="100" height="70" fill="#0d0d0d" />
        <rect x="28" y="14" width="44" height="34" rx="2" fill={`hsl(${hue},30%,14%)`} stroke={`hsl(${hue},40%,30%)`} strokeWidth="1" />
        <text x="50" y="34" textAnchor="middle" fontSize="6" fill={`hsl(${hue},50%,70%)`} fontFamily="monospace">#{seed.toString().slice(0, 4)}</text>
        <text x="50" y="42" textAnchor="middle" fontSize="3.4" fill="#888" fontFamily="monospace">artifact · {memory.year}</text>
        <rect x="0" y="56" width="100" height="14" fill="#0a0a0a" />
        <text x="50" y="65" textAnchor="middle" fontSize="5" fill="#666" fontFamily="monospace">{caption}</text>
      </svg>
    )
  }

  // 'note'
  return (
    <svg viewBox="0 0 100 70" style={{ width: '100%', height: '100%' }}>
      <rect width="100" height="70" fill="#111" />
      <rect x="14" y="6" width="72" height="46" fill={`hsl(${hue},20%,92%)`} opacity="0.92" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x="20" y={14 + i * 6.4} width={70 - ((seed + i * 13) % 30)} height="1.6" fill="#444" opacity="0.5" />
      ))}
      <rect x="0" y="56" width="100" height="14" fill="#0a0a0a" />
      <text x="50" y="65" textAnchor="middle" fontSize="5" fill="#666" fontFamily="monospace">{caption}</text>
    </svg>
  )
}

type Stage = 'idle' | 'developing' | 'stopping' | 'fixing' | 'ready'
type Quality = 'pale' | 'perfect' | 'dark'

// ── Component ─────────────────────────────────────────────────────────────────

export default function World10Darkroom() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [hung, setHung] = useState<number[]>([])
  const [stage, setStage] = useState<Stage>('idle')
  const [devMs, setDevMs] = useState(0)        // ms spent in developer
  const [quality, setQuality] = useState<Quality | null>(null)
  const [doorVisible, setDoorVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const allDone = photoIdx >= memories.length
  const canHang = stage === 'ready'

  useEffect(() => {
    if (hung.length >= 3) setTimeout(() => setDoorVisible(true), 1200)
  }, [hung.length])

  function startDev() {
    if (stage !== 'idle') return
    setStage('developing')
    setDevMs(0)
    setQuality(null)
    const start = Date.now()
    timerRef.current = setInterval(() => setDevMs(Date.now() - start), 80)
  }

  function pull() {
    if (stage !== 'developing') return
    clearInterval(timerRef.current!)
    const ms = devMs
    const q: Quality = ms < 2500 ? 'pale' : ms > 9000 ? 'dark' : 'perfect'
    setQuality(q)
    setStage('stopping')
    setTimeout(() => {
      setStage('fixing')
      setTimeout(() => setStage('ready'), 2000)
    }, 1800)
  }

  function hang() {
    if (!canHang || quality === null) return
    if (!hung.includes(photoIdx)) setHung(h => [...h, photoIdx])
    setPhotoIdx(i => i + 1)
    setStage('idle')
    setDevMs(0)
    setQuality(null)
  }

  // Dev progress 0-1 clamped
  const devProgress = Math.min(devMs / 12000, 1)

  // Image style based on stage/progress
  function imageStyle(): React.CSSProperties {
    if (stage === 'idle') return { opacity: 0 }
    if (stage === 'developing') {
      const p = Math.min(devMs / 8000, 1)
      return {
        filter: `brightness(${2.8 - p * 2.3}) contrast(${0.1 + p * 0.9}) sepia(0.4)`,
        opacity: 0.05 + p * 0.95,
      }
    }
    if (quality === 'pale') return { filter: 'brightness(3) contrast(0.15) sepia(0.3)', opacity: 0.4 }
    if (quality === 'dark') return { filter: 'brightness(0.08) contrast(2)', opacity: 1 }
    return { filter: 'brightness(1) contrast(1) sepia(0.18)', opacity: 1 }
  }

  function statusLine() {
    if (stage === 'idle') return allDone ? 'all frames developed' : 'place sheet in developer'
    if (stage === 'developing') {
      if (devMs < 2000) return 'developing — image emerging'
      if (devMs < 5000) return 'developing — looking good'
      if (devMs < 9000) return 'developing — pull soon'
      return 'overdeveloping — pull now'
    }
    if (stage === 'stopping') return 'stop bath — neutralizing'
    if (stage === 'fixing') return 'fixer — stabilizing'
    if (quality === 'pale') return 'underdeveloped — pulled too early'
    if (quality === 'dark') return 'overdeveloped — burned'
    return 'perfect — hang it up'
  }

  const currentMemory = memories[photoIdx] ?? null

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#060002',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Space Mono", monospace',
      overflow: 'hidden', position: 'relative',
      userSelect: 'none',
    }}>

      {/* Red safelight — wider, more atmospheric */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 600, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(160,8,8,0.12) 0%, rgba(120,4,4,0.05) 40%, transparent 70%)',
        pointerEvents: 'none',
      }}/>
      {/* Safelight fixture */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 90, height: 12, borderRadius: 3,
        background: 'rgba(210,30,30,0.9)',
        boxShadow: '0 0 30px rgba(200,25,25,0.7), 0 0 80px rgba(200,10,10,0.3), 0 0 160px rgba(180,0,0,0.12)',
      }}/>
      {/* Floor vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(0,0,0,0.6) 100%)',
      }}/>

      {/* Clothesline */}
      <div style={{
        position: 'absolute', top: 50, left: '5%', right: '5%',
        height: 120,
      }}>
        <div style={{ position: 'absolute', top: 6, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.12)' }}/>
        <div style={{ display: 'flex', gap: 24, paddingTop: 0 }}>
          {hung.map(idx => {
            const memory = memories[idx]
            return (
              <div key={idx} style={{ flexShrink: 0, textAlign: 'center' }}>
                <div style={{ width: 2, height: 12, background: 'rgba(180,160,130,0.5)', margin: '0 auto 0' }}/>
                <div style={{
                  width: 72, height: 52,
                  border: '5px solid #ddd8c8',
                  borderBottom: '18px solid #ddd8c8',
                  background: '#111',
                  overflow: 'hidden',
                  boxShadow: '2px 3px 10px rgba(0,0,0,0.6)',
                }}>
                  <MemoryArt memory={memory} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lab label */}
      <div style={{ color: 'rgba(180,30,30,0.55)', fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, letterSpacing: '0.12em', marginBottom: 18, lineHeight: 1 }}>
        DARKROOM
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(160,30,30,0.35)', marginLeft: 14, verticalAlign: 'middle' }}>
          {Math.max(0, memories.length - photoIdx)} frames remaining
        </span>
      </div>

      {/* Development tray */}
      <div style={{
        width: 220, height: 160,
        background: 'rgba(160,20,20,0.04)',
        border: '1px solid rgba(160,20,20,0.18)',
        borderRadius: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Chemical tint */}
        {stage !== 'idle' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: stage === 'developing' ? 'rgba(60,30,0,0.5)'
              : stage === 'stopping' ? 'rgba(0,50,60,0.3)'
              : 'rgba(30,50,30,0.3)',
            transition: 'background 1s ease',
          }}/>
        )}

        {/* Tray label */}
        <div style={{
          position: 'absolute', bottom: 6, right: 10,
          color: 'rgba(160,30,30,0.35)', fontSize: 8, letterSpacing: '0.12em',
        }}>
          {stage === 'developing' ? 'DEVELOPER' : stage === 'stopping' ? 'STOP BATH' : stage === 'fixing' ? 'FIXER' : 'TRAY'}
        </div>

        {/* Photo paper */}
        {stage !== 'idle' && currentMemory && (
          <div style={{
            width: 150, height: 108,
            border: '5px solid #e4ddd0',
            borderBottom: '20px solid #e4ddd0',
            background: '#111',
            overflow: 'hidden', zIndex: 1,
            transition: 'filter 1s ease, opacity 1s ease',
            ...imageStyle(),
          }}>
            <MemoryArt memory={currentMemory} />
          </div>
        )}

        {stage === 'idle' && !allDone && (
          <div style={{ color: 'rgba(160,30,30,0.25)', fontSize: 11, letterSpacing: '0.12em' }}>empty</div>
        )}
        {stage === 'idle' && allDone && (
          <div style={{ color: 'rgba(160,30,30,0.25)', fontSize: 11, letterSpacing: '0.12em' }}>done</div>
        )}
      </div>

      {/* Progress bar — only in developer */}
      <div style={{ width: 220, height: 3, background: 'rgba(160,20,20,0.12)', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
        {stage === 'developing' && (
          <div style={{
            height: '100%',
            width: `${devProgress * 100}%`,
            background: devMs < 2500 ? 'rgba(160,60,60,0.5)'
              : devMs < 9000 ? 'rgba(180,40,40,0.85)'
              : 'rgba(80,10,10,0.9)',
            transition: 'width 0.08s linear, background 0.5s ease',
          }}/>
        )}
      </div>

      {/* Sweet spot label */}
      {stage === 'developing' && (
        <div style={{ color: 'rgba(160,30,30,0.4)', fontSize: 8, letterSpacing: '0.15em', marginTop: 4 }}>
          sweet spot: 2.5–9 seconds
        </div>
      )}

      {/* Status */}
      <div style={{ color: 'rgba(160,50,50,0.65)', fontSize: 10, letterSpacing: '0.12em', height: 18, textAlign: 'center', marginTop: 6 }}>
        {statusLine()}
      </div>

      {/* Real memory text — only once it's developed */}
      {stage === 'ready' && quality === 'perfect' && currentMemory && (
        <div style={{
          maxWidth: 320, textAlign: 'center', marginTop: 8, padding: '0 10px',
          color: 'rgba(220,190,170,0.75)', fontSize: 10, lineHeight: 1.6, fontStyle: 'italic',
        }}>
          &ldquo;{currentMemory.content}&rdquo;
          <div style={{ color: 'rgba(160,30,30,0.5)', fontSize: 8, marginTop: 4, fontStyle: 'normal', letterSpacing: '0.1em' }}>
            {currentMemory.title} &middot; {currentMemory.year}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        {stage === 'idle' && !allDone && (
          <Btn onClick={startDev} active>develop</Btn>
        )}
        {stage === 'developing' && (
          <Btn onClick={pull} active={devMs >= 2500}>pull</Btn>
        )}
        {stage === 'ready' && (
          <Btn onClick={hang} active>hang</Btn>
        )}
      </div>

      {/* Exit door — unlocks after 3 hung */}
      {doorVisible && (
        <div
          onClick={() => navigateTo(1, { type: 'fold' })}
          style={{
            position: 'absolute', right: 48, bottom: 72,
            width: 52, height: 90,
            border: '1px solid rgba(160,30,30,0.3)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 1.5s ease',
          }}
        >
          <span style={{ color: 'rgba(160,30,30,0.4)', fontSize: 8, letterSpacing: '0.15em', writingMode: 'vertical-rl' }}>EXIT</span>
        </div>
      )}

      <HomeButton />

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes dr-grain-move {
          0%  { transform: translate(0,0) }  14% { transform: translate(-3%,-4%) }
          28% { transform: translate(4%,2%) } 43% { transform: translate(-2%,4%) }
          57% { transform: translate(3%,-3%) }71% { transform: translate(-4%,1%) }
          85% { transform: translate(2%,-2%) }
        }
        .dr-grain {
          position: fixed; inset: 0; z-index: 90; pointer-events: none;
          opacity: 0.09;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 300px;
          animation: dr-grain-move 0.11s steps(1) infinite;
          mix-blend-mode: overlay;
        }
      `}</style>
      <div className="dr-grain" />
    </div>
  )
}

function Btn({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '8px 22px',
        background: hov && active ? 'rgba(160,20,20,0.2)' : 'transparent',
        border: `1px solid rgba(160,20,20,${active ? '0.6' : '0.2'})`,
        color: `rgba(180,50,50,${active ? '0.85' : '0.35'})`,
        fontFamily: '"Space Mono", monospace',
        fontSize: 10, letterSpacing: '0.2em',
        cursor: active ? 'pointer' : 'default',
        textTransform: 'uppercase',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}
