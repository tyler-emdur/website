'use client'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

const FISH = [
  { emoji: '🐬', name: 'Dolphin', fact: 'Dolphins are also called "Angles of the sea." They are very smart and friendly to humans and each other.', color: '#0055cc' },
  { emoji: '🦈', name: 'Shark', fact: 'Did you know sharks have been around for 450 million years? That is older than trees!! Sharks do not have bones.', color: '#336699' },
  { emoji: '🧜', name: 'Mermaid', fact: 'Mermaids are half human half fish. Sailors used to see them all the time but scientists say this is because of manatees which look similar when you are tired.', color: '#0088aa' },
  { emoji: '🐙', name: 'Octopus', fact: 'The octopus has 8 arms (not tentacles!!) and three hearts. It can change color AND shape. Nature is very cool sometimes.', color: '#4455aa' },
  { emoji: '🪼', name: 'Jellyfish', fact: 'Jellyfish have no brain, no heart, and no bones. They are 95% water. Some of them glow in the dark which is called bioluminescence (big word!!).', color: '#0099bb' },
  { emoji: '🐠', name: 'Clown Fish', fact: 'Clown fish live in sea anemones. The anemone does not sting them because they have a special coating. They are IMMUNE. Just like in that movie.', color: '#ff6600' },
]

export default function World6Document() {
  const navigateTo = useWorldStore(s => s.navigateTo)

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', position: 'fixed', inset: 0, overflowY: 'auto',
      background: '#1177dd',
      backgroundImage: [
        'radial-gradient(ellipse 120% 60% at 50% 100%, #0044aa 0%, transparent 60%)',
        'radial-gradient(ellipse 80% 40% at 50% 105%, #003388 0%, transparent 50%)',
      ].join(', '),
      fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
      color: '#ffffff',
    }}>
      <style>{`
        @keyframes w6-swim { 0%{transform:translateX(0)} 50%{transform:translateX(8px)} 100%{transform:translateX(0)} }
        @keyframes w6-bubble { 0%{transform:translateY(0);opacity:0.6} 100%{transform:translateY(-40px);opacity:0} }
        @keyframes w6-wave { 0%,100%{border-radius:40% 60% 60% 40%/40% 40% 60% 60%} 50%{border-radius:60% 40% 40% 60%/60% 60% 40% 40%} }
        .w6-swim { animation: w6-swim 2s ease-in-out infinite }
        a { color: #ffff44; text-decoration: underline; cursor: pointer }
        a:hover { color: #ffffff }
      `}</style>

      {/* Sun + surface */}
      <div style={{ background: 'linear-gradient(180deg, #66bbff 0%, #3399ff 30%, #1177dd 100%)', padding: '20px 16px 0', textAlign: 'center', position: 'relative' }}>
        {/* Sun */}
        <div style={{ position: 'absolute', top: 16, right: '15%', width: 50, height: 50, background: '#ffdd00', borderRadius: '50%', boxShadow: '0 0 20px #ffcc00, 0 0 40px rgba(255,220,0,0.4)' }} />

        <div style={{ fontSize: 'clamp(2rem,7vw,4rem)', fontWeight: 'bold', color: '#ffffff', textShadow: '2px 2px #0044aa', marginBottom: 4 }}>
          🌊 OCEAN WORLD 🌊
        </div>
        <div style={{ fontSize: 13, color: '#cceeFF', marginBottom: 12 }}>
          Welcome to the Deep! Learn about the amazing creatures of the sea!!!
        </div>

        {/* Wave divider */}
        <div style={{ height: 30, background: '#0d66cc', borderRadius: '50% 50% 0 0 / 30px 30px 0 0', margin: '0 -16px' }} />
      </div>

      <div style={{ background: '#0d66cc', padding: '0 16px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 0 40px' }}>

          {/* Fun fact banner */}
          <div style={{ background: '#ffcc00', color: '#000000', padding: '10px 14px', marginBottom: 18, textAlign: 'center', border: '3px solid #ff9900', borderRadius: 4 }}>
            <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>🌟 FUN FACT OF THE DAY!! 🌟</div>
            <div style={{ fontSize: 11, lineHeight: 1.7 }}>
              The ocean covers <strong>71%</strong> of the Earth's surface but humans have only explored about <strong>5%</strong> of it.
              That means there is probably a TON of stuff down there we dont even know about yet!!
            </div>
          </div>

          {/* Fish cards */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center', color: '#aaddff', textDecoration: 'underline' }}>
              🐟 Meet the Animals of the Sea!! 🐟
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {FISH.map(({ emoji, name, fact, color }) => (
                <div key={name} style={{ background: `rgba(0,30,80,0.6)`, border: `3px solid ${color}`, padding: '12px 14px', borderRadius: 4 }}>
                  <div className="w6-swim" style={{ fontSize: 34, textAlign: 'center', display: 'block', marginBottom: 6 }}>{emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: '#aaddff', marginBottom: 8, textDecoration: 'underline' }}>
                    {name.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, lineHeight: 1.9, color: '#cce8ff' }}>{fact}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Did you know section */}
          <div style={{ border: '3px solid #4499ff', padding: '14px 18px', marginBottom: 18, background: 'rgba(0,20,60,0.5)', borderRadius: 4 }}>
            <div style={{ fontSize: 14, color: '#aaddff', marginBottom: 10, textDecoration: 'underline' }}>
              🔍 Did You Know???
            </div>
            <div style={{ fontSize: 11, lineHeight: 2.2, color: '#cce8ff' }}>
              ★ The blue whale is the largest animal to have EVER LIVED on Earth. Its heart is the size of a small car!!<br />
              ★ Starfish (sea stars) can regenerate their arms. If one falls off it can grow back. Sometimes the arm grows a whole new body!<br />
              ★ The ocean makes the sound you hear in a seashell. Actually that is not true - it is just air. But it sounds like the ocean which is cool.<br />
              ★ Sea otters hold hands while sleeping so they don't drift away from each other. They call this a "raft." This is real.<br />
              ★ There are mountains in the ocean taller than Mount Everest. We have better maps of Mars than of our own ocean floor.
            </div>
          </div>

          {/* Coral reef decoration */}
          <div style={{ textAlign: 'center', marginBottom: 18, fontSize: 22, letterSpacing: '0.3em' }}>
            🪸 🐚 🦀 🐡 🪸 🐚 🦀 🐡 🪸
          </div>

          {/* Ocean zones */}
          <div style={{ border: '3px solid #4499ff', padding: '14px 18px', marginBottom: 18, background: 'rgba(0,20,60,0.5)', borderRadius: 4 }}>
            <div style={{ fontSize: 14, color: '#aaddff', marginBottom: 10, textDecoration: 'underline' }}>
              🌊 The Zones of the Ocean
            </div>
            {[
              { zone: 'Sunlight Zone (0–200m)', fact: 'Most sea life lives here. Light can reach. Coral reefs, fish, dolphins, sharks.', bg: '#1166cc' },
              { zone: 'Twilight Zone (200–1000m)', fact: 'Getting dark. Bioluminescent creatures start here. Some weird stuff.', bg: '#0044aa' },
              { zone: 'Midnight Zone (1000–4000m)', fact: 'Completely dark. Anglerfish live here with their little light. Very creepy.', bg: '#002266' },
              { zone: 'The Abyss (4000–6000m)', fact: 'Almost nothing lives here. Extreme pressure. Cold. Basically another planet.', bg: '#001133' },
            ].map(({ zone, fact, bg }) => (
              <div key={zone} style={{ display: 'flex', gap: 10, marginBottom: 6, padding: '6px 10px', background: bg, borderRadius: 2 }}>
                <div style={{ fontSize: 10, color: '#aaddff', fontWeight: 'bold', whiteSpace: 'nowrap', minWidth: 180 }}>{zone}</div>
                <div style={{ fontSize: 10, color: '#cce8ff' }}>{fact}</div>
              </div>
            ))}
          </div>

          {/* Footer nav */}
          <div style={{ textAlign: 'center', borderTop: '2px solid rgba(100,180,255,0.3)', paddingTop: 14 }}>
            <div style={{ fontSize: 12, lineHeight: 2.6 }}>
              🐬 <a>Dolphin Facts</a> &nbsp;|&nbsp; 🦈 <a>Shark Tracker</a> &nbsp;|&nbsp; 🌊 <a>Ocean News</a> &nbsp;|&nbsp;
              <a onClick={() => navigateTo(1, { type: 'door' })}>← Back to Universe</a>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(150,200,255,0.5)', marginTop: 10, lineHeight: 2 }}>
              This page is dedicated to the ocean and all its creatures 🌊<br />
              Save the ocean!! Reduce plastic!! 🐢<br />
              Best viewed underwater · © Ocean World 1998–2026
            </div>
          </div>

        </div>
      </div>

      <HomeButton />
    </div>
  )
}
