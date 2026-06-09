'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, ShaderMaterial, Color, BufferGeometry, Float32BufferAttribute, Points } from 'three'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'lab')!
const COLOR = '#A855F7'
const POS = region.position

// ─── CONTAINMENT GRID ────────────────────────────────────────────────────────

const GRID_VERT = `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const GRID_FRAG = `
uniform float uTime;
varying vec3 vPos;

float hash(float n) { return fract(sin(n) * 43758.5453); }

void main() {
  // Arcing electricity along the edges
  float arc = step(0.98, fract(vPos.x * 0.05 + uTime * 2.0));
  arc += step(0.98, fract(vPos.y * 0.05 - uTime * 1.5));
  arc += step(0.98, fract(vPos.z * 0.05 + uTime * 3.0));
  
  // Base wireframe visibility
  float alpha = 0.05 + arc * 0.4;
  vec3 col = mix(vec3(0.5, 0.2, 0.8), vec3(0.8, 0.4, 1.0), arc);

  gl_FragColor = vec4(col, alpha);
}
`

function ContainmentGrid() {
  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: GRID_VERT,
    fragmentShader: GRID_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    wireframe: true,
  }), [])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <mesh position={POS} material={mat}>
      <boxGeometry args={[1400, 1000, 1200]} />
    </mesh>
  )
}

// ─── PARTICLE ACCELERATOR RING ───────────────────────────────────────────────

const RING_VERT = `
uniform float uTime;
attribute float aOffset;
varying float vAlpha;

void main() {
  // Particles traveling around the ring
  float angle = aOffset + uTime * 4.0;
  
  float r = 500.0 + sin(aOffset * 20.0) * 10.0;
  vec3 pos = vec3(cos(angle) * r, position.y, sin(angle) * r);
  
  // Clump them together
  vAlpha = pow(sin(angle * 8.0) * 0.5 + 0.5, 4.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 4.0;
}
`

const RING_FRAG = `
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv) * 2.0;
  float circle = smoothstep(1.0, 0.8, r);
  gl_FragColor = vec4(0.8, 0.3, 1.0, circle * vAlpha * 0.8);
}
`

function AcceleratorRing() {
  const geo = useMemo(() => {
    const count = 400
    const pos = new Float32Array(count * 3)
    const offsets = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      offsets[i] = (i / count) * Math.PI * 2
      pos[i*3+1] = (Math.random() - 0.5) * 20
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setAttribute('aOffset', new Float32BufferAttribute(offsets, 1))
    return g
  }, [])

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: RING_VERT,
    fragmentShader: RING_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <group position={POS} rotation={[0.2, 0.5, -0.1]}>
      {/* Ghost ring structure */}
      <mesh>
        <torusGeometry args={[500, 4, 8, 64]} />
        <meshBasicMaterial color="#301040" transparent opacity={0.3} wireframe />
      </mesh>
      <points geometry={geo} material={mat} />
    </group>
  )
}

// ─── EM INTERFERENCE SCREENS ─────────────────────────────────────────────────

const STATIC_FRAG = `
uniform float uTime;
varying vec2 vUv;
float hash2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  float n = hash2(vUv * vec2(100.0, 50.0) + fract(uTime));
  float scanline = step(0.5, sin(vUv.y * 100.0 - uTime * 10.0));
  vec3 col = mix(vec3(0.1, 0.0, 0.2), vec3(0.5, 0.2, 0.8), n);
  col *= (0.8 + scanline * 0.2);
  
  float edge = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x) *
               smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
               
  gl_FragColor = vec4(col, edge * 0.4);
}
`

function EMScreen({ position, rotation, size }: { position: [number, number, number], rotation: [number, number, number], size: [number, number] }) {
  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: STATIC_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [])
  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })
  return (
    <mesh position={position} rotation={rotation} material={mat}>
      <planeGeometry args={size} />
    </mesh>
  )
}

// ─── UNSTABLE FLOOR ──────────────────────────────────────────────────────────

const FLOOR_VERT = `
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 pos = position;
  float dist = length(position.xy);
  // Warping/tearing in the center
  float warp = sin(dist * 0.05 - uTime * 2.0) * smoothstep(600.0, 0.0, dist) * 40.0;
  pos.z += warp;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

function UnstableFloor() {
  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: FLOOR_VERT,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        vec2 grid = fract(vUv * 40.0);
        float line = step(0.95, grid.x) + step(0.95, grid.y);
        float dist = length(vUv - 0.5) * 2.0;
        float alpha = clamp(line, 0.0, 1.0) * smoothstep(1.0, 0.4, dist);
        gl_FragColor = vec4(0.4, 0.1, 0.6, alpha * 0.3);
      }
    `,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    wireframe: false,
  }), [])
  
  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <mesh position={[POS[0], POS[1] - 400, POS[2]]} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
      <planeGeometry args={[1400, 1400, 40, 40]} />
    </mesh>
  )
}

export default function LabRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={2200} spread={360} opacity={0.3} position={POS} />
      <NebulaCloud color="#7C3AED" count={1000} spread={160} opacity={0.22} position={POS} />

      <ContainmentGrid />
      <AcceleratorRing />
      <UnstableFloor />
      
      <EMScreen position={[POS[0] + 300, POS[1] + 150, POS[2] - 200]} rotation={[0, -0.5, 0.1]} size={[200, 120]} />
      <EMScreen position={[POS[0] - 250, POS[1] - 100, POS[2] + 150]} rotation={[0, 0.8, -0.05]} size={[160, 90]} />
      <EMScreen position={[POS[0] + 50, POS[1] + 250, POS[2] + 300]} rotation={[0.2, 3.1, 0]} size={[240, 140]} />

      {region.objects.map(renderObject)}
    </group>
  )
}
