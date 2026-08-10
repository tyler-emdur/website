'use client'
import React, { useEffect } from 'react'
import { useWorldStore, getWorldLog, WORLD_IDS, type WorldId } from '@/lib/world-store'
import { pathForWorld, worldForSlug } from '@/lib/worlds'
import PortalTransition from './PortalTransition'
import World0Surface from './World0Surface'
import World1Universe from './World1Universe'
import World2Explorer from './World2Explorer'
import World3Broadcast from './World3Broadcast'
import World5Machine from './machine/World5Machine'
import World6Garage from './World6Garage'
import World7Contact from './World7Contact'
import World8Departures from './World8Departures'
import World9Answering from './World9Answering'
import World10Directory from './World10Directory'
import World14Aisle from './World14Aisle'

const WORLD_COMPONENTS: Record<number, React.ComponentType> = {
  0: World0Surface,
  1: World1Universe,
  2: World2Explorer,
  3: World3Broadcast,
  5: World5Machine,
  6: World6Garage,
  7: World7Contact,
  8: World8Departures,
  9: World9Answering,
  10: World10Directory,
  14: World14Aisle,
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

  const WorldComponent = WORLD_COMPONENTS[current] ?? World0Surface

  // The address bar follows the world. `history.pushState` rather than the
  // Next router on purpose: the router would re-run the route and remount this
  // subtree, killing the portal mid-animation. Shallow history updates are a
  // supported App Router escape hatch and leave the mounted scene alone.
  useEffect(() => {
    if (typeof window === 'undefined') return
    // The front door owns "/" until the visitor enters; don't steal it.
    if (window.location.pathname === '/') return
    const path = pathForWorld(current)
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path)
    }
  }, [current])

  // ...and the world follows the back button.
  useEffect(() => {
    const onPop = () => {
      const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
      const route = worldForSlug(slug)
      if (route) useWorldStore.getState().arriveAt(route.id)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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
