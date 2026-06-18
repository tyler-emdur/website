'use client'
import React, { useEffect } from 'react'
import { useWorldStore, getWorldLog } from '@/lib/world-store'
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
import World10Loop from './World10Loop'
import World11Flicker from './World11Flicker'
import World12Terminal from './World12Terminal'
import World13Spiral from './World13Spiral'
import World14Pixel from './World14Pixel'
import World15Dial from './World15Dial'
import World16Catalog from './World16Catalog'

const WORLD_COMPONENTS: Record<number, React.ComponentType> = {
  0: World0Surface,
  1: World1Apartment,
  2: World2Depth,
  3: World3Broadcast,
  4: World4Corridor,
  5: World5FieldStation,
  6: World6Document,
  7: World7Mall,
  8: World8Signal,
  9: World9Contact,
  10: World10Loop,
  11: World11Flicker,
  12: World12Terminal,
  13: World13Spiral,
  14: World14Pixel,
  15: World15Dial,
  16: World16Catalog,
}

function WorldConsoleSetup() {
  const store = useWorldStore()
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Expose world log
    ;(window as unknown as Record<string, unknown>).__worldLog = () => {
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
    console.log('%c>> secrets persist. nothing else does.', 'color: rgba(244,114,182,0.4); font-family: monospace; font-size: 10px')
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
