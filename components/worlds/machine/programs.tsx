'use client'
// Salvaged from the old Applets world — now installed programs on The Machine.
import { useState, useRef, useEffect } from 'react'

/* ─── Particle Flow ─── */
function ParticleFlow({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Array<{x:number;y:number;vx:number;vy:number;life:number;hue:number}>>([])
  const mouse = useRef({x:0,y:0,down:false})
  const raf = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width=c.offsetWidth; c.height=c.offsetHeight }; resize()
    const spawn = () => { for(let i=0;i<5;i++) particles.current.push({x:mouse.current.x+(Math.random()-.5)*12,y:mouse.current.y+(Math.random()-.5)*12,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4-1.5,life:1,hue:260+Math.random()*80}) }
    const onMove=(e:MouseEvent)=>{const r=c.getBoundingClientRect();mouse.current={...mouse.current,x:e.clientX-r.left,y:e.clientY-r.top};if(mouse.current.down)spawn()}
    const onDown=(e:MouseEvent)=>{mouse.current.down=true;onMove(e)}
    const onUp=()=>{mouse.current.down=false}
    c.addEventListener('mousemove',onMove);c.addEventListener('mousedown',onDown);document.addEventListener('mouseup',onUp)
    const draw=()=>{ctx.fillStyle='rgba(5,3,12,0.18)';ctx.fillRect(0,0,c.width,c.height);particles.current=particles.current.filter(p=>p.life>0.02);particles.current.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.04;p.life*=0.974;ctx.beginPath();ctx.arc(p.x,p.y,p.life*4,0,Math.PI*2);ctx.fillStyle=`hsla(${p.hue},100%,65%,${p.life*0.75})`;ctx.shadowBlur=8;ctx.shadowColor=`hsl(${p.hue},100%,65%)`;ctx.fill();ctx.shadowBlur=0});raf.current=requestAnimationFrame(draw)}
    raf.current=requestAnimationFrame(draw)
    return ()=>{cancelAnimationFrame(raf.current);c.removeEventListener('mousemove',onMove);c.removeEventListener('mousedown',onDown);document.removeEventListener('mouseup',onUp)}
  },[active])
  return <canvas ref={ref} className="w-full h-full" style={{background:'#05030c'}} />
}

