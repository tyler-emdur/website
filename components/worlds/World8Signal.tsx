'use client'
import { useState } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

const CARS = [
  { name: 'Camaro Z28', year: '1999', desc: 'The real deal. 305hp. T-tops. Midnight blue with silver stripe. This is the car.', emoji: '🏎️' },
  { name: 'Harley-Davidson Road King', year: '2003', desc: 'Chrome everywhere. Custom seat. Rides like a dream down I-70 with the mountains on both sides.', emoji: '🏍️' },
  { name: 'Dodge Viper GTS', year: '2000', desc: 'Had a poster of this on my wall for 6 years. V10. 450hp. Red with white stripes. Perfect.', emoji: '🏎️' },
  { name: 'Ford F-350 Super Duty', year: '2001', desc: "Diesel. Can tow anything. Have driven this truck to 14 states. It has never once let me down.", emoji: '🚛' },
]

export default function World8Signal() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', position: 'fixed', inset: 0, overflowY: 'auto',
      background: '#888888',
      backgroundImage: [
        'repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 2px, transparent 2px, transparent 14px)',
        'repeating-linear-gradient(-45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 14px)',
      ].join(', '),
      backgroundSize: '14px 14px',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }}>
      <style>{`
        @keyframes w8-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes w8-rev { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .w8-spin { animation: w8-spin 3s linear infinite }
        .w8-rev { animation: w8-rev 0.8s ease-in-out infinite }
        a { color: #ffee00; cursor: pointer }
        a:hover { color: #ffffff }
      `}</style>

      {/* Header bar */}
      <div style={{ background: 'linear-gradient(180deg, #555 0%, #333 100%)', borderBottom: '3px solid #222', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, height: 44 }}>
        <div style={{ fontSize: 9, color: '#ccc', border: '1px outset #999', padding: '2px 8px', background: '#888', cursor: 'pointer' }}>HOME</div>
        <div style={{ fontSize: 9, color: '#ccc', border: '1px outset #999', padding: '2px 8px', background: '#888', cursor: 'pointer' }}>HOT LINKS</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 9, color: '#aaa' }}>💾 C:(FAT) 2.1 GB Free</div>
      </div>

      {/* WELCOME banner */}
      <div style={{ background: 'linear-gradient(180deg, #444 0%, #333 50%, #444 100%)', padding: '16px', textAlign: 'center', borderBottom: '3px solid #222', position: 'relative' }}>
        <div className="w8-spin" style={{ position: 'absolute', top: 10, right: 20, fontSize: 28, opacity: 0.4 }}>⚙️</div>
        <div className="w8-spin" style={{ position: 'absolute', top: 16, right: 52, fontSize: 18, opacity: 0.3, animationDirection: 'reverse' }}>⚙️</div>
        <div style={{ fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: 'clamp(1.8rem,6vw,3rem)', color: '#dddddd', letterSpacing: '0.08em', textShadow: '2px 2px #000, -1px -1px #666' }}>
          ✦ Welcome ✦
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 12, color: '#aaaaaa', marginTop: 4, fontStyle: 'italic' }}>
          Road Champs · Harleys · Sports Cars · Colorado Life
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '14px' }}>

        {/* Main featured box */}
        <div style={{ background: 'linear-gradient(135deg, #555 0%, #444 50%, #555 100%)', border: '3px inset #999', padding: '14px', marginBottom: 12 }}>
          <div style={{ fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: 22, color: '#ffee00', textShadow: '1px 1px #000', letterSpacing: '0.06em', marginBottom: 10 }}>
            ROAD CHAMPS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
            {CARS.map(({ name, year, desc, emoji }, i) => (
              <div key={name} onClick={() => setOpen(open === i ? null : i)} style={{ background: '#444', border: '2px inset #666', padding: '10px 12px', cursor: 'pointer' }}>
                <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 6 }}>{emoji}</div>
                <div style={{ fontSize: 11, color: '#ffee00', fontWeight: 'bold', marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 9, color: '#aaa', marginBottom: 4 }}>{year}</div>
                {open === i && <div style={{ fontSize: 10, color: '#ccc', lineHeight: 1.7, borderTop: '1px solid #666', paddingTop: 6 }}>{desc}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Two column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div style={{ background: '#444', border: '2px inset #666', padding: '10px 12px' }}>
            <div style={{ fontSize: 12, color: '#ffee00', fontWeight: 'bold', marginBottom: 8, borderBottom: '1px solid #666', paddingBottom: 5 }}>
              🏁 Race Log
            </div>
            <div style={{ fontSize: 10, color: '#ccc', lineHeight: 2.2 }}>
              <div>Boulder Marathon — 3:41:22 — <span style={{ color: '#88ff88' }}>✓ finished</span></div>
              <div>Golden Gate Canyon 25K — muddy — <span style={{ color: '#88ff88' }}>✓ completed</span></div>
              <div>Pikes Peak 14er — Aug 2024 — <span style={{ color: '#88ff88' }}>✓ summit</span></div>
              <div>Mt. Elbert — 14,439 ft — <span style={{ color: '#88ff88' }}>✓ summit</span></div>
            </div>
            <div style={{ marginTop: 8, fontSize: 9, color: '#888', borderTop: '1px solid #555', paddingTop: 5 }}>
              <span style={{ color: '#ff5555', fontSize: 10, fontWeight: 'bold' }}>97'</span>&nbsp;
              <span style={{ color: '#ffcc00', fontSize: 10, fontWeight: 'bold' }}>98'</span>&nbsp;
              <span style={{ color: '#ff5555', fontSize: 10, fontWeight: 'bold' }}>99'</span> — the glory years
            </div>
          </div>
          <div style={{ background: '#444', border: '2px inset #666', padding: '10px 12px' }}>
            <div style={{ fontSize: 12, color: '#ffee00', fontWeight: 'bold', marginBottom: 8, borderBottom: '1px solid #666', paddingBottom: 5 }}>
              🔧 About This Page
            </div>
            <div style={{ fontSize: 10, color: '#ccc', lineHeight: 2 }}>
              Name: Tyler Emdur<br />
              Location: Boulder, CO<br />
              Job: Software Engineer<br />
              Altitude: 5,430 ft<br />
              Email: <span style={{ color: '#ffee00', textDecoration: 'underline', cursor: 'pointer' }}>healthreinvented@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Decorative row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12, padding: 12, background: '#333', border: '2px inset #666' }}>
          {[['🏎️','VERY USEFUL\nLINKS AND CAMARO\nOWNER\'S PHOTOS'],['⏱️','RPM COUNTER\n(DECORATIVE)'],['🏍️','HARLEYS\n2002–2005'],['⚡','NEXT SITE\nIN WEB RING']].map(([e, t], i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div className={i === 3 ? 'w8-rev' : ''} style={{ fontSize: 30 }}>{e}</div>
              <div style={{ fontSize: 8, color: '#aaa', marginTop: 4, whiteSpace: 'pre', lineHeight: 1.5 }}>{t}</div>
            </div>
          ))}
        </div>

        {/* Hot links + counter */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div style={{ background: '#333', border: '2px inset #666', padding: '10px 12px' }}>
            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ background: '#222', border: '2px inset #555', padding: '4px 8px', fontSize: 9, color: '#ffee00', fontWeight: 'bold' }}>CD REVIEWS</div>
            </div>
            <div style={{ fontSize: 10, color: '#ccc', lineHeight: 2.1 }}>
              <a>Metallica — Black Album</a><br />
              <a>Soundgarden — Superunknown</a><br />
              <a>Pearl Jam — Ten</a><br />
              <a>Alice in Chains — Dirt</a>
            </div>
          </div>
          <div style={{ background: '#333', border: '2px inset #666', padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#ffee00', fontWeight: 'bold', marginBottom: 8 }}>HOT LINKS</div>
            <div style={{ fontSize: 10, color: '#ccc', lineHeight: 2.2 }}>
              <a>🔗 Camaro Owners Club</a><br />
              <a>🔗 Colorado Trail Runners</a><br />
              <a>🔗 Harley-Davidson Forums</a><br />
              <a onClick={() => navigateTo(1, { type: 'door' })}>← Back to Universe</a>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: 10, background: '#333', border: '1px solid #555' }}>
          <div style={{ fontSize: 8, color: '#777', marginBottom: 3 }}>Updated 4th Oct 2001 &nbsp;|&nbsp; Updated 25th Sept 1999</div>
          <div style={{ fontFamily: 'monospace', fontSize: 18, color: '#00ff00', letterSpacing: '0.3em', textShadow: '0 0 8px #00ff00' }}>002,841</div>
          <div style={{ fontSize: 8, color: '#555', marginTop: 3 }}>visitors since 1998</div>
        </div>

      </div>
      <HomeButton />
    </div>
  )
}
