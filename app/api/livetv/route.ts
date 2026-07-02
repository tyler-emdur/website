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

const MAX_PER_COUNTRY = 4
const VERIFIED_TARGET = 36
const PROBE_BATCH = 90
const MAX_PROBE_ROUNDS = 2
const PROBE_TIMEOUT_MS = 2500

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
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

  const byCountry = new Map<string, LiveChannel[]>()
  for (const [id, url] of streamByChannel) {
    const c = channelById.get(id)!
    const list = byCountry.get(c.country) ?? []
    list.push({ id, name: c.name, country: c.country, language: c.languages?.[0] ?? null, url })
    byCountry.set(c.country, list)
  }

  const pool: LiveChannel[] = []
  for (const list of byCountry.values()) {
    shuffle(list)
    pool.push(...list.slice(0, MAX_PER_COUNTRY))
  }
  return pool
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

async function buildVerifiedPool(raw: LiveChannel[]): Promise<LiveChannel[]> {
  const verified: LiveChannel[] = []
  const shuffled = [...raw]
  shuffle(shuffled)
  let idx = 0
  for (let round = 0; round < MAX_PROBE_ROUNDS && verified.length < VERIFIED_TARGET && idx < shuffled.length; round++) {
    const batch = shuffled.slice(idx, idx + PROBE_BATCH)
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
const getRawPool = unstable_cache(buildRawPool, ['livetv-raw-pool'], { revalidate: 6 * 60 * 60 })

const getVerifiedPool = unstable_cache(async (): Promise<LiveChannel[]> => {
  const raw = await getRawPool()
  if (raw.length === 0) return []
  return buildVerifiedPool(raw)
}, ['livetv-verified-pool'], { revalidate: 20 * 60 })

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
