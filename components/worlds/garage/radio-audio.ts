// Garage radio — real, live internet radio tuned in real time.
//
// The dial (88–108 FM) is mapped onto a curated set of 24/7 public streams from
// around the world. Between stations you hear synthesized static (WebAudio);
// as you lock onto a station's frequency the static fades and its live stream
// fades up. Streams are plain progressive icecast MP3 endpoints played through
// a single <audio> element, so no CORS is required for playback. Each station
// carries fallback server URLs — if one edge node is down the engine walks to
// the next before giving up and leaving you with static.

export interface RadioStation {
  id: string
  freq: number
  name: string
  place: string
  genre: string
  urls: string[] // primary first, then fallbacks
}

// Sorted by frequency. Spread ~2 MHz apart with static gaps between.
export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'fip', freq: 88.3, name: 'FIP', place: 'Paris, France', genre: 'no-DJ eclectic',
    urls: ['https://icecast.radiofrance.fr/fip-midfi.mp3'],
  },
  {
    id: 'fipjazz', freq: 90.5, name: 'FIP Jazz', place: 'Paris, France', genre: 'jazz all night',
    urls: ['https://icecast.radiofrance.fr/fipjazz-midfi.mp3'],
  },
  {
    id: 'franceinter', freq: 92.7, name: 'France Inter', place: 'Paris, France', genre: 'la voix française',
    urls: ['https://icecast.radiofrance.fr/franceinter-midfi.mp3'],
  },
  {
    id: 'dlf', freq: 94.9, name: 'Deutschlandfunk', place: 'Köln, Germany', genre: 'Nachrichten & Kultur',
    urls: ['https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3', 'https://st02.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3'],
  },
  {
    id: 'rp', freq: 96.9, name: 'Radio Paradise', place: 'Paradise, California', genre: 'the main mix',
    urls: ['https://stream.radioparadise.com/mp3-128', 'https://stream-uk1.radioparadise.com/mp3-128'],
  },
  {
    id: 'rpmellow', freq: 99.1, name: 'RP Mellow Mix', place: 'Paradise, California', genre: 'slow and low',
    urls: ['https://stream.radioparadise.com/mellow-128', 'https://stream-uk1.radioparadise.com/mellow-128'],
  },
  {
    id: 'groovesalad', freq: 101.3, name: 'Groove Salad', place: 'San Francisco', genre: 'ambient / downtempo',
    urls: ['https://ice5.somafm.com/groovesalad-128-mp3', 'https://ice3.somafm.com/groovesalad-128-mp3', 'https://ice1.somafm.com/groovesalad-128-mp3', 'https://ice2.somafm.com/groovesalad-128-mp3'],
  },
  {
    id: 'dronezone', freq: 103.5, name: 'Drone Zone', place: 'San Francisco', genre: 'deep space ambient',
    urls: ['https://ice5.somafm.com/dronezone-128-mp3', 'https://ice3.somafm.com/dronezone-128-mp3', 'https://ice1.somafm.com/dronezone-128-mp3', 'https://ice2.somafm.com/dronezone-128-mp3'],
  },
  {
    id: 'defcon', freq: 105.7, name: 'DEF CON Radio', place: 'San Francisco', genre: 'music for hacking',
    urls: ['https://ice5.somafm.com/defcon-128-mp3', 'https://ice3.somafm.com/defcon-128-mp3', 'https://ice1.somafm.com/defcon-128-mp3', 'https://ice2.somafm.com/defcon-128-mp3'],
  },
  {
    id: 'deepspace', freq: 107.9, name: 'Deep Space One', place: 'San Francisco', genre: 'for inner & outer space',
    urls: ['https://ice5.somafm.com/deepspaceone-128-mp3', 'https://ice3.somafm.com/deepspaceone-128-mp3', 'https://ice1.somafm.com/deepspaceone-128-mp3', 'https://ice2.somafm.com/deepspaceone-128-mp3'],
  },
]

const LOCK_HALF = 0.9 // MHz — begin to hear a station this far out
const CONNECT_TIMEOUT = 7000

export type RadioState = 'static' | 'connecting' | 'live' | 'dead'
export interface RadioStatus {
  station: RadioStation | null
  closeness: number // 0..1, how locked onto the nearest station
  state: RadioState
}

function nearestStation(freq: number): { station: RadioStation | null; closeness: number; dist: number } {
  let best: RadioStation | null = null
  let bestDist = Infinity
  for (const s of RADIO_STATIONS) {
    const d = Math.abs(s.freq - freq)
    if (d < bestDist) { bestDist = d; best = s }
  }
  if (!best || bestDist > LOCK_HALF) return { station: null, closeness: 0, dist: bestDist }
  const raw = 1 - bestDist / LOCK_HALF
  // sharpen: mostly static until you're close, then a firm lock
  const closeness = Math.pow(Math.max(0, raw), 1.6)
  return { station: best, closeness, dist: bestDist }
}

