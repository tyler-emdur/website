'use client'
import { create } from 'zustand'

export type UniverseMode = 'exploring' | 'focused'

export interface UniverseObject {
  id: string
  label: string
  type: 'planet' | 'station' | 'anomaly' | 'signal' | 'wormhole' | 'fragment'
  description: string
  lore?: string
  region: string
  href?: string
  worldId?: number
  worldPortal?: string
  position: [number, number, number]
  color: string
  size?: number
  visible: 'always' | { visited: number } | { time: number }
}

export interface RegionDef {
  id: string
  label: string
  designation: string
  color: string
  position: [number, number, number]
  objects: UniverseObject[]
}

export const REGIONS: RegionDef[] = [
  {
    id: 'index',
    label: 'SECTOR 01-A',
    designation: 'SECTOR 01-A [RECORD PENDING]',
    color: '#3B82F6',
    position: [1600, 400, -100],
    objects: [
      { id: 'idx-null',            label: 'INDEX-∅',                type: 'planet',   description: 'System query frequency: elevated. Log size: 1.4TB. Method of categorization: unresolved.', lore: 'Index tracking continues. Query logs show requests without source addresses.', region: 'index', worldId: 5, worldPortal: 'newspaper', position: [1600, 400, -80],   color: '#60A5FA', size: 28, visible: 'always' },
      { id: 'idx-recursive',       label: 'RECURSIVE-∅',            type: 'anomaly',  description: 'Self-referencing structure. Nested node count: unstable. Integrity check: suspended.', lore: 'Recursive loops detected in segment headers. Readouts match system root.', region: 'index', worldId: 5, worldPortal: 'newspaper', position: [1750, 520, -120],  color: '#93C5FD', size: 18, visible: 'always' },
      { id: 'idx-receptor',        label: 'RECEPTOR-14',            type: 'planet',   description: 'Signal source unresolved. Arrival timestamp predates index establishment. Solar load: critical.', lore: 'No establishment log. Sensor records trace energy fluctuations to 2018.', region: 'index', worldId: 5, worldPortal: 'newspaper', position: [1420, 280, -70],    color: '#1D4ED8', size: 22, visible: 'always' },
      { id: 'idx-relay',           label: 'NODE-309',               type: 'station',  description: 'Decommissioned database relay. 47 archives remain unprocessed. Access restricted.', lore: 'Station offline since 2019. Diagnostic output: 47 files pending index.', region: 'index', worldId: 5, worldPortal: 'cursor-flood', position: [1850, 320, -150], color: '#BFDBFE', size: 12, visible: { visited: 2 } },
      { id: 'idx-endpoint',       label: 'TERMINATION-POINT',      type: 'signal',   description: 'Final telemetry coordinates before carrier wave collapse. Signal level: -94dB.', lore: 'Transmission terminated. Telemetry log ends at coordinate boundary.', region: 'index', worldId: 7, worldPortal: 'expand-white', position: [1980, 200, -60],   color: '#E5E5E5', size: 7,  visible: { visited: 6 } },
      { id: 'idx-loop',           label: 'SYSTEM-LOOP-10',         type: 'wormhole', description: 'Aperture dimension matches internal sequence. Geometry: non-Euclidean.', lore: 'Index coordinates redirect here. TRAVERSE WITH EXTREME CAUTION.', region: 'index', worldId: 5, worldPortal: 'vortex', position: [1680, 290, -110],   color: '#818CF8', size: 30, visible: { visited: 4 } },
    ]
  },
  {
    id: 'running',
    label: 'SECTOR 02-B',
    designation: 'SECTOR 02-B [SURVEY DETAILED]',
    color: '#F97316',
    position: [-1500, -800, 200],
    objects: [
      { id: 'run-pikes',   label: 'PEAK-14115',         type: 'planet',   description: 'Geological spire. Recorded altitude: 14,115ft. Local gravity variance: +1.2%.', lore: 'Atmospheric density falls below baseline. Spire structures suggest artificial carving.', region: 'running', worldId: 2, worldPortal: 'slide-right',   position: [-1500, -800, 230],  color: '#F97316', size: 30, visible: 'always' },
      { id: 'run-boulder', label: 'METRIC-26.2',        type: 'planet',   description: 'Vector acceleration tracking node. Completion coefficient: 3.4122. Status: constant.', lore: 'Telemetry drift detected. Coordinates autocorrecting to zero-point reference.', region: 'running', worldId: 2, worldPortal: 'slide-right', position: [-1380, -960, 180], color: '#FB923C', size: 22, visible: 'always' },
      { id: 'run-golden',  label: 'SEGMENT-GOLDEN',     type: 'fragment', description: 'Eroded physical pathway. Linear length: unverified. Visual markers: obscured.', region: 'running', worldId: 2, worldPortal: 'slide-right',  position: [-1620, -720, 210],   color: '#FED7AA', size: 18, visible: 'always' },
      { id: 'run-season',  label: 'TEMPORAL-2025',      type: 'anomaly',  description: 'Incomplete data block. Year designation: pending verification. Classification withheld.', region: 'running', worldId: 2, worldPortal: 'slide-right', position: [-1680, -920, 160], color: '#FDBA74', size: 15, visible: { visited: 3 } },
    ]
  },
  {
    id: 'archives',
    label: 'SECTOR 03-Ω',
    designation: 'SECTOR 03-Ω [DATABASE FAULT]',
    color: '#B45309',
    position: [-1200, 1300, -300],
    objects: [
      { id: 'arch-frag-1',    label: 'DATA-MEM-001',        type: 'fragment', description: 'Recovered index block. System header matches master log. Format: corrupted.', region: 'archives', worldId: 5, worldPortal: 'rotate', position: [-1310, 1420, -280],  color: '#92400E', size: 10, visible: 'always' },
      { id: 'arch-frag-2',    label: 'DATA-MEM-047',        type: 'fragment', description: 'Fossilized code block. Creation date: 2020. Read access: unrestricted.', region: 'archives', worldId: 5, worldPortal: 'rotate', position: [-1090, 1180, -320], color: '#78350F', size: 10, visible: 'always' },
      { id: 'arch-wormhole',  label: 'APERTURE-3-A',        type: 'wormhole', description: 'Unstable gravitational tear. Target destination: unregistered. Mass draw: extreme.', region: 'archives', worldId: 2, worldPortal: 'scatter', position: [-1340, 1200, -260],  color: '#FDE68A', size: 45, visible: 'always' },
      { id: 'arch-wormhole-2', label: 'RIFT-03',            type: 'wormhole', description: 'Interface terminal gate. System status: active. Access control: bypassed.', region: 'archives', worldId: 9, worldPortal: 'nothing', position: [-1240, 1150, -230],  color: '#22C55E', size: 32, visible: { visited: 2 } },
      { id: 'arch-frag-3',    label: 'DATA-MEM-113',        type: 'fragment', description: 'Orphan data fragment. Internal pointer is broken. Arrived via out-of-band transmission.', region: 'archives', worldId: 5, worldPortal: 'rotate', position: [-1160, 1410, -290],  color: '#92400E', size: 8,  visible: { visited: 3 } },
    ]
  },
  {
    id: 'explore',
    label: 'SECTOR 04-Δ',
    designation: 'SECTOR 04-Δ [TELEMETRY INCOMPLETE]',
    color: '#22C55E',
    position: [1200, -1300, 150],
    objects: [
      { id: 'explore-mt-elbert', label: 'PEAK-14439',       type: 'planet',   description: 'Massive geological structure. Highest elevation on survey path. Barometric readout: missing.', lore: 'Summit coordinates confirmed. No traces of organic life found at elevation.', region: 'explore', worldId: 2, worldPortal: 'scatter', position: [1200, -1300, 180],   color: '#22C55E', size: 32, visible: 'always' },
      { id: 'explore-maroon',    label: 'MAROON-RELAY',     type: 'station',  description: 'Survey instrumentation array. Signal output: static. Solar panel condition: degraded.', region: 'explore', worldId: 2, worldPortal: 'scatter', position: [1320, -1180, 130],  color: '#4ADE80', size: 20, visible: 'always' },
      { id: 'explore-uncharted', label: 'SECTOR-UNMAPPED',  type: 'anomaly',  description: 'No records exist. Sensor sweep returns inconsistent distances. Geometry: shifting.', region: 'explore', worldId: 2, worldPortal: 'scatter', position: [1060, -1420, 200],   color: '#86EFAC', size: 16, visible: { visited: 2 } },
      { id: 'explore-hidden',    label: 'BEACON-04-Δ',      type: 'signal',   description: 'Low power beacon. Pulse frequency: irregular. Transmission: binary sequence.', region: 'explore', worldId: 2, worldPortal: 'scatter', position: [1350, -1320, 110],  color: '#22C55E', size: 8,  visible: { time: 20000 } },
      { id: 'explore-corridor',  label: 'CORRIDOR-A',       type: 'wormhole', description: 'Tunnel geometry. Transverse transit time: infinite. Exit vector: unknown.', lore: 'Do not turn back once traverse starts. Metric space collapse observed.', region: 'explore', worldId: 4, worldPortal: 'slide-right', position: [1120, -1520, 190],   color: '#60A5FA', size: 45, visible: 'always' },
      { id: 'explore-spiral',    label: 'DESCENT-DESCENT',  type: 'wormhole', description: 'Vertical gravity tube. Downward velocity: compounding. Bottom contact: undetected.', lore: 'Sensor probe dropped into tube 18 months ago. Still transmitting.', region: 'explore', worldId: 9, worldPortal: 'vortex', position: [1260, -1620, 220],   color: '#6366F1', size: 40, visible: { visited: 1 } },
    ]
  },
  {
    id: 'lab',
    label: 'SECTOR 05-Ψ',
    designation: 'SECTOR 05-Ψ [ISOLATED EXPERIMENT]',
    color: '#A855F7',
    position: [100, 1800, -250],
    objects: [
      { id: 'lab-collider',  label: 'PARTICLE-01',      type: 'anomaly',  description: 'High energy simulation grid. Particle count: 2000. Density: variable.', lore: 'Simulation responds to visual cursor. Heat output: elevated.', region: 'lab', worldId: 5, worldPortal: 'expand-white', position: [100, 1800, -230],    color: '#A855F7', size: 22, visible: 'always' },
      { id: 'lab-synth',     label: 'COLOR-SYNTH',      type: 'anomaly',  description: 'Generative visual matrix. Wavelength range: 380-740nm. State: unstable.', lore: 'Mouse coordinate input directly distorts spectral output.', region: 'lab', worldId: 5, worldPortal: 'expand-white',      position: [220, 1920, -280],  color: '#C084FC', size: 18, visible: 'always' },
      { id: 'lab-distort',   label: 'GRID-DISTORTION',  type: 'anomaly',  description: 'Local metric distortion. Space lattice display: warped. Access risk: high.', lore: 'Grid displays tears at outer boundaries. Gravity index fluctuating.', region: 'lab', worldId: 5, worldPortal: 'expand-white',       position: [-40, 1680, -210],   color: '#7C3AED', size: 16, visible: 'always' },
      { id: 'lab-collider2', label: 'COLLIDER-02',      type: 'anomaly',  description: 'Language fragment collision chamber. Diagnostic log: buffer overflow.', lore: 'Fragment collisions generate garbage logs at 440kb/s.', region: 'lab', worldId: 5, worldPortal: 'expand-white',        position: [180, 1720, -290],  color: '#DDD6FE', size: 14, visible: 'always' },
      { id: 'lab-quantum',   label: 'QUANTUM-GATE',     type: 'wormhole', description: 'Experimental wormhole construct. Containment field stability: 18%.', lore: 'Traversal attempts show high error rate. Coordinate mapping unverified.', region: 'lab', worldId: 3, worldPortal: 'expand-white', position: [-10, 1920, -200],   color: '#F0ABFC', size: 38, visible: { visited: 3 } },
      { id: 'lab-echo',      label: 'NODE-ECHO',        type: 'station',  description: 'Diagnostic monitor. Output channel: 88.7 MHz. Acknowledgment status: pending.', lore: 'FM receiver picked up loop sequence. Transmitter power: 50W.', region: 'lab', worldId: 6, worldPortal: 'fold', position: [300, 1800, -220],   color: '#E879F9', size: 12, visible: { time: 30000 } },
      { id: 'lab-index',     label: 'MASTER-CATALOG',   type: 'station',  description: 'Unsorted document index. Sort order: unverified. Total file count: disputed.', lore: 'Root directory displays 16 sub-directories. 1 is hidden.', region: 'lab', worldId: 14, worldPortal: 'fold',    position: [-180, 1840, -170],  color: '#818CF8', size: 22, visible: { visited: 5 } },
      { id: 'lab-void',      label: 'NULL-EXPERIMENT',  type: 'fragment', description: 'Terminated laboratory script. Output: partial. Log file: missing.', lore: 'Experiment terminated by system administrator. Reason: heap exhaustion.', region: 'lab', worldId: 5, worldPortal: 'expand-white', position: [-110, 1960, -270],  color: '#7C3AED', size: 9,  visible: { visited: 4 } },
    ]
  },
  {
    id: 'forgotten',
    label: '',
    designation: 'SECTOR 06-∅ [UNMAPPED]',
    color: '#475569',
    position: [-2400, -1800, 500],
    objects: [
      { id: 'forgotten-1', label: 'OBJECT-46', type: 'fragment', description: 'Debris fragments matching decommissioned infrastructure. Core temperature: absolute zero.', lore: 'No records exist in primary database. Physical retrieval recommended.', region: 'forgotten', position: [-2500, -1950, 450], color: '#64748B', size: 10, visible: 'always' },
      { id: 'forgotten-2', label: 'ANOMALY-104', type: 'anomaly', description: 'High energy distortion field. Visual readouts corrupted. Intermittent radiation pulse.', lore: 'Do not catalog. Local space metric displays dilation factor of 1.4x.', region: 'forgotten', position: [-2300, -1650, 550], color: '#475569', size: 20, visible: 'always' },
      { id: 'forgotten-3', label: 'SIGNAL-099', type: 'signal', description: 'Carrier wave detected. Sub-audible frequency. Source shifts coordinate points on ping.', lore: 'Transmission lost. Telemetry points to empty space. Reacquisition pending.', region: 'forgotten', position: [-2400, -1800, 500], color: '#94A3B8', size: 8, visible: { time: 10000 } }
    ]
  }
]

