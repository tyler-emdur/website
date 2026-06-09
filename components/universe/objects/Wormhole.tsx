'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { ShaderMaterial, Color, AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points } from 'three'
import { Billboard } from '@react-three/drei'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'
import { useProximity } from '@/lib/proximity-system'

const WORM_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const WORM_FRAG = `
uniform vec3 uColor;
uniform float uTime;
uniform float uHovered;
uniform float uProximity;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

void main() {
  vec2 uv = vUv - 0.5;
  float r = length(uv);
  float angle = atan(uv.y, uv.x);

  // Faster spin when close
  float speed = 3.0 + uProximity * 5.0;

  // Spiral effect
  float spiral = sin(angle * 4.0 - uTime * speed + r * 10.0) * 0.5 + 0.5;
  float ring = smoothstep(0.35, 0.45, r) * smoothstep(0.55, 0.45, r);
  float inner = smoothstep(0.0, 0.2, 1.0 - r * 2.0);

  float glow = ring * spiral + inner * 0.4;
  glow += hash(uv * 20.0 + uTime * 0.1) * 0.05;

  vec3 col = uColor * glow * (1.5 + uHovered);
  
  // Brighten center based on proximity
  col += vec3(1.0, 0.8, 1.0) * inner * uProximity * 0.8;

  gl_FragColor = vec4(col, glow * 0.9);
}
`

const INFLOW_VERT = `
uniform float uTime;
uniform float uProximity;
attribute float aOffset;
attribute float aSpeed;
varying float vAlpha;

void main() {
  // Move particles toward center (0,0,0)
  float t = fract(uTime * aSpeed * (0.2 + uProximity * 0.4) + aOffset);
  
  // Start far out, end at center
  vec3 pos = position * (1.0 - t);
  
  // Add some swirl
  float angle = t * 10.0;
  float s = sin(angle);
  float c = cos(angle);
  float nx = pos.x * c - pos.y * s;
  float ny = pos.x * s + pos.y * c;
  pos.x = nx; pos.y = ny;

  vAlpha = (1.0 - t) * smoothstep(0.0, 0.2, t);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (100.0 / length(gl_Position.xyz)) * (1.0 - t);
}
`

const INFLOW_FRAG = `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv) * 2.0;
  float circle = smoothstep(1.0, 0.8, r);
  gl_FragColor = vec4(uColor, circle * vAlpha * 0.6);
}
`

interface WormholeProps { obj: UniverseObject }

export default function Wormhole({ obj }: WormholeProps) {
  const meshRef = useRef<any>(null)
  const wire1Ref = useRef<any>(null)
  const wire2Ref = useRef<any>(null)
  const particlesRef = useRef<Points>(null)
  
  const [hovered, setHovered] = useState(false)
  const { selectObject, isVisible } = useUniverseStore()
  const { zone } = useProximity(obj.position)
  
  const visible = isVisible(obj)
  const size = obj.size ?? 14

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: WORM_VERT,
    fragmentShader: WORM_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uTime: { value: 0 },
      uHovered: { value: 0 },
      uProximity: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [obj.color])

  const inflowMat = useMemo(() => new ShaderMaterial({
    vertexShader: INFLOW_VERT,
    fragmentShader: INFLOW_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uTime: { value: 0 },
      uProximity: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [obj.color])

  const particleGeo = useMemo(() => {
    const count = 300
    const pos = new Float32Array(count * 3)
    const offsets = new Float32Array(count)
    const speeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Starting positions in a sphere around the wormhole
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = size * 5.0 + Math.random() * size * 2.0
      
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = r * Math.cos(phi)
      
      offsets[i] = Math.random()
      speeds[i] = 0.5 + Math.random() * 1.5
    }

    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setAttribute('aOffset', new Float32BufferAttribute(offsets, 1))
    g.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1))
    return g
  }, [size])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    mat.uniforms.uTime.value = t
    inflowMat.uniforms.uTime.value = t
    mat.uniforms.uHovered.value += ((hovered ? 1 : 0) - mat.uniforms.uHovered.value) * 0.1
    
    const proxTarget = zone === 'close' ? 1.0 : zone === 'near' ? 0.3 : 0.0
    mat.uniforms.uProximity.value += (proxTarget - mat.uniforms.uProximity.value) * 0.05
    inflowMat.uniforms.uProximity.value = mat.uniforms.uProximity.value

    if (meshRef.current) meshRef.current.rotation.z = t * 0.12
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

  return (
    <group position={obj.position}>
      <Billboard>
        {/* Deep layered spirals */}
        <mesh ref={meshRef} material={mat} scale={1.2} position={[0,0,-1]}>
          <planeGeometry args={[size * 3.8, size * 3.8, 1, 1]} />
        </mesh>
        <mesh material={mat} rotation={[0,0,Math.PI/3]}>
          <planeGeometry args={[size * 3.8, size * 3.8, 1, 1]} />
        </mesh>
        
        {/* Solid Black occluding core silhouette */}
        <mesh>
          <sphereGeometry args={[size * 0.62, 16, 16]} />
          <meshBasicMaterial color="#000000" depthWrite={true} />
        </mesh>
      </Billboard>

      {/* Particle inflow */}
      <points ref={particlesRef} geometry={particleGeo} material={inflowMat} />

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
