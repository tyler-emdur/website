// The room the television sits in. A late-night CRT has a sound even with the
// volume down: the mains hum through the chassis, the thin flyback whine of the
// tube, a little air. This synthesizes that bed (WebAudio, nothing sampled) and
// a burst of static for when the channel changes. It sits UNDER the TV's own
// audio, so unmuting a live channel plays over the top of it.

export class BroadcastAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private started = false

  start() {
    if (this.started) return
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.master.connect(this.ctx.destination)

      const ctx = this.ctx

      // mains hum — 60Hz + its octave, through a lowpass
      const humGain = ctx.createGain()
      humGain.gain.value = 0.05
      const humLp = ctx.createBiquadFilter()
      humLp.type = 'lowpass'
      humLp.frequency.value = 220
      ;[60, 120, 180].forEach((f, i) => {
        const o = ctx.createOscillator()
        o.type = 'sine'
        o.frequency.value = f
        const g = ctx.createGain()
        g.gain.value = [1, 0.4, 0.15][i]
        o.connect(g).connect(humLp)
        o.start()
      })
      humLp.connect(humGain).connect(this.master)

      // flyback whine — the ~15.7kHz line the tube sings at, very faint
      const whine = ctx.createOscillator()
      whine.type = 'sine'
      whine.frequency.value = 15720
      const whineGain = ctx.createGain()
      whineGain.gain.value = 0.006
      whine.connect(whineGain).connect(this.master)
      whine.start()

      // faint air/hiss so silence isn't dead
      const len = ctx.sampleRate * 2
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.15
      const hiss = ctx.createBufferSource()
      hiss.buffer = buf
      hiss.loop = true
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 6000
      const hissGain = ctx.createGain()
      hissGain.gain.value = 0.012
      hiss.connect(hp).connect(hissGain).connect(this.master)
      hiss.start()

      this.started = true
    } catch { /* no audio — silent room */ }
  }

  // resume() after a user gesture; call start() first if needed
  resume() {
    if (!this.started) this.start()
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {})
  }

  // the wet slap of changing channels — a short filtered noise burst
  staticBurst() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const dur = 0.16
    const len = Math.floor(ctx.sampleRate * dur)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1800
    bp.Q.value = 0.6
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    src.connect(bp).connect(g).connect(this.master)
    src.start()
    src.stop(ctx.currentTime + dur + 0.02)
  }

  stop() {
    try { this.ctx?.close() } catch {}
    this.ctx = null
    this.started = false
  }
}
