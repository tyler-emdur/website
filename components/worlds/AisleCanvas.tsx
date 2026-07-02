'use client'
import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  MathUtils, Object3D, Color, InstancedMesh, CanvasTexture, Mesh,
  MeshStandardMaterial, MeshBasicMaterial, PointLight, AmbientLight, Fog, NearestFilter,
} from 'three'
import { SPACING, RAIL_X, getSlot, type Slot, type Shape } from './aisle-data'

// The Endless Aisle: an actual supermarket at closing time. Fluorescent
// fixtures, stocked gondola shelving, checkered linoleum. The deeper you walk,
// the wronger it gets — lights thin out, the color drifts green, the stock
// gives way to gaps, and something red glows up ahead that you never reach.

const WINDOW_BEHIND = 3
const WINDOW_AHEAD = 24
const MAX_SPEED = 6.5
const ACCEL = 18
const DAMPING = 9

const AISLE_HALF = RAIL_X            // shelf faces sit just outside this
const CEIL_Y = 3.3
const SHELF_YS = [0.38, 1.02, 1.66, 2.3]
const SHELF_DEPTH = 0.55
const FIXTURE_EVERY = 2              // ceiling light every N slots

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

const FOG_BRIGHT = new Color('#b9bfc6')
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

// muted retail packaging palette — grocery, not neon
const PRODUCT_COLORS = ['#b33a2e', '#d9a441', '#2e6b8a', '#3f7a4a', '#d8d3c8', '#8a5a34', '#6d3f4e', '#c96f3a']

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
  const structRef = useRef<InstancedMesh>(null)
  const boxRef = useRef<InstancedMesh>(null)
  const canRef = useRef<InstancedMesh>(null)

  const STRUCT_MAX = 2 * (WINDOW_AHEAD + WINDOW_BEHIND + 2) * 7
  const PROD_MAX = 2 * (WINDOW_AHEAD + WINDOW_BEHIND + 2) * SHELF_YS.length * 5

  useEffect(() => {
    const struct = structRef.current, boxes = boxRef.current, cans = canRef.current
    if (!struct || !boxes || !cans) return
    const o = new Object3D()
    const col = new Color()
    let si = 0, bi = 0, ci = 0

    for (let idx = startIndex; idx <= endIndex; idx++) {
      const z = -idx * SPACING
      const zone = zoneAt(idx)
      for (const side of [-1, 1]) {
        const rnd = srand(idx * 2 + (side + 1) / 2)
        const faceX = side * (AISLE_HALF + 0.1)
        const backX = side * (AISLE_HALF + 0.1 + SHELF_DEPTH)

        // back panel
        o.position.set(backX, 1.45, z)
        o.rotation.set(0, 0, 0)
        o.scale.set(0.06, 2.9, SPACING)
        o.updateMatrix()
        struct.setMatrixAt(si++, o.matrix)
        // upright at slot boundary
        o.position.set(side * (AISLE_HALF + 0.1 + SHELF_DEPTH / 2), 1.45, z - SPACING / 2)
        o.scale.set(SHELF_DEPTH, 2.9, 0.05)
        o.updateMatrix()
        struct.setMatrixAt(si++, o.matrix)
        // boards
        for (const sy of SHELF_YS) {
          o.position.set(side * (AISLE_HALF + 0.1 + SHELF_DEPTH / 2), sy, z)
          o.scale.set(SHELF_DEPTH, 0.045, SPACING * 0.98)
          o.updateMatrix()
          struct.setMatrixAt(si++, o.matrix)
        }
        // kick base
        o.position.set(side * (AISLE_HALF + 0.1 + SHELF_DEPTH / 2), 0.09, z)
        o.scale.set(SHELF_DEPTH, 0.18, SPACING)
        o.updateMatrix()
        struct.setMatrixAt(si++, o.matrix)

        // stock: rows of boxes and cans per shelf, thinning with depth
        for (let s = 0; s < SHELF_YS.length; s++) {
          const sy = SHELF_YS[s]
          const n = 3 + Math.floor(rnd() * 3)
          for (let p = 0; p < n; p++) {
            const present = rnd() > 0.08 + zone.decay * 0.45 + zone.dark * 0.4
            if (!present) continue
            const isCan = rnd() < 0.35
            const px = side * (AISLE_HALF + 0.16 + rnd() * (SHELF_DEPTH - 0.3))
            const pz = z - SPACING / 2 + (p + 0.5) * (SPACING / n) + (rnd() - 0.5) * 0.1
            const skew = (rnd() - 0.5) * zone.decay * 0.5
            col.set(PRODUCT_COLORS[Math.floor(rnd() * PRODUCT_COLORS.length)])
            // stock greys out as the aisle decays
            col.lerp(new Color('#4a4a48'), zone.decay * 0.45 + zone.dark * 0.3)
            if (isCan) {
              const ch = 0.16 + rnd() * 0.1
              o.position.set(px, sy + ch / 2 + 0.025, pz)
              o.rotation.set(skew * 0.4, rnd() * Math.PI, skew)
              o.scale.set(1, ch / 0.2, 1)
              o.updateMatrix()
              cans.setMatrixAt(ci, o.matrix)
              cans.setColorAt(ci, col)
              ci++
            } else {
              const bw = 0.14 + rnd() * 0.14
              const bh = 0.2 + rnd() * 0.22
              o.position.set(px, sy + bh / 2 + 0.025, pz)
              o.rotation.set(0, (rnd() - 0.5) * 0.4, skew)
              o.scale.set(bw / 0.2, bh / 0.2, (0.1 + rnd() * 0.1) / 0.2)
              o.updateMatrix()
              boxes.setMatrixAt(bi, o.matrix)
              boxes.setColorAt(bi, col)
              bi++
            }
          }
        }
      }
    }
    // park unused instances out of sight
    o.position.set(0, -100, 0); o.scale.set(0.001, 0.001, 0.001); o.updateMatrix()
    for (let i = si; i < STRUCT_MAX; i++) struct.setMatrixAt(i, o.matrix)
    for (let i = bi; i < PROD_MAX; i++) boxes.setMatrixAt(i, o.matrix)
    for (let i = ci; i < PROD_MAX; i++) cans.setMatrixAt(i, o.matrix)
    struct.instanceMatrix.needsUpdate = true
    boxes.instanceMatrix.needsUpdate = true
    cans.instanceMatrix.needsUpdate = true
    if (boxes.instanceColor) boxes.instanceColor.needsUpdate = true
    if (cans.instanceColor) cans.instanceColor.needsUpdate = true
  }, [startIndex, endIndex, STRUCT_MAX, PROD_MAX])

  return (
    <>
      <instancedMesh ref={structRef} args={[undefined, undefined, STRUCT_MAX]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8d9296" roughness={0.7} metalness={0.35} />
      </instancedMesh>
      <instancedMesh ref={boxRef} args={[undefined, undefined, PROD_MAX]} frustumCulled={false}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial roughness={0.85} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={canRef} args={[undefined, undefined, PROD_MAX]} frustumCulled={false}>
        <cylinderGeometry args={[0.055, 0.055, 0.2, 10]} />
        <meshStandardMaterial roughness={0.4} metalness={0.6} />
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
    if (dead) { m.emissiveIntensity = 0.02; return }
    let v = 1
    if (flickery) {
      const t = state.clock.elapsedTime * 14 + phase
      v = Math.sin(t) * Math.sin(t * 3.7) > -0.2 ? 1 : 0.16
      if (Math.sin(t * 0.31) > 0.9) v = 0.04                                 // long dead spells
      if (Math.sin(t * 2.3 + phase) * Math.sin(t * 7.1) > 0.72) v = 1.7      // fluorescent surge
    }
    m.emissiveIntensity = v * (1.4 - zone.decay * 0.4)
  })
  // fluorescent drifts green as the aisle decays
  const tube = zone.decay > 0.4 ? '#d8f0d0' : '#f2f6f8'
  return (
    <group position={[0, CEIL_Y, -index * SPACING]}>
      <mesh>
        <boxGeometry args={[1.7, 0.07, 0.42]} />
        <meshStandardMaterial ref={matRef} color="#20242a" emissive={tube} emissiveIntensity={1.2} />
      </mesh>
      {/* housing */}
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[1.85, 0.08, 0.55]} />
        <meshStandardMaterial color="#3a3f45" roughness={0.6} metalness={0.5} />
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
          { text: title, size: 44, color: dark > 0.4 ? '#7a2018' : '#f2efe6' },
          ...(sub ? [{ text: sub, size: 20, color: dark > 0.4 ? '#5a1812' : '#c9d2d8' }] : []),
        ]}
        bg={dark > 0.4 ? '#120a08' : '#1e4d3a'}
        width={1.7}
        position={[0, 0, 0.011]}
      />
      <LabelPlane
        lines={[
          { text: title, size: 44, color: dark > 0.4 ? '#7a2018' : '#f2efe6' },
          ...(sub ? [{ text: sub, size: 20, color: dark > 0.4 ? '#5a1812' : '#c9d2d8' }] : []),
        ]}
        bg={dark > 0.4 ? '#120a08' : '#1e4d3a'}
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

