import { NextResponse } from 'next/server'

// The Garage radio is a curated dial, not a firehose. Every station here is a
// real, long-lived stream someone actually programs — college freeform, pirate-
// spirited underground, electroclash and late-night electro, the kind of thing
// you leave on while you work and it earns its keep. No "top 40 per country"
// scrape; this is a hand-built lineup with real cities behind it, so the globe
// ("tune by place") is a genuine map of where each signal comes from.
//
// Playback is a plain <audio> element (see live-radio.ts) — cross-origin media
// needs no CORS — so the only hard requirements are: HTTPS (the site is https,
// http streams are blocked as mixed content) and a browser-playable codec
// (MP3 / AAC). Every URL below was verified against both.
//
// The dial is an FM band; each station is pinned to a pseudo-frequency spread
// across 87.7–108.0, and everything between stations is static (client-side).

export interface RadioStation {
  id: string
  name: string
  country: string        // ISO-3166 alpha-2, for the flag
  countryName: string
  city: string           // real city — shown on the globe and the dial
  tags: string           // genre / vibe, shown on the head unit
  url: string
  codec: string
  bitrate: number
  freq: number           // pinned dial position, MHz
  lat: number            // real city latitude, for the globe
  lon: number
}

type Curated = Omit<RadioStation, 'freq'>

