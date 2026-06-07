'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

const PA_ANNOUNCEMENTS = [
  'Attention shoppers: the mall closes in thirty minutes. Or an hour. Time moves differently here.',
  'Could the owner of a white vehicle please return to the food court. Or not. It doesn\'t matter.',
  'We are experiencing a temporary shortage of certainty in aisle seven. Normal levels expected to resume eventually.',
  'The record store is currently accepting submissions. All formats welcome.',
  'Reminder: the checkout experience is entirely optional. The receipt is real regardless.',
  'Attention: the gap between things has relocated to its permanent home. See directional signage.',
  'A found object has been turned in to the information desk. It may be yours. It may not.',
]

const SOFTWARE_BOXES = [
  { name: 'DIGGER v1.0', desc: 'Music Discovery Engine', req: 'Requires: curiosity, music', year: '2024', color: '#1a2a4a' },
  { name: 'TRAIL LOGGER', desc: 'Personal Running Analytics', req: 'Requires: legs, elevation', year: '2024', color: '#0a2a1a' },
  { name: 'THIS SITE', desc: 'Anti-Portfolio System', req: 'Requires: lost time, 9 worlds', year: '2025', color: '#2a1a0a' },
  { name: 'SIGNAL NOISE', desc: 'Audio Synthesis Lab', req: 'Requires: headphones, patience', year: '2025', color: '#1a0a2a' },
  { name: 'PIXEL QUEST', desc: 'Wrong dimension. Too many colors.', req: 'Requires: arrow keys, denial', year: '2025', color: '#ff006e' },
]

const TIMELINE_TRACKS = [
  { title: 'PROLOGUE: THE MIDWEST', duration: '2:47' },
  { title: 'FIRST COMMIT', duration: '3:12' },
  { title: 'THE RELOCATION', duration: '4:33' },
  { title: 'ABOVE TREELINE (FEAT. WIND)', duration: '2:58' },
  { title: 'DEBUGGING AT 3AM', duration: '5:01' },
  { title: 'DIGGER LAUNCHES', duration: '3:44' },
  { title: 'BOULDER MARATHON (REPRISE)', duration: '3:41' },
  { title: 'WHAT THE CANYON LOOKS LIKE', duration: '6:22' },
  { title: 'THE CURRENT THING', duration: '∞' },
]

const BUILDER_PRODUCTS = [
  { sku: 'APP-001', name: 'Full-Stack Web Application', desc: 'Complete functional application, customer-facing. Includes frontend, backend, deployment pipeline. Some assembly required.', price: '$contact' },
  { sku: 'INT-002', name: 'Interactive Experience', desc: 'Unusual digital artifact. May include 3D rendering, audio synthesis, or things that respond to cursor position. Customer unable to predict outcome.', price: '$contact' },
  { sku: 'SYS-003', name: 'Technical Architecture Review', desc: 'Second opinion on system design. Warning: may result in difficult conversations about scope.', price: '$contact' },
  { sku: 'COL-004', name: 'Collaboration (Ongoing)', desc: 'Sustained engagement on a problem worth solving. Best results when problem is interesting and customer has strong opinions.', price: '$discuss' },
]

type Store = 'none' | 'system_logic' | 'gap_between' | 'records' | 'builder'

