'use client'
import { useEffect, useState } from 'react'
import { useWorldStore } from '@/lib/world-store'

export default function World0Surface() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [blink, setBlink] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120)
    const iv = setInterval(() => setBlink(b => !b), 530)
    return () => { clearTimeout(t); clearInterval(iv) }
  }, [])

  const enter = () => navigateTo(1, { type: 'door' })

  return (
    <div
      onClick={enter}
      style={{
        position: 'fixed', inset: 0,
        background: '#000000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        fontFamily: '"Courier New", Courier, monospace',
      }}
    >
      <style>{`
        @keyframes scanline {
          0% { background-position: 0 0 }
          100% { background-position: 0 4px }
        }
        @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 94%{opacity:0.85} 96%{opacity:1} 98%{opacity:0.9} }
        .w0-screen { animation: flicker 5s ease-in-out infinite }
      `}</style>

      {/* Scanlines overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 4px)',
        backgroundSize: '100% 4px',
      }} />

      {/* CRT vignette */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9,
        background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 100%)',
      }} />

      <div
        className="w0-screen"
        style={{
          color: '#33ff33',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease',
          textAlign: 'center',
          lineHeight: 1,
          position: 'relative', zIndex: 5,
          userSelect: 'none',
        }}
      >
        {/* Top rule */}
        <div style={{ fontSize: 12, letterSpacing: '0.15em', marginBottom: 28, opacity: 0.5 }}>
          {'─'.repeat(38)}
        </div>

        {/* Name */}
        <div style={{ fontSize: 'clamp(1.4rem,4vw,2.4rem)', letterSpacing: '0.35em', fontWeight: 'bold', marginBottom: 6, color: '#66ff66' }}>
          TYLER EMDUR
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#22bb22', marginBottom: 28, opacity: 0.8 }}>
          SOFTWARE ENGINEER · BOULDER CO · 2026
        </div>

        {/* Rule */}
        <div style={{ fontSize: 12, letterSpacing: '0.15em', marginBottom: 28, opacity: 0.3 }}>
          {'─'.repeat(38)}
        </div>

        {/* Brief description */}
        <div style={{ fontSize: 13, letterSpacing: '0.08em', lineHeight: 2.2, color: '#44dd44', marginBottom: 8 }}>
          A MULTIVERSE OF 17 WEBSITES.
        </div>
        <div style={{ fontSize: 13, letterSpacing: '0.08em', lineHeight: 2.2, color: '#44dd44', marginBottom: 8 }}>
          EACH ONE A DIFFERENT PLACE.
        </div>
        <div style={{ fontSize: 13, letterSpacing: '0.08em', lineHeight: 2.2, color: '#44dd44', marginBottom: 28 }}>
          WORK IN PROGRESS. ART + CODE.
        </div>

        {/* Rule */}
        <div style={{ fontSize: 12, letterSpacing: '0.15em', marginBottom: 32, opacity: 0.3 }}>
          {'─'.repeat(38)}
        </div>

        {/* ENTER button — very obvious */}
        <div
          onClick={enter}
          style={{
            display: 'inline-block',
            padding: '14px 48px',
            border: '2px solid #33ff33',
            fontSize: 18, letterSpacing: '0.4em',
            color: '#000000',
            background: '#33ff33',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: 20,
            boxShadow: '0 0 20px rgba(51,255,51,0.5), 0 0 40px rgba(51,255,51,0.2)',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 30px rgba(51,255,51,0.9), 0 0 60px rgba(51,255,51,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(51,255,51,0.5), 0 0 40px rgba(51,255,51,0.2)')}
        >
          ENTER GALAXY
        </div>

        {/* Blinking cursor hint */}
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#22aa22', marginTop: 4, height: 18 }}>
          {blink ? '[ CLICK ANYWHERE TO ENTER ]' : ''}
        </div>

        {/* Bottom rule + contact */}
        <div style={{ marginTop: 28, fontSize: 12, letterSpacing: '0.15em', opacity: 0.3 }}>
          {'─'.repeat(38)}
        </div>
        <div style={{ marginTop: 12, fontSize: 9, letterSpacing: '0.18em', color: '#1a8a1a', opacity: 0.7 }}>
          HEALTHREINVENTED@GMAIL.COM
        </div>
      </div>
    </div>
  )
}
