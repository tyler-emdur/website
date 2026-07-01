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
export const COLORS = ['#c2b280', '#8a9a5b', '#6b4f3a', '#3d5a6c', '#9c4a3c', '#5a4a6b', '#7a6a3a', '#4a6b5a', '#6b3a4a', '#8a7a9a']
export const JUNK_NOUNS = ['SPECIMEN', 'ARTIFACT', 'UNIT', 'MODULE', 'FRAGMENT', 'RELIC', 'VESSEL', 'INSTRUMENT', 'DEVICE', 'TOKEN', 'CANISTER', 'FIXTURE', 'CONTRAPTION', 'CURIO', 'APPARATUS', 'REMNANT']
export const JUNK_FLAVORS = [
  'Origin unknown. Weight: negligible.',
  'Found, not bought.',
  'Catalogued in error, kept anyway.',
  'No further information available.',
  'Function: undetermined.',
  'Once belonged to someone else.',
  'Warranty expired before purchase.',
  'Filed under: miscellaneous.',
  'Smells faintly of static electricity.',
  'Nobody has claimed this. Nobody will.',
  'Inventory count: uncertain.',
  'Return policy does not apply here.',
  'Left behind, not lost.',
  'This one hums, faintly, if you listen.',
  'Condition: as-is. Always as-is.',
  'Shelf life: indeterminate.',
]

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

export interface Slot {
  index: number
  kind: 'gem' | 'junk'
  label: string
  flavor: string
  color: string
  shape: Shape
  scale: number
  rotation: [number, number, number]
  gemKey?: string
}

export function getSlot(index: number): Slot {
  const rnd = mulberry32(Math.imul(index + 1, 2654435761) >>> 0)
  if (index > 0 && index % GEM_EVERY === 0) {
    const gem = GEMS[(Math.floor(index / GEM_EVERY) - 1) % GEMS.length]
    return {
      index, kind: 'gem', label: gem.label, flavor: gem.flavor, gemKey: gem.key,
      color: '#F472B6', shape: 'octahedron', scale: 1.2,
      rotation: [0, rnd() * Math.PI, 0],
    }
  }
  const shape = SHAPES[Math.floor(rnd() * SHAPES.length)]
  const color = COLORS[Math.floor(rnd() * COLORS.length)]
  const noun = JUNK_NOUNS[Math.floor(rnd() * JUNK_NOUNS.length)]
  const flavor = JUNK_FLAVORS[Math.floor(rnd() * JUNK_FLAVORS.length)]
  const serial = 1000 + Math.floor(rnd() * 8999)
  return {
    index, kind: 'junk', label: `${noun} · NO. ${serial}`, flavor, color, shape,
    scale: 0.62 + rnd() * 0.5,
    rotation: [(rnd() - 0.5) * 0.6, rnd() * Math.PI, (rnd() - 0.5) * 0.3],
  }
}
