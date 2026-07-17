// Fetches Boulder's OSM street network, classifies every way into
// street/path/excluded, and cross-references Boulder County's authoritative
// "Boulder Area Trails" GIS layer to separate real streets+urban paths from
// natural-surface OSMP recreation trails (Tyler wants "every street" —
// paths count, trails don't).
//
// Run: node scripts/street-coverage/1-fetch-osm-streets.mjs
// Output: data/street-coverage/streets.json

import { writeFileSync, mkdirSync } from 'fs'
import * as turf from '@turf/turf'

const BOULDER_RELATION_ID = 112298
const BBOX = { minLat: 39.9569362, maxLat: 40.0944658, minLng: -105.3014509, maxLng: -105.1780988 }
const OVERPASS_URL = 'https://overpass.openstreetmap.fr/api/interpreter'
const TRAILS_URL = 'https://maps.bouldercounty.org/arcgis/rest/services/ParksOpenSpace/REC_BoulderAreaTrails/FeatureServer/0/query'

// highway values that are never runnable streets
const HARD_EXCLUDE_HIGHWAY = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link', 'construction', 'proposed', 'raceway', 'corridor', 'bridleway'])
// unambiguously real streets/urban infrastructure
const STREET_HIGHWAY = new Set(['residential', 'tertiary', 'secondary', 'primary', 'unclassified', 'living_street', 'primary_link', 'secondary_link', 'tertiary_link', 'pedestrian', 'steps', 'busway'])
// ambiguous — resolved via surface tag + spatial check against the trails layer
const AMBIGUOUS_HIGHWAY = new Set(['footway', 'path', 'cycleway', 'track'])
const URBAN_FOOTWAY_SUBTYPE = new Set(['sidewalk', 'crossing', 'connector'])
const NATURAL_SURFACE = new Set(['dirt', 'ground', 'unpaved', 'gravel', 'fine_gravel', 'grass', 'rocks', 'earth', 'compacted'])

async function overpass(query) {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'curl/8.7.1',
      'Accept': '*/*',
    },
    body: 'data=' + encodeURIComponent(query),
  })
  if (!res.ok) throw new Error(`overpass ${res.status}`)
  return res.json()
}

console.error('fetching Boulder boundary relation...')
const boundaryData = await overpass(`[out:json][timeout:90];relation(${BOULDER_RELATION_ID});out geom;`)
const rel = boundaryData.elements[0]
const outerWays = rel.members.filter(m => m.role === 'outer').map(m => m.geometry.map(g => [g.lat, g.lon]))

function stitchRings(segments) {
  const segs = segments.map(s => [...s])
  const rings = []
  while (segs.length) {
    let ring = segs.shift()
    let changed = true
    while (changed) {
      changed = false
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i]
        const eq = (a, b) => a[0] === b[0] && a[1] === b[1]
        if (eq(ring[ring.length - 1], s[0])) { ring = ring.concat(s.slice(1)); segs.splice(i, 1); changed = true; break }
        if (eq(ring[ring.length - 1], s[s.length - 1])) { ring = ring.concat([...s].reverse().slice(1)); segs.splice(i, 1); changed = true; break }
        if (eq(ring[0], s[s.length - 1])) { ring = s.slice(0, -1).concat(ring); segs.splice(i, 1); changed = true; break }
        if (eq(ring[0], s[0])) { ring = [...s].reverse().slice(0, -1).concat(ring); segs.splice(i, 1); changed = true; break }
      }
    }
    rings.push(ring)
  }
  return rings
}

const rings = stitchRings(outerWays)
console.error(`stitched ${rings.length} boundary ring(s)`)
const cityPolygons = rings.map(r => {
  const poly = turf.polygon([r.map(([lat, lng]) => [lng, lat])])
  const lats = r.map(p => p[0]), lngs = r.map(p => p[1])
  const bbox = { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) }
  return { poly, bbox }
})

