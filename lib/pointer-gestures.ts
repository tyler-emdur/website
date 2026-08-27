/**
 * One-finger drag and two-finger pinch, as a pure state machine.
 *
 * This lives outside the camera because the camera lives inside a WebGL world,
 * and a WebGL world can't be checked from a browser-automation tab — see the
 * table in CLAUDE.md. Pulled out here it is ordinary data in, ordinary data
 * out, and `scripts/check-gestures.mjs` exercises every branch of it.
 *
 * The rules it encodes:
 *   · one pointer down  → drag; each move reports the delta since the last
 *   · two pointers down → pinch; each move reports the change in spread, and
 *                         the drag stops so the view doesn't lurch sideways
 *   · lifting to one    → nothing, until a fresh gesture starts. Resuming the
 *                         drag from whichever finger survived is where pinch
 *                         implementations usually snap.
 *   · pointercancel     → same as up. The browser fires it when it decides a
 *                         touch was really a scroll, and it is the event that
 *                         was missing when the hub couldn't be panned at all.
 */

export interface GestureResult {
  /** Pixels moved since the last report, while dragging. */
  pan?: { dx: number; dy: number }
  /** Pixels the two fingers came together by. Positive = pinching in. */
  pinch?: number
}

export interface GestureTracker {
  down(id: number, x: number, y: number): void
  move(id: number, x: number, y: number): GestureResult
  up(id: number): void
  clear(): void
  readonly dragging: boolean
  readonly count: number
}

export function createGestureTracker(): GestureTracker {
  const points = new Map<number, { x: number; y: number }>()
  let dragging = false
  let last = { x: 0, y: 0 }
  let spread = 0

  const currentSpread = () => {
    const [a, b] = [...points.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  return {
    down(id, x, y) {
      points.set(id, { x, y })
      if (points.size === 1) {
        dragging = true
        last = { x, y }
      } else if (points.size === 2) {
        dragging = false
        spread = currentSpread()
      }
    },

    move(id, x, y) {
      if (!points.has(id)) return {}
      points.set(id, { x, y })

      if (points.size >= 2) {
        const now = currentSpread()
        const delta = spread > 0 ? spread - now : 0
        spread = now
        return { pinch: delta }
      }

      if (!dragging) return {}
      const dx = x - last.x
      const dy = y - last.y
      last = { x, y }
      return { pan: { dx, dy } }
    },

    up(id) {
      points.delete(id)
      if (points.size < 2) spread = 0
      // A surviving finger does not inherit the drag — that is the lurch.
      if (points.size < 2) dragging = false
    },

    clear() {
      points.clear()
      dragging = false
      spread = 0
    },

    get dragging() { return dragging },
    get count() { return points.size },
  }
}
