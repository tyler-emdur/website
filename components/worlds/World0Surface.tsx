'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'

export default function World0Surface() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const counter = useWorldStore(s => s.counter)
  const resetCounter = useWorldStore(s => s.resetCounter)
  const recordInteraction = useWorldStore(s => s.recordInteraction)
  const [cursorBlink, setCursorBlink] = useState(true)
  const [typing, setTyping] = useState('')
  const [showHint, setShowHint] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interacted = useRef(false)
  const [counterVal, setCounterVal] = useState(counter)

  // Blink cursor at 1.1s interval
  useEffect(() => {
    const iv = setInterval(() => setCursorBlink(b => !b), 1100)
    return () => clearInterval(iv)
  }, [])

  // Counter countdown (never reaches 0)
  useEffect(() => {
    const iv = setInterval(() => {
      setCounterVal(v => {
        if (v <= 1) return 1
        return v - 1
      })
    }, 3000)
    return () => clearInterval(iv)
  }, [])

  // 47 second idle → World 1
  const resetIdleTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (!interacted.current) {
        navigateTo(1, { type: 'fold' })
      }
    }, 47000)
  }, [navigateTo])

  useEffect(() => {
    resetIdleTimer()
    // Show hint at 30s
    const hintTimer = setTimeout(() => setShowHint(true), 30000)

    const handleScroll = (e: Event) => {
      e.preventDefault()
      if (interacted.current) return
      interacted.current = true
      recordInteraction()
      navigateTo(7, { type: 'cursor-flood', color: '#8B5E3C' })
    }

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault()
      if (interacted.current) return
      interacted.current = true
      recordInteraction()
      navigateTo(5, { type: 'rotate' })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Meta', 'Control', 'Alt', 'Shift', 'Tab', 'CapsLock', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)) return
      if (interacted.current) return
      interacted.current = true
      recordInteraction()
      setTyping(e.key)
      navigateTo(6, { type: 'letter-expand', letter: e.key.length === 1 ? e.key : 'T' })
    }

    window.addEventListener('wheel', handleScroll, { passive: false })
    window.addEventListener('contextmenu', handleRightClick)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      clearTimeout(hintTimer)
      window.removeEventListener('wheel', handleScroll)
      window.removeEventListener('contextmenu', handleRightClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigateTo, recordInteraction, resetIdleTimer])

  const handleCursorClick = useCallback((e: React.MouseEvent) => {
    if (interacted.current) return
    interacted.current = true
    recordInteraction()
    navigateTo(3, { type: 'expand-white', origin: { x: e.clientX, y: e.clientY } })
  }, [navigateTo, recordInteraction])

  return (
    <div
      data-world="0"
      style={{
        position: 'fixed', inset: 0,
        background: '#fafaf8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"IM Fell English", Georgia, serif',
        cursor: 'default',
        overflow: 'hidden',
      }}
    >
      {/* HTML comment with email — visible in source */}
      {/* <!-- hello@tyleremdur.com --> */}

      {/* Main cursor */}
      <div
        onClick={handleCursorClick}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 0,
          fontSize: 'clamp(1.2rem, 3vw, 2rem)',
          color: '#1a1a1a',
          letterSpacing: '-0.01em',
          cursor: 'text',
          userSelect: 'none',
        }}
      >
        <span style={{ opacity: 0.55 }}>_</span>
        <span style={{
          display: 'inline-block',
          width: '0.55em', height: '1.25em',
          background: '#1a1a1a',
          opacity: cursorBlink ? 1 : 0,
          transition: 'opacity 0.05s',
          verticalAlign: 'text-bottom',
          marginLeft: '0.08em',
        }} />
      </div>

      {/* Hint text — fades in at 30s */}
      {showHint && (
        <div style={{
          position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          fontFamily: '"IM Fell English", Georgia, serif',
          fontSize: 11, color: 'rgba(0,0,0,0.18)',
          letterSpacing: '0.12em', textAlign: 'center',
          animation: 'fadeIn 2s both',
        }}>
          something is waiting
        </div>
      )}

      {/* Counter — bottom right, clickable */}
      <div
        onClick={resetCounter}
        style={{
          position: 'absolute', bottom: 24, right: 32,
          fontFamily: 'monospace', fontSize: 9,
          color: 'rgba(0,0,0,0.12)',
          cursor: 'default',
          letterSpacing: '0.1em',
        }}
      >
        {counterVal.toString().padStart(4, '0')}
      </div>

      {/* Tiny version tag */}
      <div style={{
        position: 'absolute', bottom: 24, left: 32,
        fontFamily: 'monospace', fontSize: 8,
        color: 'rgba(0,0,0,0.08)',
        letterSpacing: '0.1em',
      }}>
        v0.0.0
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  )
}
