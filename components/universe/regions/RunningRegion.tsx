'use client'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'running')!
const COLOR = '#F97316'
const POS = region.position

export default function RunningRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={2200} spread={380} opacity={0.25} position={POS} />
      <NebulaCloud color="#DC2626" count={900} spread={180} opacity={0.15} position={POS} />
      {region.objects.map(renderObject)}
    </group>
  )
}
