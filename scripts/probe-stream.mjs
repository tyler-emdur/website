// Vet a candidate signal before it ever reaches the dial.
//
// Written after an afternoon of guessing. Thirty candidate URLs were assembled
// from memory by analogy with the ones already on the dial — twelve webcam IDs
// invented by incrementing the two real ones, a dozen national broadcasters
// whose endpoints merely looked right. Twenty-three of twenty-four were dead,
// and the failure was not bad luck: a plausible-looking stream URL is exactly
// the kind of value CLAUDE.md forbids inventing. Camera IDs have to come out of
// the provider's own index, and every candidate has to answer for itself here.
//
//   node scripts/probe-stream.mjs <url> [<url> ...]
//   node scripts/probe-stream.mjs --file candidates.txt   # "LABEL|url" per line
//
// Four things disqualify a candidate, and all four have already bitten this
// world at least once:
//
//   no CORS        a plain <video> cannot read it cross-origin, whatever the
//                  manifest says. Every feed currently on the dial answers
//                  `access-control-allow-origin: *`; that is the standard.
//   not a playlist 200 with a body that is not #EXTM3U at all.
//   a slate        a valid manifest whose content is a rights notice. This is
//                  the RUV trap recorded in channels.ts: the liveness check in
//                  /api/broadcast only tests the first line, so a geo-blocked
//                  station reads as live and every visitor outside the country
//                  tunes to a legal disclaimer. This script cannot see pictures
//                  — it flags the shape that hides one and leaves the judgement
//                  to a human with the channel open.
//   VOD            #EXT-X-ENDLIST means a finished recording parked on a dial
//                  that is supposed to be live.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const ORIGIN = 'https://tyleremdur.com'
const TIMEOUT_MS = 10000

async function get(url) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      // Origin is sent deliberately: the question is whether a browser on this
      // site could read it, not whether curl can.
      headers: { 'User-Agent': UA, Origin: ORIGIN },
      cache: 'no-store', signal: c.signal, redirect: 'follow',
    })
    return { ok: res.ok, status: res.status, text: await res.text(), finalUrl: res.url || url, headers: res.headers }
  } catch (e) {
    return { ok: false, status: 0, text: '', error: e?.name === 'AbortError' ? 'timeout' : String(e?.message ?? e) }
  } finally { clearTimeout(t) }
}

const attr = (line, key) => line.match(new RegExp(`[,:]${key}=("[^"]*"|[^,]*)`))?.[1]?.replace(/^"|"$/g, '')

function parseMaster(text) {
  const lines = text.split(/\r?\n/)
  const out = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXT-X-STREAM-INF')) continue
    out.push({
      bandwidth: Number(attr(lines[i], 'BANDWIDTH') ?? 0) || null,
      resolution: attr(lines[i], 'RESOLUTION') ?? null,
      uri: lines.slice(i + 1).find(l => l.trim() && !l.startsWith('#'))?.trim() ?? null,
    })
  }
  return out
}

async function probe(url) {
  const r = await get(url)
  if (!r.ok) return { verdict: 'DARK', why: r.error ?? `http ${r.status}` }
  if (!r.text.trimStart().startsWith('#EXTM3U')) {
    return { verdict: 'REJECT', why: `200 but not a playlist: ${JSON.stringify(r.text.trim().slice(0, 60))}` }
  }

  const acao = r.headers.get('access-control-allow-origin')
  if (acao !== '*' && acao !== ORIGIN) {
    return { verdict: 'REJECT', why: `no usable CORS (access-control-allow-origin: ${acao ?? 'absent'})` }
  }

  const variants = parseMaster(r.text)
  let seg = Number(r.text.match(/#EXT-X-TARGETDURATION:\s*(\d+)/)?.[1] ?? 0) || null
  let win = (r.text.match(/#EXTINF:/g) ?? []).length
  let vod = /#EXT-X-ENDLIST/.test(r.text)

  if (variants.length && variants[0].uri) {
    const sub = await get(new URL(variants[0].uri, r.finalUrl).toString())
    if (sub.ok && sub.text.trimStart().startsWith('#EXTM3U')) {
      seg = Number(sub.text.match(/#EXT-X-TARGETDURATION:\s*(\d+)/)?.[1] ?? 0) || null
      win = (sub.text.match(/#EXTINF:/g) ?? []).length
      vod = /#EXT-X-ENDLIST/.test(sub.text)
    }
  }

  if (vod) return { verdict: 'REJECT', why: 'has #EXT-X-ENDLIST — a recording, not a signal' }

  const rungs = variants.filter(v => v.bandwidth)
  const top = rungs.length ? rungs.reduce((a, b) => (b.bandwidth > a.bandwidth ? b : a)) : null

  // Mirrors measuredReception() in lib/broadcast/reception.ts. Kept in sync by
  // hand; it is three lines, and a candidate report is worth little if it does
  // not say which picture the dial would give it.
  const bw = top?.bandwidth ?? null
  const reception = bw === null ? 'grainy' : bw >= 4_000_000 && variants.length >= 3 ? 'clean' : variants.length <= 1 ? 'unstable' : 'grainy'

  return {
    verdict: 'OK',
    cors: acao,
    rungs: variants.length,
    resolution: top?.resolution ?? null,
    bitrate: bw,
    segmentSeconds: seg,
    windowSegments: win,
    reception,
    // A three-segment window at a long segment length is thin: one late
    // segment and the picture stops. Worth seeing before adopting a channel.
    thin: seg != null && win > 0 && win <= 3,
  }
}

const args = process.argv.slice(2)
let entries = []
if (args[0] === '--file') {
  const { readFileSync } = await import('node:fs')
  entries = readFileSync(args[1], 'utf8').split('\n').map(s => s.trim())
    .filter(s => s && !s.startsWith('#'))
    .map(l => (l.includes('|') ? l.split(/\s*\|\s*/) : [l, l]))
} else {
  entries = args.map(u => [u, u])
}

if (!entries.length) {
  console.error('usage: node scripts/probe-stream.mjs <url> [...] | --file candidates.txt')
  process.exit(2)
}

let ok = 0
for (const [label, url] of entries) {
  const r = await probe(url)
  if (r.verdict !== 'OK') {
    console.log(`${r.verdict.padEnd(7)} ${label.padEnd(26)} ${r.why}`)
    continue
  }
  ok++
  const sig = r.bitrate ? `${r.resolution ?? '?'}@${Math.round(r.bitrate / 1000)}k` : 'no declared bitrate'
  console.log(
    `OK      ${label.padEnd(26)} ${String(r.rungs).padStart(2)} rung  ${sig.padEnd(20)}` +
    ` seg=${r.segmentSeconds ?? '?'}s win=${r.windowSegments}  -> ${r.reception}${r.thin ? '  [thin window]' : ''}`
  )
}
console.error(`\n${ok}/${entries.length} usable`)
