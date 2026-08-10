'use client'
import { useEffect } from 'react'
import { useWorldStore, type WorldId } from '@/lib/world-store'

// Arriving at a URL directly is not travel — you did not come through a portal,
// so no portal plays. This snaps the store to the world named by the address
// and renders nothing itself; the world is already mounted in the root layout.
export default function WorldSync({ worldId }: { worldId: WorldId }) {
  useEffect(() => {
    useWorldStore.getState().arriveAt(worldId)
  }, [worldId])

  return null
}
