'use client'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

export default function World5FieldStation() {
  const navigateTo = useWorldStore(s => s.navigateTo)

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', position: 'fixed', inset: 0, overflowY: 'auto',
      background: '#0d001a',
      backgroundImage: [
        'radial-gradient(circle, rgba(180,140,255,0.7) 1px, transparent 1px)',
        'radial-gradient(circle, rgba(220,180,255,0.4) 1px, transparent 1px)',
        'radial-gradient(circle, rgba(140,80,200,0.3) 1px, transparent 1px)',
      ].join(', '),
      backgroundSize: '60px 60px, 28px 28px, 13px 13px',
      backgroundPosition: '0 0, 18px 18px, 9px 25px',
      fontFamily: 'Times New Roman, Times, serif',
      color: '#ddbbff',
    }}>
      <style>{`
        @keyframes w5-shimmer { 0%,100%{opacity:0.7;text-shadow:0 0 8px #aa66ff,0 0 20px #7700cc} 50%{opacity:1;text-shadow:0 0 14px #cc88ff,0 0 35px #9900ff,0 0 60px #660099} }
        @keyframes w5-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes w5-sparkle { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.9)} }
        @keyframes w5-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .w5-shimmer { animation: w5-shimmer 2.5s ease-in-out infinite }
        .w5-float { animation: w5-float 4s ease-in-out infinite }
        .w5-sparkle { animation: w5-sparkle 1.5s ease-in-out infinite }
        a { color: #cc88ff; text-decoration: underline; cursor: pointer }
        a:hover { color: #ffffff }
        hr { border: none; border-top: 1px solid rgba(180,100,255,0.3); margin: 16px 0 }
      `}</style>

      {/* Gothic border top */}
      <div style={{ height: 12, background: 'linear-gradient(90deg, #330066, #660099, #440077, #550088, #330066)', backgroundSize: '200px 100%' }} />

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '28px 16px 16px', borderBottom: '2px double rgba(180,100,255,0.4)' }}>
        <div className="w5-shimmer" style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', fontFamily: '"Times New Roman", serif', fontStyle: 'italic', color: '#cc88ff', letterSpacing: '0.06em', marginBottom: 8 }}>
          ✦ Fantasy Realm ✦
        </div>
        <div style={{ fontSize: 13, color: 'rgba(200,160,255,0.7)', fontStyle: 'italic', letterSpacing: '0.1em' }}>
          A Realm of Magic and Wonder — Est. in the Age of Myth
        </div>
        <div style={{ marginTop: 10, fontSize: 22, letterSpacing: '0.5em' }}>🌙 ⭐ 🌙</div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Welcome message */}
        <div style={{ border: '1px solid rgba(180,100,255,0.4)', padding: '14px 18px', marginBottom: 18, background: 'rgba(40,0,80,0.6)', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontStyle: 'italic', lineHeight: 1.9, color: '#ccaaff' }}>
            You have entered a realm of magic and wonder.<br />
            May the stars guide your journey and the crystals light your way.<br />
            <span style={{ fontSize: 12, color: 'rgba(180,140,255,0.6)' }}>~*~ Blessed be all who enter here ~*~</span>
          </div>
        </div>

        {/* Main creatures grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          {[
            { emoji: '🦄', name: 'The Silver Unicorn', desc: 'Guardian of pure hearts. Its horn heals all wounds. Seen only by those who truly believe.', color: '#ddbbff' },
            { emoji: '🐉', name: 'The Ancient Dragon', desc: 'Keeper of forbidden knowledge. Do not approach without an offering of crystals or poetry.', color: '#ff9966' },
            { emoji: '🐺', name: 'The Midnight Wolf', desc: 'Runs beneath the full moon. Howls that can be heard across three realms simultaneously.', color: '#aabbff' },
            { emoji: '👼', name: 'The Mystic Angel', desc: 'Appears at crossroads and in dreams. Carries messages between this world and the next.', color: '#ffffcc' },
          ].map(({ emoji, name, desc, color }) => (
            <div key={name} style={{ border: '1px solid rgba(180,100,255,0.3)', padding: '12px 14px', background: 'rgba(30,0,60,0.7)' }}>
              <div className="w5-float" style={{ fontSize: 32, textAlign: 'center', marginBottom: 8, display: 'block' }}>{emoji}</div>
              <div style={{ fontSize: 12, color, fontWeight: 'bold', marginBottom: 6, textAlign: 'center', fontStyle: 'italic' }}>{name}</div>
              <div style={{ fontSize: 10, color: 'rgba(200,160,255,0.7)', lineHeight: 1.8 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Crystals and gems */}
        <div style={{ border: '1px solid rgba(180,100,255,0.4)', padding: '14px 18px', marginBottom: 18, background: 'rgba(40,0,80,0.5)' }}>
          <div style={{ fontSize: 14, color: '#cc88ff', textDecoration: 'underline', marginBottom: 10, fontStyle: 'italic' }}>
            ✦ Crystal Compendium
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', fontSize: 11, lineHeight: 2.2, color: '#ccaaff' }}>
            {[
              { gem: '💜', name: 'Amethyst', power: 'Calm, wisdom, protection' },
              { gem: '💎', name: 'Sapphire', power: 'Truth, loyalty, the heavens' },
              { gem: '❤️', name: 'Ruby', power: 'Passion, courage, life force' },
              { gem: '💚', name: 'Emerald', power: 'Growth, harmony, the earth' },
              { gem: '🤍', name: 'Moonstone', power: 'Intuition, mystery, travel' },
              { gem: '🔮', name: 'Crystal Ball', power: 'Vision, prophecy, the unknown' },
            ].map(({ gem, name, power }) => (
              <div key={name}>
                <span style={{ fontSize: 16, marginRight: 6 }}>{gem}</span>
                <span style={{ color: '#ffffff' }}>{name}</span>
                <span style={{ color: 'rgba(180,140,255,0.5)', fontSize: 9 }}> — {power}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div style={{ textAlign: 'center', margin: '20px 0', padding: '14px', borderTop: '1px solid rgba(180,100,255,0.2)', borderBottom: '1px solid rgba(180,100,255,0.2)' }}>
          <div style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(200,160,255,0.8)', lineHeight: 1.9 }}>
            "In a world of ordinary mortals, be a unicorn."<br />
            <span style={{ fontSize: 10, color: 'rgba(180,140,255,0.5)' }}>— The Ancient Scrolls of the Fantasy Realm, Vol. II</span>
          </div>
        </div>

        {/* Roses border decoration */}
        <div style={{ textAlign: 'center', fontSize: 18, letterSpacing: '0.3em', marginBottom: 18, color: 'rgba(200,100,200,0.7)' }}>
          🌹 🌹 🌹 🌹 🌹 🌹 🌹 🌹 🌹
        </div>

        {/* Navigation */}
        <div style={{ border: '1px solid rgba(180,100,255,0.4)', padding: '12px 16px', background: 'rgba(30,0,60,0.7)', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(180,140,255,0.6)', marginBottom: 8 }}>⚔️ Navigate the Realm ⚔️</div>
          <div style={{ fontSize: 12, lineHeight: 2.4 }}>
            <a>The Unicorn Sanctuary</a> &nbsp;·&nbsp; <a>Dragon Tales</a> &nbsp;·&nbsp; <a>Crystal Magic</a><br />
            <a>The Dark Forest</a> &nbsp;·&nbsp; <a>Spellbook Archive</a> &nbsp;·&nbsp;
            <a onClick={() => navigateTo(1, { type: 'door' })}>← Leave the Realm</a>
          </div>
        </div>

        {/* Visitor counter */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 9, color: 'rgba(180,140,255,0.5)', marginBottom: 4 }}>mystical visitors</div>
          <div style={{ fontFamily: 'monospace', fontSize: 20, color: '#9933ff', letterSpacing: '0.2em', textShadow: '0 0 10px #6600cc' }}>
            014,782
          </div>
          <div style={{ fontSize: 9, color: 'rgba(180,140,255,0.3)', marginTop: 6 }}>
            This page is <a>web-ring certified</a> · Last updated during a full moon
          </div>
        </div>

      </div>

      {/* Bottom border */}
      <div style={{ height: 12, background: 'linear-gradient(90deg, #330066, #660099, #440077, #550088, #330066)' }} />
      <HomeButton />
    </div>
  )
}
