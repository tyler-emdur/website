'use client'
import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  MathUtils, Object3D, Color, InstancedMesh, CanvasTexture, Mesh, Group,
  MeshStandardMaterial, MeshBasicMaterial, PointLight, AmbientLight, Fog, NearestFilter,
} from 'three'
import { SPACING, RAIL_X, getSlot, type Slot, type Shape } from './aisle-data'

// The Endless Aisle: an actual supermarket at closing time. Fluorescent
// fixtures, steel pallet racking stacked past the light, sealed concrete slab.
// The deeper you walk,
// the wronger it gets — lights thin out, the color drifts green, the stock
// gives way to gaps, and something red glows up ahead that you never reach.

const WINDOW_BEHIND = 6
const WINDOW_AHEAD = 24
const MAX_SPEED = 6.5
const ACCEL = 18
const DAMPING = 9

const AISLE_HALF = RAIL_X            // shelf faces sit just outside this
const CEIL_Y = 8.4                   // ~28 ft to the deck, like the real thing
// beam levels of a pallet rack. the bottom one is the pick face you can
// actually reach; everything above it is reserve pallets you cannot.
const BEAM_YS = [0.16, 2.05, 4.05, 6.05]
const PICK_Y = BEAM_YS[0]
const RACK_H = BEAM_YS[BEAM_YS.length - 1] + 1.6   // uprights run past the top beam
const BAY_DEPTH = 1.15               // a pallet is 48in deep. so is the bay.
const FIXTURE_EVERY = 4              // high-bays hang far apart, and high

// ── depth decay ──────────────────────────────────────────────────────────────
const smooth = (a: number, b: number, x: number) => {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
export function zoneAt(idx: number) {
  return {
    flicker: smooth(18, 55, idx),   // lights begin to misbehave
    decay: smooth(55, 105, idx),    // green cast, gaps in stock, skew
    dark: smooth(105, 155, idx),    // most lights dead, red glow ahead
  }
}

const DECK_DECAY = new Color('#8b9184')
const DECK_DARK = new Color('#191b1d')

const FOG_BRIGHT = new Color('#c8ced4')
const FOG_DECAY = new Color('#79876f')
const FOG_DARK = new Color('#0a0807')

// seeded per-slot random, independent of aisle-data's slot rng
function srand(seed: number) {
  let s = (Math.imul(seed + 7, 1597334677) >>> 0) || 1
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822519) >>> 0)
    return s / 4294967296
  }
}

// What a club-store pick face is actually made of. Walk one and the thing you
// notice is how little colour there is: it is a brown building. Everything
// arrives as a corrugated case, the case is the display, and the only colour
// is whatever got printed on one panel of it. So the palette is kraft first,
// and the bright packaging shows up at the rate it really does.
const CARDBOARD = ['#b0855a', '#a67c4e', '#b98f5e', '#9e7343', '#c19a6b', '#8f6a42']
const PRINTED = [
  '#c0392b', '#e0a02a', '#1f6fa8', '#3f8f4a', '#e8e2d4', '#a8541f',
  '#7d3b6b', '#2fa5a0', '#d4562f', '#f0c419', '#4a6fb5', '#8cb83f',
]
// stretch wrap over a pallet is not grey, it is a cloudy near-white
const WRAP = ['#dfe3dd', '#d6dbd6', '#e6e9e2']

// ── canvas-texture text sprites (no troika) ──────────────────────────────────
function makeLabelTexture(lines: { text: string; size: number; color: string }[], bg: string | null, w = 256, h = 128) {
  const cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  const cx = cv.getContext('2d')!
  if (bg) { cx.fillStyle = bg; cx.fillRect(0, 0, w, h) }
  cx.textAlign = 'center'
  cx.textBaseline = 'middle'
  const total = lines.reduce((s, l) => s + l.size * 1.45, 0)
  let y = (h - total) / 2
  for (const l of lines) {
    y += l.size * 0.72
    cx.fillStyle = l.color
    cx.font = `bold ${l.size}px "Arial Narrow", Arial, sans-serif`
    cx.fillText(l.text.slice(0, 30), w / 2, y)
    y += l.size * 0.72
  }
  const tex = new CanvasTexture(cv)
  tex.minFilter = NearestFilter
  return tex
}

function LabelPlane({ lines, bg, width, position, rotation }: {
  lines: { text: string; size: number; color: string }[]
  bg: string | null
  width: number
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  const key = lines.map(l => l.text + l.color).join('|') + bg
  const tex = useMemo(() => makeLabelTexture(lines, bg), [key]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, width / 2]} />
      <meshBasicMaterial map={tex} transparent={!bg} toneMapped={false} />
    </mesh>
  )
}

