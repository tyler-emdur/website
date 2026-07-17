'use client'
import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Mesh, MeshStandardMaterial, PerspectiveCamera, SpotLight } from 'three'
import RadioGlobe from './RadioGlobe'
import type { RadioStation } from '@/app/api/radio/route'

// The Garage, seen from the driver's seat. You are nosed in to a closed
// corrugated door at 12:47 AM, engine off. The windshield frames the door; the
// dashboard (radio, gauges, ignition) is drawn over this in the DOM. Flip the
// headlights and two pools bloom on the door ahead of you.
//
// The radio globe (World 6's "tune by place" view) shares this same Canvas —
// swapped in as an alternate scene rather than mounted as a second Canvas, so
// the world only ever holds one live WebGL context.

interface GarageSceneProps {
  headlightsOn: boolean
  engineOn: boolean
  globeMode?: boolean
  stations?: RadioStation[]
  activeStationId?: string | null
  onSelectStation?: (s: RadioStation) => void
}

// snaps the shared camera between the driver's-seat framing and the globe framing
function CameraRig({ globe }: { globe: boolean }) {
  const { camera } = useThree()
  useEffect(() => {
    const cam = camera as PerspectiveCamera
    if (globe) {
      cam.position.set(0, 0.4, 4.6)
      cam.fov = 42
    } else {
      cam.position.set(0, 1.16, 1.0)
      cam.fov = 66
    }
    cam.updateProjectionMatrix()
  }, [globe, camera])
  return null
}

