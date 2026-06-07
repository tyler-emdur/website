'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'

function TVStatic({ onEmbed }: { onEmbed: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = 200; canvas.height = 150

    let frame = 0
    function draw() {
      const imageData = ctx.createImageData(200, 150)
      for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.random() < 0.5 ? Math.floor(Math.random() * 255) : 0
        imageData.data[i] = v; imageData.data[i+1] = v; imageData.data[i+2] = v; imageData.data[i+3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
      // scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      for (let y = 0; y < 150; y += 3) ctx.fillRect(0, y, 200, 1)
      frame++
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    const timer = setTimeout(onEmbed, 8000)
    return () => { cancelAnimationFrame(rafRef.current); clearTimeout(timer) }
  }, [onEmbed])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} />
}

function BookPage({ title, content, onClose }: { title: string; content: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: '#f8f4e8', width: 380, maxHeight: '70vh', overflowY: 'auto',
          padding: '40px 44px', borderRadius: 2,
          fontFamily: '"VT323", monospace',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.4), 8px 8px 30px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(60,40,20,0.4)', marginBottom: 12 }}>— FROM THE LIBRARY —</div>
        <h3 style={{ fontSize: 22, color: '#2c1a0e', marginBottom: 20, lineHeight: 1.2 }}>{title}</h3>
        <div style={{ fontSize: 17, lineHeight: 1.9, color: '#3c2813', whiteSpace: 'pre-wrap' }}>{content}</div>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"VT323", monospace', fontSize: 20, color: '#8B6040' }}>×</button>
      </div>
    </div>
  )
}

const BOOKS = [
  {
    title: 'On Starting Things',
    content: `You start because something bothers you.

Not in a bad way. In the way a song bothers you when you can hear it but can't quite remember the name. You start because not starting feels worse than starting badly.

The first version is always wrong. This is not a flaw in the process. This is the process.

I've shipped things I'm embarrassed by now. I'm grateful for all of them. They're evidence that I kept going.`,
  },
  {
    title: 'Notes on Running',
    content: `I didn't start running because I wanted to be fast.

I started because I needed something that was just mine. Something where the output was proportional to the input in a way that software rarely is.

You run and then you're tired and then you're not tired and then something is clearer than it was before.

Boulder Marathon 2024. 3:41:22. I will run it again.`,
  },
  {
    title: 'Technical Reading',
    content: `Current stack: Next.js 15, TypeScript, Three.js, React Three Fiber, Zustand, Tailwind when I remember to use it.

Currently learning: more WebGL than I wanted to know. Audio synthesis. How to make things that feel alive.

The best line of code I ever wrote deleted 400 lines of code.

Build for the next person to read it. That person is usually you, six months from now, annoyed.`,
  },
  {
    title: 'Colorado',
    content: `Pikes Peak in August. Rocky Mountain NP in July. Maroon Bells in September. Mt. Elbert at 4am.

The state changed me in ways I didn't plan for. Something about altitude and horizontal miles.

There's a specific quality to light above treeline. You can't photograph it correctly. You have to be there.

I will keep going up.`,
  },
]

