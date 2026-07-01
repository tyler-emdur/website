// Shared Boulder-centered projection used by both the Strava route trace and the terrain mesh,
// so points and ground line up in the same coordinate space.

// Calibrated against Tyler's actual Strava heatmap: shifted east of downtown (toward Gunbarrel/
// Niwot) since he rarely runs deep into the western foothills (Sunshine/Gold Hill excluded) but
// regularly covers ground well east of downtown toward Louisville. Downtown, the Wonderland Lake
// loop, Gunbarrel, and Niwot all land comfortably inside; Lafayette/Superior sit right at the edge.
export const BOULDER_LAT = 40.046
export const BOULDER_LNG = -105.195
export const METERS_PER_LAT_DEG = 110574
export const METERS_PER_LNG_DEG = 111320 * Math.cos(BOULDER_LAT * Math.PI / 180)

export const SCALE = 1 / 80       // meters -> three.js world units
export const GEO_RADIUS_MI = 6.5  // wide enough for the east side, still drops the deep west mountains
export const GEO_RADIUS_WORLD = (GEO_RADIUS_MI * 1609.34) * SCALE

// lat/lng -> Boulder-centered planar meters -> scaled world units (x, z)
export function project(lat: number, lng: number): [number, number] {
  const x = (lng - BOULDER_LNG) * METERS_PER_LNG_DEG * SCALE
  const z = -(lat - BOULDER_LAT) * METERS_PER_LAT_DEG * SCALE // north = -Z
  return [x, z]
}

// world x/z -> lat/lng, for sampling elevation at arbitrary grid points
export function unproject(x: number, z: number): [number, number] {
  const lng = BOULDER_LNG + x / (METERS_PER_LNG_DEG * SCALE)
  const lat = BOULDER_LAT - z / (METERS_PER_LAT_DEG * SCALE)
  return [lat, lng]
}

export function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}