// ── floor: checkered linoleum, follows the camera ───────────────────────────
function Floor() {
  const ref = useRef<Mesh>(null)
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 256; cv.height = 256
    const cx = cv.getContext('2d')!
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const even = (x + y) % 2 === 0
      cx.fillStyle = even ? '#c9c4b6' : '#a8a396'
      cx.fillRect(x * 64, y * 64, 64, 64)
      // grime
      cx.fillStyle = 'rgba(60,55,45,0.08)'
      for (let g = 0; g < 5; g++) cx.fillRect(x * 64 + (g * 13) % 60, y * 64 + (g * 29) % 60, 8, 8)
    }
    const t = new CanvasTexture(cv)
    t.wrapS = t.wrapT = 1000 // RepeatWrapping
    t.repeat.set(6, 60)
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
      <meshStandardMaterial map={tex} roughness={0.55} metalness={0.05} />
    </mesh>
  )
}

function Ceiling() {
  const ref = useRef<Mesh>(null)
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.z = camera.position.z
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL_Y + 0.12, 0]}>
      <planeGeometry args={[9, 160]} />
      <meshStandardMaterial color="#2b2e33" roughness={0.95} />
    </mesh>
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
  const fogRef = useRef<Fog | null>(null)
  const bg = useRef(new Color())
  // whole-corridor brown-out: every so often the power sags and everything dims
  const brown = useRef({ level: 1, until: 0, next: 4 })
  useEffect(() => {
    fogRef.current = new Fog('#b9bfc6', 6, 26)
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
      fog.near = 6 - dark * 3.5
      fog.far = 26 - decay * 6 - dark * 9
      bg.current.copy(fog.color).multiplyScalar(0.55 + bl * 0.45)
      scene.background = bg.current
    }
    if (ambientRef.current) ambientRef.current.intensity = (0.85 - decay * 0.3 - dark * 0.42) * (0.4 + bl * 0.6)
    // two pooled lights ride along near the closest fixtures
    const flickMul = flicker > 0.05 && Math.sin(t * 17.3) * Math.sin(t * 5.1) < -0.75 ? 0.28 : 1
    const zBase = Math.round(camera.position.z / (SPACING * FIXTURE_EVERY)) * SPACING * FIXTURE_EVERY
    if (p1.current) {
      p1.current.position.set(0, CEIL_Y - 0.3, zBase - SPACING)
      p1.current.intensity = (2.4 - decay * 0.8 - dark * 1.9) * flickMul * bl
      p1.current.color.set(decay > 0.4 ? '#cfe8c4' : '#eef2f5')
    }
    if (p2.current) {
      p2.current.position.set(0, CEIL_Y - 0.3, zBase - SPACING * (FIXTURE_EVERY + 1))
      p2.current.intensity = (1.8 - decay * 0.6 - dark * 1.5) * bl
      p2.current.color.set(decay > 0.4 ? '#cfe8c4' : '#eef2f5')
    }
  })
  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.85} color="#dfe4e8" />
      <hemisphereLight args={['#e8ecef', '#3a3830', 0.35]} />
      <pointLight ref={p1} intensity={2.4} distance={12} decay={1.6} />
      <pointLight ref={p2} intensity={1.8} distance={12} decay={1.6} />
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

  useEffect(() => {
    camera.rotation.set(0, 0, 0)
  }, [camera])

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true }
    const up = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false }
    const wheel = (e: WheelEvent) => {
      velocityRef.current = MathUtils.clamp(velocityRef.current + e.deltaY * 0.012, -MAX_SPEED, MAX_SPEED)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('wheel', wheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('wheel', wheel)
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
    camera.rotation.x = 0
    camera.rotation.y = 0
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
