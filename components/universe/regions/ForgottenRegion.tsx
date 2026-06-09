'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, ShaderMaterial, Color, BackSide, Mesh } from 'three'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'forgotten')!
const COLOR = '#EF4444'
const POS = region.position

// ─── DISTORTION BUBBLE ───────────────────────────────────────────────────────

const BUBBLE_VERT = `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewPos;

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
  vNormal = normalize(normalMatrix * normal);
  
  // Slow wobbling
  vec3 pos = position;
  float n = noise(position * 0.005 + uTime * 0.1);
  pos += normal * n * 100.0;
  
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vViewPos = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

const BUBBLE_FRAG = `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewPos;

void main() {
  float fresnel = dot(normalize(vNormal), normalize(vViewPos));
  float rim = pow(clamp(1.0 - fresnel, 0.0, 1.0), 3.0);
  
  // Glitch bands along the rim
  float band = step(0.9, fract(vViewPos.y * 0.02 + uTime * 0.5));
  
  vec3 col = mix(vec3(0.9, 0.2, 0.2), vec3(1.0, 0.5, 0.2), band);
  
  gl_FragColor = vec4(col, rim * 0.15);
}
`

function DistortionBubble() {
  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: BUBBLE_VERT,
    fragmentShader: BUBBLE_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: BackSide,
  }), [])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <mesh position={POS} material={mat}>
      <sphereGeometry args={[1200, 32, 32]} />
    </mesh>
  )
}

// ─── RESIDUAL OUTLINES ───────────────────────────────────────────────────────

const RESIDUAL_VERT = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const RESIDUAL_FRAG = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

void main() {
  // Static noise
  float n = hash(vUv * 100.0 + uTime);
  
  // Fading
  float fade = sin(uTime * 0.5 + vPos.x * 0.01) * 0.5 + 0.5;
  fade = pow(fade, 3.0); // Make flashes shorter
  
  vec3 col = mix(vec3(0.5, 0.1, 0.1), vec3(0.9, 0.2, 0.2), n);
  
  gl_FragColor = vec4(col, fade * 0.15);
}
`

function ResidualOutlines() {
  const ref1 = useRef<Mesh>(null)
  const ref2 = useRef<Mesh>(null)
  
  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: RESIDUAL_VERT,
    fragmentShader: RESIDUAL_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    wireframe: true,
  }), [])

  useFrame((s) => { 
    mat.uniforms.uTime.value = s.clock.elapsedTime
    if (ref1.current) ref1.current.rotation.y = s.clock.elapsedTime * 0.1
    if (ref2.current) {
      ref2.current.rotation.x = s.clock.elapsedTime * 0.08
      ref2.current.rotation.z = s.clock.elapsedTime * 0.05
    }
  })

  return (
    <group position={POS}>
      <mesh ref={ref1} material={mat}>
        <icosahedronGeometry args={[600, 1]} />
      </mesh>
      <mesh ref={ref2} material={mat}>
        <octahedronGeometry args={[800, 1]} />
      </mesh>
    </group>
  )
}

export default function ForgottenRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={1200} spread={500} opacity={0.15} position={POS} />
      <NebulaCloud color="#7F1D1D" count={1000} spread={300} opacity={0.2} position={POS} />

      <DistortionBubble />
      <ResidualOutlines />

      {region.objects.map((obj, i) => (
        <group key={i}>
          {renderObject(obj)}
        </group>
      ))}
    </group>
  )
}
