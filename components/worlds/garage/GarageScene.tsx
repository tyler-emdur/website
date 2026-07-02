'use client'
import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Group, Mesh } from 'three'

// Driver's seat. You are sitting inside the car, in a dark garage at 12:47 AM.
// Ahead through the windshield: the closed garage door. Around you: the dash,
// the wheel, the console radio, the glovebox. Turn the key and the door is the
// last thing you see before the road. Everything is interactive from the seat.

interface GarageSceneProps {
  headlightsOn: boolean
  onToggleHeadlights: () => void
  gloveboxOpen: boolean
  onToggleGlovebox: () => void
  onRadioClick: () => void
  radioActive: boolean
  onIgnition: () => void
  igniting: boolean
  foundCassettes: string[]
  onFindCassette: (id: string, label: string) => void
}

const CASSETTES: Array<{ id: string; label: string; position: [number, number, number]; rot?: [number, number, number] }> = [
  { id: 'garage-cassette-shelf',    label: 'MIX — SENIOR YEAR, I-70 WEST',    position: [0.36, 1.40, -0.60], rot: [0.5, 0, 0.1] },   // clipped to the sun visor
  { id: 'garage-cassette-undercar', label: "SIDE B — DIDN'T FINISH RECORDING", position: [0.30, 0.505, 0.34], rot: [0, 0.4, 0] },      // on the passenger seat
  { id: 'garage-cassette-toolbox',  label: 'PRACTICE TAPE — FIRST DEMO, 2016', position: [-0.86, 0.52, 0.28], rot: [0, 0.5, 0.35] },   // in the driver door pocket
]

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
      rotation={data.rot ?? [0, 0, 0]}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onFind(data.id, data.label) }}
      scale={hovered ? 1.35 : 1}
    >
      <boxGeometry args={[0.14, 0.03, 0.22]} />
      <meshStandardMaterial
        color={found ? '#F472B6' : '#5a4a30'}
        emissive={found ? '#F472B6' : '#ffb347'}
        emissiveIntensity={found ? 0.7 : (hovered ? 0.6 : 0.22)}
        roughness={0.6}
      />
    </mesh>
  )
}

// A soft, clickable control surface with an emissive face.
function Control({
  position, size, rotation, color, glow, glowColor, onClick, children,
}: {
  position: [number, number, number]
  size: [number, number, number]
  rotation?: [number, number, number]
  color: string
  glow: number
  glowColor: string
  onClick: () => void
  children?: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <group position={position} rotation={rotation}>
      <mesh
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onClick() }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={glow + (hovered ? 0.5 : 0)}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
      {children}
    </group>
  )
}

function SteeringWheel({ igniting }: { igniting: boolean }) {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    // faint idle sway; a small kick while the starter cranks
    const t = state.clock.elapsedTime
    const idle = Math.sin(t * 0.7) * 0.015
    const crank = igniting ? Math.sin(t * 40) * 0.03 : 0
    ref.current.rotation.z = idle + crank
  })
  return (
    <group position={[-0.32, 0.74, -0.5]} rotation={[1.28, 0, 0]}>
      <group ref={ref}>
        {/* rim */}
        <mesh>
          <torusGeometry args={[0.175, 0.02, 12, 32]} />
          <meshStandardMaterial color="#14100c" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* hub */}
        <mesh position={[0, 0, 0.01]}>
          <cylinderGeometry args={[0.055, 0.055, 0.03, 16]} />
          <meshStandardMaterial color="#0c0a08" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* spokes */}
        {[0, 2.094, 4.188].map((a, i) => (
          <mesh key={i} rotation={[0, 0, a]} position={[Math.cos(a + Math.PI / 2) * 0.09, Math.sin(a + Math.PI / 2) * 0.09, 0]}>
            <boxGeometry args={[0.022, 0.16, 0.02]} />
            <meshStandardMaterial color="#14100c" roughness={0.7} />
          </mesh>
        ))}
      </group>
      {/* column */}
      <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.035, 0.26, 12]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  )
}

