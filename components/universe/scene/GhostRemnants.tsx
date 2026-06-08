'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Wireframe outlines of things that no longer exist.
// No interaction. No label. Just presence.
// They breathe slowly so you can't quite be sure if they're moving.

const GHOSTS: Array<{
  pos: [number, number, number]
  type: 'sphere' | 'torus' | 'box'
  r: number
  phase: number
}> = [
  { pos: [-820,  1160, -180], type: 'sphere', r: 48,  phase: 0.0 },
  { pos: [1360,  -580,   90], type: 'torus',  r: 75,  phase: 1.2 },
  { pos: [-1900,  440, -260], type: 'box',    r: 36,  phase: 2.4 },
  { pos: [ 580, -1900,  180], type: 'sphere', r: 62,  phase: 0.7 },
  { pos: [-440, -1100,  280], type: 'torus',  r: 110, phase: 1.9 },
  { pos: [2180,  1040, -120], type: 'sphere', r: 44,  phase: 3.1 },
  { pos: [-2100, -580,  360], type: 'box',    r: 88,  phase: 0.5 },
  { pos: [  820, 2380,  -80], type: 'torus',  r: 58,  phase: 2.2 },
  { pos: [ -680,  820,  240], type: 'sphere', r: 40,  phase: 1.6 },
  { pos: [3100,  -820, -180], type: 'sphere', r: 52,  phase: 2.8 },
  { pos: [-1400,  -200, 400], type: 'torus',  r: 95,  phase: 0.9 },
  { pos: [1100,  1600, -340], type: 'box',    r: 55,  phase: 3.5 },
]

function Ghost({ pos, type, r, phase }: (typeof GHOSTS)[0]) {
  const ref = useRef<THREE.Mesh>(null)

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#1e293b',
    wireframe: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }), [])

  useFrame((state) => {
    if (!ref.current) return
    // Slow breathing — period ~35s with phase offsets so they're never all visible at once
    mat.opacity = (Math.sin(state.clock.elapsedTime * 0.18 + phase) * 0.5 + 0.5) * 0.068
  })

  return (
    <mesh ref={ref} position={pos} material={mat}>
      {type === 'sphere' && <sphereGeometry args={[r, 7, 6]} />}
      {type === 'torus'  && <torusGeometry  args={[r, r * 0.055, 4, 22]} />}
      {type === 'box'    && <boxGeometry    args={[r, r * 1.9, r * 0.85]} />}
    </mesh>
  )
}

export default function GhostRemnants() {
  return (
    <group>
      {GHOSTS.map((g, i) => <Ghost key={i} {...g} />)}
    </group>
  )
}
