'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points } from 'three'
import * as THREE from 'three'

// ─── SHARED SHADER UTILITIES ─────────────────────────────────────────────────

const NOISE_GLSL = `
float hash(float n) { return fract(sin(n) * 43758.5453123); }
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise3(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i+vec3(1,0,0)), f.x),
                 mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)), f.x),
                 mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise3(p); p *= 2.0; a *= 0.5; }
  return v;
}
`

// ─── ABSORPTION BODY (Gravitational Anomaly) ─────────────────────────────────
// A true black hole: event horizon + accretion disk + particle jets

const ACCRETION_VERT = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPos;
varying float vSpeed;
void main() {
  vUv = uv;
  vPos = position;
  // Warp the disk vertices in a spiral to suggest gas infall
  float angle = atan(position.x, position.z);
  float r = length(position.xz);
  float warp = sin(angle * 4.0 - uTime * 1.8 + r * 0.012) * 0.04 * r;
  vec3 warped = position + vec3(0.0, warp, 0.0);
  vSpeed = warp;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(warped, 1.0);
}
`

const ACCRETION_FRAG = `
${NOISE_GLSL}
uniform float uTime;
varying vec2 vUv;
varying vec3 vPos;
varying float vSpeed;

void main() {
  float r = length(vPos.xz);
  float angle = atan(vPos.x, vPos.z);

  // Temperature gradient: innermost is white-hot, outer is deep orange-red
  float heat = 1.0 - smoothstep(0.0, 1.0, (r - 200.0) / 700.0);

  // Spiral turbulence
  float spiral = fbm(vec3(cos(angle) * r * 0.008 - uTime * 0.3, sin(angle) * r * 0.008, uTime * 0.1));

  vec3 innerColor = vec3(1.0, 0.95, 0.8);
  vec3 midColor   = vec3(1.0, 0.45, 0.05);
  vec3 outerColor = vec3(0.4, 0.05, 0.0);

  vec3 col = mix(outerColor, mix(midColor, innerColor, heat * heat), heat);
  col += spiral * 0.3 * col;

  // Edge falloff (disk is thin)
  float edgeFade = 1.0 - abs(vUv.y - 0.5) * 2.0;
  edgeFade = pow(max(0.0, edgeFade), 1.5);

  // Inner edge hard cutoff (nothing escapes the event horizon)
  float innerCutoff = smoothstep(180.0, 220.0, r);

  float alpha = heat * edgeFade * innerCutoff * (0.6 + spiral * 0.4);

  gl_FragColor = vec4(col, alpha);
}
`

function AbsorptionBody() {
  const diskRef = useRef<THREE.Mesh>(null)
  const diskMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ACCRETION_VERT,
    fragmentShader: ACCRETION_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [])

  useFrame((s) => {
    diskMat.uniforms.uTime.value = s.clock.elapsedTime
  })

  return (
    <group position={[-2500, 1800, -1200]}>
      {/* Event horizon — pure black, blocks everything behind */}
      <mesh>
        <sphereGeometry args={[220, 32, 32]} />
        <meshBasicMaterial color="#000000" depthWrite={true} />
      </mesh>

      {/* Inner photon sphere glow */}
      <mesh>
        <sphereGeometry args={[235, 24, 24]} />
        <meshBasicMaterial color="#1a0830" transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Accretion disk — flat ring with hot gas shader */}
      <mesh ref={diskRef} rotation={[Math.PI * 0.08, 0, 0.3]}>
        <torusGeometry args={[500, 300, 3, 128]} />
        <primitive object={diskMat} attach="material" />
      </mesh>

      {/* Outer relativistic jet — top */}
      <mesh position={[0, 800, 0]}>
        <coneGeometry args={[60, 900, 8, 1, true]} />
        <meshBasicMaterial color="#4400ff" transparent opacity={0.07} blending={AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      {/* Bottom jet */}
      <mesh position={[0, -800, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[60, 900, 8, 1, true]} />
        <meshBasicMaterial color="#2200aa" transparent opacity={0.05} blending={AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>

      {/* Outer gravitational shadow halo */}
      <mesh>
        <sphereGeometry args={[700, 20, 20]} />
        <meshBasicMaterial color="#06000e" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── IMPOSSIBLE GEOMETRY (Raymarched Menger Sponge) ─────────────────────────

const MENGER_VERT = `
varying vec3 vRayOrigin;
varying vec3 vRayDir;
void main() {
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vRayOrigin = (modelMatrix * vec4(position, 1.0)).xyz;
  // World-space ray direction
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vRayDir = worldPos.xyz - cameraPosition;
  gl_Position = projectionMatrix * mvPos;
}
`

const MENGER_FRAG = `
${NOISE_GLSL}
uniform float uTime;
varying vec3 vRayOrigin;
varying vec3 vRayDir;

