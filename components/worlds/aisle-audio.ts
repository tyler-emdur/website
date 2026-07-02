// The sound of the endless aisle. Backrooms rule #1: the fluorescent hum. A
// continuous electrical buzz that gets louder and sicker the deeper you walk,
// a sub-bass room drone underneath it, and the occasional zap/flicker of a tube
// struggling to stay lit. All synthesized — nothing sampled.

export class AisleAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private humGain: GainNode | null = null
  private subGain: GainNode | null = null
  private flickerGain: GainNode | null = null
  private started = false
  private level = 0
  private zapTimer: ReturnType<typeof setTimeout> | null = null

  start() {
    if (this.started) return
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      const ctx = this.ctx
      this.master = ctx.createGain()
      this.master.gain.value = 0.85
      this.master.connect(ctx.destination)

      // fluorescent hum: mains buzz (120Hz + harmonics) through a peaky bandpass
      this.humGain = ctx.createGain()
      this.humGain.gain.value = 0.02
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'; bp.frequency.value = 120; bp.Q.value = 5
      ;[120, 240, 360].forEach((f, i) => {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = f
        const g = ctx.createGain()
        g.gain.value = [1, 0.5, 0.28][i]
        o.connect(g).connect(bp)
        o.start()
      })
      bp.connect(this.humGain).connect(this.master)

      // a faint amplitude flicker on the hum — the tube never sits still
      const lfo = ctx.createOscillator()
      lfo.type = 'square'; lfo.frequency.value = 11
      this.flickerGain = ctx.createGain()
      this.flickerGain.gain.value = 0.004
      lfo.connect(this.flickerGain).connect(this.humGain.gain)
      lfo.start()

      // sub-bass room drone — the pressure of a very big empty building
      this.subGain = ctx.createGain()
      this.subGain.gain.value = 0.0001
      const sub = ctx.createOscillator()
      sub.type = 'sine'; sub.frequency.value = 44
      const sub2 = ctx.createOscillator()
      sub2.type = 'sine'; sub2.frequency.value = 44.4 // beat frequency, slow throb
      sub.connect(this.subGain); sub2.connect(this.subGain)
      this.subGain.connect(this.master)
      sub.start(); sub2.start()

      this.started = true
      this.scheduleZap()
    } catch { /* no audio — silent aisle */ }
  }

  resume() {
    if (!this.started) this.start()
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {})
  }

  // depth 0..1 — how far into the wrongness we are
  setDepth(v: number) {
    this.level = Math.max(0, Math.min(1, v))
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.humGain?.gain.setTargetAtTime(0.02 + this.level * 0.075, t, 0.5)
    this.flickerGain?.gain.setTargetAtTime(0.004 + this.level * 0.02, t, 0.5)
    this.subGain?.gain.setTargetAtTime(0.0001 + this.level * 0.05, t, 0.8)
  }

  // a tube stuttering — short electrical zap, more frequent the deeper you are
  private zap() {
    if (!this.ctx || !this.master || !this.humGain) return
    const ctx = this.ctx
    // brief buzz burst
    const o = ctx.createOscillator()
    o.type = 'square'; o.frequency.value = 90 + Math.random() * 60
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.05 + this.level * 0.06, ctx.currentTime + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09 + Math.random() * 0.1)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 2
    o.connect(bp).connect(g).connect(this.master)
    o.start(); o.stop(ctx.currentTime + 0.25)
    // duck the hum for the length of the stutter — the light briefly dies
    const t = ctx.currentTime
    this.humGain.gain.cancelScheduledValues(t)
    this.humGain.gain.setValueAtTime(this.humGain.gain.value, t)
    this.humGain.gain.linearRampToValueAtTime(0.005, t + 0.02)
    this.humGain.gain.linearRampToValueAtTime(0.02 + this.level * 0.075, t + 0.18)
  }

  private scheduleZap() {
    // deeper = zaps come far more often
    const base = 9000 - this.level * 7200
    const delay = Math.max(700, base * (0.4 + Math.random()))
    this.zapTimer = setTimeout(() => {
      if (this.level > 0.12 && Math.random() < 0.3 + this.level * 0.6) this.zap()
      this.scheduleZap()
    }, delay)
  }

  stop() {
    if (this.zapTimer) clearTimeout(this.zapTimer)
    try { this.ctx?.close() } catch {}
    this.ctx = null
    this.started = false
  }
}
