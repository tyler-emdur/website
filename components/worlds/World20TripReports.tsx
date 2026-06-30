'use client'
import { useRef, useEffect, useState, useMemo } from 'react'
import HomeButton from './HomeButton'
import { adventures } from '@/lib/data/adventures'
import type { Adventure } from '@/lib/types'

const SKY = '#dff0fa'
const BROWN = '#5a4a2a'

function ElevationProfile({ adv }: { adv: Adventure }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    c.width = c.offsetWidth
    c.height = c.offsetHeight
    const W = c.width, H = c.height
    const seed = adv.id.charCodeAt(1) || 1
    const noise = (x: number) => {
      const s = Math.sin(x * 127.1 + seed * 311.7) * 43758.5453
      return s - Math.floor(s)
    }
    const n = 60
    const pts = Array.from({ length: n }, (_, i) => {
      const x = i / (n - 1)
      const base = Math.sin(x * Math.PI)
      const detail = noise(x * 9) * 0.25 + noise(x * 21) * 0.1
      return base * 0.7 + detail * 0.3
    })
    const mn = Math.min(...pts), mx = Math.max(...pts)
    const norm = pts.map(p => (p - mn) / (mx - mn + 0.001))
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, W, H)
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, `${adv.color}55`)
    grad.addColorStop(1, `${adv.color}08`)
    ctx.beginPath()
    norm.forEach((v, i) => {
      const x = (i / (n - 1)) * W, y = H - v * H * 0.78 - H * 0.08
      i === 0 ? ctx.moveTo(x, H) : undefined
      ctx.lineTo(x, y)
    })
    ctx.lineTo(W, H); ctx.closePath()
    ctx.fillStyle = grad; ctx.fill()
    ctx.beginPath()
    norm.forEach((v, i) => {
      const x = (i / (n - 1)) * W, y = H - v * H * 0.78 - H * 0.08
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = adv.color; ctx.lineWidth = 2; ctx.stroke()
  }, [adv])
  return <canvas ref={ref} style={{ width: '100%', height: 60, display: 'block', border: `1px solid ${BROWN}` }} />
}

function ReportCard({ adv }: { adv: Adventure }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#fffef8', border: `2px solid ${BROWN}`, marginBottom: 12, boxShadow: '3px 3px 0 rgba(0,0,0,0.1)' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', textAlign: 'left', background: adv.color + '22', border: 'none', cursor: 'pointer',
        padding: '10px 14px', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: BROWN }}>🏔️ {adv.location}, {adv.state}</div>
          <div style={{ fontSize: 10, color: '#776' }}>{adv.date} &middot; {adv.lat.toFixed(4)}°N, {Math.abs(adv.lng).toFixed(4)}°W</div>
        </div>
        <div style={{
          background: adv.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px',
          borderRadius: 4, flexShrink: 0,
        }}>{adv.elevation_ft.toLocaleString()} ft</div>
      </button>
      {open && (
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 12, lineHeight: 1.7, color: '#332', marginBottom: 10 }}>
            {adv.description}
          </div>
          <div style={{ fontSize: 8, color: '#998', marginBottom: 3, letterSpacing: 1 }}>ELEVATION PROFILE</div>
          <ElevationProfile adv={adv} />
        </div>
      )}
    </div>
  )
}

export default function World20TripReports() {
  const sorted = useMemo(() => [...adventures].sort((a, b) => b.elevation_ft - a.elevation_ft), [])
  const maxElev = sorted[0]

  return (
    <div data-world="20" style={{
      position: 'fixed', inset: 0, overflow: 'auto', background: SKY,
      fontFamily: '"Comic Sans MS", "Comic Sans", cursive', color: BROWN,
      backgroundImage: 'linear-gradient(180deg, #dff0fa 0%, #f0f8ee 100%)',
    }}>
      <HomeButton />

      <div style={{ maxWidth: 660, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32 }}>⛰️🥾⛰️</div>
          <div style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 700, color: BROWN }}>
            Tyler&apos;s Trail Reports
          </div>
          <div style={{ fontSize: 12, color: '#557755', marginTop: 4 }}>
            Colorado &amp; Utah, on foot. {adventures.length} trips logged.
          </div>
        </div>

        <div style={{
          background: '#fff', border: `2px dashed ${BROWN}`, padding: '10px 14px', marginBottom: 18,
          fontSize: 11, textAlign: 'center', color: '#557755',
        }}>
          highest point reached: <b>{maxElev?.location}</b> at <b>{maxElev?.elevation_ft.toLocaleString()} ft</b> &middot; click a trip to expand it
        </div>

        {sorted.map(adv => <ReportCard key={adv.id} adv={adv} />)}

        <div style={{ textAlign: 'center', fontSize: 10, color: '#779', marginTop: 24 }}>
          sign my trail register &middot; summits logged since 2023: {adventures.length.toString().padStart(3, '0')}
        </div>
      </div>
    </div>
  )
}
