'use client'
import { useEffect } from 'react'
import { useCursor } from '@/components/cursor/CursorContext'
import BackToHub from './BackToHub'
import type { AreaId } from '@/lib/types'

const AREA_COLORS: Record<AreaId, string> = {
  run:     '#FF4422',
  build:   '#3B82F6',
  archive: '#C8A882',
  explore: '#22C55E',
  lab:     '#A855F7',
}

interface Props {
  area: AreaId
  children: React.ReactNode
  className?: string
}

export default function AreaLayout({ area, children, className = '' }: Props) {
  const { setArea } = useCursor()
  const color = AREA_COLORS[area]

  useEffect(() => {
    setArea(area)
    return () => setArea(null)
  }, [area, setArea])

  return (
    <div className={`min-h-screen area-enter ${className}`} style={{ '--area-color': color } as React.CSSProperties}>
      <BackToHub color={color} />
      {children}
    </div>
  )
}
