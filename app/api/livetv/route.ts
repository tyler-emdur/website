import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

interface RawChannel {
  id: string
  name: string
  country: string
  languages?: string[]
  categories?: string[]
  is_nsfw?: boolean
  closed?: string | null
}

interface RawStream {
  channel: string | null
  url: string
  referrer?: string | null
  user_agent?: string | null
}

export interface LiveChannel {
  id: string
  name: string
  country: string
  language: string | null
  category: string | null
  url: string
}

const MAX_PER_COUNTRY = 5
const VERIFIED_TARGET = 30
const PROBE_BATCH = 96
const MAX_PROBE_ROUNDS = 2
const PROBE_TIMEOUT_MS = 2200

// The whole point of CH-flipping this TV is the feeling of stumbling into a
// broadcast from the far side of the planet that has no business existing. So we
// bias hard toward the genres that produce that feeling — a 24/7 fireplace, a
// parliament nobody watches, home-shopping for a knife, a weather radar loop, a
// televangelist at 3am — and away from bland international news/general feeds.
const NOVELTY: Record<string, number> = {
  relax: 12, religious: 9, shop: 9, legislative: 8, weather: 7, classic: 7,
  culture: 6, outdoor: 6, kids: 6, animation: 6, cooking: 5, travel: 5,
  music: 5, science: 4, education: 4, comedy: 4, documentary: 3, auto: 3,
  family: 2, lifestyle: 2, entertainment: 1, movies: 1, series: 1, sports: 1,
  news: -3, general: -2, business: -3,
}

const CATEGORY_LABEL: Record<string, string> = {
  relax: 'AMBIENT LOOP', religious: 'DEVOTIONAL', shop: 'HOME SHOPPING',
  legislative: 'STATE / PARLIAMENT', weather: 'WEATHER', classic: 'CLASSIC TV',
  culture: 'CULTURE', outdoor: 'OUTDOOR', kids: 'CHILDREN', animation: 'ANIMATION',
  cooking: 'COOKING', travel: 'TRAVEL', music: 'MUSIC', science: 'SCIENCE',
  education: 'EDUCATION', comedy: 'COMEDY', documentary: 'DOCUMENTARY', auto: 'MOTORING',
  news: 'NEWS', general: 'GENERAL', movies: 'CINEMA', series: 'SERIES', sports: 'SPORTS',
}

function scoreCategories(cats: string[]): number {
  if (!cats.length) return 0
  let s = 0
  for (const c of cats) s += NOVELTY[c] ?? 0
  return s
}

// Pick the most evocative category to show as the channel's genre tag.
function pickCategory(cats: string[]): string | null {
  let best: string | null = null
  let bestW = -Infinity
  for (const c of cats) {
    const w = NOVELTY[c] ?? 0
    if (w > bestW) { bestW = w; best = c }
  }
  if (!best) return null
  return CATEGORY_LABEL[best] ?? best.toUpperCase()
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

async function buildRawPool(): Promise<(LiveChannel & { score: number })[]> {
  const [channelsRes, streamsRes] = await Promise.all([
    fetch('https://iptv-org.github.io/api/channels.json', { cache: 'no-store' }),
    fetch('https://iptv-org.github.io/api/streams.json', { cache: 'no-store' }),
  ])
  if (!channelsRes.ok || !streamsRes.ok) return []

  const [channels, streams]: [RawChannel[], RawStream[]] = await Promise.all([
    channelsRes.json(),
    streamsRes.json(),
  ])

  const channelById = new Map<string, RawChannel>()
  for (const c of channels) {
    if (c.is_nsfw) continue
    if (c.closed) continue
    if (!c.country) continue
    if ((c.categories ?? []).includes('xxx')) continue
    channelById.set(c.id, c)
  }

  // One clean stream per channel — prefer feeds with no special headers required,
  // since browsers can't attach custom referrer/user-agent to playback requests.
  const streamByChannel = new Map<string, string>()
  for (const s of streams) {
    if (!s.channel || streamByChannel.has(s.channel)) continue
    if (s.referrer || s.user_agent) continue
    if (!s.url?.endsWith('.m3u8')) continue
    if (!channelById.has(s.channel)) continue
    streamByChannel.set(s.channel, s.url)
  }

  const byCountry = new Map<string, (LiveChannel & { score: number })[]>()
  for (const [id, url] of streamByChannel) {
    const c = channelById.get(id)!
    const cats = c.categories ?? []
    const list = byCountry.get(c.country) ?? []
    list.push({
      id, name: c.name, country: c.country,
      language: c.languages?.[0] ?? null,
      category: pickCategory(cats),
      url,
      score: scoreCategories(cats),
    })
    byCountry.set(c.country, list)
  }

  // From each country take its most novel channels, so the world tour skews
  // strange everywhere instead of defaulting to that country's news channel.
  const pool: (LiveChannel & { score: number })[] = []
  for (const list of byCountry.values()) {
    list.sort((a, b) => b.score - a.score)
    pool.push(...list.slice(0, MAX_PER_COUNTRY))
  }
  return pool
}

// A manifest URL being listed doesn't mean it actually loads — many are geo-blocked, dead,
// or missing CORS. Probe candidates server-side (parallel, short-timeout) so the client only
// ever receives channels that are already known to work.
async function probeChannel(c: LiveChannel): Promise<boolean> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  try {
    const res = await fetch(c.url, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) return false
    const text = await res.text()
    return text.trimStart().startsWith('#EXTM3U')
  } catch {
    return false
  } finally {
    clearTimeout(t)
  }
}

async function buildVerifiedPool(raw: (LiveChannel & { score: number })[]): Promise<LiveChannel[]> {
  const verified: LiveChannel[] = []
  // Probe the most novel channels first (light in-band shuffle keeps it fresh),
  // so the verified set we hand the TV is the weird stuff, not the leftovers.
  const ordered = [...raw].sort((a, b) => b.score - a.score + (Math.random() - 0.5) * 3)
  let idx = 0
  for (let round = 0; round < MAX_PROBE_ROUNDS && verified.length < VERIFIED_TARGET && idx < ordered.length; round++) {
    const batch = ordered.slice(idx, idx + PROBE_BATCH)
    idx += PROBE_BATCH
    const results = await Promise.all(batch.map(async c => (await probeChannel(c)) ? c : null))
    for (const c of results) {
      if (c) verified.push({ id: c.id, name: c.name, country: c.country, language: c.language, category: c.category, url: c.url })
    }
  }
  return verified
}

const getRawPool = unstable_cache(buildRawPool, ['livetv-raw-pool-v2'], { revalidate: 6 * 60 * 60 })

const getVerifiedPool = unstable_cache(async (): Promise<LiveChannel[]> => {
  const raw = await getRawPool()
  if (raw.length === 0) return []
  return buildVerifiedPool(raw)
}, ['livetv-verified-pool-v2'], { revalidate: 20 * 60 })

export async function GET() {
  try {
    const pool = await getVerifiedPool()
    const shuffled = [...pool]
    shuffle(shuffled)
    return NextResponse.json({ channels: shuffled })
  } catch {
    return NextResponse.json({ channels: [] }, { status: 200 })
  }
}
