export const SPACING = 2.6
export const RAIL_X = 3.2
export const RAIL_Y = 2.3
export const HANG_Y = RAIL_Y - 1.15
export const GEM_EVERY = 11

// ── seeded pseudo-random ─────────────────────────────────────────────────────
export function mulberry32(seed: number) {
  let s = seed | 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const SHAPES = ['box', 'sphere', 'cone', 'cylinder', 'torus', 'octahedron'] as const
export type Shape = typeof SHAPES[number]

// ── real inventory ───────────────────────────────────────────────────────────
// Everything on these shelves is a real thing: a race that happened, a project
// that shipped, an idea that died, an album that got worn out. Retail copy is
// deadpan. Prices are honest, which is to say: not in dollars.

type Category = 'race' | 'project' | 'experiment' | 'music' | 'gear' | 'memory'

export interface StockItem {
  label: string
  flavor: string
  price: string
  cat: Category
}

export const STOCK: StockItem[] = [
  // races & mountains — paid for in hours
  { cat: 'race', label: 'BOULDER MARATHON (2024)', flavor: '26.2 miles. The last 3 were the only ones that mattered.', price: '$3:41:22' },
  { cat: 'race', label: 'PIKES PEAK ASCENT', flavor: 'Started in the dark so nobody would see the struggling. Everybody struggles at 14,000 ft.', price: '14,115 FT' },
  { cat: 'race', label: 'MT. ELBERT SUMMIT', flavor: 'Highest point in Colorado. Air sold separately.', price: '14,439 FT' },
  { cat: 'race', label: 'GOLDEN GATE CANYON 25K', flavor: 'Worst mile: 8. Best mile: 15, when the counting stopped.', price: 'MUDDY — AS-IS' },
  { cat: 'race', label: 'MAROON BELLS LOOP', flavor: 'Most photographed peaks in the state. The photo never gets it right.', price: '6H 10M' },
  { cat: 'race', label: 'FIRST TRAIL RUN (2021)', flavor: "Wasn't supposed to be 12 miles. Turned around twice. Kept going both times.", price: 'NO REFUNDS' },
  { cat: 'memory', label: 'RACE BIB #2847', flavor: 'Finished 4 minutes faster than planned. Kept the bib, threw away the plan.', price: 'NOT FOR SALE' },

  // projects — shipped, still under warranty
  { cat: 'project', label: 'DIGGER v1.0', flavor: 'Underground music discovery engine. Finds artists you were about to be into.', price: 'FREE W/ TASTE' },
  { cat: 'project', label: 'STRAVA ANALYTICS', flavor: 'GPS-confirmed stop detection. Knows when you stopped. Tells no one.', price: '$0.00/mo' },
  { cat: 'project', label: 'WILDFIRE RISK MODEL', flavor: 'scikit-learn fed on live weather. Worries professionally so you can worry casually.', price: 'PRICELESS-ISH' },
  { cat: 'project', label: 'HAIL BOT', flavor: 'Discord bot that watches the sky for hail. It has seen things.', price: '1 WEBHOOK' },
  { cat: 'project', label: 'FIT MAKER', flavor: 'Photograph your closet, get a weather-matched outfit. The mirror is optional.', price: '2 SHIRTS' },
  { cat: 'project', label: 'AP PRACTICE', flavor: 'Gemini-graded free response. The robot is a fair but firm grader.', price: '1 GPA POINT' },
  { cat: 'project', label: 'FARADAY TOOLS', flavor: 'Solar estimates and hail maps for a real company with real roofs.', price: 'B2B PRICING' },
  { cat: 'project', label: 'MATHIBEX (2023)', flavor: 'Flask-era equation generator. First shipped thing. Archived, not ashamed.', price: 'VINTAGE' },
  { cat: 'project', label: 'TRACKFLATION', flavor: 'Chart proving high schoolers keep getting faster. The chart is upsetting.', price: '1 PR' },
  { cat: 'project', label: 'THIS WEBSITE', flavor: 'You are inside this product right now. Please do not shake the shelf.', price: 'RECURSIVE' },

  // dead experiments — the discount bin
  { cat: 'experiment', label: 'FONT THAT BREATHES', flavor: 'Text that expands with scroll velocity. Nauseating above 40wpm. Discontinued.', price: 'RECALLED' },
  { cat: 'experiment', label: 'MARKOV COMMIT MESSAGES', flavor: 'Auto-generated "fix fix bug the the thing." Accurate, unfortunately.', price: '50% OFF' },
  { cat: 'experiment', label: 'INBOX-ZERO SIMULATOR', flavor: 'A game that turned out to be a worse version of the actual job.', price: 'FREE (TAKE IT)' },
  { cat: 'experiment', label: 'CSS SOLAR SYSTEM', flavor: 'All 8 planets plus Pluto out of spite. Runs at 6fps. Beautiful and useless.', price: '9 PLANETS/$1' },
  { cat: 'experiment', label: 'SLEEP DATA → MIDI', flavor: 'A week of sleep as music. Sounded like a fax machine having a bad week.', price: '8 HRS/NIGHT' },
  { cat: 'experiment', label: 'CHESS ENGINE (UNFINISHED)', flavor: 'Minimax to depth 3. Still loses to the tutorial. Sold as parts.', price: 'MATE IN ???' },
  { cat: 'experiment', label: 'WEBSITE v1', flavor: 'One page, one font, a list of links. It worked fine. That was not the point.', price: 'SEE: THE MACHINE' },

  // music — shelf-worn
  { cat: 'music', label: 'BOARDS OF CANADA — MHTRTC', flavor: 'Music has the right to children. Shelf has the right to this record.', price: '1 CHILDHOOD' },
  { cat: 'music', label: 'FOUR TET — ROUNDS', flavor: 'For coding. For running. For the drive home. Heavy rotation, light wear.', price: '$9.99 FOREVER' },
  { cat: 'music', label: 'APHEX TWIN — SAW 85-92', flavor: 'Selected ambient works. The unselected ones were fine too.', price: 'AMBIENT' },
  { cat: 'music', label: 'BURIAL — UNTRUE', flavor: 'For rainy commutes that you take on purpose.', price: '2AM ONLY' },
  { cat: 'music', label: 'JON HOPKINS — IMMUNITY', flavor: 'Side A builds things. Side B lets them go.', price: '1 SUNRISE' },

  // gear & memories — household aisle
  { cat: 'gear', label: 'SPLIT TERMINAL PANES', flavor: 'The day this was discovered, everything before it became slower in hindsight.', price: 'CTRL+B %' },
  { cat: 'gear', label: 'THE JACKET (UNWASHED)', flavor: 'You have been meaning to wash it for approximately one year.', price: '1 YEAR' },
  { cat: 'gear', label: 'FIELD NOTEBOOK 2021–2024', flavor: '112 readable pages. Coordinates: 40.0150°N 105.2705°W.', price: 'PAGES TORN' },
  { cat: 'memory', label: 'BLACK CANYON RIM', flavor: "The depth doesn't register correctly. Your brain insists it's smaller. It's not.", price: 'VERTIGO INCL.' },
  { cat: 'memory', label: 'ELEVATION (GENERAL)', flavor: 'Problems feel smaller above 12,000 feet. Stock is kept high on purpose.', price: '5,430 FT BASE' },
  { cat: 'memory', label: 'JAN 3, 2024', flavor: '"Start over" is different from "starting over." One is failure. The other is a choice.', price: '1 RESOLUTION' },
  { cat: 'memory', label: '3AM (ASSORTED)', flavor: 'Made something nobody asked for. Showed one person. That was enough.', price: 'SLEEP (1)' },
]

const CAT_STYLE: Record<Category, { color: string; shape: Shape }> = {
  race: { color: '#c96f3a', shape: 'cone' },
  project: { color: '#4a7d8c', shape: 'box' },
  experiment: { color: '#8c4a55', shape: 'cylinder' },
  music: { color: '#6a5a8c', shape: 'torus' },
  gear: { color: '#7a7a52', shape: 'sphere' },
  memory: { color: '#5a7a5f', shape: 'octahedron' },
}

// filler junk between the real stock — texture, not content
const JUNK_NOUNS = ['SPECIMEN', 'ARTIFACT', 'UNIT', 'MODULE', 'FRAGMENT', 'RELIC', 'VESSEL', 'CURIO', 'APPARATUS', 'REMNANT']
const JUNK_FLAVORS = [
  'Origin unknown. Weight: negligible.',
  'Catalogued in error, kept anyway.',
  'Once belonged to someone else.',
  'Warranty expired before purchase.',
  'Filed under: miscellaneous.',
  'Smells faintly of static electricity.',
  'Left behind, not lost.',
  'Condition: as-is. Always as-is.',
]
const JUNK_COLORS = ['#c2b280', '#8a9a5b', '#6b4f3a', '#3d5a6c', '#5a4a6b']

export interface Gem { key: string; label: string; flavor: string }
export const GEMS: Gem[] = [
  { key: 'first-commit', label: 'FIRST COMMIT', flavor: 'git init. nothing about this place was inevitable yet.' },
  { key: 'shipped-bug', label: 'THE BUG THAT SHIPPED', flavor: 'lived in production for six days. nobody noticed. nobody was fired.' },
  { key: 'unfinished-tape', label: "SIDE B — DIDN'T FINISH RECORDING", flavor: 'the other copy is still in the garage. this one got lost first.' },
  { key: 'the-counter', label: 'THE COUNTER', flavor: "does not reach zero. check the console if you don't believe it." },
  { key: 'rejection', label: 'REJECTION, FRAMED', flavor: 'kept as a reminder, not a wound.' },
  { key: 'the-door', label: 'A DOOR THAT STILL WORKS', flavor: 'world zero is still running, somewhere behind you.' },
  { key: 'blank-tape', label: 'BLANK, ON PURPOSE', flavor: 'some things are better left unrecorded.' },
]

// ── manager's special — rotates daily ────────────────────────────────────────
export function getDayNumber(): number {
  return Math.floor(Date.now() / 86400000)
}

export function getSpecial(): { item: StockItem; index: number } {
  const day = getDayNumber()
  const item = STOCK[day % STOCK.length]
  // somewhere between slot 25 and 165 — a real walk, but reachable
  const index = 25 + ((day * 37) % 140)
  return { item, index }
}

export interface Slot {
  index: number
  kind: 'gem' | 'junk' | 'item' | 'special'
  label: string
  flavor: string
  price?: string
  color: string
  shape: Shape
  scale: number
  rotation: [number, number, number]
  gemKey?: string
}

export function getSlot(index: number): Slot {
  const rnd = mulberry32(Math.imul(index + 1, 2654435761) >>> 0)

  // gems keep their cadence
  if (index > 0 && index % GEM_EVERY === 0) {
    const gem = GEMS[(Math.floor(index / GEM_EVERY) - 1) % GEMS.length]
    return {
      index, kind: 'gem', label: gem.label, flavor: gem.flavor, gemKey: gem.key,
      color: '#F472B6', shape: 'octahedron', scale: 1.2,
      rotation: [0, rnd() * Math.PI, 0],
    }
  }

  // today's special
  const special = getSpecial()
  if (index === special.index) {
    const style = CAT_STYLE[special.item.cat]
    return {
      index, kind: 'special',
      label: `★ MANAGER'S SPECIAL — ${special.item.label}`,
      flavor: special.item.flavor,
      price: `TODAY ONLY: ${special.item.price}`,
      color: '#F6C66A', shape: style.shape, scale: 1.25,
      rotation: [0, rnd() * Math.PI, 0],
    }
  }

  // roughly 1 in 3 slots is filler junk, the rest are real stock
  const isJunk = rnd() < 0.34
  if (isJunk) {
    const shape = SHAPES[Math.floor(rnd() * SHAPES.length)]
    return {
      index, kind: 'junk',
      label: `${JUNK_NOUNS[Math.floor(rnd() * JUNK_NOUNS.length)]} · NO. ${1000 + Math.floor(rnd() * 8999)}`,
      flavor: JUNK_FLAVORS[Math.floor(rnd() * JUNK_FLAVORS.length)],
      price: '$?.??',
      color: JUNK_COLORS[Math.floor(rnd() * JUNK_COLORS.length)],
      shape,
      scale: 0.55 + rnd() * 0.35,
      rotation: [(rnd() - 0.5) * 0.6, rnd() * Math.PI, (rnd() - 0.5) * 0.3],
    }
  }

  // real stock, deterministic but scattered so neighboring slots differ
  const pick = STOCK[Math.floor(rnd() * STOCK.length)]
  const style = CAT_STYLE[pick.cat]
  return {
    index, kind: 'item',
    label: pick.label, flavor: pick.flavor, price: pick.price,
    color: style.color, shape: style.shape,
    scale: 0.75 + rnd() * 0.3,
    rotation: [(rnd() - 0.5) * 0.3, rnd() * Math.PI, (rnd() - 0.5) * 0.2],
  }
}

// ── the basket ───────────────────────────────────────────────────────────────
export interface BasketEntry { label: string; price: string; at: number }

export function loadBasket(): BasketEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('aisle_basket')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function addToBasket(entry: BasketEntry): BasketEntry[] {
  const basket = loadBasket()
  if (basket.some(b => b.label === entry.label)) return basket
  const next = [...basket, entry].slice(-60)
  try { localStorage.setItem('aisle_basket', JSON.stringify(next)) } catch {}
  return next
}
