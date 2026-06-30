'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── Window data ───────────────────────────────────────────────────────────────

interface Win {
  id: string
  title: string
  barColor: string
  x: number
  y: number
  w: number
  h: number
  content: React.ReactNode
}

// ── Mini site content components ──────────────────────────────────────────────

function RunningLog() {
  return (
    <div style={{ background: '#ffffff', height: '100%', padding: '8px 10px', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 11, overflowY: 'auto' }}>
      <div style={{ background: '#006600', color: '#fff', padding: '4px 8px', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
        🏃 COLORADO TRAIL RUNNING — Tyler's Personal Log
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
        <thead>
          <tr style={{ background: '#ccddcc' }}>
            <th style={{ border: '1px solid #999', padding: '3px 5px', textAlign: 'left' }}>Race / Route</th>
            <th style={{ border: '1px solid #999', padding: '3px 5px' }}>Date</th>
            <th style={{ border: '1px solid #999', padding: '3px 5px' }}>Result</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Boulder Marathon', 'Oct 2024', '3:41:22'],
            ['Golden Gate Canyon 25K', 'Jun 2024', 'muddy — completed'],
            ['Pikes Peak 14er', 'Aug 2024', 'wake-up 3am, summit 9:40am'],
            ['Mt. Elbert (14,439 ft)', 'Sep 2023', 'highest in CO, summited'],
            ['Maroon Bells Loop', 'Sep 2023', '6h 10m, 5am start'],
          ].map(([r, d, t], i) => (
            <tr key={i} style={{ background: i % 2 ? '#f5f5f5' : '#fff' }}>
              <td style={{ border: '1px solid #ccc', padding: '3px 5px' }}>{r}</td>
              <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center', color: '#555' }}>{d}</td>
              <td style={{ border: '1px solid #ccc', padding: '3px 5px', fontFamily: 'monospace', fontSize: 9 }}>{t}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8, fontSize: 9, color: '#888', borderTop: '1px solid #ddd', paddingTop: 6 }}>
        Pattern: voluntary difficulty. | <span style={{ color: '#0000ee', textDecoration: 'underline', cursor: 'pointer' }}>Email me about running</span>
      </div>
    </div>
  )
}

function PageNotFound() {
  return (
    <div style={{ background: '#ffffff', height: '100%', padding: '14px 16px', fontFamily: 'Times New Roman, serif', fontSize: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #ccc' }}>
        <span style={{ fontSize: 36, lineHeight: 1 }}>🚫</span>
        <div>
          <div style={{ fontSize: 16, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: '#000080', marginBottom: 2 }}>The page cannot be found</div>
          <div style={{ fontSize: 9, color: '#666', fontFamily: 'Arial, sans-serif' }}>HTTP 404 - File not found | Internet Explorer</div>
        </div>
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.7, color: '#333' }}>
        <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
        <p><b>Please try the following:</b></p>
        <ul style={{ paddingLeft: 18, fontSize: 10 }}>
          <li>Make sure that the Web site address is spelled correctly</li>
          <li>Click the <span style={{ color: '#0000ee', textDecoration: 'underline' }}>Back</span> button to try another link</li>
          <li>Click <span style={{ color: '#0000ee', textDecoration: 'underline' }}>Search</span> to look for information</li>
        </ul>
      </div>
      <div style={{ marginTop: 10, fontSize: 9, color: '#999', borderTop: '1px solid #eee', paddingTop: 8 }}>
        Cannot find server | Error: 404
      </div>
    </div>
  )
}

function CoolestInWorld() {
  return (
    <div style={{ background: '#9966cc', height: '100%', padding: '10px 12px', fontFamily: '"Comic Sans MS", cursive', overflowY: 'auto' }}>
      <div style={{ fontSize: 16, color: '#ffff00', fontWeight: 'bold', textShadow: '1px 1px #000', marginBottom: 8 }}>
        Welcome to My Page!!!
      </div>
      <div style={{ background: '#ffffff', padding: '8px 10px', marginBottom: 8, fontSize: 11, color: '#000', lineHeight: 1.7 }}>
        I'm the coolest in the world and everything i do is cool.
        So the following page of pictures of me and my friends is cool.
      </div>
      <div style={{ fontSize: 10, color: '#ffffff', lineHeight: 1.9, marginBottom: 8 }}>
        <div style={{ background: '#cc44cc', padding: '2px 6px', marginBottom: 4, display: 'inline-block' }}>ABOUT ME</div><br />
        Name: Tyler<br />
        Age: [redacted]<br />
        Location: Boulder, CO<br />
        Likes: Code, Mountains, Music<br />
        Quote: "if it compiles, ship it"
      </div>
      <div style={{ fontSize: 9, color: '#ffff44', borderTop: '1px solid #aa44aa', paddingTop: 6 }}>
        ✉️ Sign my guestbook! | 💬 ICQ: [offline] | 🔗 Web ring
      </div>
    </div>
  )
}

function UnderConstruction() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', gap: 12, padding: 16 }}>
      <div style={{
        backgroundImage: 'repeating-linear-gradient(45deg,#ffff00,#ffff00 10px,#000 10px,#000 20px)',
        padding: '6px', width: '100%',
      }}>
        <div style={{ background: '#ffffff', padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>⚠️ 🚧 ⚠️</div>
          <div style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 13, fontWeight: 'bold', color: '#000' }}>
            UNDER CONSTRUCTION
          </div>
        </div>
      </div>
      <div style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 1.7 }}>
        This section of the site is not ready yet.<br />
        Please check back soon!!!<br />
        <br />
        <span style={{ fontSize: 9, color: '#999' }}>Last attempted: June 1997</span>
      </div>
    </div>
  )
}

