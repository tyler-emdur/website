'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function BackToUniverse() {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  return (
    <a href="/" className="back-universe">
      UNIVERSE &nbsp;<span style={{ opacity: 0.4, fontSize: 7 }}>ESC</span>
    </a>
  )
}
