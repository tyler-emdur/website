'use client'
import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Group, Mesh } from 'three'

interface GarageSceneProps {
  headlightsOn: boolean
  onToggleHeadlights: () => void
  trunkOpen: boolean
  onToggleTrunk: () => void
  onRadioClick: () => void
  foundCassettes: string[]
  onFindCassette: (id: string, label: string) => void
}

const CASSETTES: Array<{ id: string; label: string; position: [number, number, number] }> = [
  { id: 'garage-cassette-shelf',    label: 'MIX — SENIOR YEAR, I-70 WEST',   position: [5.15, 1.22, -3.35] },
  { id: 'garage-cassette-undercar', label: "SIDE B — DIDN'T FINISH RECORDING", position: [0, 0.16, 0.6] },
  { id: 'garage-cassette-toolbox',  label: 'PRACTICE TAPE — FIRST DEMO, 2016', position: [-4.35, 0.32, 2.75] },
]

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.36, 0.36, 0.28, 20]} />
      <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0.1} />
    </mesh>
  )
}

function Cassette({
  data, found, onFind,
}: {
  data: typeof CASSETTES[number]
  found: boolean
  onFind: (id: string, label: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <mesh
      position={data.position}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onFind(data.id, data.label) }}
      scale={hovered ? 1.25 : 1}
    >
      <boxGeometry args={[0.26, 0.05, 0.42]} />
      <meshStandardMaterial
        color={found ? '#F472B6' : '#5a4a30'}
        emissive={found ? '#F472B6' : '#ffb347'}
        emissiveIntensity={found ? 0.6 : (hovered ? 0.5 : 0.18)}
        roughness={0.6}
      />
    </mesh>
  )
}

function Car({
  headlightsOn, onToggleHeadlights, trunkOpen, onToggleTrunk,
}: { headlightsOn: boolean; onToggleHeadlights: () => void; trunkOpen: boolean; onToggleTrunk: () => void }) {
  const trunkRef = useRef<Group>(null)
  const headlightMatL = useRef<Mesh>(null)
  const headlightMatR = useRef<Mesh>(null)

  useFrame(() => {
    if (trunkRef.current) {
      const target = trunkOpen ? -1.1 : 0
      trunkRef.current.rotation.x += (target - trunkRef.current.rotation.x) * 0.12
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.1, 0.5, 4.1]} />
        <meshStandardMaterial color="#182338" roughness={0.35} metalness={0.55} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 0.98, -0.15]} castShadow>
        <boxGeometry args={[1.6, 0.42, 1.9]} />
        <meshStandardMaterial color="#0c1420" roughness={0.2} metalness={0.4} />
      </mesh>

      {/* wheels */}
      <Wheel position={[-1.08, 0.36, 1.45]} />
      <Wheel position={[1.08, 0.36, 1.45]} />
      <Wheel position={[-1.08, 0.36, -1.45]} />
      <Wheel position={[1.08, 0.36, -1.45]} />

      {/* headlights */}
      <mesh
        ref={headlightMatL}
        position={[-0.7, 0.55, 2.05]}
        onClick={(e) => { e.stopPropagation(); onToggleHeadlights() }}
      >
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          color={headlightsOn ? '#fff6d8' : '#8a8a8a'}
          emissive={headlightsOn ? '#ffdf8c' : '#3a3a3a'}
          emissiveIntensity={headlightsOn ? 2.2 : 0.4}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <mesh
        ref={headlightMatR}
        position={[0.7, 0.55, 2.05]}
        onClick={(e) => { e.stopPropagation(); onToggleHeadlights() }}
      >
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          color={headlightsOn ? '#fff6d8' : '#8a8a8a'}
          emissive={headlightsOn ? '#ffdf8c' : '#3a3a3a'}
          emissiveIntensity={headlightsOn ? 2.2 : 0.4}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      {headlightsOn && (
        <>
          <spotLight position={[-0.7, 0.55, 2.1]} target-position={[-0.9, 0, 8]} angle={0.5} penumbra={0.6} intensity={90} color="#ffdf8c" distance={16} />
          <spotLight position={[0.7, 0.55, 2.1]} target-position={[0.9, 0, 8]} angle={0.5} penumbra={0.6} intensity={90} color="#ffdf8c" distance={16} />
        </>
      )}

      {/* taillights, always faintly lit */}
      <mesh position={[-0.75, 0.6, -2.05]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#5a0d0d" emissive="#ff2b3a" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.75, 0.6, -2.05]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#5a0d0d" emissive="#ff2b3a" emissiveIntensity={0.6} />
      </mesh>

      {/* trunk lid — pivots open around back edge */}
      <group position={[0, 0.78, -1.95]} ref={trunkRef}>
        <mesh
          position={[0, 0, -0.15]}
          onClick={(e) => { e.stopPropagation(); onToggleTrunk() }}
        >
          <boxGeometry args={[2.05, 0.06, 0.35]} />
          <meshStandardMaterial color="#1e2c46" roughness={0.35} metalness={0.5} />
        </mesh>
        {/* release button — lit affordance so the trunk reads as interactive in the dark */}
        <mesh
          position={[0, 0.07, -0.02]}
          onClick={(e) => { e.stopPropagation(); onToggleTrunk() }}
        >
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial
            color={trunkOpen ? '#fff2d0' : '#ffb347'}
            emissive={trunkOpen ? '#fff2d0' : '#ffb347'}
            emissiveIntensity={trunkOpen ? 2.5 : 1.6}
          />
        </mesh>
        <pointLight position={[0, 0.1, -0.02]} intensity={trunkOpen ? 4 : 1.5} distance={1.2} color="#ffb347" />
      </group>
      {trunkOpen && (
        <pointLight position={[0, 1.1, -2.3]} intensity={20} distance={5} color="#fff2d0" />
      )}
    </group>
  )
}