function HowTheInternetWorks() {
  return (
    <div style={{ background: '#000066', height: '100%', padding: '10px 12px', overflowY: 'auto', fontFamily: 'Times New Roman, serif' }}>
      <div style={{ color: '#00ffff', fontSize: 14, fontWeight: 'bold', marginBottom: 8, textDecoration: 'underline' }}>
        HOW THE INTERNET WORKS
      </div>
      <div style={{ fontSize: 10, color: '#ccccff', lineHeight: 1.9 }}>
        <p>The Internet is a worldwide system of interconnected computer networks that use the TCP/IP protocol to serve billions of users daily.</p>
        <p><span style={{ color: '#ffff00' }}>Q: What is a website?</span><br />
        A website is a collection of related web pages including multimedia content, typically identified with a common domain name.</p>
        <p><span style={{ color: '#ffff00' }}>Q: What is HTML?</span><br />
        HTML stands for HyperText Markup Language. It is the standard markup language for creating Web pages.</p>
        <p style={{ color: '#ff9900' }}>Fun Fact: There are now over 1 BILLION websites on the internet (many of them are very weird).</p>
      </div>
      <div style={{ fontSize: 9, color: '#6666aa', borderTop: '1px solid #333', marginTop: 8, paddingTop: 6 }}>
        Source: The Internet itself | Last verified: 1999
      </div>
    </div>
  )
}

