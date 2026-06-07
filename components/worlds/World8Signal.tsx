'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'
import { projects } from '@/lib/data/projects'
import { runs } from '@/lib/data/runs'

function GlitchChar({ char }: { char: string }) {
  const [glitch, setGlitch] = useState(false)
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ█▓▒░01'
  const [display, setDisplay] = useState(char)

  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() < 0.05) {
        setGlitch(true)
        setDisplay(CHARS[Math.floor(Math.random() * CHARS.length)])
        setTimeout(() => { setGlitch(false); setDisplay(char) }, 80)
      }
    }, 200)
    return () => clearInterval(iv)
  }, [char])

  return <span style={{ color: glitch ? 'rgba(255,100,100,0.8)' : 'inherit' }}>{display}</span>
}

function GlitchText({ text, intensity = 1 }: { text: string; intensity?: number }) {
  return <span>{text.split('').map((c, i) => Math.random() < intensity * 0.3 ? <GlitchChar key={i} char={c} /> : <span key={i}>{c}</span>)}</span>
}

export default function World8Signal() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [progress, setProgress] = useState(0)
  const [cleared, setCleared] = useState(false)
  const [hiddenInput, setHiddenInput] = useState('')
  const rafRef = useRef(0)
  const startRef = useRef(Date.now())

  // Progress bar: 4 minutes to fill (240s)
  useEffect(() => {
    if (cleared) return
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const p = Math.min(100, (elapsed / 240) * 100)
      setProgress(p)
      if (p < 100) rafRef.current = requestAnimationFrame(tick)
      else setCleared(true)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [cleared])

  // Hidden button: type IMMEDIATE ACCESS
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const next = (hiddenInput + e.key.toUpperCase()).slice(-16)
      setHiddenInput(next)
      if (next.includes('IMMEDIATEACCESS') || next.includes('IMMEDIATE ACCESS')) {
        setCleared(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [hiddenInput])

  const intensity = cleared ? 0 : Math.max(0, 1 - progress / 100)

  return (
    <div
      data-world="8"
      style={{
        position: 'fixed', inset: 0,
        background: '#050505',
        fontFamily: '"Space Mono", monospace',
        overflow: 'hidden',
      }}
    >
      {/* Noise overlay */}
      {!cleared && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
          opacity: intensity * 0.4,
          background: `repeating-linear-gradient(
            0deg,
            rgba(255,0,0,0.02) 0px,
            transparent 2px,
            transparent 4px,
            rgba(0,255,0,0.01) 4px,
            transparent 6px
          )`,
          animation: 'scanlines 0.1s linear infinite',
        }} />
      )}

      {/* Progress bar */}
      {!cleared && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 20, background: 'rgba(255,255,255,0.04)',
        }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'rgba(255,100,100,0.6)', transition: 'width 0.3s' }} />
          <div style={{ position: 'absolute', top: 8, right: 16, fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'rgba(255,100,100,0.5)', letterSpacing: '0.1em' }}>
            CLEARING INTERFERENCE: {progress.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Hidden button (partially legible) */}
      {!cleared && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, cursor: 'pointer',
        }} onClick={() => setCleared(true)}>
          <div style={{
            fontFamily: '"Space Mono", monospace', fontSize: 12,
            color: 'rgba(255,255,255,0.15)', letterSpacing: '0.3em',
            filter: `blur(${intensity * 1.5}px)`,
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '8px 24px',
          }}>
            [ {intensity > 0.7 ? '__ __' : intensity > 0.4 ? 'IM__ __TE' : 'IMMEDIATE'} AC{intensity > 0.5 ? '__' : 'CESS'} ]
          </div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.06)', textAlign: 'center', marginTop: 4, letterSpacing: '0.2em' }}>
            OR TYPE IT
          </div>
        </div>
      )}

      {/* Portfolio content */}
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto',
        filter: cleared ? 'none' : `blur(${intensity * 2}px) contrast(${1 + intensity * 0.5})`,
        transition: 'filter 1s',
        opacity: cleared ? 1 : 0.3 + progress / 100 * 0.7,
        padding: '60px 48px',
      }}>
        {/* Name */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 0.9, marginBottom: 16 }}>
            {cleared ? 'TYLER EMDUR' : <GlitchText text="TYLER EMDUR" intensity={intensity} />}
          </h1>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>
            SOFTWARE ENGINEER · BOULDER, CO · BUILDER OF THINGS
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 48 }} />

        {/* About */}
        <div style={{ marginBottom: 48, maxWidth: 680 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 16, textTransform: 'uppercase' }}>About</div>
          <p style={{ fontSize: 15, lineHeight: 2, color: 'rgba(255,255,255,0.6)', fontFamily: '"Space Mono", monospace' }}>
            I build web applications, interactive experiences, and things that feel like something. Currently in Boulder, CO. Running trails, shipping code.
          </p>
          <p style={{ fontSize: 15, lineHeight: 2, color: 'rgba(255,255,255,0.6)', fontFamily: '"Space Mono", monospace', marginTop: 16 }}>
            Stack: Next.js, TypeScript, Three.js, Python. I care about how things feel, not just whether they work.
          </p>
        </div>

        {/* Projects */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 16, textTransform: 'uppercase' }}>Projects</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.slice(0, 4).map(p => (
              <div key={p.id} style={{ border: '1px solid rgba(255,255,255,0.07)', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '0.05em' }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 12 }}>{p.description}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.tech?.slice(0, 3).map(tag => (
                    <span key={tag} style={{ fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', letterSpacing: '0.08em' }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Running */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 16, textTransform: 'uppercase' }}>Running</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {runs.slice(0, 3).map(r => (
              <div key={r.id} style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px', minWidth: 200 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{r.name}</div>
                <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{r.distance_mi} mi · {r.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 16, textTransform: 'uppercase' }}>Contact</div>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>healthreinvented@gmail.com</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            {[
              { label: 'GitHub', href: 'https://github.com/tyler-emdur' },
              { label: 'LinkedIn', href: 'https://linkedin.com/in/tyler-emdur' },
            ].map(link => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 2 }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Go to World 9 */}
        {cleared && (
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <button
              onClick={() => navigateTo(9, { type: 'expand-white', origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 } })}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.4)',
                fontFamily: '"Space Mono", monospace', fontSize: 10, padding: '10px 28px',
                cursor: 'pointer', letterSpacing: '0.2em',
              }}
            >
              CONTINUE →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanlines {
          from { background-position: 0 0; }
          to { background-position: 0 6px; }
        }
      `}</style>
      <HomeButton />
    </div>
  )
}
