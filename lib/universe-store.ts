'use client'
import { create } from 'zustand'

export type UniverseMode = 'exploring' | 'approaching' | 'focused' | 'entering'

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
  visible: 'always' | { visited: number } | { needs: string[] } | { time: number }
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
    id: 'projects',
    label: 'SECTOR 01?',
    designation: 'Sector 01-A [UNVERIFIED]',
    color: '#3B82F6',
    position: [900, 150, 0],
    objects: [
      { id: 'proj-digger',         label: 'DIGGER [UNVERIFIED]',    type: 'planet',   description: 'Music indexing system. Active. Method of categorization: unverified.', lore: 'Indexing continues. No shutdown command received.', region: 'projects', href: '/build#digger',  position: [900, 150, 20],   color: '#60A5FA', size: 28, visible: 'always' },
      { id: 'proj-website',        label: 'DO NOT CATALOG',         type: 'planet',   description: 'Recursive object. Self-referencing. Classification suspended.', lore: 'Self-reference detected. Entry count inconsistent.', region: 'projects', href: '/build#website', position: [990, 210, -15],  color: '#93C5FD', size: 18, visible: 'always' },
      { id: 'proj-faraday',        label: 'FARADAY ??',             type: 'planet',   description: 'Signal origin unresolved. Arrival predates catalog record.', lore: 'No origination record. Object predates this index.', region: 'projects', href: '/build#faraday', position: [820, 80, 30],    color: '#1D4ED8', size: 22, visible: 'always' },
      { id: 'proj-hidden-station', label: 'STATION-NULL',           type: 'station',  description: 'Abandoned relay station. 47 documents unprocessed.', lore: 'Decommissioned 2019. Forms found inside: 47.', region: 'projects', href: '/build#null', worldId: 7, worldPortal: 'cursor-flood', position: [1050, 120, -40], color: '#BFDBFE', size: 12, visible: { visited: 2 } },
      { id: 'proj-endpoint',       label: 'ENDPOINT ———',           type: 'signal',   description: 'Final position before signal normalizes. Quieter than expected.', lore: 'You are not supposed to be this far out.', region: 'projects', worldId: 9, worldPortal: 'expand-white', position: [1100, 60, 15],   color: '#E5E5E5', size: 7,  visible: { visited: 6 } },
      { id: 'proj-loop',           label: '10 · 10 · 10',           type: 'wormhole', description: 'Object designation matches index number. Relationship: unresolved.', region: 'projects', worldId: 10, worldPortal: 'vortex', position: [950, 90, -30],   color: '#818CF8', size: 30, visible: { visited: 4 } },
    ]
  },
  {
    id: 'running',
    label: 'SECTOR 02',
    designation: 'Sector 02-B',
    color: '#F97316',
    position: [-700, -100, 0],
    objects: [
      { id: 'run-pikes',   label: 'PIKES 14,115',       type: 'planet',   description: 'Elevation: 14,115 ft. Summit record: logged.', lore: 'Summit confirmed. Return time not logged.', region: 'running', href: '/run#pikes',   position: [-700, -100, 25],  color: '#F97316', size: 30, visible: 'always' },
      { id: 'run-boulder', label: 'MARATHON 3:41:22',   type: 'planet',   description: 'Distance: 26.2 mi. Completion time: 3:41:22. Conditions: unclassified.', lore: 'Coordinates keep correcting themselves.', region: 'running', href: '/run#boulder', position: [-620, -180, -10], color: '#FB923C', size: 22, visible: 'always' },
      { id: 'run-golden',  label: 'GOLDEN GATE',        type: 'planet',   description: 'Trail segment. Dust, rock, variable grade. Survey: incomplete.', region: 'running', href: '/run#golden',  position: [-790, -60, 15],   color: '#FED7AA', size: 18, visible: 'always' },
      { id: 'run-signal',  label: '⬥',                  type: 'signal',   description: 'Transponder active. Pulse: irregular. Origin: disputed.', region: 'running', href: '/run', worldId: 5, worldPortal: 'rotate', position: [-680, -200, 40],  color: '#F97316', size: 8,  visible: { visited: 2 } },
      { id: 'run-pixel',   label: 'POWER-UP ▸',         type: 'wormhole', description: 'Chromatic anomaly in sector 02. Access conditions: unknown.', region: 'running', worldId: 14, worldPortal: 'chromatic', position: [-750, -120, 50],  color: '#FF006E', size: 28, visible: { visited: 2 } },
      { id: 'run-season',  label: '2025 [PENDING]',     type: 'anomaly',  description: 'Temporal entry. Data collection incomplete. Classification withheld.', region: 'running', href: '/run#2025', position: [-820, -150, -30], color: '#FDBA74', size: 15, visible: { visited: 3 } },
    ]
  },
  {
    id: 'archives',
    label: 'ARCHI___',
    designation: 'Sector 03-Ω [CORRUPTED?]',
    color: '#B45309',
    position: [-500, 550, 0],
    objects: [
      { id: 'arch-core',      label: 'ARCHI___',            type: 'station',  description: 'Primary archive node. Entry sequence interrupted. Catalog incomplete.', lore: 'Node integrity: partial. Access: unrestricted.', region: 'archives', href: '/archive', worldId: 6, worldPortal: 'nothing', position: [-500, 550, 0],   color: '#B45309', size: 25, visible: 'always' },
      { id: 'arch-frag-1',    label: 'MEM-001',             type: 'fragment', description: 'Fragment recovered. Integrity: partial.', region: 'archives', href: '/archive#001', position: [-560, 610, 20],  color: '#92400E', size: 10, visible: 'always' },
      { id: 'arch-frag-2',    label: 'MEM-047 [WARM]',      type: 'fragment', description: 'Fragment recovered. Integrity: high. Timestamp claims 2020.', region: 'archives', href: '/archive#047', position: [-440, 490, -15], color: '#78350F', size: 10, visible: 'always' },
      { id: 'arch-wormhole',  label: '???',                 type: 'wormhole', description: 'Unstable aperture. Destination: unregistered.', region: 'archives', worldId: 2, worldPortal: 'scatter', position: [-580, 500, 35],  color: '#FDE68A', size: 45, visible: 'always' },
      { id: 'arch-wormhole-2','label': 'RIFT-03',           type: 'wormhole', description: 'Interface terminal. Status: active. Access: uncontrolled.', region: 'archives', worldId: 12, worldPortal: 'nothing', position: [-520, 470, 50],  color: '#22C55E', size: 32, visible: { visited: 2 } },
      { id: 'arch-frag-3',    label: 'MEM-113',             type: 'fragment', description: 'Addressed incorrectly. Arrived anyway.', region: 'archives', href: '/archive#113', position: [-480, 620, 10],  color: '#92400E', size: 8,  visible: { visited: 3 } },
    ]
  },
  {
    id: 'explore',
    label: 'SECTOR 04',
    designation: 'Sector 04-Δ',
    color: '#22C55E',
    position: [500, -600, 0],
    objects: [
      { id: 'explore-mt-elbert', label: 'ELBERT 14,439',    type: 'planet',   description: 'Elevation: 14,439 ft. Highest indexed point.', lore: 'Summit confirmed. Conditions: logged.', region: 'explore', href: '/explore#elbert', position: [500, -600, 20],   color: '#22C55E', size: 32, visible: 'always' },
      { id: 'explore-maroon',    label: 'MAROON BELLS',     type: 'planet',   description: 'Multiple peaks. Survey: 2023. Classification: geological type-A.', region: 'explore', href: '/explore#maroon', position: [580, -540, -10],  color: '#4ADE80', size: 20, visible: 'always' },
      { id: 'explore-uncharted', label: 'UNCHARTED ——',     type: 'anomaly',  description: 'No data available. Approach with caution.', region: 'explore', href: '/explore#uncharted', position: [430, -680, 30],   color: '#86EFAC', size: 16, visible: { visited: 2 } },
      { id: 'explore-hidden',    label: '⬥',                type: 'signal',   description: 'Faint transmission. Coordinates: encoded. Decode status: incomplete.', region: 'explore', href: '/explore#signal', position: [600, -620, -25],  color: '#22C55E', size: 8,  visible: { time: 20000 } },
      { id: 'explore-corridor',  label: 'CORRIDOR →',       type: 'wormhole', description: 'No confirmed endpoint. Length estimates unreliable.', lore: 'Do not turn around mid-traverse.', region: 'explore', worldId: 4, worldPortal: 'slide-right', position: [460, -720, 25],   color: '#60A5FA', size: 45, visible: 'always' },
      { id: 'explore-spiral',    label: '↓ ∞ ↓',            type: 'wormhole', description: 'Vertical descent. No floor contact recorded.', region: 'explore', worldId: 13, worldPortal: 'vortex', position: [540, -780, 45],   color: '#6366F1', size: 40, visible: { visited: 1 } },
    ]
  },
  {
    id: 'lab',
    label: 'SECTOR 05-Ψ',
    designation: 'Sector 05-Ψ',
    color: '#A855F7',
    position: [50, 700, 0],
    objects: [
      { id: 'lab-collider',  label: 'PARTICLE-01',      type: 'anomaly',  description: 'Particle simulation. Mouse-reactive. Stability index: low.', region: 'lab', href: '/lab#particles', position: [50, 700, 15],    color: '#A855F7', size: 22, visible: 'always' },
      { id: 'lab-synth',     label: 'COLOR-SYNTH',      type: 'anomaly',  description: 'Generative color system. Input-reactive. Origin: unknown.', region: 'lab', href: '/lab#synth',      position: [130, 760, -20],  color: '#C084FC', size: 18, visible: 'always' },
      { id: 'lab-distort',   label: 'GRID-DIST',        type: 'anomaly',  description: 'Field distortion. Energy output: elevated. Clarity: low.', region: 'lab', href: '/lab#grid',       position: [-40, 640, 25],   color: '#7C3AED', size: 16, visible: 'always' },
      { id: 'lab-collider2', label: 'TYPE-COLL',        type: 'anomaly',  description: 'Language collision experiment. Status: ongoing.', region: 'lab', href: '/lab#type',        position: [100, 660, -30],  color: '#DDD6FE', size: 14, visible: 'always' },
      { id: 'lab-quantum',   label: 'QUANTUM [?]',      type: 'wormhole', description: 'Activation sequence: unknown. Most attempts fail.', lore: 'Entry sequence disputed. Classification: experimental.', region: 'lab', href: '/lab#quantum', worldId: 3, worldPortal: 'expand-white', position: [-20, 760, 40],   color: '#F0ABFC', size: 38, visible: { visited: 3 } },
      { id: 'lab-echo',      label: 'ECHO ···',         type: 'station',  description: 'Broadcasting on all frequencies. No acknowledgment received.', region: 'lab', href: '/lab#echo', worldId: 8, worldPortal: 'fold', position: [180, 700, 10],   color: '#E879F9', size: 12, visible: { time: 30000 } },
      { id: 'lab-flicker',   label: 'SCREEN-11',        type: 'wormhole', description: 'Duplicate signal pairs detected. Match status: pending.', region: 'lab', worldId: 11, worldPortal: 'scatter',  position: [60, 820, 20],    color: '#FF0064', size: 34, visible: { visited: 3 } },
      { id: 'lab-index',     label: 'CATALOG [?]',      type: 'station',  description: 'Index file. Sort order: unverified. Entry count: disputed.', region: 'lab', worldId: 16, worldPortal: 'fold',    position: [-120, 720, 55],  color: '#818CF8', size: 22, visible: { visited: 5 } },
      { id: 'lab-dial',      label: '~ 15 ~',           type: 'signal',   description: 'FM receiver. Range: 70–120 MHz. Signal: scanning.', region: 'lab', worldId: 15, worldPortal: 'chromatic', position: [200, 640, 35],   color: '#22C55E', size: 14, visible: { time: 18000 } },
      { id: 'lab-void',      label: 'NULL-EXP',         type: 'fragment', description: 'Experiment terminated. Results: partial. Context: missing.', region: 'lab', href: '/lab', position: [-80, 780, -15],  color: '#7C3AED', size: 9,  visible: { visited: 4 } },
    ]
  },
]