export default function World1Apartment() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [openBook, setOpenBook] = useState<number | null>(null)
  const [showTV, setShowTV] = useState(false)
  const [tvEmbed, setTvEmbed] = useState(false)
  const [windowScene, setWindowScene] = useState(0)
  const [phonePulse, setPhonePulse] = useState(false)

  useEffect(() => {
    setWindowScene(Math.floor(Math.random() * 4))
    // Phone rings every 3 minutes
    const phoneTimer = setInterval(() => setPhonePulse(true), 180000)
    const firstRing = setTimeout(() => setPhonePulse(true), 45000)
    return () => { clearInterval(phoneTimer); clearTimeout(firstRing) }
  }, [])

  const windowScenes = [
    { sky: 'linear-gradient(180deg, #87CEEB 0%, #98D8C8 100%)', desc: 'A clear Tuesday morning.' },
    { sky: 'linear-gradient(180deg, #4a4a5a 0%, #3a3a48 100%)', desc: 'Overcast. Maybe 4pm.' },
    { sky: 'linear-gradient(180deg, #2d1b4e 0%, #1a0e2e 100%)', desc: 'Late. Stars, probably.' },
    { sky: 'linear-gradient(180deg, #ff7b5c 0%, #ff9966 100%)', desc: 'Sunset from a room you know.' },
  ]

  const goToDoor = useCallback((e: React.MouseEvent) => {
    navigateTo(4, { type: 'slide-right', origin: { x: e.clientX, y: e.clientY } })
  }, [navigateTo])

  const goToHatch = useCallback((e: React.MouseEvent) => {
    navigateTo(2, { type: 'scatter', origin: { x: e.clientX, y: e.clientY } })
  }, [navigateTo])

  return (
    <div
      data-world="1"
      style={{
        position: 'fixed', inset: 0,
        background: '#1a1210',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"VT323", monospace',
        overflow: 'hidden',
      }}
    >
      {/* Room label */}
      <div style={{ position: 'absolute', top: 24, left: 32, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,200,150,0.3)' }}>
        FLOOR 1 · UNIT —
      </div>

      {/* Apartment cutaway */}
      <div style={{
        position: 'relative',
        width: 'min(90vw, 900px)',
        height: 'min(80vh, 600px)',
        border: '2px solid rgba(255,200,150,0.15)',
        background: 'rgba(30,20,15,0.9)',
        boxShadow: '0 0 80px rgba(0,0,0,0.8)',
      }}>

        {/* Floor */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'repeating-linear-gradient(90deg, rgba(60,40,20,0.6) 0px, rgba(60,40,20,0.6) 1px, transparent 1px, transparent 40px)',
          borderTop: '1px solid rgba(100,70,40,0.3)',
        }} />

        {/* Walls */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 80, width: '60%', borderRight: '1px solid rgba(100,70,40,0.2)', background: 'rgba(20,15,10,0.3)' }}>

          {/* Window */}
          <div
            onClick={() => setWindowScene(s => (s + 1) % 4)}
            style={{
              position: 'absolute', top: 60, left: 80, width: 160, height: 120,
              background: windowScenes[windowScene].sky,
              border: '3px solid rgba(100,70,40,0.5)',
              cursor: 'pointer',
              outline: '1px solid rgba(100,70,40,0.2)',
              outlineOffset: 6,
            }}
          >
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', height: 3, background: 'rgba(100,70,40,0.5)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 3, height: '100%', background: 'rgba(100,70,40,0.5)' }} />
            <div style={{ position: 'absolute', bottom: -28, left: 0, right: 0, fontFamily: '"VT323", monospace', fontSize: 11, color: 'rgba(255,200,150,0.25)', textAlign: 'center', letterSpacing: '0.1em' }}>{windowScenes[windowScene].desc}</div>
          </div>

          {/* Bookshelf */}
          <div style={{ position: 'absolute', top: 50, right: 30, width: 100 }}>
            <div style={{ fontFamily: '"VT323", monospace', fontSize: 10, color: 'rgba(255,200,150,0.2)', letterSpacing: '0.15em', marginBottom: 4, textAlign: 'center' }}>LIBRARY</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', borderBottom: '2px solid rgba(100,70,40,0.4)', paddingBottom: 4 }}>
              {BOOKS.map((book, i) => (
                <div
                  key={i}
                  onClick={() => setOpenBook(i)}
                  style={{
                    width: 16, height: [70, 56, 80, 64][i],
                    background: ['#4a2515', '#1a3a5c', '#2c4a1c', '#5c3a15'][i],
                    border: '1px solid rgba(255,200,150,0.15)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                    fontSize: 7, writingMode: 'vertical-rl', textOrientation: 'mixed',
                    color: 'rgba(255,230,180,0.4)', paddingTop: 4, textAlign: 'center',
                    letterSpacing: '0.1em', overflow: 'hidden',
                  }}
                >
                  {book.title.slice(0, 8)}
                </div>
              ))}
            </div>
          </div>

          {/* TV */}
          <div
            onClick={() => setShowTV(true)}
            style={{
              position: 'absolute', bottom: 30, left: 60, width: 200, height: 150,
              background: '#0d0d0d', border: '3px solid rgba(60,50,35,0.7)',
              cursor: 'pointer',
              borderRadius: 4,
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
            }}
          >
            {showTV ? (
              tvEmbed ? (
                <iframe
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0&controls=0"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <TVStatic onEmbed={() => setTvEmbed(true)} />
              )
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,200,150,0.1)', fontFamily: '"VT323", monospace', fontSize: 11, letterSpacing: '0.2em' }}>
                CLICK TO WATCH
              </div>
            )}
            <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: 'rgba(255,200,150,0.2)', letterSpacing: '0.15em' }}>TELEVISION</div>
          </div>
        </div>

        {/* Right room */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 80, left: '60%' }}>

          {/* Phone */}
          <div
            onClick={() => setPhonePulse(false)}
            style={{
              position: 'absolute', top: 80, right: 60, width: 40, height: 70,
              background: '#1a1a1a', border: '2px solid rgba(100,70,40,0.4)',
              cursor: 'pointer', borderRadius: 4,
              boxShadow: phonePulse ? '0 0 20px rgba(255,150,50,0.6)' : 'none',
              transition: 'box-shadow 0.5s',
              animation: phonePulse ? 'phonering 0.8s infinite' : 'none',
            }}
          >
            <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 20, height: 3, background: 'rgba(255,200,150,0.2)', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 14, left: 4, right: 4, height: 30, background: 'rgba(30,25,20,0.8)', border: '1px solid rgba(100,70,40,0.3)' }} />
            <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 16, height: 6, background: 'rgba(100,70,40,0.3)', borderRadius: 2 }} />
            {phonePulse && (
              <div style={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 10, color: 'rgba(255,150,50,0.7)', letterSpacing: '0.1em' }}>
                INCOMING
              </div>
            )}
          </div>

          {/* Desk with papers */}
          <div style={{ position: 'absolute', bottom: 30, right: 40, width: 180, height: 60 }}>
            <div style={{ width: '100%', height: 8, background: 'rgba(80,55,30,0.6)', borderRadius: '2px 2px 0 0' }} />
            <div style={{ position: 'relative', marginTop: -2 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: 'absolute', bottom: 8,
                  left: i * 15, width: 120, height: 45,
                  background: '#f8f4e8',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transform: `rotate(${[-3, 1, -1.5][i]}deg)`,
                  fontSize: 5, padding: 4, color: 'rgba(0,0,0,0.3)',
                  fontFamily: 'monospace',
                  lineHeight: 1.6,
                }}>
                  {['digger.app · production deploy', '14,439 ft · mt. elbert summit', 'TODO: finish the thing'][i]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Door (leads to World 4) */}
        <div
          onClick={goToDoor}
          style={{
            position: 'absolute', bottom: 80, right: 40, width: 60, height: 100,
            background: 'rgba(50,35,20,0.8)',
            border: '2px solid rgba(100,70,40,0.5)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <div style={{ position: 'absolute', right: 8, top: '50%', width: 5, height: 5, borderRadius: '50%', background: 'rgba(200,150,80,0.7)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,200,150,0.2)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>EXIT</div>
        </div>

        {/* Rug / hatch (leads to World 2) */}
        <div
          onClick={goToHatch}
          style={{
            position: 'absolute', bottom: 82, left: '50%', transform: 'translateX(-50%)',
            width: 100, height: 40,
            background: 'repeating-linear-gradient(45deg, rgba(80,40,20,0.4) 0px, rgba(80,40,20,0.4) 2px, transparent 2px, transparent 8px)',
            border: '1px solid rgba(100,70,40,0.3)',
            cursor: 'pointer',
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 30, height: 4, background: 'rgba(100,70,40,0.5)', borderRadius: 2 }} />
          <div style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,200,150,0.15)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>▼</div>
        </div>

        {/* Ceiling light */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 20,
          background: 'radial-gradient(ellipse at center top, rgba(255,220,150,0.15) 0%, transparent 70%)',
        }}>
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: 30, background: 'rgba(100,70,40,0.3)' }} />
          <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,220,150,0.6)', boxShadow: '0 0 40px rgba(255,220,150,0.3)' }} />
        </div>

        {/* Floor glow */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'radial-gradient(ellipse at 50% 100%, rgba(255,200,120,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        fontFamily: '"VT323", monospace', fontSize: 13, color: 'rgba(255,200,150,0.18)',
        letterSpacing: '0.12em', whiteSpace: 'nowrap',
      }}>
        EXPLORE · CLICK THINGS · LOOK AROUND
      </div>

      {openBook !== null && (
        <BookPage
          title={BOOKS[openBook].title}
          content={BOOKS[openBook].content}
          onClose={() => setOpenBook(null)}
        />
      )}

      <style>{`
        @keyframes phonering {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px) rotate(-3deg); }
          40% { transform: translateX(2px) rotate(3deg); }
          60% { transform: translateX(-2px) rotate(-3deg); }
          80% { transform: translateX(2px) rotate(3deg); }
        }
      `}</style>
    </div>
  )
}
