// Incrementally fetches full-resolution GPS streams (not the lossy
// summary_polyline) for every Strava run, caching one file per activity so
// re-runs only fetch what's new. Self-throttles against Strava's 100/15min,
// 1000/day read limits — safe to run in the background across multiple
// invocations until everything is cached.
//
// Run: node --env-file=.env.local scripts/street-coverage/2-fetch-strava-traces.mjs
// Output: data/street-coverage/gps-cache/{activityId}.json (one per run)
//         data/street-coverage/activities-index.json (list of all Run activities)

import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'

const CACHE_DIR = 'data/street-coverage/gps-cache'
const INDEX_PATH = 'data/street-coverage/activities-index.json'
const PER_CALL_DELAY_MS = 400
const WINDOW_SOFT_CAP = 85   // stay under 100/15min
const DAILY_SOFT_CAP = 900   // stay under 1000/day

// Generous pre-filter (list endpoint already gives start/end latlng, no
// extra API call needed) — skips runs nowhere near Boulder before spending
// any rate-limit budget on them. Wider than the street network's own bbox
// so nothing borderline gets dropped before the real spatial match.
const BOULDER_LAT = 40.02, BOULDER_LNG = -105.27, PREFILTER_RADIUS_MI = 15
function haversineMi(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}
function nearBoulder(activity) {
  const pts = [activity.start_latlng, activity.end_latlng].filter(p => Array.isArray(p) && p.length === 2)
  return pts.some(([lat, lng]) => haversineMi(lat, lng, BOULDER_LAT, BOULDER_LNG) <= PREFILTER_RADIUS_MI)
}

async function getToken() {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })
  const d = await res.json()
  if (!d.access_token) throw new Error('token refresh failed: ' + JSON.stringify(d))
  return d.access_token
}

function parseUsage(res) {
  const h = res.headers.get('x-readratelimit-usage') || res.headers.get('x-ratelimit-usage')
  if (!h) return null
  const [win, day] = h.split(',').map(Number)
  return { win, day }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchAllActivities(token) {
  const all = []
  for (let page = 1; page <= 8; page++) {
    const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=100&page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) { console.error('activities page', page, 'failed', res.status); break }
    const batch = await res.json()
    if (batch.length === 0) break
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}

mkdirSync(CACHE_DIR, { recursive: true })

const token = await getToken()
console.error('fetching activity list...')
const raw = await fetchAllActivities(token)
const allRuns = raw.filter(a => a.type === 'Run' && !a.manual)
const runs = allRuns.filter(nearBoulder)
console.error(`${raw.length} total activities, ${allRuns.length} runs, ${runs.length} near Boulder (within ${PREFILTER_RADIUS_MI}mi)`)
writeFileSync(INDEX_PATH, JSON.stringify(runs.map(a => ({ id: a.id, name: a.name, date: a.start_date, distance: a.distance }))))

const already = new Set(readdirSync(CACHE_DIR).map(f => f.replace('.json', '')))
const todo = runs.filter(a => !already.has(String(a.id)))
console.error(`${already.size} already cached, ${todo.length} to fetch`)

let fetched = 0, failed = 0
for (const activity of todo) {
  const res = await fetch(`https://www.strava.com/api/v3/activities/${activity.id}/streams?keys=latlng&key_by_type=true`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 429) {
    console.error('rate limited — sleeping 15 minutes...')
    await sleep(15 * 60 * 1000 + 30000)
    continue
  }

  if (!res.ok) {
    // no GPS data (e.g. treadmill run) — cache an empty marker so we don't retry forever
    writeFileSync(`${CACHE_DIR}/${activity.id}.json`, JSON.stringify({ points: [] }))
    failed++
    continue
  }

  const data = await res.json()
  const points = data.latlng?.data ?? []
  writeFileSync(`${CACHE_DIR}/${activity.id}.json`, JSON.stringify({ points }))
  fetched++

  if (fetched % 20 === 0) console.error(`fetched ${fetched}/${todo.length} (${failed} empty)`)

  const usage = parseUsage(res)
  if (usage) {
    if (usage.day >= DAILY_SOFT_CAP) {
      console.error(`daily cap reached (${usage.day}/${DAILY_SOFT_CAP}) — stopping, resume tomorrow`)
      break
    }
    if (usage.win >= WINDOW_SOFT_CAP) {
      console.error(`15-min window cap reached (${usage.win}/${WINDOW_SOFT_CAP}) — sleeping 15 minutes...`)
      await sleep(15 * 60 * 1000 + 30000)
      continue
    }
  }
  await sleep(PER_CALL_DELAY_MS)
}

console.error(`done this pass: ${fetched} fetched, ${failed} empty/no-gps`)
const stillTodo = runs.filter(a => !existsSync(`${CACHE_DIR}/${a.id}.json`))
console.error(`${stillTodo.length} activities still remaining — re-run this script to continue`)