// Gates scattered organically — NOT in an obvious ring
const PORTAL_GATES: Array<Omit<UniverseObject, 'type' | 'region' | 'visible'>> = [
  { id: 'gate-00', label: 'GATE-00', description: 'Entry classification: type-0. Condition: stable.',                    lore: 'The plain front door.',                                     worldId: 0,  worldPortal: 'door',         position: [176,  -472, 32],  color: '#F4F1EC', size: 18 },
  { id: 'gate-02', label: 'EXPLORER-02', description: 'Topographic survey map. Pin count: 14. Time-of-day: variable.',       lore: 'Some pins only surface after dark.',                        worldId: 2,  worldPortal: 'scatter',      position: [488,  -304, -28], color: '#5ecbe0', size: 18 },
  { id: 'gate-03', label: 'ON-AIR-03',description: 'Broadcast signal active. Channel count: 10. Reception: varies by dial position.', lore: 'Nine of them come from real cities. The tenth is 88.',                     worldId: 3,  worldPortal: 'expand-white', position: [716,   140,  70],  color: '#92400E', size: 18 },
  { id: 'gate-05', label: 'MACHINE-05', description: 'Recovered personal computer. Power state: on. Owner: not present.',    lore: 'Estate sale, box 3. It still boots.',                        worldId: 5,  worldPortal: 'cursor-flood', position: [-736, -76,  48],  color: '#5ecbe0', size: 18 },
  { id: 'gate-06', label: 'GARAGE-06', description: 'Vehicle bay. Ambient temperature: cold. One engine, silent.',             lore: 'The radio never really turns off.',                         worldId: 6,  worldPortal: 'fold',         position: [-380, -467, 60], color: '#ffb347', size: 18 },
  { id: 'gate-07', label: 'ENDPOINT-07',     description: 'Final position before signal normalizes completely.',                  lore: 'You got here.',                                             worldId: 7,  worldPortal: 'expand-white', position: [131,  -892, 99],  color: '#FFFFFF', size: 20 },
  { id: 'gate-08', label: 'READERS-08',  description: 'Fixed sensor array. Node count: 110. Subject classification: passing vehicles.', lore: 'They do not transmit pictures. They transmit that you were there.',              worldId: 8,  worldPortal: 'slide-right', position: [-620,  520, 44],  color: '#ffd666', size: 18 },
  { id: 'gate-09', label: 'MESSAGES-09', description: 'One red light blinking in a dark room. Tape present. Side A occupied.', lore: 'You can leave one. Someone will hear it.',                 worldId: 9, worldPortal: 'nothing',      position: [611,  844, 28],  color: '#c8a850', size: 20 },
  { id: 'gate-14', label: 'AISLE-14',   description: 'Retail corridor. Stock rotation: continuous. Exit: not on file.',        lore: 'Nobody has ever reported reaching the end.',                worldId: 14, worldPortal: 'chromatic',    position: [-950, 260,  85],  color: '#D4A24C', size: 20 },
]

