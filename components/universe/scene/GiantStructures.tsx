'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points } from 'three'
import * as THREE from 'three'

// ─── ANCIENT RING ─────────────────────────────────────────────────────────
// Upper-right, radius > viewport at default zoom — partially off-screen

function AncientRing() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * 0.0018
  })
  return (
    <mesh ref={ref} position={[600, 700, -500]} rotation={[0.28, 0.12, 0.65]}>
      <torusGeometry args={[1240, 9, 5, 180]} />
      <meshBasicMaterial color="#0c1835" transparent opacity={0.26} depthWrite={false} />
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
      <meshBasicMaterial color="#0a0820" transparent opacity={0.14} depthWrite={false} />
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
      <meshBasicMaterial color="#0e0820" transparent opacity={0.32} wireframe depthWrite={false} />
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

function SignalTower({ position, height = 4000 }: { position: [number, number, number]; height?: number }) {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.2 + position[0] * 0.01) * 0.003
  })
  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[2.5, 1, height, 4]} />
        <meshBasicMaterial color="#0d1828" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <mesh position={[0, height / 2 - 20, 0]}>
        <torusGeometry args={[18, 2, 6, 32]} />
        <meshBasicMaterial color="#1a4060" transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── IMPOSSIBLE GEOMETRY ─────────────────────────────────────────────────

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
      <meshBasicMaterial color="#0a1a14" wireframe transparent opacity={0.15} depthWrite={false} />
    </mesh>
  )
}

// ─── DEBRIS FIELD ────────────────────────────────────────────────────────
// Asymmetric — dense on one side, sparse on the other

function DebrisField() {
  const ref = useRef<Points>(null)
  const geo = useMemo(() => {
    const n = 900
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      // Biased spiral — more particles in upper-right quadrant
      const bias = i < 600 ? 1 : 3.2
      const a = (i / n) * Math.PI * 2 * 5.3
      const dist = 600 + ((i * 43) % 1600) * bias * 0.5
      const elev = ((i * 17 + 3) % 800) - 400
      const dz = ((i * 29) % 600) - 300
      pos[i * 3]     = Math.cos(a) * dist + ((i * 7) % 200) - 100
      pos[i * 3 + 1] = elev
      pos[i * 3 + 2] = Math.sin(a) * dist * 0.55 + dz
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
        opacity={0.5}
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
        size={1.4}
        color={color}
        transparent
        opacity={0.14}
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
    ref.current.rotation.x = s.clock.elapsedTime * 0.022
    ref.current.rotation.z = s.clock.elapsedTime * -0.017
    const scale = 0.94 + 0.06 * Math.sin(s.clock.elapsedTime * 1.1)
    ref.current.scale.set(scale, scale, scale)
  })
  return (
    <group ref={ref} position={[-1300, 900, 200]}>
      <mesh>
        <octahedronGeometry args={[110, 0]} />
        <meshBasicMaterial color="#200a40" wireframe transparent opacity={0.42} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.5, 0.8, 0.3]}>
        <tetrahedronGeometry args={[70, 0]} />
        <meshBasicMaterial color="#301060" wireframe transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[22, 8, 8]} />
        <meshBasicMaterial color="#6020c0" transparent opacity={0.08} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── NESTED GYROSCOPE ────────────────────────────────────────────────────
// Three interlocked rings at orthogonal axes — no context, no label

function NestedGyroscope() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.y = s.clock.elapsedTime * 0.011
    ref.current.rotation.x = s.clock.elapsedTime * -0.007
  })
  return (
    <group ref={ref} position={[1550, 480, -320]}>
      <mesh>
        <torusGeometry args={[160, 2.5, 4, 80]} />
        <meshBasicMaterial color="#0e2032" transparent opacity={0.30} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0.4, 0]}>
        <torusGeometry args={[160, 2, 4, 80]} />
        <meshBasicMaterial color="#0e2032" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2.4]}>
        <torusGeometry args={[160, 1.5, 4, 80]} />
        <meshBasicMaterial color="#0e2032" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── ABSORPTION BODY ─────────────────────────────────────────────────────
// A solid black object. Stars disappear behind it.
// No label. No explanation. Users notice the void.

