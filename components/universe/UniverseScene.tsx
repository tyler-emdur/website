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
import OriginAnomaly from './objects/OriginAnomaly'
import CometSystem from './scene/CometSystem'
import VoidObjects from './scene/VoidObjects'
import PortalConcourse from './scene/PortalConcourse'
import GiantStructures from './scene/GiantStructures'

export default function UniverseScene() {
  return (
    <>
      {/* Ambient stars — multiple layers for depth */}
      <Stars radius={3000} depth={600} count={12000} factor={5} saturation={0.3} fade speed={0.4} />
      <Stars radius={800} depth={200} count={4000} factor={3} saturation={0.1} fade speed={0.1} />
      {/* Dense star cluster — upper right, asymmetric, creates contrast with voids */}
      <Stars radius={400} depth={80} count={2200} factor={2} saturation={0.05} fade speed={0.05} />

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

      {/* Giant background structures — scale + mystery */}
      <GiantStructures />

      {/* Void objects — scattered between regions */}
      <VoidObjects />

      {/* Galaxy regions */}
      <ProjectsRegion />
      <RunningRegion />
      <ArchivesRegion />
      <ExploreRegion />
      <LabRegion />

      {/* Post processing */}
      <EffectComposer>
        <Bloom intensity={1.4} luminanceThreshold={0.15} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette offset={0.3} darkness={0.85} />
      </EffectComposer>
    </>
  )
}