// Menger sponge SDF
float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float mengerSDF(vec3 p) {
  float d = sdBox(p, vec3(1.0));
  float s = 1.0;
  for (int i = 0; i < 4; i++) {
    vec3 a = mod(p * s, 2.0) - 1.0;
    s *= 3.0;
    vec3 r = abs(1.0 - 3.0 * abs(a));
    float da = max(r.x, r.y);
    float db = max(r.y, r.z);
    float dc = max(r.z, r.x);
    float c = (min(da, min(db, dc)) - 1.0) / s;
    d = max(d, c);
  }
  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    mengerSDF(p + e.xyy) - mengerSDF(p - e.xyy),
    mengerSDF(p + e.yxy) - mengerSDF(p - e.yxy),
    mengerSDF(p + e.yyx) - mengerSDF(p - e.yyx)
  ));
}

void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vRayDir);

  // Rotate the sponge slowly
  float ct = cos(uTime * 0.06); float st = sin(uTime * 0.06);
  float ct2 = cos(uTime * 0.04); float st2 = sin(uTime * 0.04);

  float tHit = -1.0;
  float t = 0.0;
  for (int i = 0; i < 96; i++) {
    vec3 p = ro + rd * t;
    // Transform into local sponge space
    p /= 1200.0;
    vec3 rp;
    rp.x = p.x * ct - p.y * st;
    rp.y = p.x * st + p.y * ct;
    rp.z = p.z * ct2 - p.x * st2;
    float d = mengerSDF(rp) * 1200.0;
    if (d < 1.5) { tHit = t; break; }
    t += d * 0.7;
    if (t > 6000.0) break;
  }

  if (tHit < 0.0) discard;

  vec3 hitP = ro + rd * tHit;
  vec3 lp = hitP / 1200.0;
  vec3 norm = calcNormal(lp);

  // Iteration-count coloring
  float depth = tHit / 4000.0;
  vec3 col = mix(vec3(0.15, 0.0, 0.4), vec3(0.0, 0.6, 0.8), depth);
  col += norm * 0.3;
  col += fbm(lp * 3.0 + uTime * 0.05) * 0.2;

  // Edge glow
  float fresnel = pow(1.0 - abs(dot(norm, -rd)), 2.5);
  col += vec3(0.2, 0.4, 1.0) * fresnel * 0.8;

  float alpha = 0.88 + fresnel * 0.12;
  gl_FragColor = vec4(col, alpha);
}
`

function ImpossibleGeometry() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: MENGER_VERT,
    fragmentShader: MENGER_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    side: THREE.FrontSide,
  }), [])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <mesh position={[-800, -2800, -300]} material={mat}>
      {/* The geometry is just a bounding box — actual shape is raymarched inside */}
      <boxGeometry args={[2400, 2400, 2400]} />
    </mesh>
  )
}

// ─── MONOLITH (Dimensional Slit) ─────────────────────────────────────────────

const MONOLITH_FRAG = `
${NOISE_GLSL}
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPos;

