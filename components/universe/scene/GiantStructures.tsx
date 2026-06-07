'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points } from 'three'

// ─── ANCIENT RING ─────────────────────────────────────────────────────────
// Positioned upper-right, radius > viewport at default zoom — partially off-screen

function AncientRing() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * 0.0018
  })
  return (
    <mesh ref={ref} position={[600, 700, -500]} rotation={[0.28, 0.12, 0.65]}>
      <torusGeometry args={[1240, 9, 5, 180]} />
      <meshBasicMaterial color="#140c2a" transparent opacity={0.13} depthWrite={false} />
    </mesh>
  )
}

// Second ring — larger, different axis, almost off-screen lower-left
function OuterRing() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = -s.clock.elapsedTime * 0.0008
  })
  return (
    <mesh ref={ref} position={[-900, -500, -800]} rotation={[0.8, -0.15, 0.3]}>
      <torusGeometry args={[1900, 5, 4, 240]} />
      <meshBasicMaterial color="#0a0820" transparent opacity={0.07} depthWrite={false} />
    </mesh>
  )
}

// ─── BROKEN MEGASTRUCTURE ─────────────────────────────────────────────────
// Large disjointed rectangular slabs in the deep background

function MegastructureFragment({ pos, rot, size }: {
  pos: [number, number, number]
  rot: [number, number, number]
  size: [number, number, number]
}) {
  return (
    <mesh position={pos} rotation={rot}>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#0e0820" transparent opacity={0.18} wireframe depthWrite={false} />
    </mesh>
  )
}

function BrokenMegastructure() {
  return (
    <group position={[1800, -700, -600]}>
      <MegastructureFragment pos={[0, 0, 0]}      rot={[0.1, 0.3, 0.05]} size={[60, 900, 40]} />
      <MegastructureFragment pos={[120, 300, 20]}  rot={[0.2, 0.1, 0.8]}  size={[50, 600, 35]} />
      <MegastructureFragment pos={[-80, -200, 50]} rot={[-0.1, 0.5, 0.2]} size={[40, 700, 28]} />
      <MegastructureFragment pos={[200, 100, -30]} rot={[0.05, 0.4, 1.1]} size={[30, 400, 22]} />
      <MegastructureFragment pos={[60, 600, 15]}   rot={[0.3, 0.2, 0.05]} size={[55, 300, 32]} />
    </group>
  )
}

// ─── SIGNAL TOWERS ───────────────────────────────────────────────────────
// Impossibly tall needles at different corners — hint at distant infrastructure

function SignalTower({ position, height = 4000 }: { position: [number, number, number]; height?: number }) {
  const ref = useRef<any>(null)
  useFrame((s) => {
    // tiny sway
    if (ref.current) ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.2 + position[0] * 0.01) * 0.003
  })
  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[2.5, 1, height, 4]} />
        <meshBasicMaterial color="#0d1828" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      {/* Signal ring at top */}
      <mesh position={[0, height / 2 - 20, 0]}>
        <torusGeometry args={[18, 2, 6, 32]} />
        <meshBasicMaterial color="#1a4060" transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── IMPOSSIBLE GEOMETRY ─────────────────────────────────────────────────
// A huge wireframe icosahedron with no obvious purpose

function ImpossibleGeometry() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.x = s.clock.elapsedTime * 0.006
    ref.current.rotation.y = s.clock.elapsedTime * 0.009
    ref.current.rotation.z = s.clock.elapsedTime * 0.004
  })
  return (
    <mesh ref={ref} position={[-400, -1600, -200]}>
      <icosahedronGeometry args={[580, 1]} />
      <meshBasicMaterial color="#0a1a14" wireframe transparent opacity={0.09} depthWrite={false} />
    </mesh>
  )
}

// ─── DEBRIS FIELD ────────────────────────────────────────────────────────
// 700 fragments scattered in a band — sense of accumulated history

function DebrisField() {
  const ref = useRef<Points>(null)
  const geo = useMemo(() => {
    const n = 700
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 * 5.3 // uneven spiral
      const dist = 700 + ((i * 43) % 1400)
      const elev = ((i * 17 + 3) % 800) - 400
      const dz = ((i * 29) % 600) - 300
      pos[i * 3]     = Math.cos(a) * dist + ((i * 7) % 180) - 90
      pos[i * 3 + 1] = elev
      pos[i * 3 + 2] = Math.sin(a) * dist * 0.6 + dz
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.004
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={1.8}
        color="#16102a"
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ─── DEEP BACKGROUND SMEARS ──────────────────────────────────────────────
// Very faint particle clouds far in the background

function GalaxySmear({ position, count, color, spread }: {
  position: [number, number, number]
  count: number
  color: string
  spread: number
}) {
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2
      const r = spread * (0.2 + Math.random() * 0.8)
      pos[i * 3]     = Math.cos(t) * r + (Math.random() - 0.5) * spread * 0.4
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.12
      pos[i * 3 + 2] = Math.sin(t) * r * 0.3 + (Math.random() - 0.5) * spread * 0.2
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [count, spread])

  return (
    <points geometry={geo} position={position}>
      <pointsMaterial
        size={1.4}
        color={color}
        transparent
        opacity={0.08}
        sizeAttenuation
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── ANOMALOUS MARKER ────────────────────────────────────────────────────
// No label. No tooltip. Unexplained structure at an odd position.
// Users notice it. Nothing explains it.

function UnexplainedObject() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.x = s.clock.elapsedTime * 0.022
    ref.current.rotation.z = s.clock.elapsedTime * -0.017
    const scale = 0.94 + 0.06 * Math.sin(s.clock.elapsedTime * 1.1)
    ref.current.scale.set(scale, scale, scale)
  })
  return (
    <group ref={ref} position={[-1300, 900, 200]}>
      {/* outer octahedron */}
      <mesh>
        <octahedronGeometry args={[110, 0]} />
        <meshBasicMaterial color="#200a40" wireframe transparent opacity={0.3} depthWrite={false} />
      </mesh>
      {/* inner tetrahedron — rotated */}
      <mesh rotation={[0.5, 0.8, 0.3]}>
        <tetrahedronGeometry args={[70, 0]} />
        <meshBasicMaterial color="#301060" wireframe transparent opacity={0.2} depthWrite={false} />
      </mesh>
      {/* very faint core glow — no explanation offered */}
      <mesh>
        <sphereGeometry args={[22, 8, 8]} />
        <meshBasicMaterial color="#6020c0" transparent opacity={0.04} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

export default function GiantStructures() {
  return (
    <group>
      <AncientRing />
      <OuterRing />
      <BrokenMegastructure />
      <SignalTower position={[1400, -800, -300]} height={3800} />
      <SignalTower position={[-600, 1800, 400]} height={3200} />
      <SignalTower position={[2200, 300, -100]} height={4200} />
      <ImpossibleGeometry />
      <UnexplainedObject />
      <DebrisField />
      <GalaxySmear position={[3000, 1000, -4000]}  count={800} color="#100820" spread={1800} />
      <GalaxySmear position={[-4000, -800, -5000]} count={600} color="#081018" spread={2200} />
      <GalaxySmear position={[800, 3000, -3000]}   count={500} color="#0c0c20" spread={1400} />
    </group>
  )
}
