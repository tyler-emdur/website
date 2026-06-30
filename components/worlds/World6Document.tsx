'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ─── PINNED ITEMS ON CORKBOARD ──────────────────────────────────────────────

interface PinItem {
  id: string
  x: number
  y: number
  rot: number
  type: 'doc' | 'photo' | 'card' | 'note' | 'redacted'
  title?: string
  body: string
  redactedBody?: string    // shown until unredacted
  unredacted?: boolean
  pinColor?: string
  worldId?: number
  portal?: string
}

const INITIAL_ITEMS: PinItem[] = [
  {
    id: 'doc1', x: 60, y: 60, rot: -2.1,
    type: 'doc', title: 'PRELIMINARY OBSERVATIONS',
    body: `The individual presents as someone who builds things. Not merely assembles — builds. There is a distinction which the committee has noted but which resists articulation.

Observed in Boulder, Colorado. Altitude: 5,430 ft. Whether altitude is relevant to observed behaviors remains an open question.

The work exists. The commits have timestamps. The trails have been run. These are facts.`,
    pinColor: '#cc2222',
  },
  {
    id: 'doc2', x: 360, y: 45, rot: 1.4,
    type: 'doc', title: 'TECHNICAL INVENTORY',
    body: `Primary stack: Next.js 15, TypeScript (strict), Three.js, React Three Fiber, Zustand, Canvas 2D API.

Projects shipped: Digger (music discovery, 2024), this website (in progress).

Preferred environment: terminal, dark theme, JetBrains Mono, a problem that isn't solved yet.

Note: list is incomplete by design.`,
    pinColor: '#2244cc',
  },
  {
    id: 'redact1', x: 600, y: 70, rot: 0.8,
    type: 'redacted',
    title: 'SUBJECT CONTACT INFORMATION',
    redactedBody: `Full name: ████████ ██████
Email: ████████████████████████████
GitHub: ████████████
Location: ████████████, CO`,
    body: `Full name: Tyler Emdur
Email: healthreinvented@gmail.com
GitHub: tyler-emdur
Location: Boulder, CO`,
    pinColor: '#cc8822',
  },
  {
    id: 'photo1', x: 130, y: 280, rot: 3.5,
    type: 'photo', title: 'PIKES PEAK · AUG 2024',
    body: '14,115 ft · summit attempt\nwake-up: 3:00am\ntrailhead: 4:15am\nsummit: 9:40am\nnotes: "worth it"',
    pinColor: '#228844',
  },
  {
    id: 'photo2', x: 500, y: 270, rot: -1.8,
    type: 'photo', title: 'MT. ELBERT · 2023',
    body: `14,439 ft — highest in Colorado
Rocky Mountain National Park region
Party of two. No incidents.
"The light above treeline is different."`,
    pinColor: '#228844',
  },
  {
    id: 'note1', x: 290, y: 290, rot: -0.7,
    type: 'note',
    body: `Frequency 88.7 appears across multiple files. Cross-reference with:
— Depth sector 02
— Corridor wall stamp
— Mall PA system
— Dial world

Significance: UNKNOWN`,
    pinColor: '#bbaa00',
  },
  {
    id: 'note2', x: 680, y: 310, rot: 2.2,
    type: 'note',
    body: `40.0150°N 105.2705°W
→ Boulder, CO
→ Also appears in: depth readout, field station map, corridor stamp
Why the same coordinates?`,
    pinColor: '#bbaa00',
  },
  {
    id: 'card1', x: 80, y: 480, rot: -1.3,
    type: 'card', title: 'REF: BEHAVIORAL NOTE',
    body: `Subject demonstrates "compulsive building." Projects are completed. Some are shipped.

The distinction between done and good enough to ship appears resolved.

Subject remained awake until 3am on a work product nobody requested. First response from viewer: "wait, how did you do that?" Subject found this sufficient.`,
    pinColor: '#cc2222',
  },
  {
    id: 'card2', x: 400, y: 490, rot: 1.9,
    type: 'card', title: 'RUNNING LOG (PARTIAL)',
    body: `Boulder Marathon — 3:41:22 — Oct 2024
Golden Gate Canyon 25K — muddy, completed
Maroon Bells loop — Sep 2023, 5:00am start
Pikes Peak — see photo
Mt. Elbert — see photo

Pattern: voluntary difficulty.`,
    pinColor: '#2244cc',
  },
  {
    id: 'redact2', x: 660, y: 475, rot: -2.4,
    type: 'redacted',
    title: 'COMMITTEE CONCLUSION',
    redactedBody: `[REDACTED] builds things because [REDACTED] in the process teaches something that can't be taught any other way.

This is also true of [REDACTED] and of going up past treeline where [REDACTED].

Whether this is sufficient is [REDACTED].

The work is real. [REDACTED] have timestamps. [REDACTED] have been run.

You got here. [REDACTED].`,
    body: `Subject builds things because something in the process teaches something that can't be taught any other way.

This is also true of running and of going up past treeline where the wind is horizontal and personal.

Whether this is sufficient is not the committee's determination to make.

The work is real. The commits have timestamps. The trails have been run.

You got here. That's something.`,
    worldId: 8,
    portal: 'slide-right',
    pinColor: '#cc2222',
  },
]

