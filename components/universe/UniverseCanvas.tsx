'use client'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import UniverseScene from './UniverseScene'

export default function UniverseCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 900], fov: 60, near: 1, far: 8000 }}
      style={{ background: '#00000d' }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <Suspense fallback={null}>
        <UniverseScene />
      </Suspense>
    </Canvas>
  )
}
