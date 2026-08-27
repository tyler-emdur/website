/**
 * Exercises lib/pointer-gestures.ts.
 *
 * The hub's camera is hand-rolled inside a WebGL canvas, and per CLAUDE.md a
 * browser-automation tab cannot be trusted to tell you anything about a WebGL
 * world. So the gesture bookkeeping lives in a pure module and gets checked
 * here instead, where the answers are just numbers.
 *
 *   node --experimental-strip-types scripts/check-gestures.mjs
 */
import { createGestureTracker } from '../lib/pointer-gestures.ts'

let failures = 0
function check(name, actual, expected) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  const ok = a === e
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `\n       expected ${e}\n       actual   ${a}`}`)
}

// ── one finger drags ─────────────────────────────────────────────────────────
{
  const g = createGestureTracker()
  g.down(1, 100, 100)
  check('one finger down starts a drag', g.dragging, true)
  check('drag reports the delta since the last move', g.move(1, 130, 90), { pan: { dx: 30, dy: -10 } })
  check('deltas are incremental, not cumulative', g.move(1, 135, 90), { pan: { dx: 5, dy: 0 } })
  g.up(1)
  check('lifting ends the drag', g.dragging, false)
  check('moves after the lift report nothing', g.move(1, 200, 200), {})
}

// ── a move from a pointer that never went down is ignored ────────────────────
{
  const g = createGestureTracker()
  check('unknown pointer reports nothing', g.move(9, 10, 10), {})
}

// ── two fingers pinch ────────────────────────────────────────────────────────
{
  const g = createGestureTracker()
  g.down(1, 100, 100)
  g.down(2, 200, 100) // spread 100
  check('a second finger cancels the drag', g.dragging, false)
  check('two fingers down, no movement yet', g.count, 2)

  // fingers come together to 60px apart: pinching IN by 40
  check('pinching in reports a positive delta', g.move(2, 160, 100), { pinch: 40 })
  // and back out to 150 apart: spreading by 90
  check('spreading reports a negative delta', g.move(2, 250, 100), { pinch: -90 })
}

// ── the classic lurch: lifting one finger of a pinch ─────────────────────────
{
  const g = createGestureTracker()
  g.down(1, 100, 100)
  g.down(2, 200, 100)
  g.move(2, 300, 100)
  g.up(2)
  check('one finger left after a pinch does not resume the drag', g.dragging, false)
  check('and its next move reports nothing', g.move(1, 400, 400), {})
  g.up(1)
  check('both lifted leaves nothing held', g.count, 0)
}

// ── a fresh drag after a pinch works normally ────────────────────────────────
{
  const g = createGestureTracker()
  g.down(1, 0, 0); g.down(2, 100, 0)
  g.up(1); g.up(2)
  g.down(3, 50, 50)
  check('a new gesture after a pinch drags again', g.dragging, true)
  check('and reports its delta', g.move(3, 60, 55), { pan: { dx: 10, dy: 5 } })
}

// ── pointercancel is just up, and clear resets everything ────────────────────
{
  const g = createGestureTracker()
  g.down(1, 10, 10)
  g.up(1) // the handler routes pointercancel here too
  check('a cancelled touch does not leave a stale drag', g.dragging, false)

  g.down(1, 10, 10)
  g.down(2, 20, 20)
  g.clear()
  check('clear drops every pointer', g.count, 0)
  check('clear ends the drag', g.dragging, false)
}

// ── sign convention, stated once ─────────────────────────────────────────────
// CameraRig does `zoomBy(pinch * PINCH_SPEED)` and zoomBy adds to camera z.
// Positive pinch must therefore mean "fingers together" -> z grows -> further
// away. That is the direction a phone user expects.
{
  const g = createGestureTracker()
  g.down(1, 0, 0); g.down(2, 200, 0)
  const { pinch } = g.move(2, 100, 0) // fingers together
  check('fingers together zooms out (positive => camera z grows)', pinch > 0, true)
}

console.log(failures ? `\n${failures} FAILED` : '\nall gesture checks passed')
process.exit(failures ? 1 : 0)
