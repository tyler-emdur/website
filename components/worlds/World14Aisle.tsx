'use client'
import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import HomeButton from './HomeButton'
import { useWorldStore } from '@/lib/world-store'
import { getSlot, getSpecial, loadBasket, addToBasket, type BasketEntry } from './aisle-data'
import { AisleAudio } from './aisle-audio'

const AisleCanvas = dynamic(() => import('./AisleCanvas'), { ssr: false })

// how far into the wrongness, 0..1 — drives the fluorescent hum + sub drone
function depthLevel(idx: number) {
  const s = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
  return Math.min(1, s(18, 55, idx) * 0.35 + s(55, 110, idx) * 0.3 + s(105, 170, idx) * 0.45)
}

// PA announcements fire once as you pass each depth. Deadpan. The store knows.
const PA_LINES: { at: number; text: string }[] = [
  { at: 20, text: 'attention shoppers: the store closes in ten minutes. it has been closing for some time now.' },
  { at: 55, text: 'cleanup on aisle 14. cleanup on aisle 14. take your time.' },
  { at: 90, text: 'attention shoppers: restocking does not reach this far. items past this point are sold as-is.' },
  { at: 125, text: 'if you can still hear this announcement, you are past the part of the store we have maps for.' },
  { at: 160, text: 'the exit sign ahead is real. the exit is not. thank you for shopping with us.' },
  { at: 220, text: 'the front of the store is exactly where you left it. this has always been true.' },
  { at: 300, text: 'attention. attention. never mind.' },
]