export const VOID_OBJECTS: UniverseObject[] = [
  ...PORTAL_GATES.map(gate => ({ ...gate, type: 'wormhole' as const, region: 'void', visible: 'always' as const })),
  { id: 'void-frag-1',   label: '∞',          type: 'fragment', description: 'Transmission fragment. Reply: pending. Origin: unknown.',             region: 'void', position: [-120, -130, -10], color: '#737373', size: 7,  visible: 'always' },
  { id: 'void-frag-2',   label: 'DEBRIS-07',  type: 'fragment', description: 'Cataloged as significant. Significance unspecified.',                  region: 'void', position: [140,  120,  15],  color: '#525252', size: 5,  visible: { visited: 2 } },
  { id: 'void-signal-1', label: '⬥ DRIFT',    type: 'signal',   description: 'Unanchored signal. Trajectory: unresolved.',                          region: 'void', position: [120,  -160, 20],  color: '#A3A3A3', size: 6,  visible: { time: 15000 } },
  { id: 'void-anomaly-1', label: 'ANOMALY-X',  type: 'anomaly',  description: 'Classification failure. No matching type. Entry suspended.',          region: 'void', position: [-160, 150,  30],  color: '#6B7280', size: 12, visible: { time: 40000 } },
  { id: 'void-station-1', label: 'RELAY-00',   type: 'station',  description: 'Decommissioned. Still receiving. Not transmitting.',                  region: 'void', position: [20,   0,   -20],  color: '#9CA3AF', size: 10, visible: { visited: 4 } },
  { id: 'void-dark-anomaly', label: 'CLASSIFIED-NULL-VOID', type: 'anomaly', description: 'Massive gravitational anomaly. Light absorption: 100%. Boundary detection: failed.', lore: 'Do not approach. Sensor feedback returns zero values. All telemetry lost beyond boundary.', region: 'void', position: [-2500, 1800, -1200], color: '#000000', size: 160, visible: 'always' },
  { id: 'void-drifter', label: 'DRIFT-BEACON', type: 'signal', description: 'Slow moving telemetry source. Pathway shifts coordinate points. Signal frequency: 12.4Hz.', lore: 'Visual lock: unstable. Telemetry drift computed at 4.2 units/hr.', region: 'void', position: [400, 400, 0], color: '#A3A3A3', size: 8, visible: 'always' },
]

