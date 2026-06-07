'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

const VEND_ITEMS = [
  { label: 'CERTAINTY', price: '$4.99', responses: ['OUT OF STOCK SINCE 2019', 'CHECKING INVENTORY…\nNOPE', 'FOUND SOME.\nIT EXPIRED.', 'SOLD TO SOMEONE ELSE'] },
  { label: 'SLEEP', price: '$2.11', responses: ['DISPENSING…\n[MECHANISM JAMS]', 'TRY THE STAIRS', '6-8 HOURS\n(ESTIMATED)', 'ALREADY DISPENSED\nCHECK UNDER THE BENCH'] },
  { label: 'PURPOSE', price: '$∞', responses: ['MACHINE VIBRATES\nTHEN GOES QUIET', 'SELECT COLUMN B\nCOLUMN B DOES NOT EXIST', 'PROCESSING…\nSTILL PROCESSING', 'RECEIPT PRINTS:\n"GOOD QUESTION"'] },
  { label: 'REASONS', price: 'FREE', responses: ['TAKING TOO MANY', 'DISPENSING 3\nYOU ONLY ASKED FOR 1', 'NONE LEFT\nTRY CERTAINTY', 'MACHINE FLICKERS\nRETURNS YOUR COIN'] },
  { label: 'STATIC', price: '$0.01', responses: ['ALWAYS IN STOCK', '░░▒▓█\n█▓▒░░', 'FRESH BATCH', 'THIS ONE HAS TEETH'] },
  { label: 'THE ORIGINAL\nIDEA', price: '$???', responses: ['ALREADY YOURS\nSOMEONE ELSE BOUGHT THE COPY', 'SOLD 1,200 TIMES\nSTILL ONE LEFT', 'MACHINE HUMS\nTHEN GOES DARK', 'RECEIPT: "NICE TRY"'] },
]

const PA_LINES = [
  (v: number) => v === 0 ? 'ATTENTION SHOPPERS: NOTHING HAS HAPPENED YET.' : `ATTENTION SHOPPERS: ${v} PURCHASE${v !== 1 ? 'S' : ''} RECORDED. BEHAVIOR LOGGED.`,
  () => 'COULD THE PERSON STANDING STILL PLEASE CONTINUE STANDING STILL. THANK YOU.',
  () => 'THE FOOD COURT IS OPEN. THE FOOD COURT HAS NEVER BEEN OPEN.',
  () => 'ATTENTION: THE EXIT HAS RELOCATED. NEW COORDINATES PENDING.',
  () => 'A MANNEQUIN IN SECTION C HAS FILED A COMPLAINT. THE COMPLAINT IS YOU.',
  () => 'THE ESCALATOR IS CURRENTLY TRAVELING SIDEWAYS. THIS IS NORMAL.',
  () => 'LOST AND FOUND CONTAINS: ONE LEFT SHOE, A FREQUENCY, AND YOUR PREVIOUS EXCUSE.',
  () => 'STORE CLOSING IN 30 MINUTES. STORE CLOSING HAS BEEN ONGOING FOR 4 YEARS.',
  () => 'ATTENTION: THE MALL WOULD LIKE YOU TO KNOW IT HAS NOTICED YOU.',
  () => 'SECURITY REMINDER: DO NOT MAKE EYE CONTACT WITH THE MANNEQUINS.',
  () => 'FREQUENCY 88.7 IS CURRENTLY UNAVAILABLE IN THIS LOCATION.',
]

const MANNEQUIN_LINES = [
  'what are you\nlooking at',
  'i was here first',
  "i don't actually\nhave eyes",
  'this outfit is from\nlast season\n(of something)',
  'please stop',
  "i've been standing here\nsince 1994",
  'the collar was\nnot my idea',
  'you look familiar\n(we all say that)',
]

