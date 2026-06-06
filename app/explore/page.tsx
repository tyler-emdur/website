'use client'
import { useState } from 'react'
import BackToUniverse from '@/components/shared/BackToUniverse'
import { adventures } from '@/lib/data/adventures'
import type { Adventure } from '@/lib/types'

export default function ExplorePage() {
  const [active, setActive] = useState<Adventure | null>(null)

  return (
    <div className="area-page" style={{ background: '#030d05' }}>
      <BackToUniverse />

      <div style={{ padding: '88px 32px 24px', borderBottom: '1px solid rgba(34,197,94,0.08)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(34,197,94,0.6)', marginBottom: 8 }}>SECTOR 04-Δ · EXPLORE</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(3rem,10vw,7rem)', fontWeight: 300, lineHeight: 0.9, color: '#fff' }}>EXPLORE</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 16, letterSpacing: '0.12em' }}>
          COLORADO · {Math.max(...adventures.map(a=>a.elevation_ft)).toLocaleString()} FT MAX · {adventures.length} LOCATIONS
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ width: 300, borderRight: '1px solid rgba(34,197,94,0.06)', overflowY: 'auto', flexShrink: 0 }}>
          {adventures.map(adv => (
            <button key={adv.id} onClick={() => setActive(active?.id === adv.id ? null : adv)} style={{ width: '100%', textAlign: 'left', padding: '16px 20px', borderBottom: '1px solid rgba(34,197,94,0.04)', background: active?.id === adv.id ? 'rgba(34,197,94,0.05)' : 'transparent', cursor: 'none', transition: 'background 0.2s', display: 'block' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', color: 'rgba(34,197,94,0.5)', marginBottom: 3 }}>{adv.state} · {adv.date}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: active?.id === adv.id ? '#22C55E' : 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{adv.location}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{adv.elevation_ft.toLocaleString()} ft</div>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Topo rings visualization */}
          <div style={{ position: 'relative', width: 400, height: 280 }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const size = 40 + i * 42
              const opacity = active ? 0.04 + (8 - i) * 0.02 : 0.03 + (8 - i) * 0.015
              return (
                <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) scale(${active ? 1 + i * 0.05 : 1})`, width: size * 2.2, height: size, borderRadius: '50%', border: `1px solid rgba(34,197,94,${opacity})`, transition: `transform ${0.4 + i * 0.04}s cubic-bezier(0.16,1,0.3,1)` }} />
              )
            })}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              {active ? (
                <>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 12px #22C55E', margin: '0 auto 12px' }} />
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 300, color: '#22C55E', marginBottom: 6 }}>{active.location}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>{active.elevation_ft.toLocaleString()} ft elevation</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.15)', marginTop: 6 }}>{active.lat.toFixed(4)}°N, {Math.abs(active.lng).toFixed(4)}°W</div>
                  {active.description && (
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 14, maxWidth: 220, lineHeight: 1.7, fontWeight: 300 }}>{active.description}</div>
                  )}
                </>
              ) : (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.12)' }}>SELECT LOCATION</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
