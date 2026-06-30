'use client'
import { useState } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

const EMOTICONS = [
  { em: ':-)', meaning: 'Smiley face (happy)' },
  { em: ':-(', meaning: 'Sad face (unhappy)' },
  { em: ';-)', meaning: 'Winky face (joking!!)' },
  { em: ':-D', meaning: 'Big grin (very happy)' },
  { em: ':-*', meaning: 'Kiss' },
  { em: ':-9', meaning: 'Blowing a kiss (very romantic)' },
  { em: ':-O', meaning: 'Surprised / shocked' },
  { em: ':-P', meaning: 'Sticking tongue out (playful)' },
  { em: '8-)', meaning: 'Wearing sunglasses (cool)' },
  { em: ':-/', meaning: 'Skeptical / unsure' },
  { em: 'B-)', meaning: 'Big glasses (nerdy but cool)' },
  { em: '>:-)', meaning: 'Evil grin (mischievous)' },
  { em: ":'-(", meaning: 'Crying (very sad)' },
  { em: ':-|', meaning: 'Neutral / no comment' },
  { em: '(((H)))', meaning: 'Big hug!!!' },
  { em: '<3', meaning: 'Heart (I love you / I like this)' },
]

const MESSAGES = [
  { from: 'StarGazer99', time: '3:42pm', msg: "omg this page is so beautiful!! you are so creative :) i love the hearts everywhere!!!!" },
  { from: 'MidnightRose', time: '11:58pm', msg: "found your page from a web ring and I am SO glad I did. This is the most beautiful page I have ever seen. You should be a professional web designer!!!!" },
  { from: 'CrystalDream', time: '2:17pm', msg: "The emoticon chart is SO useful I printed it out and put it on my wall next to my n*sync poster!! :-D" },
  { from: 'XxAngelxX', time: '8:31am', msg: "Hi I am new to the internet and I am leaving you a guestbook message because your page made me feel welcome :) Thank you for being so nice. <3" },
  { from: 'TechWizard7', time: '6:14pm', msg: "I don't usually leave comments but I have to say this is really nice. The design is very heartfelt. P.S. that emoticon glossary is gold lol" },
]

