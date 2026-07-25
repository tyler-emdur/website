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
    terrainLoaded: boolean
    stravaLoaded: boolean
    configured: boolean
    activities: RouteActivity[]
    stats: Stats | null
    terrain: TerrainData | null
    coverage: StreetCoverageResponse | null
  }>({ terrainLoaded: false, stravaLoaded: false, configured: true, activities: [], stats: null, terrain: null, coverage: null })

  // Three independent loads, fastest-first, because they have wildly different
  // costs and only one of them is the world.
  //
  //   terrain.json        8kB, ~40ms   — the ground. This IS the place.
  //   /api/strava         1.1MB        — 23ms warm, but ~21s on a cold cache
  //                                      miss (OAuth refresh + 6 sequential
  //                                      Strava pages, revalidated 6-hourly).
  //   street-coverage     3.8MB raw    — ~150ms gzipped; feeds one line of text.
  //
  // These used to share one Promise.all, so every visitor waited on the slowest
  // — and whoever arrived first after a revalidation stared at a black screen
  // for twenty seconds while the ground sat there already downloaded.
  useEffect(() => {
    let cancelled = false

    // terrain is baked at build time (scripts/bake-terrain.mjs) — static, CDN-cached
    ;(fetch('/terrain.json').then(r => r.json()) as Promise<TerrainResponse>)
      .then(terrain => {
        if (cancelled) return
        setState(s => ({
          ...s,
          terrainLoaded: true,
          terrain: terrain.configured && terrain.elevations.length > 0
            ? { resolution: terrain.resolution, radius: terrain.radius, elevations: terrain.elevations }
            : null,
        }))
      })
      .catch(() => { if (!cancelled) setState(s => ({ ...s, terrainLoaded: true })) })

    ;(fetch('/api/strava').then(r => r.json()) as Promise<StravaResponse>)
      .then(strava => {
        if (cancelled) return
        setState(s => ({
          ...s,
          stravaLoaded: true,
          configured: strava.configured,
          activities: strava.activities ?? [],
          stats: strava.stats ?? null,
        }))
      })
      .catch(() => { if (!cancelled) setState(s => ({ ...s, stravaLoaded: true, configured: false })) })

    // street coverage is baked periodically (scripts/street-coverage/*) — static,
    // CDN-cached. Optional: older deploys or a not-yet-baked file simply omit the
    // stat, and it fills in whenever it arrives.
    ;(fetch('/street-coverage.json')
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null) as Promise<StreetCoverageResponse | null>)
      .then(coverage => { if (!cancelled) setState(s => ({ ...s, coverage })) })

    return () => { cancelled = true }
  }, [])

  return (
    <div data-world="2" style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#050506' }}>
      {/* Mounted up-front and never gated on the data — see the note on
          StravaCanvas. Gating it is what stalled R3F's container measurement and
          left the world as a permanently black canvas. It sits first in the DOM
          at z-index 0 so the overlays below keep painting over it. */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <StravaCanvas activities={state.activities} terrain={state.terrain} />
      </div>

      <HomeButton />

      {state.stravaLoaded && state.configured && state.stats && (
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

      {/* Only covers the gap before the ground lands — ~40ms now that it no
          longer waits on Strava. The routes drop in afterwards, on their own. */}
      {!state.terrainLoaded && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Space Mono", monospace', color: 'rgba(255,255,255,0.35)', fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase',
        }}>
          <span className="w2-surveying">surveying boulder</span>
        </div>
      )}

      {/* Two distinct failures, each said honestly. Splitting the loads split
          the error states with them: `configured` used to fold the terrain and
          the Strava connection together, so a missing ground reported itself as
          a missing Strava account. Now a failed terrain fetch says so, instead
          of leaving a black canvas with a stats panel and no explanation —
          which is the exact failure this session set out to remove. */}
      {state.terrainLoaded && !state.terrain && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Space Mono", monospace', color: 'rgba(255,255,255,0.4)', fontSize: 12,
        }}>
          terrain unavailable — nothing to stand on yet
        </div>
      )}

      {state.terrainLoaded && state.terrain && state.stravaLoaded && !state.configured && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: 40, pointerEvents: 'none',
          fontFamily: '"Space Mono", monospace', color: 'rgba(255,255,255,0.4)', fontSize: 12,
        }}>
          strava not connected — no routes on the ground
        </div>
      )}
    </div>
  )
}
