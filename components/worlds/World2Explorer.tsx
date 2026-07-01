'use client'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

export default function World2Depth() {
  const navigateTo = useWorldStore(s => s.navigateTo)

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#000080',
      backgroundImage: [
        'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
        'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
        'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
      ].join(', '),
      backgroundSize: '50px 50px, 23px 23px, 11px 11px',
      backgroundPosition: '0 0, 14px 14px, 7px 20px',
      fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
      color: '#ffff00',
      overflowY: 'auto',
      position: 'fixed',
      inset: 0,
    }}>
      <style>{`
        @keyframes w2-blink { 0%,100%{opacity:1} 49%{opacity:1} 50%,99%{opacity:0} }
        @keyframes w2-marquee { from{transform:translateX(100vw)} to{transform:translateX(-100%)} }
        @keyframes w2-pulse { 0%,100%{text-shadow:0 0 8px #ffff00,0 0 16px #ff9900} 50%{text-shadow:0 0 20px #ffff00,0 0 40px #ff6600} }
        .w2-blink { animation: w2-blink 1s steps(1) infinite }
        .w2-marquee { animation: w2-marquee 22s linear infinite; white-space:nowrap; display:inline-block }
        .w2-pulse { animation: w2-pulse 2s ease-in-out infinite }
        a { color:#00ffff; text-decoration:underline; cursor:pointer }
        a:hover { color:#ffff00 }
      `}</style>

      {/* Marquee bar */}
      <div style={{ background:'#000000', overflow:'hidden', padding:'3px 0', borderBottom:'2px solid #ffff00', position:'sticky', top:0, zIndex:10 }}>
        <span className="w2-marquee" style={{ fontSize:11, letterSpacing:'0.08em', color:'#00ffff' }}>
          ★ WELCOME TO TYLER'S PLACE ON THE WEB!!! ★ BOULDER COLORADO ★ PROGRAMMER + TRAIL RUNNER ★ PLEASE SIGN MY GUESTBOOK ★ DIGGER - MUSIC YOU DIDN'T KNOW YOU NEEDED ★ BOULDER MARATHON OCT 2024 - 3:41:22 ★ YOU ARE VISITOR #001337 ★
        </span>
      </div>

      {/* Big header */}
      <div style={{ textAlign:'center', padding:'24px 16px 16px', borderBottom:'4px double #ffff00' }}>
        <div className="w2-pulse" style={{ fontSize:'clamp(2rem,8vw,4.5rem)', color:'#ff6600', fontWeight:'bold', lineHeight:1 }}>
          TYLER'S PLACE
        </div>
        <div style={{ fontSize:'clamp(1rem,3vw,1.6rem)', color:'#00ffff', marginTop:4 }}>
          on the World Wide Web!!!&nbsp;&nbsp;
          <span className="w2-blink" style={{ color:'#ff0000', fontSize:'0.8em' }}>★ UPDATED 2026 ★</span>
        </div>
        <div style={{ marginTop:10, fontSize:12, color:'rgba(255,255,255,0.5)' }}>
          Est. 1997 · Boulder CO · Netscape 4.0 · 800×600
        </div>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'16px 12px 40px' }}>

        {/* Welcome box */}
        <div style={{ border:'3px solid #ffff00', padding:'14px 18px', marginBottom:14, background:'rgba(0,0,60,0.7)' }}>
          <div style={{ fontSize:17, color:'#ff9900', textDecoration:'underline', marginBottom:10 }}>
            🌟 Hello and Welcome!!! :)
          </div>
          <div style={{ fontSize:13, color:'#ffffff', lineHeight:1.85 }}>
            Hi! My name is Tyler and this is my personal page on the internet. I am a software engineer
            who lives in Boulder, Colorado. I really love programming and going trail running in the mountains.
            I have been making stuff on the computer for as long as I can remember!!
            I made this website because I wanted a place to put my stuff and stuff.
            I hope you enjoy looking around. Don't forget to check out my projects and please
            <a> sign my guestbook</a> before you leave!!! :) :) <br/><br/>
            <span style={{ color:'#ffff00' }}>P.S.</span> — This site is best viewed at night with the lights off.
          </div>
        </div>

        {/* Under construction */}
        <div style={{
          backgroundImage:'repeating-linear-gradient(45deg,#ffff00 0,#ffff00 10px,#000 10px,#000 20px)',
          padding:'6px', marginBottom:14,
        }}>
          <div style={{ background:'#ffffff', padding:'10px 16px', textAlign:'center', color:'#000000', fontFamily:'"Comic Sans MS",cursive' }}>
            <div style={{ fontSize:15, fontWeight:'bold' }}>⚠️ THIS PAGE IS UNDER CONSTRUCTION ⚠️</div>
            <div style={{ fontSize:10, marginTop:4, color:'#333' }}>
              More content coming soon! Check back often!!!<br/>
              <span className="w2-blink">I am working very hard on it :)</span>
            </div>
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div style={{ border:'2px solid #00ffff', padding:'10px 14px', background:'rgba(0,0,80,0.6)' }}>
            <div style={{ fontSize:14, color:'#ff9900', textDecoration:'underline', marginBottom:8 }}>About Me</div>
            <div style={{ fontSize:11, color:'#fff', lineHeight:2.1 }}>
              Name: Tyler Emdur<br/>
              Location: Boulder, CO<br/>
              Job: Software Engineer<br/>
              Fav Color: <span style={{ color:'#00ffff' }}>cyan</span> (obviously)<br/>
              Email: <a href="mailto:healthreinvented@gmail.com" style={{ fontSize:10 }}>healthreinvented@gmail.com</a>
            </div>
          </div>
          <div style={{ border:'2px solid #00ffff', padding:'10px 14px', background:'rgba(0,0,80,0.6)' }}>
            <div style={{ fontSize:14, color:'#ff9900', textDecoration:'underline', marginBottom:8 }}>My Interests</div>
            <div style={{ fontSize:11, color:'#fff', lineHeight:2.1 }}>
              ⭐ TypeScript / React / Next.js<br/>
              🏃 Trail Running (mountains!!!)<br/>
              🎵 Music Discovery<br/>
              🏔️ Colorado 14ers<br/>
              💾 Building Cool Stuff<br/>
              ☕ Coffee (always)
            </div>
          </div>
        </div>

        {/* Projects */}
        <div style={{ border:'2px solid #ffff00', padding:'10px 14px', marginBottom:14, background:'rgba(0,0,80,0.6)' }}>
          <div style={{ fontSize:14, color:'#ff9900', textDecoration:'underline', marginBottom:8 }}>My Projects</div>
          <div style={{ fontSize:11, color:'#fff', lineHeight:2.3 }}>
            🔥 <a>THIS WEBSITE</a> — A multiverse of 17 worlds. You're inside World 2 right now. Neat!<br/>
            🎵 <a>DIGGER</a> — Music discovery app. Deployed 2024. Find music you didn't know you needed.<br/>
            🏃 <a>BOULDER MARATHON</a> — Oct 2024. Time: 3:41:22. It was hard but I finished.<br/>
            🏔️ <a>PIKES PEAK</a> — 14,115 ft. Summit August 2024. Woke up at 3:00am. Worth it.
          </div>
        </div>

        {/* Visitor counter */}
        <div style={{ textAlign:'center', marginBottom:14, padding:'14px', border:'2px dotted #ffff00', background:'rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize:11, color:'#aaa', marginBottom:6 }}>You are visitor number:</div>
          <div style={{
            fontFamily:'"Courier New", monospace', fontSize:30,
            color:'#00ff00', letterSpacing:'0.3em',
            textShadow:'0 0 10px #00ff00',
            background:'#000', display:'inline-block', padding:'4px 14px',
            border:'3px inset #004400',
          }}>001,337</div>
          <div style={{ fontSize:9, color:'#888', marginTop:6 }}>
            <a>Sign My Guestbook!</a> &nbsp;|&nbsp; <a>View Guestbook</a> &nbsp;|&nbsp; <a>Web Rings I Belong To</a>
          </div>
        </div>

        {/* Links / running log */}
        <div style={{ border:'2px solid #ff00ff', padding:'10px 14px', marginBottom:14, background:'rgba(40,0,40,0.5)' }}>
          <div style={{ fontSize:14, color:'#ff00ff', textDecoration:'underline', marginBottom:8 }}>🏃 Running Log (partial)</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10, color:'#fff' }}>
            <thead>
              <tr style={{ background:'rgba(255,0,255,0.2)' }}>
                <th style={{ border:'1px solid #ff00ff', padding:'3px 6px', textAlign:'left' }}>Race / Route</th>
                <th style={{ border:'1px solid #ff00ff', padding:'3px 6px' }}>Date</th>
                <th style={{ border:'1px solid #ff00ff', padding:'3px 6px' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Boulder Marathon','Oct 2024','3:41:22'],
                ['Golden Gate Canyon 25K','Jun 2024','muddy, completed'],
                ['Pikes Peak Summit','Aug 2024','5h 25m'],
                ['Maroon Bells Loop','Sep 2023','6h 10m'],
                ['Mt. Elbert 14er','2023','summit'],
              ].map(([r,d,t],i) => (
                <tr key={i} style={{ background: i%2 ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
                  <td style={{ border:'1px solid rgba(255,0,255,0.3)', padding:'3px 6px' }}>{r}</td>
                  <td style={{ border:'1px solid rgba(255,0,255,0.3)', padding:'3px 6px', textAlign:'center' }}>{d}</td>
                  <td style={{ border:'1px solid rgba(255,0,255,0.3)', padding:'3px 6px', textAlign:'center', fontFamily:'monospace' }}>{t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hot links */}
        <div style={{ border:'2px solid #ffff00', padding:'10px 14px', marginBottom:24, background:'rgba(0,0,60,0.6)' }}>
          <div style={{ fontSize:14, color:'#ff9900', textDecoration:'underline', marginBottom:8 }}>🔗 HOT LINKS!!!</div>
          <div style={{ fontSize:12, lineHeight:2.4 }}>
            🌐 <a onClick={() => navigateTo(1, { type: 'door' })}>← BACK TO MAIN PAGE (UNIVERSE)</a><br/>
            📧 <a href="mailto:healthreinvented@gmail.com">EMAIL ME! (I try to write back)</a><br/>
            🐙 <a>GitHub: tyler-emdur</a><br/>
            🎵 <a>DIGGER - My Music App</a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', borderTop:'2px solid #444', paddingTop:14 }}>
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:12 }}>
            {['Viewable With Any Browser','HTML 3.2 Compliant','No Cookies!','Made with ❤️'].map(b => (
              <span key={b} style={{ padding:'2px 8px', background:'#808080', color:'#000', fontSize:8, fontFamily:'Arial,sans-serif', border:'1px outset #ccc', display:'inline-block' }}>{b}</span>
            ))}
          </div>
          <div style={{ fontSize:10, color:'#666', lineHeight:2 }}>
            © 1997–2026 Tyler Emdur · All Rights Reserved (not really)<br/>
            Best viewed in <span style={{ color:'#00ffff' }}>Netscape Navigator 4.0</span> at <span style={{ color:'#00ffff' }}>800×600 resolution</span><br/>
            This page proudly made with Notepad and a lot of 💻 love 💻<br/>
            Last Updated: June 29, 2026
          </div>
        </div>

      </div>
      <HomeButton />
    </div>
  )
}
