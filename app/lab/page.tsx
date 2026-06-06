'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import AreaLayout from '@/components/shared/AreaLayout'
import { useCursor } from '@/components/cursor/CursorContext'

// ─── EXPERIMENT: PARTICLE FLOW ────────────────────────────────────────────────
function ParticleFlow({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Array<{x:number;y:number;vx:number;vy:number;life:number;maxLife:number}>>([])
  const mouse = useRef({x:0,y:0})
  const raf = useRef(0)

  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width=c.offsetWidth; c.height=c.offsetHeight }
    resize()
    const onMove = (e: MouseEvent) => {
      const r = c.getBoundingClientRect()
      mouse.current = { x: e.clientX-r.left, y: e.clientY-r.top }
      for (let i=0;i<3;i++) {
        particles.current.push({ x: mouse.current.x+(Math.random()-.5)*10, y: mouse.current.y+(Math.random()-.5)*10, vx:(Math.random()-.5)*3, vy:(Math.random()-.5)*3-1, life:1, maxLife:1 })
      }
    }
    c.addEventListener('mousemove', onMove)
    const draw = () => {
      ctx.fillStyle = 'rgba(10,7,16,0.15)'; ctx.fillRect(0,0,c.width,c.height)
      particles.current = particles.current.filter(p => p.life > 0.01)
      particles.current.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life*=0.97
        ctx.beginPath(); ctx.arc(p.x,p.y,p.life*3,0,Math.PI*2)
        ctx.fillStyle=`rgba(168,85,247,${p.life*0.7})`
        ctx.shadowBlur=6; ctx.shadowColor='#A855F7'
        ctx.fill(); ctx.shadowBlur=0
      })
      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf.current); c.removeEventListener('mousemove',onMove) }
  }, [active])

  return <canvas ref={ref} className="w-full h-full" style={{background:'#0a0710'}} />
}

// ─── EXPERIMENT: COLOR SYNTH ──────────────────────────────────────────────────
function ColorSynth({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({x:0.5,y:0.5})
  const raf = useRef(0)
  const t = useRef(0)

  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width=c.offsetWidth; c.height=c.offsetHeight }
    resize()
    const onMove = (e: MouseEvent) => {
      const r = c.getBoundingClientRect()
      mouse.current = { x: (e.clientX-r.left)/c.width, y: (e.clientY-r.top)/c.height }
    }
    c.addEventListener('mousemove', onMove)

    const draw = () => {
      t.current += 0.01
      const W=c.width, H=c.height
      const hue1 = (mouse.current.x * 360 + t.current * 20) % 360
      const hue2 = (hue1 + 120 + mouse.current.y * 60) % 360
      const grad = ctx.createRadialGradient(mouse.current.x*W, mouse.current.y*H, 0, W/2, H/2, Math.max(W,H)*0.8)
      grad.addColorStop(0, `hsl(${hue1},80%,${30+mouse.current.y*20}%)`)
      grad.addColorStop(0.5, `hsl(${hue2},60%,15%)`)
      grad.addColorStop(1, '#0a0710')
      ctx.fillStyle = grad; ctx.fillRect(0,0,W,H)

      // Grid of reactive dots
      const cols=12, rows=8
      for (let r=0;r<rows;r++) for (let col=0;col<cols;col++) {
        const x=(col+0.5)*W/cols, y=(r+0.5)*H/rows
        const dx=x/W-mouse.current.x, dy=y/H-mouse.current.y
        const d=Math.hypot(dx,dy), pulse=Math.sin(t.current*3-d*8)*0.5+0.5
        const sz=Math.max(1, (1-d*1.2)*8*pulse)
        ctx.beginPath(); ctx.arc(x,y,sz,0,Math.PI*2)
        ctx.fillStyle=`rgba(255,255,255,${(1-d*1.5)*0.3})`
        ctx.fill()
      }

      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf.current); c.removeEventListener('mousemove',onMove) }
  }, [active])

  return <canvas ref={ref} className="w-full h-full" />
}

// ─── EXPERIMENT: GRID DISTORT ─────────────────────────────────────────────────
function GridDistort({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({x:-999,y:-999})
  const raf = useRef(0)

  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width=c.offsetWidth; c.height=c.offsetHeight }
    resize()
    const onMove = (e: MouseEvent) => {
      const r = c.getBoundingClientRect()
      mouse.current = { x: e.clientX-r.left, y: e.clientY-r.top }
    }
    c.addEventListener('mousemove', onMove)

    const draw = () => {
      const W=c.width, H=c.height
      ctx.fillStyle='#0a0710'; ctx.fillRect(0,0,W,H)
      const gs=36, R=120
      for (let gx=0;gx<=W;gx+=gs) for (let gy=0;gy<=H;gy+=gs) {
        const dx=gx-mouse.current.x, dy=gy-mouse.current.y, d=Math.hypot(dx,dy)
        const push = d<R ? (R-d)/R : 0
        const x = gx + (dx/Math.max(d,1))*push*30
        const y = gy + (dy/Math.max(d,1))*push*30
        ctx.beginPath(); ctx.arc(x,y,Math.max(0.5,push*3+0.5),0,Math.PI*2)
        ctx.fillStyle=`rgba(168,85,247,${0.2+push*0.6})`
        ctx.fill()
      }
      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf.current); c.removeEventListener('mousemove',onMove) }
  }, [active])

  return <canvas ref={ref} className="w-full h-full" style={{background:'#0a0710'}} />
}

