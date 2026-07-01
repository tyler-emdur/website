import { NextResponse } from 'next/server'
import { BOULDER_LAT, BOULDER_LNG, GEO_RADIUS_MI, GEO_RADIUS_WORLD, project, haversineMi } from '@/lib/geo'

const RESAMPLE_SPACING = 1.5      // world units between resampled dots
const MAX_PAGES = 6                // 6 * 100 = 600 activities ceiling

interface RawActivity {
  id: number
  name: string
  type: string
  start_date: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  manual: boolean
  map?: { summary_polyline?: string | null }
}

export interface RouteActivity {
  id: string
  type: 'Run' | 'Ride' | 'Other'
  name: string
  date: string
  distanceMi: number
  points: [number, number][]
}

async function getToken(): Promise<string | null> {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN, STRAVA_ACCESS_TOKEN } = process.env

  // Try refresh flow first (long-lived)
  if (STRAVA_CLIENT_ID && STRAVA_CLIENT_SECRET && STRAVA_REFRESH_TOKEN) {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        refresh_token: STRAVA_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.access_token) return data.access_token
    }
  }

  // Fall back to static access token
  return STRAVA_ACCESS_TOKEN ?? null
}

// Standard Google encoded-polyline decoder (precision 1e-5) — same format Strava's map.summary_polyline uses.
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = []
  let index = 0, lat = 0, lng = 0
  const len = encoded.length
  while (index < len) {
    let result = 1, shift = 0, b: number
    do {
      b = encoded.charCodeAt(index++) - 63 - 1
      result += b << shift
      shift += 5
    } while (b >= 0x1f)
    lat += (result & 1) ? ~(result >> 1) : (result >> 1)

    result = 1; shift = 0
    do {
      b = encoded.charCodeAt(index++) - 63 - 1
      result += b << shift
      shift += 5
    } while (b >= 0x1f)
    lng += (result & 1) ? ~(result >> 1) : (result >> 1)

    points.push([lat * 1e-5, lng * 1e-5])
  }
  return points
}

// Resample a projected polyline at fixed arc-length spacing to get a dense dot trail.
// `acc` tracks distance walked since the last emitted dot, carried across segment boundaries.
function resample(points: [number, number][], spacing: number): [number, number][] {
  if (points.length < 2) return points
  const out: [number, number][] = [points[0]]
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const [x0, z0] = points[i - 1]
    const [x1, z1] = points[i]
    const segLen = Math.hypot(x1 - x0, z1 - z0)
    if (segLen === 0) continue
    const dx = (x1 - x0) / segLen
    const dz = (z1 - z0) / segLen
    let pos = 0 // distance walked along this segment so far
    while (acc + (segLen - pos) >= spacing) {
      const step = spacing - acc
      pos += step
      acc = 0
      out.push([x0 + dx * pos, z0 + dz * pos])
    }
    acc += segLen - pos
  }
  out.push(points[points.length - 1])
  return out
}

// The single longest run of consecutive points within `radius` of the origin — picking one
// contiguous stretch instead of filtering every in-bounds point avoids leaving short orphaned
// fragments stranded once whatever connected them to the main trail gets cut.
function longestInBoundsRun(points: [number, number][], radius: number): [number, number][] {
  let best: [number, number][] = []
  let current: [number, number][] = []
  for (const p of points) {
    if (Math.hypot(p[0], p[1]) <= radius) {
      current.push(p)
    } else {
      if (current.length > best.length) best = current
      current = []
    }
  }
  if (current.length > best.length) best = current
  return best
}

async function fetchAllActivities(token: string): Promise<RawActivity[]> {
  const all: RawActivity[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 21600 } } // 6h
    )
    if (!res.ok) break
    const batch: RawActivity[] = await res.json()
    if (batch.length === 0) break
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}

export async function GET() {
  try {
    const token = await getToken()
    if (!token) {
      return NextResponse.json({ configured: false, activities: [], stats: null }, { status: 200 })
    }

    const raw = await fetchAllActivities(token)

    const activities: RouteActivity[] = []
    let totalDistanceMi = 0
    let totalElevationFt = 0
    let totalMovingTimeS = 0
    let mostRecent: { name: string; date: string } | null = null

    for (const a of raw) {
      if (a.manual) continue
      const encoded = a.map?.summary_polyline
      if (!encoded) continue

      const type: RouteActivity['type'] =
        a.type === 'Run' ? 'Run' : a.type === 'Ride' ? 'Ride' : 'Other'

      const decoded = decodePolyline(encoded)
      if (decoded.length < 2) continue

      const [startLat, startLng] = decoded[0]
      if (haversineMi(startLat, startLng, BOULDER_LAT, BOULDER_LNG) > GEO_RADIUS_MI) continue

      const projected = decoded.map(([lat, lng]) => project(lat, lng))
      const resampled = resample(projected, RESAMPLE_SPACING)
      // Keep only the longest contiguous in-bounds stretch of the route — an included activity's
      // start point can be in-bounds while the rest of its path drifts off the visible map, and
      // simply filtering every in-bounds point (regardless of position in the sequence) can leave
      // a short orphaned tail stranded on its own once the connecting middle section is cut,
      // rendering as a disconnected floating fragment with nothing tying it to the main trail.
      const points = longestInBoundsRun(resampled, GEO_RADIUS_WORLD * 0.9)
      if (points.length === 0) continue

      activities.push({
        id: String(a.id),
        type,
        name: a.name,
        date: a.start_date.split('T')[0],
        distanceMi: a.distance / 1609.34,
        points,
      })

      totalDistanceMi += a.distance / 1609.34
      totalElevationFt += a.total_elevation_gain * 3.28084
      totalMovingTimeS += a.moving_time
      if (!mostRecent || a.start_date > mostRecent.date) {
        mostRecent = { name: a.name, date: a.start_date.split('T')[0] }
      }
    }

    return NextResponse.json({
      configured: true,
      activities,
      stats: {
        count: activities.length,
        totalDistanceMi: Math.round(totalDistanceMi),
        totalElevationFt: Math.round(totalElevationFt),
        totalMovingTimeHrs: Math.round(totalMovingTimeS / 3600),
        mostRecent,
      },
    })
  } catch (e) {
    return NextResponse.json({ configured: false, error: String(e), activities: [], stats: null }, { status: 200 })
  }
}
