'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, Points, AdditiveBlending, Color } from 'three'
import * as THREE from 'three'

interface NebulaCloudProps {
  color: string
  count?: number
  spread?: number
  opacity?: number
  position?: [number, number, number]
}

export default function NebulaCloud({ color, count = 3000, spread = 380, opacity = 0.35, position = [0, 0, 0] }: NebulaCloudProps) {
  const ref = useRef<Points>(null)

  const { positions, opacities } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const opacities = new Float32Array(count)
    const r = spread / 2

    for (let i = 0; i < count; i++) {
      // Ellipsoidal distribution — flat in z axis for nebula look
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const radius = Math.pow(Math.random(), 0.6) * r

      positions[i * 3]     = Math.sin(phi) * Math.cos(theta) * radius
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.55
      positions[i * 3 + 2] = Math.cos(phi) * radius * 0.3

      opacities[i] = Math.random()
    }

    return { positions, opacities }
  }, [count, spread])

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geo.setAttribute('aOpacity', new Float32BufferAttribute(opacities, 1))
    return geo
  }, [positions, opacities])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.003
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.002) * 0.05
    }
  })

  return (
    <points ref={ref} geometry={geometry} position={position}>
      <pointsMaterial
        color={new Color(color)}
        size={2.2}
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// Outer halo cloud — larger, sparser
export function NebulaHalo({ color, position = [0, 0, 0] }: { color: string; position?: [number, number, number] }) {
  const geo = useMemo(() => {
    const count = 1200
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 250 + Math.random() * 350
      pos[i * 3]     = Math.cos(angle) * r
      pos[i * 3 + 1] = (Math.random() - 0.5) * 180
      pos[i * 3 + 2] = Math.sin(angle) * r * 0.25
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])

  return (
    <points geometry={geo} position={position}>
      <pointsMaterial
        color={new Color(color)}
        size={1.2}
        transparent
        opacity={0.12}
        sizeAttenuation
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
