'use client'
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const TAIL_LEN = 52
const NUM_COMETS = 4

const COMET_COLORS = [0x60A5FA, 0xA855F7, 0xF97316, 0x22C55E, 0xF0ABFC, 0x34D399]

interface Comet {
  pos: THREE.Vector3
  vel: THREE.Vector3
  tail: Float32Array   // TAIL_LEN * 3
  tailPtr: number
  tailFull: boolean
  active: boolean
  waitFrames: number
  color: THREE.Color
  speed: number
}

function spawnComet(): Comet {
  const angle = Math.random() * Math.PI * 2
  const dist = 1400
  const x = Math.cos(angle) * dist
  const y = Math.sin(angle) * dist * 0.75
  const z = (Math.random() - 0.5) * 180

  const targetX = (Math.random() - 0.5) * 700
  const targetY = (Math.random() - 0.5) * 500
  const dx = targetX - x
  const dy = targetY - y
  const speed = 7 + Math.random() * 11
  const len = Math.hypot(dx, dy) || 1

  return {
    pos: new THREE.Vector3(x, y, z),
    vel: new THREE.Vector3(dx / len * speed, dy / len * speed, (Math.random() - 0.5) * 0.4),
    tail: new Float32Array(TAIL_LEN * 3),
    tailPtr: 0,
    tailFull: false,
    active: true,
    waitFrames: 0,
    color: new THREE.Color(COMET_COLORS[Math.floor(Math.random() * COMET_COLORS.length)]),
    speed,
  }
}

export default function CometSystem() {
  const comets = useRef<Comet[]>([])
  const frameRef = useRef(0)

  // Points geometry for all tails
  const geo = useMemo(() => new THREE.BufferGeometry(), [])
  const pointsRef = useRef<THREE.Points>(null)

  // Initialize comets at staggered times
  useEffect(() => {
    comets.current = Array.from({ length: NUM_COMETS }, (_, i) => {
      const c = spawnComet()
      c.waitFrames = i * 140
      c.active = false
      return c
    })
  }, [])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      attribute float aAlpha;
      attribute vec3 aColor;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vAlpha = aAlpha;
        vColor = aColor;
        gl_PointSize = aAlpha * 3.5 + 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, d) * vAlpha;
        gl_FragColor = vec4(vColor, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  useFrame(() => {
    frameRef.current++
    const allPos: number[] = []
    const allAlpha: number[] = []
    const allColor: number[] = []

    comets.current.forEach((c, ci) => {
      if (!c.active) {
        if (--c.waitFrames <= 0) {
          const fresh = spawnComet()
          comets.current[ci] = fresh
          fresh.active = true
        }
        return
      }

      // Advance comet
      c.pos.add(c.vel)

      // Record tail
      const idx = c.tailPtr * 3
      c.tail[idx]   = c.pos.x
      c.tail[idx+1] = c.pos.y
      c.tail[idx+2] = c.pos.z
      c.tailPtr = (c.tailPtr + 1) % TAIL_LEN
      if (c.tailPtr === 0) c.tailFull = true

      // Die if out of bounds
      if (Math.abs(c.pos.x) > 1600 || Math.abs(c.pos.y) > 1200) {
        c.active = false
        c.waitFrames = 200 + Math.floor(Math.random() * 300)
        return
      }

      // Emit tail points (newest = brightest)
      const count = c.tailFull ? TAIL_LEN : c.tailPtr
      for (let i = 0; i < count; i++) {
        const age = ((c.tailPtr - 1 - i + TAIL_LEN) % TAIL_LEN) / TAIL_LEN
        const ti = ((c.tailPtr - 1 - i + TAIL_LEN) % TAIL_LEN) * 3
        allPos.push(c.tail[ti], c.tail[ti+1], c.tail[ti+2])
        allAlpha.push(Math.max(0, 1 - age * 1.4))
        allColor.push(c.color.r, c.color.g, c.color.b)
      }

      // Head glow: extra bright points
      for (let g = 0; g < 3; g++) {
        allPos.push(c.pos.x + (Math.random()-0.5)*2, c.pos.y + (Math.random()-0.5)*2, c.pos.z)
        allAlpha.push(0.9 + g * 0.03)
        allColor.push(c.color.r, c.color.g, c.color.b)
      }
    })

    if (allPos.length > 0) {
      geo.setAttribute('position', new THREE.Float32BufferAttribute(allPos, 3))
      geo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(allAlpha, 1))
      geo.setAttribute('aColor', new THREE.Float32BufferAttribute(allColor, 3))
      geo.attributes.position.needsUpdate = true
    } else {
      geo.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
    }
  })

  return <points ref={pointsRef} geometry={geo} material={mat} />
}