function AbsorptionBody() {
  return (
    <group position={[-355, 258, 180]}>
      <mesh>
        <sphereGeometry args={[88, 14, 14]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Very faint halo so it reads as an object and not a render bug */}
      <mesh>
        <sphereGeometry args={[96, 10, 10]} />
        <meshBasicMaterial color="#0a0614" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── GHOST ORBIT RINGS ───────────────────────────────────────────────────
// Orbital path rings with no visible body at their center.
// They suggest something was here — or should be — but isn't.

function GhostOrbitRings() {
  return (
    <group>
      {/* Orbit 1 — upper left, nearly complete, slightly tilted */}
      <mesh position={[-820, 380, -110]} rotation={[0.32, 0.78, 0.22]}>
        <torusGeometry args={[275, 1.5, 4, 120, Math.PI * 1.88]} />
        <meshBasicMaterial color="#0a1830" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* Orbit 2 — far right, large, broken arc */}
      <mesh position={[920, -320, 60]} rotation={[-0.42, 0.28, 1.12]}>
        <torusGeometry args={[420, 2, 4, 140, Math.PI * 1.2]} />
        <meshBasicMaterial color="#180a20" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* Orbit 3 — below center, nearly complete, very faint */}
      <mesh position={[210, -680, -210]} rotation={[1.18, -0.18, 0.38]}>
        <torusGeometry args={[190, 1, 4, 80, Math.PI * 1.96]} />
        <meshBasicMaterial color="#0c1020" transparent opacity={0.20} depthWrite={false} />
      </mesh>

      {/* Orbit 4 — small, mid-void, tilted perpendicular to everything else */}
      <mesh position={[-90, 200, 85]} rotation={[0.58, 1.18, 0.92]}>
        <torusGeometry args={[68, 1.2, 4, 40, Math.PI * 0.82]} />
        <meshBasicMaterial color="#1a0a30" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Orbit 5 — enormous ghost ring crossing lab region */}
      <mesh position={[120, 600, -300]} rotation={[0.08, 0.92, 0.35]}>
        <torusGeometry args={[780, 3, 4, 160, Math.PI * 0.68]} />
        <meshBasicMaterial color="#0c0818" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── ANCIENT SURVEY GRID ─────────────────────────────────────────────────
// A vast, faint rectangular grid in the deep background.
// Suggests this region was once systematically catalogued.
// Now only the grid remains.

function AncientSurveyGrid() {
  const geo = useMemo(() => {
    const vertices: number[] = []
    const gridW = 2800, gridH = 2000
    const rows = 9, cols = 13

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
    <lineSegments geometry={geo} position={[-80, 60, -1500]} rotation={[0.04, 0.06, 0.02]}>
      <lineBasicMaterial color="#060612" transparent opacity={0.22} depthWrite={false} />
    </lineSegments>
  )
}

// ─── ANCIENT CROSSBEAM ───────────────────────────────────────────────────
// A colossal structural element. No legible purpose.
// Its far ends extend beyond the visible region.

function AncientCrossbeam() {
  return (
    <group position={[1200, 1800, -650]} rotation={[0.18, 0.06, -0.28]}>
      <mesh>
        <boxGeometry args={[3600, 22, 22]} />
        <meshBasicMaterial color="#07101a" wireframe transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <mesh position={[-900, 0, 0]}>
        <boxGeometry args={[18, 680, 18]} />
        <meshBasicMaterial color="#07101a" wireframe transparent opacity={0.20} depthWrite={false} />
      </mesh>
      <mesh position={[380, 0, 0]}>
        <boxGeometry args={[18, 440, 18]} />
        <meshBasicMaterial color="#07101a" wireframe transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── DUST VEIL ────────────────────────────────────────────────────────────
// A dense particle band that cuts across part of the scene.
// Creates a visual divide — some regions feel "beyond" it.

function DustVeil() {
  const geo = useMemo(() => {
    const n = 1200
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      // Band across the lower-left to upper-right diagonal
      const t = (i / n - 0.5) * 2800
      const perp = (Math.random() - 0.5) * 180 + Math.sin(i * 0.08) * 60
      const depth = (Math.random() - 0.5) * 400
      pos[i * 3]     = t * 0.85 - 200 + perp * 0.3
      pos[i * 3 + 1] = t * 0.52 + 80 + perp
      pos[i * 3 + 2] = depth
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [])

  return (
    <points geometry={geo}>
      <pointsMaterial
        size={2.4}
        color="#12101e"
        transparent
        opacity={0.38}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ─── MONOLITH ─────────────────────────────────────────────────────────────
// Perfectly rectangular. Utterly black. Slightly off-vertical.
// Clearly placed by something. No further information provided.

function Monolith() {
  return (
    <group position={[820, -1020, 240]} rotation={[0, 0, 0.06]}>
      <mesh>
        <boxGeometry args={[14, 220, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}

// ─── FRAGMENTED RING CLUSTER ──────────────────────────────────────────────
// Three ring fragments close together but at wildly different angles.
// They cannot share an orbital plane. They should not coexist.

function FragmentedRingCluster() {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.008
    }
  })
  return (
    <group ref={ref} position={[-1100, -800, 100]}>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[240, 2, 4, 100, Math.PI * 1.4]} />
        <meshBasicMaterial color="#1a0a20" transparent opacity={0.24} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI * 0.7, 0.4, 0.8]}>
        <torusGeometry args={[195, 1.5, 4, 80, Math.PI * 1.8]} />
        <meshBasicMaterial color="#0a1820" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.3, Math.PI * 0.5, 1.2]}>
        <torusGeometry args={[310, 3, 4, 120, Math.PI * 0.6]} />
        <meshBasicMaterial color="#200a10" transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── ISOLATED ANOMALY FIELD ───────────────────────────────────────────────
// A cluster of 180 particles in the middle of empty space.
// No structure near it. No label. Just: there.

function IsolatedAnomalyField() {
  const geo = useMemo(() => {
    const n = 180
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 20 + Math.random() * 65
      pos[i * 3]     = Math.sin(phi) * Math.cos(theta) * r
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r
      pos[i * 3 + 2] = Math.cos(phi) * r
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [])

  return (
    <points geometry={geo} position={[260, 340, 60]}>
      <pointsMaterial
        size={2.8}
        color="#2a1040"
        transparent
        opacity={0.55}
        sizeAttenuation
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── COLOSSAL ARTIFACT ───────────────────────────────────────────────────────
// The corner of something incomprehensibly large.
// Three beams meet at a joint. Each extends beyond the visible region.
// No label. No context. No classification.

function ColossalArtifact() {
  const joint: [number, number, number] = [1050, 1220, -260]
  return (
    <group>
      {/* Corner joint */}
      <mesh position={joint}>
        <boxGeometry args={[100, 100, 100]} />
        <meshBasicMaterial color="#030810" wireframe transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {/* Beam extending right — off screen */}
      <mesh position={[joint[0] + 2800, joint[1], joint[2]]}>
        <boxGeometry args={[5600, 62, 62]} />
        <meshBasicMaterial color="#040a14" wireframe transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* Beam extending up — off screen */}
      <mesh position={[joint[0], joint[1] + 2800, joint[2]]}>
        <boxGeometry args={[62, 5600, 62]} />
        <meshBasicMaterial color="#040a14" wireframe transparent opacity={0.40} depthWrite={false} />
      </mesh>
      {/* Beam extending into depth — off screen */}
      <mesh position={[joint[0], joint[1], joint[2] - 4000]}>
        <boxGeometry args={[62, 62, 8000]} />
        <meshBasicMaterial color="#040a14" wireframe transparent opacity={0.32} depthWrite={false} />
      </mesh>
      {/* Secondary rib on horizontal beam */}
      <mesh position={[joint[0] + 1600, joint[1] - 280, joint[2]]}>
        <boxGeometry args={[3200, 40, 40]} />
        <meshBasicMaterial color="#060c18" wireframe transparent opacity={0.28} depthWrite={false} />
      </mesh>
      {/* Vertical rib on vertical beam */}
      <mesh position={[joint[0] - 240, joint[1] + 1400, joint[2]]}>
        <boxGeometry args={[40, 2800, 40]} />
        <meshBasicMaterial color="#060c18" wireframe transparent opacity={0.24} depthWrite={false} />
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
      <GalaxySmear position={[3000, 1000, -4000]}  count={800} color="#100820" spread={1800} />
      <GalaxySmear position={[-4000, -800, -5000]} count={600} color="#081018" spread={2200} />
      <GalaxySmear position={[800, 3000, -3000]}   count={500} color="#0c0c20" spread={1400} />
      <GalaxySmear position={[-2000, 2000, -2000]} count={700} color="#181008" spread={1600} />
    </group>
  )
}
