'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { REGIONS } from '@/lib/universe-store'
import Station from '../objects/Station'
import Wormhole from '../objects/Wormhole'
import Anomaly from '../objects/Anomaly'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'archives')!
const COLOR = '#B45309'
const POS = region.position

// Floating debris field around the archive
function DebrisField() {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.02
  })

  const pieces = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2
    const r = 80 + Math.random() * 120
    return {
      x: POS[0] + Math.cos(angle) * r,
      y: POS[1] + (Math.random() - 0.5) * 60,
      z: Math.sin(angle) * r * 0.3,
      s: 1.5 + Math.random() * 3,
    }
  })

  return (
    <group ref={ref}>
      {pieces.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
          <boxGeometry args={[p.s, p.s * 0.6, p.s * 0.4]} />
          <meshStandardMaterial color="#78350F" emissive="#92400E" emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  )
}

export default function ArchivesRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={1800} spread={320} opacity={0.22} position={POS} />
      <NebulaCloud color="#78350F" count={800} spread={180} opacity={0.3} position={POS} />

      <DebrisField />

      {region.objects.map(obj => {
        if (obj.type === 'station') return <Station key={obj.id} obj={obj} />
        if (obj.type === 'wormhole') return <Wormhole key={obj.id} obj={obj} />
        if (obj.type === 'fragment') return <Anomaly key={obj.id} obj={{ ...obj, type: 'anomaly' }} />
        return null
      })}
    </group>
  )
}
