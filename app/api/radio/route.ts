import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

// Live internet radio for the Garage. Stations come from the radio-browser.info
// community database, which continuously health-checks every stream and exposes
// the result as `lastcheckok` — so we only ever hand the dial a station that was
// confirmed playing on radio-browser's last sweep. We also require an https
// stream (the site is https; http streams would be blocked as mixed content)
// and a browser-playable codec (MP3/AAC — <audio> can't do Ogg everywhere).
//
// The dial is an FM band, so each station is pinned to a pseudo-frequency spread
// evenly across 87.5–108.0. Everything between stations is static (client-side).

export interface RadioStation {
  id: string
  name: string
  country: string        // ISO-3166 alpha-2, for the flag
  countryName: string
  tags: string
  url: string
  codec: string
  bitrate: number
  freq: number           // pinned dial position, MHz
  lat: number            // country centroid, for the globe
  lon: number
}

// Country centroids for the globe view — approximate, country-level (the
// station data itself is only ever country-resolution, so city-precision
// would be theater). Covers every code in COUNTRIES plus the FALLBACK set.
const COUNTRY_COORDS: Record<string, [number, number]> = {
  JP: [36.2, 138.3], FR: [46.6, 2.2], BR: [-14.2, -51.9], DE: [51.2, 10.4],
  GB: [55.4, -3.4], US: [39.8, -98.6], IN: [20.6, 79.0], MX: [23.6, -102.5],
  IT: [41.9, 12.6], ZA: [-30.6, 22.9], SE: [60.1, 18.6], KR: [35.9, 127.8],
  NG: [9.1, 8.7], AU: [-25.3, 133.8], IS: [64.9, -19.0], JM: [18.1, -77.3],
  TR: [38.9, 35.2], GR: [39.1, 21.8], RU: [61.5, 105.3], PT: [39.4, -8.2],
  EG: [26.8, 30.8], AR: [-38.4, -63.6], TH: [15.9, 101.0], NL: [52.1, 5.3],
  MA: [31.8, -7.1],
}

// Curated country spread — a genuine trip around the world, not just the anglosphere.
const COUNTRIES = [
  'JP', 'FR', 'BR', 'DE', 'GB', 'US', 'IN', 'MX', 'IT', 'ZA',
  'SE', 'KR', 'NG', 'AU', 'IS', 'JM', 'TR', 'GR', 'RU', 'PT',
  'EG', 'AR', 'TH', 'NL', 'MA',
]

const PER_COUNTRY = 2
const TARGET = 18

// radio-browser has no single canonical host; these mirrors round-robin the same DB.
const MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
]

interface RawStation {
  stationuuid: string
  name: string
  url_resolved: string
  countrycode: string
  country: string
  tags: string
  codec: string
  bitrate: number
  lastcheckok: number
  hls: number
}

