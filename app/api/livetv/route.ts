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
  url: string
}

const MAX_PER_COUNTRY = 3
const VERIFIED_TARGET = 40
const PROBE_BATCH = 100
const MAX_PROBE_ROUNDS = 3
const PROBE_TIMEOUT_MS = 2500

// Novelty over blandness. A random channel from a random country is usually a
// home-shopping loop, a test card, or a regional news desk. We score every
// candidate so the dial fills with the strange stuff instead — aquarium cams,
// slow-TV, 24/7 cartoons, retro reruns, weather radar, space feeds — and probe
// the most novel candidates first.
const CATEGORY_WEIGHT: Record<string, number> = {
  relax: 11, outdoor: 10, classic: 9, animation: 8, science: 7, culture: 6,
  cooking: 6, documentary: 5, travel: 5, music: 5, comedy: 5, movies: 4,
  series: 4, auto: 4, weather: 4, entertainment: 3, family: 2, kids: 3,
  lifestyle: 3, sports: 2, news: 1, general: 0, education: 0, religious: -1,
}
const EXCLUDE_CATEGORIES = new Set(['shop', 'business', 'legislative', 'xxx'])
// names that promise novelty regardless of how the channel is tagged
const NAME_BOOST = /retro|classic|cartoon|anime|aquarium|jelly|\bcat\b|kitten|space|nasa|cosmos|lofi|lo-fi|24\/?7|weird|meme|nyan|fireplace|zen|slow|nature|wildlife|ocean|train|drive|ambient|vapor|pixel|arcade|puppy|farm|beach|volcano|weather|radar|surf/i

function noveltyScore(c: RawChannel): number {
  const cats = c.categories ?? []
  if (cats.some(cat => EXCLUDE_CATEGORIES.has(cat))) return -Infinity
  let score = cats.length === 0 ? 1.5 : 0
  for (const cat of cats) score += CATEGORY_WEIGHT[cat] ?? 0.5
  if (NAME_BOOST.test(c.name)) score += 7
  return score
}

async function buildRawPool(): Promise<LiveChannel[]> {
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
  const scoreById = new Map<string, number>()
  for (const c of channels) {
    if (c.is_nsfw) continue
    if (c.closed) continue
    if (!c.country) continue
    if ((c.categories ?? []).includes('xxx')) continue
    const score = noveltyScore(c)
    if (score === -Infinity) continue
    channelById.set(c.id, c)
    scoreById.set(c.id, score)
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

  // keep the most novel few per country so the pool stays globally diverse
  const byCountry = new Map<string, { ch: LiveChannel; score: number }[]>()
  for (const [id, url] of streamByChannel) {
    const c = channelById.get(id)!
    const list = byCountry.get(c.country) ?? []
    list.push({
      ch: { id, name: c.name, country: c.country, language: c.languages?.[0] ?? null, url },
      score: scoreById.get(id) ?? 0,
    })
    byCountry.set(c.country, list)
  }

  const pool: { ch: LiveChannel; score: number }[] = []
  for (const list of byCountry.values()) {
    list.sort((a, b) => b.score - a.score)
    pool.push(...list.slice(0, MAX_PER_COUNTRY))
  }
  // novelty first, so verification fills up on the interesting channels
  pool.sort((a, b) => b.score - a.score)
  return pool.map(p => p.ch)
}

// A manifest URL being listed doesn't mean it actually loads — many are geo-blocked, dead,
// or missing CORS. Probe candidates server-side (parallel, short-timeout) so the client only
// ever receives channels that are already known to work, instead of hunting through dead
// streams itself with multi-second timeouts per attempt.
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

// Probe in novelty order (raw is already sorted), so the verified pool keeps the
// weird channels near the front — the client draws its first channels from there.
async function buildVerifiedPool(raw: LiveChannel[]): Promise<LiveChannel[]> {
  const verified: LiveChannel[] = []
  let idx = 0
  for (let round = 0; round < MAX_PROBE_ROUNDS && verified.length < VERIFIED_TARGET && idx < raw.length; round++) {
    const batch = raw.slice(idx, idx + PROBE_BATCH)
    idx += PROBE_BATCH
    const results = await Promise.all(batch.map(async c => (await probeChannel(c)) ? c : null))
    for (const c of results) if (c) verified.push(c)
  }
  return verified
}

// unstable_cache persists the (small) result across serverless invocations on Vercel — unlike a
// plain module-level variable, which resets on every cold start and would otherwise make nearly
// every visit pay the full raw-fetch + probing cost. Split into two layers so a verified-pool
// refresh (every 20m) usually reuses the still-fresh raw pool (6h) instead of redownloading it.
const getRawPool = unstable_cache(buildRawPool, ['livetv-raw-pool-v2'], { revalidate: 6 * 60 * 60 })

const getVerifiedPool = unstable_cache(async (): Promise<LiveChannel[]> => {
  const raw = await getRawPool()
  if (raw.length === 0) return []
  return buildVerifiedPool(raw)
}, ['livetv-verified-pool-v2'], { revalidate: 20 * 60 })

export async function GET() {
  try {
    const pool = await getVerifiedPool()
    // keep the novelty ordering but rotate the head so every visit isn't identical
    const rotated = [...pool]
    const cut = Math.floor((Date.now() / 60000) % Math.max(1, Math.min(8, rotated.length)))
    for (let i = 0; i < cut; i++) rotated.push(rotated.shift()!)
    return NextResponse.json({ channels: rotated })
  } catch {
    return NextResponse.json({ channels: [] }, { status: 200 })
  }
}
