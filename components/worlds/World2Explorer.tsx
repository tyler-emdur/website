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

export default function World2Explorer() {
  const [state, setState] = useState<{
    loading: boolean
    configured: boolean
    activities: RouteActivity[]
    stats: Stats | null
    terrain: TerrainData | null
  }>({ loading: true, configured: true, activities: [], stats: null, terrain: null })

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/strava').then(r => r.json()) as Promise<StravaResponse>,
      fetch('/api/terrain').then(r => r.json()) as Promise<TerrainResponse>,
    ])
      .then(([strava, terrain]) => {
        if (cancelled) return
        setState({
          loading: false,
          configured: strava.configured && terrain.configured && terrain.elevations.length > 0,
          activities: strava.activities ?? [],
          stats: strava.stats ?? null,
          terrain: terrain.elevations.length > 0
            ? { resolution: terrain.resolution, radius: terrain.radius, elevations: terrain.elevations }
            : null,
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

      <div style={{
        position: 'fixed', top: 20, left: 24, zIndex: 20, fontFamily: '"Space Mono", monospace', color: '#FC4C02',
      }}>
        <div style={{ fontSize: 13, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Boulder Explorer</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          {state.loading ? 'syncing strava & terrain…' : 'gps trace · every run & ride around boulder'}
        </div>
      </div>

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
