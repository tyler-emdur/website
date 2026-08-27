'use client'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { useUniverseStore } from '@/lib/universe-store'
import { createGestureTracker } from '@/lib/pointer-gestures'

const PAN_SPEED = 1.4
const ZOOM_MIN = 55
const ZOOM_MAX = 9000
const LERP = 0.065
const IDLE_BOB_AMPLITUDE = 8
const IDLE_BOB_SPEED = 0.15
const FRICTION = 0.88 // Momentum friction
const PINCH_SPEED = 2.2 // how much a pinch of N pixels moves the camera

export default function CameraRig() {
  const { camera, gl } = useThree()
  const { cameraTarget, lookTarget, mode } = useUniverseStore()

  const targetPos = useRef(new Vector3(120, -80, 1640))
  const targetLook = useRef(new Vector3(0, 0, 0))
  const currentLook = useRef(new Vector3(0, 0, 0))

  const dragActive = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const panOffset = useRef({ x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })

  // One finger drags, two pinch. A phone has no wheel, so without the pinch
  // there is no way to zoom the hub at all — the visitor is stuck at whatever
  // distance they happened to arrive at. The gesture bookkeeping lives in
  // lib/pointer-gestures.ts so it can be tested outside a WebGL context.
  const gesture = useRef(createGestureTracker())

  // Sync store → local targets
  useEffect(() => {
    targetPos.current.set(...cameraTarget)
    panOffset.current.x = cameraTarget[0]
    panOffset.current.y = cameraTarget[1]
  }, [cameraTarget])

  useEffect(() => {
    targetLook.current.set(...lookTarget)
  }, [lookTarget])

  // Pointer events for panning
  useEffect(() => {
    const canvas = gl.domElement

    const g = gesture.current

    // exponential zoom feel — faster when far out, finer when close in
    const zoomBy = (amount: number) => {
      const zoomFactor = targetPos.current.z / 600
      targetPos.current.z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, targetPos.current.z + amount * zoomFactor))
    }

    const onDown = (e: PointerEvent) => {
      if (mode !== 'exploring') return
      g.down(e.pointerId, e.clientX, e.clientY)
      velocity.current = { x: 0, y: 0 }
      dragActive.current = g.dragging
      canvas.setPointerCapture(e.pointerId)
    }

    const onMove = (e: PointerEvent) => {
      const r = g.move(e.pointerId, e.clientX, e.clientY)

      if (r.pinch !== undefined) {
        zoomBy(r.pinch * PINCH_SPEED)
        return
      }

      if (r.pan) {
        const zoomFactor = camera.position.z / 600
        // Add to velocity instead of directly translating
        velocity.current.x -= r.pan.dx * PAN_SPEED * zoomFactor * 0.15
        velocity.current.y += r.pan.dy * PAN_SPEED * zoomFactor * 0.15
      }
    }

    // `pointercancel` matters more than `pointerup` here: it is what the
    // browser fires when it decides a touch was really a scroll gesture. Left
    // unhandled, the drag stayed "active" forever after the first swipe.
    const onUp = (e: PointerEvent) => {
      g.up(e.pointerId)
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
      // velocity is deliberately left alone: a flick should coast after the
      // finger leaves, the same way it does after a mouse drag.
      dragActive.current = g.dragging
    }

    const onWheel = (e: WheelEvent) => {
      if (mode !== 'exploring') return
      e.preventDefault()
      zoomBy(e.deltaY * 1.6)
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('wheel', onWheel)
      g.clear()
      dragActive.current = false
    }
  }, [gl, camera, mode])

  useFrame((state) => {
    // Apply momentum
    if (mode === 'exploring') {
      panOffset.current.x += velocity.current.x
      panOffset.current.y += velocity.current.y
      
      targetPos.current.x = panOffset.current.x
      targetPos.current.y = panOffset.current.y
      targetLook.current.x = panOffset.current.x
      targetLook.current.y = panOffset.current.y

      velocity.current.x *= FRICTION
      velocity.current.y *= FRICTION
    }

    // Dynamic FOV based on mode and speed
    const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2)
    const targetFov = mode === 'focused' ? 35 : Math.min(90, 50 + speed * 0.2)
    const cameraObj = camera as any
    if (cameraObj.fov) {
      cameraObj.fov += (targetFov - cameraObj.fov) * 0.05
      cameraObj.updateProjectionMatrix()
    }

    // Idle bob when not dragging and exploring
    let bobY = 0
    if (mode === 'exploring' && !dragActive.current) {
      const t = state.clock.elapsedTime * IDLE_BOB_SPEED
      bobY = Math.sin(t) * IDLE_BOB_AMPLITUDE * 0.3
    }

    // Lerp camera position
    camera.position.x += (targetPos.current.x - camera.position.x) * LERP
    camera.position.y += (targetPos.current.y + bobY - camera.position.y) * LERP
    camera.position.z += (targetPos.current.z - camera.position.z) * LERP

    // Collision avoidance buffer: prevent flying exactly through origin
    if (mode === 'exploring' && camera.position.z < 200 && Math.abs(camera.position.x) < 50 && Math.abs(camera.position.y) < 50) {
      targetPos.current.x += 10
      targetPos.current.y -= 10
    }

    // Lerp look-at
    currentLook.current.lerp(targetLook.current, LERP)
    camera.lookAt(currentLook.current)
  })

  return null
}
