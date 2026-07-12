'use client'
import { Suspense, useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { BufferGeometry, Float32BufferAttribute, PlaneGeometry, Points, ShaderMaterial, AdditiveBlending, Color, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { SCALE, GEO_RADIUS_WORLD } from '@/lib/geo'

export interface RouteActivity {
  id: string
  type: 'Run' | 'Ride' | 'Other'
  points: [number, number][]
  // present in the /api/strava payload; used to pick the most-recent run for the ghost trace
  date?: string
  name?: string
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

// A single soft light that endlessly retraces one route — the most recent run — along the same
// lofted trail the dots sit on. The map is a memory of a place; this makes the memory move. No
// label, no explanation: just a runner still out there, lap after lap. Freezes to a still point
// under prefers-reduced-motion. GPU cost is trivial (a head + a ~34-vertex fading tail).
function GhostRunner({ activity, terrain, minElev, lift, maxHeight }: { activity: RouteActivity; terrain: TerrainData; minElev: number; lift: number; maxHeight: number }) {
  const TAIL = 34
  const SAMPLES_PER_SEC = 9   // a patient jog, not a racer
  const headGeoRef = useRef<Points>(null)
  const tailGeoRef = useRef<Points>(null)
  const progress = useRef(0)

  const reduced = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  )

  // Loft the chosen route onto the terrain once, matching how RouteCloud places its dots.
  const route = useMemo(() => {
    const pts = activity.points
    const arr = new Float32Array(pts.length * 3)
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i]
      const h = Math.min(sampleTerrainHeight(terrain, minElev, x, z), maxHeight)
      arr[i * 3] = x
      arr[i * 3 + 1] = h + lift + 1.5 // sit a hair above the dot trail so the light reads clearly
      arr[i * 3 + 2] = z
    }
    return arr
  }, [activity, terrain, minElev, lift, maxHeight])

  const count = activity.points.length

  const headGeo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(3), 3))
    return g
  }, [])

  const tailGeo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(TAIL * 3), 3))
    // Bake the fade into vertex colors: with additive blending, dimmer color = more transparent.
    const colors = new Float32Array(TAIL * 3)
    const c = new Color('#FC4C02')
    for (let k = 0; k < TAIL; k++) {
      const inten = Math.pow(1 - k / TAIL, 1.8)
      colors[k * 3] = c.r * inten
      colors[k * 3 + 1] = c.g * inten
      colors[k * 3 + 2] = c.b * inten
    }
    g.setAttribute('color', new Float32BufferAttribute(colors, 3))
    return g
  }, [])

  useEffect(() => () => { headGeo.dispose(); tailGeo.dispose() }, [headGeo, tailGeo])

  // Wrapped, linearly-interpolated sample at a float index — so the loop seams smoothly.
  const sampleAt = useMemo(() => {
    return (f: number, out: [number, number, number]) => {
      const N = count
      const ff = ((f % N) + N) % N
      const i0 = Math.floor(ff)
      const i1 = (i0 + 1) % N
      const t = ff - i0
      out[0] = route[i0 * 3] + (route[i1 * 3] - route[i0 * 3]) * t
      out[1] = route[i0 * 3 + 1] + (route[i1 * 3 + 1] - route[i0 * 3 + 1]) * t
      out[2] = route[i0 * 3 + 2] + (route[i1 * 3 + 2] - route[i0 * 3 + 2]) * t
    }
  }, [route, count])

  const writeAt = useMemo(() => {
    const tmp: [number, number, number] = [0, 0, 0]
    return (f: number) => {
      if (!headGeoRef.current || !tailGeoRef.current) return
      const hp = headGeoRef.current.geometry.attributes.position as Float32BufferAttribute
      sampleAt(f, tmp)
      hp.setXYZ(0, tmp[0], tmp[1], tmp[2])
      hp.needsUpdate = true
      const tp = tailGeoRef.current.geometry.attributes.position as Float32BufferAttribute
      for (let k = 0; k < TAIL; k++) {
        sampleAt(f - k, tmp)
        tp.setXYZ(k, tmp[0], tmp[1], tmp[2])
      }
      tp.needsUpdate = true
    }
  }, [sampleAt])

  // Seed the initial pose (and the only pose, under reduced motion).
  useEffect(() => { writeAt(0) }, [writeAt])

  useFrame((_, dt) => {
    if (reduced) return
    progress.current += Math.min(dt, 0.05) * SAMPLES_PER_SEC
    writeAt(progress.current)
  })

  if (count < 8) return null

  return (
    <group renderOrder={2}>
      <points ref={tailGeoRef} geometry={tailGeo}>
        <pointsMaterial size={3.2} vertexColors transparent opacity={0.9} sizeAttenuation={false} blending={AdditiveBlending} depthWrite={false} depthTest={false} />
      </points>
      <points ref={headGeoRef} geometry={headGeo}>
        <pointsMaterial size={7} color="#ffdcb4" transparent opacity={1} sizeAttenuation={false} blending={AdditiveBlending} depthWrite={false} depthTest={false} />
      </points>
    </group>
  )
}

