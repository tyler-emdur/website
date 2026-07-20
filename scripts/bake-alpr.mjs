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
  //
  // Boulder County Parks & Open Space points cameras at trailhead parking lots
  // so you can see whether the lot is full before you drive up, and publishes
  // every one of them as a plain JPEG on a ten-minute loop. The authoritative
  // list is the county's own "Live Trailhead Cameras" page; OSM knows about one
  // of the twenty-five. The counts per property are not uniform and the file
  // naming is not either — Ron Stewart has five, Carolyn Holmberg has one and
  // calls it parkinglot.jpg — so this is enumerated rather than generated.
  //
  // This is the whole reason the board has anything to look at. Twenty-five
  // cameras in this county exist to show a person a picture. Seventy-four exist
  // to produce a plate number. Note where Coalton is: Superior, a town with
  // fourteen readers in it. Same town, opposite job.
  //
  // These run on solar. The county warns they may not work during cloudy
  // weather, which is why the live/frozen check below matters — some of these
  // legitimately go dark for a day and come back.
  const OPEN_SPACE = [
    { slug: 'walker', name: 'Walker Ranch', lat: 39.95125, lon: -105.33744, cams: 4 },
    { slug: 'heil', name: 'Heil Valley Ranch', lat: 40.14670, lon: -105.30330, cams: 4 },
    { slug: 'pella', name: 'Pella Crossing', lat: 40.18560, lon: -105.18150, cams: 4 },
    { slug: 'lagerman', name: 'Lagerman Preserve', lat: 40.15830, lon: -105.18750, cams: 4 },
    { slug: 'coalton', name: 'Coalton Trailhead', lat: 39.93760, lon: -105.16160, cams: 4 },
    { slug: 'rsp', name: 'Ron Stewart Preserve', lat: 40.24440, lon: -105.22310, cams: 5 },
    { slug: 'chp', name: 'Carolyn Holmberg Preserve', lat: 39.95530, lon: -105.12440, file: 'parkinglot.jpg' },
  ]
  const SEEDS = [
    ...OPEN_SPACE.flatMap(p => p.file
      ? [{
          lat: p.lat, lon: p.lon, name: p.name,
          operator: 'Boulder County Parks & Open Space',
          url: `https://bouldercountyopenspace.org/photos/${p.slug}/${p.file}`,
        }]
      : Array.from({ length: p.cams }, (_, i) => ({
          lat: p.lat, lon: p.lon, name: `${p.name} ${i + 1}`,
          operator: 'Boulder County Parks & Open Space',
          url: `https://bouldercountyopenspace.org/photos/${p.slug}/live${i + 1}.jpg`,
        }))),
    { lat: 40.0274, lon: -105.2519, name: 'Flatiron Cam', operator: 'Boulder Flatiron Cam', url: 'https://boulderflatironcam.com/live/bfc.jpg' },
    { lat: 40.0274, lon: -105.2519, name: 'Flatiron Cam SC', operator: 'Boulder Flatiron Cam', url: 'https://boulderflatironcam.com/bfc/bfcsc.jpg' },
    { lat: 40.0274, lon: -105.2519, name: 'Flatiron Netcam', operator: 'Boulder Flatiron Cam', url: 'https://boulderflatironcam.com/bfc/netcam.jpg' },
  ]
  // Seeds go first: OSM has some of these same URLs with no name on them, and
  // dedupe keeps whichever it sees first. A named camera is a better row.
  candidates.unshift(...SEEDS)

  // ── the four that undo the joke ─────────────────────────────────────────────
  // The City of Boulder publishes live video — not stills, video — from four
  // signalised intersections, open HLS with no key and no referer check.
  // Every other camera in this file is either pointed at an empty parking lot
  // or pointed at your plate. These are pointed at the intersection itself,
  // and at Broadway & Canyon a Boulder PD reader stands sixty-five metres from
  // the lens. You can watch the exact piece of road where the board gets its
  // rows, in real time, at 480p, because the city put it on the internet.
  //
  // Coordinates are the intersections, not the poles: the city does not say
  // where the cameras are mounted, only what they are looking at.
  // ── CDOT ────────────────────────────────────────────────────────────────────
  // The state's camera network is a plain open JSON API with no key on it:
  // cotg.carsprogram.org/cameras_v1/api/cameras returns all ~1,028 of them
  // statewide, each with an HLS view. Ten stand inside this bounding box, and
  // nine of those are strung along US 36 in milepost order from 37.15 to 44.90
  // — which is to say the state films the entire Boulder-to-Denver turnpike,
  // continuously, one camera every mile or so, and hands you the playlists.
  //
  // Fetched and filtered rather than hardcoded so the list follows the state's.
  // The liveness check is not ceremony: MP 44.90 answers the API and does not
  // answer with a stream.
  const CDOT_API = 'https://cotg.carsprogram.org/cameras_v1/api/cameras'
  // "US 36 MP 037.15 EB : 0.1 miles E of Colorado Ave" is a machine's name for
  // a place. A board that already speaks in coordinates and timestamps wants
  // the route and the milepost and nothing else.
  const cdotName = (n) => {
    const m = /^(.+?)\s+MP\s+(\d+\.\d+)\s+(EB|WB|NB|SB)/.exec(n)
    // parseFloat would turn 037.50 into "37.5"; a milepost keeps both decimals
    return m ? `${m[1]} MP ${parseFloat(m[2]).toFixed(2)} ${m[3]}` : n.slice(0, 26)
  }

  const CITY_CAMS = [
    { slug: 'broadway_and_canyon', name: 'Broadway & Canyon', lat: 40.01650, lon: -105.27970 },
    { slug: 'foothills_and_arapahoe', name: 'Foothills & Arapahoe', lat: 40.01430, lon: -105.22640 },
    { slug: '28th_and_colorado', name: '28th & Colorado', lat: 40.00720, lon: -105.26070 },
    { slug: '28th_and_iris', name: '28th & Iris', lat: 40.03330, lon: -105.26070 },
  ]

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
          kind: 'still',
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
  // A still is proved live by its Last-Modified. A stream has no such thing —
  // what proves it is that the playlist parses and names a rendition. If the
  // encoder is down the server still answers, so "200" alone is not enough.
  for (const c of CITY_CAMS) {
    const url = `https://videostream.bouldercolorado.gov/live/smil:${c.slug}.smil/playlist.m3u8`
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } })
      const body = r.ok ? await r.text() : ''
      const live = body.startsWith('#EXTM3U') && /EXT-X-STREAM-INF/.test(body)
      if (live) {
        feeds.push({
          kind: 'video',
          lat: c.lat, lon: c.lon, name: c.name, url,
          operator: 'City of Boulder',
          lastModified: null, ageHours: 0, live: true,
        })
        console.log(`  LIVE    ${url}  (hls)`)
      } else {
        console.log(`  no stream     ${url}  (${r.status})`)
      }
    } catch {
      console.log(`  unreachable   ${url}`)
    }
  }

  try {
    const res = await fetch(CDOT_API, { headers: { 'User-Agent': UA } })
    const cams = res.ok ? await res.json() : []
    const inBox = cams.filter(c =>
      c.active && c.public && c.views?.[0]?.url &&
      c.location &&
      c.location.latitude >= BBOX[0] && c.location.latitude <= BBOX[2] &&
      c.location.longitude >= BBOX[1] && c.location.longitude <= BBOX[3])
    console.log(`\n  CDOT: ${cams.length} statewide, ${inBox.length} in the box`)
    for (const c of inBox) {
      const url = c.views[0].url
      try {
        const r = await fetch(url, { headers: { 'User-Agent': UA } })
        const body = r.ok ? await r.text() : ''
        if (!body.startsWith('#EXTM3U') || !/EXT-X-STREAM-INF/.test(body)) {
          console.log(`  no stream     ${c.id}  ${c.name}`)
          continue
        }
        feeds.push({
          kind: 'video',
          lat: +c.location.latitude.toFixed(5),
          lon: +c.location.longitude.toFixed(5),
          name: cdotName(c.name),
          url,
          operator: c.cameraOwner?.name ?? 'Colorado DOT',
          lastModified: null, ageHours: 0, live: true,
        })
        console.log(`  LIVE    ${c.id}  ${cdotName(c.name)}`)
      } catch {
        console.log(`  unreachable   ${c.id}  ${c.name}`)
      }
    }
  } catch {
    console.log('  CDOT: camera API did not answer; skipping')
  }

  const liveN = feeds.filter(f => f.live).length
  const videoN = feeds.filter(f => f.live && f.kind === 'video').length
  console.log(`  ${liveN} live (${videoN} video), ${feeds.length - liveN} frozen\n`)

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