void main() {
  float fresnel = dot(normalize(vNormal), normalize(vViewPos));
  // Negative fresnel — edges get DARKER, not lighter
  float darkRim = pow(clamp(fresnel, 0.0, 1.0), 2.0) * 0.9;

  // Glyph pattern — masked noise that creates symbol-like shapes
  float glyph = step(0.72, fbm(vec3(vUv * 12.0, uTime * 0.08)));
  glyph *= step(0.68, fbm(vec3(vUv * 8.0 + 2.3, uTime * 0.05)));
  glyph *= (sin(uTime * 0.4 + vUv.y * 20.0) * 0.5 + 0.5); // fade in/out

  // Vertical slit on one face
  float slit = smoothstep(0.48, 0.52, vUv.x) - smoothstep(0.52, 0.56, vUv.x);
  float slitGlow = slit * (0.5 + 0.5 * sin(uTime * 1.2));
  slitGlow *= smoothstep(0.1, 0.4, vUv.y) * smoothstep(0.9, 0.6, vUv.y);

  vec3 baseColor = vec3(0.0, 0.0, 0.02) * darkRim;
  vec3 glyphColor = vec3(0.15, 0.05, 0.4) * glyph * 0.6;
  vec3 slitColor = vec3(0.8, 0.85, 1.0) * slitGlow * 1.8;

  vec3 col = baseColor + glyphColor + slitColor;
  float alpha = 0.92 + darkRim * 0.08;

  gl_FragColor = vec4(col, alpha);
}
`

const MONOLITH_VERT = `
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

function Monolith() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: MONOLITH_VERT,
    fragmentShader: MONOLITH_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: true,
  }), [])

  // Outer halo — the monolith disturbs local space
  const haloRef = useRef<THREE.Mesh>(null)

  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime
    if (haloRef.current) {
      const mat2 = haloRef.current.material as THREE.MeshBasicMaterial
      mat2.opacity = 0.04 + 0.02 * Math.sin(s.clock.elapsedTime * 0.8)
    }
  })

  return (
    <group position={[1800, -2200, 450]} rotation={[0, 0, 0.06]}>
      {/* The monolith — 1:4:9 proportions */}
      <mesh material={mat}>
        <boxGeometry args={[25, 450, 112]} />
      </mesh>
      {/* Distortion halo */}
      <mesh ref={haloRef}>
        <boxGeometry args={[60, 600, 200]} />
        <meshBasicMaterial color="#3300ff" transparent opacity={0.04} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── BROKEN MEGASTRUCTURE (Scan-Line Infrastructure) ──────────────────────────

const SCANLINE_VERT = `
uniform float uTime;
uniform float uFragIndex;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  // Glitch: occasional segment drift
  float glitchPhase = floor(uTime * 3.0 + uFragIndex * 7.3);
  float glitch = step(0.94, fract(sin(glitchPhase) * 43758.5));
  vec3 pos = position;
  pos.x += glitch * (fract(sin(glitchPhase * 1.7) * 100.0) - 0.5) * 0.08 * abs(position.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const SCANLINE_FRAG = `
${NOISE_GLSL}
uniform float uTime;
uniform float uFragIndex;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  // Scan lines traveling upward
  float scanY = fract(vUv.y * 24.0 - uTime * 0.6 + uFragIndex * 0.3);
  float scanLine = step(0.88, scanY);

  // Data corruption zones
  float corrupt = step(0.88, noise3(vec3(vUv * 4.0, uTime * 0.15 + uFragIndex)));
  float dissolve = step(0.92, noise3(vec3(vUv * 8.0, uTime * 0.08)));
  if (dissolve > 0.5) discard;

  // Structure color — dark blue-grey, scan lines are brighter
  vec3 baseCol = vec3(0.02, 0.06, 0.12);
  vec3 scanCol = vec3(0.08, 0.25, 0.45);
  vec3 corruptCol = vec3(0.5, 0.1, 0.8);

  vec3 col = mix(baseCol, scanCol, scanLine * 0.6);
  col = mix(col, corruptCol, corrupt * 0.4);

  float fresnel = abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
  float alpha = (0.25 + scanLine * 0.2) * (0.5 + fresnel * 0.5);

  gl_FragColor = vec4(col, alpha);
}
`

function MegaFragment({ pos, rot, size, idx }: {
  pos: [number, number, number]
  rot: [number, number, number]
  size: [number, number, number]
  idx: number
}) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: SCANLINE_VERT,
    fragmentShader: SCANLINE_FRAG,
    uniforms: { uTime: { value: 0 }, uFragIndex: { value: idx } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [idx])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <mesh position={pos} rotation={rot} material={mat}>
      <boxGeometry args={size} />
    </mesh>
  )
}

function BrokenMegastructure() {
  return (
    <group position={[3200, -1400, -1000]}>
      <MegaFragment pos={[0, 0, 0]}      rot={[0.1, 0.3, 0.05]} size={[120, 1800, 80]}  idx={0} />
      <MegaFragment pos={[240, 600, 40]}  rot={[0.2, 0.1, 0.8]}  size={[100, 1200, 70]}  idx={1} />
      <MegaFragment pos={[-160, -400, 100]} rot={[-0.1, 0.5, 0.2]} size={[80, 1400, 56]}  idx={2} />
      <MegaFragment pos={[400, 200, -60]} rot={[0.05, 0.4, 1.1]} size={[60, 800, 44]}   idx={3} />
      <MegaFragment pos={[120, 1200, 30]}  rot={[0.3, 0.2, 0.05]} size={[110, 600, 64]}  idx={4} />
    </group>
  )
}

// ─── UNEXPLAINED OBJECT (Topology Morph) ──────────────────────────────────────
// Vertex shader morphs between different topology targets

const MORPH_VERT = `
${NOISE_GLSL}
uniform float uTime;
varying vec3 vNormal;
varying vec3 vPos;

