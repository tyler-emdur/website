'use client'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import HUD from '@/components/hud/HUD'
import GlitchOverlay from '@/components/universe/effects/GlitchOverlay'
import KonamiEgg from '@/components/universe/effects/KonamiEgg'
import HiddenTerminal from '@/components/universe/effects/HiddenTerminal'

const UniverseCanvas = dynamic(() => import('./UniverseCanvas'), { ssr: false })

export default function UniverseRoot() {
  useEffect(() => {
    document.body.style.background = '#00000d'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.background = ''
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', inset: 0, background: '#00000d' }}>
      <UniverseCanvas />
      <HUD />
      <GlitchOverlay />
      <KonamiEgg />
      <HiddenTerminal />
    </div>
  )
}
