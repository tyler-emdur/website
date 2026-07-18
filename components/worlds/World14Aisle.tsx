'use client'
import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import HomeButton from './HomeButton'
import { useWorldStore } from '@/lib/world-store'
import { getSlot, getSpecial, loadBasket, addToBasket, type BasketEntry } from './aisle-data'

const AisleCanvas = dynamic(() => import('./AisleCanvas'), { ssr: false })

// ── Fluorescent buzz: the sound of the backrooms ─────────────────────────────
// A mains hum + the harsh harmonic whine of failing fluorescent tubes, with
// intermittent crackle and — occasionally — a total drop to dead silence. Gets
// worse the deeper you walk. Starts on the first input (autoplay policy).
class AisleAmbience {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private buzzGain: GainNode | null = null
  private nodes: (OscillatorNode | AudioBufferSourceNode)[] = []
  private depth = 0
  private running = false
  private crackleTimer: ReturnType<typeof setTimeout> | null = null

  start() {
    if (this.running) return
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.0001
      this.master.connect(this.ctx.destination)
      this.master.gain.exponentialRampToValueAtTime(0.55, this.ctx.currentTime + 2)

      this.buzzGain = this.ctx.createGain()
      this.buzzGain.gain.value = 0.5
      this.buzzGain.connect(this.master)

      const hum = (f: number, g: number, type: OscillatorType) => {
        const o = this.ctx!.createOscillator()
        o.type = type; o.frequency.value = f
        const gain = this.ctx!.createGain(); gain.gain.value = g
        o.connect(gain).connect(this.buzzGain!)
        o.start(); this.nodes.push(o)
      }
      hum(60, 0.05, 'sine')       // mains
      hum(120, 0.05, 'sawtooth')  // the ugly harmonic of a dying tube
      hum(180, 0.018, 'sawtooth')
      // a thin high whine, filtered
      const o = this.ctx.createOscillator()
      o.type = 'square'; o.frequency.value = 7200
      const wf = this.ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 7200; wf.Q.value = 6
      const wg = this.ctx.createGain(); wg.gain.value = 0.006
      o.connect(wf).connect(wg).connect(this.buzzGain)
      o.start(); this.nodes.push(o)

      this.scheduleCrackle()
      this.running = true
    } catch { /* silent */ }
  }

  private scheduleCrackle() {
    if (!this.ctx) return
    // deeper = more frequent crackle + occasional dead-silence dropout
    const gap = 2600 - this.depth * 1900 + Math.random() * 2500
    this.crackleTimer = setTimeout(() => {
      if (!this.ctx || !this.buzzGain) return
      const t = this.ctx.currentTime
      if (Math.random() < 0.25 + this.depth * 0.4) {
        // power dip → dead silence → snap back
        this.buzzGain.gain.cancelScheduledValues(t)
        this.buzzGain.gain.setValueAtTime(this.buzzGain.gain.value, t)
        this.buzzGain.gain.linearRampToValueAtTime(0.0001, t + 0.04)
        this.buzzGain.gain.setValueAtTime(0.0001, t + 0.1 + Math.random() * 0.5)
        this.buzzGain.gain.linearRampToValueAtTime(0.5, t + 0.7 + Math.random() * 0.6)
      } else {
        // a crackle
        const len = this.ctx.sampleRate * 0.08
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
        const src = this.ctx.createBufferSource(); src.buffer = buf
        const g = this.ctx.createGain(); g.gain.value = 0.12 + this.depth * 0.12
        src.connect(g).connect(this.master!)
        src.start(t); src.stop(t + 0.1)
      }
      this.scheduleCrackle()
    }, Math.max(500, gap))
  }

  setDepth(d: number) { this.depth = Math.max(0, Math.min(1, d)) }

  stop() {
    try {
      if (this.crackleTimer) clearTimeout(this.crackleTimer)
      this.nodes.forEach(n => { try { n.stop() } catch {} })
      this.ctx?.close()
    } catch {}
    this.ctx = null; this.nodes = []; this.running = false
  }
}

// how "deep/dark" a given item index is — mirrors zoneAt().dark in AisleCanvas
function darkAt(idx: number) {
  const t = Math.max(0, Math.min(1, (idx - 105) / 50))
  return t * t * (3 - 2 * t)
}

// PA announcements fire once as you pass each depth. Deadpan. The store knows.
const PA_LINES: { at: number; text: string }[] = [
  { at: 20, text: 'attention shoppers: the store closes in ten minutes. it has been closing for some time now.' },
  { at: 55, text: 'cleanup on aisle 14. cleanup on aisle 14. take your time.' },
  { at: 74, text: 'notice: some aisle contents may repeat. this is normal. this is normal.' },
  { at: 90, text: 'attention shoppers: restocking does not reach this far. items past this point are sold as-is.' },
  { at: 125, text: 'if you can still hear this announcement, you are past the part of the store we have maps for.' },
  { at: 142, text: 'please do not look behind you. there is nothing there. that is the problem.' },
  { at: 160, text: 'the exit sign ahead is real. the exit is not. thank you for shopping with us.' },
  { at: 220, text: 'the front of the store is exactly where you left it. this has always been true.' },
  { at: 300, text: 'attention. attention. never mind.' },
]

