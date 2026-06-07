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
    label: 'PROJECTS',
    designation: 'Sector 01-A',
    color: '#3B82F6',
    position: [900, 150, 0],
    objects: [
      { id: 'proj-digger', label: 'Digger / Ear Index', type: 'planet', description: 'Music discovery engine disguised as a misplaced library card.', lore: 'Shelf mark: 2024. Some songs are filed under weather.', region: 'projects', href: '/build#digger', position: [900, 150, 20], color: '#60A5FA', size: 28 , visible: 'always' },
      { id: 'proj-website', label: 'This Universe, Unfortunately', type: 'planet', description: 'The interface you are standing in, pretending to be evidence.', lore: 'Recursive object. Please do not alphabetize.', region: 'projects', href: '/build#website', position: [990, 210, -15], color: '#93C5FD', size: 18, visible: 'always' },
      { id: 'proj-faraday', label: 'Faraday / Wrong Antenna', type: 'planet', description: 'Unknown signal origin. The answer arrives before the question.', lore: 'Appeared without record. Keeps receipts in orbit.', region: 'projects', href: '/build#faraday', position: [820, 80, 30], color: '#1D4ED8', size: 22, visible: 'always' },
      { id: 'proj-hidden-station', label: 'Station Null, Office Hours', type: 'station', description: 'Abandoned relay full of forms nobody requested.', lore: 'Decommissioned 2019. Still accepts appointments.', region: 'projects', href: '/build#null', worldId: 7, worldPortal: 'cursor-flood', position: [1050, 120, -40], color: '#BFDBFE', size: 12, visible: { visited: 2 } },
      { id: 'proj-endpoint', label: 'Endpoint-9 / White Room', type: 'signal', description: 'Final position before the signal normalizes completely. Quieter than expected.', lore: 'You are not supposed to be this far out.', region: 'projects', worldId: 9, worldPortal: 'expand-white', position: [1100, 60, 15], color: '#E5E5E5', size: 7, visible: { visited: 6 } },
      { id: 'proj-loop', label: 'Loop-10 / Self Reference', type: 'wormhole', description: 'Project that references itself. Room number matches world number. Coincidence unlikely.', region: 'projects', worldId: 10, worldPortal: 'vortex', position: [950, 90, -30], color: '#818CF8', size: 30, visible: { visited: 4 } },
    ]
  },
  {
    id: 'running',
    label: 'RUNNING',
    designation: 'Sector 02-B',
    color: '#F97316',
    position: [-700, -100, 0],
    objects: [
      { id: 'run-pikes', label: 'Pikes Peak Receipt', type: 'planet', description: '14,115 ft. A vertical errand with lungs as optional paperwork.', lore: 'Elevation logged, then immediately misplaced.', region: 'running', href: '/run#pikes', position: [-700, -100, 25], color: '#F97316', size: 30, visible: 'always' },
      { id: 'run-boulder', label: 'Boulder Marathon / Long Sentence', type: 'planet', description: '26.2 miles written by the legs and edited by the hills.', lore: 'First marathon. Coordinates keep correcting themselves.', region: 'running', href: '/run#boulder', position: [-620, -180, -10], color: '#FB923C', size: 22, visible: 'always' },
      { id: 'run-golden', label: 'Golden Gate 25K, Side B', type: 'planet', description: 'A trail object with dust, rocks, and one suspicious breadcrumb.', region: 'running', href: '/run#golden', position: [-790, -60, 15], color: '#FED7AA', size: 18, visible: 'always' },
      { id: 'run-signal', label: 'Signal-04 / Shoe Radio', type: 'signal', description: 'Active transponder. Pulse matches a race cadence, or a microwave.', region: 'running', href: '/run', worldId: 5, worldPortal: 'rotate', position: [-680, -200, 40], color: '#F97316', size: 8, visible: { visited: 2 } },
      { id: 'run-pixel', label: 'Power-Up / Side Scroll', type: 'wormhole', description: 'Coin collection event. Colors mandatory.', region: 'running', worldId: 14, worldPortal: 'chromatic', position: [-750, -120, 50], color: '#FF006E', size: 28, visible: { visited: 2 } },
      { id: 'run-season', label: 'Season 2025, Unreliable Calendar', type: 'anomaly', description: 'Temporal anomaly. Data still incoming, mostly sideways.', region: 'running', href: '/run#2025', position: [-820, -150, -30], color: '#FDBA74', size: 15, visible: { visited: 3 } },
    ]
  },
  {
    id: 'archives',
    label: 'ARCHIVES',
    designation: 'Sector 03-Ω',
    color: '#B45309',
    position: [-500, 550, 0],
    objects: [
      { id: 'arch-core', label: 'Archive Core / Drawer 0', type: 'station', description: 'Central storage, except it remembers things in the wrong order.', lore: 'Do not approach during low-power autobiography.', region: 'archives', href: '/archive', worldId: 6, worldPortal: 'nothing', position: [-500, 550, 0], color: '#B45309', size: 25, visible: 'always' },
      { id: 'arch-frag-1', label: 'Memory-001, Wet Label', type: 'fragment', description: 'Recovered. Partially corrupted. Smells like old CSS.', region: 'archives', href: '/archive#001', position: [-560, 610, 20], color: '#92400E', size: 10, visible: 'always' },
      { id: 'arch-frag-2', label: 'Memory-047 / Still Warm', type: 'fragment', description: 'High integrity, low context. Timestamp claims 2020.', region: 'archives', href: '/archive#047', position: [-440, 490, -15], color: '#78350F', size: 10, visible: 'always' },
      { id: 'arch-wormhole', label: '??? / Tiny Exit Interview', type: 'wormhole', description: 'Unstable aperture. Destination has not agreed to be named.', region: 'archives', worldId: 2, worldPortal: 'scatter', position: [-580, 500, 35], color: '#FDE68A', size: 45, visible: 'always' },
      { id: 'arch-wormhole-2', label: 'Rift-03 / Recursive Shell', type: 'wormhole', description: 'Command line detected behind the shelves. Someone left a terminal running.', region: 'archives', worldId: 12, worldPortal: 'nothing', position: [-520, 470, 50], color: '#22C55E', size: 32, visible: { visited: 2 } },
      { id: 'arch-frag-3', label: 'Memory-113 / Wrong Envelope', type: 'fragment', description: 'Addressed incorrectly. Arrived anyway. Contents partially opened.', region: 'archives', href: '/archive#113', position: [-480, 620, 10], color: '#92400E', size: 8, visible: { visited: 3 } },
    ]
  },
  {
    id: 'explore',
    label: 'EXPLORE',
    designation: 'Sector 04-Δ',
    color: '#22C55E',
    position: [500, -600, 0],
    objects: [
      { id: 'explore-mt-elbert', label: 'Mt. Elbert / Tall Note', type: 'planet', description: '14,439 ft. Highest point in Colorado, allegedly a bookmark.', lore: 'Summit achieved. Weather window: briefly polite.', region: 'explore', href: '/explore#elbert', position: [500, -600, 20], color: '#22C55E', size: 32, visible: 'always' },
      { id: 'explore-maroon', label: 'Maroon Bells, Overexposed', type: 'planet', description: 'Most photographed peaks in Colorado, now filed as a rumor.', region: 'explore', href: '/explore#maroon', position: [580, -540, -10], color: '#4ADE80', size: 20, visible: 'always' },
      { id: 'explore-uncharted', label: 'Uncharted-a / Blank Picnic', type: 'anomaly', description: 'No data available. Approach with a sandwich and suspicion.', region: 'explore', href: '/explore#uncharted', position: [430, -680, 30], color: '#86EFAC', size: 16, visible: { visited: 2 } },
      { id: 'explore-hidden', label: 'Signal-09 / Fern Fax', type: 'signal', description: 'Faint transmission. Coordinates encoded in a leaf-shaped mistake.', region: 'explore', href: '/explore#signal', position: [600, -620, -25], color: '#22C55E', size: 8, visible: { time: 20000 } },
      { id: 'explore-corridor', label: 'Passage-01 / Long Way Round', type: 'wormhole', description: 'An aperture with no confirmed endpoint. Length estimates are unreliable.', lore: 'Do not turn around mid-traverse.', region: 'explore', worldId: 4, worldPortal: 'slide-right', position: [460, -720, 25], color: '#60A5FA', size: 45, visible: 'always' },
      { id: 'explore-spiral', label: 'Passage-∞ / Downward', type: 'wormhole', description: 'Vertical drop. No floor contact in any recorded traverse.', region: 'explore', worldId: 13, worldPortal: 'vortex', position: [540, -780, 45], color: '#6366F1', size: 40, visible: { visited: 1 } },
    ]
  },
  {
    id: 'lab',
    label: 'LAB',
    designation: 'Sector 05-Ψ',
    color: '#A855F7',
    position: [50, 700, 0],
    objects: [
      { id: 'lab-collider', label: 'Particle Collider / Soup Mode', type: 'anomaly', description: 'Mouse-driven particle simulation. Unstable enough to be honest.', region: 'lab', href: '/lab#particles', position: [50, 700, 15], color: '#A855F7', size: 22, visible: 'always' },
      { id: 'lab-synth', label: 'Color Synth, No Key', type: 'anomaly', description: 'Generative hue field. Reacts to presence and bad posture.', region: 'lab', href: '/lab#synth', position: [130, 760, -20], color: '#C084FC', size: 18, visible: 'always' },
      { id: 'lab-distort', label: 'Grid Distort / Office Carpet', type: 'anomaly', description: 'Field distortion engine. High energy output, low administrative clarity.', region: 'lab', href: '/lab#grid', position: [-40, 640, 25], color: '#7C3AED', size: 16, visible: 'always' },
      { id: 'lab-collider2', label: 'Type Collider, Loud Margin', type: 'anomaly', description: 'Language physics experiment. Click to repel meaning.', region: 'lab', href: '/lab#type', position: [100, 660, -30], color: '#DDD6FE', size: 14, visible: 'always' },
      { id: 'lab-quantum', label: 'Quantum Gate / Maybe Door', type: 'wormhole', description: 'Activated only by sequence input, gossip, or typo.', lore: 'Up up down down left right left right. Then pretend nothing happened.', region: 'lab', href: '/lab#quantum', worldId: 3, worldPortal: 'expand-white', position: [-20, 760, 40], color: '#F0ABFC', size: 38, visible: { visited: 3 } },
      { id: 'lab-echo', label: 'ECHO / Borrowed Mouth', type: 'station', description: 'Experimental. Broadcasting on all frequencies and one spoon.', region: 'lab', href: '/lab#echo', worldId: 8, worldPortal: 'fold', position: [180, 700, 10], color: '#E879F9', size: 12, visible: { time: 30000 } },
      { id: 'lab-flicker', label: 'Screen-11 / Bad Memory', type: 'wormhole', description: 'Pairs of identical signals. Matching them does something. Unclear what.', region: 'lab', worldId: 11, worldPortal: 'scatter', position: [60, 820, 20], color: '#FF0064', size: 34, visible: { visited: 3 } },
      { id: 'lab-index', label: 'Catalog-16 / Wrong Sort', type: 'station', description: 'Master index of worlds. Order changes when observed.', region: 'lab', worldId: 16, worldPortal: 'fold', position: [-120, 720, 55], color: '#818CF8', size: 22, visible: { visited: 5 } },
      { id: 'lab-dial', label: 'Receiver-15 / Wide Band', type: 'signal', description: 'Tuning dial. 20 MHz of static and occasional truth.', region: 'lab', worldId: 15, worldPortal: 'chromatic', position: [200, 640, 35], color: '#22C55E', size: 14, visible: { time: 18000 } },
      { id: 'lab-void', label: 'Null Experiment / Running Log', type: 'fragment', description: 'Experiment terminated mid-run. Results: yes. Context: no.', region: 'lab', href: '/lab', position: [-80, 780, -15], color: '#7C3AED', size: 9, visible: { visited: 4 } },
    ]
  },
]