function Radio({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <group position={[5.15, 1.02, -3.6]}>
      <mesh
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        scale={hovered ? 1.08 : 1}
      >
        <boxGeometry args={[0.55, 0.3, 0.3]} />
        <meshStandardMaterial color="#2b2620" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, 0.16]}>
        <circleGeometry args={[0.07, 20]} />
        <meshStandardMaterial color="#ffb347" emissive="#ffb347" emissiveIntensity={0.9} />
      </mesh>
    </group>
  )
}

function Garage() {
  return (
    <group>
      {/* floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[13, 11]} />
        <meshStandardMaterial color="#14171b" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 2, -5.4]}>
        <planeGeometry args={[13, 4.4]} />
        <meshStandardMaterial color="#191c21" roughness={0.95} />
      </mesh>
      {/* left wall — corrugated garage door look */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-6.4, 0.3 + i * 0.46, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[10.6, 0.42, 0.06]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#20242a' : '#191c21'} roughness={0.8} metalness={0.15} />
        </mesh>
      ))}
      {/* right wall */}
      <mesh position={[6.4, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10.6, 4.4]} />
        <meshStandardMaterial color="#191c21" roughness={0.95} />
      </mesh>
      {/* pegboard tool silhouettes on right wall */}
      {[[-2.6, 3.1], [-2.0, 3.1], [-1.4, 3.1], [-2.3, 2.5]].map(([z, y], i) => (
        <mesh key={i} position={[6.32, y, z]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[0.05, 0.45, 0.09]} />
          <meshStandardMaterial color="#0d0e10" roughness={0.7} />
        </mesh>
      ))}

      {/* workbench */}
      <mesh position={[5.15, 0.55, -3.6]}>
        <boxGeometry args={[1.7, 1.0, 1.0]} />
        <meshStandardMaterial color="#332318" roughness={0.85} />
      </mesh>

      {/* toolbox */}
      <mesh position={[-4.5, 0.24, 2.55]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.75, 0.42, 0.48]} />
        <meshStandardMaterial color="#7a1f1f" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* hanging bulb */}
      <mesh position={[0, 3.6, -1]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#fff3cf" emissive="#ffd98c" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0, 3.6, -1]} intensity={45} distance={12} color="#ffd98c" />
      <pointLight position={[0, 2.2, -4.6]} intensity={10} distance={7} color="#4a5a8a" />
    </group>
  )
}

export default function GarageScene({
  headlightsOn, onToggleHeadlights, trunkOpen, onToggleTrunk, onRadioClick, foundCassettes, onFindCassette,
}: GarageSceneProps) {
  return (
    <Canvas
      camera={{ position: [3.4, 3.4, 6.2], fov: 48 }}
      style={{
        background: '#05070a',
        imageRendering: 'pixelated',
      }}
      dpr={0.22}
      gl={{ antialias: false, alpha: false }}
      shadows={false}
    >
      <fog attach="fog" args={['#05070a', 9, 22]} />
      <ambientLight intensity={1.1} color="#4a5a7a" />
      <hemisphereLight args={['#5a6a8a', '#0a0a0a', 0.9]} />

      <Garage />
      <Car headlightsOn={headlightsOn} onToggleHeadlights={onToggleHeadlights} trunkOpen={trunkOpen} onToggleTrunk={onToggleTrunk} />
      <Radio onClick={onRadioClick} />
      {CASSETTES.map(c => (
        <Cassette key={c.id} data={c} found={foundCassettes.includes(c.id)} onFind={onFindCassette} />
      ))}

      <OrbitControls
        target={[0, 0.7, 0]}
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={9}
        minPolarAngle={0.35}
        maxPolarAngle={1.35}
        rotateSpeed={0.5}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  )
}
