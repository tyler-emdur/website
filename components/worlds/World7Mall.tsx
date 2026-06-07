'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

const VEND_ITEMS = [
  { label: 'CERTAINTY', price: '$4.99', responses: ['out of stock since 2019', 'checking inventory…\nnope', 'found some. it expired.', 'sold to someone else'] },
  { label: 'SLEEP', price: '$2.11', responses: ['dispensing…\n[mechanism jams]', 'try the stairs', '6-8 hours\n(estimated)', 'already dispensed\ncheck under the bench'] },
  { label: 'PURPOSE', price: '$∞', responses: ['machine vibrates\nthen goes quiet', 'SELECT COLUMN B\ncolumn B does not exist', 'processing…\nstill processing', 'receipt prints:\n"good question"'] },
  { label: 'REASONS', price: 'free', responses: ['taking too many', 'dispensing 3\nyou only asked for 1', 'none left\ntry CERTAINTY', 'machine flickers\nand returns your coin'] },
  { label: 'STATIC', price: '$0.01', responses: ['always in stock', '░░▒▓█\n█▓▒░░', 'fresh batch', 'this one has teeth'] },
  { label: 'THE ORIGINAL\nIDEA', price: '$???', responses: ['already yours\nsomeone else bought the copy', 'sold 1,200 times\nstill one left', 'machine hums\nthen goes dark', 'receipt: "nice try"'] },
]

const PA_LINES = [
  (v: number) => v === 0 ? 'Attention shoppers: nothing has happened yet.' : `Attention shoppers: ${v} purchase${v !== 1 ? 's' : ''} recorded. Behavior logged.`,
  () => 'Could the person standing still please continue standing still. Thank you.',
  () => 'The food court is open. The food court has never been open.',
  () => 'Attention: the exit has relocated. New coordinates pending.',
  () => 'A mannequin in section C has filed a complaint. The complaint is you.',
  () => 'The escalator is currently traveling sideways. This is normal.',
  () => 'Lost and found contains: one left shoe, a frequency, and your previous excuse.',
  () => 'Store closing in 30 minutes. Store closing has been ongoing for 4 years.',
  () => 'Attention: the mall would like you to know it has noticed you.',
]

const MANNEQUIN_LINES = [
  'what are you looking at',
  'i was here first',
  'i don\'t actually have eyes',
  'this outfit is from last season\n(of something)',
  'please stop',
  'i\'ve been standing here\nsince 1994',
  'the collar was not my idea',
  'you look familiar\n(we all say that)',
]

const FOOD_ITEMS = [
  { name: 'TIME SOUP', desc: 'approx. 12 minutes', price: 'in stock' },
  { name: 'YESTERDAY', desc: 'out of stock', price: '$0.00' },
  { name: 'STATIC (LG)', desc: 'complimentary', price: 'always' },
  { name: 'DECISION', desc: 'takes ~3 business days', price: '$contact' },
  { name: 'THE ORIGINAL\nFEELING', desc: 'limited qty', price: 'ask cashier' },
  { name: 'CERTAINTY FRIES', desc: 'see vending machine', price: 'N/A' },
]

const WARP_WORLDS: Array<{ world: 2 | 3 | 10 | 11 | 12 | 13 | 15; portal: PortalType; label: string }> = [
  { world: 10, portal: 'vortex', label: 'LOOP' },
  { world: 13, portal: 'vortex', label: 'SPIRAL' },
  { world: 11, portal: 'scatter', label: 'FLICKER' },
  { world: 3, portal: 'expand-white', label: 'BROADCAST' },
  { world: 15, portal: 'chromatic', label: 'DIAL' },
  { world: 12, portal: 'nothing', label: 'TERMINAL' },
  { world: 2, portal: 'scatter', label: 'DEPTH' },
]

type View = 'main' | 'vending' | 'food' | 'mannequins' | 'escalator'

