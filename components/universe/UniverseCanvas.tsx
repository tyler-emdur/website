'use client'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import UniverseScene from './UniverseScene'

export default function UniverseCanvas() {
  return (
    <Canvas
      camera={{ position: [120, -80, 1640], fov: 52, near: 1, far: 45000 }}
      // touchAction is load-bearing on phones. Left at the default, the
      // browser claims any one-finger drag as a scroll gesture, fires
      // pointercancel, and stops sending pointermove — so the hub, which is
      // the only way to reach anything, could not be panned by touch at all.
      // The other three worlds get this for free from drei's OrbitControls;
      // this camera is hand-rolled, so it has to say so itself.
      style={{ background: '#00000d', touchAction: 'none' }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <Suspense fallback={null}>
        <UniverseScene />
      </Suspense>
    </Canvas>
  )
}
