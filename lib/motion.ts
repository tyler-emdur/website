/**
 * One motion grammar under eleven skins.
 *
 * Every world is supposed to move differently — a door swings, a page folds, a
 * flood spreads outward from where you clicked. That part was already right.
 * What was wrong is that each of those gestures invented its own numbers: the
 * site held eleven hand-rolled bezier curves, five different spellings of
 * `cubic-bezier(0.4,0,0.2,1)`, and fourteen uses of `ease-in-out` — which is
 * symmetric, and symmetric easing is the thing that makes motion read as a web
 * page instead of a place. Real interfaces decelerate into arrivals and
 * accelerate out of departures.
 *
 * So the curves and the timings live here, and the twelve portals stay twelve
 * distinguishable gestures that pick their numbers out of a shared vocabulary.
 */

import { useEffect, useState } from 'react'

/**
 * Easings, asymmetric on purpose.
 *
 * A thing that arrives decelerates into position. A thing that leaves
 * accelerates away. Using the same curve in both directions is the tell that
 * nobody chose it.
 */
export const EASE = {
  /** Arrives fast and settles. Anything entering the frame. */
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Hesitates, then goes. Anything leaving it. */
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Symmetric — and only for something on a hinge that really does reverse. */
  hinge: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Constant rate, for anything a motor or a tape is driving. */
  motor: 'linear',
} as const

/**
 * Durations in milliseconds.
 *
 * A scale rather than a single value, for the same reason type has a scale:
 * the number should come from somewhere. `ceremony` is the ceiling — nothing
 * may block a visitor longer than that, which is what retired the four-second
 * slide onto the departures board.
 */
export const DUR = {
  /** Direct feedback. Under 100ms reads as instant. */
  tap: 90,
  /** Something changing appearance where it stands. */
  state: 180,
  /** Something changing position. */
  move: 320,
  /** A short crossing. */
  cross: 560,
  /** The standard trip between two worlds. */
  travel: 880,
  /** A deliberately slow arrival. The longest anything is allowed to take. */
  ceremony: 1200,
} as const

/** `transition` shorthand, so the three parts always arrive in the same order. */
export function transition(
  property: string,
  ms: number,
  ease: string = EASE.enter,
): string {
  return `${property} ${ms}ms ${ease}`
}

/**
 * Whether this visitor asked for less movement.
 *
 * Worth stating why this is a hook and not the `@media (prefers-reduced-motion)`
 * block in globals.css: the portals animate through inline styles, and an
 * inline style outranks any rule in a stylesheet. The media query there was
 * never able to reach them, so a visitor with vestibular sensitivity got the
 * full 90-degree fold and the vortex regardless of their setting.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** The same question, live — it re-renders if the visitor changes the setting. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    onChange()
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * How long a crossing should actually run.
 *
 * Reduced motion collapses it to a cut rather than a faster version of the same
 * swing — a 200ms rotateX(90deg) is still a rotation through ninety degrees.
 */
export function crossing(ms: number, reduced: boolean): number {
  return reduced ? DUR.tap : ms
}
