'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, ShaderMaterial, Color, AdditiveBlending } from 'three'
import { Billboard } from '@react-three/drei'
import { useUniverseStore, type UniverseObject } from '@/lib/universe-store'
import { useProximity } from '@/lib/proximity-system'

const RING_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const RING_FRAG = `
uniform vec3 uColor;
uniform float uPhase;
uniform float uAlpha;
uniform float uProximity;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

void main() {
  vec2 uv = vUv - 0.5;
  float r = length(uv) * 2.0;
  
  // Interference moire pattern
  float moire = sin(r * 80.0 - uTime * 2.0) * 0.5 + 0.5;
  
  // Data text fragments showing up on rings when close
  float data = step(0.9, hash(uv * floor(uTime * 10.0)));
  
  float ring = smoothstep(0.85, 1.0, r) * smoothstep(1.05, 1.0, r);
  float fade = 1.0 - uPhase;
  
  vec3 col = uColor;
  col += vec3(1.0) * data * uProximity * 0.5;
  col *= (1.0 + moire * 0.2);

  gl_FragColor = vec4(col, ring * fade * uAlpha * (0.5 + moire * 0.5));
}
`

const BEAM_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const BEAM_FRAG = `
uniform vec3 uColor;
uniform float uTime;
uniform float uAlpha;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

void main() {
  float core = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 3.0);
  float scan = step(0.95, fract(vUv.y * 10.0 - uTime * 2.0));
  float noise = hash(vUv * vec2(10.0, 100.0) + uTime);
  
  float edgeFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
  
  vec3 col = uColor * (core + scan * 2.0) * (0.8 + noise * 0.4);
  
  gl_FragColor = vec4(col, core * edgeFade * uAlpha * 0.5);
}
`

interface SignalProps {
  obj: UniverseObject
}

export default function Signal({ obj }: SignalProps) {
  const groupRef = useRef<Group>(null)
  const ref1 = useRef<Mesh>(null)
  const ref2 = useRef<Mesh>(null)
  const ref3 = useRef<Mesh>(null)
  const coreRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { selectObject, isVisible } = useUniverseStore()
  const { zone } = useProximity(obj.position)

  const visible = isVisible(obj)

  const makeMat = useMemo(() => () => new ShaderMaterial({
    vertexShader: RING_VERT,
    fragmentShader: RING_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uPhase: { value: 0 },
      uAlpha: { value: 1 },
      uProximity: { value: 0 },
      uTime: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [obj.color])

  const mat1 = useMemo(makeMat, [makeMat])
  const mat2 = useMemo(makeMat, [makeMat])
  const mat3 = useMemo(makeMat, [makeMat])

  const beamMat = useMemo(() => new ShaderMaterial({
    vertexShader: BEAM_VERT,
    fragmentShader: BEAM_FRAG,
    uniforms: {
      uColor: { value: new Color(obj.color) },
      uTime: { value: 0 },
      uAlpha: { value: 1 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [obj.color])

  const size = obj.size ?? 8
  const PERIOD = 2.5

  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    // Proximity speeds up the cycle
    const proxTarget = zone === 'close' ? 1.0 : zone === 'near' ? 0.3 : 0.0
    mat1.uniforms.uProximity.value += (proxTarget - mat1.uniforms.uProximity.value) * 0.05
    mat2.uniforms.uProximity.value = mat1.uniforms.uProximity.value
    mat3.uniforms.uProximity.value = mat1.uniforms.uProximity.value
    
    const currentProx = mat1.uniforms.uProximity.value
    const speedMult = 1.0 + currentProx * 1.5

    const p1 = ((t * speedMult) % PERIOD) / PERIOD
    const p2 = (((t * speedMult) + PERIOD / 3) % PERIOD) / PERIOD
    const p3 = (((t * speedMult) + (PERIOD * 2) / 3) % PERIOD) / PERIOD

    // 12-second cycle of fading in and out of existence (faster when close)
    const signalAlpha = Math.max(0, Math.min(1, Math.sin((t / 12) * speedMult * Math.PI * 2) * 1.6 + 0.4))

    mat1.uniforms.uTime.value = t
    mat2.uniforms.uTime.value = t
    mat3.uniforms.uTime.value = t
    beamMat.uniforms.uTime.value = t

    if (mat1) { mat1.uniforms.uPhase.value = p1; mat1.uniforms.uAlpha.value = (hovered ? 1.4 : 0.8) * signalAlpha }
    if (mat2) { mat2.uniforms.uPhase.value = p2; mat2.uniforms.uAlpha.value = (hovered ? 1.4 : 0.8) * signalAlpha }
    if (mat3) { mat3.uniforms.uPhase.value = p3; mat3.uniforms.uAlpha.value = (hovered ? 1.4 : 0.8) * signalAlpha }
    beamMat.uniforms.uAlpha.value = (hovered ? 1.4 : 0.8) * signalAlpha

    const rings = [ref1, ref2, ref3]
    const phases = [p1, p2, p3]
    rings.forEach((r, i) => {
      if (r.current) {
        const s = size + phases[i] * size * 3
        r.current.scale.setScalar(s / size)
      }
    })

    if (coreRef.current) {
      const pulse = Math.sin(t * 4 * speedMult) * 0.15 + 1
      coreRef.current.scale.setScalar(pulse)
      const coreMat = coreRef.current.material as any
      if (coreMat) {
        coreMat.opacity = signalAlpha
      }
    }

    // Dynamic coordinates for void-drifter beacon
    if (groupRef.current) {
      if (obj.id === 'void-drifter') {
        groupRef.current.position.x = obj.position[0] + Math.sin(t * 0.015) * 650
        groupRef.current.position.y = obj.position[1] + Math.cos(t * 0.009) * 450
        groupRef.current.position.z = obj.position[2] + Math.sin(t * 0.006) * 100
      } else {
        groupRef.current.position.set(...obj.position)
      }
    }
  })

  if (!visible) return null

  return (
    <group ref={groupRef} position={obj.position}>
      <Billboard>
        {/* Pulsing rings */}
        {[mat1, mat2, mat3].map((mat, i) => (
          <mesh key={i} ref={[ref1, ref2, ref3][i]} material={mat}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
          >
            <circleGeometry args={[size, 32]} />
          </mesh>
        ))}
      </Billboard>

      {/* Vertical beam */}
      <Billboard follow={false} lockY={true}>
        <mesh material={beamMat} position={[0, size * 2, 0]}>
          <planeGeometry args={[size * 0.5, size * 6]} />
        </mesh>
        <mesh material={beamMat} position={[0, -size * 2, 0]} rotation={[0, 0, Math.PI]}>
          <planeGeometry args={[size * 0.5, size * 6]} />
        </mesh>
      </Billboard>

      {/* Core */}
      <mesh ref={coreRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); selectObject(obj) }}
      >
        <sphereGeometry args={[size * 0.3, 16, 16]} />
        <meshBasicMaterial color={obj.color} transparent opacity={1} />
      </mesh>
    </group>
  )
}