// Fakes an extruded 3D block out of flat SDF text (cheap, GPU-safe) by stacking many copies
// a hair's-width apart in Z with a front-to-back color gradient — a solid-looking block from any
// angle without the heavy CPU-side geometry a true extruded font (Text3D) generates per glyph.
function ExtrudedTextLine({ text, y, size }: { text: string; y: number; size: number }) {
  const LAYERS = 10
  const stepDepth = size * 0.05
  const front = new Color('#f5f8fc')
  const back = new Color('#7a3312')

  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: LAYERS }).map((_, i) => {
        const t = i / (LAYERS - 1)
        const col = front.clone().lerp(back, t)
        return (
          <Text
            key={i}
            position={[0, 0, -i * stepDepth]}
            fontSize={size}
            color={col}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.02}
            outlineWidth={i === 0 ? size * 0.02 : 0}
            outlineColor="#FC4C02"
          >
            {text}
          </Text>
        )
      })}
    </group>
  )
}

function SkyText({ radius }: { radius: number }) {
  const size = radius * 0.1
  const y = radius * 0.9
  const z = -radius * 0.2

  return (
    <group position={[0, y, z]}>
      <ExtrudedTextLine text="TYLER STRAVA" y={size * 0.65} size={size} />
      <ExtrudedTextLine text="RUN MAP" y={-size * 0.65} size={size} />
    </group>
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

  // The ghost retraces the most recent run with enough shape to be worth watching. Sort by the
  // per-activity date carried in the payload; fall back to the longest route if dates are absent.
  const ghost = useMemo(() => {
    const usable = activities.filter(a => a.points.length >= 8)
    if (usable.length === 0) return null
    const dated = usable.filter(a => a.date)
    if (dated.length > 0) {
      return dated.reduce((best, a) => (a.date! > best.date! ? a : best))
    }
    return usable.reduce((best, a) => (a.points.length > best.points.length ? a : best))
  }, [activities])

  return (
    <>
      <color attach="background" args={['#050506']} />
      <fog attach="fog" args={['#050506', GEO_RADIUS_WORLD * 2.2, GEO_RADIUS_WORLD * 5]} />
      <TerrainMesh terrain={terrain} minElev={minElev} />
      <RouteCloud activities={activities} terrain={terrain} minElev={minElev} lift={routeLift} maxHeight={routeMaxHeight} />
      {ghost && (
        <GhostRunner activity={ghost} terrain={terrain} minElev={minElev} lift={routeLift} maxHeight={routeMaxHeight} />
      )}
      {/* drei's <Text> suspends while its font loads — isolate it so a slow
          font fetch can't hold the terrain and routes off-screen */}
      <Suspense fallback={null}>
        <SkyText radius={GEO_RADIUS_WORLD} />
      </Suspense>
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
