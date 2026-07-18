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

// ── inventory ────────────────────────────────────────────────────────────────
// This is a supermarket that stayed open too long. The stock is real product,
// technically — it just stopped making sense a few thousand items ago. Retail
// copy is deadpan. Prices are honest, which is to say: not in dollars, because
// the registers stopped taking dollars a while back and nobody reset them.

type Category = 'dry' | 'chilled' | 'household' | 'produce' | 'seasonal' | 'unshelved'

export interface StockItem {
  label: string
  flavor: string
  price: string
  cat: Category
}

export const STOCK: StockItem[] = [
  // dry & canned goods — center of the store, if there is a center
  { cat: 'dry', label: 'CANNED SILENCE', flavor: 'Net wt. varies. Best served in a room where the lights already buzz.', price: 'PAY LATER' },
  { cat: 'dry', label: 'GENERIC BRAND CEREAL', flavor: 'The box just says CEREAL. The mascot is a rectangle. It maintains eye contact.', price: '2 FOR 2' },
  { cat: 'dry', label: 'OFF-BRAND SOUP', flavor: 'Flavor: SOUP. Ingredients: SOUP. Contains: SOUP.', price: '$?.99' },
  { cat: 'dry', label: 'STORE-BRAND WATER', flavor: 'Sourced from the drinking fountain by the restrooms. Bottled with love, or at least nearby.', price: 'FREE-ISH' },
  { cat: 'dry', label: 'BREAD, DAY ???', flavor: 'The sell-by sticker has been reprinted so many times it is now just a small mirror.', price: 'DAY OLD (×∞)' },
  { cat: 'dry', label: 'CRACKERS (STALE ON ARRIVAL)', flavor: 'Freshness sealed out. Whatever this is, it is sealed in.', price: '1 MOLAR' },
  { cat: 'dry', label: 'INSTANT NOODLES, EXPIRED 20██', flavor: 'The expiry year is smudged. On purpose, you think. By whom, you do not ask.', price: '3 MIN OF LIFE' },
  { cat: 'dry', label: 'A CAN WITH NO LABEL', flavor: 'Heavier than it should be. Something inside shifts when you set it down. Do not set it down.', price: 'AS-IS' },

  // chilled & frozen — the section the power keeps reaching, somehow
  { cat: 'chilled', label: 'MILK — SELL BY: SOON', flavor: 'Not a date. A warning. The carton sweats when you look away.', price: '1 GLANCE' },
  { cat: 'chilled', label: 'THE LAST FRESH THING', flavor: 'One left. There is always exactly one left. You have seen it in three different aisles.', price: 'MARKET PRICE' },
  { cat: 'chilled', label: 'FROZEN PEAS (STILL FROZEN)', flavor: 'The freezer has no power. The peas do not care. The peas have made other arrangements.', price: 'COLD, SOMEHOW' },
  { cat: 'chilled', label: 'ICE (NO LONGER AVAILABLE)', flavor: 'The bin is full. The scoop is warm. Take a bag. It will be a bag of water by the exit. There is no exit.', price: '32°F FLAT' },
  { cat: 'chilled', label: 'YOGURT, FLAVOR: TUESDAY', flavor: 'Every flavor is a day of the week. It is always the same day. You know which one.', price: 'ONE (1) TUESDAY' },

  // household — the aisle where things get practical, then stop
  { cat: 'household', label: 'BATTERIES (HALF-CHARGED)', flavor: 'Enough charge to start something. Never enough to finish it. Sold in odd numbers.', price: '1.5 V' },
  { cat: 'household', label: 'FLICKERING BULB, 40W', flavor: 'Guaranteed to flicker. Comes pre-installed in the ceiling above you. Right now. Look up.', price: 'ONE FLICKER' },
  { cat: 'household', label: 'FLOOR WAX (DISCONTINUED SCENT)', flavor: 'Scent: "Recently Mopped." Nobody has mopped in a very long time. The floor disagrees.', price: 'SLICK' },
  { cat: 'household', label: 'A KEY, UNMARKED', flavor: 'Fits a door not stocked in this location. Please do not ask which door. Please.', price: 'ASK NOBODY' },
  { cat: 'household', label: 'EXACT CHANGE', flavor: 'The precise amount you will need at the register. The register does not exist. You will still need it.', price: 'CORRECT' },
  { cat: 'household', label: 'PLASTIC BAG (ALREADY IN ONE)', flavor: "You are holding it. You have always been holding it. It rustles when the store thinks.", price: '5¢ / ∞' },
  { cat: 'household', label: 'MOP & BUCKET, UNATTENDED', flavor: 'Left mid-job. The water is still cloudy. The cleanup on aisle 14 was never finished.', price: 'SEE MGR' },

  // produce — nothing here grew anywhere you'd recognize
  { cat: 'produce', label: 'APPLE (WAX FRUIT)', flavor: 'Shines beautifully. Bite it and find out. The store is watching to see if you bite it.', price: '1 TOOTH' },
  { cat: 'produce', label: 'BANANAS, PERFECTLY RIPE FOREVER', flavor: 'They do not brown. They do not soften. They have been perfectly ripe since before you were born.', price: 'TIMELESS' },
  { cat: 'produce', label: 'MUSHROOMS (LOCAL)', flavor: 'Grown on-site. Very on-site. In the back. Where the light does not go. Where you are heading.', price: 'FORAGED' },
  { cat: 'produce', label: 'A SINGLE GRAPE', flavor: 'Sold individually. The bunch it came from is somewhere in the store, looking for it.', price: '1/∞ LB' },

  // seasonal — the aisle that is every season and no season
  { cat: 'seasonal', label: 'HALLOWEEN CANDY (IN JULY)', flavor: 'It is always the wrong holiday here. The decorations rotate on their own. You have heard them rotate.', price: '1 SCARE' },
  { cat: 'seasonal', label: 'BEACH TOWEL, LANDLOCKED', flavor: 'For a beach this store insists exists two aisles over. It does not. You will look anyway.', price: 'SPF ∞' },
  { cat: 'seasonal', label: 'GREETING CARD (BLANK INSIDE)', flavor: 'Front reads: THINKING OF YOU. Inside is where you would write who from. You cannot remember who.', price: 'SENTIMENT' },
  { cat: 'seasonal', label: 'CALENDAR, WRONG YEAR', flavor: 'Every month is this month. Every day is today. It is a very efficient calendar.', price: '1 YEAR (USED)' },

  // unshelved — items that fell off the manifest and kept existing
  { cat: 'unshelved', label: "SOMEONE'S GROCERY LIST", flavor: 'Milk, eggs, get out while you still — the rest is torn off. The handwriting is getting familiar.', price: 'FOUND' },
  { cat: 'unshelved', label: 'A JAR OF BUTTONS', flavor: 'None of them match. All of them are from coats. None of the coats are for sale here.', price: 'BY WEIGHT' },
  { cat: 'unshelved', label: 'TWO OF THE EXACT SAME THING', flavor: 'You cannot tell which one you picked up first. Neither can the store. This bothers the store.', price: 'BOGO' },
  { cat: 'unshelved', label: 'THE PA MICROPHONE', flavor: 'Still warm. Still on. If you take it, the announcements will be in your voice. They have been for a while.', price: 'ATTENTION SHOPPERS' },
  { cat: 'unshelved', label: 'A CART, NOT YOURS', flavor: 'Half-full of things you were about to pick up. The wheel that squeaks is the one you hate.', price: 'ABANDONED' },
]

