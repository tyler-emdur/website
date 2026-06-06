'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import type { AreaId } from '@/lib/types'

type CursorMode = 'default' | 'hover' | 'drag' | 'text'

interface CursorCtx {
  area: AreaId | 'hub' | null
  mode: CursorMode
  setArea: (a: AreaId | 'hub' | null) => void
  setMode: (m: CursorMode) => void
}

const Ctx = createContext<CursorCtx>({
  area: null, mode: 'default',
  setArea: () => {}, setMode: () => {},
})

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [area, setArea] = useState<AreaId | 'hub' | null>(null)
  const [mode, setMode] = useState<CursorMode>('default')
  const sa = useCallback((a: AreaId | 'hub' | null) => setArea(a), [])
  const sm = useCallback((m: CursorMode) => setMode(m), [])
  return <Ctx.Provider value={{ area, mode, setArea: sa, setMode: sm }}>{children}</Ctx.Provider>
}

export const useCursor = () => useContext(Ctx)
