'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, ShaderMaterial, Color, BufferGeometry, Float32BufferAttribute } from 'three'
import { REGIONS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'
import NebulaCloud, { NebulaHalo } from '../scene/NebulaCloud'

const region = REGIONS.find(r => r.id === 'archives')!
const COLOR = '#9CA3AF'
const POS = region.position

// ─── MONOLITH SLABS ──────────────────────────────────────────────────────────

const SLAB_VERT = `
varying vec3 vPos;
varying vec3 vNormal;
void main() {
  vPos = position;
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const SLAB_FRAG = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  // Glyph lines scrolling down
  float lines = step(0.9, hash(floor(vPos.xy * vec2(0.5, 0.2) + vec2(0.0, uTime * 0.5))));
  
  // Edge wear
  float edge = smoothstep(0.4, 0.5, abs(vPos.x / 100.0)) + smoothstep(0.4, 0.5, abs(vPos.z / 40.0));
  
  vec3 baseCol = vec3(0.05, 0.05, 0.08);
  vec3 glowCol = vec3(0.5, 0.5, 0.6);
  
  vec3 col = mix(baseCol, glowCol, lines * 0.2);
  col += vec3(0.1, 0.1, 0.15) * edge;

  float diff = max(0.0, dot(normalize(vNormal), vec3(0.5, 1.0, 0.5)));
  col *= (0.2 + diff * 0.8);

  gl_FragColor = vec4(col, 0.6);
}
`

function MonolithSlab({ position, rotation, scale }: any) {
  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: SLAB_VERT,
    fragmentShader: SLAB_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
  }), [])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <mesh position={position} rotation={rotation} scale={scale} material={mat}>
      <boxGeometry args={[200, 800, 80]} />
    </mesh>
  )
}

// ─── DUST MOTES ──────────────────────────────────────────────────────────────

const DUST_VERT = `
uniform float uTime;
attribute vec3 aOffset;
varying float vAlpha;

void main() {
  vec3 pos = position;
  // Slow swirling motion
  pos.x += sin(uTime * 0.1 + aOffset.x) * 100.0;
  pos.y += cos(uTime * 0.08 + aOffset.y) * 100.0;
  pos.z += sin(uTime * 0.12 + aOffset.z) * 100.0;
  
  // Twinkling
  vAlpha = (sin(uTime * 2.0 + aOffset.x * 10.0) * 0.5 + 0.5) * 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 3.0;
}
`

const DUST_FRAG = `
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv) * 2.0;
  float circle = smoothstep(1.0, 0.5, r);
  gl_FragColor = vec4(0.8, 0.8, 0.9, circle * vAlpha);
}
`

function DustMotes() {
  const geo = useMemo(() => {
    const count = 2000
    const pos = new Float32Array(count * 3)
    const offsets = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 2000
      offsets[i] = Math.random() * Math.PI * 2
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setAttribute('aOffset', new Float32BufferAttribute(offsets, 3))
    return g
  }, [])

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
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

// ─── VOLUMETRIC SHAFT ────────────────────────────────────────────────────────

const SHAFT_VERT = `
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const SHAFT_FRAG = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  float fadeY = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
  
  // Light beams shifting
  float beams = sin(vUv.x * 20.0 + uTime * 0.5) * 0.5 + 0.5;
  beams *= sin(vUv.x * 8.0 - uTime * 0.2) * 0.5 + 0.5;
  
  // Dust motes in the shaft
  float dust = step(0.98, hash(vPos.xy * 0.1 + vec2(0.0, uTime * 0.5)));
  
  vec3 col = vec3(0.6, 0.7, 0.8);
  float alpha = (beams * 0.15 + dust * 0.3) * fadeY;
  
  gl_FragColor = vec4(col, alpha);
}
`

function LightShaft({ position }: { position: [number, number, number] }) {
  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: SHAFT_VERT,
    fragmentShader: SHAFT_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <mesh position={[position[0], position[1] + 400, position[2]]}>
      <cylinderGeometry args={[80, 120, 1000, 16, 1, true]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

export default function ArchivesRegion() {
  return (
    <group>
      <NebulaHalo color={COLOR} position={POS} />
      <NebulaCloud color={COLOR} count={1500} spread={350} opacity={0.15} position={POS} />
      <NebulaCloud color="#4B5563" count={1500} spread={250} opacity={0.2} position={POS} />

      <DustMotes />
      
      {/* Surrounding monoliths creating an aisle or temple-like feel */}
      <MonolithSlab position={[POS[0] - 400, POS[1], POS[2] - 300]} rotation={[0, 0.2, 0]} scale={[1, 1.2, 1]} />
      <MonolithSlab position={[POS[0] + 350, POS[1] - 100, POS[2] - 150]} rotation={[0.1, -0.4, 0.05]} scale={[0.8, 0.9, 1]} />
      <MonolithSlab position={[POS[0] - 300, POS[1] + 200, POS[2] + 400]} rotation={[-0.05, 0.1, -0.1]} scale={[1.2, 0.8, 1]} />
      <MonolithSlab position={[POS[0] + 450, POS[1] - 50, POS[2] + 200]} rotation={[0, -0.1, 0]} scale={[1, 1.5, 1]} />

      {region.objects.map((obj, i) => (
        <group key={i}>
          {renderObject(obj)}
          {/* A shaft of light illuminating each archived object */}
          <LightShaft position={obj.position} />
        </group>
      ))}
    </group>
  )
}
