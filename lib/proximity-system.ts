'use client'
import { create } from 'zustand'

export type ProximityZone = 'far' | 'near' | 'close'

interface ProximityState {
  cameraPos: [number, number, number]
  setCameraPos: (pos: [number, number, number]) => void
}

export const useProximityStore = create<ProximityState>((set) => ({
  cameraPos: [0, 0, 0],
  setCameraPos: (pos) => set({ cameraPos: pos }),
}))

export function getProximityZone(dist: number): ProximityZone {
  if (dist < 200) return 'close'
  if (dist < 800) return 'near'
  return 'far'
}

export function useProximity(targetPos: [number, number, number] | undefined) {
  const cameraPos = useProximityStore((s) => s.cameraPos)
  
  if (!targetPos) return { dist: 99999, zone: 'far' as ProximityZone }

  const dx = cameraPos[0] - targetPos[0]
  const dy = cameraPos[1] - targetPos[1]
  const dz = cameraPos[2] - targetPos[2]
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

  return {
    dist,
    zone: getProximityZone(dist)
  }
}