function CarInterior({
  headlightsOn, onToggleHeadlights, gloveboxOpen, onToggleGlovebox,
  onRadioClick, radioActive, onIgnition, igniting, foundCassettes, onFindCassette,
}: GarageSceneProps) {
  const bodyColor = '#131c2c'
  const trim = '#0b0d11'
  return (
    <group>
      {/* ── hood: the car's own metal, seen out the windshield ── */}
      <mesh position={[0, 0.64, -2.3]} rotation={[-0.05, 0, 0]}>
        <boxGeometry args={[2.0, 0.06, 2.3]} />
        <meshStandardMaterial color={bodyColor} roughness={0.34} metalness={0.6} />
      </mesh>
      {/* headlight lenses at the leading edge of the hood */}
      {[-0.72, 0.72].map((x, i) => (
        <mesh key={i} position={[x, 0.62, -3.42]}>
          <sphereGeometry args={[0.1, 14, 14]} />
          <meshStandardMaterial
            color={headlightsOn ? '#fff6d8' : '#6a6a6a'}
            emissive={headlightsOn ? '#ffe9a8' : '#2a2a2a'}
            emissiveIntensity={headlightsOn ? 2.6 : 0.3}
            metalness={0.6} roughness={0.3}
          />
        </mesh>
      ))}

      {/* ── dashboard: top cowl + vertical face ── */}
      <mesh position={[0, 0.80, -0.98]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[2.1, 0.16, 0.55]} />
        <meshStandardMaterial color={trim} roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.60, -0.74]}>
        <boxGeometry args={[2.1, 0.36, 0.07]} />
        <meshStandardMaterial color="#0e1116" roughness={0.8} metalness={0.15} />
      </mesh>

      {/* instrument cluster hood behind the wheel, faint green speedo glow */}
      <mesh position={[-0.32, 0.73, -0.68]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.4, 0.17, 0.12]} />
        <meshStandardMaterial color="#08090c" roughness={0.8} />
      </mesh>
      {/* two dim gauges recessed under the hood */}
      {[-0.42, -0.22].map((x, i) => (
        <mesh key={i} position={[x, 0.70, -0.615]} rotation={[0.18, 0, 0]}>
          <ringGeometry args={[0.03, 0.052, 20]} />
          <meshStandardMaterial color="#0a2018" emissive="#2fae74" emissiveIntensity={0.32} toneMapped={false} side={2} />
        </mesh>
      ))}

      {/* ── steering wheel ── */}
      <SteeringWheel igniting={igniting} />

      {/* ── center console: radio head unit ── */}
      <mesh position={[0.06, 0.42, -0.35]}>
        <boxGeometry args={[0.44, 0.6, 0.7]} />
        <meshStandardMaterial color="#0c0e12" roughness={0.85} />
      </mesh>
      <Control
        position={[0.06, 0.64, -0.71]}
        size={[0.34, 0.17, 0.05]}
        color="#1a1712"
        glow={radioActive ? 0.5 : 0.2}
        glowColor="#ffb347"
        onClick={onRadioClick}
      >
        {/* lit amber display face */}
        <mesh position={[0, 0.02, 0.027]}>
          <planeGeometry args={[0.22, 0.07]} />
          <meshStandardMaterial color="#241503" emissive="#ffb347" emissiveIntensity={radioActive ? 1.2 : 0.5} toneMapped={false} />
        </mesh>
        {/* tuning knobs */}
        {[-0.13, 0.13].map((x, i) => (
          <mesh key={i} position={[x, -0.04, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.02, 14]} />
            <meshStandardMaterial color="#2b2620" emissive="#ffb347" emissiveIntensity={0.3} />
          </mesh>
        ))}
      </Control>

      {/* gear shifter on the console */}
      <mesh position={[0.06, 0.5, -0.28]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.16, 10]} />
        <meshStandardMaterial color="#111" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0.06, 0.58, -0.25]}>
        <sphereGeometry args={[0.035, 14, 14]} />
        <meshStandardMaterial color="#1a1712" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* ── ignition key, right of the column ── */}
      <group position={[-0.08, 0.62, -0.62]}>
        <mesh
          rotation={[Math.PI / 2, igniting ? 1.4 : 0, 0]}
          onPointerEnter={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onIgnition() }}
        >
          <cylinderGeometry args={[0.028, 0.028, 0.05, 12]} />
          <meshStandardMaterial color="#3a2f1a" emissive="#ffcf6a" emissiveIntensity={igniting ? 1.4 : 0.7} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* key fob dangling */}
        <mesh position={[0, -0.06, 0.03]} rotation={[igniting ? 0.5 : 0, 0, 0]}>
          <boxGeometry args={[0.03, 0.06, 0.008]} />
          <meshStandardMaterial color="#241a0c" emissive="#ffcf6a" emissiveIntensity={0.35} />
        </mesh>
        <pointLight position={[0, 0, 0.1]} intensity={igniting ? 0.5 : 0.2} distance={0.5} color="#ffcf6a" />
      </group>

      {/* ── headlight knob, left of the wheel ── */}
      <Control
        position={[-0.62, 0.60, -0.70]}
        size={[0.06, 0.06, 0.05]}
        rotation={[Math.PI / 2, 0, 0]}
        color="#1a1712"
        glow={headlightsOn ? 1.4 : 0.3}
        glowColor={headlightsOn ? '#ffe9a8' : '#ffb347'}
        onClick={onToggleHeadlights}
      />

      {/* ── glovebox on the passenger side ── */}
      <group position={[0.58, 0.55, -0.71]} rotation={[gloveboxOpen ? -0.7 : 0, 0, 0]}>
        <mesh
          onPointerEnter={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleGlovebox() }}
        >
          <boxGeometry args={[0.42, 0.2, 0.04]} />
          <meshStandardMaterial color="#12151a" roughness={0.8} />
        </mesh>
        {/* latch — a small lit affordance so it reads as openable in the dark */}
        <mesh position={[0, 0.06, 0.03]} onClick={(e) => { e.stopPropagation(); onToggleGlovebox() }}>
          <boxGeometry args={[0.06, 0.02, 0.02]} />
          <meshStandardMaterial color="#ffb347" emissive="#ffb347" emissiveIntensity={gloveboxOpen ? 1.6 : 1.0} />
        </mesh>
      </group>
      {gloveboxOpen && <pointLight position={[0.58, 0.6, -0.5]} intensity={1.2} distance={1.2} color="#ffd98c" />}

      {/* ── A-pillars + roof header, framing the windshield ── */}
      <mesh position={[-0.9, 1.16, -0.66]} rotation={[0.1, 0, 0.28]}>
        <boxGeometry args={[0.08, 0.9, 0.09]} />
        <meshStandardMaterial color="#07090c" roughness={0.9} />
      </mesh>
      <mesh position={[0.9, 1.16, -0.66]} rotation={[0.1, 0, -0.28]}>
        <boxGeometry args={[0.08, 0.9, 0.09]} />
        <meshStandardMaterial color="#07090c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.52, -0.62]}>
        <boxGeometry args={[1.95, 0.1, 0.12]} />
        <meshStandardMaterial color="#0a0c10" roughness={0.9} />
      </mesh>
      {/* headliner roof over/behind the head */}
      <mesh position={[0, 1.62, 0.25]}>
        <boxGeometry args={[1.95, 0.08, 1.7]} />
        <meshStandardMaterial color="#0f1115" roughness={0.95} />
      </mesh>

      {/* sun visors */}
      {[-0.42, 0.42].map((x, i) => (
        <mesh key={i} position={[x, 1.44, -0.58]} rotation={[0.55, 0, 0]}>
          <boxGeometry args={[0.5, 0.014, 0.2]} />
          <meshStandardMaterial color="#12141a" roughness={0.9} />
        </mesh>
      ))}

      {/* rearview mirror + a tiny hanging air-freshener tree */}
      <group position={[0, 1.44, -0.62]}>
        <mesh rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.24, 0.06, 0.025]} />
          <meshStandardMaterial color="#0a0c12" roughness={0.25} metalness={0.5} emissive="#1a2438" emissiveIntensity={0.4} />
        </mesh>
        {/* stalk + little pine tree freshener, hung just below the glass */}
        <mesh position={[0.05, -0.05, 0.01]}>
          <cylinderGeometry args={[0.001, 0.001, 0.06, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.05, -0.095, 0.01]}>
          <coneGeometry args={[0.016, 0.04, 5]} />
          <meshStandardMaterial color="#1f5a2a" emissive="#2f8a3a" emissiveIntensity={0.35} roughness={0.8} />
        </mesh>
      </group>

      {/* ── door cards ── */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.97, 0.6, 0.05]}>
            <boxGeometry args={[0.07, 0.66, 1.7]} />
            <meshStandardMaterial color="#0c0e12" roughness={0.9} />
          </mesh>
          {/* armrest */}
          <mesh position={[side * 0.9, 0.85, 0.12]}>
            <boxGeometry args={[0.12, 0.06, 0.5]} />
            <meshStandardMaterial color="#0a0c10" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* ── seats (visible if you glance right / down) ── */}
      {[-0.32, 0.32].map((x, i) => (
        <group key={i} position={[x, 0, 0.45]}>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[0.52, 0.14, 0.5]} />
            <meshStandardMaterial color="#191510" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.75, 0.24]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.52, 0.62, 0.14]} />
            <meshStandardMaterial color="#191510" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* ── the cassettes ── */}
      {CASSETTES.map(c => (
        <Cassette key={c.id} data={c} found={foundCassettes.includes(c.id)} onFind={onFindCassette} />
      ))}

      {/* interior amber glow from the dash + a soft fill so the driver reads */}
      <pointLight position={[0, 0.72, -0.35]} intensity={0.9} distance={2.1} color="#ffb060" />
      <pointLight position={[-0.32, 1.0, 0.1]} intensity={0.35} distance={1.6} color="#6a7ba8" />
    </group>
  )
}

