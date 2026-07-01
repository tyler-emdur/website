'use client'
import { useState, useEffect, useRef } from 'react'
import HomeButton from './HomeButton'

const GREEN = '#33ff66'
const GREEN_DIM = '#1a8033'
const RED = '#ff3333'

const CASE_LOG: { id: string; date: string; line: string; redacted: string }[] = [
  { id: 'c1', date: '03.14.97', line: 'Subject reports object hovering above Flagstaff Mountain, no sound, no exhaust.', redacted: '████████ ███ ███████ ████ ████████ ██████, ██ █████, ██ ███████.' },
  { id: 'c2', date: '07.02.98', line: 'Three witnesses, three different drawings, same triangle.', redacted: '█████ ████████, █████ ███████ ████████, ████ ████████.' },
  { id: 'c3', date: '11.19.01', line: 'Audio log corrupted at 00:42. Background hum measured at 19Hz before loss.', redacted: '█████ ███ ████████ ██ ██:██. ██████████ ███ ███████ ██ ████ █████ ████.' },
  { id: 'c4', date: '05.06.04', line: 'Filed under "weather balloon." It was not a weather balloon.', redacted: '██████ █████ "███████ ████████." ██ ███ ███ █ ███████ ████████.' },
  { id: 'c5', date: '02.28.09', line: 'Two case numbers assigned to the same incident. Neither office will explain why.', redacted: '███ ████ ███████ ██████████ ██ ███ ████ ████████. ███████ ██████ ████ ███████ ███.' },
  { id: 'c6', date: '09.11.14', line: 'Request for this file was denied. This page exists anyway.', redacted: '███████ ███ ████ ████ ███ ██████. ████ ████ ██████ ██████.' },
]

function Scanlines() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)',
      mixBlendMode: 'multiply',
    }} />
  )
}

function StaticPhoto() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    c.width = 280; c.height = 180
    let raf = 0
    const draw = () => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, 280, 180)
      for (let i = 0; i < 1800; i++) {
        const v = Math.random()
        ctx.fillStyle = v > 0.5 ? `rgba(${[51, 60, 80][Math.floor(Math.random() * 3)]},255,${[51, 80, 120][Math.floor(Math.random() * 3)]},${Math.random() * 0.5})` : 'rgba(0,0,0,0.3)'
        ctx.fillRect(Math.random() * 280, Math.random() * 180, 1, 1)
      }
      ctx.strokeStyle = 'rgba(51,255,102,0.4)'
      ctx.beginPath()
      ctx.ellipse(140 + Math.sin(Date.now() / 900) * 6, 80, 38, 12, 0, 0, Math.PI * 2)
      ctx.stroke()
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} style={{ width: '100%', maxWidth: 280, border: `1px solid ${GREEN_DIM}`, display: 'block' }} />
}

