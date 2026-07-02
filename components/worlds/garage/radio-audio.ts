// WebAudio engine for the garage radio: static between stations,
// a low synth drone when tuned. Nothing sampled — everything synthesized.

export class RadioAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private staticSrc: AudioBufferSourceNode | null = null
  private staticGain: GainNode | null = null
  private droneOscs: OscillatorNode[] = []
  private droneGain: GainNode | null = null
  private running = false

  start() {
    if (this.running) return
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)

      // static bed
      const len = this.ctx.sampleRate * 2
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.35
      this.staticSrc = this.ctx.createBufferSource()
      this.staticSrc.buffer = buf
      this.staticSrc.loop = true
      const bp = this.ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1600
      bp.Q.value = 0.4
      this.staticGain = this.ctx.createGain()
      this.staticGain.gain.value = 0.14
      this.staticSrc.connect(bp).connect(this.staticGain).connect(this.master)
      this.staticSrc.start()

      // station drone: two detuned oscillators + slow LFO on filter
      this.droneGain = this.ctx.createGain()
      this.droneGain.gain.value = 0.0001
      const lp = this.ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 800
      const lfo = this.ctx.createOscillator()
      lfo.frequency.value = 0.09
      const lfoGain = this.ctx.createGain()
      lfoGain.gain.value = 320
      lfo.connect(lfoGain).connect(lp.frequency)
      lfo.start()
      ;[0, 7.03].forEach(semi => {
        const o = this.ctx!.createOscillator()
        o.type = 'triangle'
        o.frequency.value = 110 * Math.pow(2, semi / 12)
        o.connect(lp)
        this.droneOscs.push(o)
        o.start()
      })
      lp.connect(this.droneGain)
      this.droneGain.connect(this.master)

      this.running = true
    } catch { /* no audio — silent garage */ }
  }

  // tuned in [0,1]: 1 = locked on station, 0 = pure static
  setTuning(tuned: number, stationFreq: number) {
    if (!this.ctx || !this.staticGain || !this.droneGain) return
    const t = this.ctx.currentTime
    this.staticGain.gain.linearRampToValueAtTime(0.02 + (1 - tuned) * 0.15, t + 0.15)
    this.droneGain.gain.linearRampToValueAtTime(Math.max(0.0001, tuned * 0.10), t + 0.15)
    // each station gets its own root note
    const root = 82 + ((stationFreq * 7) % 60)
    this.droneOscs.forEach((o, i) => {
      o.frequency.linearRampToValueAtTime(root * (i === 0 ? 1 : 1.5), t + 0.3)
    })
  }

  engineStart() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    // starter crank: pitched-up sawtooth burst, then low idle rumble
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
      this.staticSrc?.stop()
      this.droneOscs.forEach(o => { try { o.stop() } catch {} })
      this.ctx?.close()
    } catch {}
    this.ctx = null
    this.droneOscs = []
    this.running = false
  }
}