// ── shelving + stock, instanced over the visible window ─────────────────────
function Shelving({ startIndex, endIndex }: { startIndex: number; endIndex: number }) {
  const structRef = useRef<InstancedMesh>(null)   // green uprights
  const beamRef = useRef<InstancedMesh>(null)     // orange load beams
  const boxRef = useRef<InstancedMesh>(null)
  const canRef = useRef<InstancedMesh>(null)
  const palletRef = useRef<InstancedMesh>(null)

  const STRUCT_MAX = 2 * (WINDOW_AHEAD + WINDOW_BEHIND + 2) * 8
  const PROD_MAX = 2 * (WINDOW_AHEAD + WINDOW_BEHIND + 2) * 10
  const PALLET_MAX = 2 * (WINDOW_AHEAD + WINDOW_BEHIND + 2) * BEAM_YS.length * 3
  const BEAM_MAX = 2 * (WINDOW_AHEAD + WINDOW_BEHIND + 2) * (BEAM_YS.length * 2 + 1)

  useEffect(() => {
    const struct = structRef.current, boxes = boxRef.current, cans = canRef.current
    const pallets = palletRef.current, beams = beamRef.current
    if (!struct || !boxes || !cans || !pallets || !beams) return
    const o = new Object3D()
    const col = new Color()
    let si = 0, bi = 0, ci = 0, pi = 0, bmi = 0

    for (let idx = startIndex; idx <= endIndex; idx++) {
      const z = -idx * SPACING
      const zone = zoneAt(idx)
      // déjà-vu bands: stretches where every slot stocks the exact same
      // shelves, the same way, again and again
      const dejavu = (idx >= 72 && idx <= 80) || (idx >= 132 && idx <= 144)
      for (const side of [-1, 1]) {
        const rnd = srand(dejavu ? 4242 + (side + 1) / 2 : idx * 2 + (side + 1) / 2)
        const faceX = side * (AISLE_HALF + 0.1)
        const midX = side * (AISLE_HALF + 0.1 + BAY_DEPTH / 2)

        // four narrow uprights per bay — front and back of the depth, at both
        // ends of the bay. Open frame: you can see through the rack, and the
        // pallets read as objects sitting on it rather than a painted wall.
        o.rotation.set(0, 0, 0)
        for (const dz of [-SPACING / 2, SPACING / 2]) {
          for (const dx of [-BAY_DEPTH / 2 + 0.08, BAY_DEPTH / 2 - 0.08]) {
            o.position.set(midX + side * dx, RACK_H / 2, z + dz)
            o.scale.set(0.12, RACK_H, 0.12)
            o.updateMatrix()
            struct.setMatrixAt(si++, o.matrix)
          }
          // diagonal brace between the pair, low down where you'd actually see it
          o.position.set(midX, 1.05, z + dz)
          o.scale.set(BAY_DEPTH - 0.2, 0.05, 0.05)
          o.updateMatrix()
          struct.setMatrixAt(si++, o.matrix)
        }
        // load beams: a pair front and back at every level above the floor
        for (let L = 1; L < BEAM_YS.length; L++) {
          for (const dx of [-BAY_DEPTH / 2 + 0.08, BAY_DEPTH / 2 - 0.08]) {
            o.position.set(midX + side * dx, BEAM_YS[L], z)
            o.scale.set(0.1, 0.17, SPACING)
            o.updateMatrix()
            beams.setMatrixAt(bmi++, o.matrix)
          }
        }
        // wire deck on the pick level
        o.position.set(midX, PICK_Y, z)
        o.scale.set(BAY_DEPTH, 0.05, SPACING * 0.98)
        o.updateMatrix()
        beams.setMatrixAt(bmi++, o.matrix)

        // ── pick face: packed, two cases high, floor to beam ──
        // A warehouse club pick face has no air in it. Cases butt against each
        // other across the full bay and stack until they run out of headroom.
        const COLS_N = 4
        const caseW = SPACING / COLS_N
        for (let p = 0; p < COLS_N; p++) {
          const gap = rnd() < 0.05 + zone.decay * 0.45 + zone.dark * 0.45
          if (gap) continue
          const stack = rnd() < 0.62 ? 2 : 1
          const baseZ = z - SPACING / 2 + (p + 0.5) * caseW
          // one colour per column: a column is one product, as it would be.
          // Two cases in three are bare corrugated — that ratio is the whole
          // reason a real club store reads brown from the end of the aisle.
          col.set(rnd() < 0.66
            ? CARDBOARD[Math.floor(rnd() * CARDBOARD.length)]
            : PRINTED[Math.floor(rnd() * PRINTED.length)])
          col.lerp(new Color('#4a4a48'), zone.decay * 0.45 + zone.dark * 0.35)
          const isCan = rnd() < 0.18
          for (let lvl = 0; lvl < stack; lvl++) {
            const bh = 0.42 + rnd() * 0.1
            const y = PICK_Y + 0.04 + bh / 2 + lvl * (bh + 0.015)
            const skew = (rnd() - 0.5) * zone.decay * 0.3
            const px = faceX + side * (BAY_DEPTH * 0.44)
            if (isCan) {
              o.position.set(px, y, baseZ)
              o.rotation.set(0, rnd() * Math.PI, skew)
              o.scale.set(1.7, bh / 0.2, 1.7)
              o.updateMatrix()
              cans.setMatrixAt(ci, o.matrix); cans.setColorAt(ci, col); ci++
            } else {
              o.position.set(px, y, baseZ)
              o.rotation.set(0, (rnd() - 0.5) * 0.08, skew)
              o.scale.set((BAY_DEPTH * 0.8) / 0.2, bh / 0.2, (caseW * 0.94) / 0.2)
              o.updateMatrix()
              boxes.setMatrixAt(bi, o.matrix); boxes.setColorAt(bi, col); bi++
            }
          }
        }

        // ── reserve: shrink-wrapped pallets on the beam levels overhead ──
        // These are the ones you are not meant to reach. They are simply
        // stored above you, and they go up further than the light does.
        for (let L = 1; L < BEAM_YS.length; L++) {
          const stocked = rnd() > 0.14 + zone.decay * 0.34 + zone.dark * 0.4
          if (!stocked) continue
          // two case stacks side by side on the pallet, like the real thing —
          // printed cardboard most of the time, stretch-wrapped grey sometimes
          const wrapped = rnd() < 0.68
          for (const half of [-1, 1]) {
            if (rnd() < 0.12) continue          // a gap where one got pulled
            const ph = 0.8 + rnd() * 0.5
            o.position.set(
              midX,
              BEAM_YS[L] + 0.09 + ph / 2,
              z + half * SPACING * 0.23 + (rnd() - 0.5) * 0.06,
            )
            o.rotation.set(0, (rnd() - 0.5) * 0.05, 0)
            o.scale.set(BAY_DEPTH * 0.82, ph, SPACING * 0.4)
            o.updateMatrix()
            col.set(wrapped
              ? WRAP[Math.floor(rnd() * WRAP.length)]
              : CARDBOARD[Math.floor(rnd() * CARDBOARD.length)])
            col.lerp(new Color('#4a4a4d'), zone.decay * 0.38 + zone.dark * 0.5)
            pallets.setMatrixAt(pi, o.matrix); pallets.setColorAt(pi, col); pi++
          }
          // the wooden pallet they sit on
          o.position.set(midX, BEAM_YS[L] + 0.045, z)
          o.scale.set(BAY_DEPTH * 0.86, 0.09, SPACING * 0.9)
          o.updateMatrix()
          col.set('#8a6c45')
          col.lerp(new Color('#3b3630'), zone.decay * 0.4 + zone.dark * 0.5)
          pallets.setMatrixAt(pi, o.matrix); pallets.setColorAt(pi, col); pi++
        }
      }
    }

    // park unused instances out of sight
    o.position.set(0, -100, 0); o.scale.set(0.001, 0.001, 0.001); o.updateMatrix()
    for (let i = si; i < STRUCT_MAX; i++) struct.setMatrixAt(i, o.matrix)
    for (let i = bi; i < PROD_MAX; i++) boxes.setMatrixAt(i, o.matrix)
    for (let i = ci; i < PROD_MAX; i++) cans.setMatrixAt(i, o.matrix)
    for (let i = pi; i < PALLET_MAX; i++) pallets.setMatrixAt(i, o.matrix)
    for (let i = bmi; i < BEAM_MAX; i++) beams.setMatrixAt(i, o.matrix)
    struct.instanceMatrix.needsUpdate = true
    boxes.instanceMatrix.needsUpdate = true
    cans.instanceMatrix.needsUpdate = true
    pallets.instanceMatrix.needsUpdate = true
    beams.instanceMatrix.needsUpdate = true
    if (boxes.instanceColor) boxes.instanceColor.needsUpdate = true
    if (cans.instanceColor) cans.instanceColor.needsUpdate = true
    if (pallets.instanceColor) pallets.instanceColor.needsUpdate = true
  }, [startIndex, endIndex, STRUCT_MAX, PROD_MAX, PALLET_MAX, BEAM_MAX])

  return (
    <>
      {/* uprights: the dark green perforated columns */}
      <instancedMesh ref={structRef} args={[undefined, undefined, STRUCT_MAX]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2f5b46" roughness={0.62} metalness={0.35} />
      </instancedMesh>
      {/* load beams: safety orange, the single most recognisable thing in here */}
      <instancedMesh ref={beamRef} args={[undefined, undefined, BEAM_MAX]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#d4560f" roughness={0.5} metalness={0.28} />
      </instancedMesh>
      <instancedMesh ref={boxRef} args={[undefined, undefined, PROD_MAX]} frustumCulled={false}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial roughness={0.85} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={canRef} args={[undefined, undefined, PROD_MAX]} frustumCulled={false}>
        <cylinderGeometry args={[0.055, 0.055, 0.2, 10]} />
        <meshStandardMaterial roughness={0.4} metalness={0.6} />
      </instancedMesh>
      {/* reserve pallets, stretch-wrapped */}
      <instancedMesh ref={palletRef} args={[undefined, undefined, PALLET_MAX]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.72} metalness={0.05} />
      </instancedMesh>
    </>
  )
}

// ── featured items: the real stock, on eye-level display ────────────────────
function shapeGeometry(shape: Shape) {
  switch (shape) {
    case 'box': return <boxGeometry args={[0.34, 0.34, 0.34]} />
    case 'sphere': return <sphereGeometry args={[0.22, 16, 16]} />
    case 'cone': return <coneGeometry args={[0.22, 0.42, 10]} />
    case 'cylinder': return <cylinderGeometry args={[0.17, 0.17, 0.38, 12]} />
    case 'torus': return <torusGeometry args={[0.18, 0.075, 10, 20]} />
    case 'octahedron': return <octahedronGeometry args={[0.26, 0]} />
  }
}

function FeaturedItem({ slot }: { slot: Slot }) {
  const side = slot.index % 2 === 0 ? 1 : -1
  const z = -slot.index * SPACING
  const x = side * (AISLE_HALF - 0.35)
  const glows = slot.kind === 'gem' || slot.kind === 'special'
  const tagColor = slot.kind === 'gem' ? '#F472B6' : slot.kind === 'special' ? '#F6C66A' : '#111111'
  const tagBg = slot.kind === 'gem' ? '#2a0d1d' : slot.kind === 'special' ? '#2a2008' : '#f2efe6'
  const spin = useRef<Mesh>(null)
  useFrame((state) => {
    if (spin.current && glows) spin.current.rotation.y = state.clock.elapsedTime * 0.6
  })
  if (slot.kind === 'junk') return null
  return (
    <group position={[x, 0, z]}>
      {/* display pedestal */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 1.0, 0.5]} />
        <meshStandardMaterial color={glows ? '#2a2530' : '#d8d3c8'} roughness={0.85} />
      </mesh>
      <mesh ref={spin} position={[0, 1.25, 0]} rotation={slot.rotation} scale={slot.scale * 0.9}>
        {shapeGeometry(slot.shape)}
        <meshStandardMaterial
          color={slot.color}
          emissive={slot.color}
          emissiveIntensity={glows ? 0.6 : 0.1}
          roughness={0.5}
          metalness={0.15}
        />
      </mesh>
      {glows && <pointLight position={[0, 1.4, 0.5]} color={slot.color} intensity={3} distance={3} />}
      {/* shelf tag — angled toward the walker coming up the aisle */}
      <LabelPlane
        lines={[
          { text: slot.kind === 'gem' ? '★' : slot.label, size: slot.kind === 'gem' ? 44 : 26, color: tagColor },
          ...(slot.price ? [{ text: slot.price, size: 20, color: slot.kind === 'special' ? '#F6C66A' : tagColor }] : []),
        ]}
        bg={tagBg}
        width={0.62}
        position={[side * -0.2, 0.8, 0.3]}
        rotation={[0, -side * Math.PI / 4, 0]}
      />
    </group>
  )
}

// ── ceiling fixtures ─────────────────────────────────────────────────────────
function Fixture({ index }: { index: number }) {
  const matRef = useRef<MeshStandardMaterial>(null)
  const zone = zoneAt(index)
  const rnd = srand(index * 31 + 5)
  const deadRoll = rnd()
  const dead = deadRoll < zone.flicker * 0.12 + zone.dark * 0.72
  const flickery = !dead && rnd() < 0.2 + zone.flicker * 0.5
  const phase = rnd() * 100
  useFrame((state) => {
    const m = matRef.current
    if (!m) return
    // fixtures you have already passed power down behind you — the store
    // does not stay lit for people who are done with it
    const camIdx = Math.max(0, -state.camera.position.z / SPACING)
    const behind = index < camIdx - 2.5
    let target: number
    if (dead) target = 0.02
    else {
      let v = 1
      if (flickery) {
        const t = state.clock.elapsedTime * 14 + phase
        v = Math.sin(t) * Math.sin(t * 3.7) > -0.2 ? 1 : 0.16
        if (Math.sin(t * 0.31) > 0.9) v = 0.04                                 // long dead spells
        if (Math.sin(t * 2.3 + phase) * Math.sin(t * 7.1) > 0.72) v = 1.7      // fluorescent surge
      }
      target = v * (1.4 - zone.decay * 0.4)
    }
    if (behind) target = 0.04
    // slow lerp so lights visibly die off rather than snap
    m.emissiveIntensity += (target - m.emissiveIntensity) * (behind ? 0.06 : 0.5)
  })
  // fluorescent drifts green as the aisle decays
  const tube = zone.decay > 0.4 ? '#d8f0d0' : '#eef4ff'
  return (
    <group position={[0, CEIL_Y - zone.dark * 0.45, -index * SPACING]}>
      {/* the lit face of a high-bay, pointing straight down at the concrete */}
      <mesh>
        <boxGeometry args={[1.15, 0.09, 1.15]} />
        <meshStandardMaterial ref={matRef} color="#20242a" emissive={tube} emissiveIntensity={1.2} />
      </mesh>
      {/* reflector housing */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[1.3, 0.24, 1.3]} />
        <meshStandardMaterial color="#3a3f45" roughness={0.55} metalness={0.6} />
      </mesh>
      {/* the drop rod up into the dark */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.05, 1.3, 0.05]} />
        <meshStandardMaterial color="#2b3036" roughness={0.7} metalness={0.5} />
      </mesh>
    </group>
  )
}

