'use client'
import { useEffect, useState } from 'react'
import WorldManager from '@/components/worlds/WorldManager'
import FrontDoor from '@/components/FrontDoor'

export default function Home() {
  const [showFrontDoor, setShowFrontDoor] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      setShowFrontDoor(sessionStorage.getItem('te-front-door-seen') !== '1')
    } catch {
      setShowFrontDoor(false)
    }
  }, [])

  const dismiss = () => {
    try { sessionStorage.setItem('te-front-door-seen', '1') } catch {}
    setShowFrontDoor(false)
  }

  if (showFrontDoor === null) return null
  if (showFrontDoor) return <FrontDoor onEnter={dismiss} />
  return <WorldManager />
}