function GapBetweenStore({ onBack, navigateTo }: { onBack: () => void; navigateTo: ReturnType<typeof useWorldStore.getState>['navigateTo'] }) {
  const [clicks, setClicks] = useState(0)
  return (
    <div style={{ position: 'absolute', inset: '70px 0 60px', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40 }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 16, right: 24, background: 'none', border: '1px solid rgba(200,180,100,0.2)', color: 'rgba(200,180,100,0.5)', fontFamily: '"Pirata One", serif', fontSize: 11, padding: '4px 14px', cursor: 'pointer', letterSpacing: '0.1em' }}>← BACK</button>
      <div style={{ display: 'flex', gap: 60, alignItems: 'flex-end' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: i % 2 === 0 ? 'scaleX(-1)' : 'scaleX(1)' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(200,180,100,0.15)', border: '1px solid rgba(200,180,100,0.1)' }} />
            <div style={{ width: 3, height: 12, background: 'rgba(200,180,100,0.1)' }} />
            <div style={{ width: 30, height: 50, background: 'rgba(200,180,100,0.08)', border: '1px solid rgba(200,180,100,0.06)' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 10, height: 35, background: 'rgba(200,180,100,0.07)' }} />
              <div style={{ width: 10, height: 35, background: 'rgba(200,180,100,0.07)' }} />
            </div>
          </div>
        ))}
      </div>
      <div
        onClick={() => {
          const next = clicks + 1
          setClicks(next)
          if (next >= 3) navigateTo(13, { type: 'vortex' })
        }}
        style={{ fontFamily: '"Pirata One", serif', fontSize: 11, color: clicks > 0 ? 'rgba(200,180,100,0.35)' : 'rgba(200,180,100,0.2)', letterSpacing: '0.2em', textAlign: 'center', cursor: 'pointer', maxWidth: 360, lineHeight: 1.8 }}
      >
        THEY ARE LOOKING AT SOMETHING YOU CAN&apos;T SEE FROM HERE
        {clicks > 0 && clicks < 3 && (
          <div style={{ fontFamily: 'monospace', fontSize: 8, marginTop: 8, opacity: 0.5 }}>{3 - clicks} more</div>
        )}
      </div>
      <button
        onClick={() => navigateTo(14, { type: 'chromatic' })}
        style={{
          position: 'absolute',
          bottom: 56,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg, #FF006E, #FFBE0B, #06FFA5)',
          border: '2px solid rgba(0,0,0,0.5)',
          color: '#000',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 6,
          letterSpacing: '0.1em',
          padding: '8px 12px',
          cursor: 'pointer',
        }}
      >
        PIXEL QUEST
      </button>
      <button
        onClick={() => navigateTo(11, { type: 'scatter' })}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,0,100,0.06)',
          border: '1px solid rgba(255,0,100,0.15)',
          color: 'rgba(255,100,150,0.35)',
          fontFamily: 'monospace',
          fontSize: 8,
          letterSpacing: '0.2em',
          padding: '6px 12px',
          cursor: 'pointer',
        }}
      >
        ARCADE · OUT OF ORDER (click anyway)
      </button>
    </div>
  )
}

