'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Orbital infrastructure — fragments of systems that no longer function.
// Nothing is centered. Nothing is complete. Nothing makes a solar system.

function OrbitalArc({ position, rotation, radius, tube, arc, color, opacity, rotateSpeed = 0 }: {
  position: [number, number, number]
  rotation: [number, number, number]
  radius: number
  tube: number
  arc: number
  color: string
  opacity: number
  rotateSpeed?: number
}) {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current && rotateSpeed !== 0) {
      ref.current.rotation.z += rotateSpeed * 0.001
    }
  })
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <torusGeometry args={[radius, tube, 4, 100, arc]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

// A single floating segment that drifts — like a gyroscope that lost its anchor
function DriftingRing({ position, radius, color, opacity }: {
  position: [number, number, number]
  radius: number
  color: string
  opacity: number
}) {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (!ref.current) return
    const t = s.clock.elapsedTime
    ref.current.rotation.x = t * 0.004
    ref.current.rotation.z = t * -0.003
  })
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[radius, 2, 4, 80, Math.PI * 2]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

// Ghost path — a line that goes from somewhere to nowhere
function OrphanLine({ start, end, color, opacity }: {
  start: [number, number, number]
  end: [number, number, number]
  color: string
  opacity: number
}) {
  const obj = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([...start, ...end], 3))
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
    return new THREE.Line(g, mat)
  }, [start, end, color, opacity])
  return <primitive object={obj} />
}

export default function PortalConcourse() {
  return (
    <group>
      {/* Fragment A — large arc, upper-right, tilted off-plane */}
      <OrbitalArc
        position={[340, 220, -30]}
        rotation={[0.65, 0.18, -0.42]}
        radius={510} tube={4} arc={Math.PI * 1.35}
        color="#0e1f38" opacity={0.22} rotateSpeed={0.25}
      />

      {/* Fragment B — medium, lower-left, different tilt axis */}
      <OrbitalArc
        position={[-310, -380, 45]}
        rotation={[-0.28, 0.82, 0.24]}
        radius={295} tube={2.5} arc={Math.PI * 0.75}
        color="#1e0d2c" opacity={0.17}
      />

      {/* Fragment C — enormous, upper-left, mostly off-screen */}
      <OrbitalArc
        position={[-720, 860, -140]}
        rotation={[1.18, -0.28, 0.58]}
        radius={1280} tube={6} arc={Math.PI * 0.42}
        color="#080e1c" opacity={0.12} rotateSpeed={-0.08}
      />

      {/* Fragment D — medium, far right, nearly vertical axis */}
      <OrbitalArc
        position={[680, -240, 55]}
        rotation={[0.12, 1.08, 0.82]}
        radius={365} tube={3} arc={Math.PI * 1.78}
        color="#140820" opacity={0.14}
      />

      {/* Fragment E — small, archives region, nearly complete but broken */}
      <OrbitalArc
        position={[-510, 480, 20]}
        rotation={[0.38, -0.22, 1.12]}
        radius={210} tube={2} arc={Math.PI * 1.92}
        color="#180e04" opacity={0.19} rotateSpeed={0.45}
      />

      {/* Fragment F — isolated small ring in the void — no region near it */}
      <OrbitalArc
        position={[95, -310, 75]}
        rotation={[0.85, 0.52, 0.32]}
        radius={88} tube={1.8} arc={Math.PI * 1.15}
        color="#0a1425" opacity={0.28}
      />

      {/* Fragment G — far right, enormous partial arc */}
      <OrbitalArc
        position={[920, 640, -65]}
        rotation={[-0.48, 0.38, -0.72]}
        radius={660} tube={5} arc={Math.PI * 0.38}
        color="#0c0618" opacity={0.10} rotateSpeed={-0.15}
      />

      {/* Fragment H — counter-tilted, moves against the others */}
      <OrbitalArc
        position={[-240, -560, 90]}
        rotation={[1.52, 0.32, 1.82]}
        radius={320} tube={2.5} arc={Math.PI * 0.88}
        color="#121008" opacity={0.15}
      />

      {/* Fragment I — a complete but tiny ring floating inexplicably */}
      <DriftingRing
        position={[-680, -120, 110]}
        radius={52}
        color="#0a1830"
        opacity={0.32}
      />

      {/* Fragment J — another drifting ring in dead space */}
      <DriftingRing
        position={[380, 820, -80]}
        radius={78}
        color="#1a0820"
        opacity={0.24}
      />

      {/* Orphan paths — go from nowhere to nowhere */}
      <OrphanLine
        start={[-1200, 600, -50]}
        end={[-400, -200, 30]}
        color="#0a1828"
        opacity={0.14}
      />
      <OrphanLine
        start={[600, -800, 20]}
        end={[1400, 200, -40]}
        color="#180a20"
        opacity={0.10}
      />
    </group>
  )
}
