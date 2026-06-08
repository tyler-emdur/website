'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points } from 'three'
import * as THREE from 'three'

// ─── ANCIENT RING ──────────────────────────────────────────
function AncientRing() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * 0.0012
  })
  return (
    <mesh ref={ref} position={[1200, 1500, -1000]} rotation={[0.28, 0.12, 0.65]}>
      <torusGeometry args={[2600, 16, 5, 180]} />
      <meshBasicMaterial color="#0c1835" transparent opacity={0.24} depthWrite={false} />
    </mesh>
  )
}

// Second ring — larger, different axis, almost off-screen lower-left
function OuterRing() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = -s.clock.elapsedTime * 0.0006
  })
  return (
    <mesh ref={ref} position={[-2000, -1200, -1600]} rotation={[0.8, -0.15, 0.3]}>
      <torusGeometry args={[3800, 10, 4, 240]} />
      <meshBasicMaterial color="#0a0820" transparent opacity={0.12} depthWrite={false} />
    </mesh>
  )
}

// ─── BROKEN MEGASTRUCTURE ─────────────────────────────────────────────────

function MegastructureFragment({ pos, rot, size }: {
  pos: [number, number, number]
  rot: [number, number, number]
  size: [number, number, number]
}) {
  return (
    <mesh position={pos} rotation={rot}>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#0e0820" transparent opacity={0.28} wireframe depthWrite={false} />
    </mesh>
  )
}

function BrokenMegastructure() {
  return (
    <group position={[3200, -1400, -1000]}>
      <MegastructureFragment pos={[0, 0, 0]}      rot={[0.1, 0.3, 0.05]} size={[120, 1800, 80]} />
      <MegastructureFragment pos={[240, 600, 40]}  rot={[0.2, 0.1, 0.8]}  size={[100, 1200, 70]} />
      <MegastructureFragment pos={[-160, -400, 100]} rot={[-0.1, 0.5, 0.2]} size={[80, 1400, 56]} />
      <MegastructureFragment pos={[400, 200, -60]} rot={[0.05, 0.4, 1.1]} size={[60, 800, 44]} />
      <MegastructureFragment pos={[120, 1200, 30]}   rot={[0.3, 0.2, 0.05]} size={[110, 600, 64]} />
    </group>
  )
}

// ─── SIGNAL TOWERS ───────────────────────────────────────────────────────

function SignalTower({ position, height = 8000 }: { position: [number, number, number]; height?: number }) {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.15 + position[0] * 0.005) * 0.002
  })
  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[5, 2, height, 4]} />
        <meshBasicMaterial color="#0d1828" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <mesh position={[0, height / 2 - 40, 0]}>
        <torusGeometry args={[36, 4, 6, 32]} />
        <meshBasicMaterial color="#1a4060" transparent opacity={0.45} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── IMPOSSIBLE GEOMETRY ─────────────────────────────────────────────────

function ImpossibleGeometry() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.x = s.clock.elapsedTime * 0.004
    ref.current.rotation.y = s.clock.elapsedTime * 0.006
    ref.current.rotation.z = s.clock.elapsedTime * 0.003
  })
  return (
    <mesh ref={ref} position={[-800, -2800, -300]}>
      <icosahedronGeometry args={[1160, 1]} />
      <meshBasicMaterial color="#0a1a14" wireframe transparent opacity={0.12} depthWrite={false} />
    </mesh>
  )
}

// ─── DEBRIS FIELD ────────────────────────────────────────────────────────

