'use client'
import { useEffect, useRef } from 'react'
import { useCursor } from './CursorContext'

const AREA_COLORS: Record<string, string> = {
  hub:     '#CAFF00',
  run:     '#FF4422',
  build:   '#3B82F6',
  archive: '#C8A882',
  explore: '#22C55E',
  lab:     '#A855F7',
}

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const { area, mode } = useCursor()

  const mx = useRef(0), my = useRef(0)
  const rx = useRef(0), ry = useRef(0)
  const raf = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mx.current = e.clientX; my.current = e.clientY }
    window.addEventListener('mousemove', onMove)

    function tick() {
      rx.current += (mx.current - rx.current) * 0.13
      ry.current += (my.current - ry.current) * 0.13
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(calc(${mx.current}px - 50%), calc(${my.current}px - 50%))`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(calc(${rx.current}px - 50%), calc(${ry.current}px - 50%))`
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current) }
  }, [])

  const ringColor = area ? (AREA_COLORS[area] ?? '#CAFF00') : '#CAFF00'
  const isHover   = mode === 'hover'
  const isDrag    = mode === 'drag'

  return (
    <>
      <div
        ref={dotRef}
        id="cursor-dot"
        style={{
          position: 'fixed', zIndex: 9999, pointerEvents: 'none',
          width: isHover ? '6px' : '10px', height: isHover ? '6px' : '10px',
          borderRadius: '50%', background: '#fff',
          mixBlendMode: 'difference',
          transition: 'width 0.15s, height 0.15s',
          willChange: 'transform',
          top: 0, left: 0,
        }}
      />
      <div
        ref={ringRef}
        id="cursor-ring"
        style={{
          position: 'fixed', zIndex: 9998, pointerEvents: 'none',
          width: isHover ? '48px' : isDrag ? '28px' : '32px',
          height: isHover ? '48px' : isDrag ? '28px' : '32px',
          borderRadius: '50%',
          border: `1.5px solid ${ringColor}`,
          opacity: 0.65,
          transition: 'width 0.2s, height 0.2s, opacity 0.2s, border-color 0.3s',
          willChange: 'transform',
          top: 0, left: 0,
        }}
      />
    </>
  )
}