/* ─── Color Synth ─── */
function ColorSynth({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({x:.5,y:.5})
  const raf = useRef(0); const t = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight};resize()
    const onMove=(e:MouseEvent)=>{const r=c.getBoundingClientRect();mouse.current={x:(e.clientX-r.left)/c.width,y:(e.clientY-r.top)/c.height}}
    c.addEventListener('mousemove',onMove)
    const draw=()=>{t.current+=0.012;const W=c.width,H=c.height,h1=(mouse.current.x*360+t.current*22)%360,h2=(h1+130+mouse.current.y*70)%360;const grad=ctx.createRadialGradient(mouse.current.x*W,mouse.current.y*H,0,W/2,H/2,Math.max(W,H)*0.85);grad.addColorStop(0,`hsl(${h1},85%,${18+mouse.current.y*18}%)`);grad.addColorStop(0.55,`hsl(${h2},65%,9%)`);grad.addColorStop(1,'#05030c');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);const cols=14,rows=9;for(let r=0;r<rows;r++) for(let col=0;col<cols;col++){const x=(col+.5)*W/cols,y=(r+.5)*H/rows;const dx=x/W-mouse.current.x,dy=y/H-mouse.current.y;const d=Math.hypot(dx,dy),pulse=Math.sin(t.current*3-d*9)*.5+.5;const sz=Math.max(1,(1-d*1.3)*9*pulse);ctx.beginPath();ctx.arc(x,y,sz,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${(1-d*1.5)*.35})`;ctx.fill()};raf.current=requestAnimationFrame(draw)}
    raf.current=requestAnimationFrame(draw)
    return ()=>{cancelAnimationFrame(raf.current);c.removeEventListener('mousemove',onMove)}
  },[active])
  return <canvas ref={ref} className="w-full h-full" />
}

/* ─── Grid Distort ─── */
function GridDistort({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({x:-999,y:-999})
  const raf = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight};resize()
    const onMove=(e:MouseEvent)=>{const r=c.getBoundingClientRect();mouse.current={x:e.clientX-r.left,y:e.clientY-r.top}}
    c.addEventListener('mousemove',onMove)
    const draw=()=>{const W=c.width,H=c.height;ctx.fillStyle='#05030c';ctx.fillRect(0,0,W,H);const gs=38,R=130;for(let gx=0;gx<=W;gx+=gs) for(let gy=0;gy<=H;gy+=gs){const dx=gx-mouse.current.x,dy=gy-mouse.current.y,d=Math.hypot(dx,dy);const push=d<R?(R-d)/R:0;const x=gx+(dx/Math.max(d,1))*push*32,y=gy+(dy/Math.max(d,1))*push*32;ctx.beginPath();ctx.arc(x,y,Math.max(.4,push*3.5+.4),0,Math.PI*2);ctx.fillStyle=`rgba(168,85,247,${.18+push*.7})`;ctx.fill()};raf.current=requestAnimationFrame(draw)}
    raf.current=requestAnimationFrame(draw)
    return ()=>{cancelAnimationFrame(raf.current);c.removeEventListener('mousemove',onMove)}
  },[active])
  return <canvas ref={ref} className="w-full h-full" style={{background:'#05030c'}} />
}

/* ─── Void Painter ─── */
const BRUSH_LABELS=['PLASMA','ICE','FIRE','ELECTRIC','AURORA']
const BRUSH_COLORS=[
  (l:number,t:number)=>`hsl(${270+l*80+t*20},100%,${50+l*35}%)`,
  (l:number,t:number)=>`hsl(${185+l*50+t*5},100%,${45+l*45}%)`,
  (l:number,t:number)=>`hsl(${l*45+t*10},100%,${38+l*42}%)`,
  (l:number,t:number)=>`hsl(${55+l*30+t*15},100%,${55+l*35}%)`,
  (l:number,t:number)=>`hsl(${130+l*100+t*8},100%,${45+l*40}%)`,
]
function VoidPainter({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Array<{x:number;y:number;vx:number;vy:number;life:number;mode:number;t:number}>>([])
  const mouse = useRef({x:0,y:0,down:false})
  const modeRef = useRef(0); const tRef = useRef(0); const raf = useRef(0)
  const [mode,setMode]=useState(0)
  useEffect(()=>{modeRef.current=mode},[mode])
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight};resize()
    const spawn=()=>{const spread=modeRef.current===3?30:14;for(let i=0;i<6;i++) particles.current.push({x:mouse.current.x+(Math.random()-.5)*spread,y:mouse.current.y+(Math.random()-.5)*spread,vx:(Math.random()-.5)*(modeRef.current===3?6:3),vy:(Math.random()-.5)*(modeRef.current===3?6:3)-(modeRef.current===2?2:0.3),life:1,mode:modeRef.current,t:tRef.current})}
    const onMove=(e:MouseEvent)=>{const r=c.getBoundingClientRect();mouse.current={...mouse.current,x:e.clientX-r.left,y:e.clientY-r.top};if(mouse.current.down)spawn()}
    const onDown=(e:MouseEvent)=>{mouse.current.down=true;onMove(e)}
    const onUp=()=>{mouse.current.down=false}
    c.addEventListener('mousemove',onMove);c.addEventListener('mousedown',onDown);document.addEventListener('mouseup',onUp)
    const draw=()=>{tRef.current+=0.016;ctx.fillStyle='rgba(0,0,4,0.055)';ctx.fillRect(0,0,c.width,c.height);particles.current=particles.current.filter(p=>p.life>0.01);particles.current.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.mode===2)p.vy-=0.06;else if(p.mode===1)p.vy+=0.02;p.life*=(p.mode===1?0.97:p.mode===3?0.93:0.963);const col=BRUSH_COLORS[p.mode](p.life,p.t);const sz=p.life*(p.mode===3?5:p.mode===4?8:6);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(0.1,sz),0,Math.PI*2);ctx.fillStyle=col;ctx.shadowBlur=p.mode===4?20:12;ctx.shadowColor=col;ctx.globalAlpha=p.life*(p.mode===4?0.6:0.85);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1});raf.current=requestAnimationFrame(draw)}
    raf.current=requestAnimationFrame(draw)
    return ()=>{cancelAnimationFrame(raf.current);c.removeEventListener('mousemove',onMove);c.removeEventListener('mousedown',onDown);document.removeEventListener('mouseup',onUp)}
  },[active])
  return (
    <div className="w-full h-full relative" style={{background:'#000'}}>
      <canvas ref={ref} className="w-full h-full" />
      <div style={{position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',display:'flex',gap:5}}>
        {BRUSH_LABELS.map((l,i)=>(
          <button key={l} onClick={()=>setMode(i)} style={{fontFamily:'monospace',fontSize:7,letterSpacing:'0.1em',padding:'3px 7px',cursor:'pointer',border:`1px solid ${mode===i?'rgba(168,85,247,0.8)':'rgba(255,255,255,0.1)'}`,color:mode===i?'rgba(168,85,247,1)':'rgba(255,255,255,0.25)',background:mode===i?'rgba(168,85,247,0.07)':'transparent',transition:'all 0.2s'}}>{l}</button>
        ))}
      </div>
    </div>
  )
}

/* ─── Type Collider ─── */
const WORDS=['DIGGER','RUNNER','BUILDER','COLORADO','SIGNAL','NOISE','THRESHOLD','WORMHOLE','SYSTEM','EDGE','DRIFT','TEXTURE','MOUNTAIN','SHADER','LOOP','14,115 FT','ANOMALY','EXPLORE']
interface TW{x:number;y:number;vx:number;vy:number;w:number;text:string;col:string;angle:number;av:number}
function TypeCollider({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const words = useRef<TW[]>([])
  const mouse = useRef({x:-999,y:-999})
  const raf = useRef(0)
  const COLS=['rgba(202,255,0,0.9)','rgba(0,255,234,0.9)','rgba(255,45,120,0.9)','rgba(255,255,255,0.7)']
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    ctx.font='bold 13px monospace'
    const resize=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight;words.current=WORDS.map(text=>{const w=ctx.measureText(text).width+20;return{x:Math.random()*(c.width-w)+w/2,y:Math.random()*(c.height-30)+15,vx:(Math.random()-.5)*2.2,vy:(Math.random()-.5)*2.2,w,text,col:COLS[Math.floor(Math.random()*COLS.length)],angle:0,av:(Math.random()-.5)*0.02}})};resize()
    const onMove=(e:MouseEvent)=>{const r=c.getBoundingClientRect();mouse.current={x:e.clientX-r.left,y:e.clientY-r.top}}
    const onClick2=()=>{words.current.forEach(w=>{const dx=w.x-mouse.current.x,dy=w.y-mouse.current.y,d=Math.hypot(dx,dy)+1;if(d<120){w.vx+=dx/d*5;w.vy+=dy/d*5}})}
    c.addEventListener('mousemove',onMove);c.addEventListener('click',onClick2)
    const H=14
    const draw=()=>{ctx.fillStyle='rgba(5,3,12,0.28)';ctx.fillRect(0,0,c.width,c.height);words.current.forEach((w,i)=>{const dx=w.x-mouse.current.x,dy=w.y-mouse.current.y,d=Math.hypot(dx,dy);if(d<90&&d>0){w.vx+=dx/d*0.35;w.vy+=dy/d*0.35};for(let j=i+1;j<words.current.length;j++){const b=words.current[j];const cdx=w.x-b.x,cdy=w.y-b.y,cd=Math.hypot(cdx,cdy);if(cd<(w.w+b.w)/2+H&&cd>0){const f=0.15;w.vx+=cdx/cd*f;w.vy+=cdy/cd*f;b.vx-=cdx/cd*f;b.vy-=cdy/cd*f}};w.vx*=0.985;w.vy*=0.985;w.av*=0.99;w.x+=w.vx;w.y+=w.vy;w.angle+=w.av;if(w.x<w.w/2){w.x=w.w/2;w.vx=Math.abs(w.vx)};if(w.x>c.width-w.w/2){w.x=c.width-w.w/2;w.vx=-Math.abs(w.vx)};if(w.y<H){w.y=H;w.vy=Math.abs(w.vy)};if(w.y>c.height-H){w.y=c.height-H;w.vy=-Math.abs(w.vy)};ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.angle);ctx.font='bold 13px monospace';ctx.fillStyle=w.col;ctx.shadowBlur=8;ctx.shadowColor=w.col;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(w.text,0,0);ctx.shadowBlur=0;ctx.restore()});raf.current=requestAnimationFrame(draw)}
    raf.current=requestAnimationFrame(draw)
    return ()=>{cancelAnimationFrame(raf.current);c.removeEventListener('mousemove',onMove);c.removeEventListener('click',onClick2)}
  },[active])
  return <canvas ref={ref} className="w-full h-full" style={{background:'#05030c'}} />
}

/* ─── Lissajous ─── */
function Lissajous({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({x:.5,y:.5})
  const raf = useRef(0); const tRef = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight};resize()
    const onMove=(e:MouseEvent)=>{const r=c.getBoundingClientRect();mouse.current={x:(e.clientX-r.left)/c.width,y:(e.clientY-r.top)/c.height}}
    c.addEventListener('mousemove',onMove)
    const draw=()=>{tRef.current+=0.008;const W=c.width,H=c.height,cx=W/2,cy=H/2,a=Math.round(1+mouse.current.x*6),b=Math.round(1+mouse.current.y*6),delta=tRef.current*0.4,R=Math.min(W,H)*0.42;ctx.fillStyle='rgba(5,3,12,0.12)';ctx.fillRect(0,0,W,H);ctx.beginPath();const steps=2400;for(let i=0;i<=steps;i++){const t2=(i/steps)*Math.PI*2*Math.max(a,b);const x=cx+R*Math.sin(a*t2+delta),y=cy+R*Math.sin(b*t2);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)};const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,`hsla(${tRef.current*30%360},100%,65%,0.7)`);grad.addColorStop(0.5,`hsla(${(tRef.current*30+120)%360},100%,65%,0.7)`);grad.addColorStop(1,`hsla(${(tRef.current*30+240)%360},100%,65%,0.7)`);ctx.strokeStyle=grad;ctx.lineWidth=1.2;ctx.shadowBlur=6;ctx.shadowColor=`hsl(${tRef.current*30%360},100%,65%)`;ctx.stroke();ctx.shadowBlur=0;raf.current=requestAnimationFrame(draw)}
    raf.current=requestAnimationFrame(draw)
    return ()=>{cancelAnimationFrame(raf.current);c.removeEventListener('mousemove',onMove)}
  },[active])
  return <canvas ref={ref} className="w-full h-full" style={{background:'#05030c'}} />
}

/* ─── Flow Field ─── */
function FlowField({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0); const tRef = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight};resize()
    const noise=(x:number,y:number,z:number)=>{const X=Math.floor(x),Y=Math.floor(y),u=x-X,v=y-Y;const fade=(t:number)=>t*t*t*(t*(t*6-15)+10);const uf=fade(u),vf=fade(v);const h=(n:number)=>{const h2=n*1234567891%1073741823|0;return (h2^(h2>>15))/1073741823};const lerp2=(a:number,b:number,t:number)=>a+t*(b-a);return lerp2(lerp2(h(X+Y*57+Math.floor(z)*131),h(X+1+Y*57+Math.floor(z)*131),uf),lerp2(h(X+(Y+1)*57+Math.floor(z)*131),h(X+1+(Y+1)*57+Math.floor(z)*131),uf),vf)}
    type P={x:number;y:number;life:number;hue:number}
    const particles:P[]=Array.from({length:700},()=>({x:Math.random()*c.width,y:Math.random()*c.height,life:Math.random(),hue:Math.random()*360}))
    const draw=()=>{tRef.current+=0.005;ctx.fillStyle='rgba(5,3,12,0.032)';ctx.fillRect(0,0,c.width,c.height);particles.forEach(p=>{const angle=(noise(p.x/160,p.y/160,tRef.current)*2-1)*Math.PI*2;p.x+=Math.cos(angle)*1.8;p.y+=Math.sin(angle)*1.8;p.hue+=0.5;p.life+=0.008;if(p.x<0||p.x>c.width||p.y<0||p.y>c.height||p.life>1){p.x=Math.random()*c.width;p.y=Math.random()*c.height;p.life=0};const alpha=Math.sin(p.life*Math.PI)*0.55;ctx.beginPath();ctx.arc(p.x,p.y,1.1,0,Math.PI*2);ctx.fillStyle=`hsla(${p.hue},90%,65%,${alpha})`;ctx.fill()});raf.current=requestAnimationFrame(draw)}
    raf.current=requestAnimationFrame(draw)
    return ()=>cancelAnimationFrame(raf.current)
  },[active])
  return <canvas ref={ref} className="w-full h-full" style={{background:'#05030c'}} />
}

/* ─── Crystal Growth ─── */
interface Branch{x:number;y:number;angle:number;len:number;depth:number;hue:number}
function CrystalGrow({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  const seeds = useRef<Array<{queue:Branch[];done:boolean}>>([])
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight};resize()
    const MAX=7
    const spawnSeed=(x:number,y:number)=>{const hue=Math.random()*360;seeds.current.push({queue:[{x,y,angle:-Math.PI/2,len:c.height*0.08,depth:0,hue}],done:false})}
    const onClick2=(e:MouseEvent)=>{const r=c.getBoundingClientRect();spawnSeed(e.clientX-r.left,e.clientY-r.top)}
    c.addEventListener('click',onClick2)
    if(seeds.current.length===0) spawnSeed(c.width/2,c.height*0.85)
    const step=()=>{seeds.current.forEach(seed=>{if(seed.queue.length===0){seed.done=true;return};const batch=seed.queue.splice(0,3);batch.forEach((b:Branch)=>{if(b.depth>MAX||b.len<2) return;const ex=b.x+Math.cos(b.angle)*b.len,ey=b.y+Math.sin(b.angle)*b.len;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(ex,ey);const lw=Math.max(0.3,(MAX-b.depth)*0.4);ctx.strokeStyle=`hsla(${b.hue+b.depth*22},80%,${50+b.depth*6}%,${0.7-b.depth*0.07})`;ctx.lineWidth=lw;ctx.shadowBlur=4;ctx.shadowColor=`hsl(${b.hue+b.depth*22},100%,65%)`;ctx.stroke();ctx.shadowBlur=0;const spread=0.35+b.depth*0.04;const n=b.depth<3?3:2;for(let i=0;i<n;i++){const angle=b.angle+(Math.random()-.5)*spread+(i-(n-1)/2)*spread*0.6;seed.queue.push({x:ex,y:ey,angle,len:b.len*0.68,depth:b.depth+1,hue:b.hue})}})});seeds.current=seeds.current.filter((s:{queue:Branch[];done:boolean})=>!s.done||s.queue.length>0);raf.current=requestAnimationFrame(step)}
    raf.current=requestAnimationFrame(step)
    return ()=>{cancelAnimationFrame(raf.current);c.removeEventListener('click',onClick2)}
  },[active])
  return <canvas ref={ref} className="w-full h-full" style={{background:'#05030c'}} />
}

/* ─── Wave Builder ─── */
interface Wave{freq:number;amp:number;phase:number;col:string;decay:number}
function WaveBuilder({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0); const tRef = useRef(0)
  const waves = useRef<Wave[]>([{freq:1,amp:0.25,phase:0,col:'rgba(202,255,0,0.7)',decay:1},{freq:2,amp:0.15,phase:0.4,col:'rgba(0,255,234,0.6)',decay:1},{freq:3,amp:0.08,phase:1.2,col:'rgba(255,45,120,0.5)',decay:1}])
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight};resize()
    const onClick2=(e:MouseEvent)=>{const r=c.getBoundingClientRect();const cx=(e.clientX-r.left)/c.width,cy=(e.clientY-r.top)/c.height;const freq=1+Math.round(cx*5);const amp=0.05+cy*0.25;const col=['rgba(202,255,0,0.65)','rgba(0,255,234,0.65)','rgba(255,45,120,0.65)','rgba(168,85,247,0.65)','rgba(249,115,22,0.65)'][Math.floor(Math.random()*5)];waves.current=[...waves.current.slice(-6),{freq,amp,phase:tRef.current,col,decay:1}]}
    c.addEventListener('click',onClick2)
    const draw=()=>{tRef.current+=0.018;ctx.fillStyle='rgba(5,3,12,0.22)';ctx.fillRect(0,0,c.width,c.height);const H=c.height,W=c.width,mid=H/2;waves.current.forEach(w=>{w.decay=Math.max(0.08,w.decay-0.0006);ctx.beginPath();for(let i=0;i<=W;i++){const x=i/W;const y=mid+Math.sin(x*Math.PI*2*w.freq+tRef.current*2+w.phase)*H*w.amp*w.decay;i===0?ctx.moveTo(i,y):ctx.lineTo(i,y)};ctx.strokeStyle=w.col;ctx.lineWidth=1.5;ctx.shadowBlur=5;ctx.shadowColor=w.col;ctx.stroke();ctx.shadowBlur=0});ctx.beginPath();for(let i=0;i<=W;i++){const x=i/W;const y=mid+waves.current.reduce((sum,w)=>sum+Math.sin(x*Math.PI*2*w.freq+tRef.current*2+w.phase)*H*w.amp*w.decay,0);i===0?ctx.moveTo(i,y):ctx.lineTo(i,y)};ctx.strokeStyle='rgba(255,255,255,0.85)';ctx.lineWidth=2;ctx.shadowBlur=8;ctx.shadowColor='rgba(255,255,255,0.5)';ctx.stroke();ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(0,mid);ctx.lineTo(W,mid);ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;ctx.stroke();raf.current=requestAnimationFrame(draw)}
    raf.current=requestAnimationFrame(draw)
    return ()=>{cancelAnimationFrame(raf.current);c.removeEventListener('click',onClick2)}
  },[active])
  return <canvas ref={ref} className="w-full h-full" style={{background:'#05030c'}} />
}

/* ─── Reaction Diffusion ─── */
function ReactionDiffusion({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  const stateRef = useRef<{A:Float32Array;B:Float32Array;nA:Float32Array;nB:Float32Array;W:number;H:number}|null>(null)
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const W=Math.max(80,Math.floor(c.offsetWidth/4)),H=Math.max(60,Math.floor(c.offsetHeight/4))
    c.width=c.offsetWidth;c.height=c.offsetHeight
    const len=W*H,A=new Float32Array(len).fill(1),B=new Float32Array(len),nA=new Float32Array(len),nB=new Float32Array(len)
    for(let i=0;i<10;i++){const cx=Math.floor(Math.random()*W),cy=Math.floor(Math.random()*H);for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){const x=cx+dx,y=cy+dy;if(x>=0&&x<W&&y>=0&&y<H)B[y*W+x]=1}}
    stateRef.current={A,B,nA,nB,W,H}
    const dA=1.0,dB=0.5,feed=0.055,kill=0.062
    const onClick2=(e:MouseEvent)=>{const r=c.getBoundingClientRect();const cx=Math.floor((e.clientX-r.left)/c.width*W),cy=Math.floor((e.clientY-r.top)/c.height*H);const s=stateRef.current;if(!s) return;for(let dy=-5;dy<=5;dy++) for(let dx=-5;dx<=5;dx++){const x=cx+dx,y=cy+dy;if(x>=0&&x<W&&y>=0&&y<H){s.A[y*W+x]=0.5;s.B[y*W+x]=0.25}}}
    c.addEventListener('click',onClick2)
    const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H
    const tc=tmp.getContext('2d')!
    const step=()=>{const s=stateRef.current;if(!s) return;for(let iter=0;iter<8;iter++){for(let y=0;y<H;y++) for(let x=0;x<W;x++){const i=y*W+x,t=(y>0?s.A[(y-1)*W+x]:s.A[i]),b=(y<H-1?s.A[(y+1)*W+x]:s.A[i]),l=(x>0?s.A[y*W+x-1]:s.A[i]),r=(x<W-1?s.A[y*W+x+1]:s.A[i]),lapA=t+b+l+r-4*s.A[i],t2=(y>0?s.B[(y-1)*W+x]:s.B[i]),b2=(y<H-1?s.B[(y+1)*W+x]:s.B[i]),l2=(x>0?s.B[y*W+x-1]:s.B[i]),r2=(x<W-1?s.B[y*W+x+1]:s.B[i]),lapB=t2+b2+l2+r2-4*s.B[i],a=s.A[i],bv=s.B[i],abb=a*bv*bv;s.nA[i]=Math.max(0,Math.min(1,a+dA*lapA-abb+feed*(1-a)));s.nB[i]=Math.max(0,Math.min(1,bv+dB*lapB+abb-(kill+feed)*bv))};s.A.set(s.nA);s.B.set(s.nB)};const imgD=tc.createImageData(W,H);for(let y=0;y<H;y++) for(let x=0;x<W;x++){const v=Math.max(0,Math.min(255,(s.A[y*W+x]-s.B[y*W+x])*255));const px=(y*W+x)*4;imgD.data[px]=v*0.3|0;imgD.data[px+1]=v*0.12|0;imgD.data[px+2]=v;imgD.data[px+3]=255};tc.putImageData(imgD,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(tmp,0,0,c.width,c.height);raf.current=requestAnimationFrame(step)}
    raf.current=requestAnimationFrame(step)
    return ()=>{cancelAnimationFrame(raf.current);c.removeEventListener('click',onClick2)}
  },[active])
  return <canvas ref={ref} className="w-full h-full" />
}

/* ─── Orbits ─── */
function Orbits({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0); const tRef = useRef(0)
  const mouse = useRef({x:.5,y:.5})
  useEffect(() => {
    const c = ref.current; if (!c || !active) return
    const ctx = c.getContext('2d')!
    const resize=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight};resize()
    const onMove=(e:MouseEvent)=>{const r=c.getBoundingClientRect();mouse.current={x:(e.clientX-r.left)/c.width,y:(e.clientY-r.top)/c.height}}
    c.addEventListener('mousemove',onMove)
    const BODIES=[
      {r:55,speed:0.8,size:6,col:'#3B82F6',phase:0,trail:[] as Array<{x:number;y:number}>},
      {r:90,speed:0.5,size:9,col:'#22C55E',phase:1.2,trail:[]},
      {r:130,speed:0.3,size:7,col:'#F97316',phase:2.4,trail:[]},
      {r:170,speed:0.2,size:11,col:'#A855F7',phase:0.8,trail:[]},
      {r:210,speed:0.12,size:8,col:'#60A5FA',phase:3.1,trail:[]},
      {r:35,speed:2.1,size:4,col:'rgba(202,255,0,0.9)',phase:0.5,trail:[]},
    ]
    const draw=()=>{tRef.current+=0.012;const W=c.width,H=c.height;const cx=W/2+(mouse.current.x-.5)*40,cy=H/2+(mouse.current.y-.5)*40;ctx.fillStyle='rgba(5,3,12,0.22)';ctx.fillRect(0,0,W,H);ctx.beginPath();ctx.arc(cx,cy,10,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.9)';ctx.shadowBlur=20;ctx.shadowColor='rgba(255,255,255,0.6)';ctx.fill();ctx.shadowBlur=0;BODIES.forEach(b=>{const angle=tRef.current*b.speed+b.phase;const x=cx+Math.cos(angle)*b.r,y=cy+Math.sin(angle)*b.r;b.trail.push({x,y});if(b.trail.length>60)b.trail.shift();ctx.beginPath();ctx.strokeStyle=`${b.col}22`;ctx.lineWidth=0.5;ctx.arc(cx,cy,b.r,0,Math.PI*2);ctx.stroke();b.trail.forEach((pt,ti)=>{const a=ti/b.trail.length;ctx.beginPath();ctx.arc(pt.x,pt.y,b.size*a*0.6,0,Math.PI*2);ctx.fillStyle=b.col.startsWith('rgba')?b.col:`${b.col}${Math.floor(a*120).toString(16).padStart(2,'0')}`;ctx.fill()});ctx.beginPath();ctx.arc(x,y,b.size,0,Math.PI*2);ctx.fillStyle=b.col;ctx.shadowBlur=12;ctx.shadowColor=b.col;ctx.fill();ctx.shadowBlur=0});raf.current=requestAnimationFrame(draw)}
    raf.current=requestAnimationFrame(draw)
    return ()=>{cancelAnimationFrame(raf.current);c.removeEventListener('mousemove',onMove)}
  },[active])
  return <canvas ref={ref} className="w-full h-full" style={{background:'#05030c'}} />
}

/* ─── Registry ─── */
export const PROGRAMS = [
  {id:'pf',  title:'ParticleFlow.EXE',     sub:'click + drag',      Comp:ParticleFlow},
  {id:'cs',  title:'ColorSynth.EXE',       sub:'move mouse',        Comp:ColorSynth},
  {id:'gd',  title:'GridDistort.EXE',      sub:'move mouse',        Comp:GridDistort},
  {id:'vp',  title:'VoidPainter.EXE',      sub:'click + drag',      Comp:VoidPainter},
  {id:'tc',  title:'TypeCollider.EXE',     sub:'click to explode',  Comp:TypeCollider},
  {id:'lj',  title:'Lissajous.EXE',        sub:'move mouse',        Comp:Lissajous},
  {id:'ff',  title:'FlowField.EXE',        sub:'watch',             Comp:FlowField},
  {id:'cg',  title:'CrystalGrow.EXE',      sub:'click to grow',     Comp:CrystalGrow},
  {id:'wb',  title:'WaveBuilder.EXE',      sub:'click to add wave', Comp:WaveBuilder},
  {id:'rd',  title:'ReactionDiffusion.EXE',sub:'click to seed',     Comp:ReactionDiffusion},
  {id:'ob',  title:'Orbits.EXE',           sub:'move to shift',     Comp:Orbits},
]
