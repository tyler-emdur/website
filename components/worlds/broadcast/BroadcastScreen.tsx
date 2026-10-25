'use client'
import { useEffect, useRef, useState } from 'react'
import type { BroadcastChannel, Reception } from '@/lib/broadcast/channels'
import { acquisitionFor, receptionFor, THIN_WINDOW } from '@/lib/broadcast/reception'
import { DUR, EASE, transition } from '@/lib/motion'
import Channel88 from './Channel88'

// Per-channel reception, layered on top of the shared CRT bezel effects the
// parent screen already applies. Which one a channel gets is no longer a
// decision anybody made by hand: `receptionFor` derives it from the bitrate,
// resolution and rung count the station's own HLS manifest declares. See
// lib/broadcast/reception.ts.
const RECEPTION_FILTER: Record<Reception, string> = {
  clean: 'none',
  grainy: 'contrast(1.05) saturate(0.85) brightness(0.97)',
  unstable: 'contrast(1.1) saturate(0.9)',
}

function ReceptionJitter({ reception, children }: { reception: Reception; children: React.ReactNode }) {
  const [nudge, setNudge] = useState(0)
  useEffect(() => {
    if (reception !== 'unstable') return
    let tid: ReturnType<typeof setTimeout>
    const sched = () => {
      tid = setTimeout(() => {
        setNudge(Math.random() * 6 - 3)
        setTimeout(() => setNudge(0), 90)
        sched()
      }, 2600 + Math.random() * 5000)
    }
    sched()
    return () => clearTimeout(tid)
  }, [reception])
  return (
    <div style={{
      position: 'absolute', inset: 0,
      filter: RECEPTION_FILTER[reception],
      transform: nudge ? `translateX(${nudge}px)` : undefined,
      transition: nudge ? 'none' : 'transform 0.12s ease',
    }}>
      {children}
    </div>
  )
}

function OffAirScreen({ city }: { city: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    const draw = () => {
      const W = c.offsetWidth || 320, H = c.offsetHeight || 240
      if (c.width !== W) c.width = W
      if (c.height !== H) c.height = H
      const img = ctx.createImageData(W, H)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() < 0.985 ? 0 : Math.random() * 40
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
      raf.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf.current)
  }, [])
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: 'clamp(8px,1.1vw,11px)', color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.2em', textAlign: 'center',
      }}>
        NO SIGNAL — {city}
      </div>
    </div>
  )
}

/**
 * What the set knows about the signal it is pulling in, while it pulls it in.
 *
 * Every number here is the station's own: the longest segment it will hand out,
 * how many of them it keeps at the live edge, and one mark for each segment that
 * has actually arrived. Nothing is paced by a timer — the reason
 * Taipei snaps on and Vientiane sits here for a few seconds is that Taipei cuts
 * its camera into one-second pieces and Vientiane into twelve-second ones, and
 * no player can make twelve seconds of video arrive in less than twelve
 * seconds' worth of encoding. Acquisition, not a swap.
 */
interface Acquisition {
  segmentSeconds: number | null
  windowSegments: number | null
  /** Segments that have arrived so far, counted from the player's own events. */
  fragments: number
}

function TuningScreen({ acq, reacquiring }: { acq: Acquisition; reacquiring?: boolean }) {
  const { segmentSeconds: seg, windowSegments: win } = acq
  const declared = [seg != null ? `SEG ${seg}s` : null, win != null ? `WINDOW ${win}` : null]
    .filter(Boolean).join('   ')
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '0.55em',
      fontFamily: 'monospace', fontSize: 'clamp(7px,1vw,9px)', color: 'rgba(255,255,255,0.35)',
      letterSpacing: '0.2em', textAlign: 'center',
      // Over a frozen picture the readout sits on smoked glass; from black it
      // is the whole screen.
      background: reacquiring ? 'rgba(0,0,0,0.72)' : '#000',
    }}>
      <div>{reacquiring ? 'RE-ACQUIRING' : 'TUNING…'}</div>
      {declared && <div style={{ opacity: 0.62 }}>{declared}</div>}
      {/* One mark per segment that has arrived. Empty until the first lands. */}
      <div style={{ minHeight: '1em', letterSpacing: '0.35em', opacity: 0.8 }}>
        {'▪'.repeat(Math.min(acq.fragments, 24))}
      </div>
      {win != null && win <= THIN_WINDOW && (
        <div style={{ opacity: 0.4 }}>THIN WINDOW</div>
      )}
    </div>
  )
}

