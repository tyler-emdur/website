'use client'
import { useMemo, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { BufferGeometry, Float32BufferAttribute, PlaneGeometry, Points, ShaderMaterial, AdditiveBlending, Color, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { SCALE, GEO_RADIUS_WORLD } from '@/lib/geo'

export interface RouteActivity {
  id: string
  type: 'Run' | 'Ride' | 'Other'
  points: [number, number][]
}

export interface TerrainData {
  resolution: number
  radius: number
  elevations: number[]
}

const COLORS: Record<RouteActivity['type'], string> = {
  Run: '#FC4C02',   // Strava orange
  Ride: '#5ecbe0',  // site accent cyan, for contrast
  Other: '#8892a0',
}

const FOV = 50
const EXAGGERATION = 3.5  // vertical relief is subtle at true scale — punch it up, but the western foothills shouldn't dominate the view

// Bilinear-sample the elevation grid at an arbitrary world (x, z), returning a world-unit height.
// Row/col mapping must match how `/api/terrain` built the grid and how TerrainMesh rotates it.
function sampleTerrainHeight(terrain: TerrainData, minElev: number, x: number, z: number): number {
  const { resolution, radius, elevations } = terrain
  const fc = ((x + radius) / (radius * 2)) * (resolution - 1)
  const fr = ((radius - z) / (radius * 2)) * (resolution - 1)
  const c0 = Math.max(0, Math.min(resolution - 1, Math.floor(fc)))
  const r0 = Math.max(0, Math.min(resolution - 1, Math.floor(fr)))
  const c1 = Math.min(resolution - 1, c0 + 1)
  const r1 = Math.min(resolution - 1, r0 + 1)
  const tx = Math.max(0, Math.min(1, fc - c0))
  const tz = Math.max(0, Math.min(1, fr - r0))
  const e00 = elevations[r0 * resolution + c0]
  const e10 = elevations[r0 * resolution + c1]
  const e01 = elevations[r1 * resolution + c0]
  const e11 = elevations[r1 * resolution + c1]
  const e0 = e00 + (e10 - e00) * tx
  const e1 = e01 + (e11 - e01) * tx
  const e = e0 + (e1 - e0) * tz
  return (e - minElev) * SCALE * EXAGGERATION
}

const TERRAIN_VERT = `
varying vec3 vNormal;
varying vec2 vLocalXY;
void main() {
  vNormal = normalMatrix * normal;
  vLocalXY = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const TERRAIN_FRAG = `
uniform vec3 uColor;
uniform float uRadius;
uniform vec3 uLightDir;
varying vec3 vNormal;
varying vec2 vLocalXY;
void main() {
  float dist = length(vLocalXY);
  float edge = smoothstep(uRadius, uRadius * 0.94, dist);
  if (edge <= 0.001) discard;
  vec3 n = normalize(vNormal);
  float diffuse = max(dot(n, normalize(uLightDir)), 0.0);
  vec3 col = uColor * (0.5 + diffuse * 1.0);
  gl_FragColor = vec4(col, edge);
}
`

function TerrainMesh({ terrain, minElev }: { terrain: TerrainData; minElev: number }) {
  const { resolution, radius, elevations } = terrain

  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(radius * 2, radius * 2, resolution - 1, resolution - 1)
    const pos = geo.attributes.position
    for (let i = 0; i < elevations.length; i++) {
      pos.setZ(i, (elevations[i] - minElev) * SCALE * EXAGGERATION)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [resolution, radius, elevations, minElev])

  const material = useMemo(() => new ShaderMaterial({
    vertexShader: TERRAIN_VERT,
    fragmentShader: TERRAIN_FRAG,
    uniforms: {
      uColor: { value: new Color('#5b7aa8') },
      uRadius: { value: radius },
      uLightDir: { value: new Vector3(0.5, 1, 0.35) },
    },
    transparent: true,
    depthWrite: true,
  }), [radius])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  return <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0} />
}

function RouteCloud({ activities, terrain, minElev, lift, maxHeight }: { activities: RouteActivity[]; terrain: TerrainData; minElev: number; lift: number; maxHeight: number }) {
  const ref = useRef<Points>(null)

  const geometry = useMemo(() => {
    let n = 0
    for (const a of activities) n += a.points.length
    const positions = new Float32Array(n * 3)
    const colors = new Float32Array(n * 3)
    let i = 0
    for (const a of activities) {
      const c = new Color(COLORS[a.type])
      for (const [x, z] of a.points) {
        // Cap how high real elevation can loft a dot — a point near a sharp local peak (common
        // near the crop edge, where foothill terrain rises fast) would otherwise sit high enough
        // above the surrounding map that it visually reads as a disconnected floating fragment.
        const h = Math.min(sampleTerrainHeight(terrain, minElev, x, z), maxHeight)
        positions[i * 3] = x
        positions[i * 3 + 1] = h + lift
        positions[i * 3 + 2] = z
        colors[i * 3] = c.r
        colors[i * 3 + 1] = c.g
        colors[i * 3 + 2] = c.b
        i++
      }
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3))
    return geo
  }, [activities, terrain, minElev, lift, maxHeight])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <points ref={ref} geometry={geometry} renderOrder={1}>
      <pointsMaterial
        size={2.2}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation={false}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function Scene({ activities, terrain }: { activities: RouteActivity[]; terrain: TerrainData }) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const minElev = useMemo(() => Math.min(...terrain.elevations), [terrain])
  // Scale the lift with the terrain's actual relief range (not a fixed constant) so it stays
  // proportionally safe against CPU/GPU interpolation mismatch regardless of crop radius or
  // exaggeration — a fixed number silently breaks any time those change.
  const reliefRange = useMemo(() => (Math.max(...terrain.elevations) - minElev) * SCALE * EXAGGERATION, [terrain, minElev])
  const routeLift = Math.max(4, reliefRange * 0.12)
  const routeMaxHeight = reliefRange * 0.5 // dots never loft past mid-height, even on a sharp local peak

  return (
    <>
      <color attach="background" args={['#050506']} />
      <fog attach="fog" args={['#050506', GEO_RADIUS_WORLD * 2.2, GEO_RADIUS_WORLD * 5]} />
      <TerrainMesh terrain={terrain} minElev={minElev} />
      <RouteCloud activities={activities} terrain={terrain} minElev={minElev} lift={routeLift} maxHeight={routeMaxHeight} />
      <OrbitControls
        ref={controlsRef}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.08}
        minDistance={GEO_RADIUS_WORLD * 0.15}
        maxDistance={GEO_RADIUS_WORLD * 3}
        maxPolarAngle={Math.PI * 0.49}
        minPolarAngle={0.05}
      />
    </>
  )
}

export default function StravaCanvas({ activities, terrain }: { activities: RouteActivity[]; terrain: TerrainData }) {
  const camDistance = (GEO_RADIUS_WORLD * 1.3) / Math.tan((FOV / 2) * (Math.PI / 180))

  return (
    <Canvas
      camera={{ position: [camDistance * 0.65, camDistance * 0.6, camDistance * 0.65], fov: FOV, near: 0.5, far: camDistance * 6 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene activities={activities} terrain={terrain} />
    </Canvas>
  )
}
