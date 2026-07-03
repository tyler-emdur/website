// One-time bake of the Boulder terrain grid — mirrors app/api/terrain/route.ts
const BOULDER_LAT = 40.046
const BOULDER_LNG = -105.233
const METERS_PER_LAT_DEG = 110574
const METERS_PER_LNG_DEG = 111320 * Math.cos(BOULDER_LAT * Math.PI / 180)
const SCALE = 1 / 80
const GEO_RADIUS_MI = 6.5
const GEO_RADIUS_WORLD = (GEO_RADIUS_MI * 1609.34) * SCALE
const RESOLUTION = 40
const PER_REQ = 100

function unproject(x, z) {
  const lng = BOULDER_LNG + x / (METERS_PER_LNG_DEG * SCALE)
  const lat = BOULDER_LAT - z / (METERS_PER_LAT_DEG * SCALE)
  return [lat, lng]
}

const pts = []
for (let row = 0; row < RESOLUTION; row++) {
  const z = GEO_RADIUS_WORLD - (row / (RESOLUTION - 1)) * (GEO_RADIUS_WORLD * 2)
  for (let col = 0; col < RESOLUTION; col++) {
    const x = -GEO_RADIUS_WORLD + (col / (RESOLUTION - 1)) * (GEO_RADIUS_WORLD * 2)
    pts.push(unproject(x, z))
  }
}

const elevations = new Array(pts.length).fill(0)
for (let i = 0; i < pts.length; i += PER_REQ) {
  const batch = pts.slice(i, i + PER_REQ)
  const locations = batch.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join('|')
  const res = await fetch(`https://api.opentopodata.org/v1/srtm30m?locations=${locations}`)
  if (!res.ok) { console.error('batch', i, 'failed', res.status); process.exit(1) }
  const data = await res.json()
  data.results.forEach((r, j) => { elevations[i + j] = Math.round((r.elevation ?? 0) * 10) / 10 })
  console.error(`batch ${i / PER_REQ + 1}/16 ok`)
  if (i + PER_REQ < pts.length) await new Promise(r => setTimeout(r, 1100))
}

console.log(JSON.stringify({ configured: true, resolution: RESOLUTION, radius: GEO_RADIUS_WORLD, elevations }))
