import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { CHANNELS } from '@/lib/broadcast/channels'
import { IDENTITY } from '@/lib/identity'

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

// This check stands in for a browser on the site, so it asks the way one would:
// the same Origin and Referer hls.js will send when the player goes for the
// same manifest. No feed on the dial answers differently either way — that was
// measured feed by feed before the change — but a station that starts filtering
// by origin should go dark in the check that is supposed to predict the player,
// not only in the viewer's window.
const ORIGIN = `https://${IDENTITY.domain}`
const HEADERS = { 'User-Agent': UA, Origin: ORIGIN, Referer: `${ORIGIN}/` }

// The signal has to reach the work itself, so the deadline covers both the
// connection and the body read — a manifest that connects and then dribbles
// bytes is exactly the kind of dead feed this check exists to catch.
async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T | null> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  try { return await work(controller.signal) } catch { return null } finally { clearTimeout(t) }
}

const isPlaylist = (text: string) => text.trimStart().startsWith('#EXTM3U')
const firstUri = (text: string) => text.split(/\r?\n/).find(l => l.trim() && !l.startsWith('#'))?.trim()

// A playlist that is carrying something right now: it has segments in it, and
// it hasn't declared itself finished. `#EXTM3U` alone was the old test, and it
// passes for a master playlist whose variants 404, for an empty window, and for
// a recording somebody parked on the dial — France 24 was failing exactly this
// way, advertising five rungs whose media playlists answered HTTP 400.
//
// It does *not* catch a geo-blocked slate. A station streaming a rights notice
// serves real segments of a real picture of a sentence, and no amount of
// manifest reading sees text on a screen. That one stays a human judgement —
// which is why the RÚV ban in channels.ts is written down rather than detected.
const isCarrying = (text: string) =>
  isPlaylist(text) && !/#EXT-X-ENDLIST/.test(text) && /#EXTINF:/.test(text)

// null = network hiccup on our side (unknown), true/false = definitive
async function checkHlsLive(url: string): Promise<boolean | null> {
  return withTimeout(async signal => {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store', signal })
    if (!res.ok) return false
    const text = await res.text()
    if (!isPlaylist(text)) return false
    if (/#EXT-X-ENDLIST/.test(text)) return false

    // A master playlist carries no segments of its own — the question moves one
    // level down, to the rung the player would actually pick up.
    if (/#EXT-X-STREAM-INF/.test(text)) {
      const variant = firstUri(text)
      if (!variant) return false // advertises rungs, lists none
      const target = new URL(variant, res.url || url).toString()
      try {
        const sub = await fetch(target, { headers: HEADERS, cache: 'no-store', signal })
        if (!sub.ok) return false
        return isCarrying(await sub.text())
      } catch {
        // Out of budget on the second hop, not a verdict about the station. The
        // master answered with a well-formed manifest; don't darken a slot over
        // our own deadline.
        return true
      }
    }

    return /#EXTINF:/.test(text)
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
}, ['broadcast-status-v8'], { revalidate: 120 })

export async function GET() {
  try {
    const status = await getStatus()
    return NextResponse.json({ status })
  } catch {
    // Total failure — assume everything's live and let individual players sort it out.
    return NextResponse.json({ status: Object.fromEntries(CHANNELS.map(c => [c.id, { live: true }])) })
  }
}
