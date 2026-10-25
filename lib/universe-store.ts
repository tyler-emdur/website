'use client'
import { create } from 'zustand'

export type UniverseMode = 'exploring' | 'focused'

export interface UniverseObject {
  id: string
  label: string
  type: 'planet' | 'station' | 'anomaly' | 'signal' | 'wormhole' | 'fragment'
  /**
   * One true sentence about the real thing this object stands for.
   *
   * These used to be invented instrument readings — fifty of them, forty-one
   * built from the same template: `[Adjective] [technical noun]. [Label]:
   * [value]. [Label]: [value].` Not one of the values was real. A second
   * `lore` field repeated the trick in a lower voice, thirty-five more times.
   * Eighty-five strings off one grammar is not atmosphere, it is filler that
   * sounds like atmosphere, and the template was the tell.
   *
   * The rule now: name something that exists. The real fact about Pikes Peak
   * (14,115 feet, three hours exactly) beats `Local gravity variance: +1.2%`,
   * and an object whose only interesting property is the rule that reveals it
   * should say so — a described mechanic is a mechanic the visitor can notice.
   * No colon-value readouts. No number that isn't true.
   */
  description: string
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
  /** Sector code plus what the sector actually holds. */
  designation: string
  color: string
  position: [number, number, number]
  objects: UniverseObject[]
}

