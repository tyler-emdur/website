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

/** A broadcast-grade picture. Everything at or above this had five rungs or three. */
const CLEAN_BITRATE = 4_000_000

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

  if (bandwidth >= CLEAN_BITRATE && rungs >= 3) return 'clean'

  // A declared bitrate, but a low one, on a manifest with a single rung: it
  // cannot drop quality when the connection tightens, so it stalls instead.
  // Vientiane's four feeds are all exactly this.
  if (rungs <= 1) return 'unstable'

  return 'grainy'
}

/** The measurement where there is one, the hand-written label where there isn't. */
export function receptionFor(channel: BroadcastChannel): Reception {
  return measuredReception(channel.id) ?? channel.reception
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