// ── overhead aisle signs ─────────────────────────────────────────────────────
const AISLE_NAMES = [
  ['AISLE 14', 'EVERYTHING ELSE'],
  ['AISLE 14', 'SEASONAL · PERMANENT'],
  ['AISLE 14B', 'MISC (CONT.)'],
  ['AISLE 14', 'AGAIN'],
  ['AISLE 14 OF 14', 'KEEP WALKING'],
  ['AISLE ∞', ''],
]
function AisleSign({ n }: { n: number }) {
  const idx = n * 22 + 10
  const tier = Math.min(AISLE_NAMES.length - 1, Math.floor(idx / 40))
  const [title, sub] = AISLE_NAMES[tier]
  const dark = zoneAt(idx).dark
  return (
    <group position={[0, 2.72, -idx * SPACING]}>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.04, 0.5, 0.02]} />
        <meshStandardMaterial color="#555a60" />
      </mesh>
      <LabelPlane
        lines={[
          { text: title, size: 44, color: dark > 0.4 ? '#7a2018' : '#16181b' },
          ...(sub ? [{ text: sub, size: 20, color: dark > 0.4 ? '#5a1812' : '#585f66' }] : []),
        ]}
        bg={dark > 0.4 ? '#120a08' : '#eceef0'}
        width={1.7}
        position={[0, 0, 0.011]}
      />
      <LabelPlane
        lines={[
          { text: title, size: 44, color: dark > 0.4 ? '#7a2018' : '#16181b' },
          ...(sub ? [{ text: sub, size: 20, color: dark > 0.4 ? '#5a1812' : '#585f66' }] : []),
        ]}
        bg={dark > 0.4 ? '#120a08' : '#eceef0'}
        width={1.7}
        position={[0, 0, -0.011]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  )
}

