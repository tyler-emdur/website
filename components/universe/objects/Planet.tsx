'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Color, BackSide, AdditiveBlending } from 'three'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'
import { useProximity } from '@/lib/proximity-system'

const PLANET_VERT = `
varying vec3 vNormal;
varying vec3 vViewPos;
varying vec3 vPos;
void main() {
  vPos = position;
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
uniform float uProximity;
varying vec3 vNormal;
varying vec3 vViewPos;
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
float fbm(vec3 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main() {
  float fresnel = dot(normalize(vNormal), normalize(vViewPos));
  float rim = pow(clamp(1.0 - fresnel, 0.0, 1.0), 2.8);

  // Sharp terminator line
  vec3 lightDir = normalize(vec3(2.0, 1.5, 3.0));
  float diffRaw = dot(vNormal, lightDir);
  float diff = smoothstep(-0.2, 0.2, diffRaw); // soft shadow edge
  float shadowTerm = smoothstep(-0.05, 0.05, diffRaw); // sharp terminator
  
  // Terminator glow
  float terminatorGlow = (1.0 - shadowTerm) * smoothstep(-0.3, 0.0, diffRaw) * 0.4;

  // Domain warping for surface
  vec3 p = normalize(vPos) * 2.0;
  // Rotate poles differently than equator
  float pole = abs(p.y);
  p.x += uTime * 0.02 * (1.0 - pole);
  
  vec3 q = vec3(fbm(p + vec3(0.0,0.0,uTime*0.01)), fbm(p + vec3(5.2,1.3,0.0)), fbm(p + vec3(9.2,3.3,0.0)));
  vec3 r = vec3(fbm(p + 4.0*q + vec3(1.7,9.2,0.0)), fbm(p + 4.0*q + vec3(8.3,2.8,0.0)), 0.0);
  float n = fbm(p + 4.0*r);
  
  // Proximity details
  n += noise(p * 12.0) * 0.1 * uProximity;

  // Color mapping
  vec3 darkCol = uColor * 0.2;
  vec3 midCol = uColor;
  vec3 brightCol = mix(uColor, vec3(1.0), 0.6);
  
  vec3 surfaceCol = mix(darkCol, midCol, smoothstep(0.2, 0.6, n));
  surfaceCol = mix(surfaceCol, brightCol, smoothstep(0.7, 0.9, n));

  vec3 col = surfaceCol * (diff * 0.8 + 0.2); // ambient + diffuse
  col += uGlow * terminatorGlow;
  col = mix(col, uGlow, rim * (0.6 + uHovered * 0.4));
  col += uGlow * uHovered * 0.3;

  gl_FragColor = vec4(col, 1.0);
}
`

const ATMO_FRAG = `
uniform vec3 uGlow;
uniform float uHovered;
uniform float uProximity;
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewPos;
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
  float fresnel = dot(normalize(vNormal), normalize(vViewPos));
  float rim = pow(clamp(1.0 - fresnel, 0.0, 1.0), 1.8);
  
  // Proximity-reactive turbulence
  float turb = 0.0;
  if (uProximity > 0.1) {
    turb = noise(normalize(vPos) * 8.0 + uTime * 0.2) * 0.2 * uProximity;
  }
  
  float alpha = (rim + turb) * (0.18 + uHovered * 0.25);
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
  const { zone } = useProximity(obj.position)

  const visible = isVisible(obj)

  const planetMat = useMemo(() => new ShaderMaterial({
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color).multiplyScalar(0.6) },
      uGlow: { value: new Color(obj.color) },
      uTime: { value: 0 },
      uHovered: { value: 0 },
      uProximity: { value: 0 },
    },
  }), [obj.color])

  const atmoMat = useMemo(() => new ShaderMaterial({
    vertexShader: PLANET_VERT,
    fragmentShader: ATMO_FRAG,
    uniforms: {
      uGlow: { value: new Color(obj.color) },
      uHovered: { value: 0 },
      uProximity: { value: 0 },
      uTime: { value: 0 },
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
    atmoMat.uniforms.uTime.value = t

    const proxTarget = zone === 'close' ? 1.0 : zone === 'near' ? 0.3 : 0.0
    planetMat.uniforms.uProximity.value += (proxTarget - planetMat.uniforms.uProximity.value) * 0.05
    atmoMat.uniforms.uProximity.value = planetMat.uniforms.uProximity.value

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
        <sphereGeometry args={[size, 48, 48]} />
      </mesh>

      {/* Planet body */}
      <mesh
        ref={meshRef}
        material={planetMat}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
      >
        <sphereGeometry args={[size, 48, 48]} />
      </mesh>
    </group>
  )
}
