'use client'
import { Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise, Scanline } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import CameraRig from './camera/CameraRig'
import IndexRegion from './regions/IndexRegion'
import RunningRegion from './regions/RunningRegion'
import ArchivesRegion from './regions/ArchivesRegion'
import ExploreRegion from './regions/ExploreRegion'
import LabRegion from './regions/LabRegion'
import ForgottenRegion from './regions/ForgottenRegion'
import OriginAnomaly from './objects/OriginAnomaly'
import CometSystem from './scene/CometSystem'
import VoidObjects from './scene/VoidObjects'
import PortalConcourse from './scene/PortalConcourse'
import GiantStructures from './scene/GiantStructures'
import SignalLayer from './scene/SignalLayer'
import CartographyLayer from './scene/CartographyLayer'
import GhostRemnants from './scene/GhostRemnants'
import { useProximityStore } from '@/lib/proximity-system'

// Syncs 3D camera position into Zustand store so HTML overlays can read it without window hacks
function CameraSync() {
  const { camera } = useThree()
  const setCameraPos = useProximityStore(s => s.setCameraPos)
  useFrame(() => {
    // Store camera position on window for legacy compatibility — overlays read this
    ;(window as any).__universeCamera = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    }
    // New proximity system
    setCameraPos([camera.position.x, camera.position.y, camera.position.z])
  })
  return null
}

export default function UniverseScene() {
  return (
    <>
      <color attach="background" args={['#000']} />
      
      {/* Very faint ambient light so things aren't completely pitch black */}
      <ambientLight intensity={0.02} />

      {/* Expanded ambient stars to cover the massive scale */}
      <Stars radius={12000} depth={4000} count={24000} factor={8} saturation={0.3} fade speed={0.35} />
      <Stars radius={4000} depth={1500} count={8000} factor={4} saturation={0.1} fade speed={0.08} />
      {/* Dense star cluster */}
      <Stars radius={1800} depth={600} count={4000} factor={3} saturation={0.05} fade speed={0.03} />

      {/* Camera controller + sync */}
      <CameraRig />
      <CameraSync />

      {/* Origin */}
      <OriginAnomaly />

      {/* Comet system */}
      <CometSystem />

      {/* Defined portal lanes */}
      <PortalConcourse />

      {/* 
        The world is organized into distinct "regions" / zones 
        Each has its own Nebula backdrop and objects.
      */}
      <group>
        <IndexRegion />
        <ArchivesRegion />
        <LabRegion />
        <ExploreRegion />
        <RunningRegion />
        <ForgottenRegion />
      </group>

      {/* Overlapping intelligence layers */}
      <SignalLayer />
      <CartographyLayer />

      {/* Giant background structures — scale + mystery */}
      <GiantStructures />

      {/* Ghost remnants — wireframe outlines of things that no longer exist */}
      <GhostRemnants />

      {/* Void objects — scattered between regions */}
      <VoidObjects />

      {/* Post processing */}
      <EffectComposer>
        <Bloom intensity={1.4} luminanceThreshold={0.15} luminanceSmoothing={0.9} mipmapBlur />
        <Noise opacity={0.08} blendFunction={BlendFunction.OVERLAY} />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.0015, 0.0015)} />
        <Scanline density={1.5} opacity={0.05} />
        <Vignette offset={0.3} darkness={0.85} eskil={false} />
      </EffectComposer>
    </>
  )
}