// ── an abandoned cart, exactly where someone left it ────────────────────────
function Cart({ index, lean }: { index: number; lean: number }) {
  const z = -index * SPACING
  return (
    <group position={[lean * 1.6, 0, z]} rotation={[0, lean * 0.7, 0]}>
      {/* basket */}
      <mesh position={[0, 0.72, 0]} rotation={[0, 0, 0.02]}>
        <boxGeometry args={[0.52, 0.34, 0.8]} />
        <meshStandardMaterial color="#6a7076" roughness={0.35} metalness={0.8} wireframe />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.5, 0.32, 0.78]} />
        <meshStandardMaterial color="#23262a" roughness={0.6} metalness={0.7} transparent opacity={0.35} />
      </mesh>
      {/* frame + handle */}
      <mesh position={[0, 0.35, 0]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color="#6a7076" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.94, 0.42]}>
        <boxGeometry args={[0.52, 0.035, 0.035]} />
        <meshStandardMaterial color="#8a2f28" roughness={0.5} />
      </mesh>
      {[[-0.2, 0.32], [0.2, 0.32], [-0.2, -0.32], [0.2, -0.32]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.06, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.03, 10]} />
          <meshStandardMaterial color="#111214" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ── floor: polished slab concrete, follows the camera ───────────────────────
