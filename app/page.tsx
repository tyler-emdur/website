'use client'
import { useEffect, useState } from 'react'
import WorldManager from '@/components/worlds/WorldManager'
import FrontDoor from '@/components/FrontDoor'

export default function Home() {
  const [phase, setPhase] = useState<'loading' | 'front-door' | 'entering' | 'world'>('loading')

  useEffect(() => {
    try {
      setPhase(sessionStorage.getItem('te-front-door-seen') !== '1' ? 'front-door' : 'world')
    } catch {
      setPhase('world')
    }
  }, [])

  const startEnter = () => {
    try { sessionStorage.setItem('te-front-door-seen', '1') } catch {}
    setPhase('entering')
  }

  const finishEnter = () => setPhase('world')

  if (phase === 'loading') return null
  return (
    <>
      {phase !== 'front-door' && <WorldManager />}
      {(phase === 'front-door' || phase === 'entering') && (
        <FrontDoor onEnter={startEnter} onDone={finishEnter} />
      )}
    </>
  )
}
