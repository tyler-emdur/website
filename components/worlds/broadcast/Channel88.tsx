'use client'
import { useEffect, useRef, useState } from 'react'
import { useWorldStore, WORLD_IDS, type WorldId } from '@/lib/world-store'
import { CHANNELS } from '@/lib/broadcast/channels'

// ── Channel 88 — a signal that should not exist ──────────────────────────────
// Not a stream. Nothing here is fetched. It's a fixed loop of static and
// short, unsettling cards — some fixed lore, some pulled live from the
// visitor's own progress through the site (worlds seen, secrets found) — cut
// together like a tape someone recorded over the real channels by accident.

const WORLD_LABEL: Record<WorldId, string> = {
  0: 'SURFACE', 1: 'UNIVERSE', 2: 'TRACE', 3: 'BROADCAST',
  5: 'MACHINE', 6: 'GARAGE', 7: 'ENDPOINT', 9: 'ANSWERING', 14: 'AISLE',
}

const OTHER_CHANNEL_COUNT = CHANNELS.filter(c => c.kind !== 'custom').length

const STRANGE_MESSAGES = [
  `IT WATCHES THE OTHER ${OTHER_CHANNEL_COUNT}.\nIT HAS BEEN WATCHING SINCE BEFORE YOU ARRIVED.`,
  'SOMEONE IN BOULDER IS STILL AWAKE.\nTHIS IS WHAT THAT LOOKS LIKE FROM HERE.',
  'YOU ARE NOT SUPPOSED TO BE ABLE TO TUNE THIS IN.',
  `THE OTHER ${OTHER_CHANNEL_COUNT} ARE REAL. THIS ONE IS NOT SUPPOSED TO BE.`,
]

const FLASH_CITIES = CHANNELS.filter(c => c.kind !== 'custom').map(c => c.city)

type Card =
  | { kind: 'static' }
  | { kind: 'coords' }
  | { kind: 'world4' }
  | { kind: 'log' }
  | { kind: 'hint' }
  | { kind: 'message' }
  | { kind: 'flash' }

// ── heavy VHS noise + tracking bar + dropout flicker ─────────────────────────
function VHSNoise() {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  const trackY = useRef(-20)

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    const draw = () => {
      const W = c.offsetWidth || 320, H = c.offsetHeight || 240
      if (c.width !== W) c.width = W
      if (c.height !== H) c.height = H
      const img = ctx.createImageData(W, H)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 90 + 8
        img.data[i] = v * 0.85; img.data[i + 1] = v; img.data[i + 2] = v * 0.9
        img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)

      // slow-rolling tracking distortion band
      trackY.current += 1.4
      if (trackY.current > H + 20) trackY.current = -20
      ctx.fillStyle = 'rgba(255,255,255,0.10)'
      ctx.fillRect(0, trackY.current, W, 6)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(0, trackY.current + 6, W, 2)

      // rare dropout flicker
      if (Math.random() < 0.015) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fillRect(0, Math.random() * H, W, Math.random() * 10 + 2)
      }
      raf.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return (
    <canvas ref={ref} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      filter: 'contrast(1.15) saturate(1.3)',
    }} />
  )
}

function CardText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '10%', fontFamily: 'monospace', gap: 6,
      textShadow: '0 0 8px rgba(255,255,255,0.5), 2px 0 rgba(255,0,60,0.4), -2px 0 rgba(0,200,255,0.4)',
      whiteSpace: 'pre-line',
    }}>
      {children}
    </div>
  )
}