// A warehouse club floor is not tiled — it's the building's actual slab, ground
// and sealed until it shines, scored with control joints so it cracks where it
// was told to. The scuffs are forklift tires. Nobody buffs this far back.
function Floor() {
  const ref = useRef<Mesh>(null)
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 256; cv.height = 256
    const cx = cv.getContext('2d')!
    cx.fillStyle = '#9a9a97'
    cx.fillRect(0, 0, 256, 256)
    // aggregate mottling — ground concrete is never one flat tone
    for (let i = 0; i < 900; i++) {
      const v = 0.05 + Math.random() * 0.07
      cx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${v})` : `rgba(40,40,44,${v})`
      const r = 1 + Math.random() * 3
      cx.fillRect(Math.random() * 256, Math.random() * 256, r, r)
    }
    // sealer sheen — broad soft streaks along the direction of travel
    for (let i = 0; i < 14; i++) {
      cx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.03})`
      cx.fillRect(Math.random() * 256, 0, 6 + Math.random() * 22, 256)
    }
    // control joints: the saw cuts, one per tile edge
    cx.strokeStyle = 'rgba(45,45,48,0.55)'
    cx.lineWidth = 2
    cx.beginPath()
    cx.moveTo(0, 0); cx.lineTo(256, 0)
    cx.moveTo(0, 128); cx.lineTo(256, 128)
    cx.moveTo(0, 0); cx.lineTo(0, 256)
    cx.moveTo(128, 0); cx.lineTo(128, 256)
    cx.stroke()
    // forklift scuffs
    cx.strokeStyle = 'rgba(30,30,34,0.10)'
    cx.lineWidth = 3
    for (let i = 0; i < 7; i++) {
      cx.beginPath()
      const y = Math.random() * 256
      cx.moveTo(Math.random() * 200, y)
      cx.quadraticCurveTo(128, y + 20, 60 + Math.random() * 190, y + 8)
      cx.stroke()
    }
    const t = new CanvasTexture(cv)
    t.wrapS = t.wrapT = 1000 // RepeatWrapping
    t.repeat.set(3, 30)
    return t
  }, [])
  useFrame(({ camera }) => {
    if (!ref.current) return
    // snap to texture period so the floor never visibly swims
    const period = SPACING * 2
    ref.current.position.z = Math.round(camera.position.z / period) * period
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[9, 160]} />
      <meshStandardMaterial map={tex} roughness={0.32} metalness={0.08} />
    </mesh>
  )
}

// ── the deck ─────────────────────────────────────────────────────────────────
// A club store has no ceiling. It has a roof, and you are looking at the
// underside of it: white steel bar joists on five-foot centres, the red
// sprinkler main running the length of the aisle, and nothing else. Nobody
// covered any of it up, because covering it up costs money and the whole
// building is an argument about money.
const JOIST_EVERY = 1.6
const DECK_SPAN = 70          // metres of joists kept alive around the walker

function Ceiling() {
  const ref = useRef<Group>(null)
  const deckRef = useRef<Mesh>(null)
  const joistRef = useRef<InstancedMesh>(null)
  const JOIST_N = Math.ceil(DECK_SPAN / JOIST_EVERY)

  useEffect(() => {
    const joists = joistRef.current
    if (!joists) return
    const o = new Object3D()
    for (let i = 0; i < JOIST_N; i++) {
      // joists span the aisle crosswise; the deep ones are the girders they
      // frame into, every fifth bay
      const girder = i % 5 === 0
      o.position.set(0, girder ? -0.30 : -0.16, DECK_SPAN / 2 - i * JOIST_EVERY)
      o.scale.set(9, girder ? 0.46 : 0.2, girder ? 0.18 : 0.09)
      o.updateMatrix()
      joists.setMatrixAt(i, o.matrix)
    }
    joists.instanceMatrix.needsUpdate = true
  }, [JOIST_N])

  useFrame(({ camera }) => {
    const g = ref.current
    if (!g) return
    // snap to the joist period so the structure never visibly slides
    g.position.z = Math.round(camera.position.z / JOIST_EVERY) * JOIST_EVERY
    // the roof comes down to meet you, slowly, the deeper you walk
    const idx = Math.max(0, -camera.position.z / SPACING)
    const { decay, dark } = zoneAt(idx)
    g.position.y = CEIL_Y + 0.12 - dark * 0.45
    const deck = deckRef.current
    if (deck) {
      const m = deck.material as MeshStandardMaterial
      m.color.set('#c2c7cc').lerp(DECK_DECAY, decay * 0.55).lerp(DECK_DARK, dark)
    }
  })

  return (
    <group ref={ref} position={[0, CEIL_Y + 0.12, 0]}>
      <mesh ref={deckRef} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, DECK_SPAN * 1.4]} />
        <meshStandardMaterial color="#c2c7cc" roughness={0.95} />
      </mesh>
      <instancedMesh ref={joistRef} args={[undefined, undefined, JOIST_N]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#aeb4b8" roughness={0.72} metalness={0.35} />
      </instancedMesh>
      {/* sprinkler main. It is red because the code says it is red. */}
      <mesh position={[2.15, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, DECK_SPAN * 1.4, 8]} />
        <meshStandardMaterial color="#8e2118" roughness={0.55} metalness={0.3} />
      </mesh>
    </group>
  )
}

