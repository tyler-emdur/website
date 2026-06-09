'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, ShaderMaterial, Color } from 'three'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'
import { useProximityStore } from '@/lib/proximity-system'

const region = REGIONS.find(r => r.id === 'running')!
const COLOR = '#10B981'
const POS = region.position

// ─── TERRAIN ─────────────────────────────────────────────────────────────────

const TERRAIN_VERT = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
float noise(vec2 x) {
  vec2 i = floor(x); vec2 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Create rolling terrain that scrolls endlessly
  vec2 p = uv * 10.0;
  p.y -= uTime * 0.2; // Move terrain forward
  
  float h = fbm(p);
  
  // Only raise terrain in the middle, leaving a flat "path"
  float path = smoothstep(0.4, 0.6, abs(uv.x - 0.5) * 2.0);
  
  pos.z += h * 120.0 * path; // z is up because plane is rotated
  vPos = pos;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const TERRAIN_FRAG = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPos;

void main() {
  // Grid lines
  vec2 grid = fract(vUv * vec2(40.0, 100.0) + vec2(0.0, uTime * -2.0));
  float line = step(0.95, grid.x) + step(0.95, grid.y);
  
  // Height-based coloring
  float h = clamp(vPos.z / 120.0, 0.0, 1.0);
  vec3 baseCol = mix(vec3(0.0, 0.2, 0.1), vec3(0.1, 0.6, 0.3), h);
  vec3 lineCol = vec3(0.1, 0.8, 0.4);
  
  vec3 col = mix(baseCol, lineCol, clamp(line, 0.0, 1.0));
  
  // Fade out edges
  float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) *
               smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
               
  gl_FragColor = vec4(col, edge * (0.2 + h * 0.4));
}
`

function Terrain() {
  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: TERRAIN_VERT,
    fragmentShader: TERRAIN_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    wireframe: true,
  }), [])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <mesh position={[POS[0], POS[1] - 300, POS[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1200, 2000, 60, 100]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ─── DATA STREAMS ────────────────────────────────────────────────────────────

const STREAM_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const STREAM_FRAG = `
uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uOffset;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

void main() {
  float t = uTime * uSpeed + uOffset;
  
  // Flowing dash pattern
  float flow = fract(vUv.y * 5.0 - t);
  float dash = step(0.4, flow);
  
  // Random brightness flickering
  float noise = hash(vec2(floor(vUv.y * 20.0 - t * 4.0), vUv.x));
  
  // Edge fade
  float fade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
  
  vec3 col = uColor * (0.5 + noise * 1.5);
  gl_FragColor = vec4(col, dash * fade * 0.8);
}
`

function DataStream({ position, rotation, length, speed, offset }: any) {
  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: STREAM_VERT,
    fragmentShader: STREAM_FRAG,
    uniforms: { 
      uTime: { value: 0 },
      uColor: { value: new Color('#34D399') },
      uSpeed: { value: speed },
      uOffset: { value: offset },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [speed, offset])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <mesh position={position} rotation={rotation} material={mat}>
      <planeGeometry args={[10, length]} />
    </mesh>
  )
}

// ─── TOPOGRAPHIC RINGS ───────────────────────────────────────────────────────

function TopoRing({ position, scale, speed, offset }: any) {
  const ref = useRef<any>(null)
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * speed + offset
    }
  })
  
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[100, 102, 64]} />
        <meshBasicMaterial color="#059669" transparent opacity={0.3} side={2} />
      </mesh>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[120, 121, 64]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.15} side={2} />
      </mesh>
    </group>
  )
}

export default function RunningRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={1800} spread={350} opacity={0.2} position={POS} />
      <NebulaCloud color="#047857" count={1200} spread={200} opacity={0.15} position={POS} />

      <Terrain />
      
      {/* Streams flowing towards the user */}
      <DataStream position={[POS[0] - 150, POS[1] - 250, POS[2] + 200]} rotation={[-Math.PI/2, 0, 0]} length={1000} speed={1.2} offset={0} />
      <DataStream position={[POS[0] + 200, POS[1] - 280, POS[2] - 100]} rotation={[-Math.PI/2, 0, 0]} length={1200} speed={0.8} offset={4.5} />
      <DataStream position={[POS[0] + 50, POS[1] - 220, POS[2] + 400]} rotation={[-Math.PI/2, 0, 0]} length={800} speed={1.5} offset={2.1} />

      {region.objects.map((obj, i) => (
        <group key={i}>
          {renderObject(obj)}
          <TopoRing position={[obj.position[0], obj.position[1] - (obj.size ?? 20) * 1.5, obj.position[2]]} scale={obj.size ? obj.size / 30 : 1} speed={0.2} offset={i} />
        </group>
      ))}
    </group>
  )
}
