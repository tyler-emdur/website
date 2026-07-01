'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import HomeButton from './HomeButton'
import { useWorldStore } from '@/lib/world-store'
import { getSlot } from './aisle-data'

const AisleCanvas = dynamic(() => import('./AisleCanvas'), { ssr: false })

export default function World14Aisle() {
  const store = useWorldStore()
  const [centerIndex, setCenterIndex] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)
  const foundGemsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const onKey = () => setHasMoved(true)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const currentSlot = useMemo(() => getSlot(Math.max(0, centerIndex)), [centerIndex])

  useEffect(() => {
    if (currentSlot.kind === 'gem' && currentSlot.gemKey && !foundGemsRef.current.has(currentSlot.gemKey)) {
      foundGemsRef.current.add(currentSlot.gemKey)
      store.findSecret(`aisle-${currentSlot.gemKey}`)
    }
  }, [currentSlot, store])

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
      </div>

      {!hasMoved && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 20,
          fontFamily: '"Space Mono", monospace', color: 'rgba(255,255,255,0.6)', fontSize: 11,
          letterSpacing: '0.15em', textAlign: 'center', pointerEvents: 'none',
          textShadow: '0 0 12px rgba(0,0,0,0.8)',
        }}>
          W / S · ↑ / ↓ &nbsp;—&nbsp; walk the aisle
        </div>
      )}

      <div style={{
        position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 20,
        width: 420, maxWidth: 'calc(100vw - 48px)', background: 'rgba(6,6,10,0.85)',
        border: `1px solid ${currentSlot.kind === 'gem' ? 'rgba(244,114,182,0.5)' : 'rgba(255,255,255,0.15)'}`,
        backdropFilter: 'blur(8px)', padding: '10px 16px', fontFamily: '"Space Mono", monospace',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
          color: currentSlot.kind === 'gem' ? '#F472B6' : '#e6e6ea',
        }}>
          {currentSlot.label}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.5 }}>
          {currentSlot.flavor}
        </div>
      </div>

      <AisleCanvas onCenterIndexChange={setCenterIndex} />
    </div>
  )
}