export default function Channel88({ onCut }: { onCut?: () => void }) {
  const visited = useWorldStore(s => s.visited)
  const secretsFound = useWorldStore(s => s.secretsFound)
  const [card, setCard] = useState<Card>({ kind: 'static' })
  const messageRef = useRef(STRANGE_MESSAGES[Math.floor(Math.random() * STRANGE_MESSAGES.length)])
  const flashCityRef = useRef(FLASH_CITIES[Math.floor(Math.random() * FLASH_CITIES.length)])

  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>
    // fixed beats, so regulars start to recognize the loop, with irregular
    // durations and an occasional extra static break so it never feels
    // metronomic.
    const sequence: { card: Card; dur: number }[] = [
      { card: { kind: 'static' }, dur: 2200 },
      { card: { kind: 'coords' }, dur: 3600 },
      { card: { kind: 'static' }, dur: 900 },
      { card: { kind: 'world4' }, dur: 4200 },
      { card: { kind: 'log' }, dur: 4000 },
      { card: { kind: 'hint' }, dur: 3800 },
      { card: { kind: 'static' }, dur: 1200 },
      { card: { kind: 'message' }, dur: 4400 },
      { card: { kind: 'static' }, dur: 1800 },
    ]
    // rare intrusion: a single frame that looks like it belongs to another channel
    if (Math.random() < 0.35) {
      sequence.splice(2 + Math.floor(Math.random() * 4), 0, { card: { kind: 'flash' }, dur: 260 })
    }

    let i = 0
    const step = () => {
      const entry = sequence[i % sequence.length]
      if (entry.card.kind !== 'static') {
        messageRef.current = STRANGE_MESSAGES[Math.floor(Math.random() * STRANGE_MESSAGES.length)]
        flashCityRef.current = FLASH_CITIES[Math.floor(Math.random() * FLASH_CITIES.length)]
        onCut?.()
      }
      setCard(entry.card)
      i++
      tid = setTimeout(step, entry.dur)
    }
    step()
    return () => clearTimeout(tid)
  }, [onCut])

  const unvisited = WORLD_IDS.filter(id => !visited.includes(id))

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      <VHSNoise />

      {card.kind === 'coords' && (
        <CardText>
          <div style={{ fontSize: 'clamp(11px,1.8vw,16px)', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em' }}>
            40.0150°N 105.2705°W
          </div>
          <div style={{ fontSize: 'clamp(8px,1.2vw,11px)', color: 'rgba(180,255,220,0.6)', letterSpacing: '0.25em' }}>
            SURVEY TE-∅
          </div>
        </CardText>
      )}

      {card.kind === 'world4' && (
        <CardText>
          <div style={{ fontSize: 'clamp(9px,1.3vw,12px)', color: 'rgba(255,140,140,0.75)', letterSpacing: '0.15em' }}>
            CH_04 — [ SIGNAL NOT FOUND ]
          </div>
          <div style={{ fontSize: 'clamp(10px,1.5vw,14px)', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em', marginTop: 8 }}>
            THERE IS NO WORLD 4.
          </div>
          <div style={{ fontSize: 'clamp(7px,1vw,9px)', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>
            there has never been a world 4.
          </div>
        </CardText>
      )}

      {card.kind === 'log' && (
        <CardText>
          <div style={{ fontSize: 'clamp(8px,1.1vw,10px)', color: 'rgba(150,220,255,0.6)', letterSpacing: '0.25em' }}>
            VISITOR LOG
          </div>
          <div style={{ fontSize: 'clamp(10px,1.5vw,14px)', color: 'rgba(255,255,255,0.85)' }}>
            {visited.length}/{WORLD_IDS.length} WORLDS SEEN
          </div>
          <div style={{ fontSize: 'clamp(9px,1.2vw,12px)', color: 'rgba(255,255,255,0.6)' }}>
            {secretsFound.length > 0 ? `${secretsFound.length} SECRET${secretsFound.length === 1 ? '' : 'S'} RECOVERED` : 'NOTHING FOUND YET.'}
          </div>
        </CardText>
      )}

      {card.kind === 'hint' && (
        <CardText>
          {unvisited.length > 0 ? (
            <>
              <div style={{ fontSize: 'clamp(8px,1.1vw,10px)', color: 'rgba(255,220,150,0.6)', letterSpacing: '0.2em' }}>
                SIGNAL ALSO DETECTED AT
              </div>
              <div style={{ fontSize: 'clamp(9px,1.3vw,12px)', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>
                {unvisited.slice(0, 2).map(id => `[ WORLD ${id} — ${WORLD_LABEL[id]} ]`).join('\n')}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 'clamp(9px,1.3vw,12px)', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em' }}>
              ALL SIGNALS ACCOUNTED FOR.
              <br />
              <span style={{ fontSize: '0.8em', opacity: 0.6 }}>that you know of.</span>
            </div>
          )}
        </CardText>
      )}

      {card.kind === 'message' && (
        <CardText>
          <div style={{ fontSize: 'clamp(9px,1.3vw,12px)', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.06em', lineHeight: 1.7 }}>
            {messageRef.current}
          </div>
        </CardText>
      )}

      {card.kind === 'flash' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#000', fontFamily: 'monospace', fontSize: 'clamp(11px,1.8vw,16px)',
          color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2em',
        }}>
          {flashCityRef.current}
        </div>
      )}

      <div style={{
        position: 'absolute', top: 6, left: 8, fontFamily: 'monospace', fontSize: 'clamp(6px,0.85vw,8px)',
        color: 'rgba(255,80,80,0.5)', letterSpacing: '0.15em',
      }}>
        ● UNIDENTIFIED SOURCE
      </div>
    </div>
  )
}
