'use client'
import { useState, useRef, useEffect } from 'react'
import BackToUniverse from '@/components/shared/BackToUniverse'
import { memories } from '@/lib/data/memories'
import type { Memory } from '@/lib/types'

const INTEGRITY_SEED: Record<string, number> = {}
memories.forEach(m => { INTEGRITY_SEED[m.id] = 40 + Math.floor(((m.id.charCodeAt(1) || 0) * 31 + 17) % 56) })

function GlitchText({ text, active }: { text: string; active: boolean }) {
  const [display, setDisplay] = useState(text)
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*'
  useEffect(() => {
    if (!active) { setDisplay(text); return }
    let frame = 0; const total = 18
    const iv = setInterval(() => {
      let out = ''
      for (let i = 0; i < text.length; i++) {
        const lock = Math.floor((i / text.length) * total * 0.6)
        out += frame >= lock ? text[i] : (text[i] === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)])
      }
      setDisplay(out)
      if (++frame > total) { clearInterval(iv); setDisplay(text) }
    }, 44)
    return () => clearInterval(iv)
  }, [active, text])
  return <span>{display}</span>
}

function PhotoPlaceholder({ memory }: { memory: Memory }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = 480; c.height = 320
    const seed = memory.id.charCodeAt(1) || 42
    const hue = (seed * 137.5) % 360
    const grad = ctx.createRadialGradient(240, 160, 0, 240, 160, 320)
    grad.addColorStop(0, `hsla(${hue},40%,15%,1)`)
    grad.addColorStop(1, `hsla(${(hue+30)%360},30%,5%,1)`)
    ctx.fillStyle = grad; ctx.fillRect(0,0,480,320)
    for (let i=0;i<2000;i++) {
      const x=Math.random()*480,y=Math.random()*320,v=Math.random()
      ctx.fillStyle=`rgba(${v>.8?200:80},${v>.8?200:80},${v>.8?200:80},${Math.random()*.12})`
      ctx.fillRect(x,y,1,1)
    }
    for (let y=0;y<320;y+=3) { ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(0,y,480,1) }
    ctx.fillStyle=`hsla(${hue},60%,60%,0.3)`; ctx.font='9px "JetBrains Mono"'; ctx.textAlign='center'
    ctx.fillText(`PHOTO · ${memory.year} · DEVELOPING`,240,306)
    ctx.strokeStyle=`hsla(${hue},60%,50%,0.35)`; ctx.lineWidth=1
    ;([[0,0],[470,0],[0,310],[470,310]] as [number,number][]).forEach(([x,y])=>{
      ctx.beginPath(); ctx.moveTo(x+(x===0?0:8),y); ctx.lineTo(x+(x===0?8:0),y)
      ctx.moveTo(x,y+(y===0?0:8)); ctx.lineTo(x,y+(y===0?8:0)); ctx.stroke()
    })
  }, [memory])
  return <canvas ref={ref} style={{width:'100%',maxWidth:480,height:'auto',display:'block',opacity:0.82}} />
}

