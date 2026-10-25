'use client'
import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import HUD from '@/components/hud/HUD'
import GlitchOverlay from '@/components/universe/effects/GlitchOverlay'
import KonamiEgg from '@/components/universe/effects/KonamiEgg'
import HiddenTerminal from '@/components/universe/effects/HiddenTerminal'
import AbstractIndex from '@/components/universe/effects/AbstractIndex'
import PortalDirectory from '@/components/universe/effects/PortalDirectory'
import NullDescent from '@/components/universe/effects/NullDescent'
import SurveyBoot, { PATIENCE, type BootPhase } from '@/components/universe/effects/SurveyBoot'

const UniverseCanvas = dynamic(() => import('./UniverseCanvas'), { ssr: false })

export default function UniverseRoot() {
  // `code` → `renderer` → `ready`. Both transitions are driven by a real
  // milestone inside the canvas rather than a timer, so the panel leaves when
  // there is genuinely something behind it. See SurveyBoot for why this exists.
  const [phase, setPhase] = useState<BootPhase>('code')
  const [stalled, setStalled] = useState(false)

  // Stable identities: `SceneReady` runs its effect on `onReady` changing, so a
  // fresh closure each render would re-fire it every frame of the hub's life.
  const onRenderer = useCallback(() => setPhase(p => (p === 'code' ? 'renderer' : p)), [])
  const onScene = useCallback(() => setPhase('ready'), [])

  // Slow and broken look identical from here, so we only claim the difference
  // once waiting has stopped being a reasonable explanation for the wait.
  useEffect(() => {
    if (phase === 'ready') return
    const id = setTimeout(() => setStalled(true), PATIENCE)
    return () => clearTimeout(id)
  }, [phase])

  // ── why the overlays wait ──────────────────────────────────────────────────
  // The seven layers below are plain DOM and would happily paint over an empty
  // canvas: the corner terminal would print OBJECTS 0 IN VIEW, and the glitch
  // layer would start muttering, before there was anything to be in view of or
  // to glitch. Holding them until the renderer exists is the difference between
  // a boot and a pile of HUD on black.
  //
  // It also keeps the boot panel on top without a z-index arms race: these
  // layers climb to 150, and nothing that isn't mounted needs stacking over.
  // (The scene's own drei `<Html>` labels are a separate problem with a
  // separate answer — see ABOVE_THE_SCENE in SurveyBoot.)
  //
  // `stalled` is the exception, and it is the important one: if the renderer
  // never arrives, the panel tells the visitor the gate index still works, and
  // the gate index had better be on screen when it does.
  const chrome = phase !== 'code' || stalled

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
      <UniverseCanvas onRenderer={onRenderer} onScene={onScene} />
      {chrome && (
        <>
          <AbstractIndex />
          <PortalDirectory />
          <HUD />
          <GlitchOverlay />
          <KonamiEgg />
          <HiddenTerminal />
          <NullDescent />
        </>
      )}
      <SurveyBoot phase={phase} stalled={stalled} />
    </div>
  )
}
