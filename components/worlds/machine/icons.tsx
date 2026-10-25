/**
 * EMDUR/OS icons.
 *
 * These were colour emoji — 💾 🌐 😵 💣 🗑 📁 — and on a modern Mac the browser
 * resolves them to Apple Color Emoji: rounded, gradient-shaded, soft-shadowed
 * glyphs drawn in 2026, sitting inside a shell from 1994. Nothing else in this
 * world dates itself that badly. The window chrome is two-pixel outset borders,
 * the title bars are a #000080 → #1084d0 ramp, the type is Arial at 9px, and
 * then the desktop was decorated with iOS artwork.
 *
 * So they are drawn here instead, on a 16×16 grid, out of the sixteen colours
 * a VGA text-mode palette actually had. Below, each icon is the grid itself —
 * one character per pixel — which is both how this kind of art was authored and
 * the only form in which it can be read and corrected by hand.
 *
 * `compile` turns a grid into horizontal runs, so a row of six identical pixels
 * ships as one `<rect>` rather than six. At 26px the whole set is under 4kB of
 * inline SVG and nothing is fetched.
 */

import { useMemo } from 'react'

/**
 * The IBM VGA 16-colour palette, in its canonical order. Every pixel below is
 * one of these — the constraint is the point. `.` is transparent, so the
 * desktop pattern shows through the gaps instead of a grey box.
 */
const PAL: Record<string, string> = {
  k: '#000000', // black
  n: '#000080', // navy
  e: '#008000', // green
  t: '#008080', // teal
  m: '#800000', // maroon
  p: '#800080', // purple
  o: '#808000', // olive
  s: '#c0c0c0', // silver
  g: '#808080', // gray
  b: '#0000ff', // blue
  l: '#00ff00', // lime
  c: '#00ffff', // aqua
  r: '#ff0000', // red
  f: '#ff00ff', // fuchsia
  y: '#ffff00', // yellow
  w: '#ffffff', // white
}

