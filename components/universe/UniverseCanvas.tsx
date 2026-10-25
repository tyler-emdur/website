'use client'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import UniverseScene from './UniverseScene'

/**
 * Fires once the scene has resolved out of Suspense and mounted — which is the
 * real "there is something on the screen now" milestone, and the one the boot
 * panel waits for. A component rather than a `useEffect` in UniverseScene so
 * that scene stays about the scene.
 */
function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady])
  return null
}

export default function UniverseCanvas({
  onRenderer,
  onScene,
}: {
  /** The WebGL renderer exists. Everything after this is drawing, not loading. */
  onRenderer?: () => void
  /** The scene has mounted. */
  onScene?: () => void
}) {
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
      onCreated={() => onRenderer?.()}
    >
      <Suspense fallback={null}>
        <UniverseScene />
        {onScene && <SceneReady onReady={onScene} />}
      </Suspense>
    </Canvas>
  )
}