// ── skylights ────────────────────────────────────────────────────────────────
// The detail that gives a Costco away before you've read a single sign: the
// building is lit by the sky. Rows of translucent panels down the roof, and on
// a clear afternoon half the fixtures aren't even on, because the sun is doing
// the work for free.
//
// Which is worth having here for one reason. The further you walk, the more of
// them go out — and unlike a dead fixture, a dead skylight means it is no
// longer daytime above this part of the building. The sun runs out before the
// aisle does.
function Skylight({ index }: { index: number }) {
  const ref = useRef<Mesh>(null)
  const zone = zoneAt(index)
  const rnd = srand(index * 977 + 13)
  const shut = rnd() < zone.decay * 0.45 + zone.dark * 0.85
  useFrame(({ camera }) => {
    const idx = Math.max(0, -camera.position.z / SPACING)
    const d = zoneAt(idx).dark
    // daylight is a property of the building, not of this panel — walk into
    // the dark end and every skylight behind you is dimmer too
    const day = shut ? 0.02 : Math.max(0.02, 1 - d * 0.95) * (1 - zone.decay * 0.35)
    const m = ref.current?.material as MeshBasicMaterial | undefined
    if (m) m.opacity = 0.25 + day * 0.75
  })
  return (
    <group position={[0, CEIL_Y + 0.06 - zone.dark * 0.45, -index * SPACING]}>
      {/* the diffuser, hanging just under the deck where you can see it */}
      <mesh ref={ref} position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 3.6]} />
        <meshBasicMaterial color="#eef4fb" transparent opacity={1} toneMapped={false} side={2} />
      </mesh>
      {/* the curb it sits in — a frame around the opening, not a lid over it */}
      {([[0, 1.85, 2.7, 0.22], [0, -1.85, 2.7, 0.22], [1.32, 0, 0.16, 3.9], [-1.32, 0, 0.16, 3.9]] as const)
        .map(([cx, cz, w, d], i) => (
          <mesh key={i} position={[cx, -0.1, cz]}>
            <boxGeometry args={[w, 0.2, d]} />
            <meshStandardMaterial color="#b6bbc0" roughness={0.8} />
          </mesh>
        ))}
    </group>
  )
}

// ── the red thing up ahead ───────────────────────────────────────────────────
function ExitSign() {
  const ref = useRef<Mesh>(null)
  const lightRef = useRef<PointLight>(null)
  const tex = useMemo(() => makeLabelTexture([{ text: 'EXIT', size: 64, color: '#ff2a1a' }], '#0c0503'), [])
  useFrame(({ camera }) => {
    const idx = Math.max(0, -camera.position.z / SPACING)
    const { dark } = zoneAt(idx)
    if (ref.current) {
      ref.current.position.z = camera.position.z - 17
      const m = ref.current.material as MeshStandardMaterial
      m.opacity = dark * 0.95
      m.emissiveIntensity = dark * 1.6
    }
    if (lightRef.current) {
      lightRef.current.position.z = camera.position.z - 16
      lightRef.current.intensity = dark * 2.2
    }
  })
  return (
    <>
      <mesh ref={ref} position={[0, 2.4, -17]}>
        <planeGeometry args={[1.15, 0.575]} />
        <meshStandardMaterial map={tex} transparent opacity={0} emissive="#ff2a1a" emissiveMap={tex} emissiveIntensity={0} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 2.2, -16]} color="#ff2a1a" intensity={0} distance={9} />
    </>
  )
}

