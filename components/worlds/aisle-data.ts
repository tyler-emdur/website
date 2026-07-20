export const SPACING = 2.6
export const RAIL_X = 4.0   // half-width: two flatbeds pass without touching
export const RAIL_Y = 2.3   // sign/tag height — where a person actually reads
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
// A warehouse club that stayed open too long. Concrete floor, steel racking to
// a ceiling you can't see, and no signage telling you where anything is —
// because a warehouse that's easy to leave is a warehouse you leave.
//
// The pricing follows the real conventions, which are already eerie enough that
// they need no help:
//   .99  ordinary stock, reordered forever
//   .97  a manager marked it down by hand. nobody says why.
//   .88 / .00  a deal that was negotiated with someone
//   *    top-right of the sign: this item is not being reordered. ever. when
//        it's gone it is gone, and the people who know what the asterisk means
//        buy all of it. they call it the death star.
type Category = 'bulk' | 'chilled' | 'household' | 'treasure' | 'seasonal' | 'foodcourt'

export interface StockItem {
  label: string
  flavor: string
  price: string
  cat: Category
  /** the asterisk. not being reordered. when it's gone, it's gone. */
  star?: boolean
}

export const STOCK: StockItem[] = [
  // bulk — the whole point. nothing here is a single of anything.
  { cat: 'bulk', label: 'KIRKLAND SIGNATURE EVERYTHING', flavor: 'Contents: everything. Net wt. 40 lb. The label lists no ingredients, only a quantity.', price: '$24.99' },
  { cat: 'bulk', label: 'PAPER TOWELS, 30 ROLLS', flavor: 'Will not fit in your vehicle. Will not fit in your home. You are buying them anyway. Everyone does.', price: '$21.99' },
  { cat: 'bulk', label: 'MAYONNAISE, 1 GALLON', flavor: 'One gallon. For a household of one. The jar is taller than your forearm and it is not the largest one here.', price: '$11.97' },
  { cat: 'bulk', label: 'MUFFINS, 12-PACK (6 FLAVORS)', flavor: 'Each muffin is the size of a fist. You will eat two today and throw out nine. This is the arrangement.', price: '$9.99' },
  { cat: 'bulk', label: 'WATER, 40 BOTTLES', flavor: 'A pallet at the front, past the registers, where the heavy things live so you must carry them the furthest.', price: '$4.49' },
  { cat: 'bulk', label: 'RICE, 50 LB SACK', flavor: 'Rated for a family, a restaurant, or one person planning something they have not told anyone about.', price: '$18.88' },
  { cat: 'bulk', label: 'BATTERIES, 48-PACK', flavor: 'More batteries than devices you own. You will find them in a drawer in nine years, still holding charge.', price: '$16.97' },
  { cat: 'bulk', label: 'A PALLET OF SOMETHING', flavor: 'Shrink-wrapped, unlabeled, stacked to shoulder height. It was here last time. It has not gotten shorter.', price: 'SEE SIGN' },

  // chilled — the cold aisle at the back wall, because the back is where you'll go
  { cat: 'chilled', label: 'ROTISSERIE CHICKEN', flavor: 'Priced below cost since forever. Kept at the furthest possible point from the door, on purpose, and it works.', price: '$4.99' },
  { cat: 'chilled', label: 'MILK — SELL BY: SOON', flavor: 'Not a date. A warning. Two gallons banded together because one gallon is not a quantity here.', price: '$5.49' },
  { cat: 'chilled', label: 'CHEESE, WHEEL OF', flavor: 'A wheel. Not a wedge. You would need to host something. You are not going to host anything.', price: '$89.99' },
  { cat: 'chilled', label: 'FROZEN BERRIES, 4 LB', flavor: 'For the smoothies you will make every morning starting Monday. It has been Monday for a while now.', price: '$12.97' },
  { cat: 'chilled', label: 'THE LAST FRESH THING', flavor: 'One left in the case. There is always exactly one left. You have seen it in three different sections.', price: '$0.97', star: true },

  // household — practical, then abruptly not
  { cat: 'household', label: 'FOLDING TABLE, 6 FT', flavor: 'For an event. You have no event. The table knows this and is patient.', price: '$39.99' },
  { cat: 'household', label: 'FLICKERING BULB, 12-PACK', flavor: 'Guaranteed 10,000 hours. One of them is already installed in the ceiling above you. Right now. Look up.', price: '$14.99' },
  { cat: 'household', label: 'FLOOR WAX (DISCONTINUED SCENT)', flavor: 'Scent: "Recently Buffed." Nobody has buffed in a very long time. The concrete disagrees.', price: '$7.97', star: true },
  { cat: 'household', label: 'A KEY, UNMARKED, 2-PACK', flavor: 'Fits a door not stocked at this location. Sold in twos, because you will lose one. You always lose one.', price: '$3.97', star: true },
  { cat: 'household', label: 'FLATBED CART', flavor: 'Larger than a cart. For items a cart refuses. The wheel that squeaks is the one you hate.', price: 'NOT FOR SALE' },
  { cat: 'household', label: 'PLASTIC WRAP, 3,000 FT', flavor: 'Three thousand feet. Over half a mile of it. You will use forty feet and pass it down in a will.', price: '$19.99' },
  { cat: 'household', label: 'GARBAGE BAGS, 200 CT', flavor: 'Two hundred. One for every week of the next four years. The box does the math for you on the side.', price: '$22.88' },

  // treasure — the reason people walk the whole floor. it is never the same twice.
  { cat: 'treasure', label: 'A KAYAK', flavor: 'Next to the socks. It will not be here next week. Nothing here is here next week. That is the mechanism.', price: '$349.99' },
  { cat: 'treasure', label: 'A CASKET', flavor: 'Genuinely stocked. Genuinely for sale. Between the patio furniture and the vitamins, priced like a mattress.', price: '$999.99' },
  { cat: 'treasure', label: 'ENGAGEMENT RING, 2.4 CT', flavor: 'In a locked glass case, in a warehouse, near the tires. Someone has bought one of these in a hurry.', price: '$14,999.99' },
  { cat: 'treasure', label: 'A SHED', flavor: 'Fully assembled, on the concrete, with a little porch. People live in less. The sign says SOME ASSEMBLY.', price: '$3,299.00' },
  { cat: 'treasure', label: 'GRAND PIANO', flavor: 'Aisle 14. No one is playing it. The lid is propped. There is a little sign asking you not to.', price: '$8,999.99', star: true },
  { cat: 'treasure', label: 'A TELESCOPE', flavor: 'Points at a ceiling you cannot see the top of. Someone has aimed it upward anyway. It is focused.', price: '$229.97', star: true },

  // seasonal — every season at once, none of them the current one
  { cat: 'seasonal', label: 'CHRISTMAS TREES (IN AUGUST)', flavor: 'The decorations went up before the last holiday ended. They rotate on their own. You have heard them rotate.', price: '$79.99' },
  { cat: 'seasonal', label: 'PATIO SET, 7-PIECE', flavor: 'For a patio. You do not have a patio. The box has a photograph of a patio, and a family, and better weather.', price: '$799.00' },
  { cat: 'seasonal', label: 'BEACH TOWEL, LANDLOCKED', flavor: 'For a beach this warehouse insists is two aisles over. It is not. You will go look anyway.', price: '$12.97', star: true },
  { cat: 'seasonal', label: 'CALENDAR, WRONG YEAR', flavor: 'Every month is this month. Every day is today. Very efficient. Marked down twice already.', price: '$4.97', star: true },

  // food court — past the registers. the only part of the building with chairs.
  { cat: 'foodcourt', label: 'HOT DOG & SODA COMBO', flavor: 'A dollar fifty. It has been a dollar fifty since 1985 and it will be a dollar fifty after the building is gone.', price: '$1.50' },
  { cat: 'foodcourt', label: 'PIZZA, WHOLE PIE, 18"', flavor: 'Eighteen inches. Ready in six minutes. The number on your receipt is called out to a room with no clock.', price: '$9.95' },
  { cat: 'foodcourt', label: 'SOFT SERVE, BOTTOMLESS', flavor: 'The machine is always down. The machine has never been up. There is still a line for the machine.', price: '$1.99' },
  { cat: 'foodcourt', label: 'FREE SAMPLE, UNATTENDED', flavor: 'A tray of paper cups under a heat lamp. No employee. The cups are warm. Some of them are already empty.', price: 'FREE' },
  { cat: 'foodcourt', label: 'A CART, NOT YOURS', flavor: 'Half-full of things you were about to pick up. Parked where you were about to stand.', price: 'ABANDONED' },
]