function insideCity(lat, lng) {
  for (const { poly, bbox } of cityPolygons) {
    if (lat < bbox.minLat || lat > bbox.maxLat || lng < bbox.minLng || lng > bbox.maxLng) continue
    if (turf.booleanPointInPolygon(turf.point([lng, lat]), poly)) return true
  }
  return false
}

console.error('fetching OSM street network in bbox...')
const streetsData = await overpass(
  `[out:json][timeout:180];way["highway"](${BBOX.minLat},${BBOX.minLng},${BBOX.maxLat},${BBOX.maxLng});out geom;`
)
console.error(`got ${streetsData.elements.length} ways`)

console.error('fetching Boulder County authoritative trails layer...')
const trailFeatures = []
let offset = 0
while (true) {
  const params = new URLSearchParams({
    geometry: `${BBOX.minLng},${BBOX.minLat},${BBOX.maxLng},${BBOX.maxLat}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'TRAILTYPE,SURTYPE',
    outSR: '4326',
    f: 'json',
    resultOffset: String(offset),
    resultRecordCount: '1000',
  })
  const res = await fetch(`${TRAILS_URL}?${params}`)
  const d = await res.json()
  const feats = d.features ?? []
  trailFeatures.push(...feats)
  if (feats.length < 1000) break
  offset += 1000
}
console.error(`got ${trailFeatures.length} trail segments`)

// Only soft-surface (natural) trail segments count as exclusion zones —
// hard-surface county "trails" like Boulder Creek Path are exactly the
// kind of path Tyler wants counted.
const softTrailSegments = []
for (const f of trailFeatures) {
  if (f.attributes.SURTYPE !== 'SoftSurface') continue
  const coords = f.geometry?.paths?.[0]
  if (!coords || coords.length < 2) continue
  for (let i = 1; i < coords.length; i++) {
    softTrailSegments.push([coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]]) // lat0,lng0,lat1,lng1
  }
}
console.error(`${softTrailSegments.length} soft-surface trail sub-segments as exclusion reference`)

const TRAIL_BUFFER_METERS = 15
// simple local planar projection (fine at Boulder's scale, much cheaper than haversine per-check)
const M_PER_LAT = 110574
const M_PER_LNG = 111320 * Math.cos(40.02 * Math.PI / 180)
const toXY = (lat, lng) => [(lng + 105.27) * M_PER_LNG, (lat - 40.02) * M_PER_LAT]

// grid-index the trail segments so each lookup only checks nearby cells
const TRAIL_CELL = 30
const trailGrid = new Map()
function trailCellKey(x, y) { return `${Math.floor(x / TRAIL_CELL)},${Math.floor(y / TRAIL_CELL)}` }
for (const [lat0, lng0, lat1, lng1] of softTrailSegments) {
  const [x0, y0] = toXY(lat0, lng0)
  const [x1, y1] = toXY(lat1, lng1)
  const minCx = Math.floor(Math.min(x0, x1) / TRAIL_CELL) - 1
  const maxCx = Math.floor(Math.max(x0, x1) / TRAIL_CELL) + 1
  const minCy = Math.floor(Math.min(y0, y1) / TRAIL_CELL) - 1
  const maxCy = Math.floor(Math.max(y0, y1) / TRAIL_CELL) + 1
  for (let cx = minCx; cx <= maxCx; cx++) {
    for (let cy = minCy; cy <= maxCy; cy++) {
      const key = `${cx},${cy}`
      if (!trailGrid.has(key)) trailGrid.set(key, [])
      trailGrid.get(key).push([x0, y0, x1, y1])
    }
  }
}
console.error(`trail grid: ${trailGrid.size} cells`)

function pointToSegDist(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay
  const apx = px - ax, apy = py - ay
  const lenSq = abx * abx + aby * aby
  let t = lenSq > 0 ? (apx * abx + apy * aby) / lenSq : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * abx), py - (ay + t * aby))
}

function nearSoftTrail(lat, lng) {
  const [px, py] = toXY(lat, lng)
  const cx = Math.floor(px / TRAIL_CELL), cy = Math.floor(py / TRAIL_CELL)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const bucket = trailGrid.get(`${cx + dx},${cy + dy}`)
      if (!bucket) continue
      for (const [ax, ay, bx, by] of bucket) {
        if (pointToSegDist(px, py, ax, ay, bx, by) <= TRAIL_BUFFER_METERS) return true
      }
    }
  }
  return false
}

const out = []
let excludedHard = 0, excludedPrivateService = 0, excludedOutOfCity = 0, excludedTrail = 0, includedStreet = 0, includedPath = 0

for (const way of streetsData.elements) {
  if (way.type !== 'way' || !way.geometry || way.geometry.length < 2) continue
  const tags = way.tags || {}
  const hw = tags.highway

  if (HARD_EXCLUDE_HIGHWAY.has(hw)) { excludedHard++; continue }

  if (hw === 'service') {
    const svc = tags.service
    if (svc === 'driveway' || svc === 'parking_aisle' || svc === 'drive-through') { excludedPrivateService++; continue }
  }
  if (hw === 'footway' && tags.footway === 'access_aisle') { excludedPrivateService++; continue }

  // check the way's midpoint against the actual city polygon (bbox pre-filter
  // makes per-point checks cheap; testing every vertex isn't worth the cost)
  const midG = way.geometry[Math.floor(way.geometry.length / 2)]
  const startG = way.geometry[0]
  const endG = way.geometry[way.geometry.length - 1]
  const inCity = insideCity(midG.lat, midG.lon) || insideCity(startG.lat, startG.lon) || insideCity(endG.lat, endG.lon)
  if (!inCity) { excludedOutOfCity++; continue }

  let category = null
  if (STREET_HIGHWAY.has(hw)) {
    category = 'street'
  } else if (hw === 'footway' && URBAN_FOOTWAY_SUBTYPE.has(tags.footway)) {
    category = 'path'
  } else if (AMBIGUOUS_HIGHWAY.has(hw) || hw === 'footway') {
    const surface = tags.surface
    const midpoint = way.geometry[Math.floor(way.geometry.length / 2)]
    const trailMatch = nearSoftTrail(midpoint.lat, midpoint.lon)
    const naturalSurfaceTag = surface && NATURAL_SURFACE.has(surface)
    if (trailMatch || (naturalSurfaceTag && hw !== 'cycleway')) {
      category = 'excluded_trail'
    } else {
      category = 'path'
    }
  } else {
    // anything else with a highway tag we didn't explicitly handle (rare tags) — include as street
    category = 'street'
  }

  if (category === 'excluded_trail') { excludedTrail++; continue }
  if (category === 'street') includedStreet++
  if (category === 'path') includedPath++

  const points = way.geometry.map(g => [g.lat, g.lon])
  let lengthMeters = 0
  for (let i = 1; i < points.length; i++) {
    lengthMeters += turf.distance(turf.point([points[i - 1][1], points[i - 1][0]]), turf.point([points[i][1], points[i][0]]), { units: 'kilometers' }) * 1000
  }

  out.push({
    id: way.id,
    name: tags.name || null,
    highway: hw,
    category,
    lengthMeters: Math.round(lengthMeters * 10) / 10,
    points,
  })
}

console.error('--- classification summary ---')
console.error('included as street:', includedStreet)
console.error('included as path:', includedPath)
console.error('excluded (motorway/trunk/etc):', excludedHard)
console.error('excluded (private driveway/parking/access):', excludedPrivateService)
console.error('excluded (outside city polygon):', excludedOutOfCity)
console.error('excluded (matched natural trail):', excludedTrail)
console.error('total eligible ways:', out.length)
const totalMeters = out.reduce((s, w) => s + w.lengthMeters, 0)
console.error('total eligible length:', (totalMeters / 1609.34).toFixed(1), 'miles')

mkdirSync('data/street-coverage', { recursive: true })
writeFileSync('data/street-coverage/streets.json', JSON.stringify(out))
console.error('wrote data/street-coverage/streets.json')
