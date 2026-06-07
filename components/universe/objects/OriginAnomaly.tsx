'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { ShaderMaterial, AdditiveBlending } from 'three'
import { ORIGIN_OBJECT, useUniverseStore } from '@/lib/universe-store'

// ─── VERTEX ──────────────────────────────────────────────────────────────────
const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// ─── FRAGMENT ────────────────────────────────────────────────────────────────
const FRAG = `
uniform float uTime;
varying vec2 vUv;

float ring(float r, float center, float width) {
  return smoothstep(center - width, center - width * 0.3, r)
       * smoothstep(center + width, center + width * 0.3, r);
}

void main() {
  vec2 uv = vUv - 0.5;
  float r  = length(uv);
  float a  = atan(uv.y, uv.x);
  float t  = uTime;

  // ── Rings — each rotates independently ──
  float spin1 = sin(a * 12.0 + t * 2.1)  * 0.42 + 0.58;
  float spin2 = sin(a * 8.0  - t * 1.4)  * 0.38 + 0.62;
  float spin3 = sin(a * 16.0 + t * 0.9)  * 0.3  + 0.7;
  float spin4 = sin(a * 6.0  - t * 0.55) * 0.25 + 0.75;
  float spin5 = sin(a * 20.0 + t * 1.7)  * 0.2  + 0.8;

  float r1 = ring(r, 0.045, 0.007) * spin1 * 1.4;
  float r2 = ring(r, 0.090, 0.008) * spin2 * 1.1;
  float r3 = ring(r, 0.155, 0.010) * spin3 * 0.85;
  float r4 = ring(r, 0.240, 0.012) * spin4 * 0.6;
  float r5 = ring(r, 0.355, 0.014) * spin5 * 0.4;

  // ── Core glow — power source ──
  float core     = exp(-r * 38.0) * 3.2;
  float midGlow  = exp(-r * 10.0) * 0.55;
  float outerAura = exp(-r * 3.8) * 0.18;

  // ── Pulse — slightly irregular ──
  float pulse = 0.78 + sin(t * 0.72) * 0.14 + sin(t * 1.31 + 0.8) * 0.08;

  // ── Radial spokes — barely visible ──
  float spoke  = pow(max(0.0, sin(a * 4.0 + t * 0.18)), 8.0) * exp(-r * 5.0) * 0.4;
  float spoke2 = pow(max(0.0, sin(a * 7.0 - t * 0.25)), 12.0) * exp(-r * 4.0) * 0.2;

  float total = (core + midGlow + outerAura) * pulse
              + r1 + r2 + r3 + r4 + r5
              + spoke + spoke2;

  // ── Color: white core → blue-violet outer ──
  vec3 coreCol  = vec3(1.0, 0.98, 0.95);
  vec3 midCol   = vec3(0.55, 0.65, 1.0);
  vec3 outerCol = vec3(0.25, 0.20, 0.75);
  float cmix    = smoothstep(0.0, 0.35, r);
  vec3 col      = mix(coreCol, mix(midCol, outerCol, cmix * 1.4), cmix);

  float alpha = clamp(total * 0.92, 0.0, 1.0);
  // fade corners
  float cornerFade = smoothstep(0.5, 0.38, r);
  gl_FragColor = vec4(col * total * cornerFade, alpha * cornerFade);
}
`

// ─── OUTER HALO SHADER ───────────────────────────────────────────────────────
const HALO_FRAG = `
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 uv = vUv - 0.5;
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float pulse = 0.7 + 0.3 * sin(uTime * 0.4);
  float halo = exp(-r * 5.5) * 0.12 * pulse;
  // very subtle angular variation
  float variation = 0.8 + 0.2 * sin(a * 3.0 + uTime * 0.15);
  float alpha = halo * variation * smoothstep(0.5, 0.1, r);
  gl_FragColor = vec4(0.3, 0.35, 0.9, alpha);
}
`

export default function OriginAnomaly() {
  const meshRef  = useRef<any>(null)
  const haloRef  = useRef<any>(null)
  const outerRef = useRef<any>(null)
  const { selectObject } = useUniverseStore()

  const mat = useMemo(() => new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [])

  const haloMat = useMemo(() => new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: HALO_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: 2,
  }), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    mat.uniforms.uTime.value = t
    haloMat.uniforms.uTime.value = t
    if (meshRef.current)  meshRef.current.rotation.z  = t * 0.07
    if (haloRef.current)  haloRef.current.rotation.z  = t * -0.028
    if (outerRef.current) outerRef.current.rotation.z = t * 0.011
  })

  return (
    <group>
      {/* Deep outer aura — very large, very faint */}
      <mesh ref={outerRef} material={haloMat}>
        <planeGeometry args={[2400, 2400]} />
      </mesh>

      {/* Main anomaly plane */}
      <mesh
        ref={meshRef}
        material={mat}
        onClick={(e) => { e.stopPropagation(); selectObject(ORIGIN_OBJECT) }}
      >
        <planeGeometry args={[700, 700]} />
      </mesh>

      {/* Halo ring layer — separate layer */}
      <mesh ref={haloRef} material={haloMat} position={[0, 0, -1]}>
        <planeGeometry args={[1000, 1000]} />
      </mesh>

      {/* Core physical dot — the "thing" at the center */}
      <mesh>
        <sphereGeometry args={[5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Second inner sphere — barely visible shell */}
      <mesh>
        <sphereGeometry args={[22, 12, 12]} />
        <meshBasicMaterial color="#3040ff" transparent opacity={0.06} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}
