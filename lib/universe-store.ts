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
      { id: 'proj-digger', label: 'Digger', type: 'planet', description: 'Music discovery engine. Connects to Spotify.', lore: 'First detected 2024. Orbit stable.', region: 'projects', href: '/build#digger', position: [900, 150, 20], color: '#60A5FA', size: 28 , visible: 'always' },
      { id: 'proj-website', label: 'This Universe', type: 'planet', description: 'The interface you\'re standing in. Self-referential.', lore: 'Recursive object. Unstable at close range.', region: 'projects', href: '/build#website', position: [990, 210, -15], color: '#93C5FD', size: 18, visible: 'always' },
      { id: 'proj-faraday', label: 'Faraday', type: 'planet', description: 'Unknown signal origin. Still transmitting.', lore: 'Appeared without record.', region: 'projects', href: '/build#faraday', position: [820, 80, 30], color: '#1D4ED8', size: 22, visible: 'always' },
      { id: 'proj-hidden-station', label: 'Station Null', type: 'station', description: 'Abandoned relay. Logs encrypted.', lore: 'Decommissioned 2019. No crew listed.', region: 'projects', href: '/build#null', position: [1050, 120, -40], color: '#BFDBFE', size: 12, visible: { visited: 4 } },
    ]
  },
  {
    id: 'running',
    label: 'RUNNING',
    designation: 'Sector 02-B',
    color: '#F97316',
    position: [-700, -100, 0],
    objects: [
      { id: 'run-pikes', label: 'Pikes Peak', type: 'planet', description: '14,115 ft. Ascent only. Lungs optional.', lore: 'Elevation record logged.', region: 'running', href: '/run#pikes', position: [-700, -100, 25], color: '#F97316', size: 30, visible: 'always' },
      { id: 'run-boulder', label: 'Boulder Marathon', type: 'planet', description: '26.2 miles through the flatirons.', lore: 'First marathon. Coordinates match.', region: 'running', href: '/run#boulder', position: [-620, -180, -10], color: '#FB923C', size: 22, visible: 'always' },
      { id: 'run-golden', label: 'Golden Gate 25K', type: 'planet', description: '25K through Jefferson County open space.', region: 'running', href: '/run#golden', position: [-790, -60, 15], color: '#FED7AA', size: 18, visible: 'always' },
      { id: 'run-signal', label: 'Signal-04', type: 'signal', description: 'Active transponder. Pulse matches race cadence.', region: 'running', href: '/run', position: [-680, -200, 40], color: '#F97316', size: 8, visible: { visited: 2 } },
      { id: 'run-season', label: 'Season 2025', type: 'anomaly', description: 'Temporal anomaly. Data still incoming.', region: 'running', href: '/run#2025', position: [-820, -150, -30], color: '#FDBA74', size: 15, visible: { visited: 6 } },
    ]
  },
  {
    id: 'archives',
    label: 'ARCHIVES',
    designation: 'Sector 03-Ω',
    color: '#B45309',
    position: [-500, 550, 0],
    objects: [
      { id: 'arch-core', label: 'Archive Core', type: 'station', description: 'Central storage. Logs going back to 2015.', lore: 'Do not approach during low-power cycles.', region: 'archives', href: '/archive', position: [-500, 550, 0], color: '#B45309', size: 25, visible: 'always' },
      { id: 'arch-frag-1', label: 'Memory-001', type: 'fragment', description: 'Recovered. Partially corrupted.', region: 'archives', href: '/archive#001', position: [-560, 610, 20], color: '#92400E', size: 10, visible: 'always' },
      { id: 'arch-frag-2', label: 'Memory-047', type: 'fragment', description: 'High integrity. Timestamp: 2020.', region: 'archives', href: '/archive#047', position: [-440, 490, -15], color: '#78350F', size: 10, visible: 'always' },
      { id: 'arch-wormhole', label: '???', type: 'wormhole', description: 'Unstable aperture. Destination unknown.', region: 'archives', href: '/archive#deep', position: [-580, 500, 35], color: '#FDE68A', size: 14, visible: { needs: ['proj-digger', 'run-pikes', 'arch-core', 'explore-mt-elbert', 'lab-collider'] } },
    ]
  },
  {
    id: 'explore',
    label: 'EXPLORE',
    designation: 'Sector 04-Δ',
    color: '#22C55E',
    position: [500, -600, 0],
    objects: [
      { id: 'explore-mt-elbert', label: 'Mt. Elbert', type: 'planet', description: '14,439 ft. Highest point in Colorado.', lore: 'Summit achieved. Weather window: 4h.', region: 'explore', href: '/explore#elbert', position: [500, -600, 20], color: '#22C55E', size: 32, visible: 'always' },
      { id: 'explore-maroon', label: 'Maroon Bells', type: 'planet', description: 'Most photographed peaks in Colorado.', region: 'explore', href: '/explore#maroon', position: [580, -540, -10], color: '#4ADE80', size: 20, visible: 'always' },
      { id: 'explore-uncharted', label: 'Uncharted-α', type: 'anomaly', description: 'No data available. Approach with curiosity.', region: 'explore', href: '/explore#uncharted', position: [430, -680, 30], color: '#86EFAC', size: 16, visible: { visited: 3 } },
      { id: 'explore-hidden', label: 'Signal-09', type: 'signal', description: 'Faint transmission. Coordinates encoded.', region: 'explore', href: '/explore#signal', position: [600, -620, -25], color: '#22C55E', size: 8, visible: { time: 45000 } },
    ]
  },
  {
    id: 'lab',
    label: 'LAB',
    designation: 'Sector 05-Ψ',
    color: '#A855F7',
    position: [50, 700, 0],
    objects: [
      { id: 'lab-collider', label: 'Particle Collider', type: 'anomaly', description: 'Mouse-driven particle simulation. Unstable.', region: 'lab', href: '/lab#particles', position: [50, 700, 15], color: '#A855F7', size: 22, visible: 'always' },
      { id: 'lab-synth', label: 'Color Synth', type: 'anomaly', description: 'Generative hue field. Reacts to presence.', region: 'lab', href: '/lab#synth', position: [130, 760, -20], color: '#C084FC', size: 18, visible: 'always' },
      { id: 'lab-distort', label: 'Grid Distort', type: 'anomaly', description: 'Field distortion engine. High energy output.', region: 'lab', href: '/lab#grid', position: [-40, 640, 25], color: '#7C3AED', size: 16, visible: 'always' },
      { id: 'lab-collider2', label: 'Type Collider', type: 'anomaly', description: 'Language physics experiment. Click to repel.', region: 'lab', href: '/lab#type', position: [100, 660, -30], color: '#DDD6FE', size: 14, visible: 'always' },
      { id: 'lab-quantum', label: 'Quantum Gate', type: 'wormhole', description: 'Activated only by sequence input.', lore: 'Up up down down left right left right.', region: 'lab', href: '/lab#quantum', position: [-20, 760, 40], color: '#F0ABFC', size: 10, visible: { visited: 8 } },
      { id: 'lab-echo', label: 'ECHO', type: 'station', description: 'Experimental. Broadcasting on all frequencies.', region: 'lab', href: '/lab#echo', position: [180, 700, 10], color: '#E879F9', size: 12, visible: { time: 120000 } },
    ]
  },
]

// Origin object
export const ORIGIN_OBJECT: UniverseObject = {
  id: 'origin',
  label: 'TE-∅',
  type: 'anomaly',
  description: 'Origin point. You are here.',
  lore: 'All signals converge here.',
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
  cameraTarget: [0, 0, 1200],
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
  return [ORIGIN_OBJECT, ...REGIONS.flatMap(r => r.objects)]
}
