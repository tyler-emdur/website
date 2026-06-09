'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, ShaderMaterial, Color, BufferGeometry, Float32BufferAttribute } from 'three'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'explore')!
const COLOR = '#F59E0B'
const POS = region.position

// ─── NAVIGATIONAL BEACONS ────────────────────────────────────────────────────

const BEACON_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const BEACON_FRAG = `
uniform float uTime;
uniform float uOffset;
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  
  // Pulsing ring
  float t = fract(uTime * 0.5 + uOffset);
  float ring = smoothstep(t - 0.1, t, r) * smoothstep(t + 0.1, t, r);
  
  // Core
  float core = smoothstep(0.2, 0.0, r);
  
  float alpha = ring + core;
  gl_FragColor = vec4(0.96, 0.62, 0.04, alpha * 0.6); // #F59E0B
}
`

function NavBeacon({ position, offset }: any) {
  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: BEACON_VERT,
    fragmentShader: BEACON_FRAG,
    uniforms: { 
      uTime: { value: 0 },
      uOffset: { value: offset }
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [offset])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <mesh position={position}>
      <planeGeometry args={[100, 100]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

function BeaconPath() {
  // A trail of beacons leading through the region
  const beacons = []
  for (let i = 0; i < 12; i++) {
    const t = i / 11
    const x = POS[0] - 600 + t * 1200
    const y = POS[1] + Math.sin(t * Math.PI * 2) * 200
    const z = POS[2] - 400 + t * 800
    beacons.push(<NavBeacon key={i} position={[x, y, z]} offset={t * 5.0} />)
  }
  return <group>{beacons}</group>
}

// ─── GEOMETRY FIELD ──────────────────────────────────────────────────────────

const FIELD_VERT = `
uniform float uTime;
attribute vec3 aRotationAxis;
attribute float aSpeed;
attribute float aPhase;
varying float vDepth;

void main() {
  vec3 pos = position;
  
  // Very slow orbit around region center
  float angle = uTime * aSpeed * 0.05 + aPhase;
  float s = sin(angle);
  float c = cos(angle);
  float nx = pos.x * c - pos.z * s;
  float nz = pos.x * s + pos.z * c;
  pos.x = nx; pos.z = nz;
  
  // Bobbing
  pos.y += sin(uTime * aSpeed * 0.2 + aPhase) * 50.0;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = (400.0 / vDepth);
}
`

const FIELD_FRAG = `
varying float vDepth;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  
  // Draw wireframe squares and triangles randomly
  float h = hash(vec2(vDepth, 1.0));
  float alpha = 0.0;
  
  if (h > 0.5) {
    // Square
    vec2 d = abs(uv) * 2.0;
    alpha = step(0.8, max(d.x, d.y)) * step(max(d.x, d.y), 1.0);
  } else {
    // Triangle approx
    float d = max(abs(uv.x) * 0.866025 + uv.y * 0.5, -uv.y);
    alpha = step(0.35, d) * step(d, 0.45);
  }
  
  // Distance fade
  float fade = smoothstep(2000.0, 500.0, vDepth);
  
  gl_FragColor = vec4(0.96, 0.62, 0.04, alpha * fade * 0.4);
}
`

function GeometryField() {
  const geo = useMemo(() => {
    const count = 300
    const pos = new Float32Array(count * 3)
    const axes = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const phases = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 1600
      pos[i*3+1] = (Math.random() - 0.5) * 800
      pos[i*3+2] = (Math.random() - 0.5) * 1600
      
      axes[i*3] = Math.random() - 0.5
      axes[i*3+1] = Math.random() - 0.5
      axes[i*3+2] = Math.random() - 0.5
      
      speeds[i] = Math.random() * 2.0 - 1.0
      phases[i] = Math.random() * Math.PI * 2
    }
    
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setAttribute('aRotationAxis', new Float32BufferAttribute(axes, 3))
    g.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1))
    g.setAttribute('aPhase', new Float32BufferAttribute(phases, 1))
    return g
  }, [])

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: FIELD_VERT,
    fragmentShader: FIELD_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <points position={POS} geometry={geo} material={mat} />
  )
}

export default function ExploreRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={2000} spread={400} opacity={0.2} position={POS} />
      <NebulaCloud color="#B45309" count={1500} spread={250} opacity={0.15} position={POS} />

      <BeaconPath />
      <GeometryField />

      {region.objects.map(renderObject)}
    </group>
  )
}