function HlsChannel({ url, soundOn, onRequestSound, onAdvance, onDead }: {
  url: string; soundOn: boolean; onRequestSound: () => void; onAdvance: () => void; onDead: () => void
}) {
  const [live, setLive] = useState(false)
  // Set when the picture was running and the buffer ran out from under it — the
  // video's own `waiting` event, held for most of a second so a hiccup between
  // frames doesn't flash a readout over a working channel.
  const [reacquiring, setReacquiring] = useState(false)
  // What the last bake heard this exact feed declare, so the readout has
  // something true to print before the player has loaded anything. The live
  // manifest overwrites it the moment it arrives.
  const [acq, setAcq] = useState<Acquisition>(() => ({
    segmentSeconds: null, windowSegments: null, fragments: 0, ...acquisitionFor(url),
  }))
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDeadRef = useRef(onDead)
  useEffect(() => { onDeadRef.current = onDead }, [onDead])
  // Read inside player callbacks, which outlive any one render.
  const liveRef = useRef(false)
  const reacquiringRef = useRef(false)

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !soundOn
  }, [soundOn, live])

  useEffect(() => {
    setLive(false)
    liveRef.current = false
    setReacquiring(false)
    reacquiringRef.current = false
    setAcq({ segmentSeconds: null, windowSegments: null, fragments: 0, ...acquisitionFor(url) })
    const video = videoRef.current
    if (!video) return
    video.muted = !soundOn
    let cancelled = false
    let resolved = false
    let hls: import('hls.js').default | null = null

    const fail = () => { if (cancelled || resolved) return; resolved = true; onDeadRef.current() }
    const succeed = () => {
      if (cancelled || resolved) return
      resolved = true
      liveRef.current = true
      setLive(true)
    }

    // The buffer emptying under a running picture is the one thing the window
    // depth in the readout predicts, so when it happens the set says so instead
    // of showing a frozen frame and pretending.
    let stallTimer: ReturnType<typeof setTimeout> | undefined
    const onWaiting = () => {
      if (!liveRef.current || reacquiringRef.current) return
      clearTimeout(stallTimer)
      stallTimer = setTimeout(() => {
        reacquiringRef.current = true
        setReacquiring(true)
        setAcq(a => ({ ...a, fragments: 0 })) // count this fill, not the last one
      }, 800)
    }
    const onResume = () => {
      clearTimeout(stallTimer)
      if (!reacquiringRef.current) return
      reacquiringRef.current = false
      setReacquiring(false)
    }
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onResume)

    // Two tuning deadlines: a short one for streams where nothing happens at
    // all, and a long one for streams that are demonstrably alive but slow —
    // some of these stations serve 10-second segments from the far side of
    // the world, and the first one can take longer than 9s to arrive.
    let timer = setTimeout(fail, 9000)
    let extended = false
    const stillTrying = () => {
      if (extended || resolved || cancelled) return
      extended = true
      clearTimeout(timer)
      timer = setTimeout(fail, 30000)
    }

    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return
      if (Hls.isSupported()) {
        hls = new Hls({ maxBufferLength: 15 })
        hls.loadSource(url)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) fail() })
        hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
          stillTrying()
          // The live manifest, which outranks the baked copy: this is the rung
          // the player actually picked up, as it is right now.
          setAcq(a => ({
            ...a,
            segmentSeconds: data.details?.targetduration ?? a.segmentSeconds,
            windowSegments: data.details?.fragments?.length ?? a.windowSegments,
          }))
        })
        // Counted on arrival rather than on buffer append: the element starts
        // playing the moment there is anything to play, which is *before*
        // hls.js finishes appending the first segment, so counting the appends
        // hid every mark behind a picture that was already up.
        //
        // Only while the readout is on screen — once the picture is there, the
        // marks have nothing left to report and the counting stops.
        hls.on(Hls.Events.FRAG_LOADED, () => {
          if (liveRef.current && !reacquiringRef.current) return
          setAcq(a => ({ ...a, fragments: a.fragments + 1 }))
        })
        // hls.js attaches the stream via MediaSource, which doesn't reliably
        // trigger the <video autoplay> heuristic on its own — without an
        // explicit play() call the element just sits fully buffered and
        // paused, and 'playing' never fires.
        hls.on(Hls.Events.MEDIA_ATTACHED, () => { video.play().catch(() => {}) })
        video.addEventListener('playing', succeed, { once: true })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
        video.addEventListener('loadedmetadata', stillTrying, { once: true })
        video.addEventListener('playing', succeed, { once: true })
        video.addEventListener('error', fail, { once: true })
        video.play().catch(() => {})
      } else {
        fail()
      }
    }).catch(fail)

    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(stallTimer)
      video.removeEventListener('playing', succeed)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onResume)
      hls?.destroy()
    }
  }, [url])

  return (
    <div onClick={() => (soundOn ? onAdvance() : onRequestSound())} style={{ position: 'relative', width: '100%', height: '100%', background: '#000', cursor: 'pointer' }}>
      <video ref={videoRef} autoPlay muted={!soundOn} playsInline style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        opacity: live ? 1 : 0, transition: transition('opacity', DUR.move, EASE.enter),
      }} />
      {(!live || reacquiring) && <TuningScreen acq={acq} reacquiring={reacquiring} />}
    </div>
  )
}

interface Props {
  channel: BroadcastChannel
  live: boolean // server-checked status; ignored for 'custom'
  preferredUrl?: string // server-picked feed for this slot (primary or a live backup)
  soundOn: boolean
  onRequestSound: () => void
  onAdvance: () => void
  onDead: () => void
  onSignalCut?: () => void
}

export default function BroadcastScreen({ channel, live, preferredUrl, soundOn, onRequestSound, onAdvance, onDead, onSignalCut }: Props) {
  // The slot's full cascade, with whatever the server vouched for moved to the
  // front. If the player still dies, fall through the rest before going dark.
  const allUrls = channel.kind === 'hls' && channel.hlsUrl ? [channel.hlsUrl, ...(channel.altHlsUrls ?? [])] : []
  const urls = preferredUrl && allUrls.includes(preferredUrl)
    ? [preferredUrl, ...allUrls.filter(u => u !== preferredUrl)]
    : allUrls
  const [urlIdx, setUrlIdx] = useState(0)

  if (channel.kind === 'custom') {
    return <Channel88 onCut={onSignalCut} />
  }

  if (!live || urlIdx >= urls.length) {
    return <OffAirScreen city={channel.city} />
  }

  return (
    <ReceptionJitter reception={receptionFor(channel)}>
      <HlsChannel
        url={urls[urlIdx]}
        soundOn={soundOn}
        onRequestSound={onRequestSound}
        onAdvance={onAdvance}
        onDead={() => {
          if (urlIdx < urls.length - 1) setUrlIdx(i => i + 1) // next feed, same city
          else onDead()
        }}
      />
    </ReceptionJitter>
  )
}
