'use client'
import { useMemo } from 'react'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'
import * as THREE from 'three'

const region = REGIONS.find(r => r.id === 'running')!
const COLOR = '#F97316'
const POS = region.position

// Geological debris — scattered rock particles suggesting mountain terrain.
// Dense below the main objects, sparse above. Nothing like a solar system.
function TerrainDebris() {
  const geo = useMemo(() => {
    const n = 480
    const pos = new Float32Array(n * 3)
    const [bx, by, bz] = POS
    for (let i = 0; i < n; i++) {
      const angle = (i * 2.399) // golden angle spread
      const dist = 80 + (i * 1.3 % 360)
      // Biased downward — more debris below the cluster
      const vertical = ((i * 37) % 400) - 280
      const jitter = (i * 11) % 80
      pos[i * 3]     = bx + Math.cos(angle) * dist + jitter - 40
      pos[i * 3 + 1] = by + vertical
      pos[i * 3 + 2] = bz + Math.sin(angle) * dist * 0.55 + ((i * 7) % 100) - 50
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])

  return (
    <points geometry={geo}>
      <pointsMaterial
        size={3.2}
        color="#7c3a12"
        transparent
        opacity={0.38}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function RunningRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={2200} spread={380} opacity={0.25} position={POS} />
      <NebulaCloud color="#DC2626" count={900} spread={180} opacity={0.15} position={POS} />
      <TerrainDebris />
      {region.objects.map(renderObject)}
    </group>
  )
}
