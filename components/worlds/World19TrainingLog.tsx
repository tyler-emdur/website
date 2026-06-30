'use client'
import { useRef, useEffect, useState } from 'react'
import HomeButton from './HomeButton'
import { runs, formatTime, formatPace } from '@/lib/data/runs'
import type { Run } from '@/lib/types'

const PAPER = '#f3ecd9'
const INK = '#2a2417'
const ORANGE = '#cc6622'

function SplitChart({ run }: { run: Run }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    c.width = c.offsetWidth
    c.height = c.offsetHeight
    const pts = run.splits.length ? run.splits : [run.pace_min_mi]
    const mn = Math.min(...pts), mx = Math.max(...pts)
    ctx.fillStyle = '#001a00'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.strokeStyle = 'rgba(51,255,102,0.15)'
    for (let x = 0; x < c.width; x += 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke() }
    const barW = c.width / pts.length
    pts.forEach((p, i) => {
      const h = mx === mn ? c.height * 0.5 : ((p - mn) / (mx - mn)) * (c.height - 8) + 4
      ctx.fillStyle = '#33ff66'
      ctx.shadowBlur = 4
      ctx.shadowColor = '#33ff66'
      ctx.fillRect(i * barW + 1, c.height - h, barW - 2, h)
    })
    ctx.shadowBlur = 0
  }, [run])
  return <canvas ref={ref} style={{ width: '100%', height: 56, display: 'block', border: '1px solid #003300' }} />
}

function LogEntry({ run, open, onToggle }: { run: Run; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: `2px dashed #c4b896`, padding: '14px 0' }}>
      <button onClick={onToggle} style={{
        background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
        fontFamily: 'inherit', color: INK, padding: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>🏃 {run.name}</span>
          <span style={{ fontSize: 10, color: '#777', fontFamily: 'monospace' }}>{run.date}</span>
        </div>
        <div style={{ fontSize: 11, color: '#665', marginTop: 2 }}>{run.location}</div>
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 10, marginBottom: 10 }}>
            {[
              { l: 'DISTANCE', v: `${run.distance_mi.toFixed(1)} mi` },
              { l: 'TIME', v: formatTime(run.time_s) },
              { l: 'PACE', v: `${formatPace(run.pace_min_mi)} /mi` },
              { l: 'GAIN', v: `+${run.elevation_ft.toLocaleString()} ft` },
            ].map(s => (
              <div key={s.l} style={{ background: '#fff', border: '1px solid #c4b896', padding: '6px 8px' }}>
                <div style={{ fontSize: 8, color: '#998', letterSpacing: 1 }}>{s.l}</div>
                <div style={{ fontSize: 14, color: ORANGE, fontWeight: 700 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 8, color: '#998', marginBottom: 3, letterSpacing: 1 }}>PACE PER MILE</div>
          <SplitChart run={run} />
        </div>
      )}
    </div>
  )
}

export default function World19TrainingLog() {
  const [openId, setOpenId] = useState<string>(runs[0]?.id ?? '')
  const totalMiles = runs.reduce((a, r) => a + r.distance_mi, 0)
  const totalGain = runs.reduce((a, r) => a + r.elevation_ft, 0)

  return (
    <div data-world="19" style={{
      position: 'fixed', inset: 0, overflow: 'auto', background: PAPER,
      fontFamily: 'Georgia, "Times New Roman", serif', color: INK,
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 28px)',
    }}>
      <HomeButton />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: `3px double ${INK}`, paddingBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: ORANGE }}>MILE BY MILE</div>
          <div style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700 }}>Tyler&apos;s Training Log</div>
          <div style={{ fontSize: 11, color: '#776', fontStyle: 'italic', marginTop: 4 }}>
            don&apos;t skip leg day. (I skip leg day.)
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: ORANGE }}>{totalMiles.toFixed(1)}</div>
            <div style={{ fontSize: 9, color: '#887', letterSpacing: 1 }}>MILES LOGGED</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: ORANGE }}>{totalGain.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: '#887', letterSpacing: 1 }}>FT GAINED</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: ORANGE }}>{runs.length}</div>
            <div style={{ fontSize: 9, color: '#887', letterSpacing: 1 }}>RACES LOGGED</div>
          </div>
        </div>

        <div style={{ background: '#fffdf6', border: `1px solid #c4b896`, padding: '4px 18px' }}>
          {runs.map(r => (
            <LogEntry key={r.id} run={r} open={openId === r.id} onToggle={() => setOpenId(p => p === r.id ? '' : r.id)} />
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: 10, color: '#998', marginTop: 24, fontStyle: 'italic' }}>
          updated after every race &middot; entries pulled from memory, mostly accurate
        </div>
      </div>
    </div>
  )
}