// ── the lineup ────────────────────────────────────────────────────────────────
// Ordered as a journey down the dial: West-coast underground → US freeform →
// London pirate → Paris (the FIP family) → back to ambient. Cities repeat on
// purpose — that's what a real curated dial looks like, a few scenes going deep.
const LINEUP: Curated[] = [
  // ── late-night electro / electroclash — the thing to leave on ──────────────
  {
    id: 'soma-u80s', name: 'SomaFM · Underground 80s', tags: 'electroclash · synth · EBM',
    city: 'San Francisco', country: 'US', countryName: 'United States',
    url: 'https://ice1.somafm.com/u80s-128-mp3', codec: 'MP3', bitrate: 128,
    lat: 37.77, lon: -122.42,
  },
  {
    id: 'fip-electro', name: 'FIP Électro', tags: 'electro · club · leftfield',
    city: 'Paris', country: 'FR', countryName: 'France',
    url: 'https://icecast.radiofrance.fr/fipelectro-midfi.mp3', codec: 'MP3', bitrate: 128,
    lat: 48.86, lon: 2.35,
  },
  {
    id: 'soma-cliqhop', name: 'SomaFM · cliqhop idm', tags: 'idm · glitch · braindance',
    city: 'San Francisco', country: 'US', countryName: 'United States',
    url: 'https://ice1.somafm.com/cliqhop-128-mp3', codec: 'MP3', bitrate: 128,
    lat: 37.75, lon: -122.44,
  },
  {
    id: 'soma-beatblender', name: 'SomaFM · Beat Blender', tags: 'deep house · downtempo',
    city: 'San Francisco', country: 'US', countryName: 'United States',
    url: 'https://ice1.somafm.com/beatblender-128-mp3', codec: 'MP3', bitrate: 128,
    lat: 37.79, lon: -122.40,
  },

  // ── US college / freeform — real DJs, no algorithm ─────────────────────────
  {
    id: 'kexp', name: 'KEXP 90.3', tags: 'college · indie · live sessions',
    city: 'Seattle', country: 'US', countryName: 'United States',
    url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3', codec: 'MP3', bitrate: 128,
    lat: 47.61, lon: -122.33,
  },
  {
    id: 'kalx', name: 'KALX 90.7 Berkeley', tags: 'freeform · student radio',
    city: 'Berkeley', country: 'US', countryName: 'United States',
    url: 'https://stream.kalx.berkeley.edu:8443/kalx-128.mp3', codec: 'MP3', bitrate: 128,
    lat: 37.87, lon: -122.26,
  },
  {
    id: 'dublab', name: 'dublab', tags: 'leftfield · beats · future roots',
    city: 'Los Angeles', country: 'US', countryName: 'United States',
    url: 'https://dublab.out.airtime.pro/dublab_a', codec: 'MP3', bitrate: 128,
    lat: 34.05, lon: -118.24,
  },
  {
    id: 'kcrw-e24', name: 'KCRW Eclectic24', tags: 'eclectic · tastemaker',
    city: 'Santa Monica', country: 'US', countryName: 'United States',
    url: 'https://streams.kcrw.com/e24_mp3', codec: 'MP3', bitrate: 128,
    lat: 34.02, lon: -118.49,
  },
  {
    id: 'wfmu', name: 'WFMU', tags: 'freeform · the last real one',
    city: 'Jersey City', country: 'US', countryName: 'United States',
    url: 'https://stream0.wfmu.org/freeform-128k', codec: 'MP3', bitrate: 128,
    lat: 40.72, lon: -74.05,
  },
  {
    id: 'wwoz', name: 'WWOZ 90.7', tags: 'jazz · roots · brass',
    city: 'New Orleans', country: 'US', countryName: 'United States',
    url: 'https://wwoz-sc.streamguys1.com/wwoz-hi.mp3', codec: 'MP3', bitrate: 128,
    lat: 29.95, lon: -90.07,
  },

  // ── London underground ─────────────────────────────────────────────────────
  {
    id: 'nts1', name: 'NTS 1', tags: 'underground · freeform',
    city: 'London', country: 'GB', countryName: 'United Kingdom',
    url: 'https://stream-relay-geo.ntslive.net/stream', codec: 'AAC', bitrate: 128,
    lat: 51.54, lon: -0.08,
  },
  {
    id: 'nts2', name: 'NTS 2', tags: 'underground · deeper cuts',
    city: 'London', country: 'GB', countryName: 'United Kingdom',
    url: 'https://stream-relay-geo.ntslive.net/stream2', codec: 'AAC', bitrate: 128,
    lat: 51.51, lon: -0.13,
  },
  {
    id: 'rinse', name: 'Rinse FM', tags: 'pirate · dance · grime',
    city: 'London', country: 'GB', countryName: 'United Kingdom',
    url: 'https://admin.stream.rinse.fm/proxy/rinse_uk/stream', codec: 'AAC', bitrate: 128,
    lat: 51.49, lon: -0.10,
  },

  // ── Paris — the FIP family, the best-programmed dial on earth ──────────────
  {
    id: 'fip', name: 'FIP', tags: 'eclectic · the mothership',
    city: 'Paris', country: 'FR', countryName: 'France',
    url: 'https://icecast.radiofrance.fr/fip-midfi.mp3', codec: 'MP3', bitrate: 128,
    lat: 48.86, lon: 2.34,
  },
  {
    id: 'fip-groove', name: 'FIP Groove', tags: 'funk · soul · groove',
    city: 'Paris', country: 'FR', countryName: 'France',
    url: 'https://icecast.radiofrance.fr/fipgroove-midfi.mp3', codec: 'MP3', bitrate: 128,
    lat: 48.88, lon: 2.36,
  },
  {
    id: 'fip-jazz', name: 'FIP Jazz', tags: 'jazz · late night',
    city: 'Paris', country: 'FR', countryName: 'France',
    url: 'https://icecast.radiofrance.fr/fipjazz-midfi.mp3', codec: 'MP3', bitrate: 128,
    lat: 48.84, lon: 2.33,
  },
  {
    id: 'nova', name: 'Radio Nova', tags: 'eclectic · institution',
    city: 'Paris', country: 'FR', countryName: 'France',
    url: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3', codec: 'MP3', bitrate: 128,
    lat: 48.87, lon: 2.35,
  },

  // ── ambient / downtempo — the far end of the dial, for deep work ───────────
  {
    id: 'soma-groovesalad', name: 'SomaFM · Groove Salad', tags: 'ambient · downtempo',
    city: 'San Francisco', country: 'US', countryName: 'United States',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3', codec: 'MP3', bitrate: 128,
    lat: 37.76, lon: -122.41,
  },
  {
    id: 'soma-dronezone', name: 'SomaFM · Drone Zone', tags: 'ambient · space · deep',
    city: 'San Francisco', country: 'US', countryName: 'United States',
    url: 'https://ice1.somafm.com/dronezone-128-mp3', codec: 'MP3', bitrate: 128,
    lat: 37.78, lon: -122.39,
  },
  {
    id: 'radioparadise', name: 'Radio Paradise', tags: 'eclectic · listener-funded',
    city: 'Paradise, CA', country: 'US', countryName: 'United States',
    url: 'https://stream.radioparadise.com/mp3-128', codec: 'MP3', bitrate: 128,
    lat: 39.76, lon: -121.62,
  },
]

// Spread the lineup across the FM band in listed order, snapping to the 0.1 grid
// a real dial uses. Order is the journey; frequency is just where it lands.
function assignFrequencies(list: Curated[]): RadioStation[] {
  const lo = 87.9, hi = 107.7
  const n = Math.max(1, list.length - 1)
  return list.map((s, i) => ({
    ...s,
    freq: Math.round((lo + (hi - lo) * (i / n)) * 10) / 10,
  }))
}

const STATIONS = assignFrequencies(LINEUP)

export async function GET() {
  return NextResponse.json({ stations: STATIONS })
}
