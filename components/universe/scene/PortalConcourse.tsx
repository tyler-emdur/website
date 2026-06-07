'use client'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Group } from 'three'

function Lane({ radius, color, opacity }: { radius: number; color: string; opacity: number }) {
  return (
    <mesh rotation={[0, 0, 0]}>
      <ringGeometry args={[radius - 2, radius + 2, 160]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

function Spoke({ angle, length }: { angle: number; length: number }) {
  return (
    <mesh position={[Math.cos(angle) * length / 2, Math.sin(angle) * length / 2, -2]} rotation={[0, 0, angle]}>
      <planeGeometry args={[length, 1.2]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.055} depthWrite={false} />
    </mesh>
  )
}

export default function PortalConcourse() {
  const ref = useRef<Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.012
  })

  return (
    <group ref={ref} position={[0, 0, -10]}>
      <Lane radius={320} color="#CAFF00" opacity={0.11} />
      <Lane radius={620} color="#ffffff" opacity={0.07} />
      {Array.from({ length: 16 }).map((_, i) => (
        <Spoke key={i} angle={(i / 16) * Math.PI * 2} length={650} />
      ))}
    </group>
  )
}
