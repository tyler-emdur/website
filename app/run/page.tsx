'use client'
import { useState, useRef, useEffect } from 'react'
import BackToUniverse from '@/components/shared/BackToUniverse'
import { runs, formatTime, formatPace } from '@/lib/data/runs'
import type { Run } from '@/lib/types'

function ElevationSpark({ run }: { run: Run }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = c.offsetWidth; c.height = c.offsetHeight
    const W = c.width, H = c.height
    const pts = run.splits?.length
      ? run.splits
      : Array.from({ length: 12 }, (_, i) => run.pace_min_mi * (0.9 + Math.sin(i * 0.7) * 0.13))
    const mn = Math.min(...pts), mx = Math.max(...pts)
    ctx.beginPath()
    pts.forEach((p, i) => {
      const x = (i / (pts.length - 1)) * W
      const y = H - ((p - mn) / (mx - mn + 0.01)) * H * 0.8 - H * 0.1
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    grad.addColorStop(0, '#F97316'); grad.addColorStop(1, '#DC2626')
    ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke()
  }, [run])
  return <canvas ref={ref} style={{ width: '100%', height: 48, display: 'block' }} />
}

export default function RunPage() {
  const [active, setActive] = useState<Run>(runs[0])
  const maxDist = Math.max(...runs.map(r => r.distance_mi))
  const maxElev = Math.max(...runs.map(r => r.elevation_ft))

  return (
    <div className="area-page" style={{ background: '#080500' }}>
      <BackToUniverse />

      <div style={{ padding: '88px 32px 24px', borderBottom: '1px solid rgba(249,115,22,0.08)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(249,115,22,0.6)', marginBottom: 8 }}>SECTOR 02-B · RUNNING</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(3rem,10vw,7rem)', fontWeight: 300, lineHeight: 0.9, color: '#fff' }}>RUNNING</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 16, letterSpacing: '0.12em' }}>
          {runs.length} EVENTS · {runs.reduce((a,r)=>a+r.distance_mi,0).toFixed(0)} MI · {runs.reduce((a,r)=>a+r.elevation_ft,0).toLocaleString()} FT GAINED
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ width: 300, borderRight: '1px solid rgba(249,115,22,0.06)', overflowY: 'auto', flexShrink: 0 }}>
          {runs.map(run => (
            <button key={run.id} onClick={() => setActive(run)} style={{ width: '100%', textAlign: 'left', padding: '16px 20px', borderBottom: '1px solid rgba(249,115,22,0.04)', background: active.id === run.id ? 'rgba(249,115,22,0.05)' : 'transparent', cursor: 'none', transition: 'background 0.2s', display: 'block' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', color: 'rgba(249,115,22,0.5)', marginBottom: 3 }}>{run.date}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: active.id === run.id ? '#F97316' : 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{run.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{run.distance_mi.toFixed(1)} mi · {formatTime(run.time_s)}</div>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(249,115,22,0.5)', marginBottom: 10 }}>{active.date} · {active.location}</div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.6rem,3vw,2.8rem)', fontWeight: 300, color: '#fff', marginBottom: 32, letterSpacing: '-0.01em' }}>{active.name}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 20, marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid rgba(249,115,22,0.06)' }}>
            {[
              { l: 'DISTANCE', v: `${active.distance_mi.toFixed(1)} mi` },
              { l: 'FINISH TIME', v: formatTime(active.time_s) },
              { l: 'AVG PACE', v: formatPace(active.pace_min_mi) },
              { l: 'ELEVATION', v: `+${active.elevation_ft.toLocaleString()} ft` },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', color: 'rgba(249,115,22,0.45)', marginBottom: 4 }}>{s.l}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#fff' }}>{s.v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>PACE PROFILE</div>
            <ElevationSpark key={active.id} run={active} />
          </div>

          {[
            { l: 'DISTANCE RELATIVE', v: active.distance_mi, max: maxDist, c: '#F97316' },
            { l: 'ELEVATION RELATIVE', v: active.elevation_ft, max: maxElev, c: '#DC2626' },
          ].map(s => (
            <div key={s.l} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>{s.l}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{s.v.toFixed(0)}</span>
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ height: '100%', width: `${(s.v/s.max)*100}%`, background: s.c, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
            </div>
          ))}

          {active.notes && (
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(249,115,22,0.05)', fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>{active.notes}</div>
          )}
        </div>
      </div>
    </div>
  )
}
