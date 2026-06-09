'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { getAllObjects } from '@/lib/universe-store'

interface SignalPath {
  points: THREE.Vector3[]
  curve: THREE.QuadraticBezierCurve3
  color: string
  opacity: number
  dashed: boolean
  disappearsHalfway: boolean
  speed: number
  pulseOffset: number
}

export default function SignalLayer() {
  const pulsesRef = useRef<THREE.Group>(null)

  const paths = useMemo(() => {
    const objs = getAllObjects()
    const list: SignalPath[] = []

    // Connect specific objects that shouldn't be connected
    const pairings = [
      { from: 'origin', to: 'proj-website', color: '#60A5FA', dashed: true },
      { from: 'proj-digger', to: 'arch-core', color: '#B45309', dashed: false },
      { from: 'run-golden', to: 'explore-maroon', color: '#22C55E', dashed: false },
      { from: 'arch-wormhole', to: 'lab-collider', color: '#A855F7', dashed: true },
      { from: 'explore-corridor', to: 'run-pixel', color: '#FF006E', dashed: false },
      // Connect to empty space or coordinate markers
      { from: 'origin', to: 'void-dark-anomaly', color: '#818CF8', dashed: false, disappearsHalfway: true },
      { from: 'lab-quantum', to: 'gate-08', color: '#F97316', dashed: true },
    ]

    pairings.forEach((p, idx) => {
      const fromObj = objs.find(o => o.id === p.from)
      const toObj = objs.find(o => o.id === p.to)
      if (!fromObj || !toObj) return

      const start = new THREE.Vector3(...fromObj.position)
      const end = new THREE.Vector3(...toObj.position)

      // Control point pulled outwards to create curved paths
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
      const dir = new THREE.Vector3().subVectors(end, start).normalize()
      const up = new THREE.Vector3(0, 0, 1)
      const normal = new THREE.Vector3().crossVectors(dir, up).normalize()
      const dist = start.distanceTo(end)

      const control = mid.addScaledVector(normal, dist * (0.15 + (idx % 3) * 0.1))
      // Add slight z height bias
      control.z += (idx % 2 === 0 ? 120 : -120)

      const curve = new THREE.QuadraticBezierCurve3(start, control, end)
      const points = curve.getPoints(36)

      list.push({
        points,
        curve,
        color: p.color,
        opacity: 0.12 + (idx % 3) * 0.08,
        dashed: p.dashed,
        disappearsHalfway: !!p.disappearsHalfway,
        speed: 0.15 + (idx % 4) * 0.08,
        pulseOffset: (idx * 0.618) % 1.0, // deterministic golden-ratio offset instead of Math.random()
      })
    })

    // Add 4 completely blind signals going into deep space coordinates
    // Use deterministic anchor selection (by index mod) instead of Math.random()
    const blindDestinations = [
      new THREE.Vector3(-2800, 1500, -800),
      new THREE.Vector3(3000, -2200, 600),
      new THREE.Vector3(1200, 2800, -500),
      new THREE.Vector3(-2500, -2800, 100),
    ]

    blindDestinations.forEach((dest, idx) => {
      const anchor = objs[idx * 7 % objs.length] // deterministic
      if (!anchor) return
      const start = new THREE.Vector3(...anchor.position)
      const mid = new THREE.Vector3().addVectors(start, dest).multiplyScalar(0.5)
      mid.y += 300
      mid.z += -100

      const curve = new THREE.QuadraticBezierCurve3(start, mid, dest)
      const points = curve.getPoints(24)

      list.push({
        points,
        curve,
        color: anchor.color,
        opacity: 0.07,
        dashed: true,
        disappearsHalfway: true,
        speed: 0.12,
        pulseOffset: ((pairings.length + idx) * 0.618) % 1.0,
      })
    })

    return list
  }, [])

  // Animate pulses along curves
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (pulsesRef.current) {
      const children = pulsesRef.current.children
      paths.forEach((path, i) => {
        const mesh = children[i] as THREE.Mesh
        if (!mesh) return

        let progress = (t * path.speed + path.pulseOffset) % 1.0

        // Disappear halfway logic
        if (path.disappearsHalfway && progress > 0.5) {
          mesh.visible = false
          return
        }
        mesh.visible = true

        const pos = path.curve.getPointAt(progress)
        mesh.position.copy(pos)

        // Fade pulse near endpoints
        const mat = mesh.material as THREE.MeshBasicMaterial
        if (mat) {
          let alpha = 1.0
          if (progress < 0.1) alpha = progress / 0.1
          else if (progress > 0.9) alpha = (1.0 - progress) / 0.1
          else if (path.disappearsHalfway && progress > 0.4) {
            alpha = (0.5 - progress) / 0.1
          }
          mat.opacity = alpha * 0.72
        }
      })
    }
  })

  return (
    <group>
      {/* Curved connection lines — using drei Line which handles dashes correctly */}
      {paths.map((p, i) => {
        const linePoints = p.disappearsHalfway
          ? p.points.slice(0, Math.floor(p.points.length * 0.55))
          : p.points
        return (
          <Line
            key={i}
            points={linePoints}
            color={p.color}
            lineWidth={1}
            transparent
            opacity={p.opacity}
            dashed={p.dashed}
            dashSize={6}
            gapSize={4}
            depthWrite={false}
          />
        )
      })}

      {/* Traveling data pulses */}
      <group ref={pulsesRef}>
        {paths.map((p, i) => (
          <mesh key={i}>
            <boxGeometry args={[4, 4, 4]} />
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
