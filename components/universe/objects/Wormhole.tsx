'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { ShaderMaterial, Color, AdditiveBlending } from 'three'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'

const WORM_VERT = `
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const WORM_FRAG = `
uniform vec3 uColor;
uniform float uTime;
uniform float uHovered;
varying vec2 vUv;
varying vec3 vPos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

void main() {
  vec2 uv = vUv - 0.5;
  float r = length(uv);
  float angle = atan(uv.y, uv.x);

  // Spiral effect
  float spiral = sin(angle * 4.0 - uTime * 3.0 + r * 10.0) * 0.5 + 0.5;
  float ring = smoothstep(0.35, 0.45, r) * smoothstep(0.55, 0.45, r);
  float inner = smoothstep(0.0, 0.2, 1.0 - r * 2.0);

  float glow = ring * spiral + inner * 0.4;
  glow += hash(uv * 20.0 + uTime * 0.1) * 0.05;

  vec3 col = uColor * glow * (1.5 + uHovered);
  gl_FragColor = vec4(col, glow * 0.9);
}
`

interface WormholeProps { obj: UniverseObject }

export default function Wormhole({ obj }: WormholeProps) {
  const meshRef = useRef<any>(null)
  const wire1Ref = useRef<any>(null)
  const wire2Ref = useRef<any>(null)
  const [hovered, setHovered] = useState(false)
  const { selectObject, isVisible } = useUniverseStore()
  const visible = isVisible(obj)

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: WORM_VERT,
    fragmentShader: WORM_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uTime: { value: 0 },
      uHovered: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [obj.color])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    mat.uniforms.uTime.value = t
    mat.uniforms.uHovered.value += ((hovered ? 1 : 0) - mat.uniforms.uHovered.value) * 0.1
    if (meshRef.current) {
      meshRef.current.rotation.z = t * 0.12
    }
    if (wire1Ref.current) {
      wire1Ref.current.rotation.x = t * 0.35
      wire1Ref.current.rotation.y = t * 0.2
    }
    if (wire2Ref.current) {
      wire2Ref.current.rotation.y = -t * 0.28
      wire2Ref.current.rotation.z = t * 0.18
    }
  })

  if (!visible) return null
  const size = obj.size ?? 14

  return (
    <group position={obj.position}>
      {/* 2D Spiral distortion backdrop */}
      <mesh
        ref={meshRef}
        material={mat}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
      >
        <planeGeometry args={[size * 3.8, size * 3.8, 1, 1]} />
      </mesh>

      {/* Solid Black occluding core silhouette */}
      <mesh>
        <sphereGeometry args={[size * 0.62, 16, 16]} />
        <meshBasicMaterial color="#000000" depthWrite={true} />
      </mesh>

      {/* Outer Impossible Wireframe 1 — Octahedron */}
      <mesh
        ref={wire1Ref}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
      >
        <octahedronGeometry args={[size * 0.95, 0]} />
        <meshBasicMaterial
          color={obj.color}
          wireframe
          transparent
          opacity={0.15 + (hovered ? 0.35 : 0)}
          depthWrite={false}
        />
      </mesh>

      {/* Outer Impossible Wireframe 2 — Icosahedron */}
      <mesh
        ref={wire2Ref}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
      >
        <icosahedronGeometry args={[size * 1.25, 0]} />
        <meshBasicMaterial
          color={obj.color}
          wireframe
          transparent
          opacity={0.08 + (hovered ? 0.22 : 0)}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
