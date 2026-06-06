'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCursor } from '@/components/cursor/CursorContext'

interface Props { color: string }

export default function BackToHub({ color }: Props) {
  const router = useRouter()
  const { setMode } = useCursor()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') router.push('/') }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  return (
    <button
      onClick={() => router.push('/')}
      onMouseEnter={() => setMode('hover')}
      onMouseLeave={() => setMode('default')}
      style={{ color }}
      className="fixed top-6 left-6 z-50 font-mono text-[10px] tracking-[0.2em] uppercase opacity-40 hover:opacity-100 transition-opacity cursor-none flex items-center gap-2"
    >
      <span>←</span>
      <span>Hub</span>
      <span className="opacity-50 ml-1">esc</span>
    </button>
  )
}
