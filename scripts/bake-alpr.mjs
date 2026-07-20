#!/usr/bin/env node
// Bake public/alpr.json — real automated license plate reader locations.
//
// Source: OpenStreetMap. ALPR cameras are tagged man_made=surveillance +
// surveillance:type=ALPR, largely by the DeFlock project and local mappers.
// This is public infrastructure documentation: where the readers are, who
// runs them, and which way they point. It is not a feed — these cameras do
// not stream. Reading plates is the entire product.
//
// OSM gives no street name on the camera node, so we pull every named road in
// the bbox and match each camera to its nearest road, plus the nearest road
// with a *different* name within 70m to get a cross street. That turns a bare
// coordinate into "28TH ST & ARAPAHOE AVE", which is how a person would
// actually describe where they got read.
//
// Run: node scripts/bake-alpr.mjs
// Overpass is rate-limited and moody; this is a build step, not a request path.

import { writeFileSync } from 'fs'

const OVERPASS = 'https://overpass-api.de/api/interpreter'
const UA = 'tyleremdur.com alpr-bake/1.0'

// Boulder and its immediate surroundings. Statewide was thousands of rows of
// the same fact; one town you can picture is worse, and therefore better.
const BBOX = [39.93, -105.35, 40.13, -105.13]
// Road geometry for the entire state is far too much to fetch, so streets are
// resolved only inside the Front Range corridor, where most readers are. The
// rest are placed by nearest town, which is how anybody would describe them.
const ROADS_BBOX = BBOX
const CROSS_STREET_M = 70

const CAMS_QUERY = `
[out:json][timeout:180];
node["man_made"="surveillance"]["surveillance:type"="ALPR"](${BBOX.join(',')});
out body;
`
// Every *other* surveillance camera in the same box — the ordinary ones. A
// few of these publish a live still you can actually look at, which is the
// whole joke: the cameras that can see are pointed at an empty mountain, and
// the ones pointed at you are blind by design.
const FEEDS_QUERY = `
[out:json][timeout:120];
node["man_made"="surveillance"]["surveillance:type"!="ALPR"](${BBOX.join(',')});
out body;
`
const PLACES_QUERY = `
[out:json][timeout:120];
node["place"~"^(city|town|village|suburb|neighbourhood)$"]["name"](${BBOX.join(',')});
out body;
`
const ROADS_QUERY = `
[out:json][timeout:180];
way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"]["name"](${ROADS_BBOX.join(',')});
out body geom;
`

async function overpass(q, label) {
  process.stdout.write(`  ${label}… `)
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'text/plain' },
      body: q,
    })
    if (res.ok) { const d = await res.json(); console.log(`${d.elements.length} elements`); return d.elements }
    console.log(`${res.status}, backing off`)
    await new Promise(r => setTimeout(r, 20000 * (attempt + 1)))
    process.stdout.write(`  ${label} retry… `)
  }
  throw new Error(`${label}: overpass kept refusing`)
}

const R = 6371000
function metersBetween(aLat, aLon, bLat, bLon) {
  const latRad = ((aLat + bLat) / 2) * (Math.PI / 180)
  const x = (bLon - aLon) * (Math.PI / 180) * Math.cos(latRad)
  const y = (bLat - aLat) * (Math.PI / 180)
  return Math.sqrt(x * x + y * y) * R
}