function DebrisField() {
  const ref = useRef<Points>(null)
  const geo = useMemo(() => {
    const n = 1500
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const bias = i < 1000 ? 1 : 3.2
      const a = (i / n) * Math.PI * 2 * 6.5
      const dist = 1200 + ((i * 43) % 3200) * bias * 0.5
      const elev = ((i * 17 + 3) % 1600) - 800
      const dz = ((i * 29) % 1200) - 600
      pos[i * 3]     = Math.cos(a) * dist + ((i * 7) % 400) - 200
      pos[i * 3 + 1] = elev
      pos[i * 3 + 2] = Math.sin(a) * dist * 0.55 + dz
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.002
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={2.4}
        color="#16102a"
        transparent
        opacity={0.42}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ─── DEEP BACKGROUND SMEARS ──────────────────────────────────────────────

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
        size={2.0}
        color={color}
        transparent
        opacity={0.12}
        sizeAttenuation
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── ANOMALOUS MARKER ────────────────────────────────────────────────────

function UnexplainedObject() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.x = s.clock.elapsedTime * 0.015
    ref.current.rotation.z = s.clock.elapsedTime * -0.012
    const scale = 0.95 + 0.05 * Math.sin(s.clock.elapsedTime * 0.8)
    ref.current.scale.set(scale, scale, scale)
  })
  return (
    <group ref={ref} position={[-2400, 1800, 300]}>
      <mesh>
        <octahedronGeometry args={[220, 0]} />
        <meshBasicMaterial color="#200a40" wireframe transparent opacity={0.38} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.5, 0.8, 0.3]}>
        <tetrahedronGeometry args={[140, 0]} />
        <meshBasicMaterial color="#301060" wireframe transparent opacity={0.24} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[44, 8, 8]} />
        <meshBasicMaterial color="#6020c0" transparent opacity={0.06} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── NESTED GYROSCOPE ────────────────────────────────────────────────────

function NestedGyroscope() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.y = s.clock.elapsedTime * 0.008
    ref.current.rotation.x = s.clock.elapsedTime * -0.005
  })
  return (
    <group ref={ref} position={[2800, 900, -500]}>
      <mesh>
        <torusGeometry args={[320, 5, 4, 80]} />
        <meshBasicMaterial color="#0e2032" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0.4, 0]}>
        <torusGeometry args={[320, 4, 4, 80]} />
        <meshBasicMaterial color="#0e2032" transparent opacity={0.20} depthWrite={false} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2.4]}>
        <torusGeometry args={[320, 3, 4, 80]} />
        <meshBasicMaterial color="#0e2032" transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── ABSORPTION BODY ─────────────────────────────────────────────────────
// Redesigned: A gigantic dark object 10x larger than everything else
// Represents the gravitational null void anomaly physically

