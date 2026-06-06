'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Color, BackSide, AdditiveBlending } from 'three'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'

const PLANET_VERT = `
varying vec3 vNormal;
varying vec3 vViewPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

const PLANET_FRAG = `
uniform vec3 uColor;
uniform vec3 uGlow;
uniform float uTime;
uniform float uHovered;
varying vec3 vNormal;
varying vec3 vViewPos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}

void main() {
  float fresnel = dot(normalize(vNormal), normalize(vViewPos));
  float rim = pow(clamp(1.0 - fresnel, 0.0, 1.0), 2.8);

  vec3 light = normalize(vec3(2.0, 1.5, 3.0));
  float diff = max(0.0, dot(vNormal, light)) * 0.7 + 0.3;

  // Surface texture
  vec2 uv = vNormal.xy * 3.0 + uTime * 0.008;
  float n = noise(uv) * 0.15;

  vec3 col = uColor * (diff + n);
  col = mix(col, uGlow, rim * (0.6 + uHovered * 0.4));
  col += uGlow * uHovered * 0.3;

  gl_FragColor = vec4(col, 1.0);
}
`

const ATMO_FRAG = `
uniform vec3 uGlow;
uniform float uHovered;
varying vec3 vNormal;
varying vec3 vViewPos;
void main() {
  float fresnel = dot(normalize(vNormal), normalize(vViewPos));
  float rim = pow(clamp(1.0 - fresnel, 0.0, 1.0), 1.8);
  float alpha = rim * (0.18 + uHovered * 0.25);
  gl_FragColor = vec4(uGlow, alpha);
}
`

interface PlanetProps {
  obj: UniverseObject
}

export default function Planet({ obj }: PlanetProps) {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { selectObject, isVisible } = useUniverseStore()

  const visible = isVisible(obj)

  const planetMat = useMemo(() => new ShaderMaterial({
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color).multiplyScalar(0.6) },
      uGlow: { value: new Color(obj.color) },
      uTime: { value: 0 },
      uHovered: { value: 0 },
    },
  }), [obj.color])

  const atmoMat = useMemo(() => new ShaderMaterial({
    vertexShader: PLANET_VERT,
    fragmentShader: ATMO_FRAG,
    uniforms: {
      uGlow: { value: new Color(obj.color) },
      uHovered: { value: 0 },
    },
    transparent: true,
    side: BackSide,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [obj.color])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    meshRef.current.rotation.y += 0.0008

    const h = hovered ? 1 : 0
    planetMat.uniforms.uTime.value = t
    planetMat.uniforms.uHovered.value += (h - planetMat.uniforms.uHovered.value) * 0.08
    atmoMat.uniforms.uHovered.value = planetMat.uniforms.uHovered.value

    // Hover scale
    const targetScale = hovered ? 1.12 : 1
    meshRef.current.scale.lerp(
      { x: targetScale, y: targetScale, z: targetScale } as any,
      0.08
    )
  })

  if (!visible) return null

  const size = obj.size ?? 20

  return (
    <group position={obj.position}>
      {/* Atmosphere */}
      <mesh material={atmoMat} scale={1.18}>
        <sphereGeometry args={[size, 32, 32]} />
      </mesh>

      {/* Planet body */}
      <mesh
        ref={meshRef}
        material={planetMat}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
      >
        <sphereGeometry args={[size, 32, 32]} />
      </mesh>
    </group>
  )
}
