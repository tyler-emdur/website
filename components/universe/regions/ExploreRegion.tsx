'use client'
import { REGIONS } from '@/lib/universe-store'
import Planet from '../objects/Planet'
import Anomaly from '../objects/Anomaly'
import Signal from '../objects/Signal'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'explore')!
const COLOR = '#22C55E'
const POS = region.position

export default function ExploreRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={2000} spread={400} opacity={0.24} position={POS} />
      <NebulaCloud color="#15803D" count={900} spread={200} opacity={0.2} position={POS} />

      {region.objects.map(obj => {
        if (obj.type === 'planet') return <Planet key={obj.id} obj={obj} />
        if (obj.type === 'anomaly') return <Anomaly key={obj.id} obj={obj} />
        if (obj.type === 'signal') return <Signal key={obj.id} obj={obj} />
        return null
      })}
    </group>
  )
}