// Torus target shape (r1=1, r2=0.35)
vec3 toTorus(vec3 p) {
  float angle = atan(p.y, p.x);
  float r = length(p.xy);
  float torusX = cos(angle) * 1.0;
  float torusY = sin(angle) * 1.0;
  float torusZ = 0.0;
  float dr = r - 1.0;
  return vec3(
    torusX + normalize(vec3(dr * cos(angle), dr * sin(angle), p.z)).x * 0.35,
    torusY + normalize(vec3(dr * cos(angle), dr * sin(angle), p.z)).y * 0.35,
    p.z * 0.35 / max(length(vec2(dr, p.z)), 0.001)
  );
}

void main() {
  vPos = position;
  vNormal = normal;

  // Morph parameter: slowly oscillates 0→1→0
  float morphT = sin(uTime * 0.22) * 0.5 + 0.5;
  // Add discrete snapping to make it feel more uncanny
  morphT = smoothstep(0.0, 0.15, morphT) * smoothstep(1.0, 0.85, morphT);

  vec3 morphTarget = toTorus(normalize(position) * length(position));
  vec3 displaced = mix(position, morphTarget * length(position), morphT);

  // Noise displacement
  float n = noise3(position * 0.8 + uTime * 0.12) * 0.08;
  displaced += normal * n * length(position);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`

const MORPH_FRAG = `
${NOISE_GLSL}
uniform float uTime;
varying vec3 vNormal;
varying vec3 vPos;

void main() {
  float n = fbm(vPos * 1.5 + uTime * 0.08);
  float morphPhase = sin(uTime * 0.22) * 0.5 + 0.5;

  vec3 col1 = vec3(0.12, 0.02, 0.3); // deep purple
  vec3 col2 = vec3(0.0, 0.3, 0.5);   // cyan-blue
  vec3 col = mix(col1, col2, morphPhase + n * 0.4);

  // Wireframe-ish edge detection via normal
  float edge = 1.0 - abs(dot(normalize(vNormal), normalize(vPos)));
  col += vec3(0.4, 0.2, 1.0) * pow(edge, 3.0) * 0.8;

  float alpha = 0.55 + edge * 0.35 + n * 0.1;
  gl_FragColor = vec4(col, alpha);
}
`

function UnexplainedObject() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: MORPH_VERT,
    fragmentShader: MORPH_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [])

  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <group position={[-2400, 1800, 300]}>
      <mesh material={mat}>
        <sphereGeometry args={[220, 48, 48]} />
      </mesh>
      {/* Inner core glow */}
      <mesh>
        <sphereGeometry args={[60, 12, 12]} />
        <meshBasicMaterial color="#6020c0" transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── NESTED GYROSCOPE (Glow Rings with Trails) ─────────────────────────────

const RING_GLOW_FRAG = `
uniform vec3 uColor;
uniform float uGlowIntensity;
varying vec3 vNormal;
varying vec3 vViewPos;
void main() {
  float fresnel = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPos)));
  float glow = pow(fresnel, 1.6) * uGlowIntensity;
  gl_FragColor = vec4(uColor * (0.3 + glow), glow * 0.9);
}
`

const RING_VERT = `
varying vec3 vNormal;
varying vec3 vViewPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