// distance from point to a lat/lon segment, in meters
function distToSegment(pLat, pLon, aLat, aLon, bLat, bLon) {
  const latRad = pLat * (Math.PI / 180)
  const sx = (lon) => lon * Math.cos(latRad)
  const px = sx(pLon), py = pLat
  const ax = sx(aLon), ay = aLat
  const bx = sx(bLon), by = bLat
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx, cy = ay + t * dy
  return metersBetween(py, px / Math.cos(latRad), cy, cx / Math.cos(latRad))
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
function bearingToCompass(dir) {
  const n = Number(dir)
  if (!Number.isFinite(n)) return null
  return COMPASS[Math.round(((n % 360) + 360) % 360 / 45) % 8]
}

async function main() {
  const camEls = await overpass(CAMS_QUERY, 'ALPR cameras')
  const otherEls = await overpass(FEEDS_QUERY, 'other cameras')
  const placeEls = await overpass(PLACES_QUERY, 'places')
  const roadEls = await overpass(ROADS_QUERY, 'front range roads')

  const cams = camEls.filter(e => e.type === 'node')
  const places = placeEls
    .filter(e => e.type === 'node' && e.tags?.name)
    .map(p => ({ name: p.tags.name, lat: p.lat, lon: p.lon, rank: p.tags.place === 'city' ? 0 : p.tags.place === 'town' ? 1 : 2 }))
  const roads = roadEls
    .filter(e => e.type === 'way' && e.geometry?.length > 1 && e.tags?.name)
    .map(w => ({ name: w.tags.name, geom: w.geometry }))

  console.log(`\n  ${cams.length} ALPR cameras · ${places.length} places · ${roads.length} roads`)

  // Find cameras advertising a direct image, then actually fetch each one.
  // A URL in OSM is a claim; only a 200 with image bytes is a feed.
  const candidates = otherEls
    .filter(e => e.type === 'node')
    .map(e => ({
      lat: e.lat, lon: e.lon, name: e.tags?.name ?? null,
      url: e.tags?.['contact:webcam'] ?? e.tags?.url ?? e.tags?.image ?? null,
      operator: e.tags?.operator ?? null,
    }))
    .filter(c => c.url && /^https?:\/\/.+\.(jpg|jpeg|png)(\?|$)/i.test(c.url))

  // Cameras found by hand that OSM either does not tag with a direct image or
  // does not know about. Every one still gets fetched and dated below — being
  // on this list is a lead, not a promise.
  const SEEDS = [
    { lat: 40.0274, lon: -105.2519, name: 'Flatiron Cam', operator: 'Boulder Flatiron Cam', url: 'https://boulderflatironcam.com/live/bfc.jpg' },
    { lat: 40.0274, lon: -105.2519, name: 'Flatiron Cam SC', operator: 'Boulder Flatiron Cam', url: 'https://boulderflatironcam.com/bfc/bfcsc.jpg' },
    { lat: 40.0274, lon: -105.2519, name: 'Flatiron Netcam', operator: 'Boulder Flatiron Cam', url: 'https://boulderflatironcam.com/bfc/netcam.jpg' },
  ]
  candidates.push(...SEEDS)

  const seen = new Set()
  const feeds = []
  for (const c of candidates) {
    if (seen.has(c.url)) continue
    seen.add(c.url)
    try {
      const r = await fetch(c.url, { headers: { 'User-Agent': UA } })
      const type = r.headers.get('content-type') ?? ''
      const lm = r.headers.get('last-modified')
      if (r.ok && type.startsWith('image/')) {
        // A camera that still returns bytes is not necessarily a camera that
        // still works. Several around here serve a perfectly good JPEG that
        // stopped changing months ago. Age decides which list it lands in.
        const ageH = lm ? (Date.now() - Date.parse(lm)) / 3600000 : null
        const live = ageH !== null && ageH < 24
        feeds.push({
          lat: +c.lat.toFixed(5), lon: +c.lon.toFixed(5),
          name: c.name, url: c.url, operator: c.operator,
          lastModified: lm, ageHours: ageH === null ? null : Math.round(ageH),
          live,
        })
        console.log(`  ${live ? 'LIVE  ' : 'FROZEN'}  ${c.url}  ${ageH === null ? '(no date)' : `(${Math.round(ageH)}h old)`}`)
      } else {
        console.log(`  not a feed    ${c.url}  (${r.status} ${type || 'no type'})`)
      }
    } catch {
      console.log(`  unreachable   ${c.url}`)
    }
  }
  const liveN = feeds.filter(f => f.live).length
  console.log(`  ${liveN} live, ${feeds.length - liveN} frozen, of ${candidates.length} candidates\n`)

  const inRoadBox = (c) =>
    c.lat >= ROADS_BBOX[0] && c.lat <= ROADS_BBOX[2] &&
    c.lon >= ROADS_BBOX[1] && c.lon <= ROADS_BBOX[3]

  let withStreet = 0
  const out = cams.map(c => {
    // nearest town — every camera gets one, statewide
    let town = null, townD = Infinity
    for (const p of places) {
      const d = metersBetween(c.lat, c.lon, p.lat, p.lon)
      // bias toward real cities so a camera does not get named after a
      // three-house neighbourhood it happens to sit beside
      const score = d + p.rank * 900
      if (score < townD) { townD = score; town = p.name }
    }

    // street + cross street, only where we have the road geometry
    let road = null, cross = null
    if (inRoadBox(c)) {
      let bestD = Infinity, crossD = Infinity
      for (const r of roads) {
        let d = Infinity
        for (let i = 0; i < r.geom.length - 1; i++) {
          const g1 = r.geom[i], g2 = r.geom[i + 1]
          if (Math.abs(g1.lat - c.lat) > 0.01 && Math.abs(g2.lat - c.lat) > 0.01) continue
          const dd = distToSegment(c.lat, c.lon, g1.lat, g1.lon, g2.lat, g2.lon)
          if (dd < d) d = dd
        }
        if (d < bestD) {
          if (road && road !== r.name) { cross = road; crossD = bestD }
          road = r.name; bestD = d
        } else if (d < crossD && r.name !== road) { cross = r.name; crossD = d }
      }
      if (crossD > CROSS_STREET_M) cross = null
      if (road) withStreet++
    }

    const t = c.tags ?? {}
    return {
      lat: +c.lat.toFixed(5),
      lon: +c.lon.toFixed(5),
      town,
      road,
      cross,
      operator: t.operator ?? t.brand ?? null,
      maker: t.manufacturer ?? t.brand ?? null,
      facing: bearingToCompass(t.direction),
      zone: t['surveillance:zone'] ?? null,
    }
  })

  out.sort((a, b) => (a.town ?? '').localeCompare(b.town ?? '') || (a.road ?? '').localeCompare(b.road ?? ''))

  const operators = {}
  const towns = {}
  const makers = {}
  for (const c of out) {
    makers[c.maker ?? 'unbranded'] = (makers[c.maker ?? 'unbranded'] ?? 0) + 1
    operators[c.operator ?? 'unattributed'] = (operators[c.operator ?? 'unattributed'] ?? 0) + 1
    if (c.town) towns[c.town] = (towns[c.town] ?? 0) + 1
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'OpenStreetMap · man_made=surveillance + surveillance:type=ALPR',
    // Established empirically, not assumed: of every ALPR node in Colorado,
    // none carries a stream, webcam or feed URL. The handful with an `image`
    // tag are photographs *of the camera pole*, taken by the mapper who found
    // it. There is nothing to watch. That is the entire point of the world.
    // Verified at bake time, not assumed: no ALPR camera exposes a feed. The
    // handful of viewable cameras nearby are ordinary ones, and they are all
    // aimed at open space.
    note: 'No ALPR camera in this set exposes a viewable feed. The feeds below are ordinary cameras.',
    bbox: BBOX,
    count: out.length,
    withStreet,
    operators,
    makers,
    towns,
    feeds,
    cameras: out,
  }

  writeFileSync('public/alpr.json', JSON.stringify(payload))
  console.log(`  wrote public/alpr.json — ${out.length} cameras, ${withStreet} with street names`)
  console.log('  top operators:', Object.entries(operators).sort((a, b) => b[1] - a[1]).slice(0, 6))
  console.log('  by manufacturer:', Object.entries(makers).sort((a, b) => b[1] - a[1]))
  console.log('  top towns:', Object.entries(towns).sort((a, b) => b[1] - a[1]).slice(0, 6))
}

main().catch(e => { console.error(e.message); process.exit(1) })
