'use client'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { useUniverseStore } from '@/lib/universe-store'

const PAN_SPEED = 1.4
const ZOOM_MIN = 55
const ZOOM_MAX = 9000
const LERP = 0.065
const IDLE_BOB_AMPLITUDE = 8
const IDLE_BOB_SPEED = 0.15

export default function CameraRig() {
  const { camera, gl } = useThree()
  const { cameraTarget, lookTarget, mode } = useUniverseStore()

  const targetPos = useRef(new Vector3(120, -80, 1640))
  const targetLook = useRef(new Vector3(0, 0, 0))
  const currentLook = useRef(new Vector3(0, 0, 0))

  const dragActive = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const panOffset = useRef({ x: 0, y: 0 })
  const idleTime = useRef(0)

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

    const onDown = (e: PointerEvent) => {
      if (mode !== 'exploring') return
      dragActive.current = true
      lastPointer.current = { x: e.clientX, y: e.clientY }
      canvas.setPointerCapture(e.pointerId)
    }

    const onMove = (e: PointerEvent) => {
      if (!dragActive.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }

      const zoomFactor = camera.position.z / 600
      panOffset.current.x -= dx * PAN_SPEED * zoomFactor
      panOffset.current.y += dy * PAN_SPEED * zoomFactor

      targetPos.current.x = panOffset.current.x
      targetPos.current.y = panOffset.current.y
      targetLook.current.x = panOffset.current.x
      targetLook.current.y = panOffset.current.y

      idleTime.current = 0
    }

    const onUp = () => { dragActive.current = false }

    const onWheel = (e: WheelEvent) => {
      if (mode !== 'exploring') return
      e.preventDefault()
      // exponential zoom feel — faster when far out, finer when close in
      const zoomFactor = targetPos.current.z / 600
      const delta = e.deltaY * 1.6 * zoomFactor
      targetPos.current.z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, targetPos.current.z + delta))
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [gl, camera, mode])

  useFrame((state) => {
    idleTime.current += state.clock.getDelta()

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

    // Lerp look-at
    currentLook.current.lerp(targetLook.current, LERP)
    camera.lookAt(currentLook.current)
  })

  return null
}