// Gates scattered organically — NOT in an obvious ring
const PORTAL_GATES: Array<Omit<UniverseObject, 'type' | 'region' | 'visible'>> = [
  { id: 'gate-00', label: '—— 00 ——',   description: 'Entry classification: type-0. Condition: stable.',                    lore: 'The plain front door.',                                     worldId: 0,  worldPortal: 'door',         position: [110,  -295, 20],  color: '#F4F1EC', size: 18 },
  { id: 'gate-02', label: '02 [DEPTH]', description: 'Depth corridor. Object density: elevated.',                            lore: 'Something is still down there.',                            worldId: 2,  worldPortal: 'scatter',      position: [305,  -190, -18], color: '#6366F1', size: 18 },
  { id: 'gate-03', label: '03 [ON AIR]',description: 'Broadcast signal active. Channel count: 1. Reception: clear.',         lore: 'Channel 13 loads after 90 seconds.',                         worldId: 3,  worldPortal: 'expand-white', position: [448,   88,  44],  color: '#92400E', size: 18 },
  { id: 'gate-04', label: '04 →→→→',    description: 'Passage designation: A. Navigation accuracy: disputed.',               lore: 'Do not turn around mid-traverse.',                          worldId: 4,  worldPortal: 'slide-right',  position: [220,  375, 22],  color: '#22C55E', size: 18 },
  { id: 'gate-05', label: '05 [FIELD]', description: 'Field station active. Instruments: miscalibrated. Last accessed: unknown.', lore: 'Something is broadcasting on 88.7.',                   worldId: 5,  worldPortal: 'rotate',       position: [-68,  350, 55],  color: '#F97316', size: 18 },
  { id: 'gate-06', label: '06 ░░░░',    description: 'Document repository. Entry count: 52. Status: partially redacted.',    lore: 'Some sections are still redacted.',                          worldId: 6,  worldPortal: 'nothing',      position: [-342, 188, -12], color: '#B45309', size: 18 },
  { id: 'gate-07', label: 'CLOSED [07]',description: 'Commerce zone. Operational status: closed. Infrastructure: intact.',   lore: 'PA system still running. No staff.',                         worldId: 7,  worldPortal: 'cursor-flood', position: [-460, -48,  30],  color: '#cc9966', size: 18 },
  { id: 'gate-08', label: '08 [SIG——]', description: 'Signal archive. Integrity: partial. Access: sequential.',              lore: 'Type IMMEDIATEACCESS to skip.',                              worldId: 8,  worldPortal: 'fold',         position: [-238, -292, 38], color: '#E5E5E5', size: 18 },
  { id: 'gate-09', label: '09 ___',     description: 'Final position before signal normalizes completely.',                  lore: 'You got here.',                                             worldId: 9,  worldPortal: 'expand-white', position: [82,  -558, 62],  color: '#FFFFFF', size: 20 },
  { id: 'gate-10', label: '10 · 10 · 10',description: 'Interior dimensions inconsistent with exterior.',                    lore: 'Room number is also the world number.',                      worldId: 10, worldPortal: 'vortex',       position: [508, -368, -22], color: '#818CF8', size: 20 },
  { id: 'gate-11', label: '11 [×2]',    description: 'Pairing system. Duplicate objects detected. Match status: pending.',   lore: 'Timer starts when you press the button.',                   worldId: 11, worldPortal: 'scatter',      position: [588,  118, 46],  color: '#FF0064', size: 20 },
  { id: 'gate-12', label: '$ 12',       description: 'Terminal interface. Input: unrestricted. Status: active.',             lore: 'Someone left a terminal running.',                           worldId: 12, worldPortal: 'nothing',      position: [382,  528, 18],  color: '#22C55E', size: 20 },
  { id: 'gate-13', label: '↓↓ 13',      description: 'Infinite descent. No floor contact recorded.',                         lore: 'Branching paths. No map.',                                  worldId: 13, worldPortal: 'vortex',       position: [42,   642, -35], color: '#6366F1', size: 20 },
  { id: 'gate-14', label: '▸ 14',       description: 'Chromatic anomaly. Dimension: non-standard. Classification: visual.',  lore: 'Insert coin.',                                              worldId: 14, worldPortal: 'chromatic',    position: [-422, 462, 50],  color: '#FF006E', size: 20 },
  { id: 'gate-15', label: '~ 15 ~',     description: 'FM static. Tune until something answers.',                             lore: '88.7 is significant.',                                      worldId: 15, worldPortal: 'chromatic',    position: [-572, -32,  28],  color: '#22C55E', size: 20 },
  { id: 'gate-16', label: '16 [?]',     description: 'Master catalog. Sort order: unverified. Index: incomplete.',           lore: 'List is incomplete.',                                       worldId: 16, worldPortal: 'fold',         position: [-488, -392, -18], color: '#6366F1', size: 20 },
]