function GlowRing({ radius, tube, rotation, color, speed }: {
  radius: number; tube: number; rotation: [number, number, number]
  color: string; speed: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: RING_VERT,
    fragmentShader: RING_GLOW_FRAG,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uGlowIntensity: { value: 2.2 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [color])

  useFrame((s) => {
    if (!ref.current) return
    const t = s.clock.elapsedTime
    ref.current.rotation.x = rotation[0] + t * speed * 0.7
    ref.current.rotation.y = rotation[1] + t * speed
    ref.current.rotation.z = rotation[2] + t * speed * 0.4
  })

  return (
    <mesh ref={ref} material={mat}>
      <torusGeometry args={[radius, tube, 6, 100]} />
    </mesh>
  )
}

function NestedGyroscope() {
  return (
    <group position={[2800, 900, -500]}>
      <GlowRing radius={320} tube={5} rotation={[0, 0, 0]} color="#0e4060" speed={0.008} />
      <GlowRing radius={320} tube={4} rotation={[Math.PI / 2, 0.4, 0]} color="#0a3050" speed={-0.005} />
      <GlowRing radius={320} tube={3} rotation={[0, 0, Math.PI / 2.4]} color="#061828" speed={0.012} />
      {/* Inner core */}
      <mesh>
        <sphereGeometry args={[22, 12, 12]} />
        <meshBasicMaterial color="#4090ff" transparent opacity={0.6} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── SIGNAL TOWER (Transmission Beam) ────────────────────────────────────────

const BEAM_FRAG = `
${NOISE_GLSL}
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  // Beam core: bright center, fade to edges
  float dist = abs(vUv.x - 0.5) * 2.0;
  float core = pow(1.0 - dist, 3.0);

  // Beam travel lines (data flowing upward)
  float lineY = fract(vUv.y * 8.0 - uTime * 1.4);
  float line = step(0.85, lineY) * core;

  // Interference / turbulence
  float turb = noise3(vec3(vUv * 5.0, uTime * 0.5)) * 0.3;

  // Fade out toward top
  float topFade = 1.0 - vUv.y;
  topFade = pow(topFade, 0.6);

  vec3 col = uColor * (core * 0.4 + line * 1.2 + turb * core);
  float alpha = core * topFade * (0.5 + turb);

  gl_FragColor = vec4(col, alpha * 0.7);
}
`

const BEAM_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

function SignalTower({ position, height = 8000 }: { position: [number, number, number]; height?: number }) {
  const beamMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: BEAM_VERT,
    fragmentShader: BEAM_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#1a6090') },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [])

  const ref = useRef<THREE.Group>(null)

  useFrame((s) => {
    beamMat.uniforms.uTime.value = s.clock.elapsedTime
    if (ref.current) {
      ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.15 + position[0] * 0.005) * 0.002
    }
  })

  return (
    <group ref={ref} position={position}>
      {/* Tower body */}
      <mesh>
        <cylinderGeometry args={[5, 2, height, 4]} />
        <meshBasicMaterial color="#0d1828" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      {/* Cap ring */}
      <mesh position={[0, height / 2 - 40, 0]}>
        <torusGeometry args={[36, 4, 6, 32]} />
        <meshBasicMaterial color="#1a4060" transparent opacity={0.45} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Transmission beam — cone shooting upward */}
      <mesh position={[0, height / 2 + height * 0.3, 0]} material={beamMat}>
        <cylinderGeometry args={[80, 4, height * 0.6, 8, 8, true]} />
      </mesh>
    </group>
  )
}

// ─── REMAINING STRUCTURES (unchanged but kept) ──────────────────────────────

function AncientRing() {
  const ref = useRef<any>(null)
  useFrame((s) => { if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * 0.0012 })
  return (
    <mesh ref={ref} position={[1200, 1500, -1000]} rotation={[0.28, 0.12, 0.65]}>
      <torusGeometry args={[2600, 16, 5, 180]} />
      <meshBasicMaterial color="#0c1835" transparent opacity={0.24} depthWrite={false} />
    </mesh>
  )
}

function OuterRing() {
  const ref = useRef<any>(null)
  useFrame((s) => { if (ref.current) ref.current.rotation.z = -s.clock.elapsedTime * 0.0006 })
  return (
    <mesh ref={ref} position={[-2000, -1200, -1600]} rotation={[0.8, -0.15, 0.3]}>
      <torusGeometry args={[3800, 10, 4, 240]} />
      <meshBasicMaterial color="#0a0820" transparent opacity={0.12} depthWrite={false} />
    </mesh>
  )
}

function DebrisField() {
  const ref = useRef<Points>(null)
  const geo = useMemo(() => {
    const n = 1500
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const bias = i < 1000 ? 1 : 3.2
      const a = (i / n) * Math.PI * 2 * 6.5
      const dist = 1200 + ((i * 43) % 3200) * bias * 0.5
      const elev = ((i * 17 + 3) % 1600) - 800
      const dz = ((i * 29) % 1200) - 600
      pos[i * 3]     = Math.cos(a) * dist + ((i * 7) % 400) - 200
      pos[i * 3 + 1] = elev
      pos[i * 3 + 2] = Math.sin(a) * dist * 0.55 + dz
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [])
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.002 })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={2.4} color="#16102a" transparent opacity={0.42} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function GalaxySmear({ position, count, color, spread }: {
  position: [number, number, number]; count: number; color: string; spread: number
}) {
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2
      const r = spread * (0.2 + ((i * 17) % 100) / 125)
      pos[i * 3]     = Math.cos(t) * r + (((i * 7) % 100) - 50) * spread * 0.004
      pos[i * 3 + 1] = (((i * 13) % 100) - 50) * spread * 0.0012
      pos[i * 3 + 2] = Math.sin(t) * r * 0.3 + (((i * 11) % 100) - 50) * spread * 0.002
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [count, spread])
  return (
    <points geometry={geo} position={position}>
      <pointsMaterial size={2.0} color={color} transparent opacity={0.12} sizeAttenuation blending={AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function GhostOrbitRings() {
  return (
    <group>
      <mesh position={[-1600, 700, -200]} rotation={[0.32, 0.78, 0.22]}>
        <torusGeometry args={[550, 2.5, 4, 120, Math.PI * 1.88]} />
        <meshBasicMaterial color="#0a1830" transparent opacity={0.24} depthWrite={false} />
      </mesh>
      <mesh position={[1800, -600, 100]} rotation={[-0.42, 0.28, 1.12]}>
        <torusGeometry args={[840, 3, 4, 140, Math.PI * 1.2]} />
        <meshBasicMaterial color="#180a20" transparent opacity={0.20} depthWrite={false} />
      </mesh>
      <mesh position={[400, -1300, -300]} rotation={[1.18, -0.18, 0.38]}>
        <torusGeometry args={[380, 2, 4, 80, Math.PI * 1.96]} />
        <meshBasicMaterial color="#0c1020" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh position={[-180, 400, 150]} rotation={[0.58, 1.18, 0.92]}>
        <torusGeometry args={[140, 1.5, 4, 40, Math.PI * 0.82]} />
        <meshBasicMaterial color="#1a0a30" transparent opacity={0.30} depthWrite={false} />
      </mesh>
      <mesh position={[200, 1800, -500]} rotation={[0.08, 0.92, 0.35]}>
        <torusGeometry args={[1560, 4.5, 4, 160, Math.PI * 0.68]} />
        <meshBasicMaterial color="#0c0818" transparent opacity={0.10} depthWrite={false} />
      </mesh>
    </group>
  )
}

function AncientSurveyGrid() {
  const geo = useMemo(() => {
    const vertices: number[] = []
    const gridW = 5600, gridH = 4000
    const rows = 14, cols = 20
    for (let r = 0; r <= rows; r++) {
      const y = -gridH / 2 + (r / rows) * gridH
      vertices.push(-gridW / 2, y, 0, gridW / 2, y, 0)
    }
    for (let c = 0; c <= cols; c++) {
      const x = -gridW / 2 + (c / cols) * gridW
      vertices.push(x, -gridH / 2, 0, x, gridH / 2, 0)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return g
  }, [])
  return (
    <lineSegments geometry={geo} position={[-160, 120, -3000]} rotation={[0.04, 0.06, 0.02]}>
      <lineBasicMaterial color="#060612" transparent opacity={0.24} depthWrite={false} />
    </lineSegments>
  )
}

function AncientCrossbeam() {
  return (
    <group position={[2400, 3200, -1200]} rotation={[0.18, 0.06, -0.28]}>
      <mesh>
        <boxGeometry args={[7200, 40, 40]} />
        <meshBasicMaterial color="#07101a" wireframe transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh position={[-1800, 0, 0]}>
        <boxGeometry args={[36, 1360, 36]} />
        <meshBasicMaterial color="#07101a" wireframe transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh position={[760, 0, 0]}>
        <boxGeometry args={[36, 880, 36]} />
        <meshBasicMaterial color="#07101a" wireframe transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  )
}

function DustVeil() {
  const geo = useMemo(() => {
    const n = 2000
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const t = (i / n - 0.5) * 5600
      const perp = (((i * 31) % 100) - 50) * 3.6 + Math.sin(i * 0.08) * 120
      const depth = (((i * 13) % 100) - 50) * 8
      pos[i * 3]     = t * 0.85 - 400 + perp * 0.3
      pos[i * 3 + 1] = t * 0.52 + 160 + perp
      pos[i * 3 + 2] = depth
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [])
  return (
    <points geometry={geo}>
      <pointsMaterial size={3.2} color="#12101e" transparent opacity={0.34} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function FragmentedRingCluster() {
  const ref = useRef<any>(null)
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.005 })
  return (
    <group ref={ref} position={[-2200, -1600, 200]}>
      <mesh>
        <torusGeometry args={[480, 4, 4, 100, Math.PI * 1.4]} />
        <meshBasicMaterial color="#1a0a20" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI * 0.7, 0.4, 0.8]}>
        <torusGeometry args={[390, 3, 4, 80, Math.PI * 1.8]} />
        <meshBasicMaterial color="#0a1820" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.3, Math.PI * 0.5, 1.2]}>
        <torusGeometry args={[620, 6, 4, 120, Math.PI * 0.6]} />
        <meshBasicMaterial color="#200a10" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

function ColossalArtifact() {
  const joint: [number, number, number] = [2000, 2400, -500]
  return (
    <group>
      <mesh position={joint}>
        <boxGeometry args={[200, 200, 200]} />
        <meshBasicMaterial color="#030810" wireframe transparent opacity={0.52} depthWrite={false} />
      </mesh>
      <mesh position={[joint[0] + 5600, joint[1], joint[2]]}>
        <boxGeometry args={[11200, 120, 120]} />
        <meshBasicMaterial color="#040a14" wireframe transparent opacity={0.42} depthWrite={false} />
      </mesh>
      <mesh position={[joint[0], joint[1] + 5600, joint[2]]}>
        <boxGeometry args={[120, 11200, 120]} />
        <meshBasicMaterial color="#040a14" wireframe transparent opacity={0.38} depthWrite={false} />
      </mesh>
      <mesh position={[joint[0], joint[1], joint[2] - 8000]}>
        <boxGeometry args={[120, 120, 16000]} />
        <meshBasicMaterial color="#040a14" wireframe transparent opacity={0.30} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function GiantStructures() {
  return (
    <group>
      <AncientRing />
      <OuterRing />
      <BrokenMegastructure />
      <SignalTower position={[2800, -1600, -600]} height={7600} />
      <SignalTower position={[-1200, 3600, 800]} height={6400} />
      <SignalTower position={[4400, 600, -200]} height={8400} />
      <ImpossibleGeometry />
      <UnexplainedObject />
      <NestedGyroscope />
      <AbsorptionBody />
      <GhostOrbitRings />
      <AncientSurveyGrid />
      <AncientCrossbeam />
      <DustVeil />
      <Monolith />
      <FragmentedRingCluster />
      <ColossalArtifact />
      <DebrisField />
      <GalaxySmear position={[6000, 2000, -8000]}  count={800} color="#100820" spread={3600} />
      <GalaxySmear position={[-8000, -1600, -10000]} count={600} color="#081018" spread={4400} />
      <GalaxySmear position={[1600, 6000, -6000]}   count={500} color="#0c0c20" spread={2800} />
      <GalaxySmear position={[-4000, 4000, -4000]} count={700} color="#181008" spread={3200} />
    </group>
  )
}
