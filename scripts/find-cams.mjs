// Walk a webcam provider's own directory and write down the manifests it names.
//
// The companion to scripts/probe-stream.mjs, and the other half of the same
// lesson. probe-stream vets a candidate; this is where candidates are supposed
// to come from. Thirty of them were once assembled from memory by analogy with
// the two cameras already on the dial — twelve IDs invented by incrementing
// hr_opatija01 — and twenty-three were dead, because a camera ID is not a thing
// that can be reasoned out. It is a fact held by the provider.
//
//   node scripts/find-cams.mjs > cams.json          # the whole directory
//   node scripts/find-cams.mjs croatia italy        # only those countries
//
// whatsupcams nests four levels deep — country, region, place, camera — and the
// manifest URL appears only on the camera page, never in the index. So this
// walks down from the root, stops at the first page that names a manifest, and
// prints what it found. Output is `LABEL|url` lines on stderr for reading and
// JSON on stdout for piping into probe-stream.mjs, which still has the last
// word: the provider's own page for Mostar's Old Bridge lists a URL that 404s.
//
// Expect this to break. It reads somebody else's HTML, which they did not
// promise to keep shaped this way, and the point of writing it down is that
// next time the walk is repeatable instead of remembered.

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const ROOT = 'https://www.whatsupcams.com/en/webcams/'
const MAX_DEPTH = 4

const only = process.argv.slice(2).map(s => s.toLowerCase())
const seen = new Set()
const found = []

async function get(url) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), 20000)
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: c.signal, redirect: 'follow' })
    return r.ok ? await r.text() : ''
  } catch { return '' } finally { clearTimeout(t) }
}

/** Directory links under the root, normalised. Paginated listings are skipped. */
function links(html) {
  const out = new Set()
  for (const m of html.matchAll(/whatsupcams\.com\/en\/webcams\/[a-z0-9\-/]*/g)) {
    const url = 'https://www.' + (m[0].endsWith('/') ? m[0] : m[0] + '/')
    if (!url.includes('/page/')) out.add(url)
  }
  return [...out]
}

async function walk(url, depth) {
  if (seen.has(url) || depth > MAX_DEPTH) return
  seen.add(url)
  const html = await get(url)
  if (!html) return

  const manifests = [...new Set([...html.matchAll(/https?:\/\/[a-z0-9.\-]+\/[^"'\s<>]*\.m3u8/g)].map(m => m[0]))]
  if (manifests.length) {
    // A page that names a stream is a camera page, and the bottom of the walk.
    const title = (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? url)
      .replace(/\s*[|–-]\s*WhatsUpCams.*/i, '')
      .replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').trim()
    found.push({ page: url, title, manifests })
    for (const m of manifests) console.error(`${title}|${m}`)
    return
  }

  for (const next of links(html)) {
    if (next.startsWith(url) && next !== url) await walk(next, depth + 1)
  }
}

const countries = links(await get(ROOT))
  .filter(u => u !== ROOT)
  .filter(u => !only.length || only.some(c => u.includes(`/webcams/${c}/`)))
console.error(`${countries.length} countr${countries.length === 1 ? 'y' : 'ies'} to walk\n`)
for (const c of countries) await walk(c, 1)
console.error(`\n${seen.size} pages, ${found.length} cameras — now put them through probe-stream.mjs`)
console.log(JSON.stringify(found, null, 1))