export default function World14Pixel() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [guestName, setGuestName] = useState('')
  const [guestMsg, setGuestMsg] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [messages, setMessages] = useState(MESSAGES)

  function submitGuest() {
    if (!guestName.trim() || !guestMsg.trim()) return
    setMessages(m => [{ from: guestName, time: 'just now', msg: guestMsg }, ...m])
    setGuestName('')
    setGuestMsg('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', position: 'fixed', inset: 0, overflowY: 'auto',
      background: '#660033',
      backgroundImage: [
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,0,100,0.3) 0%, transparent 60%)',
        'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(100,0,50,0.5) 0%, transparent 60%)',
      ].join(', '),
      fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
      color: '#ffccdd',
    }}>
      <style>{`
        @keyframes w14-heart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes w14-float { 0%{transform:translateY(100vh) scale(0.5);opacity:0} 100%{transform:translateY(-20px) scale(1);opacity:0.6} }
        @keyframes w14-shimmer { 0%,100%{text-shadow:0 0 8px #ff0066,0 0 20px #cc0044} 50%{text-shadow:0 0 16px #ff66aa,0 0 40px #ff0066,0 0 60px rgba(255,0,100,0.4)} }
        @keyframes w14-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .w14-heart { animation: w14-heart 1.2s ease-in-out infinite }
        .w14-float1 { animation: w14-float 4s ease-in infinite; animation-delay: 0s }
        .w14-float2 { animation: w14-float 5s ease-in infinite; animation-delay: 1.3s }
        .w14-float3 { animation: w14-float 6s ease-in infinite; animation-delay: 2.7s }
        .w14-float4 { animation: w14-float 4.5s ease-in infinite; animation-delay: 0.8s }
        .w14-shimmer { animation: w14-shimmer 2s ease-in-out infinite }
        a { color: #ffaacc; text-decoration: underline; cursor: pointer }
        a:hover { color: #ffffff }
        input,textarea { font-family: "Comic Sans MS", cursive }
      `}</style>

      {/* Floating hearts */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {['w14-float1','w14-float2','w14-float3','w14-float4'].map((cls, i) => (
          <div key={i} className={cls} style={{ position: 'absolute', left: `${15 + i * 22}%`, bottom: 0, fontSize: 24 + i * 6, opacity: 0 }}>❤️</div>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '24px 16px 16px', borderBottom: '3px double rgba(255,150,180,0.4)' }}>
          <div className="w14-heart" style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>💝</div>
          <div className="w14-shimmer" style={{ fontSize: 'clamp(1.8rem,7vw,4rem)', color: '#ff6699', lineHeight: 1.1 }}>
            Welcome to My Heart
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,180,200,0.8)', marginTop: 8, fontStyle: 'italic' }}>
            A place of love, beauty, and feelings ❤️ ~*~ Est. 1999 ~*~
          </div>
          <div style={{ marginTop: 12, fontSize: 20, letterSpacing: '0.4em' }}>
            💕 💗 💖 💓 💞 💕
          </div>
        </div>

        <div style={{ maxWidth: 780, margin: '0 auto', padding: '18px 14px 40px' }}>

          {/* Welcome message */}
          <div style={{ border: '2px solid rgba(255,100,150,0.5)', padding: '14px 18px', marginBottom: 16, background: 'rgba(100,0,40,0.6)', textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: '#ffaabb', textDecoration: 'underline', marginBottom: 10 }}>
              💌 Hello and Welcome!!
            </div>
            <div style={{ fontSize: 12, color: '#ffccdd', lineHeight: 2 }}>
              Hi! This is my little heart on the internet. I made this page because I believe in love
              and I wanted somewhere to put all my feelings and share them with the world!!<br />
              I hope you feel welcome here. Please sign my guestbook and let me know you visited!! <br />
              <span style={{ color: '#ff88aa' }}>~*~ love, Tyler ~*~</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>

            {/* Emoticon glossary */}
            <div style={{ border: '2px solid rgba(255,100,150,0.5)', padding: '12px 14px', background: 'rgba(80,0,30,0.6)' }}>
              <div style={{ fontSize: 13, color: '#ff99bb', textDecoration: 'underline', marginBottom: 10 }}>
                😊 Emoticon Glossary
              </div>
              <div style={{ fontSize: 10, lineHeight: 2.2 }}>
                {EMOTICONS.map(({ em, meaning }) => (
                  <div key={em} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#ffddee', fontFamily: 'monospace', minWidth: 60 }}>{em}</span>
                    <span style={{ color: 'rgba(255,200,220,0.8)' }}>= {meaning}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* About */}
              <div style={{ border: '2px solid rgba(255,100,150,0.5)', padding: '12px 14px', background: 'rgba(80,0,30,0.6)' }}>
                <div style={{ fontSize: 13, color: '#ff99bb', textDecoration: 'underline', marginBottom: 8 }}>
                  💖 About Me
                </div>
                <div style={{ fontSize: 11, color: '#ffccdd', lineHeight: 2 }}>
                  Name: Tyler<br />
                  Location: Boulder, CO 🏔️<br />
                  Sign: <a>Taurus ♉</a><br />
                  Favorite: Purple & crimson<br />
                  Loves: Mountains, code, music<br />
                  Status: 💕 in love with life
                </div>
              </div>

              {/* Favorites */}
              <div style={{ border: '2px solid rgba(255,100,150,0.5)', padding: '12px 14px', background: 'rgba(80,0,30,0.6)' }}>
                <div style={{ fontSize: 13, color: '#ff99bb', textDecoration: 'underline', marginBottom: 8 }}>
                  🌹 Things I Love
                </div>
                <div style={{ fontSize: 10, color: '#ffccdd', lineHeight: 2.2 }}>
                  ❤️ Trail running at dawn<br />
                  💜 Building things from nothing<br />
                  💙 Mountains after rain<br />
                  💚 Music nobody else knows<br />
                  🧡 Finishing what I start<br />
                  🤍 3am when it all clicks
                </div>
              </div>
            </div>
          </div>

          {/* Guestbook sign */}
          <div style={{ border: '2px solid rgba(255,100,150,0.5)', padding: '14px', marginBottom: 14, background: 'rgba(80,0,30,0.6)' }}>
            <div style={{ fontSize: 13, color: '#ff99bb', textDecoration: 'underline', marginBottom: 12 }}>
              📝 Sign My Guestbook!!!
            </div>
            {submitted ? (
              <div style={{ textAlign: 'center', fontSize: 13, color: '#ff88aa', padding: '14px', border: '1px solid rgba(255,100,150,0.4)' }}>
                💕 Thank you for signing!! You made my day!! 💕
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  value={guestName} onChange={e => setGuestName(e.target.value)}
                  placeholder="Your name..."
                  style={{ padding: '6px 10px', background: 'rgba(100,0,40,0.8)', border: '1px solid rgba(255,100,150,0.4)', color: '#ffccdd', fontSize: 11, outline: 'none' }}
                />
                <textarea
                  value={guestMsg} onChange={e => setGuestMsg(e.target.value)}
                  placeholder="Leave a message!! :-)"
                  rows={3}
                  style={{ padding: '6px 10px', background: 'rgba(100,0,40,0.8)', border: '1px solid rgba(255,100,150,0.4)', color: '#ffccdd', fontSize: 11, outline: 'none', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={submitGuest}
                    style={{ padding: '6px 18px', background: '#880033', border: '2px outset #cc4466', color: '#ffccdd', fontSize: 11, cursor: 'pointer' }}
                  >
                    Sign!! 💕
                  </button>
                  <span style={{ fontSize: 10, color: 'rgba(255,180,200,0.5)', alignSelf: 'center' }}>
                    (be nice!! this is a love zone)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Guestbook messages */}
          <div style={{ border: '2px solid rgba(255,100,150,0.5)', padding: '12px 14px', marginBottom: 16, background: 'rgba(80,0,30,0.6)' }}>
            <div style={{ fontSize: 13, color: '#ff99bb', textDecoration: 'underline', marginBottom: 10 }}>
              💬 Guestbook Messages
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ padding: '8px 10px', background: 'rgba(120,0,50,0.5)', borderLeft: '3px solid rgba(255,100,150,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#ff88aa', fontWeight: 'bold' }}>{m.from}</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,180,200,0.4)' }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#ffccdd', lineHeight: 1.7 }}>{m.msg}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', borderTop: '2px double rgba(255,100,150,0.4)', paddingTop: 14 }}>
            <div style={{ fontSize: 18, letterSpacing: '0.3em', marginBottom: 10 }}>💝 💗 💖 💓 💞</div>
            <div style={{ fontSize: 11, lineHeight: 2.4 }}>
              <a onClick={() => navigateTo(1, { type: 'door' })}>← Return to Universe</a>
              &nbsp;·&nbsp; <a>Web Ring of Hearts</a> &nbsp;·&nbsp; <a>My Favorite Love Songs</a>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,180,200,0.4)', marginTop: 10, lineHeight: 2 }}>
              This page is dedicated to everyone who has ever felt something deeply.<br />
              © 1999–2026 · Made with lots of love and Comic Sans
            </div>
          </div>
        </div>
      </div>
      <HomeButton />
    </div>
  )
}
