// Garage radio audio. Real internet-radio streams play through an <audio>
// element (cross-origin media playback needs no CORS); the space *between*
// stations is a synthesized static bed on the WebAudio graph. As the dial nears
// a station the stream fades up and the static fades down, so sweeping the knob
// feels like catching signals out of the noise — not flipping a playlist.

import type { RadioStation } from '@/app/api/radio/route'

export type RadioStatus = 'off' | 'static' | 'tuning' | 'live'

const CATCH = 0.55        // MHz: within this of a station, you start hearing it
const LOCK = 0.18         // MHz: within this, it's a clean lock (no static)

function closeness(delta: number): number {
  const d = Math.abs(delta)
  if (d >= CATCH) return 0
  if (d <= LOCK) return 1
  // smoothstep from CATCH → LOCK
  const t = 1 - (d - LOCK) / (CATCH - LOCK)
  return t * t * (3 - 2 * t)
}

export function nearestStation(freq: number, stations: RadioStation[]): { station: RadioStation | null; strength: number } {
  let best: RadioStation | null = null
  let bestDelta = Infinity
  for (const s of stations) {
    const d = Math.abs(s.freq - freq)
    if (d < bestDelta) { bestDelta = d; best = s }
  }
  if (!best) return { station: null, strength: 0 }
  return { station: best, strength: closeness(best.freq - freq) }
}

export class LiveRadio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private staticSrc: AudioBufferSourceNode | null = null
  private staticGain: GainNode | null = null
  private audio: HTMLAudioElement | null = null
  private stations: RadioStation[] = []
  private activeId: string | null = null
  private masterVol = 0.75
  private lastFreq = 98
  private running = false
  private muted = false
  private lastStatus: RadioStatus | null = null
  private lastActiveId: string | null = null

  onStatus: ((s: RadioStatus, station: RadioStation | null) => void) | null = null

  start() {
    if (this.running) return
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 1
      this.master.connect(this.ctx.destination)

      // static bed — filtered white noise, slightly resonant so it reads as "between stations"
      const len = this.ctx.sampleRate * 2
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5
      this.staticSrc = this.ctx.createBufferSource()
      this.staticSrc.buffer = buf
      this.staticSrc.loop = true
      const bp = this.ctx.createBiquadFilter()
      bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.5
      const hp = this.ctx.createBiquadFilter()
      hp.type = 'highpass'; hp.frequency.value = 500
      this.staticGain = this.ctx.createGain()
      this.staticGain.gain.value = 0
      this.staticSrc.connect(bp).connect(hp).connect(this.staticGain).connect(this.master)
      this.staticSrc.start()

      // the stream player
      this.audio = new Audio()
      this.audio.preload = 'none'
      this.audio.volume = 0
      this.audio.addEventListener('playing', () => this.emit())
      this.audio.addEventListener('waiting', () => this.emit())
      this.audio.addEventListener('error', () => { this.activeId = null; this.emit() })
      // 'playing' fires the instant playback starts, which is usually still at
      // currentTime 0 — so on its own it can only ever report TUNING. Without
      // this the dial stays stuck on TUNING for the whole song. emit()
      // de-dupes, so the ~4Hz timeupdate costs one state change on the way in.
      this.audio.addEventListener('timeupdate', () => this.emit())

      this.running = true
    } catch { /* no audio available — silent radio */ }
  }

  resume() { this.ctx?.resume?.() }

  setStations(list: RadioStation[]) { this.stations = list }

  setMasterVolume(v: number) {
    this.masterVol = Math.max(0, Math.min(1, v))
    if (this.master && this.ctx) this.master.gain.value = this.muted ? 0 : 1
    // re-apply to whatever is currently playing so the slider takes effect immediately
    this.tune(this.lastFreq)
  }

  setMuted(m: boolean) {
    this.muted = m
    if (this.master) this.master.gain.value = m ? 0 : 1
    if (this.audio) this.audio.muted = m
    this.emit()
  }

  // Called continuously as the dial moves.
  tune(freq: number) {
    this.lastFreq = freq
    if (!this.ctx || !this.staticGain || !this.audio) return
    const { station, strength } = nearestStation(freq, this.stations)
    const t = this.ctx.currentTime

    // static is loudest between stations, silent on a clean lock
    const staticLevel = (0.05 + (1 - strength) * 0.32) * this.masterVol
    this.staticGain.gain.setTargetAtTime(staticLevel, t, 0.05)

    if (station && strength > 0.02) {
      // within a station's pull — make sure the right stream is loaded
      if (this.activeId !== station.id) {
        this.activeId = station.id
        this.audio.src = station.url
        this.audio.play().catch(() => {})
        this.emit()
      }
      // fade the stream by how well it's tuned in
      const target = Math.pow(strength, 0.8) * this.masterVol
      this.audio.volume = this.muted ? 0 : Math.max(0, Math.min(1, target))
    } else {
      // off in the noise between stations — drop the stream
      if (this.activeId !== null) {
        this.activeId = null
        this.audio.pause()
        this.emit()
      }
      this.audio.volume = 0
    }
  }

  private emit() {
    if (!this.onStatus) return
    const active = this.stations.find(s => s.id === this.activeId) ?? null
    let status: RadioStatus = 'static'
    if (active && !this.muted) {
      status = this.audio && !this.audio.paused && this.audio.readyState >= 3 && this.audio.currentTime > 0 ? 'live' : 'tuning'
    }
    if (status === this.lastStatus && active?.id === this.lastActiveId) return
    this.lastStatus = status
    this.lastActiveId = active?.id ?? null
    this.onStatus(status, active)
  }

  // starter crank → low idle rumble, synthesized on the same graph
  engineStart() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(34, ctx.currentTime)
    o.frequency.linearRampToValueAtTime(88, ctx.currentTime + 0.7)
    o.frequency.linearRampToValueAtTime(50, ctx.currentTime + 1.2)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.2)
    g.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 1.5)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 230
    o.connect(lp).connect(g).connect(this.master)
    o.start()
    o.stop(ctx.currentTime + 1.7)
  }

  stop() {
    try {
      this.audio?.pause()
      if (this.audio) this.audio.src = ''
      this.staticSrc?.stop()
      this.ctx?.close()
    } catch {}
    this.ctx = null
    this.audio = null
    this.running = false
  }
}
