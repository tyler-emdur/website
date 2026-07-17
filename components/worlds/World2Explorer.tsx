'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import HomeButton from './HomeButton'
import type { RouteActivity, TerrainData } from './StravaCanvas'

const StravaCanvas = dynamic(() => import('./StravaCanvas'), { ssr: false })

interface Stats {
  count: number
  totalDistanceMi: number
  totalElevationFt: number
  totalMovingTimeHrs: number
  mostRecent: { name: string; date: string } | null
}

interface StravaResponse {
  configured: boolean
  activities: RouteActivity[]
  stats: Stats | null
}

interface TerrainResponse {
  configured: boolean
  resolution: number
  radius: number
  elevations: number[]
}

interface CoverageSummary {
  totalMiles: number
  coveredMiles: number
  pct: number
  segmentCount: number
  coveredSegmentCount: number
}

interface StreetCoverageResponse {
  generatedAt: string
  streets: CoverageSummary
  paths: CoverageSummary
  combined: CoverageSummary
}

export default function World2Explorer() {
  const [state, setState] = useState<{
    loading: boolean
    configured: boolean
    activities: RouteActivity[]
    stats: Stats | null
    terrain: TerrainData | null
    coverage: StreetCoverageResponse | null
  }>({ loading: true, configured: true, activities: [], stats: null, terrain: null, coverage: null })

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/strava').then(r => r.json()) as Promise<StravaResponse>,
      // terrain is baked at build time (scripts/bake-terrain.mjs) — static, CDN-cached
      fetch('/terrain.json').then(r => r.json()) as Promise<TerrainResponse>,
      // street coverage is baked periodically (scripts/street-coverage/*) — static, CDN-cached.
      // Optional: older deploys or a not-yet-baked file simply omit the stat.
      fetch('/street-coverage.json').then(r => (r.ok ? r.json() : null)).catch(() => null) as Promise<StreetCoverageResponse | null>,
    ])
      .then(([strava, terrain, coverage]) => {
        if (cancelled) return
        setState({
          loading: false,
          configured: strava.configured && terrain.configured && terrain.elevations.length > 0,
          activities: strava.activities ?? [],
          stats: strava.stats ?? null,
          terrain: terrain.elevations.length > 0
            ? { resolution: terrain.resolution, radius: terrain.radius, elevations: terrain.elevations }
            : null,
          coverage,
        })
      })
      .catch(() => {
        if (!cancelled) setState(s => ({ ...s, loading: false, configured: false }))
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div data-world="2" style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#050506' }}>
      <HomeButton />

      {!state.loading && state.configured && state.stats && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 20,
          fontFamily: '"Space Mono", monospace', fontSize: 10, lineHeight: 1.8,
          color: 'rgba(255,255,255,0.75)', textAlign: 'right',
          border: '1px solid rgba(252,76,2,0.3)', padding: '10px 16px',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
        }}>
          <div>ACTIVITIES <span style={{ color: '#FC4C02' }}>{state.stats.count}</span></div>
          <div>DISTANCE <span style={{ color: '#FC4C02' }}>{state.stats.totalDistanceMi.toLocaleString()} mi</span></div>
          <div>ELEVATION <span style={{ color: '#FC4C02' }}>{state.stats.totalElevationFt.toLocaleString()} ft</span></div>
          <div>MOVING TIME <span style={{ color: '#FC4C02' }}>{state.stats.totalMovingTimeHrs.toLocaleString()} hrs</span></div>
          {state.coverage && (
            <div style={{ marginTop: 6 }}>
              STREETS RUN <span style={{ color: '#FC4C02' }}>{state.coverage.combined.pct}%</span>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                {state.coverage.combined.coveredMiles.toLocaleString()} / {state.coverage.combined.totalMiles.toLocaleString()} mi · Boulder streets + paths
              </div>
            </div>
          )}
          {state.stats.mostRecent && (
            <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.4)' }}>
              LAST: {state.stats.mostRecent.name} · {state.stats.mostRecent.date}
            </div>
          )}
        </div>
      )}

      {!state.loading && !state.configured && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Space Mono", monospace', color: 'rgba(255,255,255,0.4)', fontSize: 12,
        }}>
          strava not connected — nothing to show yet
        </div>
      )}

      {!state.loading && state.configured && state.terrain && (
        <StravaCanvas activities={state.activities} terrain={state.terrain} />
      )}
    </div>
  )
}
