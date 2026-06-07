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
  ['note1', 'doc1', '#cc4422'],
  ['note1', 'redact1', '#cc4422'],
  ['note2', 'doc1', '#cc8822'],
  ['note2', 'card1', '#bb3311'],
  ['doc2', 'card2', '#334488'],
  ['redact2', 'card1', '#882222'],
]

// ─── HELPER: pin shape ───────────────────────────────────────────────────────
function Pin({ color }: { color: string }) {
  return (
    <div style={{
      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
      zIndex: 2,
    }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, boxShadow: `0 2px 6px rgba(0,0,0,0.6), 0 0 0 2px rgba(0,0,0,0.3)`, margin: '0 auto' }} />
      <div style={{ width: 2, height: 8, background: 'rgba(0,0,0,0.4)', margin: '0 auto' }} />
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function World6Document() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [items, setItems] = useState<PinItem[]>(INITIAL_ITEMS.map(i => ({ ...i, unredacted: false })))
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [focused, setFocused] = useState<string | null>(null)
  const [revealProgress, setRevealProgress] = useState<Record<string, number>>({})
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
    }
    if (item?.unredacted && item.worldId) {
      navigateTo(item.worldId as Parameters<typeof navigateTo>[0], {
        type: item.portal as Parameters<typeof navigateTo>[1]['type'],
      })
    }
  }, [items, navigateTo])

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
        background: '#1c1208',
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'default',
      }}
      onClick={() => setFocused(null)}
    >
      {/* Overhead lamp glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,200,80,0.07) 0%, transparent 80%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50, pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,160,60,0.4)', letterSpacing: '0.3em' }}>
          INVESTIGATION FILE · SUBJECT: T.E. · CONFIDENTIAL
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,160,60,0.25)', letterSpacing: '0.15em' }}>
          {items.filter(i => i.type === 'redacted' && i.unredacted).length}/{items.filter(i => i.type === 'redacted').length} REDACTIONS CLEARED
        </div>
      </div>

      {/* Corkboard */}
      <div
        ref={boardRef}
        style={{
          position: 'absolute',
          top: 36, left: 12, right: 12, bottom: 12,
          backgroundImage: `
            radial-gradient(circle at 30% 40%, rgba(180,130,70,0.18) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(160,110,50,0.12) 0%, transparent 45%)
          `,
          backgroundColor: '#3d2b14',
          borderRadius: 4,
          border: '6px solid #2a1c08',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Cork texture overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.02) 3px, rgba(0,0,0,0.02) 4px)
          `,
        }} />

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
            ? '#f5e060'
            : item.type === 'photo'
            ? '#e8e0d0'
            : item.type === 'redacted' && !item.unredacted
            ? '#e8e8e0'
            : '#f5f0e8'

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
                  ? '4px 6px 24px rgba(0,0,0,0.7)'
                  : '2px 4px 12px rgba(0,0,0,0.5)',
                userSelect: 'none',
              }}
            >
              <Pin color={item.pinColor || '#cc2222'} />

              <div style={{
                background: bg,
                padding: item.type === 'photo' ? '10px 10px 30px' : '12px 14px',
                fontFamily: item.type === 'note'
                  ? '"Special Elite", Georgia, serif'
                  : '"Unna", Georgia, serif',
                minHeight: item.type === 'photo' ? 140 : undefined,
              }}>
                {/* Photo inner */}
                {item.type === 'photo' && (
                  <div style={{ width: '100%', height: 110, background: 'rgba(80,60,40,0.2)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(80,60,40,0.4)', letterSpacing: '0.1em' }}>[{item.title}]</div>
                  </div>
                )}

                {item.title && item.type !== 'photo' && (
                  <div style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(0,0,0,0.4)', letterSpacing: '0.18em', marginBottom: 8, textTransform: 'uppercase' }}>{item.title}</div>
                )}

                {/* Redacted body */}
                {isRedacted ? (
                  <div style={{ fontSize: 9, lineHeight: 1.8, color: 'rgba(0,0,0,0.7)', whiteSpace: 'pre-wrap' }}>
                    {(item.redactedBody || '').split('[REDACTED]').map((seg, i, arr) => (
                      <span key={i}>
                        {seg}
                        {i < arr.length - 1 && (
                          <span style={{
                            background: prog > i ? 'transparent' : '#1a1a1a',
                            color: prog > i ? 'rgba(0,0,0,0.7)' : 'transparent',
                            padding: '0 2px', cursor: 'pointer',
                            transition: 'background 0.3s, color 0.3s',
                          }}>
                            {'████████████'.slice(0, 8 + i * 2)}
                          </span>
                        )}
                      </span>
                    ))}
                    <div style={{ marginTop: 8, fontSize: 7, color: 'rgba(0,0,0,0.2)', fontFamily: 'monospace' }}>
                      CLICK TO REVEAL ({prog}/5)
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: item.type === 'note' ? 10 : 9, lineHeight: 1.9, color: 'rgba(0,0,0,0.65)', whiteSpace: 'pre-wrap' }}>
                    {item.body}
                  </div>
                )}

                {/* Unredacted CTA */}
                {item.type === 'redacted' && item.unredacted && item.worldId && (
                  <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(0,0,0,0.08)', textAlign: 'center', fontFamily: 'monospace', fontSize: 8, color: 'rgba(0,0,0,0.5)', cursor: 'pointer', letterSpacing: '0.1em' }}>
                    CONTINUE READING →
                  </div>
                )}

                {/* Photo caption */}
                {item.type === 'photo' && (
                  <div style={{ fontFamily: '"Special Elite", Georgia, serif', fontSize: 9, color: 'rgba(60,40,20,0.5)', textAlign: 'center', whiteSpace: 'pre-wrap' }}>{item.body}</div>
                )}

                {/* CLASSIFIED stamp on redacted docs */}
                {item.type === 'redacted' && !item.unredacted && (
                  <div style={{
                    position: 'absolute', bottom: 10, right: 10,
                    border: '2px solid rgba(180,30,30,0.5)',
                    color: 'rgba(180,30,30,0.5)',
                    fontFamily: 'monospace', fontSize: 8,
                    padding: '2px 8px', letterSpacing: '0.2em',
                    transform: 'rotate(-8deg)',
                  }}>CLASSIFIED</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Drag hint */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontFamily: 'monospace', fontSize: 8, color: 'rgba(200,160,60,0.2)', letterSpacing: '0.2em', pointerEvents: 'none' }}>
        DRAG · CLICK · UNREDACT
      </div>

      <style>{`
        @keyframes stampAppear { 0%{opacity:0;transform:rotate(-8deg) scale(1.3)} 100%{opacity:1;transform:rotate(-8deg) scale(1)} }
      `}</style>
      <HomeButton />
    </div>
  )
}
