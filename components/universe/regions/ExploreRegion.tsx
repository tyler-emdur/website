'use client'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'explore')!
const COLOR = '#22C55E'
const POS = region.position

// Survey stakes — thin vertical markers left by an expedition.
// Abandoned. Instruments unreadable. Positions logged, purpose unclear.
const STAKES = [
  { pos: [440, -658, 32] as [number, number, number], h: 48 },
  { pos: [558, -572, -18] as [number, number, number], h: 63 },
  { pos: [483, -728, 44] as [number, number, number], h: 54 },
  { pos: [542, -618, 12] as [number, number, number], h: 44 },
  { pos: [408, -685, -8] as [number, number, number], h: 70 },
  { pos: [595, -648, 38] as [number, number, number], h: 51 },
  { pos: [462, -558, -32] as [number, number, number], h: 59 },
  { pos: [520, -700, 22] as [number, number, number], h: 42 },
  { pos: [380, -620, 18] as [number, number, number], h: 66 },
]

function SurveyStakes() {
  return (
    <group>
      {STAKES.map((s, i) => (
        <group key={i} position={s.pos}>
          <mesh>
            <boxGeometry args={[1.5, s.h, 1.5]} />
            <meshBasicMaterial color="#0f2a0f" transparent opacity={0.55} depthWrite={false} />
          </mesh>
          {/* Small marker at top */}
          <mesh position={[0, s.h / 2 + 3, 0]}>
            <boxGeometry args={[7, 5, 1]} />
            <meshBasicMaterial color="#22C55E" transparent opacity={0.28} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function ExploreRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={2000} spread={400} opacity={0.24} position={POS} />
      <NebulaCloud color="#15803D" count={900} spread={200} opacity={0.2} position={POS} />
      <SurveyStakes />
      {region.objects.map(renderObject)}
    </group>
  )
}
