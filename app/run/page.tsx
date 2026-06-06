'use client'
import { useState, useRef, useEffect } from 'react'
import AreaLayout from '@/components/shared/AreaLayout'
import { runs, formatTime, formatPace } from '@/lib/data/runs'
import type { Run } from '@/lib/types'
import { useCursor } from '@/components/cursor/CursorContext'

function ElevationProfile({ run, visible }: { run: Run; visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progress  = useRef(0)
  const raf       = useRef(0)

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width  = c.offsetWidth
    c.height = c.offsetHeight
    const W = c.width, H = c.height
    const pts = run.route_points
    const maxY = Math.max(...pts.map(p => p[1]))
    const minY = Math.min(...pts.map(p => p[1]))
    const range = maxY - minY || 1

    cancelAnimationFrame(raf.current)
    if (!visible) { progress.current = 0; ctx.clearRect(0,0,W,H); return }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      const target = visible ? 1 : 0
      progress.current += (target - progress.current) * 0.025

      const pad = 40
      const drawLen = Math.floor(pts.length * progress.current)
      if (drawLen < 2) { raf.current = requestAnimationFrame(draw); return }

      // Fill area
      ctx.beginPath()
      ctx.moveTo(pad, H - pad)
      for (let i = 0; i < drawLen; i++) {
        const x = pad + (pts[i][0] / pts[pts.length-1][0]) * (W - pad*2)
        const y = (H - pad) - ((pts[i][1] - minY) / range) * (H - pad * 2.5)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      const lastX = pad + (pts[drawLen-1][0] / pts[pts.length-1][0]) * (W - pad*2)
      ctx.lineTo(lastX, H - pad)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, 'rgba(255,68,34,0.4)')
      grad.addColorStop(1, 'rgba(255,68,34,0.02)')
      ctx.fillStyle = grad; ctx.fill()

      // Line
      ctx.beginPath()
      for (let i = 0; i < drawLen; i++) {
        const x = pad + (pts[i][0] / pts[pts.length-1][0]) * (W - pad*2)
        const y = (H - pad) - ((pts[i][1] - minY) / range) * (H - pad * 2.5)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.strokeStyle = '#FF4422'; ctx.lineWidth = 2
      ctx.shadowBlur = 8; ctx.shadowColor = '#FF4422'
      ctx.stroke(); ctx.shadowBlur = 0

      // Baseline
      ctx.beginPath(); ctx.moveTo(pad, H-pad); ctx.lineTo(W-pad, H-pad)
      ctx.strokeStyle = 'rgba(255,68,34,0.15)'; ctx.lineWidth = 1
      ctx.shadowBlur = 0; ctx.stroke()

      if (progress.current < 0.99) raf.current = requestAnimationFrame(draw)
    }

    raf.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf.current)
  }, [run, visible])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

function SplitBars({ splits }: { splits: number[] }) {
  const min = Math.min(...splits), max = Math.max(...splits)
  return (
    <div className="flex items-end gap-[2px] h-12 mt-2">
      {splits.map((s, i) => {
        const h = 100 - ((s - min) / (max - min + 0.01)) * 70
        return (
          <div key={i} title={`Mile ${i+1}: ${formatPace(s)}/mi`}
            className="flex-1 rounded-sm transition-all duration-300"
            style={{ height: `${h}%`, background: `rgba(255,68,34,${0.3 + ((s-min)/(max-min+0.01))*0.5})` }}
          />
        )
      })}
    </div>
  )
}

function RunCard({ run, onClick, active }: { run: Run; onClick: () => void; active: boolean }) {
  const { setMode } = useCursor()
  const mi = run.distance_mi, hrs = Math.floor(run.time_s/3600), mins = Math.floor((run.time_s%3600)/60)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setMode('hover')} onMouseLeave={() => setMode('default')}
      className={`text-left border-l-2 pl-6 py-4 transition-all duration-300 cursor-none w-full ${active ? 'border-[#FF4422] opacity-100' : 'border-[rgba(255,68,34,0.2)] opacity-50 hover:opacity-80'}`}
    >
      <div className="font-mono text-[10px] tracking-[0.2em] text-[#FF4422] uppercase mb-1">{run.date}</div>
      <div className="font-serif text-xl leading-tight">{run.name}</div>
      <div className="font-mono text-xs text-white/40 mt-1">{mi.toFixed(1)} mi · {hrs > 0 ? `${hrs}h ` : ''}{mins}m · {run.location}</div>
    </button>
  )
}

