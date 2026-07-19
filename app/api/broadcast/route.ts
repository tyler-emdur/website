import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { CHANNELS } from '@/lib/broadcast/channels'

// Curated channels only go stale one way: the source HLS manifest is down.
// Checked here, server-side, so the client already knows which channels are
// live before it ever mounts a player. Each dial position may carry backup
// feeds; the check runs the whole cascade and reports the first URL that
// answers, so a dead primary quietly hands the slot to its understudy.
export interface ChannelStatus {
  live: boolean
  url?: string // the feed the client should start with
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const CHECK_TIMEOUT_MS = 4000

// The signal has to reach the work itself, so the deadline covers both the
// connection and the body read — a manifest that connects and then dribbles
// bytes is exactly the kind of dead feed this check exists to catch.
async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T | null> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  try { return await work(controller.signal) } catch { return null } finally { clearTimeout(t) }
}

// null = network hiccup on our side (unknown), true/false = definitive
async function checkHlsLive(url: string): Promise<boolean | null> {
  return withTimeout(async signal => {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store', signal })
    if (!res.ok) return false
    const text = await res.text()
    return text.trimStart().startsWith('#EXTM3U')
  }, CHECK_TIMEOUT_MS)
}

async function checkCascade(urls: string[]): Promise<ChannelStatus> {
  const results = await Promise.all(urls.map(checkHlsLive))
  const liveIdx = results.findIndex(r => r === true)
  if (liveIdx >= 0) return { live: true, url: urls[liveIdx] }
  // nothing confirmed live — if any check was inconclusive, let the client's
  // own player try that one rather than declaring the slot dark
  const unknownIdx = results.findIndex(r => r === null)
  if (unknownIdx >= 0) return { live: true, url: urls[unknownIdx] }
  return { live: false }
}

const getStatus = unstable_cache(async (): Promise<Record<string, ChannelStatus>> => {
  const entries = await Promise.all(
    CHANNELS.map(async c => {
      if (c.kind === 'hls' && c.hlsUrl) {
        return [c.id, await checkCascade([c.hlsUrl, ...(c.altHlsUrls ?? [])])] as const
      }
      return [c.id, { live: true }] as const // custom channel is always "on"
    }),
  )
  return Object.fromEntries(entries)
}, ['broadcast-status-v7'], { revalidate: 120 })

export async function GET() {
  try {
    const status = await getStatus()
    return NextResponse.json({ status })
  } catch {
    // Total failure — assume everything's live and let individual players sort it out.
    return NextResponse.json({ status: Object.fromEntries(CHANNELS.map(c => [c.id, { live: true }])) })
  }
}