function Digger() {
  return (
    <div style={{ background: '#1a0033', height: '100%', padding: '10px 12px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(200,0,255,0.3)' }}>
        <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#9900cc,#cc00ff)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎵</div>
        <div>
          <div style={{ color: '#cc44ff', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: 13 }}>DIGGER</div>
          <div style={{ color: '#888', fontSize: 9, fontFamily: 'Arial, sans-serif' }}>Music You Didn't Know You Needed</div>
        </div>
      </div>
      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, color: '#ccc', lineHeight: 1.9 }}>
        {['Boards of Canada — Music Has the Right to Children', 'Four Tet — Rounds', 'Aphex Twin — Selected Ambient Works', 'Burial — Untrue', 'Jon Hopkins — Immunity'].map((t, i) => (
          <div key={i} style={{ padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#666', fontSize: 8, width: 12 }}>{i + 1}</span>
            <span style={{ color: '#cc44ff' }}>▶</span>
            <span>{t}</span>
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 9, color: '#666' }}>
          Deployed 2024 · <span style={{ color: '#cc44ff', textDecoration: 'underline', cursor: 'pointer' }}>Open Digger →</span>
        </div>
      </div>
    </div>
  )
}

function FreeSearch() {
  return (
    <div style={{ background: '#ffffff', height: '100%', padding: '12px 14px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', letterSpacing: '-0.03em' }}>
          <span style={{ color: '#3366cc' }}>F</span>
          <span style={{ color: '#cc0000' }}>R</span>
          <span style={{ color: '#ff9900' }}>E</span>
          <span style={{ color: '#3366cc' }}>E</span>
          <span style={{ color: '#009900' }}>!</span>
          <span style={{ fontSize: 11, color: '#000', fontWeight: 'normal', letterSpacing: 'normal', marginLeft: 6 }}>searches powered by</span>
          {' '}
          <span style={{ color: '#3366cc', fontWeight: 'bold', fontSize: 18 }}>G</span>
          <span style={{ color: '#cc0000', fontWeight: 'bold', fontSize: 18 }}>o</span>
          <span style={{ color: '#ff9900', fontWeight: 'bold', fontSize: 18 }}>o</span>
          <span style={{ color: '#3366cc', fontWeight: 'bold', fontSize: 18 }}>g</span>
          <span style={{ color: '#009900', fontWeight: 'bold', fontSize: 18 }}>l</span>
          <span style={{ color: '#cc0000', fontWeight: 'bold', fontSize: 18 }}>e</span>
          <span style={{ color: '#ff9900', fontWeight: 'bold', fontSize: 18 }}>!</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Enter search phrase here......"
          style={{ flex: 1, padding: '4px 8px', border: '1px solid #999', fontSize: 11, outline: 'none' }}
        />
        <button style={{ padding: '4px 10px', background: '#cccccc', border: '1px outset #999', fontSize: 10, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>Search!</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', background: '#f5f5f5', border: '1px solid #ddd' }}>
        <div style={{ fontSize: 22 }}>🕷️</div>
        <div style={{ fontSize: 10, color: '#333', lineHeight: 1.6 }}>
          Click the spider to<br />search the WEB!
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 9, color: '#999', textAlign: 'center' }}>
        This is a real search! (it doesn't work) | Free since 1998
      </div>
    </div>
  )
}

// ── Draggable window component ────────────────────────────────────────────────

function BrowserWindow({
  win, zIndex, onFocus, onUpdate,
}: {
  win: Win
  zIndex: number
  onFocus: () => void
  onUpdate: (x: number, y: number) => void
}) {
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const elRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: win.x, y: win.y })

  const onPD = (e: React.PointerEvent<HTMLDivElement>) => {
    onFocus()
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: posRef.current.x, oy: posRef.current.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const onPM = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const nx = dragRef.current.ox + e.clientX - dragRef.current.sx
    const ny = dragRef.current.oy + e.clientY - dragRef.current.sy
    posRef.current = { x: nx, y: ny }
    if (elRef.current) { elRef.current.style.left = nx + 'px'; elRef.current.style.top = ny + 'px' }
  }

  const onPU = () => {
    if (!dragRef.current) return
    dragRef.current = null
    onUpdate(posRef.current.x, posRef.current.y)
  }

  return (
    <div
      ref={elRef}
      onClick={onFocus}
      style={{
        position: 'absolute', left: win.x, top: win.y,
        width: win.w, height: win.h,
        display: 'flex', flexDirection: 'column',
        boxShadow: '2px 2px 0 rgba(0,0,0,0.6), inset 1px 1px rgba(255,255,255,0.5)',
        zIndex,
        border: '2px outset #c0c0c0',
      }}
    >
      {/* Title bar */}
      <div
        onPointerDown={onPD}
        onPointerMove={onPM}
        onPointerUp={onPU}
        style={{
          background: `linear-gradient(90deg, ${win.barColor} 0%, rgba(0,0,80,0.9) 100%)`,
          padding: '3px 6px 3px 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'default', userSelect: 'none', flexShrink: 0,
        }}
      >
        <span style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: win.w - 70 }}>
          {win.title}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          {['_','□','×'].map((sym, i) => (
            <div key={i} style={{
              width: 16, height: 14, background: '#c0c0c0',
              border: '1px outset #ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontFamily: 'Arial, sans-serif', cursor: 'pointer',
              color: '#000',
            }}>{sym}</div>
          ))}
        </div>
      </div>
      {/* Menu bar */}
      <div style={{
        background: '#c0c0c0', padding: '1px 6px',
        borderBottom: '1px solid #808080',
        display: 'flex', gap: 12, flexShrink: 0,
      }}>
        {['File','Edit','View','Favorites','Help'].map(m => (
          <span key={m} style={{ fontSize: 10, fontFamily: 'Arial, sans-serif', color: '#000', cursor: 'pointer', padding: '1px 4px' }}>
            <u>{m[0]}</u>{m.slice(1)}
          </span>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#ffffff' }}>
        {win.content}
      </div>
      {/* Status bar */}
      <div style={{ background: '#c0c0c0', padding: '1px 6px', borderTop: '1px solid #808080', fontSize: 9, fontFamily: 'Arial, sans-serif', color: '#000', flexShrink: 0 }}>
        Done
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function World7Mall() {
  const navigateTo = useWorldStore(s => s.navigateTo)

  const INITIAL_WINDOWS: Win[] = [
    {
      id: 'running', title: "Tyler's Colorado Trail Running Log - Netscape",
      barColor: '#006600', x: 18, y: 48, w: 400, h: 260,
      content: <RunningLog />,
    },
    {
      id: 'error', title: 'The page cannot be found',
      barColor: '#444444', x: 290, y: 160, w: 360, h: 230,
      content: <PageNotFound />,
    },
    {
      id: 'coolest', title: "Welcome to Tyler's Homepage!!! - Netscape 4.0",
      barColor: '#663399', x: 60, y: 280, w: 310, h: 250,
      content: <CoolestInWorld />,
    },
    {
      id: 'construction', title: 'Digger — Under Construction',
      barColor: '#884400', x: 440, y: 40, w: 290, h: 220,
      content: <UnderConstruction />,
    },
    {
      id: 'internet', title: 'HOW THE INTERNET WORKS - Educational Resource',
      barColor: '#000066', x: 520, y: 240, w: 340, h: 270,
      content: <HowTheInternetWorks />,
    },
    {
      id: 'digger', title: 'Digger Music Discovery - Beta v0.9',
      barColor: '#440066', x: 140, y: 420, w: 320, h: 240,
      content: <Digger />,
    },
    {
      id: 'search', title: 'Free Internet Search - Powered by Google!',
      barColor: '#115522', x: 470, y: 420, w: 340, h: 210,
      content: <FreeSearch />,
    },
  ]

  const [windows, setWindows] = useState(INITIAL_WINDOWS)
  const [zOrders, setZOrders] = useState<Record<string, number>>(() =>
    Object.fromEntries(INITIAL_WINDOWS.map((w, i) => [w.id, i + 1]))
  )
  const zTop = useRef(INITIAL_WINDOWS.length + 1)

  const focus = useCallback((id: string) => {
    zTop.current++
    setZOrders(z => ({ ...z, [id]: zTop.current }))
  }, [])

  const updatePos = useCallback((id: string, x: number, y: number) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, x, y } : w))
  }, [])

  return (
    <div
      data-world="7"
      style={{
        position: 'fixed', inset: 0,
        background: '#008080',
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 8px)',
        overflow: 'hidden',
      }}
    >
      {/* Windows taskbar at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 32,
        background: '#c0c0c0',
        borderTop: '2px outset #ffffff',
        display: 'flex', alignItems: 'center', padding: '0 4px', gap: 4, zIndex: 9999,
      }}>
        {/* Start button */}
        <div style={{
          padding: '3px 10px', background: '#c0c0c0', border: '2px outset #ffffff',
          fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: 11,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: 14 }}>⊞</span> Start
        </div>
        {/* Separator */}
        <div style={{ width: 2, height: 20, background: '#808080', borderRight: '1px solid #fff', margin: '0 2px' }} />
        {/* Window buttons */}
        {windows.map(w => (
          <div
            key={w.id}
            onClick={() => focus(w.id)}
            style={{
              padding: '2px 10px', background: '#c0c0c0', border: '2px outset #ffffff',
              fontFamily: 'Arial, sans-serif', fontSize: 10, cursor: 'pointer',
              maxWidth: 140, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}
          >
            {w.title.split(' - ')[0].slice(0, 22)}
          </div>
        ))}
        {/* Clock */}
        <div style={{ marginLeft: 'auto', padding: '2px 8px', border: '1px inset #808080', fontFamily: 'Arial', fontSize: 11 }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Desktop icons */}
      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1 }}>
        {[
          { icon: '🌐', label: 'My Website' },
          { icon: '📁', label: 'My Documents' },
          { icon: '🗑️', label: 'Recycle Bin' },
          { icon: '💾', label: 'Projects' },
        ].map(({ icon, label }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', width: 56 }}>
            <div style={{ fontSize: 26, filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}>{icon}</div>
            <div style={{
              fontSize: 9, fontFamily: 'Arial, sans-serif', color: '#fff',
              textAlign: 'center', lineHeight: 1.2,
              textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
            }}>{label}</div>
          </div>
        ))}
        <div
          onClick={() => navigateTo(1, { type: 'door' })}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', width: 56, marginTop: 8 }}
        >
          <div style={{ fontSize: 26, filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}>🚪</div>
          <div style={{ fontSize: 9, fontFamily: 'Arial, sans-serif', color: '#fff', textAlign: 'center', lineHeight: 1.2, textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>Universe</div>
        </div>
      </div>

      {/* Browser windows */}
      {windows.map(w => (
        <BrowserWindow
          key={w.id}
          win={w}
          zIndex={zOrders[w.id] || 1}
          onFocus={() => focus(w.id)}
          onUpdate={(x, y) => updatePos(w.id, x, y)}
        />
      ))}

      <HomeButton />
    </div>
  )
}