export const REGIONS: RegionDef[] = [
  {
    id: 'index',
    label: 'SECTOR 01-A',
    designation: 'SECTOR 01-A · THE MACHINE',
    color: '#3B82F6',
    position: [1600, 400, -100],
    objects: [
      { id: 'idx-null',            label: 'INDEX-∅',                type: 'planet',   description: 'The disk this whole site is served off. Everything else on this map is a file on it.', region: 'index', worldId: 5, worldPortal: 'newspaper', position: [1600, 400, -80],   color: '#60A5FA', size: 28, visible: 'always' },
      { id: 'idx-recursive',       label: 'RECURSIVE-∅',            type: 'anomaly',  description: 'The site contains the machine that serves the site. Opening it does not resolve the loop.', region: 'index', worldId: 5, worldPortal: 'newspaper', position: [1750, 520, -120],  color: '#93C5FD', size: 18, visible: 'always' },
      { id: 'idx-receptor',        label: 'RECEPTOR-14',            type: 'planet',   description: 'It boots to a DOS prompt. The shell takes DIR and CD, and the directories are really there.', region: 'index', worldId: 5, worldPortal: 'newspaper', position: [1420, 280, -70],    color: '#1D4ED8', size: 22, visible: 'always' },
      { id: 'idx-relay',           label: 'NODE-309',               type: 'station',  description: 'SRVHOST.EXE — the process keeping this site on the air at 88.7 MHz.', region: 'index', worldId: 5, worldPortal: 'cursor-flood', position: [1850, 320, -150], color: '#BFDBFE', size: 12, visible: { visited: 2 } },
      { id: 'idx-endpoint',       label: 'TERMINATION-POINT',      type: 'signal',   description: 'Where the signal stops. One receiver, and the address of whoever was transmitting.', region: 'index', worldId: 7, worldPortal: 'expand-white', position: [1980, 200, -60],   color: '#E5E5E5', size: 7,  visible: { visited: 6 } },
      { id: 'idx-loop',           label: 'SYSTEM-LOOP-10',         type: 'wormhole', description: 'Back into the machine, through a different door.', region: 'index', worldId: 5, worldPortal: 'vortex', position: [1680, 290, -110],   color: '#818CF8', size: 30, visible: { visited: 4 } },
    ]
  },
  {
    id: 'running',
    label: 'SECTOR 02-B',
    designation: 'SECTOR 02-B · RUNS',
    color: '#F97316',
    position: [-1500, -800, 200],
    objects: [
      { id: 'run-pikes',   label: 'PEAK-14115',         type: 'planet',   description: 'Pikes Peak. 14,115 feet, 13.3 miles of it uphill, three hours exactly.', region: 'running', worldId: 2, worldPortal: 'slide-right',   position: [-1500, -800, 230],  color: '#F97316', size: 30, visible: 'always' },
      { id: 'run-boulder', label: 'METRIC-26.2',        type: 'planet',   description: 'The Boulder Marathon. 26.2 miles in 3:39.', region: 'running', worldId: 2, worldPortal: 'slide-right', position: [-1380, -960, 180], color: '#FB923C', size: 22, visible: 'always' },
      { id: 'run-golden',  label: 'SEGMENT-GOLDEN',     type: 'fragment', description: 'The Golden Gate 25K. Fifteen and a half miles, three thousand feet of climbing in it.', region: 'running', worldId: 2, worldPortal: 'slide-right',  position: [-1620, -720, 210],   color: '#FED7AA', size: 18, visible: 'always' },
      { id: 'run-season',  label: 'TEMPORAL-2025',      type: 'anomaly',  description: 'Every line on that map comes off a real GPS trace. They are where the feet actually went.', region: 'running', worldId: 2, worldPortal: 'slide-right', position: [-1680, -920, 160], color: '#FDBA74', size: 15, visible: { visited: 3 } },
    ]
  },
  {
    id: 'archives',
    label: 'SECTOR 03-Ω',
    designation: 'SECTOR 03-Ω · OLD FILES',
    color: '#B45309',
    position: [-1200, 1300, -300],
    objects: [
      { id: 'arch-frag-1',    label: 'DATA-MEM-001',        type: 'fragment', description: 'C:\\EXPERIMENTS — eight things that got started and did not get finished.', region: 'archives', worldId: 5, worldPortal: 'rotate', position: [-1310, 1420, -280],  color: '#92400E', size: 10, visible: 'always' },
      { id: 'arch-frag-2',    label: 'DATA-MEM-047',        type: 'fragment', description: 'css-only-solar-system.html. All eight planets plus Pluto, out of spite, at six frames a second.', region: 'archives', worldId: 5, worldPortal: 'rotate', position: [-1090, 1180, -320], color: '#78350F', size: 10, visible: 'always' },
      { id: 'arch-wormhole',  label: 'APERTURE-3-A',        type: 'wormhole', description: 'Out to the map of Boulder.', region: 'archives', worldId: 2, worldPortal: 'scatter', position: [-1340, 1200, -260],  color: '#FDE68A', size: 45, visible: 'always' },
      { id: 'arch-wormhole-2', label: 'RIFT-03',            type: 'wormhole', description: 'To the answering machine. The light on it is blinking.', region: 'archives', worldId: 9, worldPortal: 'nothing', position: [-1240, 1150, -230],  color: '#22C55E', size: 32, visible: { visited: 2 } },
      { id: 'arch-frag-3',    label: 'DATA-MEM-113',        type: 'fragment', description: 'markov-commit-messages.py. It mostly produced "fix fix bug the the thing."', region: 'archives', worldId: 5, worldPortal: 'rotate', position: [-1160, 1410, -290],  color: '#92400E', size: 8,  visible: { visited: 3 } },
    ]
  },
  {
    id: 'explore',
    label: 'SECTOR 04-Δ',
    designation: 'SECTOR 04-Δ · MOUNTAINS',
    color: '#22C55E',
    position: [1200, -1300, 150],
    objects: [
      { id: 'explore-mt-elbert', label: 'PEAK-14439',       type: 'planet',   description: 'Mount Elbert — the highest ground in Colorado, and the highest thing on this map.', region: 'explore', worldId: 2, worldPortal: 'scatter', position: [1200, -1300, 180],   color: '#22C55E', size: 32, visible: 'always' },
      { id: 'explore-maroon',    label: 'MAROON-RELAY',     type: 'station',  description: 'Maroon Bells. Twelve miles of trail, twenty-one hundred feet of it up.', region: 'explore', worldId: 2, worldPortal: 'scatter', position: [1320, -1180, 130],  color: '#4ADE80', size: 20, visible: 'always' },
      { id: 'explore-uncharted', label: 'SECTOR-UNMAPPED',  type: 'anomaly',  description: 'The streets in Boulder that have not been run yet. That map keeps score.', region: 'explore', worldId: 2, worldPortal: 'scatter', position: [1060, -1420, 200],   color: '#86EFAC', size: 16, visible: { visited: 2 } },
      { id: 'explore-hidden',    label: 'BEACON-04-Δ',      type: 'signal',   description: 'Only surfaces after twenty seconds in the hub. You stayed that long, so here it is.', region: 'explore', worldId: 2, worldPortal: 'scatter', position: [1350, -1320, 110],  color: '#22C55E', size: 8,  visible: { time: 20000 } },
      { id: 'explore-corridor',  label: 'CORRIDOR-A',       type: 'wormhole', description: 'Points at world 4. Nothing has ever been built there, and the socket is still wired.', region: 'explore', worldId: 4, worldPortal: 'slide-right', position: [1120, -1520, 190],   color: '#60A5FA', size: 45, visible: 'always' },
      { id: 'explore-spiral',    label: 'DESCENT-DESCENT',  type: 'wormhole', description: 'Down to a room with a telephone in it.', region: 'explore', worldId: 9, worldPortal: 'vortex', position: [1260, -1620, 220],   color: '#6366F1', size: 40, visible: { visited: 1 } },
    ]
  },
  {
    id: 'lab',
    label: 'SECTOR 05-Ψ',
    designation: 'SECTOR 05-Ψ · PROGRAMS',
    color: '#A855F7',
    position: [100, 1800, -250],
    objects: [
      { id: 'lab-collider',  label: 'PARTICLE-01',      type: 'anomaly',  description: 'ParticleFlow.EXE, on the machine. Click and drag; two thousand particles follow.', region: 'lab', worldId: 5, worldPortal: 'expand-white', position: [100, 1800, -230],    color: '#A855F7', size: 22, visible: 'always' },
      { id: 'lab-synth',     label: 'COLOR-SYNTH',      type: 'anomaly',  description: 'ColorSynth.EXE. The entire screen is downstream of where the mouse is.', region: 'lab', worldId: 5, worldPortal: 'expand-white',      position: [220, 1920, -280],  color: '#C084FC', size: 18, visible: 'always' },
      { id: 'lab-distort',   label: 'GRID-DISTORTION',  type: 'anomaly',  description: 'GridDistort.EXE. A flat grid that bends toward the cursor and springs back.', region: 'lab', worldId: 5, worldPortal: 'expand-white',       position: [-40, 1680, -210],   color: '#7C3AED', size: 16, visible: 'always' },
      { id: 'lab-collider2', label: 'COLLIDER-02',      type: 'anomaly',  description: 'TypeCollider.EXE. Click and the letters come apart.', region: 'lab', worldId: 5, worldPortal: 'expand-white',        position: [180, 1720, -290],  color: '#DDD6FE', size: 14, visible: 'always' },
      { id: 'lab-quantum',   label: 'QUANTUM-GATE',     type: 'wormhole', description: 'Over to the broadcast. Ten channels; nine of them come from real cities.', region: 'lab', worldId: 3, worldPortal: 'expand-white', position: [-10, 1920, -200],   color: '#F0ABFC', size: 38, visible: { visited: 3 } },
      { id: 'lab-echo',      label: 'NODE-ECHO',        type: 'station',  description: 'The garage radio. It is a real FM stream and it is playing right now.', region: 'lab', worldId: 6, worldPortal: 'fold', position: [300, 1800, -220],   color: '#E879F9', size: 12, visible: { time: 30000 } },
      { id: 'lab-index',     label: 'MASTER-CATALOG',   type: 'station',  description: 'Warehouse 14. The aisle does not end — that is not a figure of speech.', region: 'lab', worldId: 14, worldPortal: 'fold',    position: [-180, 1840, -170],  color: '#818CF8', size: 22, visible: { visited: 5 } },
      { id: 'lab-void',      label: 'NULL-EXPERIMENT',  type: 'fragment', description: 'unfinished-chess-engine. Minimax to depth three. It still loses to the tutorial.', region: 'lab', worldId: 5, worldPortal: 'expand-white', position: [-110, 1960, -270],  color: '#7C3AED', size: 9,  visible: { visited: 4 } },
    ]
  },
  {
    id: 'forgotten',
    label: '',
    designation: 'SECTOR 06-∅ · UNLISTED',
    color: '#475569',
    position: [-2400, -1800, 500],
    objects: [
      { id: 'forgotten-1', label: 'OBJECT-46', type: 'fragment', description: 'A piece of something. The rest of it is not on this map.', region: 'forgotten', position: [-2500, -1950, 450], color: '#64748B', size: 10, visible: 'always' },
      { id: 'forgotten-2', label: 'ANOMALY-104', type: 'anomaly', description: 'Nothing points here and it points nowhere. It is on the map because it is there.', region: 'forgotten', position: [-2300, -1650, 550], color: '#475569', size: 20, visible: 'always' },
      { id: 'forgotten-3', label: 'SIGNAL-099', type: 'signal', description: 'Surfaces about ten seconds in, if you are still around.', region: 'forgotten', position: [-2400, -1800, 500], color: '#94A3B8', size: 8, visible: { time: 10000 } }
    ]
  }
]

