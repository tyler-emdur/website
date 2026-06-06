'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { ShaderMaterial, Color, AdditiveBlending } from 'three'
import { ORIGIN_OBJECT, useUniverseStore } from '@/lib/universe-store'

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const FRAG = `
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv - 0.5;
  float r = length(uv);
  float angle = atan(uv.y, uv.x);

  float glow = exp(-r * 6.0) * 1.5;
  float pulse = sin(uTime * 1.5) * 0.3 + 0.7;

  // Rotating lines
  float lines = sin(angle * 6.0 + uTime * 0.5) * 0.3 + 0.7;
  float ring = smoothstep(0.18, 0.2, r) * smoothstep(0.22, 0.2, r) * lines;

  vec3 col = vec3(glow + ring * 0.5) * pulse;
  gl_FragColor = vec4(col, glow + ring * 0.6);
}
`

export default function OriginAnomaly() {
  const meshRef = useRef<any>(null)
  const { selectObject } = useUniverseStore()

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [])

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.08
    }
  })

  return (
    <group>
      <mesh
        ref={meshRef}
        material={mat}
        onClick={(e) => { e.stopPropagation(); selectObject(ORIGIN_OBJECT) }}
      >
        <planeGeometry args={[80, 80]} />
      </mesh>

      {/* Core dot */}
      <mesh>
        <sphereGeometry args={[3, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}
