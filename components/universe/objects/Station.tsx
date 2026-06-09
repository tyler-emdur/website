'use client'
import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, ShaderMaterial, AdditiveBlending, Color } from 'three'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'
import { useProximity } from '@/lib/proximity-system'

const HULL_VERT = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPos;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

const HULL_FRAG = `
uniform vec3 uColor;
uniform float uHovered;
uniform float uProximity;
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPos;

float noise2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  // Panel grid
  vec2 grid = fract(vUv * vec2(24.0, 8.0));
  float line = step(0.95, grid.x) + step(0.95, grid.y);
  line = clamp(line, 0.0, 1.0);

  // Surface variation
  float n = noise2(floor(vUv * vec2(24.0, 8.0)));
  
  // Windows
  float windowChance = step(0.85, n) * step(0.2, vUv.y) * step(vUv.y, 0.8);
  float windowPhase = sin(uTime * 2.0 + n * 10.0) * 0.5 + 0.5;
  // Lights activate heavily when close
  float windowLight = windowChance * (0.2 + uProximity * 0.8 * windowPhase);

  vec3 baseCol = uColor * (0.3 + n * 0.1);
  vec3 panelCol = mix(baseCol, uColor * 0.1, line);
  
  vec3 windowColor = mix(vec3(1.0, 0.9, 0.6), vec3(0.2, 0.8, 1.0), n);
  vec3 col = mix(panelCol, windowColor * 2.0, windowLight);

  float fresnel = dot(normalize(vNormal), normalize(vViewPos));
  col += uColor * pow(clamp(1.0 - fresnel, 0.0, 1.0), 3.0) * (0.5 + uHovered * 0.5);

  gl_FragColor = vec4(col, 1.0);
}
`

const BLINK_FRAG = `
uniform vec3 uColor;
uniform float uTime;
uniform float uOffset;
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  float circle = smoothstep(1.0, 0.8, r);
  
  // Strobe effect: blink twice fast, then pause
  float t = fract(uTime * 0.5 + uOffset);
  float blink = step(t, 0.05) + (step(0.15, t) * step(t, 0.2));
  
  gl_FragColor = vec4(uColor, circle * blink * 0.9);
}
`

const BLINK_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  // Billboard
  mv.xy += position.xy;
  gl_Position = projectionMatrix * mv;
}
`

interface StationProps { obj: UniverseObject }

export default function Station({ obj }: StationProps) {
  const groupRef = useRef<Group>(null)
  const ringRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const { selectObject, isVisible } = useUniverseStore()
  const { zone } = useProximity(obj.position)

  const visible = isVisible(obj)

  const hullMat = useMemo(() => new ShaderMaterial({
    vertexShader: HULL_VERT,
    fragmentShader: HULL_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uHovered: { value: 0 },
      uProximity: { value: 0 },
      uTime: { value: 0 },
    },
  }), [obj.color])

  const blinkMat = useMemo(() => new ShaderMaterial({
    vertexShader: BLINK_VERT,
    fragmentShader: BLINK_FRAG,
    uniforms: {
      uColor: { value: new Color('#ff3333') },
      uTime: { value: 0 },
      uOffset: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])

  useFrame((state) => {
    if (!groupRef.current || !ringRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.y = t * 0.05
    ringRef.current.rotation.z = t * 0.2

    hullMat.uniforms.uTime.value = t
    blinkMat.uniforms.uTime.value = t
    
    hullMat.uniforms.uHovered.value += ((hovered ? 1 : 0) - hullMat.uniforms.uHovered.value) * 0.1
    
    const proxTarget = zone === 'close' ? 1.0 : zone === 'near' ? 0.3 : 0.0
    hullMat.uniforms.uProximity.value += (proxTarget - hullMat.uniforms.uProximity.value) * 0.05
  })

  if (!visible) return null
  const s = (obj.size ?? 14) / 14

  return (
    <group
      ref={groupRef}
      position={obj.position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
    >
      {/* Core cylinder */}
      <mesh material={hullMat}>
        <cylinderGeometry args={[s * 5, s * 5, s * 18, 16]} />
      </mesh>

      {/* Docking port caps */}
      <mesh position={[0, s * 9, 0]}>
        <cylinderGeometry args={[s * 3, s * 5, s * 1, 16]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0, -s * 9, 0]}>
        <cylinderGeometry args={[s * 3, s * 5, s * 1, 16]} />
        <meshBasicMaterial color="#111" />
      </mesh>

      {/* Cross arms */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[s * 1.5, s * 1.5, s * 40, 8]} />
        <meshBasicMaterial color={obj.color} wireframe transparent opacity={0.3} />
      </mesh>

      {/* Rotating ring */}
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[s * 16, s * 1.5, 8, 48]} />
          <meshBasicMaterial color={obj.color} transparent opacity={0.15 + (hovered ? 0.2 : 0)} wireframe />
        </mesh>
        
        {/* Antenna arrays on ring */}
        <mesh position={[s * 16, 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[s*0.2, s*0.5, s*8]} />
          <meshBasicMaterial color={obj.color} transparent opacity={0.5} />
        </mesh>
        <mesh position={[-s * 16, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
          <cylinderGeometry args={[s*0.2, s*0.5, s*8]} />
          <meshBasicMaterial color={obj.color} transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, s * 16, 0]}>
          <cylinderGeometry args={[s*0.2, s*0.5, s*8]} />
          <meshBasicMaterial color={obj.color} transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, -s * 16, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[s*0.2, s*0.5, s*8]} />
          <meshBasicMaterial color={obj.color} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Blink lights at ends of arms */}
      <mesh position={[s * 20, 0, 0]} material={blinkMat}>
        <planeGeometry args={[s * 4, s * 4]} />
      </mesh>
      <mesh position={[-s * 20, 0, 0]} material={blinkMat}>
        <planeGeometry args={[s * 4, s * 4]} />
      </mesh>
    </group>
  )
}
