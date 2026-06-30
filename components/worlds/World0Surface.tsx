'use client'
import { useState, useEffect } from 'react'
import { useWorldStore } from '@/lib/world-store'

const P = '#7700bb'
const NAVY = '#000033'

function SecHeader({ label }: { label: string }) {
  return (
    <div style={{ background:P, padding:'3px 10px', color:'#fff', fontSize:10, fontWeight:'bold', display:'flex', alignItems:'center', gap:5, userSelect:'none' }}>
      <span style={{ color:'#00ff00', fontSize:9 }}>●</span>
      {label}
    </div>
  )
}

export default function World0Surface() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const d = new Date(); let h = d.getHours()
      const m = d.getMinutes().toString().padStart(2,'0')
      const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
      setTime(`${h.toString().padStart(2,'0')}:${m} ${ap}`)
    }
    tick(); const iv = setInterval(tick, 10000); return () => clearInterval(iv)
  }, [])

  const go = () => navigateTo(1, { type: 'door' })

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', background:'#bdbdbd', fontFamily:'Arial,Helvetica,sans-serif', fontSize:12, userSelect:'none', border:'3px ridge #f5f5f5' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        .wa { color:#0000cc; text-decoration:underline; cursor:pointer }
        .wa:hover { color:#cc0000 }
        .retroPanel { border:2px ridge #bdbdbd; margin:4px; box-shadow:inset 1px 1px 0 rgba(255,255,255,.45), inset -1px -1px 0 rgba(0,0,0,.35) }
        .ws::-webkit-scrollbar { width:16px; height:16px }
        .ws::-webkit-scrollbar-track { background:#c0c0c0; border:1px solid #808080 }
        .ws::-webkit-scrollbar-thumb { background:#c0c0c0; border:2px outset #ffffff; min-height:20px }
        .ws::-webkit-scrollbar-button { background:#c0c0c0; border:2px outset #ffffff; display:block; width:16px; height:14px }
      `}</style>

      {/* ── BROWSER CHROME ── */}
      <div style={{ height:40, background:'linear-gradient(#eeeeee,#a8a8a8)', display:'flex', alignItems:'center', gap:5, padding:'0 8px', borderBottom:'3px ridge #808080', flexShrink:0 }}>
        {['◀','▶','▷','🏠','↻','🏡'].map((b,i) => (
          <button key={i} style={{ width:28, height:26, background:'#d0d0d0', border:'2px outset #eeeeee', color:'#555', fontSize:i>2?13:12, cursor:'pointer', padding:0, lineHeight:1 }}>{b}</button>
        ))}
        <div style={{ flex:1, maxWidth:'58%', height:24, background:'#fff', border:'2px inset #d0d0d0', padding:'0 8px', display:'flex', alignItems:'center', fontSize:13, color:'#000' }}>
          tyleremdur.com
        </div>
        <span style={{ fontSize:11, color:'#111', padding:'0 14px', marginLeft:'auto' }}>Alcohol 40% or Higher</span>
        <span style={{ fontSize:18 }}>🌐</span>
        <span style={{ fontSize:11, color:'#111', paddingLeft:2 }}>Viewable With Any Browser</span>
      </div>

      {/* ── MAIN 3-COLUMN ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0, gap:0, padding:4 }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width:'22%', flexShrink:0, display:'flex', flexDirection:'column', overflowY:'auto', background:'#d6d6d6', border:'2px inset #777' }} className="ws">

          {/* TYLER'S WEB ZONE header */}
          <div style={{
            background:NAVY,
            backgroundImage:[
              'radial-gradient(1px 1px at 18px 12px,rgba(255,255,255,.9) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 48px 32px,rgba(255,255,255,.8) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 82px 8px,rgba(255,255,255,.7) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 112px 26px,rgba(255,255,255,.9) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 145px 6px,rgba(255,255,255,.6) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 175px 20px,rgba(255,255,255,.8) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 28px 48px,rgba(255,255,255,.5) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 92px 52px,rgba(255,255,255,.7) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 155px 44px,rgba(255,255,255,.6) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 205px 16px,rgba(255,255,255,.8) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 60px 60px,rgba(255,255,255,.5) 0%,transparent 100%)',
              'radial-gradient(1px 1px at 130px 55px,rgba(255,255,255,.6) 0%,transparent 100%)',
            ].join(','),
            backgroundSize:'100% 70px',
            padding:'14px 16px 16px',
            borderBottom:`2px ridge ${P}`,
          }} className="retroPanel">
            <div style={{ fontFamily:'Impact,"Arial Black",sans-serif', fontSize:27, color:'#ffcc00', letterSpacing:'0.05em', lineHeight:1.15, textShadow:'2px 2px #000' }}>
              TYLER'S WEB ZONE
            </div>
            <div style={{ fontSize:14, color:'#00d6ff', marginTop:8, textAlign:'center' }}>on the World Wide Web!!!</div>
          </div>

          {/* NAVIGATION */}
          <SecHeader label="NAVIGATION" />
          <div style={{ background:'#f0f0f0', padding:'6px 0', borderBottom:`1px solid ${P}` }} className="retroPanel">
            {([['📋',"What's New?"],['⬇️','Download'],['⚙️','Installation'],['💡','Useful Tips'],['🦉','Using OWL']] as [string,string][]).map(([ic,tx]) => (
              <div key={tx} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 16px', borderBottom:'1px solid #ddd', cursor:'pointer' }}>
                <span style={{ fontSize:13 }}>{ic}</span>
                <a className="wa" style={{ fontSize:11 }}>{tx}</a>
              </div>
            ))}
          </div>

          {/* SYSTEM STATUS */}
          <SecHeader label="SYSTEM STATUS" />
          <div style={{ background:'#080808', padding:'13px 18px', borderBottom:`1px solid ${P}` }} className="retroPanel">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
              <span style={{ width:10, height:10, background:'#00ff00', borderRadius:'50%', display:'inline-block', boxShadow:'0 0 5px #00ff00', flexShrink:0 }} />
              <span style={{ color:'#fff', fontSize:11 }}>STATUS: <strong>Online</strong></span>
            </div>
            <div style={{ fontSize:10, color:'#888', lineHeight:1.9 }}>LAST UPDATED:<br/>June 2026</div>
          </div>

          {/* VISITOR COUNTER */}
          <SecHeader label="VISITOR COUNTER" />
          <div style={{ background:'#080808', padding:'14px 18px', textAlign:'center', borderBottom:`1px solid ${P}` }} className="retroPanel">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:18 }}>
              <div style={{ fontSize:40 }}>🌍</div>
              <div style={{ fontFamily:'"Courier New",monospace', fontSize:31, color:'#e8ff00', letterSpacing:'6px', textShadow:'0 0 8px #99ff00' }}>
                010951
              </div>
            </div>
            <div style={{ fontSize:9, color:'#777', marginTop:4 }}>visitors since June 2026</div>
          </div>

          {/* ABOUT TYLER */}
          <SecHeader label="ABOUT TYLER" />
          <div style={{ background:'#080808', padding:'12px 14px' }} className="retroPanel">
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <div style={{ width:72, height:72, background:'radial-gradient(circle at 52% 38%, #f0b086 0 15%, transparent 16%), radial-gradient(circle at 48% 45%, #d98a63 0 27%, transparent 28%), radial-gradient(circle at 45% 24%, #17110d 0 22%, transparent 23%), linear-gradient(135deg,#10240e,#2b4a22)', border:'2px ridge #aaa', flexShrink:0 }} />
              <div style={{ fontSize:13, color:'#ccc', lineHeight:2 }}>
                Software engineer.<br/>Builder of worlds.<br/>Boulder, Colorado.
              </div>
            </div>
            <a className="wa" onClick={go} style={{ fontSize:10, color:'#8888ff' }}>More about me →</a>
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0, borderTop:'2px inset #777', borderBottom:'2px inset #777' }}>

          {/* HERO */}
          <div style={{ flex:'0 0 49%', display:'flex', flexDirection:'column', border:'2px ridge #bdbdbd', borderBottom:'2px solid #808080', minHeight:0, margin:'0 4px 0' }}>
            <div style={{ background:P, padding:'3px 8px', color:'#fff', fontSize:11, fontWeight:'bold', flexShrink:0 }}>
              Tyler Emdur's Multiverse World!
            </div>
            <div style={{
              flex:1, background:'#000',
              backgroundImage:[
                'radial-gradient(circle,rgba(255,255,255,.95) 1px,transparent 1px)',
                'radial-gradient(circle,rgba(255,255,255,.8) 1px,transparent 1px)',
                'radial-gradient(circle,rgba(255,255,255,.65) 1px,transparent 1px)',
                'radial-gradient(circle,rgba(255,255,255,.5) 1px,transparent 1px)',
              ].join(','),
              backgroundSize:'80px 60px,55px 70px,30px 42px,22px 28px',
              backgroundPosition:'10px 8px,26px 18px,8px 28px,16px 5px',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              padding:'14px', position:'relative', overflow:'hidden',
            }}>
              <div style={{ fontFamily:'"VT323","Courier New",monospace', fontSize:'clamp(14px,1.8vw,22px)', color:'#00ff66', letterSpacing:'0.3em', marginBottom:4 }}>
                WELCOME TO
              </div>
              <div style={{ fontFamily:'Impact,"Arial Black",sans-serif', fontSize:'clamp(30px,4.2vw,56px)', color:'#fff', lineHeight:0.98, textAlign:'center', textShadow:'3px 3px #222', marginBottom:8, letterSpacing:'0.04em' }}>
                TYLER EMDUR'S<br/>MULTIVERSE
              </div>
              <div style={{ fontFamily:'"VT323","Courier New",monospace', fontSize:'clamp(12px,1.4vw,18px)', color:'#00ff66', marginBottom:12, letterSpacing:'0.12em' }}>
                17 worlds. Infinite possibilities.
              </div>
              <div style={{ fontSize:11, color:'#ccc', marginBottom:14, fontStyle:'italic' }}>Choose your destination...</div>
              <div style={{ display:'flex', gap:34, marginBottom:8 }}>
                <div onClick={go} style={{ background:'linear-gradient(#d50a8d,#8a005a)', border:'4px outset #ff55aa', padding:'12px 28px', cursor:'pointer', textAlign:'center', minWidth:126, boxShadow:'0 0 0 2px #3a0030' }}>
                  <div style={{ fontFamily:'Impact,"Arial Black",sans-serif', fontSize:'clamp(16px,2vw,22px)', color:'#fff', letterSpacing:'0.12em' }}>ENTER</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.85)', fontStyle:'italic' }}>the Galaxy</div>
                </div>
                <div onClick={go} style={{ background:'linear-gradient(#0024d6,#00005f)', border:'4px outset #3333ff', padding:'12px 28px', cursor:'pointer', textAlign:'center', minWidth:126, boxShadow:'0 0 0 2px #000033' }}>
                  <div style={{ fontFamily:'Impact,"Arial Black",sans-serif', fontSize:'clamp(16px,2vw,22px)', color:'#fff', letterSpacing:'0.12em' }}>ENTER</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.7)', fontStyle:'italic' }}>seriously, enter</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:80, fontSize:9, color:'rgba(255,255,255,.35)' }}>
                <span>Updated June 2026</span>
                <span>Updated June 2026</span>
              </div>
              <div style={{ position:'absolute', bottom:18, left:34, fontSize:54, filter:'saturate(1.3)' }}>🌍</div>
              <div style={{ position:'absolute', top:'46%', right:'7%', fontSize:34, transform:'rotate(-18deg)' }}>🚀</div>
              <div style={{ position:'absolute', right:'12%', top:'54%', width:150, height:1, background:'repeating-linear-gradient(90deg,#f7e600 0 4px,transparent 4px 10px)', transform:'rotate(-24deg)', opacity:0.75 }} />
            </div>
          </div>

          {/* MIDDLE ROW */}
          <div style={{ flex:'0 0 31%', display:'flex', borderBottom:'2px solid #808080', minHeight:0, margin:'0 4px' }}>
            {/* Welcome */}
            <div style={{ flex:'0 0 50%', display:'flex', flexDirection:'column', borderRight:'2px solid #808080', minWidth:0 }}>
              <div style={{ background:P, padding:'3px 8px', color:'#fff', fontSize:11, fontWeight:'bold', flexShrink:0 }}>WELCOME TO MY HOMEPAGE!!!</div>
              <div style={{ flex:1, background:'#fff', padding:'12px 14px', overflowY:'auto', fontSize:12, color:'#000', lineHeight:1.65, fontFamily:'"Courier New",monospace' }} className="ws">
                <div style={{ marginBottom:8 }}>I'm a software engineer and everything I build is cool. So the following multiverse of 17 websites represents my work and interests.</div>
                <div style={{ fontSize:10, color:'#333', marginBottom:10 }}>Boulder, CO • healthreinvented@gmail.com<br/>github: tyler-emdur</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  <a className="wa" onClick={go} style={{ fontSize:10 }}>[ Enter the Multiverse → ]</a>
                  <a className="wa" style={{ fontSize:10 }}>[ About Me ]</a>
                  <a className="wa" style={{ fontSize:10 }}>[ Projects ]</a>
                </div>
              </div>
            </div>
            {/* Log */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
              <div style={{ background:P, padding:'3px 8px', color:'#fff', fontSize:11, fontWeight:'bold', flexShrink:0 }}>LATEST LOG ENTRY</div>
              <div style={{ flex:1, background:'linear-gradient(180deg,#07075a,#00001f)', padding:'10px 14px', overflowY:'auto', fontSize:12, color:'#b7b7d8', lineHeight:1.6, fontFamily:'"Courier New",monospace' }} className="ws">
                <div style={{ color:'#6699ff', textDecoration:'underline', cursor:'pointer', marginBottom:6 }}>Friday 20th June, 2026</div>
                <div style={{ marginBottom:10 }}>Production of the page commenced. Building world 17. This is taking longer than expected but I am not an expert at multiverse architecture.</div>
                <div style={{ color:'#6699ff', textDecoration:'underline', cursor:'pointer', marginBottom:6 }}>Captain's log — 51589.7</div>
                <div>We are approaching world base 16. We will visit all sectors. Damage caused by creative overreach.</div>
              </div>
            </div>
          </div>

          {/* 17 WORLDS STRIP */}
          <div style={{ flex:'0 0 92px', display:'flex', flexDirection:'column', minHeight:0, margin:'0 4px 4px', border:'2px ridge #bdbdbd' }}>
            <div style={{ background:P, padding:'3px 8px', color:'#fff', fontSize:11, fontWeight:'bold', flexShrink:0 }}>17 WORLDS INSIDE</div>
            <div style={{ flex:1, background:'#fff', display:'flex', alignItems:'center', padding:'5px 6px', gap:6, overflow:'hidden' }}>
              <div style={{ width:18, height:22, background:'#c0c0c0', border:'1px outset #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, cursor:'pointer', flexShrink:0 }}>◀</div>
              {([['#0d001a','🌌'],['#000080','🌐'],['#555','👤'],['#880000','🧃'],['#004400','⚽'],['#1a004a','🌈'],['#550022','❤️']] as [string,string][]).map(([bg,em],i) => (
                <div key={i} onClick={go} style={{ flexShrink:0, width:82, height:54, background:bg, border:'3px ridge #bdbdbd', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
                  {em}
                </div>
              ))}
              <div onClick={go} style={{ flexShrink:0, width:54, height:54, background:'#eee', border:'2px solid #999', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:'bold', color:'#333', textAlign:'center' }}>
                & MORE
              </div>
              <div style={{ width:18, height:22, background:'#c0c0c0', border:'1px outset #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, cursor:'pointer', flexShrink:0 }}>▶</div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width:'23%', flexShrink:0, overflowY:'auto', border:'2px inset #777', background:'#d6d6d6', display:'flex', flexDirection:'column' }} className="ws">

          {/* INDEX */}
          <div style={{ border:'2px ridge #bdbdbd', margin:4, background:'#f4f4f4' }}>
            <div style={{ background:P, padding:'5px 10px', fontSize:14, fontWeight:'bold', color:'#fff', letterSpacing:'0.08em', borderBottom:'1px solid #ccc' }}>INDEX</div>
            <div style={{ padding:'8px', display:'flex', flexDirection:'column', gap:6 }}>
              {['WORLDS','ABOUT','PROJECTS','CONTACT','SOURCE CODE'].map(t => (
                <div key={t} onClick={go} style={{ background:'#ffdf72', border:'2px outset #ffeeb1', padding:'7px 10px', fontSize:11, fontWeight:'bold', color:'#000080', textAlign:'center', cursor:'pointer', textDecoration:'underline' }}>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* NOW PLAYING */}
          <SecHeader label="♪ NOW PLAYING" />
          <div style={{ background:'#000', padding:'12px 16px', borderBottom:`1px solid ${P}` }} className="retroPanel">
            <div style={{ fontFamily:'"Courier New",monospace', fontSize:11, color:'#00cc00', marginBottom:2 }}>media.exe</div>
            <div style={{ fontFamily:'"Courier New",monospace', fontSize:10, color:'#00cc00', marginBottom:8 }}>by tyler emdur</div>
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              {(['⏮','⏸','⏹'] as string[]).map(b => <button key={b} style={{ background:'#333', border:'1px outset #555', width:22, height:20, fontSize:10, cursor:'pointer', color:'#ccc', padding:0 }}>{b}</button>)}
              <div style={{ flex:1, height:5, background:'#222', marginLeft:4, border:'1px inset #111', position:'relative' }}>
                <div style={{ position:'absolute', left:0, top:0, height:'100%', width:'38%', background:'#006600' }} />
              </div>
            </div>
          </div>

          {/* NEW MEDIA */}
          <SecHeader label="NEW MEDIA • NEW ART" />
          <div style={{ background:NAVY, padding:'18px 18px', borderBottom:`1px solid ${P}`, minHeight:150 }} className="retroPanel">
            <div style={{ fontSize:13, color:'#ccc', lineHeight:1.9, fontFamily:'"Courier New",monospace' }}>
              tyler emdur • 2026<br/>
              boulder colorado<br/>
              software • running<br/>
              17 worlds inside
            </div>
            <a className="wa" onClick={go} style={{ color:'#ff8cff', fontSize:13, display:'block', marginTop:18 }}>→ enter now</a>
          </div>

          {/* LINK LOG */}
          <SecHeader label="♦ LINK LOG" />
          <div style={{ background:'#fff', padding:'12px 14px', fontSize:12, color:'#333', lineHeight:1.8, flex:1 }} className="retroPanel">
            <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                This is a <a className="wa">IN SYNC WITH *N SYNC</a> site.<br/>
                Want to join <a className="wa">"IN SYNC WITH *N SYNC"</a> the official fan club?
                <div style={{ marginTop:8 }}>
                  <a className="wa" onClick={go}>Click here to join now!</a>
                </div>
              </div>
              <div style={{ width:82, height:82, background:'linear-gradient(135deg,#f1c5a0,#1a1a2e 45%,#050510)', flexShrink:0, border:'2px inset #aaa', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>👥</div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div style={{ height:34, background:'#0a0a2a', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', flexShrink:0, borderTop:'3px ridge #777' }}>
        <span style={{ fontSize:10, color:'#aaa' }}>
          This is a{' '}<a className="wa" onClick={go} style={{ color:'#6699ff' }}>TYLER EMDUR MULTIVERSE</a>{' '}site.
        </span>
        <span style={{ fontSize:10, color:'#aaa' }}>
          [<a className="wa" style={{ color:'#6699ff' }}>Prev</a>]{' '}
          [<a className="wa" onClick={go} style={{ color:'#6699ff' }}>Enter</a>]{' '}
          [<a className="wa" style={{ color:'#6699ff' }}>Random</a>]{' '}
          [<a className="wa" style={{ color:'#6699ff' }}>List Sites</a>]
        </span>
        <span style={{ fontFamily:'"Courier New",monospace', fontSize:11, color:'#aaa' }}>{time}</span>
      </div>
    </div>
  )
}
