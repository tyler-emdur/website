'use client'
import { REGIONS } from '@/lib/universe-store'
import Anomaly from '../objects/Anomaly'
import Station from '../objects/Station'
import Wormhole from '../objects/Wormhole'
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

      {region.objects.map(obj => {
        if (obj.type === 'anomaly') return <Anomaly key={obj.id} obj={obj} />
        if (obj.type === 'station') return <Station key={obj.id} obj={obj} />
        if (obj.type === 'wormhole') return <Wormhole key={obj.id} obj={obj} />
        return null
      })}
    </group>
  )
}
