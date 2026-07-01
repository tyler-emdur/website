import { NextResponse } from 'next/server'
import { GEO_RADIUS_WORLD, unproject } from '@/lib/geo'

const RESOLUTION = 40                    // 40x40 grid = 1600 sample points
const LOCATIONS_PER_REQUEST = 100        // Open Topo Data public-instance limit
const REQUEST_DELAY_MS = 1100            // stays under the ~1 req/sec public rate limit
const CACHE_SECONDS = 60 * 60 * 24 * 30  // terrain doesn't change — cache for 30 days

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Build the flat lat/lng list for a RESOLUTION x RESOLUTION grid covering the square
// bounding the Boulder cutout, row-major (matches how the client rebuilds a PlaneGeometry).
// PlaneGeometry's row `iy` sits at local_y = iy*segH - radius, and the client rotates the
// mesh -90° about X (so world_Z = -local_y) — row 0 therefore lands at world_Z = +radius,
// not -radius. `z` here is deliberately built to match that so terrain lines up with the
// Strava route trace, which is projected straight into world space with no rotation step.
function buildGridLatLng(): [number, number][] {
  const out: [number, number][] = []
  for (let row = 0; row < RESOLUTION; row++) {
    const z = GEO_RADIUS_WORLD - (row / (RESOLUTION - 1)) * (GEO_RADIUS_WORLD * 2)
    for (let col = 0; col < RESOLUTION; col++) {
      const x = -GEO_RADIUS_WORLD + (col / (RESOLUTION - 1)) * (GEO_RADIUS_WORLD * 2)
      out.push(unproject(x, z))
    }
  }
  return out
}

async function fetchElevations(points: [number, number][]): Promise<number[]> {
  const elevations: number[] = new Array(points.length).fill(0)

  for (let i = 0; i < points.length; i += LOCATIONS_PER_REQUEST) {
    const batch = points.slice(i, i + LOCATIONS_PER_REQUEST)
    const locations = batch.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join('|')

    const start = Date.now()
    const res = await fetch(
      `https://api.opentopodata.org/v1/srtm30m?locations=${locations}`,
      { next: { revalidate: CACHE_SECONDS } }
    )
    const wasNetworkFetch = Date.now() - start > 100 // fast response means Next served it from its fetch cache
    if (res.ok) {
      const data = await res.json()
      const results: { elevation: number | null }[] = data.results ?? []
      results.forEach((r, j) => { elevations[i + j] = r.elevation ?? 0 })
    }
    // only throttle when we actually hit the network — cached batches should return instantly
    if (wasNetworkFetch && i + LOCATIONS_PER_REQUEST < points.length) await sleep(REQUEST_DELAY_MS)
  }

  return elevations
}

export async function GET() {
  try {
    const gridLatLng = buildGridLatLng()
    const elevations = await fetchElevations(gridLatLng)

    return NextResponse.json({
      configured: true,
      resolution: RESOLUTION,
      radius: GEO_RADIUS_WORLD,
      elevations,
    })
  } catch (e) {
    return NextResponse.json({ configured: false, error: String(e), resolution: 0, radius: 0, elevations: [] }, { status: 200 })
  }
}