const CAT_STYLE: Record<Category, { color: string; shape: Shape }> = {
  bulk: { color: '#b08a4a', shape: 'box' },
  chilled: { color: '#4a8c9a', shape: 'cylinder' },
  household: { color: '#7a7a86', shape: 'box' },
  treasure: { color: '#a8873f', shape: 'octahedron' },
  seasonal: { color: '#a05a7a', shape: 'cone' },
  foodcourt: { color: '#b5504a', shape: 'cylinder' },
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
  { key: 'membership-desk', label: 'MEMBERSHIP DESK (UNSTAFFED)', flavor: 'your card is on the counter. the photo is you. you do not remember it being taken, and you are not smiling.' },
  { key: 'receipt-checker', label: 'THE RECEIPT CHECKER', flavor: 'stands at an exit you cannot find, holding a highlighter, facing this way. has not moved. is not waiting for anyone else.' },
  { key: 'sample-station', label: 'SAMPLE STATION, STILL WARM', flavor: 'the pan is on. the little cups are filled. the employee stepped away. the tongs are still swinging.' },
  { key: 'other-you', label: 'THE OTHER YOU, TWO BAYS OVER', flavor: 'same jacket. same flatbed. they turn at the endcap exactly when you do.' },
  { key: 'employee-month', label: 'EMPLOYEE OF THE MONTH', flavor: 'every month. same photo. the little brass plate just keeps changing the date.' },
  { key: 'future-receipt', label: "A RECEIPT YOU HAVEN'T EARNED YET", flavor: 'itemizes things still on the racking ahead. the total is already highlighted.' },
  { key: 'exit-this-way', label: 'EXIT → (THIS WAY)', flavor: 'the arrow points deeper into the warehouse. you have been following it the whole time.' },
  { key: 'the-asterisk', label: 'A SIGN WITH AN ASTERISK', flavor: 'top right corner. it means this item is not being reordered. when it is gone it is gone. every sign back here has one.' },
  { key: 'lost-child-page', label: 'ATTENTION: LOST MEMBER', flavor: 'the description on the PA matches you. it was recorded years ago. it uses the past tense.' },
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
