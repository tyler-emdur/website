'use client'
import { create } from 'zustand'

export type WorldId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type PortalType =
  | 'door'          // page rotates open like a physical door
  | 'fold'          // CSS 3D fold reveals next world
  | 'expand-white'  // white circle expands from click point
  | 'rotate'        // viewport rotates 90deg
  | 'scatter'       // elements scatter, black, new world
  | 'newspaper'     // page becomes newspaper, click headline
  | 'letter-expand' // one letter expands to fill screen
  | 'nothing'       // nothing appears to happen (subtle)
  | 'cursor-flood'  // cursor trail floods screen
  | 'slide-right'   // page slides in from right (4s)

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
  navigateTo: (world: WorldId, portal: PortalConfig) => void
  completePortal: () => void
  recordInteraction: () => void
  resetCounter: () => void
  _pendingWorld: WorldId | null
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

export const useWorldStore = create<WorldState>((set, get) => ({
  current: 0,
  previous: null,
  visited: typeof window !== 'undefined' ? loadVisited() : [],
  portalActive: false,
  portalConfig: null,
  interactionCount: 0,
  sessionStart: Date.now(),
  counter: 1247,
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
    1: 'THE APARTMENT',
    2: 'THE DEPTH',
    3: 'THE BROADCAST',
    4: 'THE CORRIDOR',
    5: 'THE FIELD STATION',
    6: 'THE DOCUMENT',
    7: 'THE MALL',
    8: 'THE SIGNAL',
    9: 'THE CONTACT PAGE',
  }
  const lines = ['WORLDS VISITED:', ...visited.map(w => `  [${w}] ${names[w as WorldId] ?? '???'}`)]
  return lines.join('\n')
}