export default function World14Aisle() {
  const store = useWorldStore()
  const [centerIndex, setCenterIndex] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)
  const [basket, setBasket] = useState<BasketEntry[]>([])
  const [taken, setTaken] = useState<string | null>(null)
  const [pa, setPa] = useState<string | null>(null)
  const foundGemsRef = useRef<Set<string>>(new Set())
  const paFiredRef = useRef<Set<number>>(new Set())
  const paTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<AisleAudio | null>(null)

  const special = useMemo(() => getSpecial(), [])
  const currentSlot = useMemo(() => getSlot(Math.max(0, centerIndex)), [centerIndex])

  useEffect(() => { setBasket(loadBasket()) }, [])

  // fluorescent hum + sub drone — wakes on first interaction, tracks depth
  useEffect(() => {
    audioRef.current = new AisleAudio()
    const wake = () => audioRef.current?.resume()
    window.addEventListener('pointerdown', wake)
    window.addEventListener('keydown', wake)
    window.addEventListener('wheel', wake, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
      window.removeEventListener('wheel', wake)
      audioRef.current?.stop()
    }
  }, [])

  useEffect(() => { audioRef.current?.setDepth(depthLevel(centerIndex)) }, [centerIndex])

  useEffect(() => {
    for (const line of PA_LINES) {
      if (centerIndex >= line.at && !paFiredRef.current.has(line.at)) {
        paFiredRef.current.add(line.at)
        setPa(line.text)
        if (paTimerRef.current) clearTimeout(paTimerRef.current)
        paTimerRef.current = setTimeout(() => setPa(null), 8000)
      }
    }
  }, [centerIndex])

  useEffect(() => () => { if (paTimerRef.current) clearTimeout(paTimerRef.current) }, [])

  useEffect(() => {
    if (currentSlot.kind === 'gem' && currentSlot.gemKey && !foundGemsRef.current.has(currentSlot.gemKey)) {
      foundGemsRef.current.add(currentSlot.gemKey)
      store.findSecret(`aisle-${currentSlot.gemKey}`)
    }
  }, [currentSlot, store])

  const takeItem = useCallback(() => {
    if (currentSlot.kind === 'junk') return
    const next = addToBasket({ label: currentSlot.label, price: currentSlot.price ?? '—', at: Date.now() })
    if (next.length !== basket.length) {
      setBasket(next)
      setTaken(currentSlot.label)
      if (currentSlot.kind === 'special') store.findSecret('aisle-managers-special')
      if (next.length >= 10) store.findSecret('aisle-full-basket')
    }
  }, [currentSlot, basket.length, store])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      setHasMoved(true)
      if (e.key.toLowerCase() === 'e') takeItem()
    }
    const onWheel = () => setHasMoved(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
    }
  }, [takeItem])

  useEffect(() => {
    if (!taken) return
    const t = setTimeout(() => setTaken(null), 2600)
    return () => clearTimeout(t)
  }, [taken])

  const inBasket = basket.some(b => b.label === currentSlot.label)
  const accent = currentSlot.kind === 'gem' ? '#F472B6' : currentSlot.kind === 'special' ? '#F6C66A' : '#e6e6ea'

  return (
    <div data-world="14" style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0b0b10' }}>
      <HomeButton />

      <div style={{
        position: 'fixed', top: 20, left: 24, zIndex: 20, fontFamily: '"Space Mono", monospace',
        color: 'rgba(255,255,255,0.55)',
      }}>
        <div style={{ fontSize: 13, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
          The Endless Aisle
        </div>
        <div style={{ fontSize: 9, marginTop: 4 }}>
          ITEM {String(centerIndex).padStart(5, '0')} · KEEP WALKING
        </div>
        <div style={{ fontSize: 8, marginTop: 10, color: 'rgba(246,198,106,0.65)', maxWidth: 220, lineHeight: 1.7 }}>
          ★ TODAY&apos;S MANAGER&apos;S SPECIAL<br />
          {special.item.label}<br />
          <span style={{ color: 'rgba(246,198,106,0.4)' }}>somewhere near position #{special.index}</span>
        </div>
      </div>

      {/* basket */}
      <div style={{
        position: 'fixed', top: 20, right: 24, zIndex: 20, fontFamily: '"Space Mono", monospace',
        textAlign: 'right', color: 'rgba(255,255,255,0.55)',
      }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em' }}>BASKET: {basket.length}</div>
        <div style={{ fontSize: 8, marginTop: 3, color: 'rgba(255,255,255,0.3)' }}>
          {basket.length === 0 ? 'empty. everything is technically free.' : 'running total: incalculable'}
        </div>
      </div>

      {taken && (
        <div style={{
          position: 'fixed', top: 74, right: 24, zIndex: 21, fontFamily: '"Space Mono", monospace',
          fontSize: 9, letterSpacing: '0.1em', color: '#F6C66A',
          background: 'rgba(6,6,10,0.85)', border: '1px solid rgba(246,198,106,0.35)',
          padding: '8px 12px', maxWidth: 240,
        }}>
          ◆ in the basket — {taken}
        </div>
      )}

      {/* PA system */}
      {pa && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 22,
          fontFamily: '"Space Mono", monospace', fontSize: 10, letterSpacing: '0.22em',
          color: 'rgba(255,244,214,0.75)', textTransform: 'uppercase', textAlign: 'center',
          maxWidth: 560, lineHeight: 2, padding: '10px 18px',
          textShadow: '0 0 14px rgba(255,244,214,0.25)',
          animation: 'aisle-pa 8s ease forwards', pointerEvents: 'none',
        }}>
          ((( {pa} )))
        </div>
      )}
      <style>{`
        @keyframes aisle-pa {
          0% { opacity: 0 }
          6% { opacity: 1 }
          85% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>

      {!hasMoved && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 20,
          fontFamily: '"Space Mono", monospace', color: 'rgba(255,255,255,0.85)', fontSize: 11,
          letterSpacing: '0.15em', textAlign: 'center', pointerEvents: 'none', lineHeight: 2.2,
          background: 'rgba(6,6,10,0.55)', padding: '14px 22px', backdropFilter: 'blur(4px)',
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
        }}>
          W / S · ↑ / ↓ · scroll &nbsp;—&nbsp; walk the aisle<br />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>E — put an item in your basket</span>
        </div>
      )}

      {/* shelf tag for the item you're standing at */}
      <div style={{
        position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 20,
        width: 440, maxWidth: 'calc(100vw - 48px)', background: 'rgba(6,6,10,0.85)',
        border: `1px solid ${currentSlot.kind === 'gem' ? 'rgba(244,114,182,0.5)' : currentSlot.kind === 'special' ? 'rgba(246,198,106,0.6)' : 'rgba(255,255,255,0.15)'}`,
        backdropFilter: 'blur(8px)', padding: '10px 16px', fontFamily: '"Space Mono", monospace',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: accent }}>
            {currentSlot.label}
          </div>
          {currentSlot.price && (
            <div style={{ fontSize: 10, color: currentSlot.kind === 'special' ? '#F6C66A' : 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
              {currentSlot.price}
            </div>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.5 }}>
          {currentSlot.flavor}
        </div>
        {currentSlot.kind !== 'junk' && (
          <div
            onClick={takeItem}
            style={{
              fontSize: 8, marginTop: 6, letterSpacing: '0.15em', cursor: inBasket ? 'default' : 'pointer',
              color: inBasket ? 'rgba(246,198,106,0.5)' : 'rgba(255,255,255,0.35)',
            }}
          >
            {inBasket ? '◆ IN YOUR BASKET' : '[E] TAKE IT'}
          </div>
        )}
      </div>

      <AisleCanvas onCenterIndexChange={setCenterIndex} />
    </div>
  )
}
