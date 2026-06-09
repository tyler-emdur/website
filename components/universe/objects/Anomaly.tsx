'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Color, AdditiveBlending } from 'three'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'
import { useProximity } from '@/lib/proximity-system'

const ANOMALY_VERT = `
uniform float uTime;
uniform float uProximity;
varying vec3 vNormal;
varying vec3 vPos;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }

void main() {
  vNormal = normal;
  vPos = position;

  // Step-wise glitch time rather than smooth morphing
  // Glitch frequency increases with proximity
  float glitchSpeed = 8.0 + uProximity * 20.0;
  float glitchTime = floor(uTime * glitchSpeed) / glitchSpeed;
  
  float glitchThreshold = 0.78 - uProximity * 0.2;
  float hasGlitch = step(glitchThreshold, hash(vec3(glitchTime, 1.4, 0.9)));
  
  float n = hash(position + glitchTime * 1.5) * 2.0 - 1.0;
  
  // Glitch amplitude increases with proximity
  float amplitude = 0.58 + uProximity * 0.8;
  vec3 displaced = position + normal * n * amplitude * hasGlitch;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`

const ANOMALY_FRAG = `
uniform vec3 uColor;
uniform float uTime;
uniform float uHovered;
uniform float uProximity;
varying vec3 vNormal;
varying vec3 vPos;

float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  float glitchSpeed = 8.0 + uProximity * 20.0;
  float glitchTime = floor(uTime * glitchSpeed) / glitchSpeed;
  
  float flashThreshold = 0.92 - uProximity * 0.15;
  float noiseFlash = step(flashThreshold, hash2(vec2(glitchTime, vPos.x)));
  float pulse = sin(uTime * 4.0 + length(vPos) * 1.8) * 0.5 + 0.5;
  
  vec3 col = uColor * (0.35 + pulse * 0.5 + uHovered * 0.75);
  
  if (noiseFlash > 0.5) {
    col = vec3(0.1, 0.1, 0.1) + (1.0 - col) * 0.8; // chromatic invert flash
  }
  
  float alpha = (0.4 + pulse * 0.4) * (0.8 + uHovered * 0.2);
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
  const { zone } = useProximity(obj.position)

  const visible = isVisible(obj)

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: ANOMALY_VERT,
    fragmentShader: ANOMALY_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uTime: { value: 0 },
      uHovered: { value: 0 },
      uProximity: { value: 0 },
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
      uProximity: { value: 0 },
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
    
    const proxTarget = zone === 'close' ? 1.0 : zone === 'near' ? 0.3 : 0.0
    mat.uniforms.uProximity.value += (proxTarget - mat.uniforms.uProximity.value) * 0.05
    solidMat.uniforms.uProximity.value = mat.uniforms.uProximity.value

    // Add jittery rotation, scales with proximity
    const jitter = Math.sin(t * 18.0) * (0.005 + mat.uniforms.uProximity.value * 0.02)
    meshRef.current.rotation.x = t * 0.2 + jitter
    meshRef.current.rotation.y = t * 0.35
    meshRef.current.rotation.z = t * 0.15 - jitter
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
