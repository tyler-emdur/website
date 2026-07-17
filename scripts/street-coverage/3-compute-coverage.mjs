// Matches every cached GPS trace against the classified street network and
// computes per-street "run" status + overall coverage percentage.
//
// Run: node scripts/street-coverage/3-compute-coverage.mjs
// Output: public/street-coverage.json (served directly to the client, same
//         pattern as public/terrain.json)

import { readFileSync, readdirSync, writeFileSync } from 'fs'

const CACHE_DIR = 'data/street-coverage/gps-cache'
const STREETS_PATH = 'data/street-coverage/streets.json'
const OUT_PATH = 'public/street-coverage.json'

// How close a GPS point must be to a street's polyline to count as "run" —
// wide enough for normal phone-GPS drift (typically 5-15m in open sky,
// worse downtown between buildings), tight enough not to bleed across a
// parallel street one block over.
const MATCH_METERS = 20

const METERS_PER_DEG_LAT = 110574
function metersPerDegLng(lat) { return 111320 * Math.cos(lat * Math.PI / 180) }

// Local equirectangular projection centered on Boulder — fine at this scale,
// and much cheaper per-point than haversine for the inner matching loop.
const originLat = 40.02
const mLng = metersPerDegLng(originLat)
function toXY(lat, lng) {
  return [(lng - (-105.27)) * mLng, (lat - originLat) * METERS_PER_DEG_LAT]
}

function pointToSegmentDist(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay
  const apx = px - ax, apy = py - ay
  const lenSq = abx * abx + aby * aby
  let t = lenSq > 0 ? (apx * abx + apy * aby) / lenSq : 0
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * abx, cy = ay + t * aby
  return Math.hypot(px - cx, py - cy)
}

console.error('loading streets...')
const streets = JSON.parse(readFileSync(STREETS_PATH, 'utf8'))
console.error(`${streets.length} eligible streets/paths`)

// project street geometry once
for (const s of streets) {
  s.xy = s.points.map(([lat, lng]) => toXY(lat, lng))
  s.covered = false
}

// Spatial grid over street segments (cell = ~50m) so each GPS point only
// checks nearby segments instead of the whole network.
const CELL = 50
const grid = new Map()
function cellKey(x, y) { return `${Math.floor(x / CELL)},${Math.floor(y / CELL)}` }
function addToGrid(key, entry) {
  if (!grid.has(key)) grid.set(key, [])
  grid.get(key).push(entry)
}

for (let si = 0; si < streets.length; si++) {
  const xy = streets[si].xy
  for (let i = 1; i < xy.length; i++) {
    const [ax, ay] = xy[i - 1], [bx, by] = xy[i]
    const minCx = Math.floor(Math.min(ax, bx) / CELL) - 1
    const maxCx = Math.floor(Math.max(ax, bx) / CELL) + 1
    const minCy = Math.floor(Math.min(ay, by) / CELL) - 1
    const maxCy = Math.floor(Math.max(ay, by) / CELL) + 1
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        addToGrid(`${cx},${cy}`, { si, i })
      }
    }
  }
}
console.error(`spatial grid: ${grid.size} cells`)

const files = readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'))
console.error(`${files.length} cached activities`)

let totalGpsPoints = 0
for (const f of files) {
  const { points } = JSON.parse(readFileSync(`${CACHE_DIR}/${f}`, 'utf8'))
  totalGpsPoints += points.length
  for (const [lat, lng] of points) {
    const [px, py] = toXY(lat, lng)
    const cx = Math.floor(px / CELL), cy = Math.floor(py / CELL)
    const seen = new Set()
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(`${cx + dx},${cy + dy}`)
        if (!bucket) continue
        for (const { si, i } of bucket) {
          const key = si * 100000 + i
          if (seen.has(key)) continue
          seen.add(key)
          if (streets[si].covered) continue // already matched, skip re-checking this street
          const xy = streets[si].xy
          const d = pointToSegmentDist(px, py, xy[i - 1][0], xy[i - 1][1], xy[i][0], xy[i][1])
          if (d <= MATCH_METERS) streets[si].covered = true
        }
      }
    }
  }
}
console.error(`processed ${totalGpsPoints} GPS points`)

const streetOnly = streets.filter(s => s.category === 'street')
const pathOnly = streets.filter(s => s.category === 'path')

function summarize(list) {
  const totalM = list.reduce((s, w) => s + w.lengthMeters, 0)
  const coveredM = list.filter(w => w.covered).reduce((s, w) => s + w.lengthMeters, 0)
  return {
    totalMiles: Math.round(totalM / 1609.34 * 10) / 10,
    coveredMiles: Math.round(coveredM / 1609.34 * 10) / 10,
    pct: totalM > 0 ? Math.round((coveredM / totalM) * 1000) / 10 : 0,
    segmentCount: list.length,
    coveredSegmentCount: list.filter(w => w.covered).length,
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  matchThresholdMeters: MATCH_METERS,
  streets: summarize(streetOnly),
  paths: summarize(pathOnly),
  combined: summarize(streets),
  uncovered: streets
    .filter(w => !w.covered)
    .map(w => ({ id: w.id, name: w.name, category: w.category, lengthMeters: w.lengthMeters }))
    .sort((a, b) => b.lengthMeters - a.lengthMeters),
  segments: streets.map(w => ({
    id: w.id, name: w.name, category: w.category, covered: w.covered, points: w.points,
  })),
}

console.error('--- results ---')
console.error('streets:', result.streets)
console.error('paths:', result.paths)
console.error('combined:', result.combined)

writeFileSync(OUT_PATH, JSON.stringify(result))
console.error(`wrote ${OUT_PATH}`)