const FOOD_ITEMS = [
  { name: 'TIME SOUP', desc: 'approx. 12 minutes', price: '$3.50' },
  { name: 'YESTERDAY', desc: 'out of stock', price: '$0.00' },
  { name: 'STATIC LG', desc: 'complimentary', price: 'always' },
  { name: 'DECISION', desc: 'takes ~3 business days', price: '$CONTACT' },
  { name: 'THE ORIGINAL\nFEELING', desc: 'limited qty', price: 'ask cashier' },
  { name: 'CERTAINTY\nFRIES', desc: 'see vending machine', price: 'N/A' },
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

const ZONE_COLORS = {
  vending: { bg: '#ff2d78', light: '#ff85af', text: '#fff', zone: 'A' },
  food: { bg: '#ff9500', light: '#ffcc66', text: '#fff', zone: 'B' },
  mannequins: { bg: '#00b4d8', light: '#90e0ef', text: '#fff', zone: 'C' },
  escalator: { bg: '#7b2d8b', light: '#c77dff', text: '#fff', zone: 'D' },
}

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
    if (n === 1) { setEscWarning('CALIBRATING...'); return }
    if (n === 2) { setEscWarning('WARNING: DESTINATION UNCONFIRMED'); return }
    const dest = WARP_WORLDS[Math.floor(Math.random() * WARP_WORLDS.length)]
    setEscWarning(`DEPARTING → ${dest.label}`)
    setTimeout(() => navigateTo(dest.world, { type: dest.portal }), 800)
  }, [escUsed, navigateTo])

  const currentZone = view !== 'main' ? ZONE_COLORS[view as keyof typeof ZONE_COLORS] : null

  return (
    <div data-world="7" style={{
      position: 'fixed', inset: 0,
      background: '#f0ece4',
      fontFamily: '"Arial Black", "Arial Bold", Gadget, sans-serif',
      overflow: 'hidden',
    }}>

      {/* Fluorescent ceiling lights */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 8,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.1) 100%)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'rgba(255,255,255,1)',
        boxShadow: '0 0 40px 20px rgba(255,255,255,0.6)',
        pointerEvents: 'none',
      }} />

      {/* Tile floor */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
        backgroundImage: 'linear-gradient(45deg, #ddd 25%, #f0f0f0 25%, #f0f0f0 75%, #ddd 75%), linear-gradient(45deg, #ddd 25%, #f0f0f0 25%, #f0f0f0 75%, #ddd 75%)',
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 20px 20px',
        opacity: 0.5,
        borderTop: '2px solid rgba(0,0,0,0.1)',
      }} />

      {/* Mall header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 60,
        background: '#1a1a2e',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            fontSize: 22, color: '#ffffff', letterSpacing: '0.15em',
            textShadow: '0 0 20px rgba(255,45,120,0.8), 0 0 40px rgba(255,45,120,0.4)',
            fontFamily: '"Arial Black", sans-serif',
          }}>
            SIGNAL RIDGE MALL
          </div>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginTop: 2 }}>
            EST. 1993 · ALWAYS OPEN · NEVER CLOSING
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.entries(ZONE_COLORS).map(([key, z]) => (
            <div key={key} style={{
              width: 24, height: 24, background: z.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#fff', fontFamily: '"Arial Black", sans-serif',
              cursor: view === key ? 'default' : 'pointer',
              opacity: view === key ? 1 : 0.5,
              transition: 'opacity 0.2s',
              boxShadow: view === key ? `0 0 12px ${z.bg}` : 'none',
            }}
              onClick={() => setView(key as View)}
            >
              {z.zone}
            </div>
          ))}
        </div>
      </div>

      {/* PA announcement — like an overhead intercom strip */}
      {paVisible && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0,
          background: '#1a1a2e',
          borderBottom: '3px solid #ff2d78',
          padding: '10px 32px',
          zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 16,
          animation: 'paSlide 7s both',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#ff2d78',
            boxShadow: '0 0 8px #ff2d78',
            flexShrink: 0,
            animation: 'paBlink 0.5s step-end infinite',
          }} />
          <div style={{
            fontFamily: 'Arial, sans-serif', fontSize: 11,
            color: '#fff', letterSpacing: '0.12em',
          }}>
            {paLine}
          </div>
        </div>
      )}

      {/* MAIN VIEW */}
      {view === 'main' && (
        <div style={{
          position: 'absolute', inset: '60px 0 80px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '20px 40px', gap: 20,
        }}>
          {/* Directory board */}
          <div style={{
            background: '#1a1a2e', border: '3px solid #333',
            padding: '16px 28px', marginBottom: 8, textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3em', marginBottom: 6 }}>
              MALL DIRECTORY — YOU ARE HERE
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {Object.entries(ZONE_COLORS).map(([key, z]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, background: z.bg }} />
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
                    ZONE {z.zone}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Zone cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 700 }}>
            {([
              { id: 'vending', label: 'VENDING', sub: 'CERTAINTY · SLEEP · PURPOSE', icon: '🏧' },
              { id: 'food', label: 'FOOD COURT', sub: 'TIME SOUP · YESTERDAY', icon: '🍽' },
              { id: 'mannequins', label: 'GALLERY', sub: 'THEY ARE WATCHING', icon: '🕴' },
              { id: 'escalator', label: 'ESCALATOR', sub: 'DESTINATION TBD', icon: '⬆' },
            ] as const).map(s => {
              const z = ZONE_COLORS[s.id as keyof typeof ZONE_COLORS]
              return (
                <div
                  key={s.id}
                  onClick={() => setView(s.id as View)}
                  style={{
                    background: '#ffffff',
                    border: `4px solid ${z.bg}`,
                    padding: '28px 24px',
                    cursor: 'pointer',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.15)',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translate(-2px,-2px)'
                    e.currentTarget.style.boxShadow = `6px 6px 0 ${z.bg}80`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translate(0,0)'
                    e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,0.15)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, background: z.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {s.icon}
                    </div>
                    <div style={{ fontSize: 16, color: '#1a1a2e', letterSpacing: '0.08em', lineHeight: 1 }}>
                      {s.label}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'Arial, sans-serif', fontSize: 9,
                    color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em',
                  }}>
                    {s.sub}
                  </div>
                  <div style={{
                    display: 'inline-block', background: z.bg,
                    color: '#fff', fontSize: 9, padding: '3px 10px',
                    letterSpacing: '0.15em', alignSelf: 'flex-start',
                    marginTop: 4,
                  }}>
                    ZONE {z.zone}  →
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(0,0,0,0.25)', letterSpacing: '0.15em' }}>
            LOST AND FOUND: LEVEL 2 — LEVEL 2 DOES NOT EXIST
          </div>
        </div>
      )}

      {/* VENDING MACHINES */}
      {view === 'vending' && (
        <div style={{
          position: 'absolute', inset: '60px 0 80px',
          background: '#fff0f5',
          display: 'flex', flexDirection: 'column',
          borderTop: `6px solid ${ZONE_COLORS.vending.bg}`,
        }}>
          <div style={{
            padding: '20px 32px 16px',
            background: ZONE_COLORS.vending.bg,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 20, color: '#fff', letterSpacing: '0.1em' }}>VENDING MACHINES</div>
              <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: '0.12em' }}>
                ZONE A · ROW C · PURCHASES: {vendPurchases}
              </div>
            </div>
            <button
              onClick={() => { setView('main'); setVendIdx(null); setVendResponse('') }}
              style={{
                background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)',
                color: '#fff', fontFamily: '"Arial Black", sans-serif', fontSize: 11,
                padding: '6px 18px', cursor: 'pointer', letterSpacing: '0.1em',
              }}
            >
              ← BACK
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {VEND_ITEMS.map((item, i) => (
                <div key={i} style={{
                  background: vendIdx === i ? '#fff' : '#fff',
                  border: `3px solid ${vendIdx === i ? ZONE_COLORS.vending.bg : '#e0d0d8'}`,
                  boxShadow: vendIdx === i ? `4px 4px 0 ${ZONE_COLORS.vending.bg}` : '4px 4px 0 #ddd',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  transition: 'all 0.15s',
                }}>
                  {/* Machine screen */}
                  <div style={{
                    background: vendIdx === i ? '#1a0010' : '#0d0008',
                    padding: '14px 12px', minHeight: 72,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: `2px solid ${vendIdx === i ? ZONE_COLORS.vending.bg : '#333'}`,
                  }}>
                    <div style={{
                      fontFamily: 'monospace', fontSize: 10,
                      color: vendIdx === i ? ZONE_COLORS.vending.light : 'rgba(255,133,175,0.5)',
                      textAlign: 'center', letterSpacing: '0.08em', lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {vendIdx === i ? vendResponse : item.label}
                    </div>
                  </div>
                  {/* Price + button */}
                  <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                    <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#666', letterSpacing: '0.05em' }}>{item.price}</span>
                    <button
                      onClick={() => handleVend(i)}
                      style={{
                        background: ZONE_COLORS.vending.bg, border: 'none',
                        color: '#fff', fontFamily: '"Arial Black", sans-serif',
                        fontSize: 9, padding: '5px 12px', cursor: 'pointer',
                        letterSpacing: '0.1em',
                      }}
                    >
                      SELECT
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {vendPurchases >= 6 && (
              <div
                onClick={() => navigateTo(13, { type: 'vortex' })}
                style={{
                  marginTop: 20, padding: '16px', background: '#1a0010',
                  border: `3px solid ${ZONE_COLORS.vending.bg}`,
                  cursor: 'pointer', textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 11, color: ZONE_COLORS.vending.light, letterSpacing: '0.15em' }}>
                  ⚠ MACHINE C-7 MALFUNCTION — DO NOT APPROACH
                </div>
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(255,133,175,0.5)', marginTop: 6 }}>
                  (the spiral is visible from here)
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOD COURT */}
      {view === 'food' && (
        <div style={{
          position: 'absolute', inset: '60px 0 80px',
          background: '#fffbf0',
          display: 'flex', flexDirection: 'column',
          borderTop: `6px solid ${ZONE_COLORS.food.bg}`,
        }}>
          <div style={{
            padding: '20px 32px 16px',
            background: ZONE_COLORS.food.bg,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 20, color: '#fff', letterSpacing: '0.1em' }}>FOOD COURT</div>
              <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: '0.12em' }}>
                ZONE B · LEVEL 2 (THIS IS LEVEL 1)
              </div>
            </div>
            <button
              onClick={() => setView('main')}
              style={{
                background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)',
                color: '#fff', fontFamily: '"Arial Black", sans-serif', fontSize: 11,
                padding: '6px 18px', cursor: 'pointer', letterSpacing: '0.1em',
              }}
            >
              ← BACK
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            {/* Menu board */}
            <div style={{
              background: '#1a1200', border: `3px solid ${ZONE_COLORS.food.bg}`,
              padding: '20px 24px', marginBottom: 24,
              boxShadow: `6px 6px 0 ${ZONE_COLORS.food.bg}40`,
            }}>
              <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 12, color: ZONE_COLORS.food.light, letterSpacing: '0.2em', marginBottom: 16, textAlign: 'center' }}>
                TODAY&apos;S MENU
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {FOOD_ITEMS.map((item, i) => (
                  <div key={i} style={{
                    padding: '12px', background: 'rgba(255,149,0,0.08)',
                    border: '1px solid rgba(255,149,0,0.2)',
                  }}>
                    <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 11, color: ZONE_COLORS.food.light, marginBottom: 4, lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>
                      {item.name}
                    </div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(255,204,102,0.5)', marginBottom: 6, fontStyle: 'italic' }}>{item.desc}</div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, color: ZONE_COLORS.food.light }}>{item.price}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              onClick={() => navigateTo(9, { type: 'expand-white' })}
              style={{
                padding: '16px 20px', background: '#fff',
                border: `3px dashed ${ZONE_COLORS.food.bg}`,
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 12, color: ZONE_COLORS.food.bg, letterSpacing: '0.1em' }}>
                  CASHIER WINDOW
                </div>
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(0,0,0,0.35)', marginTop: 4, letterSpacing: '0.08em' }}>
                  CURRENTLY UNMANNED · OR MAYBE OVERMANNED · → CONTACT PAGE (SOMEWHERE THAT WAY)
                </div>
              </div>
              <div style={{
                background: ZONE_COLORS.food.bg, color: '#fff',
                fontFamily: '"Arial Black", sans-serif', fontSize: 10,
                padding: '8px 16px', letterSpacing: '0.1em',
              }}>
                OPEN →
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANNEQUIN GALLERY */}
      {view === 'mannequins' && (
        <div style={{
          position: 'absolute', inset: '60px 0 80px',
          background: '#f0f8ff',
          display: 'flex', flexDirection: 'column',
          borderTop: `6px solid ${ZONE_COLORS.mannequins.bg}`,
        }}>
          <div style={{
            padding: '20px 32px 16px',
            background: ZONE_COLORS.mannequins.bg,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 20, color: '#fff', letterSpacing: '0.1em' }}>MANNEQUIN GALLERY</div>
              <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: '0.12em' }}>
                ZONE C · SECTION 4 · MOVE YOUR CURSOR
              </div>
            </div>
            <button
              onClick={() => { setView('main'); setMannResponse(null) }}
              style={{
                background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)',
                color: '#fff', fontFamily: '"Arial Black", sans-serif', fontSize: 11,
                padding: '6px 18px', cursor: 'pointer', letterSpacing: '0.1em',
              }}
            >
              ← BACK
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 32px' }}>
            {/* Display window */}
            <div style={{
              flex: 1, background: '#1a2a30',
              border: `4px solid ${ZONE_COLORS.mannequins.bg}`,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              padding: '20px 40px', gap: 40,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Store window reflection */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(144,224,239,0.05) 0%, transparent 60%)',
                pointerEvents: 'none',
              }} />

              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  onClick={() => handleMannequin(i)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    cursor: 'pointer',
                    opacity: mannIdx === i && mannResponse ? 1 : 0.75,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    {/* Head */}
                    <div
                      ref={el => { mannRefs.current[i] = el }}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#e8e0d0',
                        border: `2px solid ${ZONE_COLORS.mannequins.bg}`,
                        marginBottom: 2,
                        transform: `rotate(${mannAngles[i]}deg)`,
                        transition: 'transform 0.05s linear',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                        boxShadow: mannIdx === i && mannResponse ? `0 0 20px ${ZONE_COLORS.mannequins.bg}` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#333' }} />
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#333' }} />
                      </div>
                      {/* Speech bubble */}
                      {mannIdx === i && mannResponse && (
                        <div style={{
                          position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)',
                          background: '#fff', border: `2px solid ${ZONE_COLORS.mannequins.bg}`,
                          padding: '8px 14px', whiteSpace: 'pre-wrap',
                          fontFamily: 'Arial, sans-serif', fontSize: 10,
                          color: '#1a2a30', letterSpacing: '0.04em', lineHeight: 1.6,
                          zIndex: 10, minWidth: 140, textAlign: 'center',
                          boxShadow: `3px 3px 0 ${ZONE_COLORS.mannequins.bg}`,
                        }}>
                          {mannResponse}
                        </div>
                      )}
                    </div>
                    {/* Neck */}
                    <div style={{ width: 4, height: 10, background: '#c8c0b0', margin: '0 auto 2px' }} />
                    {/* Body */}
                    <div style={{
                      width: 40, height: 70,
                      background: i % 2 === 0 ? '#e8102a' : '#0066cc',
                      border: `2px solid ${i % 2 === 0 ? '#cc0022' : '#004499'}`,
                    }} />
                    {/* Legs */}
                    <div style={{ display: 'flex', gap: 4, margin: '2px auto 0', width: 40 }}>
                      <div style={{ flex: 1, height: 50, background: '#555' }} />
                      <div style={{ flex: 1, height: 50, background: '#555' }} />
                    </div>
                    {/* Feet */}
                    <div style={{ display: 'flex', gap: 4, margin: '0 auto', width: 44 }}>
                      <div style={{ flex: 1, height: 8, background: '#222' }} />
                      <div style={{ flex: 1, height: 8, background: '#222' }} />
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(144,224,239,0.6)',
                    marginTop: 10, letterSpacing: '0.15em',
                  }}>
                    UNIT {String.fromCharCode(65 + i)}
                  </div>
                </div>
              ))}
            </div>

            <div
              onClick={() => navigateTo(11, { type: 'scatter' })}
              style={{
                marginTop: 12, padding: '12px 20px',
                background: ZONE_COLORS.mannequins.bg,
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 11, color: '#fff', letterSpacing: '0.1em' }}>
                FITTING ROOM ARCADE — OUT OF ORDER — ENTER ANYWAY
              </span>
              <span style={{ color: '#fff', fontSize: 16 }}>→</span>
            </div>
          </div>
        </div>
      )}

      {/* ESCALATOR */}
      {view === 'escalator' && (
        <div style={{
          position: 'absolute', inset: '60px 0 80px',
          background: '#f5f0ff',
          display: 'flex', flexDirection: 'column',
          borderTop: `6px solid ${ZONE_COLORS.escalator.bg}`,
        }}>
          <div style={{
            padding: '20px 32px 16px',
            background: ZONE_COLORS.escalator.bg,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 20, color: '#fff', letterSpacing: '0.1em' }}>ESCALATOR</div>
              <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: '0.12em' }}>
                ZONE D · DESTINATION: {escUsed === 0 ? 'LEVEL 2' : escUsed === 1 ? 'CALCULATING...' : 'UNRESOLVABLE'}
              </div>
            </div>
            <button
              onClick={() => setView('main')}
              style={{
                background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)',
                color: '#fff', fontFamily: '"Arial Black", sans-serif', fontSize: 11,
                padding: '6px 18px', cursor: 'pointer', letterSpacing: '0.1em',
              }}
            >
              ← BACK
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: 32 }}>
            {/* Escalator visual */}
            <div style={{
              width: 200, background: '#1a1030',
              border: `4px solid ${ZONE_COLORS.escalator.bg}`,
              overflow: 'hidden', height: 160, position: 'relative',
              boxShadow: `6px 6px 0 ${ZONE_COLORS.escalator.bg}40`,
            }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  height: 16,
                  top: `${i * 16}px`,
                  background: i % 2 === 0 ? 'rgba(123,45,139,0.3)' : 'rgba(199,125,255,0.1)',
                  borderBottom: `1px solid ${ZONE_COLORS.escalator.bg}40`,
                  animation: `escMove ${1.5 + i * 0.1}s linear infinite`,
                }} />
              ))}
              <div style={{
                position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                fontFamily: '"Arial Black", sans-serif', fontSize: 10, color: ZONE_COLORS.escalator.light,
                letterSpacing: '0.1em', textShadow: `0 0 10px ${ZONE_COLORS.escalator.light}`,
              }}>
                ↑ ↑ ↑
              </div>
            </div>

            {escWarning && (
              <div style={{
                background: escUsed >= 3 ? ZONE_COLORS.escalator.bg : '#1a1030',
                border: `2px solid ${ZONE_COLORS.escalator.bg}`,
                padding: '10px 20px',
                fontFamily: '"Arial Black", sans-serif', fontSize: 12,
                color: ZONE_COLORS.escalator.light, letterSpacing: '0.1em', textAlign: 'center',
              }}>
                {escWarning}
              </div>
            )}

            <button
              onClick={handleEscalator}
              style={{
                background: ZONE_COLORS.escalator.bg,
                border: 'none', color: '#fff',
                fontFamily: '"Arial Black", sans-serif', fontSize: 16,
                padding: '16px 48px', cursor: 'pointer', letterSpacing: '0.15em',
                boxShadow: `6px 6px 0 ${ZONE_COLORS.escalator.bg}60`,
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translate(-2px,-2px)'
                e.currentTarget.style.boxShadow = `8px 8px 0 ${ZONE_COLORS.escalator.bg}60`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translate(0,0)'
                e.currentTarget.style.boxShadow = `6px 6px 0 ${ZONE_COLORS.escalator.bg}60`
              }}
            >
              {escUsed === 0 ? '↑  RIDE' : escUsed === 1 ? '↑  PROCEED' : '↑  DEPART (RANDOM)'}
            </button>

            <div style={{
              fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(0,0,0,0.3)',
              letterSpacing: '0.12em', textAlign: 'center', lineHeight: 2,
            }}>
              NOTE: THIS ESCALATOR TRAVELS SIDEWAYS<br />
              MANAGEMENT NOT RESPONSIBLE FOR DIMENSIONAL DRIFT
            </div>
          </div>
        </div>
      )}

      {/* Floor directory strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
        background: '#1a1a2e',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48,
        borderTop: '3px solid #333',
        zIndex: 5,
      }}>
        {[
          { label: 'ZONE A', color: ZONE_COLORS.vending.bg },
          { label: 'ZONE B', color: ZONE_COLORS.food.bg },
          { label: 'ZONE C', color: ZONE_COLORS.mannequins.bg },
          { label: 'ZONE D', color: ZONE_COLORS.escalator.bg },
        ].map(z => (
          <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, background: z.color }} />
            <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em' }}>
              {z.label}
            </span>
          </div>
        ))}
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 8, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>
          HOURS: ALWAYS / NEVER
        </div>
      </div>

      <style>{`
        @keyframes paSlide { 0% { opacity:0; transform: translateY(-8px) } 8% { opacity:1; transform: translateY(0) } 92% { opacity:1 } 100% { opacity:0 } }
        @keyframes paBlink { 0%, 100% { opacity:1 } 50% { opacity:0 } }
        @keyframes escMove { 0% { transform: translateY(-16px) } 100% { transform: translateY(0) } }
      `}</style>
      <HomeButton />
    </div>
  )
}