function MemoryDetail({ memory }: { memory: Memory }) {
  const integrity = INTEGRITY_SEED[memory.id] ?? 72
  const [glitch, setGlitch] = useState(false)
  useEffect(() => {
    const schedule = () => setTimeout(() => {
      if (Math.random() < 0.28) { setGlitch(true); setTimeout(()=>setGlitch(false),280) }
      schedule()
    }, 1500 + Math.random() * 4000)
    const t = schedule()
    return () => clearTimeout(t)
  }, [memory.id])

  return (
    <div style={{padding:'32px 40px',overflowY:'auto',height:'100%'}}>
      <div style={{fontFamily:'var(--font-mono)',fontSize:8,letterSpacing:'0.22em',color:'rgba(180,83,9,0.55)',marginBottom:10}}>
        {memory.year} · {memory.type.toUpperCase()} · RECORD {memory.id.toUpperCase()}
      </div>
      <h2 style={{fontFamily:'var(--font-sans)',fontSize:'clamp(1.5rem,3vw,2.6rem)',fontWeight:300,color:'#fff',marginBottom:20,letterSpacing:'-0.01em',filter:glitch?'blur(0.5px) translate(1px)':'none',transition:'filter 0.1s'}}>
        <GlitchText text={memory.title} active={glitch} />
      </h2>
      <div style={{height:1,background:'rgba(180,83,9,0.12)',marginBottom:24}} />
      {(memory.type==='note'||memory.type==='object')&&memory.content&&(
        <div style={{fontFamily:memory.type==='note'?'var(--font-serif)':'var(--font-mono)',fontSize:memory.type==='note'?15:12,lineHeight:memory.type==='note'?2.1:1.8,color:'rgba(255,255,255,0.5)',fontStyle:memory.type==='note'?'italic':'normal',maxWidth:560,marginBottom:32,letterSpacing:memory.type==='object'?'0.03em':undefined}}>
          {memory.type==='object'&&<span style={{color:'rgba(180,83,9,0.6)',marginRight:8,fontFamily:'var(--font-mono)',fontSize:8,letterSpacing:'0.18em'}}>OBJECT ·</span>}
          {memory.content}
        </div>
      )}
      {memory.type==='photo'&&(
        <div style={{marginBottom:32}}>
          <PhotoPlaceholder memory={memory} />
          {memory.content&&<div style={{fontFamily:'var(--font-serif)',fontSize:13,lineHeight:1.8,color:'rgba(255,255,255,0.32)',fontStyle:'italic',maxWidth:480,marginTop:14}}>{memory.content}</div>}
        </div>
      )}
      <div style={{display:'flex',gap:24,flexWrap:'wrap',marginTop:16}}>
        <div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:7,letterSpacing:'0.2em',color:'rgba(180,83,9,0.5)',marginBottom:5}}>INTEGRITY</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:80,height:2,background:'rgba(255,255,255,0.07)'}}>
              <div style={{width:`${integrity}%`,height:'100%',background:integrity>70?'rgba(34,197,94,0.7)':integrity>40?'rgba(249,115,22,0.7)':'rgba(239,68,68,0.7)',transition:'width 0.6s'}} />
            </div>
            <span style={{fontFamily:'var(--font-mono)',fontSize:8,color:'rgba(255,255,255,0.25)'}}>{integrity}%</span>
          </div>
        </div>
        <div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:7,letterSpacing:'0.2em',color:'rgba(180,83,9,0.5)',marginBottom:5}}>LAST ACCESSED</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'rgba(255,255,255,0.2)'}}>UNKNOWN</div>
        </div>
        <div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:7,letterSpacing:'0.2em',color:'rgba(180,83,9,0.5)',marginBottom:5}}>TYPE</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'rgba(180,83,9,0.8)',letterSpacing:'0.1em'}}>{memory.type.toUpperCase()}</div>
        </div>
      </div>
    </div>
  )
}

export default function ArchivePage() {
  const [active,setActive]=useState<Memory>(memories[0])
  return (
    <div className="area-page area-scanlines" style={{background:'#060402'}}>
      <BackToUniverse />
      <div style={{padding:'88px 32px 24px',borderBottom:'1px solid rgba(180,83,9,0.08)',backgroundImage:'repeating-linear-gradient(0deg,rgba(180,83,9,0.013) 1px,transparent 1px,transparent 4px)',backgroundSize:'100% 4px'}}>
        <div style={{fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.25em',color:'rgba(180,83,9,0.65)',marginBottom:8}}>SECTOR 03-Ω · ARCHIVES</div>
        <h1 style={{fontFamily:'var(--font-sans)',fontSize:'clamp(3rem,10vw,7rem)',fontWeight:300,lineHeight:0.9,color:'#fff'}}>ARCHIVE</h1>
        <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(255,255,255,0.14)',marginTop:16,letterSpacing:'0.12em'}}>
          {memories.length} RECORDS · PARTIALLY CORRUPTED · INTEGRITY VARIES
        </div>
      </div>
      <div style={{display:'flex',height:'calc(100vh - 200px)'}}>
        <div style={{width:280,borderRight:'1px solid rgba(180,83,9,0.07)',overflowY:'auto',flexShrink:0}}>
          {memories.map(m=>(
            <button key={m.id} onClick={()=>setActive(m)} style={{width:'100%',textAlign:'left',padding:'14px 18px',borderBottom:'1px solid rgba(180,83,9,0.05)',background:active.id===m.id?'rgba(180,83,9,0.06)':'transparent',cursor:'none',transition:'background 0.2s',display:'block'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:7,letterSpacing:'0.15em',color:'rgba(180,83,9,0.58)',marginBottom:3}}>{m.year} · {m.type.toUpperCase()}</div>
                  <div style={{fontFamily:'var(--font-sans)',fontSize:12,fontWeight:300,color:active.id===m.id?'#B45309':'rgba(255,255,255,0.58)'}}>{m.title}</div>
                </div>
                <div style={{flexShrink:0,width:14,height:14,marginTop:2,border:'1px solid rgba(180,83,9,0.22)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <div style={{width:5,height:5,background:active.id===m.id?'#B45309':'transparent',transition:'background 0.2s'}} />
                </div>
              </div>
              <div style={{marginTop:5,height:1.5,background:'rgba(255,255,255,0.04)'}}>
                <div style={{width:`${INTEGRITY_SEED[m.id]??72}%`,height:'100%',background:'rgba(180,83,9,0.32)'}} />
              </div>
            </button>
          ))}
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          <MemoryDetail key={active.id} memory={active} />
        </div>
      </div>
    </div>
  )
}
