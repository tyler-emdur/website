import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { CHANNELS } from '@/lib/broadcast/channels'

// Curated channels only go stale one way: the source HLS manifest is down.
// Checked here, server-side, so the client already knows which channels are
// live before it ever mounts a player.
export interface ChannelStatus { live: boolean }

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const CHECK_TIMEOUT_MS = 4000

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  try { return await p } catch { return null } finally { clearTimeout(t) }
}

async function checkHlsLive(url: string): Promise<ChannelStatus> {
  const res = await withTimeout(
    fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' }),
    CHECK_TIMEOUT_MS,
  )
  if (!res) return { live: true } // network hiccup — let the client's own player try
  if (!res.ok) return { live: false }
  const text = await res.text().catch(() => '')
  return { live: text.trimStart().startsWith('#EXTM3U') }
}

const getStatus = unstable_cache(async (): Promise<Record<string, ChannelStatus>> => {
  const entries = await Promise.all(
    CHANNELS.map(async c => {
      if (c.kind === 'hls' && c.hlsUrl) return [c.id, await checkHlsLive(c.hlsUrl)] as const
      return [c.id, { live: true }] as const // custom channel is always "on"
    }),
  )
  return Object.fromEntries(entries)
}, ['broadcast-status-v4'], { revalidate: 120 })

export async function GET() {
  try {
    const status = await getStatus()
    return NextResponse.json({ status })
  } catch {
    // Total failure — assume everything's live and let individual players sort it out.
    return NextResponse.json({ status: Object.fromEntries(CHANNELS.map(c => [c.id, { live: true }])) })
  }
}
