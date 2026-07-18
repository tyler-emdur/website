'use client'
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { RadioStation } from '@/app/api/radio/route'

// The world radio, seen as a place instead of a dial — a slow-turning night
// Earth with a signal rising from every city that's on the air. Same live
// stations, same stream, same LiveRadio engine underneath; this is just a
// second way in. Spin the globe, find a light, tune to it. No frequency, no
// scanning.
//
// Rendered inside the Garage's existing Canvas (see GarageScene) so the world
// only ever holds one live WebGL context.

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

// A clean lat/lon graticule (no triangulated wireframe diagonals): a ring at
// every 20° of latitude and a meridian at every 20° of longitude.
function useGraticule() {
  return useMemo(() => {
    const pts: number[] = []
    const R = GLOBE_RADIUS * 1.002
    const push = (a: [number, number, number], b: [number, number, number]) => { pts.push(...a, ...b) }
    // parallels
    for (let lat = -80; lat <= 80; lat += 20) {
      let prev = toVec3(lat, -180, R)
      for (let lon = -180 + 6; lon <= 180; lon += 6) {
        const cur = toVec3(lat, lon, R)
        push(prev, cur); prev = cur
      }
    }
    // meridians
    for (let lon = -180; lon < 180; lon += 20) {
      let prev = toVec3(-90, lon, R)
      for (let lat = -90 + 6; lat <= 90; lat += 6) {
        const cur = toVec3(lat, lon, R)
        push(prev, cur); prev = cur
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])
}

// The soft blue halo around the limb of the planet.
function Atmosphere() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {},
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */`
      varying vec3 vN;
      void main() {
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vN;
      void main() {
        float rim = pow(1.0 - abs(vN.z), 2.4);
        gl_FragColor = vec4(vec3(0.32, 0.66, 0.95) * rim, rim * 0.9);
      }
    `,
  }), [])
  return (
    <mesh scale={1.18}>
      <sphereGeometry args={[GLOBE_RADIUS, 48, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function StationPoint({
  station, active, onSelect,
}: {
  station: RadioStation
  active: boolean
  onSelect: (s: RadioStation) => void
}) {
  const [hover, setHover] = useState(false)
  const surface = useMemo(() => toVec3(station.lat, station.lon, GLOBE_RADIUS), [station.lat, station.lon])
  const normal = useMemo(() => new THREE.Vector3(...surface).normalize(), [surface])
  // orient the signal beam so it points straight up out of the ground
  const quat = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
    return q
  }, [normal])
  const dotRef = useRef<THREE.Mesh>(null)
  const beamRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (dotRef.current) {
      const pulse = active ? 1 + Math.sin(t * 4) * 0.28 : 1 + Math.sin(t * 2 + station.freq) * 0.1
      dotRef.current.scale.setScalar((hover ? 1.8 : 1) * pulse)
    }
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = (active ? 0.55 : hover ? 0.4 : 0.16) * (0.8 + Math.sin(t * 3 + station.freq) * 0.2)
    }
  })

  const color = active ? '#ffe4a3' : '#8affc0'
  const beamH = active ? 0.55 : 0.34

  return (
    <group position={surface} quaternion={quat}>
      {/* signal beam rising from the city */}
      <mesh ref={beamRef} position={[0, beamH / 2, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.006, 0.02, beamH, 8, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* the light itself */}
      <mesh
        ref={dotRef}
        onPointerOver={e => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={e => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto' }}
        onClick={e => { e.stopPropagation(); onSelect(station) }}
      >
        <sphereGeometry args={[active ? 0.03 : 0.022, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* faint ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[active ? 0.075 : 0.05, 20]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.28 : 0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {(hover || active) && (
        <Html distanceFactor={4.4} style={{ pointerEvents: 'none' }} center position={[0, beamH + 0.12, 0]}>
          <div style={{
            fontFamily: '"Space Mono", monospace', fontSize: 10, letterSpacing: '0.04em',
            color: active ? '#ffe4a3' : '#8affc0', whiteSpace: 'nowrap', textAlign: 'center',
            background: 'rgba(4,8,10,0.9)', border: `1px solid ${active ? 'rgba(255,228,163,0.45)' : 'rgba(138,255,192,0.35)'}`,
            borderRadius: 3, padding: '3px 8px', lineHeight: 1.5,
          }}>
            <div>{countryFlag(station.country)} {station.name}</div>
            <div style={{ fontSize: 8, opacity: 0.6 }}>{station.city} · {station.freq.toFixed(1)}</div>
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
  const graticule = useGraticule()

  return (
    <group>
      <Stars radius={80} depth={40} count={2200} factor={3.2} saturation={0} fade speed={0.4} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} color="#cfe6ff" />
      <pointLight position={[-5, -2, -4]} intensity={8} color="#2a4d80" />

      {/* the ocean planet */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 48]} />
        <meshStandardMaterial color="#08243a" emissive="#04101c" emissiveIntensity={0.6} roughness={0.75} metalness={0.1} />
      </mesh>

      {/* graticule */}
      <lineSegments geometry={graticule}>
        <lineBasicMaterial color="#2f7fb0" transparent opacity={0.42} />
      </lineSegments>

      <Atmosphere />

      {stations.map(s => (
        <StationPoint key={s.id} station={s} active={s.id === activeId} onSelect={onSelect} />
      ))}
    </group>
  )
}