// Famous, long-lived public streams as a floor: if radio-browser is unreachable
// (or an org egress policy blocks it), the dial still has a real world tour on it.
// All https so they survive on the deployed https site.
const FALLBACK: Omit<RadioStation, 'freq' | 'lat' | 'lon'>[] = [
  { id: 'fb-somafm-gs', name: 'SomaFM Groove Salad', country: 'US', countryName: 'United States', tags: 'ambient,downtempo', url: 'https://ice1.somafm.com/groovesalad-128-mp3', codec: 'MP3', bitrate: 128 },
  { id: 'fb-fip', name: 'FIP', country: 'FR', countryName: 'France', tags: 'eclectic', url: 'https://icecast.radiofrance.fr/fip-midfi.mp3', codec: 'MP3', bitrate: 128 },
  { id: 'fb-radioparadise', name: 'Radio Paradise Main Mix', country: 'US', countryName: 'United States', tags: 'eclectic,rock', url: 'https://stream.radioparadise.com/mp3-128', codec: 'MP3', bitrate: 128 },
  { id: 'fb-nts1', name: 'NTS Radio 1', country: 'GB', countryName: 'United Kingdom', tags: 'underground', url: 'https://stream-relay-geo.ntslive.net/stream', codec: 'AAC', bitrate: 128 },
  { id: 'fb-kexp', name: 'KEXP Seattle', country: 'US', countryName: 'United States', tags: 'indie,college', url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3', codec: 'MP3', bitrate: 128 },
  { id: 'fb-franceinter', name: 'France Inter', country: 'FR', countryName: 'France', tags: 'talk,culture', url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3', codec: 'MP3', bitrate: 128 },
  { id: 'fb-somafm-drone', name: 'SomaFM Drone Zone', country: 'US', countryName: 'United States', tags: 'ambient,space', url: 'https://ice1.somafm.com/dronezone-128-mp3', codec: 'MP3', bitrate: 128 },
  { id: 'fb-jazzradio', name: 'TSF Jazz', country: 'FR', countryName: 'France', tags: 'jazz', url: 'https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3', codec: 'MP3', bitrate: 128 },
  { id: 'fb-radiotunis', name: 'Radio Nova', country: 'FR', countryName: 'France', tags: 'eclectic', url: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3', codec: 'MP3', bitrate: 128 },
  { id: 'fb-somafm-sf', name: 'SomaFM Secret Agent', country: 'US', countryName: 'United States', tags: 'lounge,spy', url: 'https://ice1.somafm.com/secretagent-128-mp3', codec: 'MP3', bitrate: 128 },
]

function assignFrequencies<T extends { country: string }>(list: T[]): (T & { freq: number; lat: number; lon: number })[] {
  const lo = 87.7, hi = 107.9
  const n = Math.max(1, list.length)
  // deterministic per-station jitter so two stations in the same country
  // don't render as one dot on the globe, without needing city data
  const seen: Record<string, number> = {}
  return list.map((s, i) => {
    const base = COUNTRY_COORDS[s.country] ?? [0, 0]
    const dupIdx = seen[s.country] ?? 0
    seen[s.country] = dupIdx + 1
    const jitter = dupIdx * 2.4
    return {
      ...s,
      // spread evenly, snap to the 0.1 grid a real dial uses
      freq: Math.round((lo + (hi - lo) * (i / Math.max(1, n - 1))) * 10) / 10,
      lat: base[0] + (dupIdx % 2 === 0 ? jitter : -jitter),
      lon: base[1] + (dupIdx % 2 === 0 ? -jitter : jitter),
    }
  })
}

async function fetchFromMirror(base: string): Promise<RadioStation[]> {
  const out: Omit<RadioStation, 'freq' | 'lat' | 'lon'>[] = []
  const seen = new Set<string>()

  await Promise.all(
    COUNTRIES.map(async cc => {
      try {
        const res = await fetch(
          `${base}/json/stations/search?countrycode=${cc}&order=clickcount&reverse=true&hidebroken=true&limit=14`,
          { headers: { 'User-Agent': 'tyleremdur.com/1.0' }, signal: AbortSignal.timeout(6000) },
        )
        if (!res.ok) return
        const raw: RawStation[] = await res.json()
        let added = 0
        for (const r of raw) {
          if (added >= PER_COUNTRY) break
          if (r.lastcheckok !== 1) continue
          if (r.hls === 1) continue                        // <audio> can't do bare HLS
          if (!r.url_resolved?.startsWith('https://')) continue
          const codec = (r.codec || '').toUpperCase()
          if (!/MP3|AAC/.test(codec)) continue
          const key = r.url_resolved
          if (seen.has(key)) continue
          seen.add(key)
          out.push({
            id: r.stationuuid,
            name: r.name.trim().slice(0, 42) || 'UNKNOWN',
            country: (r.countrycode || cc).toUpperCase(),
            countryName: r.country || cc,
            tags: r.tags || '',
            url: r.url_resolved,
            codec,
            bitrate: r.bitrate || 0,
          })
          added++
        }
      } catch { /* mirror/country failed — skip */ }
    }),
  )

  return assignFrequencies(out)
}

const getStations = unstable_cache(
  async (): Promise<RadioStation[]> => {
    for (const base of MIRRORS) {
      const list = await fetchFromMirror(base)
      if (list.length >= 8) return list
    }
    return assignFrequencies(FALLBACK)
  },
  ['garage-radio-stations'],
  { revalidate: 30 * 60 },   // pool refreshes every 30 min
)

export async function GET() {
  try {
    let stations = await getStations()
    if (!stations || stations.length < 4) stations = assignFrequencies(FALLBACK)
    // Interleave so adjacent dial positions are usually different countries.
    return NextResponse.json({ stations: stations.slice(0, TARGET) })
  } catch {
    return NextResponse.json({ stations: assignFrequencies(FALLBACK) }, { status: 200 })
  }
}