// ─── STRING CONNECTIONS ──────────────────────────────────────────────────────
// [from_id, to_id, color]
const STRINGS: [string, string, string][] = [
  ['note1', 'doc1',    'rgba(200,60,30,0.65)'],
  ['note1', 'redact1', 'rgba(200,60,30,0.65)'],
  ['note2', 'doc1',    'rgba(180,140,20,0.55)'],
  ['note2', 'card1',   'rgba(200,60,30,0.55)'],
  ['doc2',  'card2',   'rgba(40,80,200,0.55)'],
  ['redact2','card1',  'rgba(190,30,30,0.65)'],
]

// ─── HELPER: pin shape ───────────────────────────────────────────────────────
function Pin({ color }: { color: string }) {
  return (
    <div style={{
      position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)',
      zIndex: 2,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, opacity: 0.6, margin: '0 auto' }} />
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function World6Document() {
  const [items, setItems] = useState<PinItem[]>(INITIAL_ITEMS.map(i => ({ ...i, unredacted: false })))
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [focused, setFocused] = useState<string | null>(null)
  const [revealProgress, setRevealProgress] = useState<Record<string, number>>({})
  const [expandedCard, setExpandedCard] = useState<PinItem | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Click: focus or start redaction reveal
  const handleItemClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFocused(f => f === id ? null : id)

    const item = items.find(i => i.id === id)
    if (item?.type === 'redacted' && !item.unredacted) {
      setRevealProgress(prev => {
        const cur = (prev[id] || 0) + 1
        if (cur >= 5) {
          setItems(its => its.map(it => it.id === id ? { ...it, unredacted: true } : it))
        }
        return { ...prev, [id]: Math.min(cur, 5) }
      })
    } else if (item?.type === 'redacted' && item.unredacted) {
      setExpandedCard(item)
    }
  }, [items])

  // Drag
  const handleMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(id)
    setFocused(id)
    const el = itemRefs.current[id]
    const item = items.find(i => i.id === id)!
    if (el) {
      const rect = el.getBoundingClientRect()
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
    setItems(its => {
      const maxZ = Math.max(...its.map(i => (i as PinItem & { z?: number }).z || 0))
      return its.map(i => i.id === id ? { ...i, z: maxZ + 1 } as PinItem : i)
    })
  }, [items])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging || !boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      setItems(its => its.map(i =>
        i.id === dragging
          ? { ...i, x: e.clientX - rect.left - dragOffset.x, y: e.clientY - rect.top - dragOffset.y }
          : i
      ))
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, dragOffset])

  // Compute string endpoints
  const getCenter = (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return { x: 0, y: 0 }
    const el = itemRefs.current[id]
    if (el) {
      const w = el.offsetWidth, h = el.offsetHeight
      return { x: item.x + w / 2, y: item.y + h / 2 }
    }
    return { x: item.x + 80, y: item.y + 60 }
  }

  const focusedItem = items.find(i => i.id === focused)

  return (
    <div
      data-world="6"
      style={{
        position: 'fixed', inset: 0,
        background: '#b89b72',
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'default',
      }}
      onClick={() => setFocused(null)}
    >
      {/* Cork texture overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, transparent 2px, transparent 8px, rgba(0,0,0,0.025) 10px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, transparent 3px, transparent 9px, rgba(255,255,255,0.03) 12px)`,
        backgroundSize: '14px 14px, 14px 14px',
      }} />
      {/* Subtle radial light source */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(255,255,255,0.08) 0%, transparent 70%)',
      }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50, pointerEvents: 'none', background: 'rgba(100,75,45,0.5)', borderBottom: '1px solid rgba(0,0,0,0.15)' }}>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, color: 'rgba(255,245,230,0.75)', letterSpacing: '0.3em' }}>
          INVESTIGATION FILE · SUBJECT: T.E. · CONFIDENTIAL
        </div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, color: 'rgba(255,245,230,0.45)', letterSpacing: '0.15em' }}>
          {items.filter(i => i.type === 'redacted' && i.unredacted).length}/{items.filter(i => i.type === 'redacted').length} REDACTIONS CLEARED
        </div>
      </div>

      {/* Canvas — dark, open space */}
      <div
        ref={boardRef}
        style={{
          position: 'absolute',
          top: 36, left: 0, right: 0, bottom: 0,
          overflow: 'hidden',
        }}
      >

        {/* SVG strings */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {STRINGS.map(([from, to, color]) => {
            const a = getCenter(from), b = getCenter(to)
            const mx = (a.x + b.x) / 2
            const my = (a.y + b.y) / 2 + 18
            return (
              <path
                key={from + to}
                d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                stroke={color}
                strokeWidth="1.2"
                fill="none"
                opacity="0.5"
              />
            )
          })}
        </svg>

        {/* Pinned items */}
        {items.map(item => {
          const isFocused = focused === item.id
          const zIndex = (item as PinItem & { z?: number }).z || 2
          const prog = revealProgress[item.id] || 0
          const isRedacted = item.type === 'redacted' && !item.unredacted

          const w = item.type === 'photo' ? 170 : item.type === 'note' ? 180 : item.type === 'card' ? 200 : 240
          const bg = item.type === 'note'
            ? '#f5e83a'
            : item.type === 'photo'
            ? '#f8f4ed'
            : item.type === 'redacted' && !item.unredacted
            ? '#fff0ee'
            : '#faf7f1'
          const borderColor = item.type === 'note'
            ? 'rgba(160,140,0,0.25)'
            : item.type === 'redacted' && !item.unredacted
            ? 'rgba(180,40,40,0.2)'
            : 'rgba(0,0,0,0.12)'

          return (
            <div
              key={item.id}
              ref={el => { itemRefs.current[item.id] = el }}
              onMouseDown={e => handleMouseDown(item.id, e)}
              onClick={e => handleItemClick(item.id, e)}
              style={{
                position: 'absolute',
                left: item.x, top: item.y,
                width: w,
                transform: `rotate(${item.rot}deg) scale(${isFocused ? 1.04 : 1})`,
                transformOrigin: 'top center',
                cursor: dragging === item.id ? 'grabbing' : 'grab',
                zIndex: isFocused ? 100 : zIndex,
                transition: dragging === item.id ? 'none' : 'transform 0.15s, box-shadow 0.15s',
                boxShadow: isFocused
                  ? `0 12px 36px rgba(0,0,0,0.35), 0 0 0 1px ${borderColor}`
                  : `0 4px 14px rgba(0,0,0,0.22), 0 0 0 1px ${borderColor}`,
                userSelect: 'none',
              }}
            >
              <Pin color={item.pinColor || '#cc4444'} />

              <div style={{
                background: bg,
                border: `1px solid ${borderColor}`,
                padding: item.type === 'photo' ? '10px 10px 24px' : '14px 16px',
                fontFamily: item.type === 'note'
                  ? '"Special Elite", Georgia, serif'
                  : '"JetBrains Mono", monospace',
                minHeight: item.type === 'photo' ? 140 : undefined,
              }}>
                {/* Photo inner */}
                {item.type === 'photo' && (
                  <div style={{ width: '100%', height: 110, background: '#e8e0d0', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: 8, fontFamily: '"JetBrains Mono", monospace', color: 'rgba(0,0,0,0.3)', letterSpacing: '0.1em' }}>[{item.title}]</div>
                  </div>
                )}

                {item.title && item.type !== 'photo' && (
                  <div style={{ fontSize: 7, fontFamily: '"JetBrains Mono", monospace', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.22em', marginBottom: 10, textTransform: 'uppercase' }}>{item.title}</div>
                )}

                {/* Redacted body */}
                {isRedacted ? (
                  <div style={{ fontSize: 9, lineHeight: 1.9, color: 'rgba(30,20,10,0.7)', whiteSpace: 'pre-wrap' }}>
                    {(item.redactedBody || '').split('[REDACTED]').map((seg, i, arr) => (
                      <span key={i}>
                        {seg}
                        {i < arr.length - 1 && (
                          <span style={{
                            background: prog > i ? 'transparent' : 'rgba(20,10,5,0.85)',
                            color: prog > i ? 'rgba(30,20,10,0.7)' : 'transparent',
                            padding: '0 2px', cursor: 'pointer',
                            transition: 'background 0.4s, color 0.4s',
                            borderRadius: 1,
                          }}>
                            {'████████████'.slice(0, 8 + i * 2)}
                          </span>
                        )}
                      </span>
                    ))}
                    <div style={{ marginTop: 10, fontSize: 7, color: 'rgba(30,20,10,0.3)', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em' }}>
                      CLICK TO REVEAL ({prog}/5)
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: item.type === 'note' ? 10 : 9, lineHeight: 1.9, color: item.type === 'note' ? 'rgba(40,35,0,0.75)' : 'rgba(20,15,10,0.65)', whiteSpace: 'pre-wrap' }}>
                    {item.body}
                  </div>
                )}

                {/* Unredacted CTA */}
                {item.type === 'redacted' && item.unredacted && item.worldId && (
                  <div style={{ marginTop: 12, padding: '6px 10px', background: 'rgba(0,0,0,0.06)', textAlign: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 7, color: 'rgba(0,0,0,0.4)', cursor: 'pointer', letterSpacing: '0.15em' }}>
                    CONTINUE READING →
                  </div>
                )}

                {/* Photo caption */}
                {item.type === 'photo' && (
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, color: 'rgba(0,0,0,0.45)', textAlign: 'center', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{item.body}</div>
                )}

                {/* CLASSIFIED stamp on redacted docs */}
                {item.type === 'redacted' && !item.unredacted && (
                  <div style={{
                    position: 'absolute', bottom: 10, right: 10,
                    border: '2px solid rgba(190,30,30,0.6)',
                    color: 'rgba(190,30,30,0.6)',
                    fontFamily: '"JetBrains Mono", monospace', fontSize: 7,
                    padding: '2px 8px', letterSpacing: '0.22em',
                    transform: 'rotate(-8deg)',
                  }}>CLASSIFIED</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Expanded card overlay */}
      {expandedCard && (
        <div
          onClick={() => setExpandedCard(null)}
          style={{
            position: 'absolute', inset: 0, zIndex: 200,
            background: 'rgba(80,55,25,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#faf6ee',
              borderTop: '3px solid #cc2222',
              padding: '32px 36px',
              maxWidth: 480, width: '90vw',
              maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 16px 60px rgba(0,0,0,0.4)',
              position: 'relative',
            }}
          >
            {expandedCard.title && (
              <div style={{ fontSize: 8, fontFamily: '"JetBrains Mono", monospace', color: 'rgba(0,0,0,0.3)', letterSpacing: '0.24em', marginBottom: 20, textTransform: 'uppercase' }}>
                {expandedCard.title} · UNREDACTED
              </div>
            )}
            <div style={{ fontSize: 11, lineHeight: 2.2, color: 'rgba(0,0,0,0.7)', whiteSpace: 'pre-wrap', fontFamily: '"IM Fell English", Georgia, serif', fontStyle: 'italic' }}>
              {expandedCard.body}
            </div>
            <div style={{ marginTop: 28, fontFamily: '"JetBrains Mono", monospace', fontSize: 7, color: 'rgba(0,0,0,0.2)', letterSpacing: '0.18em' }}>
              CLEARANCE LEVEL: GRANTED · {new Date().toLocaleDateString()}
            </div>
            <div
              onClick={() => setExpandedCard(null)}
              style={{ marginTop: 14, fontFamily: '"JetBrains Mono", monospace', fontSize: 7, color: 'rgba(0,0,0,0.35)', cursor: 'pointer', letterSpacing: '0.14em' }}
            >[ close ]</div>
          </div>
        </div>
      )}

      {/* Drag hint */}
      <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontFamily: '"JetBrains Mono", monospace', fontSize: 7, color: 'rgba(60,40,10,0.3)', letterSpacing: '0.3em', pointerEvents: 'none' }}>
        DRAG · CLICK · UNREDACT
      </div>

      <style>{`
        @keyframes stampAppear { 0%{opacity:0;transform:rotate(-8deg) scale(1.3)} 100%{opacity:1;transform:rotate(-8deg) scale(1)} }
      `}</style>
      <HomeButton />
    </div>
  )
}