export const VOID_OBJECTS: UniverseObject[] = [
  ...PORTAL_GATES.map(gate => ({ ...gate, type: 'wormhole' as const, region: 'void', visible: 'always' as const })),
  { id: 'void-frag-1',   label: '∞',          type: 'fragment', description: 'Transmission fragment. Reply: pending. Origin: unknown.',             region: 'void', position: [-120, -130, -10], color: '#737373', size: 7,  visible: 'always' },
  { id: 'void-frag-2',   label: 'DEBRIS-07',  type: 'fragment', description: 'Cataloged as significant. Significance unspecified.',                  region: 'void', position: [140,  120,  15],  color: '#525252', size: 5,  visible: { visited: 2 } },
  { id: 'void-signal-1', label: '⬥ DRIFT',    type: 'signal',   description: 'Unanchored signal. Trajectory: unresolved.',                          region: 'void', position: [120,  -160, 20],  color: '#A3A3A3', size: 6,  visible: { time: 15000 } },
  { id: 'void-anomaly-1','label': 'ANOMALY-X', type: 'anomaly',  description: 'Classification failure. No matching type. Entry suspended.',          region: 'void', position: [-160, 150,  30],  color: '#6B7280', size: 12, visible: { time: 40000 } },
  { id: 'void-station-1','label': 'RELAY-00',  type: 'station',  description: 'Decommissioned. Still receiving. Not transmitting.',                  region: 'void', position: [20,   0,   -20],  color: '#9CA3AF', size: 10, visible: { visited: 4 } },
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

  flyTo: (pos: [number, number, number], lookAt?: [number, number, number]) => void
  selectObject: (obj: UniverseObject | null) => void
  discover: (obj: UniverseObject) => void
  setMode: (mode: UniverseMode) => void
  clearDiscovery: () => void
  isVisible: (obj: UniverseObject) => boolean
  isDiscovered: (id: string) => boolean
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

  flyTo: (pos, lookAt = [0, 0, 0]) => set({ cameraTarget: pos, lookTarget: lookAt }),

  selectObject: (obj) => {
    if (!obj) {
      set({ selectedId: null, mode: 'exploring' })
      return
    }
    const { discover, discoveredIds } = get()
    if (!discoveredIds.includes(obj.id)) discover(obj)
    set({ selectedId: obj.id, mode: 'focused' })
    get().flyTo(
      [obj.position[0], obj.position[1], obj.position[2] + 120],
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
    if ('needs' in v) return v.needs.every(id => discoveredIds.includes(id))
    if ('time' in v) return Date.now() - visitStartTime >= v.time
    return false
  },

  isDiscovered: (id) => get().discoveredIds.includes(id),
}))

export function getAllObjects(): UniverseObject[] {
  return [ORIGIN_OBJECT, ...VOID_OBJECTS, ...REGIONS.flatMap(r => r.objects)]
}
