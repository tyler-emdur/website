'use client'
import { useState, useEffect } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

export default function World15Kitchen() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [visitorNum] = useState(() => Math.floor(Math.random() * 900) + 100)
  const [eyeOpen, setEyeOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEyeOpen(true), 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'fixed',
      inset: 0,
      overflowY: 'auto',
      background: '#0d0d0d',
      backgroundImage: [
        'repeating-linear-gradient(0deg, rgba(40,40,40,0.4) 0px, rgba(40,40,40,0.4) 1px, transparent 1px, transparent 30px)',
        'repeating-linear-gradient(90deg, rgba(40,40,40,0.4) 0px, rgba(40,40,40,0.4) 1px, transparent 1px, transparent 30px)',
      ].join(', '),
      backgroundSize: '30px 30px',
      color: '#cccccc',
      fontFamily: 'Times New Roman, Times, serif',
    }}>
      <style>{`
        @keyframes w15-drip {
          0% { transform: scaleY(0); transform-origin: top; opacity: 0 }
          20% { opacity: 1 }
          100% { transform: scaleY(1); transform-origin: top; opacity: 1 }
        }
        @keyframes w15-flicker { 0%,100%{opacity:1} 50%{opacity:0.7} 92%{opacity:0.9} 95%{opacity:0.5} 97%{opacity:1} }
        @keyframes w15-bat { 0%{transform:translateX(-30px) translateY(0)} 25%{transform:translateX(40px) translateY(-15px)} 50%{transform:translateX(80px) translateY(5px)} 75%{transform:translateX(120px) translateY(-10px)} 100%{transform:translateX(160px) translateY(0)} }
        @keyframes w15-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes w15-glow { 0%,100%{text-shadow:0 0 8px #cc0000,0 0 20px #880000} 50%{text-shadow:0 0 16px #ff0000,0 0 40px #cc0000,0 0 60px #660000} }
        @keyframes w15-eye { from{transform:scaleY(0)} to{transform:scaleY(1)} }
        .w15-drip { animation: w15-drip 1.2s ease forwards }
        .w15-flicker { animation: w15-flicker 3s ease-in-out infinite }
        .w15-bat { animation: w15-bat 6s linear infinite }
        .w15-float { animation: w15-float 3s ease-in-out infinite }
        .w15-glow { animation: w15-glow 2s ease-in-out infinite }
        a { color: #cc0000; text-decoration: underline; cursor: pointer }
        a:hover { color: #ff4444 }
      `}</style>

      {/* Top gothic border — iron ornament pattern */}
      <div style={{
        width: '100%',
        backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 14px, rgba(80,80,80,0.6) 14px, rgba(80,80,80,0.6) 16px)',
        backgroundSize: '16px 100%',
        height: 8,
        borderBottom: '2px solid #333',
      }} />

      {/* Flying bat */}
      <div style={{ overflow: 'hidden', height: 40, position: 'relative' }}>
        <div className="w15-bat" style={{ position: 'absolute', top: 10, fontSize: 20 }}>🦇</div>
      </div>

      {/* WELCOME dripping */}
      <div style={{ textAlign: 'center', padding: '8px 0 0', position: 'relative' }}>
        <div className="w15-glow" style={{
          fontSize: 'clamp(3rem, 12vw, 7rem)',
          fontFamily: 'Impact, "Arial Black", sans-serif',
          color: '#cc0000',
          letterSpacing: '0.08em',
          lineHeight: 1,
        }}>
          WELCOME
        </div>
        {/* Drips */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(1.5rem, 5vw, 4rem)', height: 28, overflow: 'hidden', marginTop: -4 }}>
          {[14,22,10,18,12,20,16,8].map((h, i) => (
            <div key={i} className="w15-drip" style={{
              width: 3 + (i % 3),
              height: h,
              background: 'linear-gradient(to bottom, #880000, #cc0000)',
              borderRadius: '0 0 3px 3px',
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 16px 40px' }}>

        {/* Intro text */}
        <div style={{ textAlign: 'center', marginBottom: 24, color: '#999', fontSize: 13, lineHeight: 1.8, fontStyle: 'italic' }}>
          Feel free to visit all my cave then tell me<br/>
          what you like and what not.
        </div>

        {/* The Eye */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {/* Triangle */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            <div style={{
              width: 0, height: 0,
              borderLeft: '60px solid transparent',
              borderRight: '60px solid transparent',
              borderBottom: '104px solid rgba(180,140,0,0.3)',
              filter: 'drop-shadow(0 0 12px rgba(180,140,0,0.4))',
            }} />
            {/* Eye inside triangle */}
            <div style={{
              position: 'absolute',
              top: 46, left: '50%', transform: 'translateX(-50%)',
              fontSize: 28,
              animation: eyeOpen ? `w15-eye 0.4s ease forwards` : 'none',
              transformOrigin: 'center',
            }}>
              👁
            </div>
          </div>
          {/* Webbing below triangle */}
          <div style={{ marginTop: 4, color: 'rgba(100,100,100,0.5)', fontSize: 11, letterSpacing: '0.2em' }}>
            · · · · · · · · · · · · · · · · ·
          </div>
        </div>

        {/* Visitor counter */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-block', background: '#000', border: '1px solid #440000', padding: '8px 20px' }}>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 4, letterSpacing: '0.15em' }}>YOU ARE VISITED.</div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, color: '#cc0000', letterSpacing: '0.25em', textShadow: '0 0 8px #cc0000' }}>
              {String(visitorNum).padStart(6, '0')}
            </div>
            <div className="w15-glow" style={{ fontSize: 18, fontFamily: 'Impact, sans-serif', color: '#cc0000', marginTop: 4, letterSpacing: '0.12em' }}>
              BEWARE.
            </div>
          </div>
        </div>

        {/* Pentagram + skull */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 24 }}>
          <div className="w15-float" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, filter: 'hue-rotate(0deg) saturate(0) brightness(0.5)' }}>⛤</div>
            <div style={{ fontSize: 9, color: '#444', marginTop: 4 }}>The Place Where<br/>My Soul Lingers...</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Candles */}
            {[0,1].map(i => (
              <div key={i} className="w15-flicker" style={{ marginRight: i === 0 ? 30 : 0, marginLeft: i === 1 ? 30 : 0, textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#ffcc44', textShadow: '0 0 6px #ff8800', marginBottom: -4 }}>🔥</div>
                <div style={{ width: 6, height: 40, background: 'linear-gradient(to bottom, #eeeecc, #ccccaa)', margin: '0 auto', borderRadius: 1 }} />
              </div>
            ))}
          </div>
          <div className="w15-float" style={{ textAlign: 'center', animationDelay: '1.5s' }}>
            <div style={{ fontSize: 40 }}>☠</div>
            <div style={{ fontSize: 9, color: '#444', marginTop: 4 }}>is dead.</div>
          </div>
        </div>

        {/* Navigation — Tabla de contenido */}
        <div style={{ border: '1px solid #330000', padding: '16px 20px', marginBottom: 24, background: 'rgba(20,0,0,0.6)' }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 12, fontStyle: 'italic' }}>Tabla de contenido</div>
          <div style={{ fontSize: 12, lineHeight: 2.4 }}>
            <div><a>1. Anarchy</a></div>
            <div><a>2. Destruction</a></div>
            <div><a>3. Misery/Suffering</a></div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #330000' }}>
              <a onClick={() => navigateTo(1, { type: 'vortex' })}>← Return from whence you came</a>
            </div>
          </div>
        </div>

        {/* Dark message */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 2, fontStyle: 'italic' }}>
            "I don't know if you have a website or not<br/>
            BUT LET ME TELL YOU SOMETHING...<br/>
            writing an intro is hard."
          </div>
        </div>

        {/* Dark forest silhouette */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 60, marginBottom: 16, opacity: 0.3 }}>
          {[30,45,35,55,40,50,32,48,38,42,44,36,52].map((h,i) => (
            <div key={i} style={{
              width: 12 + i % 4 * 3,
              height: h,
              background: '#000',
              clipPath: 'polygon(20% 100%, 0% 40%, 50% 0%, 100% 40%, 80% 100%)',
            }} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', borderTop: '1px solid #333', paddingTop: 12 }}>
          <div style={{ fontSize: 9, color: '#444', lineHeight: 2, letterSpacing: '0.08em' }}>
            This cave has been visited by the damned since 1999.<br/>
            Best experienced with the lights off.<br/>
            <span style={{ color: '#330000' }}>You are warned. You are here. That's your problem.</span>
          </div>
        </div>

      </div>

      {/* Bottom border */}
      <div style={{
        width: '100%', height: 8,
        backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 14px, rgba(80,80,80,0.6) 14px, rgba(80,80,80,0.6) 16px)',
        borderTop: '2px solid #333',
      }} />

      <HomeButton />
    </div>
  )
}