// ── someone, far down the aisle, who is gone when the light comes back ───────
function makeFigureTexture() {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128
  const cx = cv.getContext('2d')!
  cx.fillStyle = 'rgba(5,6,7,0.96)'
  cx.beginPath(); cx.arc(32, 24, 10, 0, Math.PI * 2); cx.fill()        // head
  cx.beginPath()                                                       // body
  cx.moveTo(21, 36); cx.lineTo(43, 36); cx.lineTo(39, 118); cx.lineTo(25, 118); cx.closePath(); cx.fill()
  const tex = new CanvasTexture(cv)
  return tex
}
function Figure() {
  const ref = useRef<Mesh>(null)
  const tex = useMemo(() => makeFigureTexture(), [])
  useEffect(() => () => tex.dispose(), [tex])
  const st = useRef({ vis: 0, target: 0, z: -9999, until: 0, next: 10 })
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime
    const idx = Math.max(0, -camera.position.z / SPACING)
    const dark = zoneAt(idx).dark
    const s = st.current
    if (s.target === 0 && t > s.next && dark > 0.12) {
      s.z = camera.position.z - (10 + Math.random() * 7)
      s.target = 1
      s.until = t + 1.3 + Math.random() * 2.4
    }
    if (s.target === 1 && (t > s.until || camera.position.z - s.z < 4.5)) {
      s.target = 0
      s.next = t + 18 + Math.random() * 34
    }
    s.vis += (s.target - s.vis) * (s.target === 1 ? 0.05 : 0.16)
    const m = ref.current
    if (m) {
      m.position.set(0, 1.02, s.z)
      m.visible = s.vis > 0.01 && camera.position.z > s.z
      ;(m.material as MeshBasicMaterial).opacity = s.vis * 0.7 * Math.min(1, dark * 1.4)
    }
  })
  return (
    <mesh ref={ref} visible={false} position={[0, 1.02, -9999]}>
      <planeGeometry args={[0.85, 1.85]} />
      <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

// ── atmosphere: fog / light / background track the walker's depth ────────────
function Atmosphere() {
  const { scene } = useThree()
  const ambientRef = useRef<AmbientLight>(null)
  const p1 = useRef<PointLight>(null)
  const p2 = useRef<PointLight>(null)
  const sun = useRef<PointLight>(null)
  const fogRef = useRef<Fog | null>(null)
  const bg = useRef(new Color())
  // whole-corridor brown-out: every so often the power sags and everything dims
  const brown = useRef({ level: 1, until: 0, next: 4 })
  useEffect(() => {
    fogRef.current = new Fog('#c8ced4', 10, 46)
    scene.fog = fogRef.current
    return () => { scene.fog = null }
  }, [scene])
  useFrame(({ camera, clock }) => {
    const idx = Math.max(0, -camera.position.z / SPACING)
    const { flicker, decay, dark } = zoneAt(idx)
    const t = clock.elapsedTime

    // brown-out scheduler — more frequent and deeper the further in you are
    const b = brown.current
    if (t > b.next) {
      b.until = t + 0.25 + Math.random() * (0.9 + dark)
      b.next = t + (6 - dark * 3) + Math.random() * (7 - dark * 4)
    }
    if (t < b.until) {
      // flickering sag while it lasts, sometimes near-total
      const s = 0.18 + Math.abs(Math.sin(t * 33)) * 0.4
      b.level += (s - b.level) * 0.4
    } else {
      b.level += (1 - b.level) * 0.15
    }
    const bl = b.level

    const fog = fogRef.current
    if (fog) {
      fog.color.copy(FOG_BRIGHT).lerp(FOG_DECAY, decay).lerp(FOG_DARK, dark)
      fog.near = 10 - dark * 7
      fog.far = 46 - decay * 12 - dark * 22
      bg.current.copy(fog.color).multiplyScalar(0.55 + bl * 0.45)
      scene.background = bg.current
    }
    if (ambientRef.current) ambientRef.current.intensity = (1.55 - decay * 0.62 - dark * 0.92) * (0.4 + bl * 0.6)
    // two pooled lights ride along near the closest fixtures
    const flickMul = flicker > 0.05 && Math.sin(t * 17.3) * Math.sin(t * 5.1) < -0.75 ? 0.28 : 1
    const zBase = Math.round(camera.position.z / (SPACING * FIXTURE_EVERY)) * SPACING * FIXTURE_EVERY
    if (p1.current) {
      p1.current.position.set(0, CEIL_Y - 0.3, zBase - SPACING)
      p1.current.intensity = (5.2 - decay * 1.9 - dark * 4.2) * flickMul * bl
      p1.current.color.set(decay > 0.4 ? '#cfe8c4' : '#eef2f5')
    }
    if (p2.current) {
      p2.current.position.set(0, CEIL_Y - 0.3, zBase - SPACING * (FIXTURE_EVERY + 1))
      p2.current.intensity = (4.0 - decay * 1.5 - dark * 3.3) * bl
      p2.current.color.set(decay > 0.4 ? '#cfe8c4' : '#eef2f5')
    }
    // daylight: one pool riding the nearest skylight. A light per panel would
    // put eight more into every shader in the scene for the same picture.
    // It does not brown out with the rest — the sun is not on the store's
    // electrical, which is exactly why losing it later reads as worse.
    if (sun.current) {
      sun.current.position.set(0, CEIL_Y - 0.6, zBase - SPACING * (FIXTURE_EVERY / 2))
      sun.current.intensity = Math.max(0, 4.6 - decay * 1.8 - dark * 4.6)
    }
  })
  return (
    <>
      <ambientLight ref={ambientRef} intensity={1.55} color="#e6ebf0" />
      <hemisphereLight args={['#f2f6f9', '#4a463c', 0.7]} />
      <pointLight ref={p1} intensity={5.2} distance={22} decay={1.35} />
      <pointLight ref={p2} intensity={4.0} distance={22} decay={1.35} />
      <pointLight ref={sun} color="#e4edf8" intensity={4.6} distance={20} decay={1.25} />
    </>
  )
}

// ── movement ─────────────────────────────────────────────────────────────────
function Rig({ onDistance }: { onDistance: (d: number) => void }) {
  const { camera } = useThree()
  const distanceRef = useRef(0)
  const velocityRef = useRef(0)
  const keysRef = useRef<Record<string, boolean>>({})
  const bobRef = useRef(0)
  const lookRef = useRef({ x: 0, y: 0 })  // pointer, -1..1
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const backRef = useRef(false)           // holding shift: look behind you

  useEffect(() => {
    camera.rotation.set(0, 0, 0)
    camera.rotation.order = 'YXZ'
  }, [camera])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true
      if (e.key === 'Shift') backRef.current = true
    }
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false
      if (e.key === 'Shift') backRef.current = false
    }
    const wheel = (e: WheelEvent) => {
      velocityRef.current = MathUtils.clamp(velocityRef.current + e.deltaY * 0.012, -MAX_SPEED, MAX_SPEED)
    }
    const move = (e: PointerEvent) => {
      lookRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      lookRef.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('wheel', wheel, { passive: true })
    window.addEventListener('pointermove', move)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('pointermove', move)
    }
  }, [])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const k = keysRef.current
    const forward = (k['w'] || k['arrowup']) ? 1 : 0
    const backward = (k['s'] || k['arrowdown']) ? 1 : 0
    const input = forward - backward

    if (input !== 0) {
      velocityRef.current = MathUtils.clamp(velocityRef.current + input * ACCEL * delta, -MAX_SPEED, MAX_SPEED)
    } else {
      velocityRef.current *= Math.max(0, 1 - DAMPING * delta)
    }

    distanceRef.current += velocityRef.current * delta
    if (distanceRef.current < 0) {
      distanceRef.current = 0
      velocityRef.current = 0
    }

    const speedFrac = Math.abs(velocityRef.current) / MAX_SPEED
    bobRef.current += delta * (1.4 + speedFrac * 3)
    const bobAmt = speedFrac * 0.045

    camera.position.z = -distanceRef.current
    camera.position.y = 1.55 + Math.sin(bobRef.current * 2) * bobAmt
    camera.position.x = Math.sin(bobRef.current) * bobAmt * 0.5

    // head: drifts toward the cursor; shift turns you all the way around,
    // slowly, like you're not sure you want to see
    const targetYaw = backRef.current ? Math.PI + lookRef.current.x * 0.22 : -lookRef.current.x * 0.22
    const targetPitch = -lookRef.current.y * 0.12
    const turnSpeed = backRef.current ? 2.2 : 4.5
    yawRef.current += (targetYaw - yawRef.current) * Math.min(1, delta * turnSpeed)
    pitchRef.current += (targetPitch - pitchRef.current) * Math.min(1, delta * 5)
    camera.rotation.y = yawRef.current
    camera.rotation.x = pitchRef.current
    camera.rotation.z = -Math.sin(bobRef.current) * bobAmt * 0.4

    onDistance(distanceRef.current)
  })

  return null
}