export class RadioAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private staticSrc: AudioBufferSourceNode | null = null
  private staticGain: GainNode | null = null
  private staticFilter: BiquadFilterNode | null = null
  private audio: HTMLAudioElement | null = null
  private running = false
  private muted = false

  private curId: string | null = null // station we're committed to
  private urlIdx = 0
  private state: RadioState = 'static'
  private lastStation: RadioStation | null = null
  private lastCloseness = 0
  private pendingTimer: ReturnType<typeof setTimeout> | null = null
  private connectTimer: ReturnType<typeof setTimeout> | null = null
  private onStatus?: (s: RadioStatus) => void

  setStatusListener(cb: (s: RadioStatus) => void) { this.onStatus = cb }

  private emit() {
    this.onStatus?.({ station: this.lastStation, closeness: this.lastCloseness, state: this.state })
  }

  start() {
    if (this.running) return
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.85
      this.master.connect(this.ctx.destination)

      // static bed — filtered white noise
      const len = this.ctx.sampleRate * 2
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.4
      this.staticSrc = this.ctx.createBufferSource()
      this.staticSrc.buffer = buf
      this.staticSrc.loop = true
      this.staticFilter = this.ctx.createBiquadFilter()
      this.staticFilter.type = 'bandpass'
      this.staticFilter.frequency.value = 2200
      this.staticFilter.Q.value = 0.5
      this.staticGain = this.ctx.createGain()
      this.staticGain.gain.value = 0.12
      this.staticSrc.connect(this.staticFilter).connect(this.staticGain).connect(this.master)
      this.staticSrc.start()

      // stream player
      this.audio = new Audio()
      this.audio.preload = 'none'
      this.audio.volume = 0
      this.audio.addEventListener('playing', () => {
        if (this.state === 'connecting') {
          this.state = 'live'
          if (this.connectTimer) { clearTimeout(this.connectTimer); this.connectTimer = null }
          this.applyStreamVolume()
          this.emit()
        }
      })
      this.audio.addEventListener('error', () => this.tryNextUrl())
      this.audio.addEventListener('stalled', () => { if (this.state === 'connecting') this.tryNextUrl() })

      this.running = true
    } catch { /* no audio — silent radio */ }
  }

  private applyStreamVolume() {
    if (!this.audio) return
    this.audio.volume = this.state === 'live' && !this.muted ? Math.min(1, this.lastCloseness * 1.08) : 0
  }

  setMuted(m: boolean) {
    this.muted = m
    this.applyStreamVolume()
  }

  // Called on every dial change.
  setDial(freq: number) {
    const { station, closeness } = nearestStation(freq)
    this.lastCloseness = closeness

    // static rides opposite the lock — a floor of hiss always remains
    if (this.staticGain && this.ctx) {
      const t = this.ctx.currentTime
      const streaming = this.state === 'live'
      const target = 0.015 + (1 - closeness) * (streaming ? 0.13 : 0.15)
      this.staticGain.gain.setTargetAtTime(target, t, 0.06)
    }
    if (this.staticFilter && this.ctx) {
      // detune the hiss slightly with the dial so sweeping feels analog
      this.staticFilter.frequency.setTargetAtTime(1400 + (freq - 88) * 90, this.ctx.currentTime, 0.1)
    }

    const targetId = station ? station.id : null
    if (targetId !== this.curId) this.scheduleStation(station)
    else this.applyStreamVolume()

    this.emit()
  }

  private scheduleStation(station: RadioStation | null) {
    this.curId = station ? station.id : null
    this.lastStation = station
    if (this.pendingTimer) { clearTimeout(this.pendingTimer); this.pendingTimer = null }
    if (this.connectTimer) { clearTimeout(this.connectTimer); this.connectTimer = null }

    if (!station) {
      this.state = 'static'
      this.audio?.pause()
      if (this.audio) this.audio.volume = 0
      this.emit()
      return
    }

    this.state = 'connecting'
    this.applyStreamVolume()
    this.emit()
    // debounce: don't hammer streams you're just sweeping past
    this.pendingTimer = setTimeout(() => this.loadStation(station, 0), 260)
  }

  private loadStation(station: RadioStation, urlIdx: number) {
    if (!this.audio || this.curId !== station.id) return
    this.urlIdx = urlIdx
    this.state = 'connecting'
    this.emit()
    try {
      this.audio.src = station.urls[urlIdx]
      this.audio.load()
      this.audio.play().catch(() => {})
    } catch { this.tryNextUrl(); return }
    if (this.connectTimer) clearTimeout(this.connectTimer)
    this.connectTimer = setTimeout(() => { if (this.state === 'connecting') this.tryNextUrl() }, CONNECT_TIMEOUT)
  }

  private tryNextUrl() {
    if (this.state === 'live') return
    const station = this.lastStation
    if (!station || this.curId !== station.id) return
    const next = this.urlIdx + 1
    if (next < station.urls.length) {
      this.loadStation(station, next)
    } else {
      this.state = 'dead' // all servers unreachable — stay on static
      if (this.connectTimer) { clearTimeout(this.connectTimer); this.connectTimer = null }
      if (this.audio) this.audio.volume = 0
      this.emit()
    }
  }

  // starter crank → low idle, unchanged synth so ignition still has a voice
  engineStart() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(38, ctx.currentTime)
    o.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.7)
    o.frequency.linearRampToValueAtTime(52, ctx.currentTime + 1.2)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.2)
    g.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 1.4)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 240
    o.connect(lp).connect(g).connect(this.master)
    o.start()
    o.stop(ctx.currentTime + 1.6)
  }

  stop() {
    try {
      if (this.pendingTimer) clearTimeout(this.pendingTimer)
      if (this.connectTimer) clearTimeout(this.connectTimer)
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
