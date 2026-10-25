// What the real signals on the dial actually serve.
//
// Reception used to be a hand-written label on each channel — someone decided
// Delhi looked "chaotic" and Taipei looked "clean" and the screen applied a CSS
// filter to match. That is a guess about a real thing, and every HLS manifest
// on the dial declares the real thing out loud: the bandwidth it is encoded at,
// the resolution it is encoded at, how long each segment runs, which codecs.
// A 400 kbps 640x360 feed is not grainy because someone said so.
//
// So this reads every manifest on the dial — primaries and understudies — and
// writes down what each one answered. The numbers it records are the station's
// own declarations, not measurements of the picture, and a feed that is dark
// from here is recorded as dark rather than guessed at.
//
//   node scripts/bake-reception.mjs > lib/broadcast/reception.json
//
// It lives under lib/ and not public/ because the screen needs it at first
// paint, before any fetch could have come back.
//
// Re-bake when the lineup changes. Nothing on the dial is stable forever; the
// point is that the file says when it was true.

import { CHANNELS } from '../lib/broadcast/channels.ts'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const TIMEOUT_MS = 9000

// Ask as the site, because the site is who the record is about. This script
// used to send the stream's own origin as its Referer — a request from a
// station to itself, which is nobody. No feed currently answers differently,
// but a measurement taken as a different client is a measurement of a
// different thing, and the probe script has always asked this way.
const ORIGIN = 'https://tyleremdur.com'

async function get(url) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Origin: ORIGIN, Referer: ORIGIN + '/' },
      cache: 'no-store',
      signal: controller.signal,
      redirect: 'follow',
    })
    const text = await res.text()
    return { ok: res.ok, status: res.status, text, finalUrl: res.url || url }
  } catch (e) {
    return { ok: false, status: 0, text: '', error: e?.name === 'AbortError' ? 'timeout' : String(e?.message ?? e) }
  } finally {
    clearTimeout(t)
  }
}

const attr = (line, key) => line.match(new RegExp(`[,:]${key}=("[^"]*"|[^,]*)`))?.[1]?.replace(/^"|"$/g, '')

/** Variant rungs declared by a master playlist, in the order the station lists them. */
function parseMaster(text) {
  const lines = text.split(/\r?\n/)
  const variants = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXT-X-STREAM-INF')) continue
    const uri = lines.slice(i + 1).find(l => l.trim() && !l.startsWith('#'))
    const bandwidth = Number(attr(lines[i], 'BANDWIDTH') ?? 0) || null
    const resolution = attr(lines[i], 'RESOLUTION') ?? null
    variants.push({
      bandwidth,
      resolution,
      codecs: attr(lines[i], 'CODECS') ?? null,
      frameRate: Number(attr(lines[i], 'FRAME-RATE') ?? 0) || null,
      uri: uri?.trim() ?? null,
    })
  }
  return variants
}

/** Segment shape from a media playlist. Short segments recover faster. */
function parseMedia(text) {
  const targetDuration = Number(text.match(/#EXT-X-TARGETDURATION:\s*(\d+(?:\.\d+)?)/)?.[1] ?? 0) || null
  const segments = (text.match(/#EXTINF:/g) ?? []).length
  return {
    targetDuration,
    segments,
    // No ENDLIST means the window keeps sliding — a live signal rather than a
    // finished recording someone parked on the dial.
    live: !/#EXT-X-ENDLIST/.test(text),
  }
}

async function probe(url) {
  const first = await get(url)
  if (!first.ok) {
    return { url, reachable: false, status: first.status, error: first.error ?? `http ${first.status}` }
  }
  if (!first.text.trimStart().startsWith('#EXTM3U')) {
    // This is the Reykjavik trap in general form: something answered 200 with a
    // body that is not a playlist at all.
    return { url, reachable: false, status: first.status, error: 'not a playlist', bodyHead: first.text.trim().slice(0, 80) }
  }

  const variants = parseMaster(first.text)
  const base = first.finalUrl ?? url

  // A master playlist only lists rungs; the segment shape lives one level down.
  let media = parseMedia(first.text)
  let mediaFrom = null
  if (variants.length > 0 && variants[0].uri) {
    const target = new URL(variants[0].uri, base).toString()
    const second = await get(target)
    if (second.ok && second.text.trimStart().startsWith('#EXTM3U')) {
      media = parseMedia(second.text)
      mediaFrom = target
    }
  }

  const rungs = variants.filter(v => v.bandwidth)
  const top = rungs.length ? rungs.reduce((a, b) => (b.bandwidth > a.bandwidth ? b : a)) : null
  const floor = rungs.length ? rungs.reduce((a, b) => (b.bandwidth < a.bandwidth ? b : a)) : null

  return {
    url,
    reachable: true,
    status: first.status,
    // A single-rung manifest cannot adapt; it is the same picture on a bad
    // connection as a good one.
    variantCount: variants.length,
    topBandwidth: top?.bandwidth ?? null,
    topResolution: top?.resolution ?? null,
    floorBandwidth: floor?.bandwidth ?? null,
    codecs: top?.codecs ?? null,
    frameRate: top?.frameRate ?? null,
    targetDuration: media.targetDuration,
    segments: media.segments,
    live: media.live,
    mediaFrom,
  }
}

const out = {}
for (const c of CHANNELS) {
  if (c.kind !== 'hls' || !c.hlsUrl) {
    // Channel 88 serves no manifest. It is not a station and is recorded as one
    // of ours rather than given invented numbers.
    out[c.id] = { ch: c.ch, city: c.city, kind: c.kind, feeds: [] }
    console.error(`${c.ch} ${c.city.padEnd(14)} — no manifest (${c.kind})`)
    continue
  }
  const urls = [c.hlsUrl, ...(c.altHlsUrls ?? [])]
  const feeds = []
  for (const u of urls) {
    const r = await probe(u)
    feeds.push(r)
    const note = r.reachable
      ? `${r.variantCount} rung(s), ${r.topResolution ?? '?'} @ ${r.topBandwidth ? Math.round(r.topBandwidth / 1000) + 'k' : '?'}, seg ${r.targetDuration ?? '?'}s${r.live ? '' : ', VOD'}`
      : `dark (${r.error})`
    console.error(`${c.ch} ${c.city.padEnd(14)} — ${note}`)
  }
  out[c.id] = { ch: c.ch, city: c.city, kind: c.kind, feeds }
}

console.log(JSON.stringify({ bakedAt: new Date().toISOString(), channels: out }, null, 1))
