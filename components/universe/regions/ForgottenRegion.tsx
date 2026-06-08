'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'forgotten')!
const POS = region.position

// What was here before — irregular outward scatter suggesting a violent dispersal
function ForgottenDebris() {
  const geo = useMemo(() => {
    const n = 320
    const pos = new Float32Array(n * 3)
    const [bx, by, bz] = POS
    for (let i = 0; i < n; i++) {
      const angle = i * 2.618 // golden angle
      const dist = 50 + (i * 1.2 % 310)
      pos[i * 3]     = bx + Math.cos(angle) * dist + ((i * 13) % 140) - 70
      pos[i * 3 + 1] = by + ((i * 41) % 380) - 190
      pos[i * 3 + 2] = bz + Math.sin(angle) * dist * 0.38 + ((i * 7) % 100) - 50
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])

  return (
    <points geometry={geo}>
      <pointsMaterial size={1.8} color="#1e293b" transparent opacity={0.38} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// Structural fragments — broken arms of something that used to be here
function BrokenArm({ position, rotation, h }: {
  position: [number, number, number]
  rotation: [number, number, number]
  h: number
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[6, h, 6]} />
      <meshBasicMaterial color="#0d1120" wireframe transparent opacity={0.20} depthWrite={false} />
    </mesh>
  )
}

// A partial ring fragment — part of a larger structure that is no longer here
function AbandonedArc() {
  return (
    <mesh position={[POS[0] + 200, POS[1] - 100, POS[2] + 60]} rotation={[0.3, 0.8, 0.4]}>
      <torusGeometry args={[280, 4, 4, 80, Math.PI * 0.7]} />
      <meshBasicMaterial color="#0f172a" transparent opacity={0.22} depthWrite={false} />
    </mesh>
  )
}

export default function ForgottenRegion() {
  return (
    <group>
      {/* No halo — this region has no announcement.
          Nebula is sparse and very dark — the system doesn't want to look here. */}
      <NebulaCloud color="#0f172a" count={700} spread={280} opacity={0.09} position={POS} />
      <NebulaCloud color="#1e293b" count={300} spread={140} opacity={0.11} position={POS} />

      {/* Broken structural remnants */}
      <BrokenArm
        position={[POS[0] - 200, POS[1] + 80, POS[2]]}
        rotation={[0.18, 0.12, 0.85]}
        h={380}
      />
      <BrokenArm
        position={[POS[0] + 140, POS[1] - 100, POS[2] + 40]}
        rotation={[-0.28, 0.42, 1.5]}
        h={240}
      />
      <BrokenArm
        position={[POS[0] - 60, POS[1] + 220, POS[2] - 30]}
        rotation={[1.1, 0.22, 0.28]}
        h={300}
      />

      {/* Partial abandoned ring */}
      <AbandonedArc />

      {/* Debris scatter */}
      <ForgottenDebris />

      {/* Objects (3 total — very sparse) */}
      {region.objects.map(renderObject)}
    </group>
  )
}
