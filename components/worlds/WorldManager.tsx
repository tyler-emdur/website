'use client'
import { useEffect } from 'react'
import { useWorldStore } from '@/lib/world-store'
import PortalTransition from './PortalTransition'
import World0Surface from './World0Surface'
import World1Apartment from './World1Apartment'
import World2Depth from './World2Depth'
import World3Broadcast from './World3Broadcast'
import World4Corridor from './World4Corridor'
import World5FieldStation from './World5FieldStation'
import World6Document from './World6Document'
import World7Mall from './World7Mall'
import World8Signal from './World8Signal'
import World9Contact from './World9Contact'

const WORLD_COMPONENTS = [
  World0Surface,
  World1Apartment,
  World2Depth,
  World3Broadcast,
  World4Corridor,
  World5FieldStation,
  World6Document,
  World7Mall,
  World8Signal,
  World9Contact,
]

function WorldConsoleSetup() {
  const store = useWorldStore()
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Expose world log
    ;(window as unknown as Record<string, unknown>).__worldLog = () => {
      const { getWorldLog } = require('@/lib/world-store')
      console.log('%c' + getWorldLog(), 'font-family: monospace; font-size: 11px; color: #22C55E')
    }
    // Counter reset
    ;(window as unknown as Record<string, unknown>).__counter = 0
    Object.defineProperty(window, '__counter', {
      get: () => 0,
      set: (v: number) => {
        if (v === 0) store.resetCounter()
      },
      configurable: true,
    })
    console.log('%c>> SIGNAL ACTIVE', 'color: #22C55E; font-family: monospace; font-size: 12px; font-weight: bold')
    console.log('%c>> type __worldLog() to see visited worlds', 'color: rgba(255,255,255,0.3); font-family: monospace; font-size: 10px')
    console.log('%c>> set __counter = 0 to reset', 'color: rgba(255,255,255,0.3); font-family: monospace; font-size: 10px')
  }, [])
  return null
}

export default function WorldManager() {
  const current = useWorldStore(s => s.current)
  const portalActive = useWorldStore(s => s.portalActive)
  const portalConfig = useWorldStore(s => s.portalConfig)

  const WorldComponent = WORLD_COMPONENTS[current]

  // Update data-world on html element for CSS scoping
  useEffect(() => {
    document.documentElement.setAttribute('data-world', current.toString())
  }, [current])

  return (
    <>
      <WorldConsoleSetup />
      {WorldComponent && <WorldComponent />}
      {portalActive && portalConfig && (
        <PortalTransition config={portalConfig} />
      )}
    </>
  )
}