// ── the closed garage door filling the view ahead ────────────────────────────
function GarageDoor({ lit }: { lit: number }) {
  // horizontal slats, a row of frosted windows near the top letting night in
  const SLATS = 11
  const H = 4.4
  const slatH = H / SLATS
  return (
    <group position={[0, 2.0, -4.6]}>
      {Array.from({ length: SLATS }).map((_, i) => {
        const y = -H / 2 + slatH * (i + 0.5)
        const isWindowRow = i === SLATS - 3
        return (
          <group key={i} position={[0, y, 0]}>
            <mesh>
              <boxGeometry args={[7.2, slatH * 0.94, 0.12]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#3c3f45' : '#33363c'}
                roughness={0.8}
                metalness={0.2}
                emissive="#0a0b0d"
                emissiveIntensity={lit * 0.25}
              />
            </mesh>
            {/* slat lip shadow line */}
            <mesh position={[0, -slatH * 0.47, 0.061]}>
              <boxGeometry args={[7.2, 0.02, 0.02]} />
              <meshStandardMaterial color="#111214" roughness={1} />
            </mesh>
            {isWindowRow && Array.from({ length: 4 }).map((_, w) => (
              <mesh key={w} position={[-2.7 + w * 1.8, 0, 0.07]}>
                <boxGeometry args={[1.25, slatH * 0.6, 0.02]} />
                <meshStandardMaterial
                  color="#0c1420"
                  emissive="#243a5a"
                  emissiveIntensity={0.5}
                  roughness={0.3}
                  metalness={0.1}
                />
              </mesh>
            ))}
          </group>
        )
      })}
      {/* rails on either side */}
      {[-3.75, 3.75].map(x => (
        <mesh key={x} position={[x, 0, -0.1]}>
          <boxGeometry args={[0.12, H, 0.14]} />
          <meshStandardMaterial color="#1a1c1f" roughness={0.7} metalness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Garage({ headlightsOn }: { headlightsOn: boolean }) {
  const spotL = useRef<SpotLight>(null)
  const spotR = useRef<SpotLight>(null)
  const doorMat = useRef<MeshStandardMaterial>(null)
  const litRef = useRef(0)

  useFrame(() => {
    const target = headlightsOn ? 1 : 0
    litRef.current += (target - litRef.current) * 0.08
    const v = litRef.current
    if (spotL.current) spotL.current.intensity = v * 55
    if (spotR.current) spotR.current.intensity = v * 55
  })

  return (
    <group>
      {/* concrete floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.5]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#111316" roughness={0.95} metalness={0.03} />
      </mesh>
      {/* faint oil stain under the car */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]}>
        <circleGeometry args={[1.4, 24]} />
        <meshStandardMaterial color="#08090a" roughness={1} transparent opacity={0.7} />
      </mesh>

      <GarageDoor lit={headlightsOn ? 1 : 0} />

      {/* side walls */}
      <mesh position={[-6.2, 2, -1.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial ref={doorMat} color="#1a1d21" roughness={0.96} />
      </mesh>
      <mesh position={[6.2, 2, -1.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color="#1a1d21" roughness={0.96} />
      </mesh>
      {/* ceiling */}
      <mesh position={[0, 4.4, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#0e1013" roughness={1} />
      </mesh>

      {/* pegboard + tool silhouettes on the right wall */}
      {[[-3.4, 3.0], [-2.7, 3.0], [-2.0, 3.0], [-3.0, 2.4], [-2.3, 2.4]].map(([z, y], i) => (
        <mesh key={i} position={[6.1, y, z]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[0.05, 0.5, 0.1]} />
          <meshStandardMaterial color="#0b0c0e" roughness={0.8} />
        </mesh>
      ))}
      {/* workbench on the right */}
      <mesh position={[5.4, 0.6, -3.4]}>
        <boxGeometry args={[1.5, 1.1, 1.0]} />
        <meshStandardMaterial color="#2a2018" roughness={0.9} />
      </mesh>

      {/* hanging bulb, warm, swinging faintly */}
      <SwingingBulb />

      {/* headlight pools */}
      <spotLight
        ref={spotL}
        position={[-0.75, 0.75, -1.4]}
        target-position={[-1.3, 1.6, -4.5]}
        angle={0.55} penumbra={0.7} intensity={0} color="#fff1cf" distance={9}
      />
      <spotLight
        ref={spotR}
        position={[0.75, 0.75, -1.4]}
        target-position={[1.3, 1.6, -4.5]}
        angle={0.55} penumbra={0.7} intensity={0} color="#fff1cf" distance={9}
      />

      {/* the car's cowl / hood lip at the base of the windshield */}
      <mesh position={[0, 0.62, 0.55]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[3.4, 0.5, 1.4]} />
        <meshStandardMaterial color="#0a0c10" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  )
}

function SwingingBulb() {
  const g = useRef<Mesh>(null)
  const light = useRef<import('three').PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const sway = Math.sin(t * 0.6) * 0.04 + Math.sin(t * 0.23) * 0.02
    if (g.current) g.current.position.x = sway
    if (light.current) {
      light.current.position.x = sway
      light.current.intensity = 12 + Math.sin(t * 7.3) * Math.sin(t * 2.1) * 0.6  // faint filament flicker
    }
  })
  return (
    <group position={[0.6, 3.9, -2.4]}>
      <mesh ref={g}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fff3cf" emissive="#ffd98c" emissiveIntensity={1.6} />
      </mesh>
      <pointLight ref={light} intensity={24} distance={11} color="#ffd7a0" />
    </group>
  )
}

export default function GarageScene({
  headlightsOn, globeMode = false, stations = [], activeStationId = null, onSelectStation,
}: GarageSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.16, 1.0], fov: 66 }}
      style={{ background: globeMode ? 'transparent' : '#050608' }}
      dpr={[0.9, 1.5]}
      gl={{ antialias: true, alpha: globeMode }}
      shadows={false}
    >
      <CameraRig globe={globeMode} />
      {globeMode ? (
        <>
          <RadioGlobe stations={stations} activeId={activeStationId} onSelect={s => onSelectStation?.(s)} />
          <OrbitControls
            key="globe"
            enablePan={false}
            enableZoom
            minDistance={2.8}
            maxDistance={7}
            autoRotate
            autoRotateSpeed={0.6}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.5}
          />
        </>
      ) : (
        <>
          <fog attach="fog" args={['#080a0c', 7, 20]} />
          <ambientLight intensity={0.92} color="#4c5a76" />
          <hemisphereLight args={['#5a6c8c', '#141416', 0.85]} />
          {/* faint warm dashboard glow from below */}
          <pointLight position={[0, 0.8, 1.2]} intensity={3} distance={3.8} color="#ffb060" />
          {/* cool moonlight fill on the door so it clearly reads as a garage door ahead */}
          <pointLight position={[0, 2.8, -2.2]} intensity={9} distance={11} color="#31415f" />
          <pointLight position={[0, 1.6, -3.6]} intensity={5} distance={7} color="#26344c" />

          <Garage headlightsOn={headlightsOn} />

          <OrbitControls
            key="interior"
            target={[0, 1.05, -0.6]}
            enablePan={false}
            enableZoom={false}
            minPolarAngle={1.15}
            maxPolarAngle={1.62}
            minAzimuthAngle={-0.5}
            maxAzimuthAngle={0.5}
            rotateSpeed={-0.32}
            enableDamping
            dampingFactor={0.08}
          />
        </>
      )}
    </Canvas>
  )
}
