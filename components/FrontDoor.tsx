'use client'
import { useState } from 'react'

// The five-second version, for whoever gets here cold. Everything after
// this is the multiverse, exactly as it already exists — this screen adds
// a beat in front of it, it doesn't replace anything.
export default function FrontDoor({ onEnter }: { onEnter: () => void }) {
  const [leaving, setLeaving] = useState(false)

  const enter = () => {
    setLeaving(true)
    setTimeout(onEnter, 320)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#000000', opacity: leaving ? 0 : 1, transition: 'opacity 320ms ease',
    }}>
      <button
        onClick={enter}
        style={{
          position: 'fixed', top: 28, right: 32, background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.25)',
        }}
      >
        skip
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em',
          color: 'rgba(255,255,255,0.95)',
        }}>
          Tyler Emdur
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 12, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
        }}>
          Boulder, Colorado
        </div>

        <div style={{ display: 'flex', gap: 28, marginTop: 36, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          <a href="https://github.com/tyler-emdur" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            GitHub
          </a>
          <a href="mailto:healthreinvented@gmail.com"
            style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            Email
          </a>
        </div>

        <button
          onClick={enter}
          style={{
            marginTop: 56, padding: '14px 32px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.85)', transition: 'border-color 200ms ease, background 200ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent' }}
        >
          enter →
        </button>
      </div>
    </div>
  )
}