export default function World4Corridor() {
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [foiaCode, setFoiaCode] = useState('')
  const [foiaError, setFoiaError] = useState(false)
  const [foiaOpen, setFoiaOpen] = useState(false)
  const [stampVisible, setStampVisible] = useState(true)
  const [denyFlash, setDenyFlash] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => setStampVisible(v => !v), 900)
    return () => clearInterval(iv)
  }, [])

  const toggle = (id: string) => {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const submitFoia = () => {
    if (foiaCode.trim().toUpperCase() === 'BLACKBIRD') {
      setFoiaOpen(true)
      setFoiaError(false)
    } else {
      setFoiaError(true)
      setFoiaOpen(false)
    }
  }

  const requestFullFile = () => {
    setDenyFlash(true)
    setTimeout(() => setDenyFlash(false), 700)
  }

  return (
    <div data-world="4" style={{
      position: 'fixed', inset: 0, overflow: 'auto', background: '#040603',
      fontFamily: '"Courier New", monospace', color: GREEN,
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #0a1208 0%, #040603 70%)',
    }}>
      <style>{`
        @keyframes w4-blink { 50% { opacity: 0 } }
        .w4-blink { animation: w4-blink 1s step-end infinite }
        @keyframes w4-flash { 0%,100% { background: #220000 } 50% { background: #550000 } }
        .w4-deny { animation: w4-flash 0.25s step-end 3; }
        .w4-redact { cursor: pointer; letter-spacing: 1px; }
        .w4-redact:hover { outline: 1px dashed ${GREEN_DIM}; }
      `}</style>
      <Scanlines />
      <HomeButton />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 20px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: GREEN_DIM, letterSpacing: 4, marginBottom: 6 }}>
            DEPARTMENT OF UNRESOLVED MATTERS &mdash; FIELD DIVISION
          </div>
          <div style={{
            fontSize: 'clamp(20px,4vw,30px)', fontWeight: 900, color: GREEN,
            textShadow: `0 0 10px ${GREEN}`, letterSpacing: 2, marginBottom: 6,
          }}>
            CASE FILE: PROJECT BLACKBIRD
          </div>
          <div className={stampVisible ? 'w4-blink' : ''} style={{
            display: 'inline-block', border: `2px solid ${RED}`, color: RED,
            fontSize: 11, fontWeight: 900, letterSpacing: 3, padding: '3px 10px',
            transform: 'rotate(-3deg)',
          }}>
            TOP SECRET // EYES ONLY
          </div>
        </div>

        <div style={{ fontSize: 11, lineHeight: 1.8, color: '#aaffc0', marginBottom: 24, borderLeft: `2px solid ${GREEN_DIM}`, paddingLeft: 12 }}>
          This file was never supposed to be public. A misconfigured archive server
          left it reachable for one afternoon in 2019. It has stayed up ever since
          because nobody who could take it down has admitted it exists.
          <br /><br />
          Six entries below. Most are still blacked out. Click a redacted line if
          you think you can handle it &mdash; some of them give in.
        </div>

        {/* Case log */}
        <div style={{ marginBottom: 28 }}>
          {CASE_LOG.map(c => (
            <div key={c.id} style={{
              display: 'flex', gap: 12, padding: '10px 0',
              borderBottom: `1px dotted ${GREEN_DIM}`, fontSize: 12, lineHeight: 1.6,
            }}>
              <div style={{ color: GREEN_DIM, fontSize: 10, flexShrink: 0, width: 64, paddingTop: 2 }}>{c.date}</div>
              <div className="w4-redact" onClick={() => toggle(c.id)} style={{ color: revealed.has(c.id) ? '#fff' : GREEN }}>
                {revealed.has(c.id) ? c.line : c.redacted}
              </div>
            </div>
          ))}
        </div>

        {/* Photo + sidebar */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <StaticPhoto />
            <div style={{ fontSize: 9, color: GREEN_DIM, marginTop: 4 }}>FIG. 1 &mdash; UNIDENTIFIED, FLAGSTAFF MTN, 03.14.97</div>
          </div>
          <div style={{ flex: 1, minWidth: 200, fontSize: 10, lineHeight: 1.9, color: '#88cc99' }}>
            <div style={{ color: GREEN, marginBottom: 6, letterSpacing: 1 }}>FIELD NOTES</div>
            &gt; sighting frequency increases near solstice<br />
            &gt; three independent reports use the word &quot;wrong&quot; unprompted<br />
            &gt; the hum reappears in two unrelated recordings, eleven years apart<br />
            &gt; nobody who filed these forms still works here<br />
            &gt; the truth is filed somewhere. it is not here.
          </div>
        </div>

        {/* FOIA request */}
        <div style={{ border: `1px solid ${GREEN_DIM}`, padding: 16, marginBottom: 20, background: 'rgba(51,255,102,0.03)' }}>
          <div style={{ fontSize: 11, color: GREEN, marginBottom: 8, letterSpacing: 1 }}>FOIA REQUEST FORM &mdash; ACCESS CODE REQUIRED</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={foiaCode}
              onChange={e => { setFoiaCode(e.target.value); setFoiaError(false) }}
              onKeyDown={e => e.key === 'Enter' && submitFoia()}
              placeholder="ENTER PROJECT CODENAME"
              style={{
                background: '#000', border: `1px solid ${foiaError ? RED : GREEN_DIM}`, color: GREEN,
                fontFamily: 'inherit', fontSize: 11, padding: '6px 10px', flex: 1, minWidth: 160,
              }}
            />
            <button onClick={submitFoia} style={{
              background: 'none', border: `1px solid ${GREEN}`, color: GREEN, fontFamily: 'inherit',
              fontSize: 10, letterSpacing: 1, padding: '6px 14px', cursor: 'pointer',
            }}>SUBMIT</button>
          </div>
          {foiaError && <div style={{ fontSize: 10, color: RED, marginTop: 8 }}>ACCESS DENIED. Codename not recognized.</div>}
          {foiaOpen && (
            <div style={{ marginTop: 12, fontSize: 11, color: '#fff', lineHeight: 1.7, borderTop: `1px dashed ${GREEN_DIM}`, paddingTop: 10 }}>
              Codename accepted. There is no Project Blackbird. There never was. The
              codename was assigned to a budget line, not an investigation &mdash; a
              placeholder someone forgot to remove. Six field reports got filed under
              it by mistake and nobody ever reopened them.
              <br /><br />
              That&apos;s the whole secret. Sorry. The hum at 19Hz was a transformer
              two buildings over. Some files just stay open because closing them
              is somebody else&apos;s job.
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={requestFullFile} className={denyFlash ? 'w4-deny' : ''} style={{
            background: '#220000', border: `1px solid ${RED}`, color: RED, fontFamily: 'inherit',
            fontSize: 10, letterSpacing: 2, padding: '10px 20px', cursor: 'pointer',
          }}>REQUEST UNREDACTED FULL FILE</button>
          {denyFlash && <div style={{ fontSize: 10, color: RED, marginTop: 8 }}>REQUEST DENIED. This decision is final and not subject to appeal.</div>}
        </div>

        <div style={{ textAlign: 'center', fontSize: 9, color: GREEN_DIM, marginTop: 40, letterSpacing: 1 }}>
          if you found this page, you already know too much &middot; visitors since 1997: 004,219
        </div>
      </div>
    </div>
  )
}
