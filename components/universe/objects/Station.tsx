'use client'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'

interface StationProps { obj: UniverseObject }

export default function Station({ obj }: StationProps) {
  const groupRef = useRef<Group>(null)
  const ringRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const { selectObject, isVisible } = useUniverseStore()

  const visible = isVisible(obj)

  useFrame((state) => {
    if (!groupRef.current || !ringRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.y = t * 0.1
    ringRef.current.rotation.z = t * 0.4
  })

  if (!visible) return null
  const s = (obj.size ?? 14) / 14

  return (
    <group
      ref={groupRef}
      position={obj.position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
    >
      {/* Core cylinder */}
      <mesh>
        <cylinderGeometry args={[s * 5, s * 5, s * 18, 8]} />
        <meshStandardMaterial color={obj.color} emissive={obj.color} emissiveIntensity={hovered ? 0.6 : 0.2} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cross arms */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[s * 2, s * 2, s * 40, 6]} />
        <meshStandardMaterial color={obj.color} emissive={obj.color} emissiveIntensity={0.15} metalness={0.9} />
      </mesh>

      {/* Rotating ring */}
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[s * 16, s * 1.5, 8, 32]} />
          <meshStandardMaterial color={obj.color} emissive={obj.color} emissiveIntensity={hovered ? 0.5 : 0.1} wireframe />
        </mesh>
      </group>
    </group>
  )
}
