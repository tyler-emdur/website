'use client'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'lab')!
const COLOR = '#A855F7'
const POS = region.position

export default function LabRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={2200} spread={360} opacity={0.3} position={POS} />
      <NebulaCloud color="#7C3AED" count={1000} spread={160} opacity={0.22} position={POS} />
      {region.objects.map(renderObject)}
    </group>
  )
}
