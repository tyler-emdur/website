'use client'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'projects')!
const COLOR = '#3B82F6'
const POS = region.position

export default function ProjectsRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={2500} spread={420} opacity={0.28} position={POS} />
      <NebulaCloud color="#1D4ED8" count={1000} spread={200} opacity={0.18} position={POS} />
      {region.objects.map(renderObject)}
    </group>
  )
}
