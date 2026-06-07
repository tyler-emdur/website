'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Color, AdditiveBlending } from 'three'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'

const VERT = `
uniform float uTime;
varying vec3 vNormal;
varying float vDist;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vDist = length(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const FRAG = `
uniform vec3 uColor;
uniform float uTime;
uniform float uHovered;
varying vec3 vNormal;
varying float vDist;
void main() {
  float pulse = sin(uTime * 2.2 + vDist * 4.0) * 0.18 + 0.82;
  vec3 light = normalize(vec3(2.0, 1.5, 3.0));
  float diff = max(0.0, dot(vNormal, light)) * 0.55 + 0.45;
  vec3 col = uColor * diff * pulse * (0.65 + uHovered * 0.6);
  gl_FragColor = vec4(col, 0.88);
}
`

const GLOW_VERT = `
varying vec3 vNormal;
varying vec3 vViewPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`
const GLOW_FRAG = `
uniform vec3 uColor;
uniform float uHovered;
varying vec3 vNormal;
varying vec3 vViewPos;
void main() {
  float fresnel = dot(normalize(vNormal), normalize(vViewPos));
  float rim = pow(clamp(1.0 - fresnel, 0.0, 1.0), 2.0);
  gl_FragColor = vec4(uColor, rim * (0.25 + uHovered * 0.3));
}
`

export default function Fragment({ obj }: { obj: UniverseObject }) {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { selectObject, isVisible } = useUniverseStore()
  const visible = isVisible(obj)

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color).multiplyScalar(0.7) },
      uTime: { value: 0 },
      uHovered: { value: 0 },
    },
  }), [obj.color])

  const glowMat = useMemo(() => new ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uHovered: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 1,
  }), [obj.color])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    mat.uniforms.uTime.value = t
    const h = hovered ? 1 : 0
    mat.uniforms.uHovered.value += (h - mat.uniforms.uHovered.value) * 0.1
    glowMat.uniforms.uHovered.value = mat.uniforms.uHovered.value
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.004
      meshRef.current.rotation.y += 0.006
      meshRef.current.rotation.z += 0.003
    }
  })

  if (!visible) return null
  const size = (obj.size ?? 8) * 0.8

  return (
    <group position={obj.position}>
      <mesh material={glowMat} scale={1.6}>
        <dodecahedronGeometry args={[size, 0]} />
      </mesh>
      <mesh
        ref={meshRef}
        material={mat}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
      >
        <dodecahedronGeometry args={[size, 0]} />
      </mesh>
    </group>
  )
}