export default function RunPage() {
  const [selected, setSelected] = useState<Run>(runs[0])
  const [showElevation, setShowElevation] = useState(false)
  const { setMode } = useCursor()

  useEffect(() => { setTimeout(() => setShowElevation(true), 300) }, [selected])

  const handleSelect = (run: Run) => {
    setShowElevation(false)
    setTimeout(() => { setSelected(run); setShowElevation(true) }, 150)
  }

  return (
    <AreaLayout area="run" className="bg-area-run min-h-screen">
      {/* Header */}
      <div className="px-8 pt-20 pb-8 border-b border-[rgba(255,68,34,0.12)]">
        <div className="font-mono text-[10px] tracking-[0.25em] text-[#FF4422] uppercase mb-3">Area 01</div>
        <h1 className="font-serif text-[clamp(3rem,10vw,8rem)] leading-[0.88] tracking-tight text-white">
          RUN
        </h1>
        <div className="font-mono text-xs text-white/25 mt-4 tracking-[0.15em]">
          {runs.length} races · {runs.reduce((a,r) => a + r.distance_mi, 0).toFixed(0)} total miles · Colorado
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-12rem)]">

        {/* Race list */}
        <div className="lg:w-80 xl:w-96 border-r border-[rgba(255,68,34,0.08)] p-6 flex flex-col gap-1 overflow-y-auto">
          {runs.map(r => (
            <RunCard key={r.id} run={r} onClick={() => handleSelect(r)} active={selected.id === r.id} />
          ))}
        </div>

        {/* Detail panel */}
        <div className="flex-1 p-8 flex flex-col gap-8">

          {/* Race hero stats */}
          <div className="border-b border-[rgba(255,68,34,0.1)] pb-8">
            <div className="font-mono text-[10px] tracking-[0.2em] text-[#FF4422] uppercase mb-2">{selected.date}</div>
            <h2 className="font-serif text-[clamp(2rem,5vw,4rem)] leading-tight">{selected.name}</h2>
            <div className="font-mono text-xs text-white/30 tracking-[0.1em] mt-1">{selected.location}</div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
              {[
                { label: 'Distance', value: `${selected.distance_mi.toFixed(1)}`, unit: 'mi' },
                { label: 'Time',     value: formatTime(selected.time_s),          unit: '' },
                { label: 'Pace',     value: formatPace(selected.pace_min_mi),     unit: '/mi' },
                { label: 'Elev.',    value: `${selected.elevation_ft.toLocaleString()}`, unit: 'ft' },
              ].map(({ label, value, unit }) => (
                <div key={label}>
                  <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-white/30 mb-1">{label}</div>
                  <div className="font-serif text-3xl text-[#FF4422]">{value}<span className="text-sm text-white/40 ml-1">{unit}</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Elevation profile */}
          <div>
            <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-white/25 mb-3">Elevation Profile</div>
            <div className="h-40 w-full">
              <ElevationProfile run={selected} visible={showElevation} />
            </div>
          </div>

          {/* Splits */}
          <div>
            <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-white/25 mb-3">
              Mile Splits — avg {formatPace(selected.pace_min_mi)}/mi
            </div>
            <SplitBars splits={selected.splits} />
          </div>

          {/* Footer note */}
          <div className="mt-auto font-mono text-[10px] text-white/15 tracking-[0.1em]">
            ✏️ Connect Strava: add STRAVA_CLIENT_ID + STRAVA_CLIENT_SECRET to env vars
          </div>
        </div>
      </div>
    </AreaLayout>
  )
}