// ─── EXPERIMENT: TYPE COLLIDER ─────────────────────────────────────────────────
function TypeCollider({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const words = useRef<Array<{x:number;y:number;vx:number;vy:number;word:string;size:number;rot:number;vrot:number}>>([])
  const raf = useRef(0)
  const WORDS = ['TEXTURE','SIGNAL','NOISE','SYSTEM','EDGE','LOOP','DRIFT','FORM','BUILD','RUN','LAB']

  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width=c.offsetWidth; c.height=c.offsetHeight }
    resize()

    words.current = WORDS.map(w => ({
      x: Math.random()*c.width, y: -50-Math.random()*300,
      vx: (Math.random()-.5)*1.5, vy: 0.5+Math.random()*1.5,
      word: w, size: 12+Math.floor(Math.random()*16),
      rot: (Math.random()-.5)*0.3, vrot: (Math.random()-.5)*0.02,
    }))

    const onClick = (e: MouseEvent) => {
      const r = c.getBoundingClientRect()
      const mx=e.clientX-r.left, my=e.clientY-r.top
      words.current.forEach(w => {
        const dx=w.x-mx, dy=w.y-my, d=Math.hypot(dx,dy)
        if (d<80) { w.vx+=dx/d*5; w.vy+=dy/d*5 }
      })
    }
    c.addEventListener('click', onClick)

    const draw = () => {
      const W=c.width, H=c.height
      ctx.fillStyle='rgba(10,7,16,0.25)'; ctx.fillRect(0,0,W,H)
      words.current.forEach(w => {
        w.vy+=0.04; w.vx*=0.998; w.vy*=0.998; w.rot+=w.vrot
        w.x+=w.vx; w.y+=w.vy
        if (w.x<-100) w.vx=Math.abs(w.vx)
        if (w.x>W+100) w.vx=-Math.abs(w.vx)
        if (w.y>H+50) { w.y=-50; w.x=Math.random()*W; w.vy=0.5+Math.random() }
        ctx.save(); ctx.translate(w.x,w.y); ctx.rotate(w.rot)
        ctx.font=`${w.size}px monospace`
        ctx.fillStyle=`rgba(168,85,247,0.7)`
        ctx.textAlign='center'; ctx.fillText(w.word,0,0)
        ctx.restore()
      })
      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf.current); c.removeEventListener('click',onClick) }
  }, [active])

  return <canvas ref={ref} className="w-full h-full cursor-none" style={{background:'#0a0710'}} />
}

// ─── EXPERIMENT GRID ──────────────────────────────────────────────────────────
const EXPERIMENTS = [
  { id:'particles', title:'Particle Flow',   sub:'move mouse',   Comp: ParticleFlow  },
  { id:'color',     title:'Color Synth',     sub:'move mouse',   Comp: ColorSynth    },
  { id:'grid',      title:'Grid Distort',    sub:'move mouse',   Comp: GridDistort   },
  { id:'type',      title:'Type Collider',   sub:'click to repel',Comp: TypeCollider },
]

function ExperimentCard({ exp }: { exp: typeof EXPERIMENTS[0] }) {
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const { setMode } = useCursor()
  const { Comp } = exp

  return (
    <>
      <button
        className="relative text-left w-full border border-[rgba(168,85,247,0.15)] overflow-hidden cursor-none aspect-video group transition-all duration-300 hover:border-[rgba(168,85,247,0.5)]"
        onMouseEnter={() => { setHovered(true); setMode('hover') }}
        onMouseLeave={() => { setHovered(false); setMode('default') }}
        onClick={() => setOpen(true)}
      >
        <div className="absolute inset-0 pointer-events-none">
          <Comp active={hovered} />
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-[rgba(10,7,16,0.9)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="font-mono text-[9px] tracking-[0.2em] text-[rgba(168,85,247,0.6)] uppercase mb-1">{exp.sub}</div>
          <div className="font-sans text-sm text-white">{exp.title}</div>
        </div>
        <div className="absolute top-3 left-3 font-mono text-[9px] tracking-[0.15em] text-[rgba(168,85,247,0.4)] uppercase">{exp.title}</div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-[#0a0710] flex flex-col" onClick={() => setOpen(false)}>
          <div className="flex items-center justify-between p-6 border-b border-[rgba(168,85,247,0.12)]">
            <div>
              <div className="font-mono text-[9px] tracking-[0.2em] text-[rgba(168,85,247,0.5)] uppercase mb-1">{exp.sub}</div>
              <div className="font-serif text-2xl">{exp.title}</div>
            </div>
            <button className="font-mono text-[10px] tracking-[0.15em] text-white/30 hover:text-white cursor-none transition-colors" onClick={() => setOpen(false)}>close ×</button>
          </div>
          <div className="flex-1" onClick={e => e.stopPropagation()}>
            <Comp active={true} />
          </div>
        </div>
      )}
    </>
  )
}

export default function LabPage() {
  return (
    <AreaLayout area="lab" className="bg-area-lab scanlines">
      {/* Header */}
      <div className="px-8 pt-20 pb-6 border-b border-[rgba(168,85,247,0.1)]">
        <div className="font-mono text-[10px] tracking-[0.25em] text-[#A855F7] uppercase mb-3">Area 05</div>
        <h1 className="font-serif text-[clamp(3rem,10vw,8rem)] leading-[0.88] tracking-tight text-white">LAB</h1>
        <div className="font-mono text-xs text-white/20 mt-4 tracking-[0.15em]">
          {EXPERIMENTS.length} experiments · hover to activate · click to expand
        </div>
      </div>

      {/* Experiment grid */}
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXPERIMENTS.map(exp => <ExperimentCard key={exp.id} exp={exp} />)}
      </div>

      {/* Footer note */}
      <div className="px-8 py-6 border-t border-[rgba(168,85,247,0.08)]">
        <div className="font-mono text-[9px] tracking-[0.15em] text-white/15">more experiments coming · try the konami code anywhere on the site</div>
      </div>
    </AreaLayout>
  )
}
