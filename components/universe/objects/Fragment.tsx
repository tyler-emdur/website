'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Color, AdditiveBlending, Group, Points, BufferGeometry, Float32BufferAttribute } from 'three'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'
import { useProximity } from '@/lib/proximity-system'

const FRAG_VERT = `
uniform float uTime;
uniform float uProximity;
varying vec3 vNormal;
varying vec3 vPos;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }

void main() {
  vPos = position;
  vNormal = normalize(normalMatrix * normal);
  
  // Proximity instability jitter
  vec3 pos = position;
  if (uProximity > 0.1) {
    float jitterPhase = floor(uTime * 12.0);
    float jitter = step(0.8, hash(position + jitterPhase)) * uProximity * 0.8;
    pos += normal * jitter;
  }
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const FRAG_FRAG = `
uniform vec3 uColor;
uniform float uTime;
uniform float uHovered;
uniform float uProximity;
varying vec3 vNormal;
varying vec3 vPos;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                 mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                 mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
}

void main() {
  float pulse = sin(uTime * 0.65) * 0.12 + 0.88;
  vec3 light = normalize(vec3(1.0, 1.0, 2.0));
  float diff = max(0.0, dot(vNormal, light)) * 0.4 + 0.6;
  
  // Fracture lines
  float n1 = noise(vPos * 0.8);
  float n2 = noise(vPos * 0.8 + vec3(5.2));
  float fracture = abs(n1 - n2);
  fracture = smoothstep(0.02, 0.0, fracture);
  
  vec3 baseCol = uColor * diff * pulse * (0.45 + uHovered * 0.55);
  // Fractures glow brighter when close
  vec3 fracCol = mix(vec3(1.0, 0.5, 0.1), vec3(0.1, 0.8, 1.0), n1);
  vec3 col = baseCol + fracCol * fracture * (0.5 + uProximity * 2.0);

  // Archived objects are very dim
  gl_FragColor = vec4(col, 0.18 + uHovered * 0.65 + fracture * uProximity * 0.5);
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
uniform float uProximity;
varying vec3 vNormal;
varying vec3 vViewPos;

void main() {
  float fresnel = dot(normalize(vNormal), normalize(vViewPos));
  float rim = pow(clamp(1.0 - fresnel, 0.0, 1.0), 3.0);
  // Extremely faint glow, brightens when close
  gl_FragColor = vec4(uColor, rim * (0.04 + uHovered * 0.18 + uProximity * 0.2));
}
`

export default function Fragment({ obj }: { obj: UniverseObject }) {
  const meshRef = useRef<Mesh>(null)
  const debrisRef = useRef<Points>(null)
  const [hovered, setHovered] = useState(false)
  const { selectObject, isVisible } = useUniverseStore()
  const { zone } = useProximity(obj.position)
  
  const visible = isVisible(obj)
  const size = (obj.size ?? 8) * 0.8

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: FRAG_VERT,
    fragmentShader: FRAG_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color).multiplyScalar(0.4) },
      uTime: { value: 0 },
      uHovered: { value: 0 },
      uProximity: { value: 0 },
    },
    transparent: true,
  }), [obj.color])

  const glowMat = useMemo(() => new ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uHovered: { value: 0 },
      uProximity: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 1,
  }), [obj.color])

  const debrisGeo = useMemo(() => {
    const count = 24
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = size * 1.5 + Math.random() * size * 1.5
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = r * Math.cos(phi)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [size])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    mat.uniforms.uTime.value = t
    const h = hovered ? 1 : 0
    mat.uniforms.uHovered.value += (h - mat.uniforms.uHovered.value) * 0.1
    glowMat.uniforms.uHovered.value = mat.uniforms.uHovered.value
    
    const proxTarget = zone === 'close' ? 1.0 : zone === 'near' ? 0.3 : 0.0
    mat.uniforms.uProximity.value += (proxTarget - mat.uniforms.uProximity.value) * 0.05
    glowMat.uniforms.uProximity.value = mat.uniforms.uProximity.value

    if (meshRef.current) {
      meshRef.current.rotation.x += 0.004
      meshRef.current.rotation.y += 0.006
      meshRef.current.rotation.z += 0.003
    }

    if (debrisRef.current) {
      debrisRef.current.rotation.x = t * 0.1
      debrisRef.current.rotation.y = t * 0.15
      
      // Debris scatters outward slightly when approached
      const scale = 1.0 + mat.uniforms.uProximity.value * 0.5
      debrisRef.current.scale.setScalar(scale)
      const pointsMat = debrisRef.current.material as any
      if (pointsMat) {
        pointsMat.opacity = mat.uniforms.uProximity.value * 0.8
      }
    }
  })

  if (!visible) return null

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
      
      <points ref={debrisRef} geometry={debrisGeo}>
        <pointsMaterial size={2.0} color={obj.color} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </points>
    </group>
  )
}
