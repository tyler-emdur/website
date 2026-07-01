'use client'
import { useRef, useState, useMemo, useCallback, useEffect, Fragment } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { MathUtils } from 'three'
import { SPACING, RAIL_X, RAIL_Y, HANG_Y, getSlot, type Slot, type Shape } from './aisle-data'

const WINDOW_BEHIND = 2
const WINDOW_AHEAD = 22
const MAX_SPEED = 6.5
const ACCEL = 18
const DAMPING = 9

function shapeGeometry(shape: Shape) {
  switch (shape) {
    case 'box': return <boxGeometry args={[0.4, 0.4, 0.4]} />
    case 'sphere': return <sphereGeometry args={[0.26, 16, 16]} />
    case 'cone': return <coneGeometry args={[0.26, 0.5, 10]} />
    case 'cylinder': return <cylinderGeometry args={[0.2, 0.2, 0.45, 12]} />
    case 'torus': return <torusGeometry args={[0.22, 0.09, 10, 20]} />
    case 'octahedron': return <octahedronGeometry args={[0.3, 0]} />
  }
}

function Item({ slot }: { slot: Slot }) {
  const side = slot.index % 2 === 0 ? 1 : -1
  const x = side * RAIL_X
  const z = -slot.index * SPACING
  const isGem = slot.kind === 'gem'
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, RAIL_Y - 0.55, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.1, 6]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>
      <mesh position={[0, HANG_Y, 0]} rotation={slot.rotation} scale={slot.scale}>
        {shapeGeometry(slot.shape)}
        <meshStandardMaterial
          color={slot.color}
          emissive={isGem ? slot.color : '#000000'}
          emissiveIntensity={isGem ? 0.55 : 0}
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>
      {isGem && <pointLight position={[0, HANG_Y, 0.4]} color={slot.color} intensity={3.2} distance={3.2} />}
      <Text
        position={[0, HANG_Y - 0.55, 0]}
        fontSize={0.13}
        color={isGem ? '#F472B6' : 'rgba(255,255,255,0.4)'}
        anchorX="center"
        anchorY="middle"
      >
        {isGem ? '★' : `#${slot.index}`}
      </Text>
    </group>
  )
}

function FollowRails() {
  const leftRef = useRef<import('three').Mesh>(null)
  const rightRef = useRef<import('three').Mesh>(null)
  const floorRef = useRef<import('three').Mesh>(null)
  useFrame(({ camera }) => {
    if (leftRef.current) leftRef.current.position.z = camera.position.z
    if (rightRef.current) rightRef.current.position.z = camera.position.z
    if (floorRef.current) floorRef.current.position.z = camera.position.z
  })
  return (
    <>
      <mesh ref={leftRef} position={[-RAIL_X, RAIL_Y, 0]}>
        <boxGeometry args={[0.06, 0.06, 80]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh ref={rightRef} position={[RAIL_X, RAIL_Y, 0]}>
        <boxGeometry args={[0.06, 0.06, 80]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 90]} />
        <meshStandardMaterial color="#101014" roughness={0.95} />
      </mesh>
    </>
  )
}

function Rig({ onDistance }: { onDistance: (d: number) => void }) {
  const { camera } = useThree()
  const distanceRef = useRef(0)
  const velocityRef = useRef(0)
  const keysRef = useRef<Record<string, boolean>>({})
  const bobRef = useRef(0)

  useEffect(() => {
    // r3f's default camera auto-lookAt(0,0,0) pitches us straight down from (0, 1.55, 0) — reset to face -Z
    camera.rotation.set(0, 0, 0)
  }, [camera])

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true }
    const up = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const k = keysRef.current
    const forward = (k['w'] || k['arrowup']) ? 1 : 0
    const backward = (k['s'] || k['arrowdown']) ? 1 : 0
    const input = forward - backward

    if (input !== 0) {
      velocityRef.current = MathUtils.clamp(velocityRef.current + input * ACCEL * delta, -MAX_SPEED, MAX_SPEED)
    } else {
      velocityRef.current *= Math.max(0, 1 - DAMPING * delta)
    }

    distanceRef.current += velocityRef.current * delta
    if (distanceRef.current < 0) {
      distanceRef.current = 0
      velocityRef.current = 0
    }

    const speedFrac = Math.abs(velocityRef.current) / MAX_SPEED
    bobRef.current += delta * (1.4 + speedFrac * 3)
    const bobAmt = speedFrac * 0.045

    camera.position.z = -distanceRef.current
    camera.position.y = 1.55 + Math.sin(bobRef.current * 2) * bobAmt
    camera.position.x = Math.sin(bobRef.current) * bobAmt * 0.5
    camera.rotation.x = 0
    camera.rotation.y = 0
    camera.rotation.z = -Math.sin(bobRef.current) * bobAmt * 0.4

    onDistance(distanceRef.current)
  })

  return null
}

function SlotWindow() {
  const { camera } = useThree()
  const [centerIndex, setCenterIndex] = useState(0)
  useFrame(() => {
    const idx = Math.max(0, Math.round(-camera.position.z / SPACING))
    if (idx !== centerIndex) setCenterIndex(idx)
  })
  const slots = useMemo(() => {
    const start = Math.max(0, centerIndex - WINDOW_BEHIND)
    const end = centerIndex + WINDOW_AHEAD
    const arr: Slot[] = []
    for (let i = start; i <= end; i++) arr.push(getSlot(i))
    return arr
  }, [centerIndex])
  return (
    <>
      {slots.map(s => <Fragment key={s.index}><Item slot={s} /></Fragment>)}
    </>
  )
}

function Scene({ onCenterIndexChange }: { onCenterIndexChange: (i: number) => void }) {
  const lastIndexRef = useRef(-1)
  const handleDistance = useCallback((d: number) => {
    const idx = Math.round(d / SPACING)
    if (idx !== lastIndexRef.current) {
      lastIndexRef.current = idx
      onCenterIndexChange(idx)
    }
  }, [onCenterIndexChange])

  return (
    <>
      <fog attach="fog" args={['#0b0b10', 7, 24]} />
      <color attach="background" args={['#0b0b10']} />
      <ambientLight intensity={0.55} color="#4a5568" />
      <hemisphereLight args={['#5a6a8a', '#050506', 0.6]} />
      <Rig onDistance={handleDistance} />
      <FollowRails />
      <SlotWindow />
    </>
  )
}

export default function AisleCanvas({ onCenterIndexChange }: { onCenterIndexChange: (i: number) => void }) {
  return (
    <Canvas
      camera={{ position: [0, 1.55, 0], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene onCenterIndexChange={onCenterIndexChange} />
    </Canvas>
  )
}
