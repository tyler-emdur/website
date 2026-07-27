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
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#00000d', opacity: leaving ? 0 : 1, transition: 'opacity 320ms ease',
    }}>
      <button
        onClick={enter}
        style={{
          position: 'fixed', top: 22, right: 26, background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        skip →
      </button>

      <div style={{
        width: 380, maxWidth: 'calc(100vw - 48px)', padding: '40px 36px',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4,
        background: 'rgba(255,255,255,0.015)',
      }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>
          Tyler Emdur
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}>
          Builder · Boulder, CO
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.38)' }}>
          Faraday Construction · Scoutout AI · headed toward VC
        </div>

        <div style={{ display: 'flex', gap: 18, marginTop: 22, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <a href="https://github.com/tyler-emdur" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            github
          </a>
          <a href="mailto:healthreinvented@gmail.com"
            style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            email
          </a>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '26px 0 22px' }} />

        <button
          onClick={enter}
          style={{
            width: '100%', padding: '11px 0', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: 3, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          enter the multiverse →
        </button>
      </div>
    </div>
  )
}