// The doors. One per world, scattered rather than ringed — a visitor should
// find them, not read them off a menu. Each one says what is actually on the
// other side, because the contents are the mystery and the door is not.
const PORTAL_GATES: Array<Omit<UniverseObject, 'type' | 'region' | 'visible'>> = [
  { id: 'gate-00', label: 'GATE-00', description: 'The plain front door. One page, big type, the way a homepage used to look.',                    worldId: 0,  worldPortal: 'door',         position: [176,  -472, 32],  color: '#F4F1EC', size: 18 },
  { id: 'gate-02', label: 'EXPLORER-02', description: 'Boulder from above, with every run drawn on it. Some pins only come out after dark.',       worldId: 2,  worldPortal: 'scatter',      position: [488,  -304, -28], color: '#5ecbe0', size: 18 },
  { id: 'gate-03', label: 'ON-AIR-03',description: 'Ten channels. Nine of them come from real cities. The tenth is 88.', worldId: 3,  worldPortal: 'expand-white', position: [716,   140,  70],  color: '#92400E', size: 18 },
  { id: 'gate-05', label: 'MACHINE-05', description: 'A 486 running DOS, with this site served off its disk. Estate sale, box 3. It still boots.',    worldId: 5,  worldPortal: 'cursor-flood', position: [-736, -76,  48],  color: '#5ecbe0', size: 18 },
  { id: 'gate-06', label: 'GARAGE-06', description: 'A car in a garage after midnight. Engine off, radio on, nobody drove there.',             worldId: 6,  worldPortal: 'fold',         position: [-380, -467, 60], color: '#ffb347', size: 18 },
  { id: 'gate-07', label: 'ENDPOINT-07',     description: 'The end of the signal, and the only real address on this map.',                  worldId: 7,  worldPortal: 'expand-white', position: [131,  -892, 99],  color: '#FFFFFF', size: 20 },
  { id: 'gate-08', label: 'READERS-08',  description: 'Every licence plate reader in Boulder, on a departures board. The police run thirty-three.', worldId: 8,  worldPortal: 'slide-right', position: [-620,  520, 44],  color: '#ffd666', size: 18 },
  { id: 'gate-09', label: 'MESSAGES-09', description: 'An answering machine with the tape still in it. You can leave one; someone will hear it.', worldId: 9, worldPortal: 'nothing',      position: [611,  844, 28],  color: '#c8a850', size: 20 },
  { id: 'gate-14', label: 'AISLE-14',   description: 'A warehouse aisle that does not end. It keeps hours anyway.',        worldId: 14, worldPortal: 'chromatic',    position: [-950, 260,  85],  color: '#D4A24C', size: 20 },
  { id: 'gate-10', label: 'DIRECTORY-10', description: 'Twelve real repositories, most of them stalled, with the honest read on each one.', worldId: 10, worldPortal: 'letter-expand', position: [950, -520, 36],  color: '#C9BE9E', size: 18 },
]