// Origin object
export const ORIGIN_OBJECT: UniverseObject = {
  id: 'origin',
  label: 'TE-∅',
  type: 'anomaly',
  description: 'Origin point of all indexed signals. Status: unresolved.',
  lore: 'All transmissions converge here. None are acknowledged.',
  region: 'origin',
  position: [0, 0, 0],
  color: '#ffffff',
  size: 8,
  visible: 'always',
}

interface UniverseStore {
  mode: UniverseMode
  selectedId: string | null
  cameraTarget: [number, number, number]
  lookTarget: [number, number, number]
  discoveredIds: string[]
  visitStartTime: number
  recentDiscovery: UniverseObject | null
  nullDescent: boolean

  flyTo: (pos: [number, number, number], lookAt?: [number, number, number]) => void
  selectObject: (obj: UniverseObject | null) => void
  discover: (obj: UniverseObject) => void
  setMode: (mode: UniverseMode) => void
  clearDiscovery: () => void
  isVisible: (obj: UniverseObject) => boolean
  isDiscovered: (id: string) => boolean
  // CORRIDOR-A points at world 4, which does not exist. Committing to the
  // traverse hands off to the descent overlay instead of navigating anywhere.
  beginNullDescent: () => void
  endNullDescent: () => void
}

function loadDiscovered(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('universe-discovered') || '[]') } catch { return [] }
}