const GRIDS = {
  // My Computer — a CRT on a stand, which is what this machine is.
  computer: [
    '................',
    '..kkkkkkkkkkkk..',
    '..kssssssssssk..',
    '..ksttttttttsk..',
    '..kstcttttttsk..',
    '..ksttttttttsk..',
    '..ksttttttttsk..',
    '..ksttttttttsk..',
    '..kssssssssssk..',
    '..kkkkkkkkkkkk..',
    '......gggg......',
    '....kssssssk....',
    '....kkkkkkkk....',
    '................',
    '................',
    '................',
  ],
  // A world file, and WEBSITE.V1 — the globe every 90s browser put on a button.
  globe: [
    '................',
    '................',
    '......nnnn......',
    '....nnbbbbnn....',
    '...nbbbwbbbbn...',
    '..nbbeeeebbbbn..',
    '..nbbbeeebbbbn..',
    '..nwwwwwwwwwwn..',
    '..nbbeeebbbbbn..',
    '..nbbbbeeebbbn..',
    '..nbbbbbeebbbn..',
    '...nbbbwbbbbn...',
    '....nnbbbbnn....',
    '......nnnn......',
    '................',
    '................',
  ],
  // WORLD_05.WLD is the one you are standing in, so it gets the local disk.
  disk: [
    '................',
    '.kkkkkkkkkkkkkk.',
    '.kgggssssssgggk.',
    '.kgggssssssgggk.',
    '.kgggssssssgggk.',
    '.kggggggggggggk.',
    '.kggggggggggggk.',
    '.kggggggggggggk.',
    '.kwwwwwwwwwwwwk.',
    '.kwkkkkkkkkkkwk.',
    '.kwwwwwwwwwwwwk.',
    '.kwkkkkkkkwwwwk.',
    '.kwwwwwwwwwwwwk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................',
  ],
  folder: [
    '................',
    '................',
    '..ooooo.........',
    '..oyyyoooooooo..',
    '..oyyyyyyyyyyo..',
    '..oyyyyyyyyyyo..',
    '..oyyyyyyyyyyo..',
    '..oyyyyyyyyyyo..',
    '..oyyyyyyyyyyo..',
    '..oyyyyyyyyyyo..',
    '..oyyyyyyyyyyo..',
    '..oyyyyyyyyyyo..',
    '..oooooooooooo..',
    '................',
    '................',
    '................',
  ],
  doc: [
    '................',
    '...kkkkkkkkkk...',
    '...kwwwwwwwwk...',
    '...kwnnnnnwwk...',
    '...kwwwwwwwwk...',
    '...kwnnnnnnnk...',
    '...kwwwwwwwwk...',
    '...kwnnnnnwwk...',
    '...kwwwwwwwwk...',
    '...kwnnnnnnnk...',
    '...kwwwwwwwwk...',
    '...kwnnnwwwwk...',
    '...kwwwwwwwwk...',
    '...kkkkkkkkkk...',
    '................',
    '................',
  ],
  // A sector that hasn't healed yet: grey, and the bottom of the page is gone.
  torn: [
    '................',
    '...kkkkkkkkkk...',
    '...kwwwwwwwwk...',
    '...kwggggwwgk...',
    '...kwwwwwwwwk...',
    '...kwggwwgggk...',
    '...kwwwwwwwwk...',
    '...kwgggwwggk...',
    '...kwwwwwwwwk...',
    '......kwwwwwk...',
    '........kwwwk...',
    '..........kwk...',
    '...........kk...',
    '................',
    '................',
    '................',
  ],
  // SRVHOST.EXE. The arcs on the left and right are the only part that moves
  // in the icon's favour: it reads as transmitting even at 16 pixels.
  antenna: [
    '................',
    '.......k........',
    '..c....k....c...',
    '.c.c..kkk..c.c..',
    '.c.c..k.k..c.c..',
    '.c.c.k...k.c.c..',
    '..c..k...k..c...',
    '.....k.k.k......',
    '.....k...k......',
    '....k.....k.....',
    '....k.kkk.k.....',
    '....k.....k.....',
    '...k.......k....',
    '..kkkkkkkkkkk...',
    '................',
    '................',
  ],
  bin: [
    '................',
    '.......kk.......',
    '...kkkkkkkkkk...',
    '...kssssssssk...',
    '...kkkkkkkkkk...',
    '....kssssssk....',
    '....ksgssgsk....',
    '....ksgssgsk....',
    '....ksgssgsk....',
    '....ksgssgsk....',
    '....ksgssgsk....',
    '.....kssssk.....',
    '.....kkkkkk.....',
    '................',
    '................',
    '................',
  ],
  console: [
    '................',
    '.ssssssssssssss.',
    '.snnnnnnnnnnnns.',
    '.skkkkkkkkkkkks.',
    '.skwwkwwwkkkkks.',
    '.skkkkkkkkkkkks.',
    '.skwwkwwkkkkkks.',
    '.skkkkkkkkkkkks.',
    '.skwwkwkwwkkkks.',
    '.skkkkkkkkkkkks.',
    '.skwkkkkkkkkkks.',
    '.skkkkkkkkkkkks.',
    '.ssssssssssssss.',
    '................',
    '................',
    '................',
  ],
  flask: [
    '................',
    '.....kkkkkk.....',
    '......k..k......',
    '......k..k......',
    '......k..k......',
    '.....k....k.....',
    '.....k....k.....',
    '....k......k....',
    '....k.llll.k....',
    '...k.llllll.k...',
    '...k.llllll.k...',
    '..k.llllllll.k..',
    '..kllllllllllk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
  ],
  joystick: [
    '................',
    '................',
    '......rrrr......',
    '.....rrrrrr.....',
    '.....rrrrrr.....',
    '......rrrr......',
    '.......kk.......',
    '.......kk.......',
    '.......kk.......',
    '.......kk.......',
    '...kkkkkkkkkk...',
    '..kssssssssssk..',
    '..ksrsssssrssk..',
    '..kssssssssssk..',
    '..kkkkkkkkkkkk..',
    '................',
  ],
  // TETRIS.EXE. Four of the seven piece colours, behind their own gridlines.
  blocks: [
    '................',
    '................',
    '..kkkkkkkkkkkkk.',
    '..kcccknnnkyyyk.',
    '..kcccknnnkyyyk.',
    '..kcccknnnkyyyk.',
    '..kkkkkkkkkkkkk.',
    '..krrrkeeekfffk.',
    '..krrrkeeekfffk.',
    '..krrrkeeekfffk.',
    '..kkkkkkkkkkkkk.',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // the_next_big_thing.ppt, deleted at slide 3.
  chart: [
    '................',
    '..kkkkkkkkkkkk..',
    '..kwwwwwwwwwwk..',
    '..kwwwwwwwwwwk..',
    '..kwwwwwwwrrwk..',
    '..kwwwwwwwrrwk..',
    '..kwwwweewrrwk..',
    '..kwwwweewrrwk..',
    '..kwnnweewrrwk..',
    '..kwnnweewrrwk..',
    '..kwnnweewrrwk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '................',
  ],
  warning: [
    '................',
    '.......kk.......',
    '......kyyk......',
    '......kyyk......',
    '.....kyyyyk.....',
    '.....kykkyk.....',
    '....kyykkyyk....',
    '....kyykkyyk....',
    '...kyyykkyyyk...',
    '...kyyyyyyyyk...',
    '..kyyyykkyyyyk..',
    '..kyyyyyyyyyyk..',
    '.kyyyyyyyyyyyyk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................',
  ],
  power: [
    '................',
    '................',
    '.......kk.......',
    '...kkk.kk.kkk...',
    '..kk...kk...kk..',
    '..k....kk....k..',
    '.k.....kk.....k.',
    '.k............k.',
    '.k............k.',
    '.k............k.',
    '..k..........k..',
    '..kk........kk..',
    '...kkk....kkk...',
    '......kkkk......',
    '................',
    '................',
  ],
  // ── Minesweeper ────────────────────────────────────────────────────────────
  mine: [
    '................',
    '.......k........',
    '.......k........',
    '..k....k....k...',
    '...k.kkkkk.k....',
    '....kkkkkkkk....',
    '...kkkwwkkkkk...',
    '.kk.kkkkkkkk.kk.',
    '....kkkkkkkk....',
    '....kkkkkkkk....',
    '....kkkkkkkk....',
    '...k.kkkkk.k....',
    '..k....k....k...',
    '.......k........',
    '.......k........',
    '................',
  ],
  flag: [
    '................',
    '......krrrr.....',
    '......krrrrrr...',
    '......krrrr.....',
    '......krr.......',
    '......k.........',
    '......k.........',
    '......k.........',
    '......k.........',
    '......k.........',
    '......k.........',
    '....kkkkkk......',
    '...kkkkkkkk.....',
    '................',
    '................',
    '................',
  ],
  'face-ok': [
    '................',
    '.....kkkkkk.....',
    '...kkyyyyyykk...',
    '..kyyyyyyyyyyk..',
    '.kyyyyyyyyyyyyk.',
    '.kyykkyyyykkyyk.',
    '.kyykkyyyykkyyk.',
    '.kyyyyyyyyyyyyk.',
    '.kyykyyyyyykyyk.',
    '.kyyykkkkkkyyyk.',
    '.kyyyyyyyyyyyyk.',
    '..kyyyyyyyyyyk..',
    '...kkyyyyyykk...',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
  'face-oh': [
    '................',
    '.....kkkkkk.....',
    '...kkyyyyyykk...',
    '..kyyyyyyyyyyk..',
    '.kyyyyyyyyyyyyk.',
    '.kyykkyyyykkyyk.',
    '.kyykkyyyykkyyk.',
    '.kyyyyyyyyyyyyk.',
    '.kyyyykkkkyyyyk.',
    '.kyyyykkkkyyyyk.',
    '.kyyyyyyyyyyyyk.',
    '..kyyyyyyyyyyk..',
    '...kkyyyyyykk...',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
  'face-win': [
    '................',
    '.....kkkkkk.....',
    '...kkyyyyyykk...',
    '..kyyyyyyyyyyk..',
    '.kyyyyyyyyyyyyk.',
    '.kykkkkkkkkkkyk.',
    '.kykkkkyykkkkyk.',
    '.kyykkkyykkkyyk.',
    '.kyyyyyyyyyyyyk.',
    '.kyykyyyyyykyyk.',
    '.kyyykkkkkkyyyk.',
    '..kyyyyyyyyyyk..',
    '...kkyyyyyykk...',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
  'face-dead': [
    '................',
    '.....kkkkkk.....',
    '...kkyyyyyykk...',
    '..kyyyyyyyyyyk..',
    '.kyyyyyyyyyyyyk.',
    '.kykykyyykykyyk.',
    '.kyykyyyyykyyyk.',
    '.kykykyyykykyyk.',
    '.kyyyyyyyyyyyyk.',
    '.kyyykkkkkkyyyk.',
    '.kyykyyyyyykyyk.',
    '..kyyyyyyyyyyk..',
    '...kkyyyyyykk...',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
} as const

export type IconName = keyof typeof GRIDS

type Run = readonly [x: number, y: number, w: number, fill: string]

/**
 * Grid → horizontal runs.
 *
 * Also the only guard on the art: a mistyped row is a silent one-pixel shear
 * that is very hard to see at 26px and impossible to see in a diff, so a row
 * of the wrong width or a colour outside the palette throws at import time
 * rather than shipping crooked.
 */
function compile(name: string, grid: readonly string[]): Run[] {
  if (grid.length !== 16) throw new Error(`icon "${name}" is ${grid.length} rows tall, not 16`)
  const runs: Run[] = []
  grid.forEach((row, y) => {
    if (row.length !== 16) {
      throw new Error(`icon "${name}" row ${y} is ${row.length} px wide, not 16`)
    }
    let x = 0
    while (x < 16) {
      const ch = row[x]
      let w = 1
      while (row[x + w] === ch) w++
      if (ch !== '.') {
        const fill = PAL[ch]
        if (!fill) throw new Error(`icon "${name}" row ${y} uses "${ch}", not a palette colour`)
        runs.push([x, y, w, fill])
      }
      x += w
    }
  })
  return runs
}

const COMPILED: Record<IconName, Run[]> = Object.fromEntries(
  Object.entries(GRIDS).map(([name, grid]) => [name, compile(name, grid)]),
) as Record<IconName, Run[]>

/**
 * One icon. `shapeRendering: crispEdges` is the whole trick — without it the
 * browser antialiases the rect edges and a 16px grid scaled to 26 goes soft,
 * which is the exact look being avoided.
 */
export function Icon({ name, size = 26, shadow = false, center = false }: {
  name: IconName
  size?: number
  shadow?: boolean
  /** Centre the icon over a label beneath it, as the desktop and folder grids do. */
  center?: boolean
}) {
  const runs = COMPILED[name]
  const rects = useMemo(
    () => runs.map(([x, y, w, fill], i) => (
      <rect key={i} x={x} y={y} width={w} height={1} fill={fill} />
    )),
    [runs],
  )

  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      style={{
        // Always block, so the label beneath it gets its own line — the labels
        // are inline-block too, and an inline icon lets a short one like
        // 'WORLDS' ride up alongside the picture instead of sitting under it.
        // The centring is opt-in because an auto margin inside the Start menu's
        // flex rows would push every label to the far edge.
        display: 'block', flexShrink: 0,
        margin: center ? '0 auto' : undefined,
        filter: shadow ? 'drop-shadow(1px 1px 0 rgba(0,0,0,0.55))' : undefined,
      }}
      aria-hidden
    >
      {rects}
    </svg>
  )
}