export default function World14Aisle() {
  const store = useWorldStore()
  const [centerIndex, setCenterIndex] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)
  const [basket, setBasket] = useState<BasketEntry[]>([])
  const [taken, setTaken] = useState<string | null>(null)
  const [pa, setPa] = useState<string | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const enteredAt = useRef(Date.now())
  const foundGemsRef = useRef<Set<string>>(new Set())
  const paFiredRef = useRef<Set<number>>(new Set())
  const paTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ambienceRef = useRef<AisleAmbience | null>(null)

  const startAmbience = useCallback(() => {
    if (!ambienceRef.current) { ambienceRef.current = new AisleAmbience(); ambienceRef.current.start() }
  }, [])

  const special = useMemo(() => getSpecial(), [])
  const currentSlot = useMemo(() => getSlot(Math.max(0, centerIndex)), [centerIndex])

  useEffect(() => { setBasket(loadBasket()) }, [])

  useEffect(() => {
    for (const line of PA_LINES) {
      if (centerIndex >= line.at && !paFiredRef.current.has(line.at)) {
        paFiredRef.current.add(line.at)
        setPa(line.text)
        if (paTimerRef.current) clearTimeout(paTimerRef.current)
        paTimerRef.current = setTimeout(() => setPa(null), 8000)
      }
    }
  }, [centerIndex])

  useEffect(() => () => { if (paTimerRef.current) clearTimeout(paTimerRef.current) }, [])

  useEffect(() => {
    if (currentSlot.kind === 'gem' && currentSlot.gemKey && !foundGemsRef.current.has(currentSlot.gemKey)) {
      foundGemsRef.current.add(currentSlot.gemKey)
      store.findSecret(`aisle-${currentSlot.gemKey}`)
    }
  }, [currentSlot, store])

  const takeItem = useCallback(() => {
    if (currentSlot.kind === 'junk') return
    const next = addToBasket({ label: currentSlot.label, price: currentSlot.price ?? '—', at: Date.now() })
    if (next.length !== basket.length) {
      setBasket(next)
      setTaken(currentSlot.label)
      if (currentSlot.kind === 'special') store.findSecret('aisle-managers-special')
      if (next.length >= 10) store.findSecret('aisle-full-basket')
    }
  }, [currentSlot, basket.length, store])

  const checkout = useCallback(() => {
    setShowReceipt(true)
    store.findSecret('aisle-checked-out')
  }, [store])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowReceipt(false); return }
      setHasMoved(true); startAmbience()
      if (e.key.toLowerCase() === 'e') takeItem()
      if (e.key.toLowerCase() === 'c') checkout()
    }
    const onWheel = () => { setHasMoved(true); startAmbience() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
    }
  }, [takeItem, startAmbience, checkout])

  // the buzz worsens the deeper you walk
  useEffect(() => { ambienceRef.current?.setDepth(darkAt(centerIndex)) }, [centerIndex])
  useEffect(() => () => { ambienceRef.current?.stop() }, [])

  useEffect(() => {
    if (!taken) return
    const t = setTimeout(() => setTaken(null), 2600)
    return () => clearTimeout(t)
  }, [taken])

  const inBasket = basket.some(b => b.label === currentSlot.label)
  const accent = currentSlot.kind === 'gem' ? '#F472B6' : currentSlot.kind === 'special' ? '#F6C66A' : '#e6e6ea'

  return (
    <div data-world="14" style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0b0b10' }}>
      <HomeButton />

      {/* liminal film grain — static, always there like a bad photograph */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none', opacity: 0.07, mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />
      {/* vignette that closes in the deeper you go */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none',
        background: `radial-gradient(ellipse 78% 74% at 50% 46%, transparent ${52 - darkAt(centerIndex) * 26}%, rgba(0,0,0,${0.5 + darkAt(centerIndex) * 0.42}) 100%)`,
        transition: 'background 0.6s ease',
      }} />

      <div style={{
        position: 'fixed', top: 20, left: 24, zIndex: 20, fontFamily: '"Space Mono", monospace',
        color: 'rgba(255,255,255,0.55)',
      }}>
        <div style={{ fontSize: 13, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
          The Endless Aisle
        </div>
        <div style={{ fontSize: 9, marginTop: 4 }}>
          ITEM {String(centerIndex).padStart(5, '0')} · KEEP WALKING
        </div>
        <div style={{ fontSize: 8, marginTop: 10, color: 'rgba(246,198,106,0.65)', maxWidth: 220, lineHeight: 1.7 }}>
          ★ TODAY&apos;S MANAGER&apos;S SPECIAL<br />
          {special.item.label}<br />
          <span style={{ color: 'rgba(246,198,106,0.4)' }}>somewhere near position #{special.index}</span>
        </div>
      </div>

      {/* basket */}
      <div style={{
        position: 'fixed', top: 20, right: 24, zIndex: 20, fontFamily: '"Space Mono", monospace',
        textAlign: 'right', color: 'rgba(255,255,255,0.55)',
      }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em' }}>BASKET: {basket.length}</div>
        <div style={{ fontSize: 8, marginTop: 3, color: 'rgba(255,255,255,0.3)' }}>
          {basket.length === 0 ? 'empty. everything is technically free.' : 'running total: incalculable'}
        </div>
        <div
          onClick={checkout}
          style={{
            fontSize: 8, marginTop: 8, letterSpacing: '0.15em', cursor: 'pointer', display: 'inline-block',
            color: 'rgba(246,198,106,0.8)', border: '1px solid rgba(246,198,106,0.3)',
            padding: '5px 9px', background: 'rgba(6,6,10,0.6)',
          }}
        >
          ◇ CHECK OUT · [C]
        </div>
      </div>

      {taken && (
        <div style={{
          position: 'fixed', top: 74, right: 24, zIndex: 21, fontFamily: '"Space Mono", monospace',
          fontSize: 9, letterSpacing: '0.1em', color: '#F6C66A',
          background: 'rgba(6,6,10,0.85)', border: '1px solid rgba(246,198,106,0.35)',
          padding: '8px 12px', maxWidth: 240,
        }}>
          ◆ in the basket — {taken}
        </div>
      )}

      {/* PA system */}
      {pa && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 22,
          fontFamily: '"Space Mono", monospace', fontSize: 10, letterSpacing: '0.22em',
          color: 'rgba(255,244,214,0.75)', textTransform: 'uppercase', textAlign: 'center',
          maxWidth: 560, lineHeight: 2, padding: '10px 18px',
          textShadow: '0 0 14px rgba(255,244,214,0.25)',
          animation: 'aisle-pa 8s ease forwards', pointerEvents: 'none',
        }}>
          ((( {pa} )))
        </div>
      )}
      <style>{`
        @keyframes aisle-pa {
          0% { opacity: 0 }
          6% { opacity: 1 }
          85% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>

      {!hasMoved && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 20,
          fontFamily: '"Space Mono", monospace', color: 'rgba(255,255,255,0.85)', fontSize: 11,
          letterSpacing: '0.15em', textAlign: 'center', pointerEvents: 'none', lineHeight: 2.2,
          background: 'rgba(6,6,10,0.55)', padding: '14px 22px', backdropFilter: 'blur(4px)',
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
        }}>
          W / S · ↑ / ↓ · scroll &nbsp;—&nbsp; walk the aisle<br />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
            move the mouse to look · E — take an item<br />
            hold SHIFT to look behind you
          </span>
        </div>
      )}

      {/* shelf tag for the item you're standing at */}
      <div style={{
        position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 20,
        width: 440, maxWidth: 'calc(100vw - 48px)', background: 'rgba(6,6,10,0.85)',
        border: `1px solid ${currentSlot.kind === 'gem' ? 'rgba(244,114,182,0.5)' : currentSlot.kind === 'special' ? 'rgba(246,198,106,0.6)' : 'rgba(255,255,255,0.15)'}`,
        backdropFilter: 'blur(8px)', padding: '10px 16px', fontFamily: '"Space Mono", monospace',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: accent }}>
            {currentSlot.label}
          </div>
          {currentSlot.price && (
            <div style={{ fontSize: 10, color: currentSlot.kind === 'special' ? '#F6C66A' : 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
              {currentSlot.price}
            </div>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.5 }}>
          {currentSlot.flavor}
        </div>
        {currentSlot.kind !== 'junk' && (
          <div
            onClick={takeItem}
            style={{
              fontSize: 8, marginTop: 6, letterSpacing: '0.15em', cursor: inBasket ? 'default' : 'pointer',
              color: inBasket ? 'rgba(246,198,106,0.5)' : 'rgba(255,255,255,0.35)',
            }}
          >
            {inBasket ? '◆ IN YOUR BASKET' : '[E] TAKE IT'}
          </div>
        )}
      </div>

      {showReceipt && (
        <Receipt
          basket={basket}
          depth={centerIndex}
          enteredAt={enteredAt.current}
          onClose={() => setShowReceipt(false)}
        />
      )}

      <AisleCanvas onCenterIndexChange={setCenterIndex} />
    </div>
  )
}

// ── the receipt — the only proof you ever came in ────────────────────────────
function fmtElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

function Receipt({ basket, depth, enteredAt, onClose }: {
  basket: BasketEntry[]
  depth: number
  enteredAt: number
  onClose: () => void
}) {
  const now = new Date()
  const elapsed = fmtElapsed(Date.now() - enteredAt)
  const stamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  const deep = depth > 120
  const veryDeep = depth > 200
  const footer = veryDeep
    ? ['YOU ARE PAST THE PART WE HAVE MAPS FOR.', 'THIS RECEIPT IS YOUR ONLY PROOF YOU CAME IN.', 'HAVE YOU CONSIDERED STAYING.']
    : deep
      ? ['THANK YOU FOR SHOPPING WITH US.', 'AND SHOPPING WITH US.', 'AND SHOPPING WITH US.']
      : ['THANK YOU FOR SHOPPING WITH US.', 'PLEASE COME AGAIN.', 'YOU WILL COME AGAIN.']

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(2,2,4,0.82)', backdropFilter: 'blur(3px)', animation: 'aisle-pa 0.4s ease',
        fontFamily: '"Space Mono", monospace', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 340, maxWidth: '92vw', maxHeight: '86vh', overflowY: 'auto',
          background: 'repeating-linear-gradient(180deg, #f4f1e8 0px, #f4f1e8 26px, #efece2 27px)',
          color: '#14120c', padding: '26px 24px 20px', boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          fontSize: 11, lineHeight: 1.7, letterSpacing: '0.02em',
          clipPath: 'polygon(0 0,100% 0,100% 100%,96% 98.5%,92% 100%,88% 98.5%,84% 100%,80% 98.5%,76% 100%,72% 98.5%,68% 100%,64% 98.5%,60% 100%,56% 98.5%,52% 100%,48% 98.5%,44% 100%,40% 98.5%,36% 100%,32% 98.5%,28% 100%,24% 98.5%,20% 100%,16% 98.5%,12% 100%,8% 98.5%,4% 100%,0 98.5%)',
        }}
      >
        <div style={{ textAlign: 'center', letterSpacing: '0.24em', fontSize: 13, fontWeight: 700 }}>AISLE 14</div>
        <div style={{ textAlign: 'center', fontSize: 9, marginTop: 2 }}>FOODMART · STORE #∞</div>
        <div style={{ textAlign: 'center', fontSize: 9, opacity: 0.7 }}>REG 03 · CASHIER: —— (UNATTENDED)</div>
        <div style={{ textAlign: 'center', fontSize: 9, opacity: 0.7, marginTop: 2 }}>{stamp}</div>

        <div style={{ borderTop: '1px dashed #14120c', margin: '12px 0 10px' }} />

        {basket.length === 0 ? (
          <div style={{ textAlign: 'center', fontSize: 10, opacity: 0.85, lineHeight: 2 }}>
            NO ITEMS SCANNED<br />
            YOU CAME IN FOR SOMETHING<br />
            <span style={{ opacity: 0.6 }}>the store remembers what. you don&apos;t.</span>
          </div>
        ) : (
          basket.map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</span>
              <span style={{ whiteSpace: 'nowrap', opacity: 0.85 }}>{b.price}</span>
            </div>
          ))
        )}

        <div style={{ borderTop: '1px dashed #14120c', margin: '10px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ITEMS</span><span>{basket.length}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>TIME IN STORE</span><span>{elapsed}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DEPTH REACHED</span><span>#{String(depth).padStart(5, '0')}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 4 }}>
          <span>TOTAL</span><span>YOUR ATTENTION</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, opacity: 0.7 }}>
          <span>PAID</span><span>IN FULL, SOMEHOW</span>
        </div>

        <div style={{ borderTop: '1px dashed #14120c', margin: '12px 0 10px' }} />

        <div style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.06em', lineHeight: 1.9, opacity: 0.9 }}>
          {footer.map((l, i) => <div key={i}>{l}</div>)}
        </div>

        {/* barcode */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginTop: 12, height: 34, alignItems: 'stretch' }}>
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} style={{ width: (i * 53 % 4) + 1, background: '#14120c', opacity: (i * 37 % 5) === 0 ? 0.15 : 1 }} />
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 8, letterSpacing: '0.3em', marginTop: 4, opacity: 0.7 }}>
          0 14 14 {String(depth).padStart(6, '0')} {String(basket.length).padStart(2, '0')}
        </div>

        <div style={{ textAlign: 'center', fontSize: 8, marginTop: 14, opacity: 0.45, letterSpacing: '0.15em', cursor: 'pointer' }} onClick={onClose}>
          [ TAP ANYWHERE · ESC ] — KEEP SHOPPING
        </div>
      </div>
    </div>
  )
}
