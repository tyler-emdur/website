'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute } from 'three'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'projects')!
const COLOR = '#3B82F6'
const POS = region.position

function Scaffolding() {
  // A structural cage around the entire region, suggesting it's under construction
  return (
    <group position={POS}>
      {/* Outer bounding box */}
      <mesh>
        <boxGeometry args={[1600, 1200, 1000]} />
        <meshBasicMaterial color="#1e3a8a" wireframe transparent opacity={0.15} depthWrite={false} />
      </mesh>
      {/* Internal support beams */}
      <mesh position={[0, -400, 0]}>
        <boxGeometry args={[1800, 20, 20]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh position={[0, 400, 0]}>
        <boxGeometry args={[1800, 20, 20]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh position={[-600, 0, 0]}>
        <boxGeometry args={[20, 1400, 20]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh position={[600, 0, 0]}>
        <boxGeometry args={[20, 1400, 20]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  )
}

function DataFlowLines() {
  const lineRef = useRef<any>(null)
  
  const geo = useMemo(() => {
    // Connect objects sequentially with straight lines
    const pts = []
    for (let i = 0; i < region.objects.length; i++) {
      const o1 = region.objects[i]
      const o2 = region.objects[(i + 1) % region.objects.length]
      pts.push(o1.position[0], o1.position[1], o1.position[2])
      pts.push(o2.position[0], o2.position[1], o2.position[2])
      
      // Also connect to region center
      pts.push(o1.position[0], o1.position[1], o1.position[2])
      pts.push(POS[0], POS[1] - 200, POS[2])
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pts, 3))
    return g
  }, [])

  useFrame((s) => {
    if (lineRef.current) {
      // Pulse opacity
      lineRef.current.material.opacity = 0.1 + Math.sin(s.clock.elapsedTime * 3.0) * 0.05
    }
  })

  return (
    <lineSegments ref={lineRef} geometry={geo}>
      <lineBasicMaterial color="#60A5FA" transparent opacity={0.1} depthWrite={false} blending={AdditiveBlending} />
    </lineSegments>
  )
}

function AssemblyPoint({ position }: { position: [number, number, number] }) {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.z = s.clock.elapsedTime * 0.5
    }
  })
  return (
    <group position={position}>
      {/* Status dot */}
      <mesh position={[0, 40, 0]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color="#10B981" />
      </mesh>
      {/* Rotating gear/assembly ring */}
      <mesh ref={ref} position={[0, 30, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[12, 15, 6]} />
        <meshBasicMaterial color="#3B82F6" wireframe transparent opacity={0.4} side={2} />
      </mesh>
      {/* Vertical connection line */}
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 30]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

export default function ProjectsRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={1600} spread={400} opacity={0.25} position={POS} />
      <NebulaCloud color="#1E40AF" count={1200} spread={220} opacity={0.18} position={POS} />

      <Scaffolding />
      <DataFlowLines />
      
      {region.objects.map((obj, i) => (
        <group key={i}>
          {renderObject(obj)}
          {/* Place assembly point slightly above each object */}
          <AssemblyPoint position={[obj.position[0], obj.position[1] + (obj.size ?? 20) * 1.5, obj.position[2]]} />
        </group>
      ))}
    </group>
  )
}
