'use client'
import { create } from 'zustand'

export type WorldId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16

export type PortalType =
  | 'door'
  | 'fold'
  | 'expand-white'
  | 'rotate'
  | 'scatter'
  | 'newspaper'
  | 'letter-expand'
  | 'nothing'
  | 'cursor-flood'
  | 'slide-right'
  | 'vortex'
  | 'chromatic'

export interface PortalConfig {
  type: PortalType
  color?: string
  letter?: string
  origin?: { x: number; y: number }
}

const WORLD_TITLES: Record<WorldId, string> = {
  0: 'Tyler Emdur',
  1: 'Tyler Emdur',
  2: 'please hold',
  3: '(1) New Message — Mail',
  4: '█████ ████ ████',
  5: 'the same as last time',
  6: 'good evening',
  7: 'this tab has been open too long',
  8: 'good evening',
  9: 'Tyler Emdur — tyleremdur.com',
  10: 'room 10 · room 10 · room 10',
  11: 'match the pairs · or dont',
  12: 'root@wormhole:~#',
  13: 'falling · falling · falling',
  14: '★ PIXEL QUEST ★ press start',
  15: '··· tuning · · · static · · ·',
  16: 'master catalog · index incomplete',
}

interface WorldState {
  current: WorldId
  previous: WorldId | null
  visited: WorldId[]
  portalActive: boolean
  portalConfig: PortalConfig | null
  interactionCount: number
  sessionStart: number
  counter: number
  secretsFound: string[]
  navigateTo: (world: WorldId, portal: PortalConfig) => void
  completePortal: () => void
  recordInteraction: () => void
  findSecret: (id: string) => void
  hasSecret: (id: string) => boolean
  resetCounter: () => void
  _pendingWorld: WorldId | null
}

function loadReturnWorld(): WorldId {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem('te-return-world')
    if (raw === null) return 0
    localStorage.removeItem('te-return-world')
    const id = parseInt(raw)
    if (isNaN(id) || id < 0 || id > 15) return 0
    return id as WorldId
  } catch { return 0 }
}

function loadVisited(): WorldId[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('visited_worlds')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveVisited(worlds: WorldId[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('visited_worlds', JSON.stringify(worlds)) } catch {}
}

function loadSecrets(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('world_secrets')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveSecrets(secrets: string[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('world_secrets', JSON.stringify(secrets)) } catch {}
}

export const useWorldStore = create<WorldState>((set, get) => ({
  current: typeof window !== 'undefined' ? loadReturnWorld() : 0,
  previous: null,
  visited: typeof window !== 'undefined' ? loadVisited() : [],
  portalActive: false,
  portalConfig: null,
  interactionCount: 0,
  sessionStart: Date.now(),
  counter: 1247,
  secretsFound: typeof window !== 'undefined' ? loadSecrets() : [],
  _pendingWorld: null,

  navigateTo: (world, portal) => {
    const state = get()
    if (state.portalActive) return
    // Update document title
    if (typeof document !== 'undefined') {
      document.title = WORLD_TITLES[world]
    }
    const newVisited = state.visited.includes(world) ? state.visited : [...state.visited, world]
    saveVisited(newVisited)
    set({
      portalActive: true,
      portalConfig: portal,
      _pendingWorld: world,
      visited: newVisited,
    })
  },

  completePortal: () => {
    const state = get()
    if (state._pendingWorld === null) return
    set({
      current: state._pendingWorld,
      previous: state.current,
      portalActive: false,
      portalConfig: null,
      _pendingWorld: null,
    })
  },

  recordInteraction: () => set(s => ({ interactionCount: s.interactionCount + 1 })),

  findSecret: (id) => {
    const state = get()
    if (state.secretsFound.includes(id)) return
    const next = [...state.secretsFound, id]
    saveSecrets(next)
    set({ secretsFound: next })
    if (typeof console !== 'undefined') {
      console.log(`%c>> secret found: ${id} (${next.length} total)`, 'color: #F472B6; font-family: monospace; font-size: 11px')
    }
  },

  hasSecret: (id) => get().secretsFound.includes(id),

  resetCounter: () => {
    if (typeof console !== 'undefined') {
      console.log('%c>> counter reset. you found something.', 'color: #22C55E; font-family: monospace; font-size: 12px')
      console.log('%c>> the counter does not reach zero.', 'color: rgba(255,255,255,0.4); font-family: monospace; font-size: 11px')
      console.log('%c>> but you already knew that.', 'color: rgba(255,255,255,0.2); font-family: monospace; font-size: 11px')
    }
    set({ counter: 1247 })
  },
}))

export function getWorldLog(): string {
  const visited = loadVisited()
  const names: Record<WorldId, string> = {
    0: 'THE SURFACE',
    1: 'THE UNIVERSE',
    2: 'THE DEPTH',
    3: 'THE BROADCAST',
    4: 'THE CORRIDOR',
    5: 'THE FIELD STATION',
    6: 'THE DOCUMENT',
    7: 'THE MALL',
    8: 'THE SIGNAL',
    9: 'THE CONTACT PAGE',
    10: 'THE LOOP',
    11: 'THE FLICKER',
    12: 'THE TERMINAL',
    13: 'THE SPIRAL',
    14: 'THE PIXEL',
    15: 'THE DIAL',
    16: 'THE CATALOG',
  }
  const secrets = loadSecrets()
  const lines = [
    'WORLDS VISITED:',
    ...visited.map(w => `  [${w}] ${names[w as WorldId] ?? '???'}`),
    '',
    `SECRETS: ${secrets.length}`,
    ...secrets.map(s => `  · ${s}`),
  ]
  return lines.join('\n')
}