const CAT_STYLE: Record<Category, { color: string; shape: Shape }> = {
  dry: { color: '#b08a4a', shape: 'box' },
  chilled: { color: '#4a8c9a', shape: 'cylinder' },
  household: { color: '#7a7a86', shape: 'box' },
  produce: { color: '#5a8c5f', shape: 'sphere' },
  seasonal: { color: '#a05a7a', shape: 'cone' },
  unshelved: { color: '#8c7a4a', shape: 'octahedron' },
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
  { key: 'managers-office', label: "THE MANAGER'S OFFICE (LOCKED)", flavor: 'the blinds are shut. the light is on. the OPEN sign faces inward.' },
  { key: 'warm-cart', label: "A CART, STILL WARM", flavor: 'someone was pushing this a moment ago. the aisle behind you is empty. it stays empty.' },
  { key: 'other-you', label: 'THE OTHER YOU, TWO AISLES OVER', flavor: 'same jacket. same basket. they turn the corner exactly when you do.' },
  { key: 'employee-month', label: 'EMPLOYEE OF THE MONTH', flavor: 'every month. same photo. the little brass plate just keeps changing the date.' },
  { key: 'future-receipt', label: "A RECEIPT YOU HAVEN'T EARNED YET", flavor: 'itemizes things still on the shelves ahead. the total is already circled.' },
  { key: 'exit-this-way', label: 'EXIT → (THIS WAY)', flavor: 'the arrow points deeper into the store. you have been following it the whole time.' },
  { key: 'lost-child-page', label: 'ATTENTION: LOST CHILD', flavor: 'the description on the PA matches you. it was recorded years ago. it uses the past tense.' },
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
