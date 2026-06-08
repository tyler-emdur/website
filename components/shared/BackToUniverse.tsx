'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'

export default function BackToUniverse() {
  const router = useRouter()

  const goBack = useCallback(() => {
    // Two-pronged fix so the universe (world 1) always loads on return:
    // 1. Direct store update covers same-session soft navigations
    //    (Zustand store is a module singleton — create() only runs once,
    //     so the initial-state localStorage check won't fire again)
    // 2. localStorage flag covers full page reloads / fresh sessions
    useWorldStore.setState({ current: 1 })
    if (typeof window !== 'undefined') {
      localStorage.setItem('te-return-world', '1')
    }
    router.push('/')
  }, [router])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') goBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goBack])

  return (
    <a
      href="/"
      className="back-universe"
      onClick={(e) => { e.preventDefault(); goBack() }}
    >
      UNIVERSE &nbsp;<span style={{ opacity: 0.4, fontSize: 7 }}>ESC</span>
    </a>
  )
}