function AbsorptionBody() {
  return (
    <group position={[-2500, 1800, -1200]}>
      {/* 10x Larger black sphere */}
      <mesh>
        <sphereGeometry args={[850, 24, 24]} />
        <meshBasicMaterial color="#000000" depthWrite={true} />
      </mesh>
      {/* Ominous, very deep absorption halo */}
      <mesh>
        <sphereGeometry args={[890, 20, 20]} />
        <meshBasicMaterial color="#06030c" transparent opacity={0.28} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Secondary outer boundary halo */}
      <mesh>
        <sphereGeometry args={[960, 16, 16]} />
        <meshBasicMaterial color="#0a0518" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── GHOST ORBIT RINGS ───────────────────────────────────────────────────

function GhostOrbitRings() {
  return (
    <group>
      {/* Orbit 1 — upper left */}
      <mesh position={[-1600, 700, -200]} rotation={[0.32, 0.78, 0.22]}>
        <torusGeometry args={[550, 2.5, 4, 120, Math.PI * 1.88]} />
        <meshBasicMaterial color="#0a1830" transparent opacity={0.24} depthWrite={false} />
      </mesh>
      {/* Orbit 2 — far right */}
      <mesh position={[1800, -600, 100]} rotation={[-0.42, 0.28, 1.12]}>
        <torusGeometry args={[840, 3, 4, 140, Math.PI * 1.2]} />
        <meshBasicMaterial color="#180a20" transparent opacity={0.20} depthWrite={false} />
      </mesh>
      {/* Orbit 3 — below center */}
      <mesh position={[400, -1300, -300]} rotation={[1.18, -0.18, 0.38]}>
        <torusGeometry args={[380, 2, 4, 80, Math.PI * 1.96]} />
        <meshBasicMaterial color="#0c1020" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* Orbit 4 — small, mid-void */}
      <mesh position={[-180, 400, 150]} rotation={[0.58, 1.18, 0.92]}>
        <torusGeometry args={[140, 1.5, 4, 40, Math.PI * 0.82]} />
        <meshBasicMaterial color="#1a0a30" transparent opacity={0.30} depthWrite={false} />
      </mesh>
      {/* Orbit 5 — crosses lab region */}
      <mesh position={[200, 1800, -500]} rotation={[0.08, 0.92, 0.35]}>
        <torusGeometry args={[1560, 4.5, 4, 160, Math.PI * 0.68]} />
        <meshBasicMaterial color="#0c0818" transparent opacity={0.10} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── ANCIENT SURVEY GRID ─────────────────────────────────────────────────

function AncientSurveyGrid() {
  const geo = useMemo(() => {
    const vertices: number[] = []
    const gridW = 5600, gridH = 4000
    const rows = 14, cols = 20

    for (let r = 0; r <= rows; r++) {
      const y = -gridH / 2 + (r / rows) * gridH
      vertices.push(-gridW / 2, y, 0, gridW / 2, y, 0)
    }
    for (let c = 0; c <= cols; c++) {
      const x = -gridW / 2 + (c / cols) * gridW
      vertices.push(x, -gridH / 2, 0, x, gridH / 2, 0)
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return g
  }, [])

  return (
    <lineSegments geometry={geo} position={[-160, 120, -3000]} rotation={[0.04, 0.06, 0.02]}>
      <lineBasicMaterial color="#060612" transparent opacity={0.24} depthWrite={false} />
    </lineSegments>
  )
}

// ─── ANCIENT CROSSBEAM ───────────────────────────────────────────────────

function AncientCrossbeam() {
  return (
    <group position={[2400, 3200, -1200]} rotation={[0.18, 0.06, -0.28]}>
      <mesh>
        <boxGeometry args={[7200, 40, 40]} />
        <meshBasicMaterial color="#07101a" wireframe transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh position={[-1800, 0, 0]}>
        <boxGeometry args={[36, 1360, 36]} />
        <meshBasicMaterial color="#07101a" wireframe transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh position={[760, 0, 0]}>
        <boxGeometry args={[36, 880, 36]} />
        <meshBasicMaterial color="#07101a" wireframe transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── DUST VEIL ────────────────────────────────────────────────────────────

function DustVeil() {
  const geo = useMemo(() => {
    const n = 2000
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const t = (i / n - 0.5) * 5600
      const perp = (Math.random() - 0.5) * 360 + Math.sin(i * 0.08) * 120
      const depth = (Math.random() - 0.5) * 800
      pos[i * 3]     = t * 0.85 - 400 + perp * 0.3
      pos[i * 3 + 1] = t * 0.52 + 160 + perp
      pos[i * 3 + 2] = depth
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [])

  return (
    <points geometry={geo}>
      <pointsMaterial
        size={3.2}
        color="#12101e"
        transparent
        opacity={0.34}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ─── MONOLITH ─────────────────────────────────────────────────────────────

function Monolith() {
  return (
    <group position={[1800, -2200, 450]} rotation={[0, 0, 0.06]}>
      <mesh>
        <boxGeometry args={[25, 450, 90]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}

// ─── FRAGMENTED RING CLUSTER ──────────────────────────────────────────────

function FragmentedRingCluster() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.005
    }
  })
  return (
    <group ref={ref} position={[-2200, -1600, 200]}>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[480, 4, 4, 100, Math.PI * 1.4]} />
        <meshBasicMaterial color="#1a0a20" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI * 0.7, 0.4, 0.8]}>
        <torusGeometry args={[390, 3, 4, 80, Math.PI * 1.8]} />
        <meshBasicMaterial color="#0a1820" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.3, Math.PI * 0.5, 1.2]}>
        <torusGeometry args={[620, 6, 4, 120, Math.PI * 0.6]} />
        <meshBasicMaterial color="#200a10" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── ISOLATED ANOMALY FIELD ───────────────────────────────────────────────

function IsolatedAnomalyField() {
  const geo = useMemo(() => {
    const n = 360
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 40 + Math.random() * 130
      pos[i * 3]     = Math.sin(phi) * Math.cos(theta) * r
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r
      pos[i * 3 + 2] = Math.cos(phi) * r
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [])

  return (
    <points geometry={geo} position={[520, 680, 120]}>
      <pointsMaterial
        size={3.8}
        color="#2a1040"
        transparent
        opacity={0.52}
        sizeAttenuation
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── COLOSSAL ARTIFACT ───────────────────────────────────────────────────────

function ColossalArtifact() {
  const joint: [number, number, number] = [2000, 2400, -500]
  return (
    <group>
      {/* Corner joint */}
      <mesh position={joint}>
        <boxGeometry args={[200, 200, 200]} />
        <meshBasicMaterial color="#030810" wireframe transparent opacity={0.52} depthWrite={false} />
      </mesh>
      {/* Beam extending right — off screen */}
      <mesh position={[joint[0] + 5600, joint[1], joint[2]]}>
        <boxGeometry args={[11200, 120, 120]} />
        <meshBasicMaterial color="#040a14" wireframe transparent opacity={0.42} depthWrite={false} />
      </mesh>
      {/* Beam extending up — off screen */}
      <mesh position={[joint[0], joint[1] + 5600, joint[2]]}>
        <boxGeometry args={[120, 11200, 120]} />
        <meshBasicMaterial color="#040a14" wireframe transparent opacity={0.38} depthWrite={false} />
      </mesh>
      {/* Beam extending into depth — off screen */}
      <mesh position={[joint[0], joint[1], joint[2] - 8000]}>
        <boxGeometry args={[120, 120, 16000]} />
        <meshBasicMaterial color="#040a14" wireframe transparent opacity={0.30} depthWrite={false} />
      </mesh>
      {/* Secondary rib on horizontal beam */}
      <mesh position={[joint[0] + 3200, joint[1] - 560, joint[2]]}>
        <boxGeometry args={[6400, 80, 80]} />
        <meshBasicMaterial color="#060c18" wireframe transparent opacity={0.24} depthWrite={false} />
      </mesh>
      {/* Vertical rib on vertical beam */}
      <mesh position={[joint[0] - 480, joint[1] + 2800, joint[2]]}>
        <boxGeometry args={[80, 5600, 80]} />
        <meshBasicMaterial color="#060c18" wireframe transparent opacity={0.20} depthWrite={false} />
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
      <SignalTower position={[2800, -1600, -600]} height={7600} />
      <SignalTower position={[-1200, 3600, 800]} height={6400} />
      <SignalTower position={[4400, 600, -200]} height={8400} />
      <ImpossibleGeometry />
      <UnexplainedObject />
      <NestedGyroscope />
      <AbsorptionBody />
      <GhostOrbitRings />
      <AncientSurveyGrid />
      <AncientCrossbeam />
      <DustVeil />
      <Monolith />
      <FragmentedRingCluster />
      <IsolatedAnomalyField />
      <ColossalArtifact />
      <DebrisField />
      <GalaxySmear position={[6000, 2000, -8000]}  count={800} color="#100820" spread={3600} />
      <GalaxySmear position={[-8000, -1600, -10000]} count={600} color="#081018" spread={4400} />
      <GalaxySmear position={[1600, 6000, -6000]}   count={500} color="#0c0c20" spread={2800} />
      <GalaxySmear position={[-4000, 4000, -4000]} count={700} color="#181008" spread={3200} />
    </group>
  )
}