export default function World7Mall() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [view, setView] = useState<View>('main')
  const [paLine, setPaLine] = useState('')
  const [paVisible, setPaVisible] = useState(false)
  const [vendIdx, setVendIdx] = useState<number | null>(null)
  const [vendResponse, setVendResponse] = useState('')
  const [vendPurchases, setVendPurchases] = useState(0)
  const [mannResponse, setMannResponse] = useState<string | null>(null)
  const [mannIdx, setMannIdx] = useState(0)
  const [escWarning, setEscWarning] = useState('')
  const [escUsed, setEscUsed] = useState(0)
  const mouseRef = useRef({ x: 0, y: 0 })
  const mannRefs = useRef<(HTMLDivElement | null)[]>([])
  const [mannAngles, setMannAngles] = useState([0, 0, 0, 0])
  const paIdx = useRef(0)

  useEffect(() => {
    const move = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  // Mannequin head tracking
  useEffect(() => {
    if (view !== 'mannequins') return
    let raf = 0
    function tick() {
      const angles = mannRefs.current.map(el => {
        if (!el) return 0
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const angle = Math.atan2(mouseRef.current.y - cy, mouseRef.current.x - cx) * (180 / Math.PI)
        return Math.max(-45, Math.min(45, angle * 0.25))
      })
      setMannAngles(angles)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [view])

  // PA system
  useEffect(() => {
    const showPA = () => {
      const fn = PA_LINES[paIdx.current % PA_LINES.length]
      paIdx.current++
      setPaLine(typeof fn === 'function' ? fn(vendPurchases) : fn)
      setPaVisible(true)
      setTimeout(() => setPaVisible(false), 7000)
    }
    const t1 = setTimeout(showPA, 2500)
    const iv = setInterval(showPA, 22000)
    return () => { clearTimeout(t1); clearInterval(iv) }
  }, [vendPurchases])

  const handleVend = useCallback((i: number) => {
    const item = VEND_ITEMS[i]
    const r = item.responses[Math.floor(Math.random() * item.responses.length)]
    setVendIdx(i)
    setVendResponse(r)
    setVendPurchases(v => v + 1)
  }, [])

  const handleMannequin = useCallback((i: number) => {
    const line = MANNEQUIN_LINES[Math.floor(Math.random() * MANNEQUIN_LINES.length)]
    setMannIdx(i)
    setMannResponse(line)
    setTimeout(() => setMannResponse(null), 3500)
  }, [])

  const handleEscalator = useCallback(() => {
    const n = escUsed + 1
    setEscUsed(n)
    if (n === 1) { setEscWarning('ESCALATOR CALIBRATING...'); return }
    if (n === 2) { setEscWarning('WARNING: DESTINATION UNCONFIRMED'); return }
    const dest = WARP_WORLDS[Math.floor(Math.random() * WARP_WORLDS.length)]
    setEscWarning(`DEPARTING → ${dest.label}`)
    setTimeout(() => navigateTo(dest.world, { type: dest.portal }), 800)
  }, [escUsed, navigateTo])

  return (
    <div data-world="7" style={{ position: 'fixed', inset: 0, background: '#100c08', fontFamily: '"Pirata One", serif', overflow: 'hidden' }}>

      {/* Ceiling grid */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, background: 'repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(200,170,80,0.04) 60px, rgba(200,170,80,0.04) 61px)', borderBottom: '1px solid rgba(200,170,80,0.06)' }} />

      {/* Mall header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        <div style={{ fontSize: 18, color: 'rgba(200,170,80,0.45)', letterSpacing: '0.3em' }}>SIGNAL RIDGE MALL</div>
        <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,170,80,0.18)', letterSpacing: '0.15em' }}>OPEN · EST. 1993 · CLOSED SUNDAYS · PERMANENTLY</div>
      </div>

      {/* PA */}
      {paVisible && (
        <div style={{ position: 'fixed', top: 54, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(200,170,80,0.18)', padding: '8px 20px', zIndex: 50, fontFamily: '"Pirata One", serif', fontSize: 11, color: 'rgba(200,170,80,0.7)', letterSpacing: '0.05em', maxWidth: '80vw', textAlign: 'center', animation: 'paFade 7s both', whiteSpace: 'pre-wrap' }}>
          📢 {paLine}
        </div>
      )}

      {/* MAIN VIEW */}
      {view === 'main' && (
        <div style={{ position: 'absolute', inset: '60px 0 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 40px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,170,80,0.2)', letterSpacing: '0.25em', marginBottom: 8 }}>YOU ARE HERE · LEVEL 1 · MAP ACCURACY: 14%</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 640 }}>
            {[
              { id: 'vending', label: '🏧 VENDING MACHINES', sub: 'certainty · sleep · the original idea', color: '#1a1208' },
              { id: 'food', label: '🍽 FOOD COURT', sub: 'time soup · yesterday · static (lg)', color: '#0a1208' },
              { id: 'mannequins', label: '🕴 MANNEQUIN GALLERY', sub: 'they have been watching', color: '#0d0d18' },
              { id: 'escalator', label: '⬆ ESCALATOR', sub: 'destination unconfirmed', color: '#120a18' },
            ].map(s => (
              <div
                key={s.id}
                onClick={() => setView(s.id as View)}
                style={{ background: s.color, border: '1px solid rgba(200,170,80,0.1)', padding: '24px 20px', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s', position: 'relative' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(200,170,80,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(200,170,80,0.1)')}
              >
                <div style={{ fontSize: 14, color: 'rgba(200,170,80,0.75)', letterSpacing: '0.1em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,170,80,0.25)', letterSpacing: '0.08em', lineHeight: 1.7 }}>{s.sub}</div>
                <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'rgba(100,200,120,0.5)', boxShadow: '0 0 6px rgba(100,200,120,0.4)' }} />
              </div>
            ))}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,170,80,0.12)', letterSpacing: '0.15em', marginTop: 8 }}>LOST AND FOUND: LEVEL 2 · LEVEL 2 DOES NOT EXIST</div>
        </div>
      )}

      {/* VENDING MACHINES */}
      {view === 'vending' && (
        <div style={{ position: 'absolute', inset: '60px 0 56px', display: 'flex', flexDirection: 'column', padding: '24px 32px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 16, color: 'rgba(200,170,80,0.7)', letterSpacing: '0.15em' }}>VENDING MACHINES · ROW C</div>
              <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,170,80,0.2)', marginTop: 4, letterSpacing: '0.1em' }}>PURCHASES: {vendPurchases} · SATISFACTION: UNKNOWN</div>
            </div>
            <button onClick={() => { setView('main'); setVendIdx(null); setVendResponse('') }} style={{ background: 'none', border: '1px solid rgba(200,170,80,0.2)', color: 'rgba(200,170,80,0.5)', fontFamily: '"Pirata One", serif', fontSize: 11, padding: '4px 14px', cursor: 'pointer', letterSpacing: '0.1em' }}>← MALL</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, flex: 1 }}>
            {VEND_ITEMS.map((item, i) => (
              <div
                key={i}
                style={{ background: vendIdx === i ? 'rgba(200,170,80,0.06)' : '#0a0806', border: `1px solid ${vendIdx === i ? 'rgba(200,170,80,0.3)' : 'rgba(200,170,80,0.08)'}`, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'all 0.15s' }}
              >
                <div style={{ flex: 1 }}>
                  {/* Machine display */}
                  <div style={{ background: '#020201', border: '1px solid rgba(200,170,80,0.1)', padding: '10px 8px', marginBottom: 10, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 9, color: vendIdx === i ? 'rgba(200,200,100,0.9)' : 'rgba(200,170,80,0.35)', textAlign: 'center', letterSpacing: '0.08em', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {vendIdx === i ? vendResponse : item.label}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,170,80,0.3)', letterSpacing: '0.1em' }}>{item.price}</div>
                </div>
                <button
                  onClick={() => handleVend(i)}
                  style={{ background: 'rgba(200,170,80,0.08)', border: '1px solid rgba(200,170,80,0.2)', color: 'rgba(200,170,80,0.6)', fontFamily: '"Pirata One", serif', fontSize: 11, padding: '6px 0', cursor: 'pointer', letterSpacing: '0.08em', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,170,80,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(200,170,80,0.08)')}
                >
                  SELECT
                </button>
              </div>
            ))}
          </div>
          {vendPurchases >= 6 && (
            <div
              onClick={() => navigateTo(13, { type: 'vortex' })}
              style={{ marginTop: 16, padding: '12px', background: 'rgba(200,170,80,0.04)', border: '1px solid rgba(200,170,80,0.12)', fontFamily: 'monospace', fontSize: 9, color: 'rgba(200,170,80,0.4)', textAlign: 'center', letterSpacing: '0.15em', cursor: 'pointer' }}
            >
              ⚠ MACHINE C-7 MALFUNCTION — DO NOT APPROACH<br />
              <span style={{ fontSize: 7, opacity: 0.5 }}>(the spiral is visible from here)</span>
            </div>
          )}
        </div>
      )}

      {/* FOOD COURT */}
      {view === 'food' && (
        <div style={{ position: 'absolute', inset: '60px 0 56px', padding: '24px 32px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 16, color: 'rgba(100,180,120,0.7)', letterSpacing: '0.15em' }}>FOOD COURT · LEVEL 2 (THIS IS LEVEL 1)</div>
            <button onClick={() => setView('main')} style={{ background: 'none', border: '1px solid rgba(200,170,80,0.2)', color: 'rgba(200,170,80,0.5)', fontFamily: '"Pirata One", serif', fontSize: 11, padding: '4px 14px', cursor: 'pointer', letterSpacing: '0.1em' }}>← MALL</button>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(100,180,120,0.3)', letterSpacing: '0.2em', marginBottom: 20 }}>TODAY'S SPECIALS · WHILE SUPPLIES LAST · SUPPLIES NEVER LAST</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            {FOOD_ITEMS.map((item, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(100,180,120,0.1)', padding: '16px 14px' }}>
                <div style={{ fontFamily: '"Pirata One", serif', fontSize: 13, color: 'rgba(100,180,120,0.7)', marginBottom: 8, lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>{item.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(100,180,120,0.35)', marginBottom: 8, fontStyle: 'italic' }}>{item.desc}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(100,180,120,0.5)' }}>{item.price}</div>
              </div>
            ))}
          </div>
          <div
            onClick={() => navigateTo(9, { type: 'expand-white' })}
            style={{ padding: '14px 16px', border: '1px dashed rgba(100,180,120,0.12)', fontFamily: 'monospace', fontSize: 9, color: 'rgba(100,180,120,0.2)', letterSpacing: '0.12em', cursor: 'pointer', lineHeight: 2 }}
          >
            CASHIER WINDOW · CURRENTLY UNMANNED · OR MAYBE OVERMANNED<br />
            <span style={{ opacity: 0.5 }}>→ contact page (somewhere that way)</span>
          </div>
        </div>
      )}

      {/* MANNEQUIN GALLERY */}
      {view === 'mannequins' && (
        <div style={{ position: 'absolute', inset: '60px 0 56px', padding: '24px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 16, color: 'rgba(180,160,220,0.7)', letterSpacing: '0.15em' }}>MANNEQUIN GALLERY · SECTION C</div>
            <button onClick={() => { setView('main'); setMannResponse(null) }} style={{ background: 'none', border: '1px solid rgba(200,170,80,0.2)', color: 'rgba(200,170,80,0.5)', fontFamily: '"Pirata One", serif', fontSize: 11, padding: '4px 14px', cursor: 'pointer', letterSpacing: '0.1em' }}>← MALL</button>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(180,160,220,0.25)', letterSpacing: '0.15em', marginBottom: 32 }}>MOVE YOUR CURSOR · THEY NOTICE · CLICK ONE</div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', justifyContent: 'center', flex: 1 }}>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                onClick={() => handleMannequin(i)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: mannIdx === i && mannResponse ? 0.85 : 0.6, transition: 'opacity 0.2s' }}
              >
                {/* Head — rotates toward cursor */}
                <div
                  ref={el => { mannRefs.current[i] = el }}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(180,160,220,0.15)',
                    border: '1px solid rgba(180,160,220,0.2)',
                    marginBottom: 4,
                    transform: `rotate(${mannAngles[i]}deg)`,
                    transition: 'transform 0.05s linear',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Eyes */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(180,160,220,0.6)' }} />
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(180,160,220,0.6)' }} />
                  </div>
                  {/* Speech bubble */}
                  {mannIdx === i && mannResponse && (
                    <div style={{ position: 'absolute', bottom: 34, left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,8,16,0.95)', border: '1px solid rgba(180,160,220,0.3)', padding: '8px 12px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 9, color: 'rgba(180,160,220,0.8)', letterSpacing: '0.05em', lineHeight: 1.6, zIndex: 10, minWidth: 140, textAlign: 'center' }}>
                      {mannResponse}
                    </div>
                  )}
                </div>
                {/* Body */}
                <div style={{ width: 3, height: 12, background: 'rgba(180,160,220,0.12)' }} />
                <div style={{ width: 32, height: 56, background: i % 2 === 0 ? 'rgba(180,160,220,0.08)' : 'rgba(200,170,80,0.06)', border: '1px solid rgba(180,160,220,0.08)' }} />
                {/* Legs */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 10, height: 40, background: 'rgba(180,160,220,0.07)' }} />
                  <div style={{ width: 10, height: 40, background: 'rgba(180,160,220,0.07)' }} />
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(180,160,220,0.2)', marginTop: 8, letterSpacing: '0.1em' }}>UNIT {String.fromCharCode(65 + i)}</div>
              </div>
            ))}
          </div>
          <div
            onClick={() => navigateTo(11, { type: 'scatter' })}
            style={{ marginTop: 24, padding: '10px', border: '1px solid rgba(180,160,220,0.08)', fontFamily: 'monospace', fontSize: 8, color: 'rgba(180,160,220,0.2)', textAlign: 'center', letterSpacing: '0.15em', cursor: 'pointer' }}
          >
            FITTING ROOM ARCADE · OUT OF ORDER · ENTER ANYWAY →
          </div>
        </div>
      )}

      {/* ESCALATOR */}
      {view === 'escalator' && (
        <div style={{ position: 'absolute', inset: '60px 0 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <button onClick={() => setView('main')} style={{ position: 'absolute', top: 16, right: 24, background: 'none', border: '1px solid rgba(200,170,80,0.2)', color: 'rgba(200,170,80,0.5)', fontFamily: '"Pirata One", serif', fontSize: 11, padding: '4px 14px', cursor: 'pointer', letterSpacing: '0.1em' }}>← MALL</button>
          {/* Escalator visual */}
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ width: 24, height: 10, background: 'rgba(200,170,80,0.06)', border: '1px solid rgba(200,170,80,0.12)', transform: `translateY(${i * -3}px) rotate(-8deg)`, transition: 'all 0.3s' }} />
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, color: 'rgba(200,170,80,0.5)', letterSpacing: '0.2em', marginBottom: 12 }}>ESCALATOR</div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(200,170,80,0.25)', letterSpacing: '0.12em', lineHeight: 1.8, marginBottom: 24 }}>
              DESTINATION: {escUsed === 0 ? 'LEVEL 2' : escUsed === 1 ? 'CALCULATING...' : 'UNRESOLVABLE'}<br />
              {escWarning && <span style={{ color: 'rgba(255,150,80,0.6)' }}>{escWarning}</span>}
            </div>
            <button
              onClick={handleEscalator}
              style={{ background: escUsed >= 2 ? 'rgba(255,100,50,0.08)' : 'rgba(200,170,80,0.06)', border: `1px solid ${escUsed >= 2 ? 'rgba(255,100,50,0.3)' : 'rgba(200,170,80,0.2)'}`, color: escUsed >= 2 ? 'rgba(255,150,80,0.7)' : 'rgba(200,170,80,0.6)', fontFamily: '"Pirata One", serif', fontSize: 14, padding: '12px 40px', cursor: 'pointer', letterSpacing: '0.15em' }}
            >
              {escUsed === 0 ? '↑ RIDE' : escUsed === 1 ? '↑ PROCEED' : '↑ DEPART (RANDOM)'}
            </button>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,170,80,0.12)', letterSpacing: '0.15em', textAlign: 'center', lineHeight: 2 }}>
            NOTE: THIS ESCALATOR TRAVELS SIDEWAYS<br />
            MANAGEMENT NOT RESPONSIBLE FOR DIMENSIONAL DRIFT
          </div>
        </div>
      )}

      {/* Floor bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, background: 'rgba(0,0,0,0.7)', borderTop: '1px solid rgba(200,170,80,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,170,80,0.12)', letterSpacing: '0.15em' }}>DIRECTORY: YOU ARE HERE</div>
        <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,170,80,0.08)', letterSpacing: '0.1em' }}>EXITS: MULTIPLE · NONE CONFIRMED</div>
        <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,170,80,0.12)', letterSpacing: '0.15em' }}>HOURS: ALWAYS / NEVER</div>
      </div>

      <style>{`
        @keyframes paFade { 0% { opacity:0 } 10% { opacity:1 } 80% { opacity:1 } 100% { opacity:0 } }
      `}</style>
      <HomeButton />
    </div>
  )
}