function GarageEnvironment({ headlightsOn }: { headlightsOn: boolean }) {
  return (
    <group>
      {/* floor */}
      <mesh position={[0, -0.02, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 20]} />
        <meshStandardMaterial color="#12151a" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* garage door ahead — corrugated slats */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[0, 0.25 + i * 0.42, -6.2]}>
          <boxGeometry args={[6.4, 0.4, 0.08]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#1a1e24' : '#141820'} roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      {/* frosted window row near the top of the door — faint moonlight */}
      {[-1.8, -0.6, 0.6, 1.8].map((x, i) => (
        <mesh key={i} position={[x, 3.55, -6.14]}>
          <planeGeometry args={[1.0, 0.34]} />
          <meshStandardMaterial color="#243044" emissive="#4a5f88" emissiveIntensity={0.5} roughness={0.9} />
        </mesh>
      ))}

      {/* side + back walls */}
      <mesh position={[-5, 2, -1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#15181d" roughness={0.95} />
      </mesh>
      <mesh position={[5, 2, -1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#15181d" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2, 6]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#15181d" roughness={0.95} />
      </mesh>

      {/* workbench + pegboard on the right */}
      <mesh position={[3.9, 0.5, -3.2]}>
        <boxGeometry args={[2.0, 1.0, 1.0]} />
        <meshStandardMaterial color="#241a12" roughness={0.9} />
      </mesh>
      {[[3.2, -3.2], [3.2, -2.6], [3.2, -3.8], [2.6, -3.2]].map(([y, z], i) => (
        <mesh key={i} position={[4.92, y, z]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[0.06, 0.4, 0.1]} />
          <meshStandardMaterial color="#0c0d10" roughness={0.7} />
        </mesh>
      ))}

      {/* hanging bulb — the one warm light in the garage */}
      <mesh position={[1.6, 3.5, -2.2]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fff3cf" emissive="#ffd98c" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[1.6, 3.5, -2.2]} intensity={22} distance={11} color="#ffd07a" />
      {/* cool moon fill from the door windows */}
      <pointLight position={[0, 3.2, -5.6]} intensity={5} distance={9} color="#4a5f88" />

      {/* headlights washing the garage door */}
      {headlightsOn && (
        <>
          <spotLight position={[-0.72, 0.62, -3.5]} target-position={[-1.2, 0.4, -6.2]} angle={0.6} penumbra={0.7} intensity={60} color="#ffe9a8" distance={9} />
          <spotLight position={[0.72, 0.62, -3.5]} target-position={[1.2, 0.4, -6.2]} angle={0.6} penumbra={0.7} intensity={60} color="#ffe9a8" distance={9} />
        </>
      )}
    </group>
  )
}

export default function GarageScene(props: GarageSceneProps) {
  return (
    <Canvas
      camera={{ position: [-0.32, 1.09, 0.16], fov: 62 }}
      style={{ background: '#05070a' }}
      dpr={[0.7, 1.1]}
      gl={{ antialias: true, alpha: false }}
      shadows={false}
    >
      <fog attach="fog" args={['#05070a', 6, 20]} />
      <ambientLight intensity={0.4} color="#3a4a6a" />
      <hemisphereLight args={['#3a4a6a', '#050505', 0.5]} />

      <CarInterior {...props} />
      <GarageEnvironment headlightsOn={props.headlightsOn} />

      <OrbitControls
        target={[-0.32, 1.0, -0.9]}
        enablePan={false}
        enableZoom={false}
        minDistance={1.05}
        maxDistance={1.05}
        minAzimuthAngle={-0.42}
        maxAzimuthAngle={0.5}
        minPolarAngle={1.18}
        maxPolarAngle={1.62}
        rotateSpeed={0.32}
        enableDamping
        dampingFactor={0.09}
      />
    </Canvas>
  )
}
