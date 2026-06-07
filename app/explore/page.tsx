'use client'
import { useState, useRef, useEffect } from 'react'
import BackToUniverse from '@/components/shared/BackToUniverse'
import { adventures } from '@/lib/data/adventures'
import type { Adventure } from '@/lib/types'

function ElevationCanvas({ adventure }: { adventure: Adventure }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = c.offsetWidth; c.height = c.offsetHeight
    const W = c.width, H = c.height

    // Generate a plausible elevation profile from the adventure data
    const seed = adventure.id.charCodeAt(1) || 1
    const noise = (x: number) => {
      const s = Math.sin(x * 127.1 + seed * 311.7) * 43758.5453
      return s - Math.floor(s)
    }
    const numPts = 80
    const pts = Array.from({ length: numPts }, (_, i) => {
      const x = i / (numPts - 1)
      const base = Math.sin(x * Math.PI) // arc shape
      const detail = noise(x * 8) * 0.3 + noise(x * 16) * 0.15 + noise(x * 32) * 0.07
      return base * 0.65 + detail * 0.35
    })
    const mn = Math.min(...pts), mx = Math.max(...pts)
    const norm = pts.map(p => (p - mn) / (mx - mn + 0.001))

    // Background
    ctx.fillStyle = '#030d05'; ctx.fillRect(0, 0, W, H)

    // Fill under curve
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, `${adventure.color}44`)
    grad.addColorStop(1, `${adventure.color}06`)
    ctx.beginPath()
    norm.forEach((v, i) => {
      const x = (i / (numPts - 1)) * W
      const y = H - v * H * 0.72 - H * 0.08
      i === 0 ? ctx.moveTo(x, H) : undefined
      ctx.lineTo(x, y)
    })
    ctx.lineTo(W, H); ctx.closePath()
    ctx.fillStyle = grad; ctx.fill()

    // Line
    ctx.beginPath()
    norm.forEach((v, i) => {
      const x = (i / (numPts - 1)) * W
      const y = H - v * H * 0.72 - H * 0.08
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = adventure.color; ctx.lineWidth = 1.8
    ctx.shadowBlur = 8; ctx.shadowColor = adventure.color; ctx.stroke(); ctx.shadowBlur = 0

    // Summit dot
    const peakIdx = norm.indexOf(Math.max(...norm))
    const px = (peakIdx / (numPts - 1)) * W
    const py = H - norm[peakIdx] * H * 0.72 - H * 0.08
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2)
    ctx.fillStyle = adventure.color; ctx.shadowBlur = 12; ctx.shadowColor = adventure.color; ctx.fill(); ctx.shadowBlur = 0

    // Labels
    ctx.font = '8px "JetBrains Mono"'; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.textAlign = 'left'
    ctx.fillText(`${adventure.elevation_ft.toLocaleString()} ft`, px + 8, py - 4)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.textAlign = 'left'
    ctx.fillText('TRAILHEAD', 4, H - 6)
    ctx.textAlign = 'right'
    ctx.fillText('SUMMIT', W - 4, H - 6)

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(0, H * i / 4); ctx.lineTo(W, H * i / 4); ctx.stroke()
    }
  }, [adventure])
  return <canvas ref={ref} style={{ width: '100%', height: 120, display: 'block' }} />
}

function TopoViz({ adventure }: { adventure: Adventure | null }) {
  return (
    <div style={{ position: 'relative', width: 380, height: 260, flexShrink: 0 }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const size = 30 + i * 35
        const opacity = adventure ? 0.04 + (10 - i) * 0.025 : 0.025 + (10 - i) * 0.012
        const stretch = 0.55 + i * 0.04
        return (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: `translate(-50%,-50%) scaleY(${adventure ? stretch + 0.05 : stretch})`,
            width: size * 2, height: size,
            borderRadius: '50%',
            border: `1px solid rgba(34,197,94,${opacity})`,
            transition: `transform ${0.3 + i * 0.03}s cubic-bezier(0.16,1,0.3,1)`,
          }} />
        )
      })}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
        {adventure ? (
          <>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: adventure.color, boxShadow: `0 0 14px ${adventure.color}`, margin: '0 auto 10px' }} />
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 300, color: '#fff', marginBottom: 4, letterSpacing: '-0.01em' }}>{adventure.location}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>{adventure.elevation_ft.toLocaleString()} ft</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>
              {adventure.lat.toFixed(4)}°N · {Math.abs(adventure.lng).toFixed(4)}°W
            </div>
          </>
        ) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.1)' }}>SELECT LOCATION</div>
        )}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const [active, setActive] = useState<Adventure | null>(null)
  const maxElev = Math.max(...adventures.map(a => a.elevation_ft))

  return (
    <div className="area-page area-scanlines" style={{ background: '#030d05' }}>
      <BackToUniverse />

      <div style={{ padding: '88px 32px 24px', borderBottom: '1px solid rgba(34,197,94,0.08)', backgroundImage: 'linear-gradient(rgba(34,197,94,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.015) 1px,transparent 1px)', backgroundSize: '44px 44px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(34,197,94,0.6)', marginBottom: 8 }}>SECTOR 04-Δ · EXPLORE</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(3rem,10vw,7rem)', fontWeight: 300, lineHeight: 0.9, color: '#fff' }}>EXPLORE</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.14)', marginTop: 16, letterSpacing: '0.12em' }}>
          COLORADO + UTAH · {maxElev.toLocaleString()} FT MAX · {adventures.length} LOCATIONS LOGGED
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 200px)' }}>
        {/* List */}
        <div style={{ width: 300, borderRight: '1px solid rgba(34,197,94,0.06)', overflowY: 'auto', flexShrink: 0 }}>
          {adventures.map(adv => (
            <button key={adv.id} onClick={() => setActive(active?.id === adv.id ? null : adv)} style={{ width: '100%', textAlign: 'left', padding: '16px 20px', borderBottom: '1px solid rgba(34,197,94,0.04)', background: active?.id === adv.id ? 'rgba(34,197,94,0.05)' : 'transparent', cursor: 'none', transition: 'background 0.2s', display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.15em', color: 'rgba(34,197,94,0.5)', marginBottom: 3 }}>{adv.state} · {adv.date}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 300, color: active?.id === adv.id ? '#22C55E' : 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{adv.location}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>{adv.elevation_ft.toLocaleString()} ft</div>
                </div>
                <div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div style={{ width: (adv.elevation_ft / maxElev) * 22, height: (adv.elevation_ft / maxElev) * 22, borderRadius: '50%', background: adv.color, opacity: active?.id === adv.id ? 0.9 : 0.3, transition: 'opacity 0.2s', boxShadow: active?.id === adv.id ? `0 0 8px ${adv.color}` : 'none' }} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <TopoViz adventure={active} />
          </div>

          {active && (
            <div style={{ borderTop: '1px solid rgba(34,197,94,0.07)', padding: '20px 28px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', color: 'rgba(34,197,94,0.5)', marginBottom: 8 }}>ELEVATION PROFILE</div>
              <ElevationCanvas adventure={active} />
              {active.description && (
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, lineHeight: 1.85, color: 'rgba(255,255,255,0.38)', fontStyle: 'italic', marginTop: 16, maxWidth: 560 }}>
                  {active.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