export const VOID_OBJECTS: UniverseObject[] = [
  ...PORTAL_GATES.map(gate => ({ ...gate, type: 'wormhole' as const, region: 'void', visible: 'always' as const })),
  { id: 'void-frag-1',   label: '∞',          type: 'fragment', description: 'Filed under nothing. It has a symbol where a name goes.',             region: 'void', position: [-120, -130, -10], color: '#737373', size: 7,  visible: 'always' },
  { id: 'void-frag-2',   label: 'DEBRIS-07',  type: 'fragment', description: 'Kept because throwing it out seemed worse than keeping it.',                  region: 'void', position: [140,  120,  15],  color: '#525252', size: 5,  visible: { visited: 2 } },
  { id: 'void-signal-1', label: '⬥ DRIFT',    type: 'signal',   description: 'It drifts. Fifteen seconds in the hub is long enough to catch it.',                          region: 'void', position: [120,  -160, 20],  color: '#A3A3A3', size: 6,  visible: { time: 15000 } },
  { id: 'void-anomaly-1', label: 'ANOMALY-X',  type: 'anomaly',  description: 'Arrives about forty seconds in. Most people have clicked something by then.',          region: 'void', position: [-160, 150,  30],  color: '#6B7280', size: 12, visible: { time: 40000 } },
  { id: 'void-station-1', label: 'RELAY-00',   type: 'station',  description: 'Receives, does not transmit. It showed up once you had opened four things.',                  region: 'void', position: [20,   0,   -20],  color: '#9CA3AF', size: 10, visible: { visited: 4 } },
  { id: 'void-dark-anomaly', label: 'CLASSIFIED-NULL-VOID', type: 'anomaly', description: 'The biggest object on this map and the only one with nothing behind it.', region: 'void', position: [-2500, 1800, -1200], color: '#000000', size: 160, visible: 'always' },
  { id: 'void-drifter', label: 'DRIFT-BEACON', type: 'signal', description: 'Slow, and not anchored to any sector.', region: 'void', position: [400, 400, 0], color: '#A3A3A3', size: 8, visible: 'always' },
]

// Origin
export const ORIGIN_OBJECT: UniverseObject = {
  id: 'origin',
  label: 'TE-∅',
  type: 'anomaly',
  description: 'The middle of the map is downtown Boulder, 40.0150°N 105.2705°W. Every coordinate in every world is measured off this point.',
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
