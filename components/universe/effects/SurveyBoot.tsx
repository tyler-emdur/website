'use client'
import { useEffect, useState } from 'react'
import { boulderClockWithSeconds } from '@/lib/environment'
import { getAllObjects } from '@/lib/universe-store'
import { DUR, EASE, transition, useReducedMotion } from '@/lib/motion'

// ─── THE GAP BEFORE THE SURVEY ────────────────────────────────────────────────
// The hub lazy-loads three.js — the largest chunk on the site — and until this
// file existed it did so behind `dynamic(..., { ssr: false })` with no loading
// state at all. A visitor crossed a portal, the portal finished, and then there
// was an empty black frame with nothing in it. That is precisely the line
// CLAUDE.md draws: mystery is seeing something is there and not knowing what,
// broken is not being able to see anything is there. A black rectangle is the
// second one, and it is the first thing a first-time visitor meets.
//
// So the hub boots instead. The panel speaks in the corner terminal's dialect
// (`AbstractIndex`) because it is the same instrument warming up, and every
// line on it is true:
//
//   PLOTTER  tracks a real milestone — whether the renderer actually exists yet
//   CATALOG  is `getAllObjects().length`, the real size of the catalog
//   SYNC     is the real Boulder clock, reread every second
//
// That last one is doing more work than it looks. The problem with a black
// frame is that it cannot be told apart from a dead page, and the honest fix
// for that is not a fake progress bar — invented progress is exactly the
// decorative telemetry this project bans. It is one number that is really
// moving. If the clock is ticking, the site is alive; if it has stopped, it
// isn't. Nobody needs to be told that to feel it.

/** How long the renderer gets before we stop calling this "loading". */
export const PATIENCE = 15_000

/**
 * One above drei's ceiling.
 *
 * The scene's floating labels are drei `<Html>`, which derives each one's
 * z-index from its distance to the camera and scales it into `zIndexRange`,
 * defaulting to `[16777271, 0]` (drei/web/Html.js:99). Every label on the hub
 * uses that default, so 16777271 is a real upper bound rather than a number
 * picked to be large — and the backdrop needs exactly one more than it. Without
 * this the labels sit *above* the backdrop for the whole fade-out: seven
 * captions at full opacity floating on black while the scene they belong to is
 * still hidden behind the panel.
 */
const ABOVE_THE_SCENE = 16777272

export type BootPhase =
  /** The three.js chunk is still coming down the wire. */
  | 'code'
  /** The WebGL renderer exists; the scene is still mounting. */
  | 'renderer'
  /** Drawing. The panel leaves. */
  | 'ready'

const COL = { color: 'rgba(160,160,160,0.34)' }
const DIM = { color: 'rgba(160,160,160,0.20)' }

function Row({ label, value, tone = COL }: { label: string; value: string; tone?: { color: string } }) {
  return (
    <div style={{ ...tone }}>
      {label.padEnd(9)}{value}
    </div>
  )
}

export default function SurveyBoot({ phase, stalled }: { phase: BootPhase; stalled: boolean }) {
  const reduced = useReducedMotion()
  // Read after mount, not during render. `WorldManager` picks the world out of
  // a persisted store, so which world the first client render produces depends
  // on localStorage — and a clock or a store lookup during that render is how
  // you get a hydration mismatch on the one screen that must not flicker. The
  // dashes are the honest placeholder: there is no reading yet.
  const [clock, setClock] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<number | null>(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    setClock(boulderClockWithSeconds())
    setCatalog(getAllObjects().length)
    const id = setInterval(() => setClock(boulderClockWithSeconds()), 1000)
    return () => clearInterval(id)
  }, [])

  // Stay mounted through the fade, then stop costing anything.
  useEffect(() => {
    if (phase !== 'ready') return
    const id = setTimeout(() => setGone(true), reduced ? DUR.tap : DUR.cross)
    return () => clearTimeout(id)
  }, [phase, reduced])

  if (gone) return null

  const ready = phase === 'ready'
  // No renderer means no scene is ever going to arrive, and the panel is
  // sitting on top of the one thing that still works: `PortalDirectory`'s gate
  // index is plain DOM at top-left, outside the canvas, and every gate on it
  // is clickable without WebGL. So the backdrop lifts and leaves it visible.
  const dead = stalled && phase === 'code'

  return (
    <div
      aria-hidden={ready}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: ABOVE_THE_SCENE,
        pointerEvents: 'none',
        background: dead ? 'transparent' : '#00000d',
        opacity: ready ? 0 : 1,
        transition: transition('opacity', reduced ? DUR.tap : DUR.cross, EASE.exit),
        fontFamily: 'monospace',
        fontSize: 9,
        letterSpacing: '0.14em',
        lineHeight: 2,
        userSelect: 'none',
      }}
    >
      {/* While booting, the panel sits exactly where the corner terminal will
          be once the survey is up, so the readout doesn't arrive and then jump
          somewhere else — it is the same instrument, and it stays put.
          
          Once the renderer has failed it stops being a boot readout and starts
          being an error, so it moves to the middle, where the visitor is
          already looking. That is also the only way it can coexist with the
          corner terminal, which comes back on screen in exactly this case. */}
      <div style={dead ? {
        position: 'fixed', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        whiteSpace: 'pre', textAlign: 'left',
      } : {
        position: 'fixed', bottom: 28, left: 28, whiteSpace: 'pre',
      }}>
      <div>
        <Row label="SURVEY" value="TE-∅" />
        <Row
          label="PLOTTER"
          value={
            stalled && phase === 'code' ? 'NO RENDERER'
            : phase === 'code' ? 'LOADING'
            : 'ONLINE'
          }
          tone={stalled && phase === 'code' ? { color: 'rgba(239,68,68,0.45)' } : COL}
        />
        <Row label="CATALOG" value={catalog == null ? '—' : `${catalog} OBJECTS`} />
        <Row label="SYNC" value={clock ?? '--:--:--'} tone={DIM} />
        {stalled && (
          <div style={{ ...DIM, marginTop: 10, maxWidth: '44ch', whiteSpace: 'normal', letterSpacing: '0.1em' }}>
            {dead
              ? 'no renderer. this view needs webgl — but the gate index up and to the left is not drawn by it, and every gate on it still opens.'
              : 'the plotter is up and the catalog is still coming.'}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
