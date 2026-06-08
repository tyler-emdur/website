'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

// Non-aligning grid fragment
function GridFragment({ position, rotation, size = 400, divisions = 10, opacity = 0.15 }: {
  position: [number, number, number]
  rotation: [number, number, number]
  size?: number
  divisions?: number
  opacity?: number
}) {
  const gridHelper = useMemo(() => {
    const helper = new THREE.GridHelper(size, divisions, 0x475569, 0x334155)
    helper.material.transparent = true
    helper.material.opacity = opacity
    helper.material.depthWrite = false
    // rotate from horizontal plane to vertical/oblique plane
    helper.rotation.x = Math.PI / 2
    return helper
  }, [size, divisions, opacity])

  return (
    <primitive object={gridHelper} position={position} rotation={rotation} />
  )
}

// Tick-marked measurement arc
function MeasurementArc({ position, rotation, radius, arc = Math.PI * 0.5, color = '#3b82f6', opacity = 0.2 }: {
  position: [number, number, number]
  rotation: [number, number, number]
  radius: number
  arc?: number
  color?: string
  opacity?: number
}) {
  const { lineGeo, ticksGeo } = useMemo(() => {
    // Arc line
    const points = []
    const segments = 60
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * arc
      points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0))
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)

    // Radial tick marks
    const ticks = []
    const numTicks = 12
    for (let i = 0; i <= numTicks; i++) {
      const theta = (i / numTicks) * arc
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)
      
      const inner = radius - 8
      const outer = radius + 8
      
      ticks.push(
        new THREE.Vector3(inner * cos, inner * sin, 0),
        new THREE.Vector3(outer * cos, outer * sin, 0)
      )
    }
    const ticksGeo = new THREE.BufferGeometry().setFromPoints(ticks)

    return { lineGeo, ticksGeo }
  }, [radius, arc])

  return (
    <group position={position} rotation={rotation}>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={ticksGeo}>
        <lineBasicMaterial color={color} transparent opacity={opacity * 0.7} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

export default function CartographyLayer() {
  const ref = useRef<THREE.Group>(null)

  // Floating coordinate labels data
  const annotations = useMemo(() => [
    { pos: [0, 0, 100] as [number, number, number],         label: 'TE-∅ // ORIGIN REFERENCE CLAMP',            color: 'rgba(255,255,255,0.28)' },
    { pos: [-2500, 1800, -1100] as [number, number, number],label: 'NULL-ZONE [LIGHT_ABSORPTION: 100%]',         color: 'rgba(255,255,255,0.28)' },
    { pos: [900, -900, -400] as [number, number, number],   label: 'SURVEY ARC #08-F // ERASED',                 color: 'rgba(255,255,255,0.28)' },
    { pos: [-2400, -1800, 600] as [number, number, number], label: 'SECTOR-06 [RECORD NOT FOUND]',               color: 'rgba(255,255,255,0.28)' },
    { pos: [2200, 300, 100] as [number, number, number],    label: 'COORDINATE DEVIATION: +4.2',                 color: 'rgba(255,255,255,0.28)' },
    { pos: [500, 500, 0] as [number, number, number],       label: 'EMPTY ORBIT REFERENCE: NULL-4',              color: 'rgba(255,255,255,0.28)' },
    { pos: [200, -200, -100] as [number, number, number],   label: 'FIELD INTEGRITY CHECK: PASSING',             color: 'rgba(255,255,255,0.28)' },
    // Archive classification stamps
    { pos: [-800, -2200, 200] as [number, number, number],  label: 'STATUS: LOST',                               color: 'rgba(251,191,36,0.45)' },
    { pos: [1800, 800, -300] as [number, number, number],   label: 'ENTRY CORRUPTED — DATA RECOVERY FAILED',     color: 'rgba(239,68,68,0.35)' },
    { pos: [-1400, 600, 400] as [number, number, number],   label: 'DO NOT INDEX',                               color: 'rgba(251,191,36,0.40)' },
    { pos: [400, -1600, 80] as [number, number, number],    label: 'ARCHIVE STATUS: UNKNOWN',                    color: 'rgba(255,255,255,0.22)' },
    { pos: [2800, -400, -100] as [number, number, number],  label: 'OBJECT NOT FOUND — LAST DETECTED 2019-08-14', color: 'rgba(251,191,36,0.35)' },
    { pos: [-300, 2000, 150] as [number, number, number],   label: 'SECTOR MARKED FOR DELETION',                 color: 'rgba(239,68,68,0.30)' },
    { pos: [1000, 1400, -200] as [number, number, number],  label: 'NULL RECORD // ROUTE NOT FOUND',             color: 'rgba(255,255,255,0.20)' },
    { pos: [-2200, 200, 300] as [number, number, number],   label: 'ARCHIVED: ACCESS DENIED',                    color: 'rgba(251,191,36,0.32)' },
    { pos: [600, -400, 200] as [number, number, number],    label: 'TRANSMISSION INTERRUPTED AT THIS POINT',     color: 'rgba(255,255,255,0.18)' },
  ], [])

  return (
    <group ref={ref}>
      {/* Non-aligning grid fragments */}
      <GridFragment position={[1600, 500, -200]} rotation={[0.2, -0.1, -0.4]} size={800} divisions={16} opacity={0.12} />
      <GridFragment position={[-1500, -900, 150]} rotation={[-0.15, 0.2, 0.6]} size={600} divisions={12} opacity={0.15} />
      <GridFragment position={[-1200, 1200, -400]} rotation={[0.4, 0.05, -0.2]} size={700} divisions={14} opacity={0.10} />
      <GridFragment position={[800, -1400, 300]} rotation={[0.0, -0.3, 0.8]} size={500} divisions={10} opacity={0.14} />

      {/* Concentric rings at origin */}
      <group position={[0, 0, 0]}>
        {[200, 450, 900].map((r, i) => (
          <mesh key={i} rotation={[0.1, 0.2, 0]}>
            <ringGeometry args={[r - 1, r + 1, 64]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.07 - i * 0.015} depthWrite={false} wireframe />
          </mesh>
        ))}
      </group>

      {/* An empty orbit that contains nothing */}
      <group position={[600, 600, -100]} rotation={[0.3, 0.4, 0.1]}>
        <mesh>
          <ringGeometry args={[299, 301, 80]} />
          <meshBasicMaterial color="#475569" transparent opacity={0.18} depthWrite={false} wireframe />
        </mesh>
        <MeasurementArc position={[0, 0, 0]} rotation={[0, 0, Math.PI * 0.4]} radius={300} arc={Math.PI * 0.3} color="#64748b" opacity={0.3} />
      </group>

      {/* Additional measurement arcs around region centroids */}
      <MeasurementArc position={[1600, 400, -100]} rotation={[0.1, 0.15, 0.2]} radius={380} arc={Math.PI * 0.9} color="#3b82f6" opacity={0.15} />
      <MeasurementArc position={[-1500, -800, 200]} rotation={[-0.2, 0.1, -0.5]} radius={320} arc={Math.PI * 0.65} color="#f97316" opacity={0.18} />
      <MeasurementArc position={[-1200, 1300, -300]} rotation={[0.3, -0.1, 1.2]} radius={420} arc={Math.PI * 0.5} color="#b45309" opacity={0.12} />
      <MeasurementArc position={[1200, -1300, 150]} rotation={[0.05, 0.2, -0.8]} radius={340} arc={Math.PI * 0.8} color="#22c55e" opacity={0.15} />
      <MeasurementArc position={[100, 1800, -250]} rotation={[-0.4, 0.05, 0.4]} radius={360} arc={Math.PI * 0.72} color="#a855f7" opacity={0.2} />

      {/* Floating survey notations */}
      {annotations.map((a, i) => (
        <group key={i} position={a.pos}>
          {/* Small crosshair marker */}
          <mesh>
            <boxGeometry args={[10, 1, 1]} />
            <meshBasicMaterial color="#475569" transparent opacity={0.3} depthWrite={false} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[10, 1, 1]} />
            <meshBasicMaterial color="#475569" transparent opacity={0.3} depthWrite={false} />
          </mesh>

          <Html distanceFactor={1100} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.2em',
              color: a.color,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              transform: 'translate3d(12px, -6px, 0)',
              userSelect: 'none',
              borderLeft: `1px solid ${a.color.replace(/[\d.]+\)$/, '0.2)')}`,
              paddingLeft: '6px',
            }}>
              {a.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
