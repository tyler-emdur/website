'use client'
import { useState, useRef, useEffect } from 'react'
import BackToUniverse from '@/components/shared/BackToUniverse'

function ParticleFlow({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Array<{x:number;y:number;vx:number;vy:number;life:number}>>([])
  const mouse = useRef({x:0,y:0})
  const raf = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize()
    const onMove = (e: MouseEvent) => {
      const r = c.getBoundingClientRect()
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top }
      for (let i = 0; i < 3; i++) {
        particles.current.push({ x: mouse.current.x + (Math.random()-.5)*10, y: mouse.current.y + (Math.random()-.5)*10, vx: (Math.random()-.5)*3, vy: (Math.random()-.5)*3-1, life: 1 })
      }
    }
    c.addEventListener('mousemove', onMove)
    const draw = () => {
      ctx.fillStyle = 'rgba(5,3,12,0.15)'; ctx.fillRect(0,0,c.width,c.height)
      particles.current = particles.current.filter(p => p.life > 0.02)
      particles.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life *= 0.97
        ctx.beginPath(); ctx.arc(p.x,p.y,p.life*3,0,Math.PI*2)
        ctx.fillStyle = `rgba(168,85,247,${p.life*0.7})`
        ctx.shadowBlur = 6; ctx.shadowColor = '#A855F7'; ctx.fill(); ctx.shadowBlur = 0
      })
      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf.current); c.removeEventListener('mousemove', onMove) }
  }, [active])
  return <canvas ref={ref} className="w-full h-full" style={{ background: '#05030c' }} />
}

function ColorSynth({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({x:.5,y:.5})
  const raf = useRef(0)
  const t = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize()
    const onMove = (e: MouseEvent) => {
      const r = c.getBoundingClientRect()
      mouse.current = { x: (e.clientX-r.left)/c.width, y: (e.clientY-r.top)/c.height }
    }
    c.addEventListener('mousemove', onMove)
    const draw = () => {
      t.current += 0.01
      const W=c.width,H=c.height
      const hue1=(mouse.current.x*360+t.current*20)%360
      const hue2=(hue1+120+mouse.current.y*60)%360
      const grad=ctx.createRadialGradient(mouse.current.x*W,mouse.current.y*H,0,W/2,H/2,Math.max(W,H)*0.8)
      grad.addColorStop(0,`hsl(${hue1},80%,${20+mouse.current.y*15}%)`)
      grad.addColorStop(0.5,`hsl(${hue2},60%,10%)`)
      grad.addColorStop(1,'#05030c')
      ctx.fillStyle=grad; ctx.fillRect(0,0,W,H)
      const cols=12,rows=8
      for(let r=0;r<rows;r++) for(let col=0;col<cols;col++){
        const x=(col+.5)*W/cols,y=(r+.5)*H/rows
        const dx=x/W-mouse.current.x,dy=y/H-mouse.current.y
        const d=Math.hypot(dx,dy),pulse=Math.sin(t.current*3-d*8)*.5+.5
        const sz=Math.max(1,(1-d*1.2)*8*pulse)
        ctx.beginPath();ctx.arc(x,y,sz,0,Math.PI*2)
        ctx.fillStyle=`rgba(255,255,255,${(1-d*1.5)*.3})`; ctx.fill()
      }
      raf.current=requestAnimationFrame(draw)
    }
    raf.current=requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf.current); c.removeEventListener('mousemove',onMove) }
  }, [active])
  return <canvas ref={ref} className="w-full h-full" />
}

function GridDistort({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({x:-999,y:-999})
  const raf = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize()
    const onMove = (e: MouseEvent) => { const r=c.getBoundingClientRect(); mouse.current={x:e.clientX-r.left,y:e.clientY-r.top} }
    c.addEventListener('mousemove', onMove)
    const draw = () => {
      const W=c.width,H=c.height
      ctx.fillStyle='#05030c'; ctx.fillRect(0,0,W,H)
      const gs=36,R=120
      for(let gx=0;gx<=W;gx+=gs) for(let gy=0;gy<=H;gy+=gs){
        const dx=gx-mouse.current.x,dy=gy-mouse.current.y,d=Math.hypot(dx,dy)
        const push=d<R?(R-d)/R:0
        const x=gx+(dx/Math.max(d,1))*push*30,y=gy+(dy/Math.max(d,1))*push*30
        ctx.beginPath();ctx.arc(x,y,Math.max(.5,push*3+.5),0,Math.PI*2)
        ctx.fillStyle=`rgba(168,85,247,${.2+push*.6})`; ctx.fill()
      }
      raf.current=requestAnimationFrame(draw)
    }
    raf.current=requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf.current); c.removeEventListener('mousemove',onMove) }
  }, [active])
  return <canvas ref={ref} className="w-full h-full" style={{ background: '#05030c' }} />
}

const EXPS = [
  { id: 'pf', title: 'Particle Flow', sub: 'move mouse', Comp: ParticleFlow },
  { id: 'cs', title: 'Color Synth', sub: 'move mouse', Comp: ColorSynth },
  { id: 'gd', title: 'Grid Distort', sub: 'move mouse', Comp: GridDistort },
]

function ExperimentCard({ exp }: { exp: typeof EXPS[0] }) {
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const { Comp } = exp
  return (
    <>
      <button
        className="relative text-left w-full overflow-hidden aspect-video"
        style={{ border: '1px solid rgba(168,85,247,0.12)', cursor: 'none', transition: 'border-color 0.3s' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setOpen(true)}
      >
        <div className="absolute inset-0 pointer-events-none">
          <Comp active={hovered} />
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-3" style={{ background: 'linear-gradient(to top,rgba(5,3,12,0.9) 0%,transparent 100%)', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', color: 'rgba(168,85,247,0.6)', marginBottom: 2 }}>{exp.sub}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#fff', fontWeight: 300 }}>{exp.title}</div>
        </div>
        <div className="absolute top-3 left-3" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', color: 'rgba(168,85,247,0.35)' }}>{exp.title.toUpperCase()}</div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#05030c' }} onClick={() => setOpen(false)}>
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(168,85,247,0.1)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 300, color: '#fff' }}>{exp.title}</div>
            <button style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', cursor: 'none' }} onClick={() => setOpen(false)}>CLOSE ×</button>
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
    <div className="area-page" style={{ background: '#05030c' }}>
      <BackToUniverse />
      <div style={{ padding: '88px 32px 24px', borderBottom: '1px solid rgba(168,85,247,0.08)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(168,85,247,0.6)', marginBottom: 8 }}>SECTOR 05-Ψ · LAB</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(3rem,10vw,7rem)', fontWeight: 300, lineHeight: 0.9, color: '#fff' }}>LAB</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 16, letterSpacing: '0.12em' }}>
          {EXPS.length} EXPERIMENTS · HOVER TO ACTIVATE · CLICK TO EXPAND
        </div>
      </div>

      <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
        {EXPS.map(exp => <ExperimentCard key={exp.id} exp={exp} />)}
      </div>

      <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(168,85,247,0.05)', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.1)' }}>
        MORE EXPERIMENTS INCOMING · TRY THE KONAMI CODE ANYWHERE
      </div>
    </div>
  )
}
