'use client'
import { Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import CameraRig from './camera/CameraRig'

function CameraSync() {
  const { camera } = useThree()
  useFrame(() => {
    ;(window as any).__universeCamera = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
  })
  return null
}
import ProjectsRegion from './regions/ProjectsRegion'
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

export default function UniverseScene() {
  return (
    <>
      {/* Expanded ambient stars to cover the massive scale */}
      <Stars radius={12000} depth={4000} count={24000} factor={8} saturation={0.3} fade speed={0.35} />
      <Stars radius={4000} depth={1500} count={8000} factor={4} saturation={0.1} fade speed={0.08} />
      {/* Dense star cluster */}
      <Stars radius={1800} depth={600} count={4000} factor={3} saturation={0.05} fade speed={0.03} />

      {/* Lighting */}
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 0, 500]} intensity={1.5} color="#ffffff" />

      {/* Camera controller + sync */}
      <CameraRig />
      <CameraSync />

      {/* Origin */}
      <OriginAnomaly />

      {/* Comet system */}
      <CometSystem />

      {/* Defined portal lanes */}
      <PortalConcourse />

      {/* Overlapping intelligence layers */}
      <SignalLayer />
      <CartographyLayer />

      {/* Giant background structures — scale + mystery */}
      <GiantStructures />

      {/* Ghost remnants — wireframe outlines of things that no longer exist */}
      <GhostRemnants />

      {/* Void objects — scattered between regions */}
      <VoidObjects />

      {/* Galaxy regions */}
      <ProjectsRegion />
      <RunningRegion />
      <ArchivesRegion />
      <ExploreRegion />
      <LabRegion />
      <ForgottenRegion />

      {/* Post processing */}
      <EffectComposer>
        <Bloom intensity={1.4} luminanceThreshold={0.15} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette offset={0.3} darkness={0.85} />
      </EffectComposer>
    </>
  )
}