function saveDiscovered(ids: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('universe-discovered', JSON.stringify(ids))
}

export const useUniverseStore = create<UniverseStore>((set, get) => ({
  mode: 'exploring',
  selectedId: null,
  cameraTarget: [120, -80, 1640],
  lookTarget: [0, 0, 0],
  discoveredIds: loadDiscovered(),
  visitStartTime: Date.now(),
  recentDiscovery: null,
  nullDescent: false,

  flyTo: (pos, lookAt) => set({ cameraTarget: pos, lookTarget: lookAt ?? pos }),


  selectObject: (obj) => {
    if (!obj) {
      set({ selectedId: null, mode: 'exploring' })
      return
    }
    const { discover, discoveredIds } = get()
    if (!discoveredIds.includes(obj.id)) discover(obj)
    set({ selectedId: obj.id, mode: 'focused' })
    const offset = Math.max(120, (obj.size ?? 20) * 5)
    get().flyTo(
      [obj.position[0], obj.position[1], obj.position[2] + offset],
      [obj.position[0], obj.position[1], obj.position[2]]
    )
  },

  discover: (obj) => {
    const { discoveredIds } = get()
    if (discoveredIds.includes(obj.id)) return
    const next = [...discoveredIds, obj.id]
    saveDiscovered(next)
    set({ discoveredIds: next, recentDiscovery: obj })
    setTimeout(() => set({ recentDiscovery: null }), 4000)
  },

  setMode: (mode) => set({ mode }),

  clearDiscovery: () => set({ recentDiscovery: null }),

  isVisible: (obj) => {
    if (obj.visible === 'always') return true
    const { discoveredIds, visitStartTime } = get()
    const v = obj.visible
    if ('visited' in v) return discoveredIds.length >= v.visited
    if ('time' in v) return Date.now() - visitStartTime >= v.time
    return false
  },

  isDiscovered: (id) => get().discoveredIds.includes(id),

  beginNullDescent: () => set({ nullDescent: true, selectedId: null, mode: 'exploring' }),
  endNullDescent: () => set({ nullDescent: false }),
}))

export function getAllObjects(): UniverseObject[] {
  return [ORIGIN_OBJECT, ...VOID_OBJECTS, ...REGIONS.flatMap(r => r.objects)]
}