// Void objects — scattered between regions, reward roaming
export const VOID_OBJECTS: UniverseObject[] = [
  // Near-origin wormholes — visible immediately on entry
  { id: 'void-worm-near-1', label: 'Aperture-01 / No Label', type: 'wormhole', description: 'Small opening. The inside is much larger than the outside.', region: 'void', worldId: 5, worldPortal: 'rotate', position: [220, -80, 30], color: '#F97316', size: 38, visible: 'always' },
  { id: 'void-worm-near-2', label: 'Aperture-02 / Wrong Exit', type: 'wormhole', description: 'Leads somewhere that broadcasts. Possibly public access.', region: 'void', worldId: 3, worldPortal: 'expand-white', position: [-180, 130, 25], color: '#92400E', size: 32, visible: 'always' },
  { id: 'void-worm-near-3', label: 'Aperture-03 / Dead Mall', type: 'wormhole', description: 'Destination: commerce zone. Status: permanently closed.', region: 'void', worldId: 7, worldPortal: 'cursor-flood', position: [100, 200, 40], color: '#1A1410', size: 28, visible: 'always' },
  // Mid-range wormholes — unlock after some exploration
  { id: 'void-worm-mid-1', label: 'Rift-07 / Document Storage', type: 'wormhole', description: '52 pages. Most of them are waiting.', region: 'void', worldId: 6, worldPortal: 'nothing', position: [-350, -200, 15], color: '#B45309', size: 35, visible: { visited: 2 } },
  { id: 'void-worm-mid-2', label: 'Rift-08 / Corrupted Signal', type: 'wormhole', description: 'The signal is in there somewhere. Keep looking.', region: 'void', worldId: 8, worldPortal: 'fold', position: [380, 220, -20], color: '#404040', size: 30, visible: { visited: 3 } },
  // Deep void wormholes — deeper exploration rewards
  { id: 'void-worm-deep-1', label: 'Rift-10 / Same Room', type: 'wormhole', description: 'Interior dimensions inconsistent with exterior. You have been here.', region: 'void', worldId: 10, worldPortal: 'vortex', position: [-550, -350, 20], color: '#818CF8', size: 36, visible: { visited: 3 } },
  { id: 'void-worm-deep-2', label: 'Rift-11 / Double Vision', type: 'wormhole', description: 'Two of everything. Match them before they match you.', region: 'void', worldId: 11, worldPortal: 'scatter', position: [620, -300, 35], color: '#FF0064', size: 32, visible: { visited: 4 } },
  { id: 'void-worm-deep-3', label: 'Rift-12 / Root Access', type: 'wormhole', description: 'Shell environment. Type something. Anything.', region: 'void', worldId: 12, worldPortal: 'nothing', position: [-400, 400, -25], color: '#22C55E', size: 28, visible: { visited: 5 } },
  { id: 'void-worm-deep-4', label: 'Rift-13 / Vertical', type: 'wormhole', description: 'Infinite descent. Branching paths. No map.', region: 'void', worldId: 13, worldPortal: 'vortex', position: [500, 450, 30], color: '#6366F1', size: 42, visible: { visited: 2 } },
  { id: 'void-worm-deep-5', label: 'Rift-∞ / Another One', type: 'wormhole', description: 'This one wasn\'t here last time. Probably.', region: 'void', worldId: 10, worldPortal: 'fold', position: [-120, -520, 45], color: '#A78BFA', size: 26, visible: { time: 45000 } },
  { id: 'void-signal-spiral', label: 'Drift-∞ / Falling Signal', type: 'signal', description: 'Accelerating away from origin. Pick a branch or keep falling.', region: 'void', worldId: 13, worldPortal: 'vortex', position: [300, -400, 50], color: '#6366F1', size: 9, visible: { time: 25000 } },
  { id: 'void-worm-pixel', label: 'Rift-14 / Insert Coin', type: 'wormhole', description: '8-bit anomaly. Saturated colors. Wrong dimension.', region: 'void', worldId: 14, worldPortal: 'chromatic', position: [150, 520, 35], color: '#FF006E', size: 40, visible: 'always' },
  { id: 'void-worm-dial', label: 'Rift-15 / Carrier Wave', type: 'wormhole', description: 'FM static. Tune until something answers.', region: 'void', worldId: 15, worldPortal: 'chromatic', position: [-280, -180, 40], color: '#22C55E', size: 34, visible: { visited: 1 } },
  { id: 'void-worm-index', label: 'Rift-16 / Master List', type: 'wormhole', description: 'Every world filed incorrectly. Alphabetized by mood.', region: 'void', worldId: 16, worldPortal: 'fold', position: [720, 180, -15], color: '#6366F1', size: 36, visible: { visited: 4 } },
  { id: 'void-anomaly-pixel', label: 'Sprite-Δ / Lost Level', type: 'anomaly', description: 'Platform geometry detected. Colors exceed safe thresholds.', region: 'void', worldId: 14, worldPortal: 'chromatic', position: [-650, 100, 55], color: '#FFBE0B', size: 18, visible: { time: 12000 } },
  // Deep space fragments — for wanderers
  { id: 'void-frag-1', label: 'Fragment-∞ / Unanswered', type: 'fragment', description: 'Still waiting on a reply. The original question is no longer legible.', region: 'void', position: [-300, 250, -10], color: '#737373', size: 7, visible: 'always' },
  { id: 'void-frag-2', label: 'Debris-07 / Good Year', type: 'fragment', description: 'Cataloged as significant. Significance unspecified.', region: 'void', position: [700, 400, 15], color: '#525252', size: 5, visible: { visited: 2 } },
  { id: 'void-signal-1', label: 'Drift-04 / Open Water', type: 'signal', description: 'Unanchored. Has been moving toward something for a long time.', region: 'void', position: [200, -250, 20], color: '#A3A3A3', size: 6, visible: { time: 15000 } },
  { id: 'void-anomaly-1', label: 'Anomaly-X / No Genre', type: 'anomaly', description: 'Does not fit existing classification. Filed under itself.', region: 'void', position: [-200, -450, 30], color: '#6B7280', size: 12, visible: { time: 40000 } },
  { id: 'void-station-1', label: 'Relay-00 / Asking Around', type: 'station', description: 'Decommissioned communications post. Still receiving. Not transmitting.', region: 'void', position: [400, 300, -20], color: '#9CA3AF', size: 10, visible: { visited: 4 } },
]

// Origin object
export const ORIGIN_OBJECT: UniverseObject = {
  id: 'origin',
  label: 'TE-∅',
  type: 'anomaly',
  description: 'Origin point. You are probably here, unless the label moved.',
  lore: 'All signals converge here, then deny it.',
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
  cameraTarget: [0, 0, 600],
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
