'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, ShaderMaterial, Color, AdditiveBlending } from 'three'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'

const RING_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const RING_FRAG = `
uniform vec3 uColor;
uniform float uPhase;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  vec2 uv = vUv - 0.5;
  float r = length(uv) * 2.0;
  float ring = smoothstep(0.85, 1.0, r) * smoothstep(1.05, 1.0, r);
  float fade = 1.0 - uPhase;
  gl_FragColor = vec4(uColor, ring * fade * uAlpha);
}
`

interface SignalProps {
  obj: UniverseObject
}

export default function Signal({ obj }: SignalProps) {
  const groupRef = useRef<Group>(null)
  const ref1 = useRef<Mesh>(null)
  const ref2 = useRef<Mesh>(null)
  const ref3 = useRef<Mesh>(null)
  const coreRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { selectObject, isVisible } = useUniverseStore()

  const visible = isVisible(obj)

  const makeMat = useMemo(() => () => new ShaderMaterial({
    vertexShader: RING_VERT,
    fragmentShader: RING_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uPhase: { value: 0 },
      uAlpha: { value: 1 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [obj.color])

  const mat1 = useMemo(makeMat, [makeMat])
  const mat2 = useMemo(makeMat, [makeMat])
  const mat3 = useMemo(makeMat, [makeMat])

  const size = obj.size ?? 8
  const PERIOD = 2.5

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p1 = (t % PERIOD) / PERIOD
    const p2 = ((t + PERIOD / 3) % PERIOD) / PERIOD
    const p3 = ((t + (PERIOD * 2) / 3) % PERIOD) / PERIOD

    // 12-second cycle of fading in and out of existence
    const signalAlpha = Math.max(0, Math.min(1, Math.sin((t / 12) * Math.PI * 2) * 1.6 + 0.4))

    if (mat1) { mat1.uniforms.uPhase.value = p1; mat1.uniforms.uAlpha.value = (hovered ? 1.4 : 0.8) * signalAlpha }
    if (mat2) { mat2.uniforms.uPhase.value = p2; mat2.uniforms.uAlpha.value = (hovered ? 1.4 : 0.8) * signalAlpha }
    if (mat3) { mat3.uniforms.uPhase.value = p3; mat3.uniforms.uAlpha.value = (hovered ? 1.4 : 0.8) * signalAlpha }

    const rings = [ref1, ref2, ref3]
    const phases = [p1, p2, p3]
    rings.forEach((r, i) => {
      if (r.current) {
        const s = size + phases[i] * size * 3
        r.current.scale.setScalar(s / size)
      }
    })

    if (coreRef.current) {
      const pulse = Math.sin(t * 4) * 0.15 + 1
      coreRef.current.scale.setScalar(pulse)
      const coreMat = coreRef.current.material as any
      if (coreMat) {
        coreMat.opacity = signalAlpha
      }
    }

    // Dynamic coordinates for void-drifter beacon
    if (groupRef.current) {
      if (obj.id === 'void-drifter') {
        groupRef.current.position.x = obj.position[0] + Math.sin(t * 0.015) * 650
        groupRef.current.position.y = obj.position[1] + Math.cos(t * 0.009) * 450
        groupRef.current.position.z = obj.position[2] + Math.sin(t * 0.006) * 100
      } else {
        groupRef.current.position.set(...obj.position)
      }
    }
  })

  if (!visible) return null

  return (
    <group ref={groupRef} position={obj.position}>
      {/* Pulsing rings */}
      {[mat1, mat2, mat3].map((mat, i) => (
        <mesh key={i} ref={[ref1, ref2, ref3][i]} material={mat}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
        >
          <circleGeometry args={[size, 32]} />
        </mesh>
      ))}

      {/* Core */}
      <mesh ref={coreRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
      >
        <sphereGeometry args={[size * 0.3, 16, 16]} />
        <meshBasicMaterial color={obj.color} transparent opacity={1} />
      </mesh>
    </group>
  )
}