function Receipt({ onClose }: { onClose: () => void }) {
  const now = new Date()
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div
        style={{ background: '#fafaf5', width: 320, padding: '30px 28px', fontFamily: '"Pirata One", serif', boxShadow: '3px 3px 0 rgba(0,0,0,0.3)', cursor: 'default' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '1px dashed rgba(0,0,0,0.2)', paddingBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.2em' }}>BUILDER OF THINGS</div>
          <div style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.15em', marginTop: 4 }}>Boulder, CO · {now.toLocaleDateString()}</div>
        </div>
        <div style={{ fontSize: 12, lineHeight: 2.2, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Experience</span><span>5+ years</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Location</span><span>Boulder, CO</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Languages</span><span>TS / Python / SQL</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Frameworks</span><span>Next.js / React</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Miles run</span><span>uncounted</span>
          </div>
        </div>
        <div style={{ borderTop: '1px dashed rgba(0,0,0,0.2)', paddingTop: 16, fontSize: 11, color: 'rgba(0,0,0,0.5)', fontStyle: 'italic', lineHeight: 1.7, textAlign: 'center' }}>
          Building things that work and feel like something.<br />healthreinvented@gmail.com
        </div>
        <button onClick={onClose} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: '1px solid rgba(0,0,0,0.2)', padding: '6px 20px', fontFamily: '"Pirata One", serif', fontSize: 11, cursor: 'pointer', letterSpacing: '0.1em' }}>CLOSE</button>
      </div>
    </div>
  )
}

export default function World7Mall() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [activeStore, setActiveStore] = useState<Store>('none')
  const [paMsg, setPaMsg] = useState('')
  const [paVisible, setPaVisible] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [albumPlaying, setAlbumPlaying] = useState<number | null>(null)

  useEffect(() => {
    let idx = 0
    const showPA = () => {
      const msg = PA_ANNOUNCEMENTS[idx % PA_ANNOUNCEMENTS.length]
      idx++
      setPaMsg(msg)
      setPaVisible(true)
      setTimeout(() => setPaVisible(false), 8000)
    }
    const first = setTimeout(showPA, 3000)
    const iv = setInterval(showPA, 240000)
    return () => { clearTimeout(first); clearInterval(iv) }
  }, [])

  return (
    <div data-world="7" style={{ position: 'fixed', inset: 0, background: '#1a1410', fontFamily: '"Pirata One", serif', overflow: 'hidden' }}>
      {/* Ceiling grid / skylights */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: 'repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,180,100,0.04) 80px, rgba(200,180,100,0.04) 82px)', borderBottom: '1px solid rgba(200,180,100,0.06)' }} />

      {/* Mall header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <div style={{ fontSize: 22, color: 'rgba(200,180,100,0.5)', letterSpacing: '0.3em' }}>SIGNAL RIDGE MALL</div>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(200,180,100,0.2)', letterSpacing: '0.2em' }}>EST. 1993 · CLOSED SUNDAYS · PERMANENTLY</div>
      </div>

      {/* PA announcement */}
      {paVisible && (
        <div style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(200,180,100,0.2)',
          padding: '8px 24px', zIndex: 50,
          fontFamily: '"Pirata One", serif', fontSize: 12, color: 'rgba(200,180,100,0.7)',
          letterSpacing: '0.05em', maxWidth: '80vw', textAlign: 'center',
          animation: 'paFade 8s both',
        }}>
          📢 {paMsg}
        </div>
      )}

      {/* Store fronts */}
      {activeStore === 'none' && (
        <div style={{ position: 'absolute', inset: '70px 0 60px', display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 0 }}>
          {[
            { id: 'system_logic' as Store, name: 'SYSTEM LOGIC', sub: 'Software Est. 2019', color: '#1a2a3a', open: true },
            { id: 'gap_between' as Store, name: 'THE GAP BETWEEN', sub: '· · ·', color: '#0d0d0d', open: true },
            { id: 'records' as Store, name: 'CURIOUS BY DEFAULT\nRECORDS', sub: 'Music + Memory', color: '#1a0a2a', open: true },
            { id: 'builder' as Store, name: 'BUILDER OF THINGS', sub: 'Est. when it was necessary', color: '#1a1a0a', open: true },
          ].map((store, i) => (
            <div
              key={store.id}
              onClick={() => setActiveStore(store.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'space-between',
                background: store.color,
                border: '2px solid rgba(200,180,100,0.1)',
                cursor: 'pointer', padding: '40px 20px 20px',
                transition: 'background 0.2s, border-color 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Store window display */}
              <div style={{ width: '70%', paddingTop: '45%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(200,180,100,0.08)', position: 'relative', marginBottom: 16 }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                  {i === 0 && SOFTWARE_BOXES.slice(0, 2).map(b => (
                    <div key={b.name} style={{ width: '40%', height: 20, background: b.color, border: '1px solid rgba(200,180,100,0.15)', fontSize: 6, color: 'rgba(200,180,100,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.1em' }}>{b.name.split(' ')[0]}</div>
                  ))}
                  {i === 1 && (
                    <div style={{ width: '80%', display: 'flex', gap: 8, justifyContent: 'space-around' }}>
                      {[0, 1, 2].map(j => (
                        <div key={j} style={{ width: 8, height: 32, background: 'rgba(200,180,100,0.08)', transform: `rotate(${[15, -10, 5][j]}deg)` }} />
                      ))}
                    </div>
                  )}
                  {i === 2 && (
                    <div style={{ fontSize: 7, color: 'rgba(200,180,100,0.3)', textAlign: 'center', lineHeight: 1.8 }}>
                      {TIMELINE_TRACKS.slice(0, 2).map(t => <div key={t.title}>{t.title.slice(0, 20)}</div>)}
                    </div>
                  )}
                  {i === 3 && BUILDER_PRODUCTS.slice(0, 2).map(p => (
                    <div key={p.sku} style={{ fontSize: 7, color: 'rgba(200,180,100,0.3)', letterSpacing: '0.1em' }}>{p.name.slice(0, 16)}</div>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, color: 'rgba(200,180,100,0.8)', letterSpacing: '0.15em', lineHeight: 1.2, whiteSpace: 'pre-wrap', marginBottom: 6 }}>{store.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,180,100,0.25)', letterSpacing: '0.15em' }}>{store.sub}</div>
              </div>

              <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'rgba(100,200,120,0.5)', boxShadow: '0 0 8px rgba(100,200,120,0.4)' }} />
            </div>
          ))}
        </div>
      )}

      {/* Store interiors */}
      {activeStore === 'system_logic' && (
        <div style={{ position: 'absolute', inset: '70px 0 60px', background: '#0d1a2a', padding: 32, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 18, color: 'rgba(100,150,255,0.8)', letterSpacing: '0.2em' }}>SYSTEM LOGIC · SOFTWARE SHELF</div>
            <button onClick={() => setActiveStore('none')} style={{ background: 'none', border: '1px solid rgba(200,180,100,0.2)', color: 'rgba(200,180,100,0.5)', fontFamily: '"Pirata One", serif', fontSize: 11, padding: '4px 14px', cursor: 'pointer', letterSpacing: '0.1em' }}>← BACK</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {SOFTWARE_BOXES.map(box => (
              <div key={box.name} style={{ background: box.color, border: '2px solid rgba(100,150,255,0.15)', padding: 16, position: 'relative', cursor: 'default' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: 80, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.15em', color: 'rgba(100,150,255,0.4)' }}>≡≡≡ {box.year} ≡≡≡</div>
                </div>
                <div style={{ marginTop: 88 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6, lineHeight: 1.2 }}>{box.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{box.desc}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(100,150,255,0.4)', letterSpacing: '0.08em' }}>{box.req}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStore === 'gap_between' && (
        <GapBetweenStore onBack={() => setActiveStore('none')} navigateTo={navigateTo} />
      )}

      {activeStore === 'records' && (
        <div style={{ position: 'absolute', inset: '70px 0 60px', background: '#0d0814', padding: 32, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 18, color: 'rgba(180,100,255,0.8)', letterSpacing: '0.2em' }}>CURIOUS BY DEFAULT RECORDS</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(180,100,255,0.3)', marginTop: 4, letterSpacing: '0.15em' }}>A TYLER EMDUR TIMELINE — FULL LENGTH LP</div>
            </div>
            <button onClick={() => setActiveStore('none')} style={{ background: 'none', border: '1px solid rgba(200,180,100,0.2)', color: 'rgba(200,180,100,0.5)', fontFamily: '"Pirata One", serif', fontSize: 11, padding: '4px 14px', cursor: 'pointer', letterSpacing: '0.1em' }}>← BACK</button>
          </div>

          {/* Album cover */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
            <div style={{ width: 160, height: 160, background: 'linear-gradient(135deg, #1a0a2a, #0a1a2a)', border: '1px solid rgba(180,100,255,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-conic-gradient(rgba(180,100,255,0.05) 0deg, transparent 1deg, transparent 9deg, rgba(180,100,255,0.05) 10deg)', borderRadius: '50%', width: '70%', height: '70%', top: '15%', left: '15%' }} />
              <div style={{ fontSize: 10, color: 'rgba(180,100,255,0.6)', letterSpacing: '0.2em', textAlign: 'center', lineHeight: 1.6 }}>
                CURIOUS<br />BY DEFAULT
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 8, lineHeight: 1.3 }}>A TYLER EMDUR TIMELINE</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(180,100,255,0.4)', letterSpacing: '0.1em', marginBottom: 8 }}>{TIMELINE_TRACKS.length} TRACKS · BOULDER, CO · 2025</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, fontStyle: 'italic', maxWidth: 300 }}>
                From the midwest to the mountains. Software, trails, and the space between deployments.
              </div>
            </div>
          </div>

          {/* Track listing */}
          <div style={{ border: '1px solid rgba(180,100,255,0.1)' }}>
            {TIMELINE_TRACKS.map((track, i) => (
              <div
                key={i}
                onClick={() => setAlbumPlaying(albumPlaying === i ? null : i)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: i < TIMELINE_TRACKS.length - 1 ? '1px solid rgba(180,100,255,0.06)' : 'none',
                  background: albumPlaying === i ? 'rgba(180,100,255,0.06)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(180,100,255,0.3)', width: 20 }}>{(i + 1).toString().padStart(2, '0')}</div>
                  <div style={{ fontSize: 13, color: albumPlaying === i ? 'rgba(180,100,255,0.9)' : 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>{track.title}</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(180,100,255,0.4)' }}>{track.duration}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStore === 'builder' && (
        <div style={{ position: 'absolute', inset: '70px 0 60px', background: '#100f05', padding: 32, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 18, color: 'rgba(200,180,80,0.8)', letterSpacing: '0.2em' }}>BUILDER OF THINGS</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowReceipt(true)} style={{ background: 'rgba(200,180,80,0.1)', border: '1px solid rgba(200,180,80,0.3)', color: 'rgba(200,180,80,0.7)', fontFamily: '"Pirata One", serif', fontSize: 11, padding: '4px 14px', cursor: 'pointer', letterSpacing: '0.1em' }}>CHECKOUT</button>
              <button onClick={() => setActiveStore('none')} style={{ background: 'none', border: '1px solid rgba(200,180,100,0.2)', color: 'rgba(200,180,100,0.5)', fontFamily: '"Pirata One", serif', fontSize: 11, padding: '4px 14px', cursor: 'pointer', letterSpacing: '0.1em' }}>← BACK</button>
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(200,180,80,0.3)', letterSpacing: '0.15em', marginBottom: 24 }}>HANDCRAFTED SOLUTIONS · BOULDER, CO · EST. WHEN NECESSARY</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {BUILDER_PRODUCTS.map(product => (
              <div key={product.sku} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(200,180,80,0.12)', padding: 20 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,180,80,0.3)', letterSpacing: '0.15em', marginBottom: 8 }}>SKU: {product.sku}</div>
                <div style={{ fontSize: 14, color: 'rgba(200,180,80,0.8)', marginBottom: 10, lineHeight: 1.2 }}>{product.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, marginBottom: 12 }}>{product.desc}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(200,180,80,0.6)', letterSpacing: '0.1em' }}>{product.price}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, padding: 20, border: '1px solid rgba(200,180,80,0.08)', fontFamily: 'monospace', fontSize: 10, color: 'rgba(200,180,80,0.25)', lineHeight: 2, letterSpacing: '0.05em' }}>
            All items subject to availability. "Availability" defined as: whether the problem is interesting enough.<br />
            Contact: healthreinvented@gmail.com
          </div>
        </div>
      )}

      {/* Mall floor */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(200,180,100,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(200,180,100,0.15)', letterSpacing: '0.15em' }}>DIRECTORY: YOU ARE HERE</div>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(200,180,100,0.1)', letterSpacing: '0.1em' }}>FOOD COURT: LEVEL 2 (DOES NOT EXIST)</div>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(200,180,100,0.15)', letterSpacing: '0.15em' }}>EXITS: MULTIPLE</div>
      </div>

      {showReceipt && <Receipt onClose={() => setShowReceipt(false)} />}

      <style>{`
        @keyframes paFade { 0% { opacity: 0 } 10% { opacity: 1 } 80% { opacity: 1 } 100% { opacity: 0 } }
      `}</style>
      <HomeButton />
    </div>
  )
}
