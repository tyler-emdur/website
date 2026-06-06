'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Color, AdditiveBlending, IcosahedronGeometry } from 'three'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'

const ANOMALY_VERT = `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vPos;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }

void main() {
  vNormal = normal;
  vPos = position;

  // Morph vertices
  float n = hash(position + uTime * 0.3) * 2.0 - 1.0;
  vec3 displaced = position + normal * n * 0.25;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`

const ANOMALY_FRAG = `
uniform vec3 uColor;
uniform float uTime;
uniform float uHovered;
varying vec3 vNormal;
varying vec3 vPos;

void main() {
  float pulse = sin(uTime * 2.0 + length(vPos) * 3.0) * 0.5 + 0.5;
  vec3 col = uColor * (0.5 + pulse * 0.5 + uHovered * 0.5);
  float alpha = 0.7 + pulse * 0.3;
  gl_FragColor = vec4(col, alpha);
}
`

interface AnomalyProps {
  obj: UniverseObject
}

export default function Anomaly({ obj }: AnomalyProps) {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { selectObject, isVisible } = useUniverseStore()

  const visible = isVisible(obj)

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: ANOMALY_VERT,
    fragmentShader: ANOMALY_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uTime: { value: 0 },
      uHovered: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    wireframe: true,
  }), [obj.color])

  const solidMat = useMemo(() => new ShaderMaterial({
    vertexShader: ANOMALY_VERT,
    fragmentShader: ANOMALY_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color).multiplyScalar(0.4) },
      uTime: { value: 0 },
      uHovered: { value: 0 },
    },
    transparent: true,
  }), [obj.color])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    mat.uniforms.uTime.value = t
    solidMat.uniforms.uTime.value = t
    mat.uniforms.uHovered.value += ((hovered ? 1 : 0) - mat.uniforms.uHovered.value) * 0.1
    solidMat.uniforms.uHovered.value = mat.uniforms.uHovered.value

    meshRef.current.rotation.x = t * 0.3
    meshRef.current.rotation.y = t * 0.5
    meshRef.current.rotation.z = t * 0.2
  })

  if (!visible) return null
  const size = obj.size ?? 16

  return (
    <group position={obj.position}>
      {/* Solid core */}
      <mesh material={solidMat}>
        <icosahedronGeometry args={[size * 0.6, 1]} />
      </mesh>

      {/* Wireframe outer */}
      <mesh
        ref={meshRef}
        material={mat}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
      >
        <icosahedronGeometry args={[size, 2]} />
      </mesh>
    </group>
  )
}
