'use client'
import { useState, useEffect } from 'react'
import { useWorldStore } from '@/lib/world-store'

export default function World0Surface() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [blink, setBlink] = useState(true)
  const [visitorN] = useState(() => Math.floor(Math.random() * 800) + 1200)

  useEffect(() => {
    const iv = setInterval(() => setBlink(b => !b), 600)
    return () => clearInterval(iv)
  }, [])

  const enter = () => navigateTo(1, { type: 'door' })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'grid',
      gridTemplateColumns: '28% 21% 30% 21%',
      gridTemplateRows: '42px calc((100% - 42px) * 0.44) calc((100% - 42px) * 0.32) calc((100% - 42px) * 0.24)',
      background: '#c0c0c0',
      overflow: 'hidden',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }}>
      <style>{`
        @keyframes w0-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes w0-marquee { from{transform:translateX(100%)} to{transform:translateX(-100%)} }
        @keyframes w0-star { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        .w0-blink { animation: w0-blink 1s steps(1) infinite }
        .w0-marquee { display:inline-block; animation: w0-marquee 18s linear infinite; white-space:nowrap }
        .w0-star { animation: w0-star 2s ease-in-out infinite }
        a { cursor:pointer; text-decoration:underline }
      `}</style>

      {/* ── ROW 0: Catscape toolbar ── */}
      <div style={{
        gridColumn: '1 / -1', gridRow: '1',
        background: '#c0c0c0',
        borderBottom: '2px solid #808080',
        display: 'flex', alignItems: 'center',
        padding: '0 6px', gap: 2,
        boxShadow: 'inset 0 1px 0 #fff',
      }}>
        {/* Browser chrome buttons */}
        {['◀','▶','✕','🏠','🔄','⭐'].map((s,i) => (
          <div key={i} style={{ width: 28, height: 24, background: '#c0c0c0', border: '2px outset #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, cursor:'pointer' }}>{s}</div>
        ))}
        <div style={{ flex:1, height:20, background:'#fff', border:'2px inset #808080', padding:'0 6px', fontSize:11, display:'flex', alignItems:'center', color:'#000080' }}>
          http://www.tyleremdur.com/multiverse/
        </div>
        {/* Icon row */}
        {[
          {icon:'🍸',label:'Alcohol 40% or Higher'},
          {icon:'🐱',label:'Catscape Meow! 2.0'},
          {icon:'📚',label:''},
          {icon:'🏠',label:''},
          {icon:'⚠️',label:''},
          {icon:'❤️',label:''},
          {icon:'🌐',label:'Viewable With Any Browser'},
        ].map(({icon,label},i) => (
          <div key={i} style={{ display:'flex',flexDirection:'column',alignItems:'center', padding:'0 4px', cursor:'pointer' }}>
            <div style={{ fontSize:16 }}>{icon}</div>
            {label && <div style={{ fontSize:6, color:'#333', whiteSpace:'nowrap', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis' }}>{label}</div>}
          </div>
        ))}
        <div style={{ marginLeft:'auto', fontSize:9, color:'#444', padding:'0 6px', whiteSpace:'nowrap' }}>
          💾 C:(FAT) 2.1 GB Free
        </div>
      </div>

      {/* ── ROW 1, COL 1: Personal homepage ── */}
      <div style={{
        gridColumn:'1', gridRow:'2',
        background:'#000066',
        backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
        backgroundSize:'40px 40px, 18px 18px',
        backgroundPosition:'0 0, 12px 14px',
        overflow:'hidden', position:'relative',
        borderRight:'2px solid #808080', borderBottom:'2px solid #808080',
      }}>
        <div style={{ padding:'10px 12px', fontFamily:'"Comic Sans MS",cursive' }}>
          <div style={{ fontSize:22, color:'#ff9900', fontWeight:'bold', textShadow:'1px 1px #000', marginBottom:4 }}>
            TYLER'S WEB ZONE
          </div>
          <div style={{ fontSize:12, color:'#00ffff', marginBottom:10 }}>
            on the World Wide Web!!!&nbsp;
            <span className="w0-blink" style={{color:'#ff0000',fontSize:10}}>★ NEW ★</span>
          </div>
          <div style={{ overflow:'hidden', marginBottom:8 }}>
            <span className="w0-marquee" style={{fontSize:9,color:'#ffff00',letterSpacing:'0.05em'}}>
              ★ WELCOME TO MY PAGE ★ BOULDER CO ★ SOFTWARE ENGINEER ★ TRAIL RUNNER ★ THANK YOU FOR VISITING ★
            </span>
          </div>
          <div style={{ fontSize:10, color:'#ffffff', lineHeight:1.9 }}>
            Hi! My name is Tyler and this is my little corner of the internet. I am a programmer who lives in Boulder, Colorado.<br/><br/>
            <span style={{color:'#ffff00'}}>This site contains:</span><br/>
            ⭐ 17 different worlds<br/>
            ⭐ Each one a different website<br/>
            ⭐ Work in progress!!!
          </div>
          <div style={{ marginTop:10, fontSize:9, color:'#aaaaaa' }}>
            Last updated: June 2026<br/>
            <a style={{color:'#00ffff'}}>Sign my Guestbook!</a>
          </div>
        </div>
      </div>

      {/* ── ROW 1, COL 2: ATTENTION panel ── */}
      <div style={{
        gridColumn:'2', gridRow:'2',
        background:'#cc99ff',
        overflow:'hidden',
        borderRight:'2px solid #808080', borderBottom:'2px solid #808080',
        display:'flex', flexDirection:'column',
      }}>
        {/* Scrollbar-like strip */}
        <div style={{ background:'#9966cc', padding:'3px 8px', fontSize:9, color:'#fff', borderBottom:'1px solid #6644aa' }}>
          About — Tyler Emdur Multiverse
        </div>
        <div style={{ padding:'10px 12px', flex:1, fontFamily:'"Comic Sans MS",cursive' }}>
          <div style={{ fontSize:13, color:'#006600', fontWeight:'bold', marginBottom:4 }}>
            ATTENTION!<br/>ATTENTION!
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <div style={{width:12,height:12,background:'#00cc00',borderRadius:'50%'}} />
            <span style={{fontSize:9,color:'#333'}}>About Me</span>
          </div>
          <div style={{ fontSize:10, color:'#330066', lineHeight:1.9 }}>
            This is a portfolio website made by Tyler Emdur, a software engineer in Boulder, Colorado.<br/><br/>
            It contains <strong>17 worlds</strong>. Each world is a completely different website with its own aesthetic and personality.<br/><br/>
            It is a work in progress art and coding project.
          </div>
          <div style={{ marginTop:8, fontSize:13, color:'#cc0000', fontFamily:'"Comic Sans MS",cursive', cursor:'pointer' }} onClick={enter}>
            About Me
          </div>
          <div style={{ fontSize:13, color:'#cc0000', fontFamily:'"Comic Sans MS",cursive', marginTop:4, cursor:'pointer' }} onClick={enter}>
            MENU
          </div>
        </div>
      </div>

      {/* ── ROW 1, COL 3: THE ENTER PANEL (most important) ── */}
      <div style={{
        gridColumn:'3', gridRow:'2',
        display:'flex', flexDirection:'column',
        overflow:'hidden',
        borderRight:'2px solid #808080', borderBottom:'2px solid #808080',
      }}>
        {/* Green header */}
        <div style={{ background:'#006600', padding:'6px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:14, color:'#ffff00', fontFamily:'Impact,"Arial Black",sans-serif', letterSpacing:'0.05em' }}>
            Tyler Emdur's Multiverse World!
          </div>
        </div>
        {/* Purple/banner stripe like Ricky Martin */}
        <div style={{ background:'linear-gradient(90deg,#660099,#9900cc,#660099)', height:6 }} />
        <div style={{ background:'repeating-linear-gradient(90deg,#ffee00 0,#ffee00 14px,#ff0000 14px,#ff0000 28px)', height:8 }} />

        {/* Main area */}
        <div style={{ flex:1, background:'#330066', padding:'12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:11, color:'#ddccff', fontFamily:'Georgia,serif', marginBottom:14, textAlign:'center', fontStyle:'italic' }}>
            Choose your destination...
          </div>

          {/* Dual entrance buttons — the Ricky Martin clone */}
          <div style={{ display:'flex', gap:10, marginBottom:12 }}>
            <div
              onClick={enter}
              style={{
                background:'#e0e0e0', border:'3px outset #ffffff',
                padding:'10px 14px', textAlign:'center', cursor:'pointer',
                width:110, fontFamily:'Arial,sans-serif',
              }}
            >
              <div style={{ fontSize:15, fontWeight:'bold', color:'#000000', marginBottom:3 }}>ENTER</div>
              <div style={{ fontSize:9, color:'#444', fontStyle:'italic' }}>the Galaxy</div>
            </div>
            <div
              onClick={enter}
              style={{
                background:'#e0e0e0', border:'3px outset #ffffff',
                padding:'10px 14px', textAlign:'center', cursor:'pointer',
                width:110, fontFamily:'Arial,sans-serif',
              }}
            >
              <div style={{ fontSize:15, fontWeight:'bold', color:'#000000', marginBottom:3 }}>ENTER</div>
              <div style={{ fontSize:9, color:'#444', fontStyle:'italic' }}>seriously, enter</div>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', width:234, fontSize:8, color:'rgba(200,180,255,0.5)' }}>
            <span>Updated June 2026</span>
            <span>Updated June 2026</span>
          </div>
        </div>
      </div>

      {/* ── ROW 1, COL 4: Index panel ── */}
      <div style={{
        gridColumn:'4', gridRow:'2',
        background:'#f5f5f5',
        borderBottom:'2px solid #808080',
        overflow:'hidden',
      }}>
        <div style={{ background:'#000080', padding:'4px 8px', color:'#fff', fontSize:10, borderBottom:'1px solid #000040' }}>
          Welcome
        </div>
        <div style={{ padding:'6px 10px', fontSize:10, lineHeight:2.1, color:'#000080' }}>
          {[
            {icon:'📁',text:"What's New?"},
            {icon:'⬇️',text:'Download'},
            {icon:'⚙️',text:'Installation'},
            {icon:'💡',text:'Usefull Tips'},
            {icon:'🦉',text:'Using OWL'},
          ].map(({icon,text}) => (
            <div key={text} style={{ display:'flex', gap:6, alignItems:'center' }}>
              <span style={{fontSize:12}}>{icon}</span>
              <a style={{color:'#0000cc',fontSize:10}}>{text}</a>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid #aaa', padding:'6px 10px' }}>
          <div style={{ fontSize:14, fontFamily:'Impact,sans-serif', textAlign:'center', marginBottom:6 }}>
            <span style={{color:'#000080'}}>i</span>
            <span style={{color:'#cc0000'}}>N</span>
            <span style={{color:'#000080'}}>D</span>
            <span style={{color:'#cc0000'}}>e</span>
            <span style={{color:'#000080'}}>X</span>
          </div>
          {['WORLDS','ABOUT','CONTACT','SOURCE CODE'].map(t => (
            <div key={t} style={{ background:'#ffe066', border:'1px solid #cc9900', padding:'3px 6px', marginBottom:3, fontSize:9, textAlign:'center', cursor:'pointer', fontWeight:'bold' }} onClick={enter}>{t}</div>
          ))}
        </div>
      </div>

      {/* ── ROW 2, COL 1: Captain's log style ── */}
      <div style={{
        gridColumn:'1', gridRow:'3',
        background:'#000066',
        overflow:'hidden',
        borderRight:'2px solid #808080', borderBottom:'2px solid #808080',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ background:'#000033', borderBottom:'1px solid #003', padding:'2px 6px' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ width:22, height:18, background:'#c0c0c0', border:'1px solid #888', fontSize:9, display:'flex', alignItems:'center', justifyContent:'center' }}>📰</div>
            <div style={{ fontSize:8, color:'#aaaaff', fontFamily:'"Courier New",monospace' }}>personal.log</div>
          </div>
        </div>
        <div style={{ flex:1, padding:'8px 10px', fontFamily:'"Courier New",monospace', overflow:'hidden' }}>
          <div style={{ fontSize:9, color:'#6688ff', marginBottom:6 }}>
            <a style={{color:'#aaaaff'}}>Friday 20th June, 2026</a>
          </div>
          <div style={{ fontSize:9, color:'#cccccc', lineHeight:1.8, marginBottom:8 }}>
            Production of the page commenced. Building world 17. This is taking longer than expected but I am not an expert at multiverse architecture.
          </div>
          <div style={{ fontSize:9, color:'#6688ff', marginBottom:6 }}>
            <a style={{color:'#aaaaff'}}>Captain's Log — 51589.7</a>
          </div>
          <div style={{ fontSize:9, color:'#cccccc', lineHeight:1.8 }}>
            We are approaching world base 16. We will visit all sectors. Damage caused by creative overreach.
          </div>
        </div>
      </div>

      {/* ── ROW 2, COL 2: 404 / Cannot display ── */}
      <div style={{
        gridColumn:'2', gridRow:'3',
        background:'#fff',
        borderRight:'2px solid #808080', borderBottom:'2px solid #808080',
        overflow:'hidden',
      }}>
        <div style={{ background:'#fff', padding:'8px 10px', fontFamily:'Arial,sans-serif' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:18 }}>ℹ️</span>
            <span style={{ fontSize:11, fontWeight:'bold', color:'#000080' }}>The page cannot be displ...</span>
          </div>
          <div style={{ fontSize:9, color:'#333', lineHeight:1.8 }}>
            The page you are looking for has 17 worlds inside it. Please click ENTER to find what you are looking for.
          </div>
          <div style={{ marginTop:8 }}>
            <a style={{color:'#0000cc', fontSize:10}} onClick={enter}>HOW THE INTERNET WORKS →</a>
          </div>
        </div>
      </div>

      {/* ── ROW 2, COL 3+4: "I'm the coolest" personal page ── */}
      <div style={{
        gridColumn:'3 / 5', gridRow:'3',
        background:'#9966cc',
        overflow:'hidden',
        borderBottom:'2px solid #808080',
        display:'flex', flexDirection:'column',
        padding:'10px 14px',
        fontFamily:'"Comic Sans MS",cursive',
      }}>
        <div style={{ fontSize:14, color:'#ffff00', fontWeight:'bold', marginBottom:8 }}>
          Welcome to My Homepage!!!
        </div>
        <div style={{ background:'#ffffff', padding:'8px 10px', marginBottom:8, flex:1, overflow:'hidden' }}>
          <div style={{ fontSize:11, color:'#000', lineHeight:1.7 }}>
            I'm a software engineer and everything I build is cool. So the following multiverse of 17 websites representing my work and interests is cool.
          </div>
          <div style={{ marginTop:6, fontSize:10, color:'#333', lineHeight:1.7 }}>
            <strong>Boulder, CO · healthreinvented@gmail.com · github: tyler-emdur</strong>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a style={{color:'#ffff00',fontSize:10}} onClick={enter}>[Enter the Multiverse →]</a>
          <a style={{color:'#aaffaa',fontSize:10}}>About Me</a>
          <a style={{color:'#aaaaff',fontSize:10}}>Projects</a>
        </div>
      </div>

      {/* ── ROW 3, COL 1+2: Webring / You are visited ── */}
      <div style={{
        gridColumn:'1 / 3', gridRow:'4',
        background:'#f0f0f0',
        borderRight:'2px solid #808080',
        overflow:'hidden',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ flex:1, display:'flex', gap:0, overflow:'hidden' }}>
          {/* Left photo placeholder */}
          <div style={{ width:90, background:'#ddd', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, borderRight:'1px solid #bbb', fontSize:9, color:'#999', textAlign:'center', padding:4 }}>
            [tyler<br/>emdur<br/>2024]
          </div>
          {/* Center text */}
          <div style={{ flex:1, padding:'8px 12px', fontFamily:'Times New Roman,serif', fontSize:11, color:'#333', lineHeight:1.8 }}>
            This is a <a style={{color:'#0000cc'}} onClick={enter}>TYLER EMDUR MULTIVERSE</a> site.<br/>
            Want to explore{' '}
            <a style={{color:'#0000cc'}} onClick={enter}>TYLER EMDUR's WORLDS</a>{' '}
            the web?
            <div style={{ marginTop:6, fontSize:10 }}>
              [<a style={{color:'#0000cc'}} onClick={enter}>Prev</a>]
              [<a style={{color:'#0000cc'}} onClick={enter}>Enter</a>]
              [<a style={{color:'#0000cc'}} onClick={enter}>Random</a>]
              [<a style={{color:'#0000cc'}} onClick={enter}>List Sites</a>]
            </div>
          </div>
          {/* Right photo placeholder */}
          <div style={{ width:90, background:'#ddd', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, borderLeft:'1px solid #bbb', fontSize:9, color:'#999', textAlign:'center', padding:4 }}>
            [boulder<br/>colorado<br/>2026]
          </div>
        </div>
      </div>

      {/* ── ROW 3, COL 3: Not Online / Visitor count ── */}
      <div style={{
        gridColumn:'3', gridRow:'4',
        background:'#ffffff',
        borderRight:'2px solid #808080',
        overflow:'hidden',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ background:'#888', padding:'2px 6px', fontSize:9, color:'#fff', display:'flex', gap:8 }}>
          <span>Not Online</span>
          <span style={{opacity:0.6}}>right now</span>
        </div>
        <div style={{ padding:'8px 12px', flex:1 }}>
          <div style={{ fontSize:10, color:'#333', marginBottom:8 }}>
            <strong>healthreinvented@gmail.com</strong>
          </div>
          <div style={{ fontSize:9, color:'#555', lineHeight:1.8 }}>
            Visitor number:<br/>
            <span style={{ fontFamily:'monospace', fontSize:14, color:'#006600' }}>0{visitorN.toLocaleString()}</span>
          </div>
          <div style={{ marginTop:8 }}>
            <div
              onClick={enter}
              style={{ background:'#000080', color:'#fff', fontSize:10, padding:'4px 10px', cursor:'pointer', display:'inline-block', border:'2px outset #4444ff' }}
            >
              {blink ? '▶ ENTER GALAXY' : '  ENTER GALAXY'}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3, COL 4: M3dia style dark ── */}
      <div style={{
        gridColumn:'4', gridRow:'4',
        background:'#110022',
        overflow:'hidden',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ padding:'8px 10px', flex:1 }}>
          <div style={{ fontFamily:'"Comic Sans MS",cursive', fontSize:16, color:'#cc44ff', textShadow:'0 0 8px #9900ff', marginBottom:6 }}>
            new media · new art
          </div>
          <div style={{ fontSize:9, color:'#9966cc', lineHeight:1.9 }}>
            tyler emdur · 2026<br/>
            boulder colorado<br/>
            software · running<br/>
            17 worlds inside
          </div>
          <div style={{ marginTop:8 }}>
            <a style={{color:'#cc44ff',fontSize:10}} onClick={enter}>→ enter now</a>
          </div>
        </div>
        <div style={{ background:'#220044', padding:'4px 8px', fontSize:8, color:'rgba(180,120,255,0.5)' }}>
          Viewable With Any Browser
        </div>
      </div>
    </div>
  )
}
