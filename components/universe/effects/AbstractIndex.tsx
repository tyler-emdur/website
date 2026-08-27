'use client'
import { useEffect, useState } from 'react'
import { boulderClockWithSeconds } from '@/lib/environment'
import { getAllObjects, useUniverseStore } from '@/lib/universe-store'

// ─── THE SURVEY'S OWN NUMBERS ─────────────────────────────────────────────────
// This corner used to print a scattered pool of fifteen invented markers and a
// rotating pool of twelve invented status lines, over an object count that
// random-walked between 44 and 51 behind an [UNVERIFIED] tag. None of it was
// attached to anything. All of it is gone.
//
// What's left is what the store actually knows: how many objects have surfaced
// for you so far, how many you've opened, and what the survey therefore is.
// The count climbs on its own as the visit gets older and as you look at
// things, which is the one fact about this place worth printing.

function surveyState() {
  const all = getAllObjects()
  const { isVisible, discoveredIds } = useUniverseStore.getState()
  const inView = all.filter(isVisible).length
  return {
    inView,
    indexed: discoveredIds.length,
    complete: inView === all.length,
  }
}

export default function AbstractIndex() {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(() => boulderClockWithSeconds())
  const [survey, setSurvey] = useState(() => ({ inView: 0, indexed: 0, complete: false }))

  useEffect(() => {
    setMounted(true)
    setSurvey(surveyState())

    // The survey clock used to drift off a random seed, so the hub disagreed
    // with the hour every other world was showing — and the site is supposed to
    // be one place. It now reads real Boulder time, the same clock the surface
    // prints and the garage dash shows. The instrument is still unreliable; the
    // coordinate readout above glitches on its own schedule and carries that.
    const clockIv = setInterval(() => {
      setTime(boulderClockWithSeconds())
      setSurvey(surveyState()) // objects surface on a timer and on discovery
    }, 1000)

    return () => clearInterval(clockIv)
  }, [])

  if (!mounted) return null

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5 }}>

      {/* ── Corner terminal — bottom left ── */}
      {/* Name only appears as a single data field, never announced */}
      <div style={{
        position: 'fixed',
        bottom: 28,
        left: 28,
        fontFamily: 'monospace',
        fontSize: 9,
        letterSpacing: '0.14em',
        color: 'rgba(160,160,160,0.22)',
        lineHeight: 2,
        userSelect: 'none',
      }}>
        <div>SURVEY   TE-∅</div>
        <div>OPERATOR T.EMDUR</div>
        <div>OBJECTS  {survey.inView} IN VIEW</div>
        <div>INDEXED  {survey.indexed}</div>
        <div style={{ opacity: 0.7 }}>STATUS   {survey.indexed === 0 ? 'SURVEY NOT BEGUN' : survey.complete ? 'CATALOG COMPLETE' : 'CATALOG INCOMPLETE'}</div>
        <div style={{ opacity: 0.45 }}>SYNC     {time}</div>
      </div>

    </div>
  )
}
