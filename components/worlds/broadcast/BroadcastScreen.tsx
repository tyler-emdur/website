'use client'
import { useEffect, useRef, useState } from 'react'
import type { BroadcastChannel, Reception } from '@/lib/broadcast/channels'
import Channel88 from './Channel88'

// Per-channel "reception" flavor — small, cheap visual variance so the six
// real channels don't all look like the same clean feed. Layered on top of
// the shared CRT bezel effects the parent screen already applies.
const RECEPTION_FILTER: Record<Reception, string> = {
  clean: 'none',
  grainy: 'contrast(1.05) saturate(0.85) brightness(0.97)',
  unstable: 'contrast(1.1) saturate(0.9)',
  chaotic: 'contrast(1.18) saturate(1.25)',
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

function TuningScreen() {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', fontSize: 'clamp(7px,1vw,9px)', color: 'rgba(255,255,255,0.35)',
      letterSpacing: '0.2em', background: '#000',
    }}>
      TUNING…
    </div>
  )
}

function HlsChannel({ url, soundOn, onRequestSound, onAdvance, onDead }: {
  url: string; soundOn: boolean; onRequestSound: () => void; onAdvance: () => void; onDead: () => void
}) {
  const [live, setLive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDeadRef = useRef(onDead)
  useEffect(() => { onDeadRef.current = onDead }, [onDead])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !soundOn
  }, [soundOn, live])

  useEffect(() => {
    setLive(false)
    const video = videoRef.current
    if (!video) return
    video.muted = !soundOn
    let cancelled = false
    let resolved = false
    let hls: import('hls.js').default | null = null

    const fail = () => { if (cancelled || resolved) return; resolved = true; onDeadRef.current() }
    const succeed = () => { if (cancelled || resolved) return; resolved = true; setLive(true) }

    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return
      if (Hls.isSupported()) {
        hls = new Hls({ maxBufferLength: 15 })
        hls.loadSource(url)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) fail() })
        // hls.js attaches the stream via MediaSource, which doesn't reliably
        // trigger the <video autoplay> heuristic on its own — without an
        // explicit play() call the element just sits fully buffered and
        // paused, and 'playing' never fires.
        hls.on(Hls.Events.MEDIA_ATTACHED, () => { video.play().catch(() => {}) })
        video.addEventListener('playing', succeed, { once: true })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
        video.addEventListener('playing', succeed, { once: true })
        video.addEventListener('error', fail, { once: true })
        video.play().catch(() => {})
      } else {
        fail()
      }
    }).catch(fail)

    const timeout = setTimeout(fail, 9000)
    return () => {
      cancelled = true
      clearTimeout(timeout)
      video.removeEventListener('playing', succeed)
      hls?.destroy()
    }
  }, [url])

  return (
    <div onClick={() => (soundOn ? onAdvance() : onRequestSound())} style={{ position: 'relative', width: '100%', height: '100%', background: '#000', cursor: 'pointer' }}>
      <video ref={videoRef} autoPlay muted={!soundOn} playsInline style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        opacity: live ? 1 : 0, transition: 'opacity 0.3s ease',
      }} />
      {!live && <TuningScreen />}
    </div>
  )
}

interface Props {
  channel: BroadcastChannel
  live: boolean // server-checked status; ignored for 'custom'
  soundOn: boolean
  onRequestSound: () => void
  onAdvance: () => void
  onDead: () => void
  onSignalCut?: () => void
}

export default function BroadcastScreen({ channel, live, soundOn, onRequestSound, onAdvance, onDead, onSignalCut }: Props) {
  if (channel.kind === 'custom') {
    return <Channel88 onCut={onSignalCut} />
  }

  if (!live) {
    return <OffAirScreen city={channel.city} />
  }

  return (
    <ReceptionJitter reception={channel.reception}>
      <HlsChannel url={channel.hlsUrl!} soundOn={soundOn} onRequestSound={onRequestSound} onAdvance={onAdvance} onDead={onDead} />
    </ReceptionJitter>
  )
}
