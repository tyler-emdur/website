// How each signal on the dial actually looks, from what the station declares.
//
// `reception` used to be a label somebody typed next to each channel. Istanbul
// was marked grainy; TRT World turns out to serve 2560x1440 at 11.5 Mbps, the
// best picture on the whole dial. Taipei was marked clean; it is a government
// traffic camera with no declared bitrate at all. The labels were guesses about
// a real thing, and the real thing is written down in every HLS manifest.
//
// `reception.json` is what the manifests answered when `scripts/bake-reception.mjs`
// last asked them. This file reads those numbers and decides what the picture is.
//
// Reception describes the *picture* — how much detail is actually encoded — and
// nothing else. It deliberately ignores segment length and window depth, which
// govern how long a stall lasts rather than how the image looks: Reykjavik
// declares an eleven-second segment and only three of them, which makes it slow
// to recover but does not make its 1080p any softer. Reliability is already the
// liveness cascade's job in `app/api/broadcast/route.ts`, and the screen already
// has NO SIGNAL for when a slot goes dark. Folding the two together would put
// visible noise on top of a clean picture and call it honesty.

import type { BroadcastChannel, Reception } from './channels'
import BAKED from './reception.json'

interface Feed {
  url: string
  reachable: boolean
  variantCount?: number
  topBandwidth?: number | null
  topResolution?: string | null
  targetDuration?: number | null
  segments?: number | null
}

const CHANNELS_BAKED = (BAKED as { channels: Record<string, { feeds?: Feed[] }> }).channels ?? {}

/** When the numbers below were true. Nothing on this dial is stable forever. */
export const BAKED_AT: string = (BAKED as { bakedAt?: string }).bakedAt ?? 'unknown'

/**
 * The feed a viewer would actually land on — the first one that answered, which
 * is the same order `/api/broadcast` hands out when a primary has gone dark.
 */
function firstReachable(id: string): Feed | null {
  return CHANNELS_BAKED[id]?.feeds?.find(f => f.reachable) ?? null
}

/**
 * A broadcast-grade picture, for a station that declares a bitrate but no
 * frame size.
 *
 * This number used to be the whole rule, and it was overfitted: 4 Mbps came
 * from a dial whose three clean feeds happened to sit at 4.2, 4.7 and 11.5.
 * Arirang Seoul serves adaptive 1920x1080 across four rungs at 3.26 Mbps and
 * derived `grainy` under it, which is wrong — a 1080p rung is 1080p however
 * efficiently it was encoded, and a modern encoder reaching full HD at 3 Mbps
 * is better at its job, not worse. Frame size decides first now; this is the
 * fallback for the manifests that keep it to themselves.
 */
const CLEAN_BITRATE = 4_000_000

/** A rung this tall is a broadcast picture regardless of how few bits it took. */
const CLEAN_HEIGHT = 1080

/** The vertical half of a declared RESOLUTION, e.g. 1920x1080 -> 1080. */
function declaredHeight(resolution: string | null | undefined): number | null {
  const h = Number(resolution?.match(/\d+\s*[x×]\s*(\d+)/)?.[1] ?? NaN)
  return Number.isFinite(h) ? h : null
}

/**
 * What the signal looks like, or null when nothing was measured.
 *
 * Null is the honest answer for Dushanbe: its host resolves but never completes
 * a connection from here, and a bake machine in one city cannot tell a dark
 * station from one that declines to talk to it. Those channels keep the label
 * written by hand rather than inheriting a measurement that was never taken.
 */
export function measuredReception(id: string): Reception | null {
  const feed = firstReachable(id)
  if (!feed) return null

  const bandwidth = feed.topBandwidth ?? null
  const rungs = feed.variantCount ?? 0

  // No declared bitrate at all. Every one of these is a single-playlist webcam
  // or CCTV camera — Ulaanbaatar, Opatija, Taipei, Saxon Harbor. They are soft
  // because nobody encoded them to be anything else.
  if (bandwidth === null) return 'grainy'

  // Three rungs or more means the station can hold its picture when the
  // connection tightens; a 1080p top rung means there is a picture worth
  // holding. Either a declared frame size that tall, or — for the stations that
  // publish bitrate and no resolution — enough bits that it must be.
  const height = declaredHeight(feed.topResolution)
  if (rungs >= 3 && (height !== null ? height >= CLEAN_HEIGHT : bandwidth >= CLEAN_BITRATE)) return 'clean'

  // A declared bitrate, but a low one, on a manifest with a single rung: it
  // cannot drop quality when the connection tightens, so it stalls instead.
  // Vientiane's four feeds are all exactly this.
  if (rungs <= 1) return 'unstable'

  return 'grainy'
}

/**
 * The measurement where there is one, the hand-written label where there isn't,
 * and soft where there is neither — a channel added since the last bake has
 * nothing to go on, and a signal nobody has measured is likelier to be a webcam
 * than a broadcast truck.
 */
export function receptionFor(channel: BroadcastChannel): Reception {
  return measuredReception(channel.id) ?? channel.reception ?? 'grainy'
}

/**
 * The station's own declarations for a channel, for anything that wants the
 * numbers rather than the verdict. Returns null when the slot was never
 * measured — never a plausible-looking stand-in.
 */
export function declaredSignal(id: string): {
  resolution: string | null
  bitrate: number | null
  rungs: number
  segmentSeconds: number | null
} | null {
  const feed = firstReachable(id)
  if (!feed) return null
  return {
    resolution: feed.topResolution ?? null,
    bitrate: feed.topBandwidth ?? null,
    rungs: feed.variantCount ?? 0,
    segmentSeconds: feed.targetDuration ?? null,
  }
}

/**
 * How long this exact feed takes to come in, as far as its manifest will say.
 *
 * `targetDuration` is the longest segment the station will ever hand out, and
 * the window is how many of them it keeps at the live edge. Together they are
 * the real reason one channel appears almost at once and another sits dark for
 * several seconds: Taipei cuts its camera into one-second pieces, Vientiane
 * into twelve-second ones, and nothing a player does can make the twelve-second
 * one arrive faster than twelve seconds' worth of video takes to encode.
 *
 * Looked up by exact URL rather than by channel, because a dial position may be
 * showing any feed in its cascade by the time anyone is watching. Returns null
 * for a feed that was never baked — a channel added since the last bake, which
 * then simply has nothing to report until `scripts/bake-reception.mjs` runs.
 */
export function acquisitionFor(url: string): { segmentSeconds: number | null; windowSegments: number | null } | null {
  for (const channel of Object.values(CHANNELS_BAKED)) {
    const feed = channel.feeds?.find(f => f.url === url)
    if (!feed) continue
    if (!feed.reachable) return null
    return {
      segmentSeconds: feed.targetDuration ?? null,
      windowSegments: feed.segments ?? null,
    }
  }
  return null
}

/**
 * A live window this shallow is one late segment from stopping. It is the
 * number that actually predicts a stall — Reykjavik keeps three segments and
 * Istanbul keeps six hundred — and it is nothing to do with how the picture
 * looks, which is why reception ignores it and the tuner prints it instead.
 */
export const THIN_WINDOW = 3
