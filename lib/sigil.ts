// Deterministic, seeded "specimen mark" — a small line-art glyph derived
// purely from a string id. No images, no fonts: every catalogue entry gets a
// consistent, unique seal instead of a photo it doesn't have.

function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface SigilSpec {
  poly: string
  ticks: { x1: number; y1: number; x2: number; y2: number }[]
  ring?: { r: number }
  dotR: number
}

export function generateSigil(seed: string): SigilSpec {
  const rand = mulberry32(hashSeed(seed))
  const cx = 50, cy = 50
  const sides = 3 + Math.floor(rand() * 5)
  const baseR = 17 + rand() * 9
  const rot = rand() * Math.PI * 2
  const pts: string[] = []
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2
    const jitter = 0.86 + rand() * 0.3
    pts.push(`${(cx + Math.cos(a) * baseR * jitter).toFixed(1)},${(cy + Math.sin(a) * baseR * jitter).toFixed(1)}`)
  }
  const tickCount = 3 + Math.floor(rand() * 4)
  const ticks = Array.from({ length: tickCount }, () => {
    const a = rand() * Math.PI * 2
    const r1 = baseR + 4 + rand() * 4
    const r2 = r1 + 6 + rand() * 11
    return {
      x1: cx + Math.cos(a) * r1, y1: cy + Math.sin(a) * r1,
      x2: cx + Math.cos(a) * r2, y2: cy + Math.sin(a) * r2,
    }
  })
  const ring = rand() > 0.45 ? { r: baseR + 13 + rand() * 8 } : undefined
  const dotR = 1.1 + rand() * 1.3
  return { poly: pts.join(' '), ticks, ring, dotR }
}