// ── the visible window of the world ──────────────────────────────────────────
function SlotWindow() {
  const { camera } = useThree()
  const [centerIndex, setCenterIndex] = useState(0)
  useFrame(() => {
    const idx = Math.max(0, Math.round(-camera.position.z / SPACING))
    if (idx !== centerIndex) setCenterIndex(idx)
  })
  const start = Math.max(0, centerIndex - WINDOW_BEHIND)
  const end = centerIndex + WINDOW_AHEAD

  const featured = useMemo(() => {
    const arr: Slot[] = []
    for (let i = start; i <= end; i++) {
      const s = getSlot(i)
      if (s.kind !== 'junk') arr.push(s)
    }
    return arr
  }, [start, end])

  const fixtures = useMemo(() => {
    const arr: number[] = []
    const f0 = Math.max(0, Math.floor(start / FIXTURE_EVERY) * FIXTURE_EVERY)
    for (let i = f0; i <= end; i += FIXTURE_EVERY) arr.push(i)
    return arr
  }, [start, end])

  // skylights sit halfway between the fixtures, so the aisle alternates
  // lamp, sky, lamp, sky the way a real roof grid does
  const skylights = useMemo(() => {
    const arr: number[] = []
    const half = Math.floor(FIXTURE_EVERY / 2)
    const f0 = Math.max(0, Math.floor(start / FIXTURE_EVERY) * FIXTURE_EVERY)
    for (let i = f0 + half; i <= end; i += FIXTURE_EVERY) arr.push(i)
    return arr
  }, [start, end])

  const signs = useMemo(() => {
    const arr: number[] = []
    for (let n = 0; n < 40; n++) {
      const idx = n * 22 + 10
      if (idx >= start - 2 && idx <= end + 2) arr.push(n)
    }
    return arr
  }, [start, end])

  const carts = useMemo(() => [37, 89, 141, 203].filter(i => i >= start - 2 && i <= end + 2), [start, end])

  return (
    <>
      <Shelving startIndex={start} endIndex={end} />
      {featured.map(s => <FeaturedItem key={s.index} slot={s} />)}
      {fixtures.map(i => <Fixture key={i} index={i} />)}
      {skylights.map(i => <Skylight key={i} index={i} />)}
      {signs.map(n => <AisleSign key={n} n={n} />)}
      {carts.map((i, k) => <Cart key={i} index={i} lean={k % 2 === 0 ? 1 : -1} />)}
    </>
  )
}

function Scene({ onCenterIndexChange }: { onCenterIndexChange: (i: number) => void }) {
  const lastIndexRef = useRef(-1)
  const handleDistance = useCallback((d: number) => {
    const idx = Math.round(d / SPACING)
    if (idx !== lastIndexRef.current) {
      lastIndexRef.current = idx
      onCenterIndexChange(idx)
    }
  }, [onCenterIndexChange])

  return (
    <>
      <Atmosphere />
      <Rig onDistance={handleDistance} />
      <Floor />
      <Ceiling />
      <ExitSign />
      <Figure />
      <SlotWindow />
    </>
  )
}

export default function AisleCanvas({ onCenterIndexChange }: { onCenterIndexChange: (i: number) => void }) {
  return (
    <Canvas
      camera={{ position: [0, 1.55, 0], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene onCenterIndexChange={onCenterIndexChange} />
    </Canvas>
  )
}
