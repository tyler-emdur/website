'use client'
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { RadioStation } from '@/app/api/radio/route'

// The world radio, seen as a place instead of a dial. Same live stations, same
// stream, same LiveRadio engine underneath — this is just a second way in.
// Spin the globe, find a glowing point, tune to it. No frequency, no scanning.
//
// Rendered inside the Garage's existing Canvas (see GarageScene) rather than a
// second one — one live WebGL context per world, not two.

export const GLOBE_RADIUS = 1.6

function toVec3(lat: number, lon: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

function countryFlag(code: string) {
  if (!/^[A-Za-z]{2}$/.test(code)) return '📻'
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)))
}

function StationPoint({
  station, active, onSelect,
}: {
  station: RadioStation
  active: boolean
  onSelect: (s: RadioStation) => void
}) {
  const [hover, setHover] = useState(false)
  const pos = useMemo(() => toVec3(station.lat, station.lon, GLOBE_RADIUS * 1.01), [station.lat, station.lon])
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const pulse = active ? 1 + Math.sin(clock.elapsedTime * 3) * 0.18 : 1
    const s = (hover ? 1.9 : 1) * pulse
    meshRef.current.scale.setScalar(s)
  })

  return (
    <group position={pos}>
      <mesh
        ref={meshRef}
        onPointerOver={e => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={e => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto' }}
        onClick={e => { e.stopPropagation(); onSelect(station) }}
      >
        <sphereGeometry args={[active ? 0.028 : 0.02, 10, 10]} />
        <meshBasicMaterial color={active ? '#ffe4a3' : '#7dffb0'} toneMapped={false} />
      </mesh>
      {(hover || active) && (
        <Html distanceFactor={4.2} style={{ pointerEvents: 'none' }} center>
          <div style={{
            fontFamily: '"Space Mono", monospace', fontSize: 10, letterSpacing: '0.06em',
            color: active ? '#ffe4a3' : '#7dffb0', whiteSpace: 'nowrap',
            background: 'rgba(5,8,6,0.85)', border: `1px solid ${active ? 'rgba(255,228,163,0.4)' : 'rgba(120,255,170,0.3)'}`,
            borderRadius: 3, padding: '3px 7px', transform: 'translateY(-16px)',
          }}>
            {countryFlag(station.country)} {station.name}
          </div>
        </Html>
      )}
    </group>
  )
}

export default function RadioGlobe({ stations, activeId, onSelect }: {
  stations: RadioStation[]
  activeId: string | null
  onSelect: (s: RadioStation) => void
}) {
  const grid = useMemo(() => {
    const g = new THREE.SphereGeometry(GLOBE_RADIUS, 24, 16)
    return new THREE.WireframeGeometry(g)
  }, [])

  return (
    <group>
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 3, 5]} intensity={40} color="#dff5e6" />
      <pointLight position={[-4, -2, -3]} intensity={12} color="#ffb347" />
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 48, 32]} />
        <meshStandardMaterial color="#050a08" roughness={0.85} metalness={0.15} />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#1f4a34" transparent opacity={0.35} />
      </lineSegments>
      {stations.map(s => (
        <StationPoint key={s.id} station={s} active={s.id === activeId} onSelect={onSelect} />
      ))}
    </group>
  )
}
