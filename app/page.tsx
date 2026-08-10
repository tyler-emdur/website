'use client'
import { useEffect, useState } from 'react'
import FrontDoor from '@/components/FrontDoor'
import { IDENTITY } from '@/lib/identity'
import { pathForWorld } from '@/lib/worlds'

// "/" is the front door and nothing else. The worlds render from the root
// layout, so World 0 is already live underneath this screen — which is what
// lets the entrance animation unmask onto a real scene rather than a remount.

// Which screen comes first depends on sessionStorage, which only exists after
// hydration — so there is always at least one frame where the answer isn't
// known yet. Rendering nothing there means a slow connection gets a blank white
// page as its first impression. This lays down the same black ground the front
// door and every world sit on, so the load reads as the site arriving rather
// than as a page that failed. The name is dim on purpose: it identifies the
// site without competing with the front door's own name, which fades up over
// this a beat later.
function Holding() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed', inset: 0, zIndex: 9990, display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: '#000000',
        fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)',
      }}
    >
      {IDENTITY.name}
    </div>
  )
}

export default function Home() {
  const [phase, setPhase] = useState<'loading' | 'front-door' | 'entering' | 'world'>('loading')

  useEffect(() => {
    try {
      setPhase(sessionStorage.getItem('te-front-door-seen') !== '1' ? 'front-door' : 'world')
    } catch {
      setPhase('world')
    }
  }, [])

  // Once the door is behind us, "/" hands the address bar back to the world.
  useEffect(() => {
    if (phase !== 'world') return
    if (window.location.pathname !== '/') return
    window.history.replaceState(null, '', pathForWorld(0))
  }, [phase])

  const startEnter = () => {
    try { sessionStorage.setItem('te-front-door-seen', '1') } catch {}
    setPhase('entering')
  }

  const finishEnter = () => setPhase('world')

  if (phase === 'loading') return <Holding />
  if (phase === 'world') return null
  return <FrontDoor onEnter={startEnter} onDone={finishEnter} />
}
