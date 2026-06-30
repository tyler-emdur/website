'use client'
import { useState } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

const FACTS = [
  'The average person will spend 6 months of their life waiting for red lights to turn green.',
  'Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still perfectly edible.',
  'A group of flamingos is called a "flamboyance." A group of crows is called a "murder." A group of owls is called a "parliament."',
  'The inventors of the Pringles can are now buried inside one. (Partial remains. It is a long story.)',
  'There are more possible iterations of a game of chess than there are atoms in the observable universe.',
  'The sound of thunder is caused by the rapid expansion of air around a lightning bolt. You already knew this but did you really KNOW it?',
  'Bananas are technically berries. Strawberries are technically not berries. Botanists have decided to be difficult.',
  'If you folded a piece of paper 42 times it would reach the moon. You cannot fold it 42 times. Nobody can.',
]

const CALC_BUTTONS = [
  ['sin','cos','tan','π'],
  ['7','8','9','+'],
  ['4','5','6','-'],
  ['1','2','3','*'],
  ['C','0','=','/'],
]

export default function World11Flicker() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [calcDisplay, setCalcDisplay] = useState('5318008')
  const [calcInput, setCalcInput] = useState('')
  const [factIdx, setFactIdx] = useState(0)

  function pressCalc(key: string) {
    if (key === 'C') { setCalcDisplay('0'); setCalcInput(''); return }
    if (key === '=') {
      try {
        const result = Function('"use strict"; return (' + calcInput + ')')()
        const r = String(result)
        setCalcDisplay(r === '5318008' ? '5318008 😏' : r)
        setCalcInput('')
      } catch { setCalcDisplay('ERROR'); setCalcInput('') }
      return
    }
    if (['sin','cos','tan','π'].includes(key)) {
      const map: Record<string,string> = { sin: 'Math.sin(', cos: 'Math.cos(', tan: 'Math.tan(', π: 'Math.PI' }
      const next = calcInput + map[key]
      setCalcInput(next); setCalcDisplay(next)
      return
    }
    const next = calcInput + key
    setCalcInput(next); setCalcDisplay(next)
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', position: 'fixed', inset: 0, overflowY: 'auto',
      background: '#2a3a6e',
      backgroundImage: [
        'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 30px)',
        'repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 30px)',
      ].join(', '),
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#ccddff',
    }}>
      <style>{`
        @keyframes w11-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes w11-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes w11-glow { 0%,100%{box-shadow:0 0 6px #00ff00} 50%{box-shadow:0 0 20px #00ff00,0 0 40px rgba(0,255,0,0.3)} }
        .w11-spin { animation: w11-spin 4s linear infinite }
        .w11-bounce { animation: w11-bounce 2s ease-in-out infinite }
        a { color: #88bbff; text-decoration: underline; cursor: pointer }
        a:hover { color: #ffffff }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(90deg, #1a2255, #2a3a88, #1a2255)', borderBottom: '3px solid #4455aa', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #4466ff, #2244cc)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔬</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.05em' }}>SCIENCE ZONE</div>
          <div style={{ fontSize: 10, color: '#8899cc', letterSpacing: '0.15em' }}>Educational Resources For The Curious Mind</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: '#667799', fontStyle: 'italic' }}>
          "Knowledge is power" — Someone Famous
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '18px 16px 40px' }}>

        {/* Top row: Calculator + Gyroscope + Lava Lamp */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 120px', gap: 14, marginBottom: 14 }}>

          {/* The Calculator */}
          <div style={{ background: '#1a2244', border: '2px solid #3355aa' }}>
            <div style={{ background: '#112', padding: '4px 8px', fontSize: 9, color: '#4466ff', letterSpacing: '0.1em', borderBottom: '1px solid #3355aa' }}>
              SCIENTIFIC CALCULATOR v2.0
            </div>
            {/* Display */}
            <div className="w11-glow" style={{
              margin: '8px', padding: '6px 10px',
              background: '#003300', border: '2px inset #001100',
              fontFamily: '"Courier New", monospace', fontSize: 20,
              color: '#00ff00', textAlign: 'right', letterSpacing: '0.1em',
              minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            }}>
              {calcDisplay.length > 12 ? calcDisplay.slice(-12) : calcDisplay}
            </div>
            {/* Buttons */}
            <div style={{ padding: '4px 8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {CALC_BUTTONS.map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {row.map(btn => (
                    <button
                      key={btn}
                      onClick={() => pressCalc(btn)}
                      style={{
                        padding: '5px 2px', fontFamily: 'Arial, sans-serif', fontSize: 11,
                        background: ['sin','cos','tan','π'].includes(btn) ? '#1a2255' : btn === '=' ? '#2244aa' : '#223',
                        color: btn === '=' ? '#aaddff' : ['sin','cos','tan','π'].includes(btn) ? '#88aaff' : '#ccddff',
                        border: '1px outset #3355aa', cursor: 'pointer', borderRadius: 2,
                      }}
                    >{btn}</button>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ padding: '0 8px 8px', fontSize: 8, color: '#334477', textAlign: 'center' }}>
              Try entering: 5318008 then flip upside down
            </div>
          </div>

          {/* Main science facts column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Did you know */}
            <div style={{ background: '#1a2244', border: '2px solid #3355aa', padding: '12px 14px', flex: 1 }}>
              <div style={{ fontSize: 12, color: '#88aaff', fontWeight: 'bold', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>💡 DID YOU KNOW??</span>
                <button
                  onClick={() => setFactIdx(i => (i + 1) % FACTS.length)}
                  style={{ fontSize: 9, background: '#223', border: '1px outset #3355aa', color: '#88aaff', padding: '2px 8px', cursor: 'pointer' }}
                >NEXT FACT →</button>
              </div>
              <div style={{ fontSize: 12, color: '#ccd8ff', lineHeight: 1.85, fontStyle: 'italic' }}>
                "{FACTS[factIdx]}"
              </div>
              <div style={{ marginTop: 8, fontSize: 8, color: '#445577' }}>
                Fact {factIdx + 1} of {FACTS.length} · Source: The Internet
              </div>
            </div>

            {/* Molecular structure decoration */}
            <div style={{ background: '#1a2244', border: '2px solid #3355aa', padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#88aaff', marginBottom: 8 }}>⚗️ Molecular Diagram (H₂O)</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, position: 'relative', height: 80 }}>
                <div style={{ position: 'absolute', left: '25%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                  <div style={{ width: 26, height: 26, background: '#ff4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 'bold' }}>H</div>
                </div>
                <div style={{ position: 'absolute', left: '50%', top: '30%', transform: 'translate(-50%,-50%)' }}>
                  <div style={{ width: 34, height: 34, background: '#4488ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 'bold' }}>O</div>
                </div>
                <div style={{ position: 'absolute', left: '75%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                  <div style={{ width: 26, height: 26, background: '#ff4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 'bold' }}>H</div>
                </div>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 300 80">
                  <line x1="80" y1="40" x2="150" y2="25" stroke="#667799" strokeWidth="2" />
                  <line x1="150" y1="25" x2="220" y2="40" stroke="#667799" strokeWidth="2" />
                </svg>
              </div>
              <div style={{ fontSize: 8, color: '#445577', textAlign: 'center', marginTop: 4 }}>
                Water (H₂O) · Bond angle: ~104.5° · The molecule of life
              </div>
            </div>
          </div>

          {/* Lava lamp */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 9, color: '#667799', marginBottom: 6, textAlign: 'center' }}>LAVA LAMP</div>
            <div style={{ width: 60, height: 140, background: 'linear-gradient(180deg, #1a0033 0%, #330066 100%)', borderRadius: '30px 30px 10px 10px', border: '3px solid #5544aa', position: 'relative', overflow: 'hidden' }}>
              {[{ top: '20%', size: 20, delay: '0s' }, { top: '50%', size: 26, delay: '0.7s' }, { top: '70%', size: 16, delay: '1.4s' }].map(({ top, size, delay }, i) => (
                <div key={i} className="w11-bounce" style={{
                  position: 'absolute', left: '50%', top,
                  width: size, height: size,
                  background: 'radial-gradient(circle at 35% 35%, #ff66ff, #aa00cc)',
                  borderRadius: '50%',
                  transform: 'translateX(-50%)',
                  animationDelay: delay,
                  filter: 'blur(1px)',
                }} />
              ))}
            </div>
            <div style={{ width: 70, height: 14, background: 'linear-gradient(90deg, #333, #666, #333)', border: '2px solid #444', borderRadius: 3, marginTop: 4 }} />
            <div style={{ fontSize: 8, color: '#445577', marginTop: 4, textAlign: 'center', lineHeight: 1.5 }}>
              Invented 1963<br />Still cool
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { title: '🌍 Earth Facts', items: ['Circumference: 40,075 km', 'Age: 4.5 billion years', '71% covered in water', '1 moon (confirmed)', '7.9 billion humans (approx)'] },
            { title: '⚡ Physics', items: ['Speed of light: 299,792,458 m/s', 'Gravity: 9.81 m/s²', 'Absolute zero: −273.15°C', 'Pi: 3.14159265358979...', 'e = mc² (Einstein said)'] },
            { title: '🧬 Biology', items: ['DNA has 3 billion base pairs', 'Human body: 37 trillion cells', 'Brain: 86 billion neurons', 'Heart beats: 100,000/day', 'You share 60% DNA with a banana'] },
          ].map(({ title, items }) => (
            <div key={title} style={{ background: '#1a2244', border: '2px solid #3355aa', padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: '#88aaff', fontWeight: 'bold', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 9, color: '#aabbdd', lineHeight: 2 }}>
                {items.map(item => <div key={item}>· {item}</div>)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, textAlign: 'center', borderTop: '1px solid #2a3a6e', paddingTop: 12 }}>
          <div style={{ fontSize: 10, color: '#445577', lineHeight: 2 }}>
            <a onClick={() => navigateTo(1, { type: 'door' })}>← Back to Universe</a>
            &nbsp;·&nbsp; <a>Sign Guestbook</a> &nbsp;·&nbsp; <a>Web Ring</a>
          </div>
          <div style={{ fontSize: 8, color: '#334466', marginTop: 6 }}>
            Science Zone · For Educational Purposes · All facts verified by the Internet
          </div>
        </div>

      </div>
      <HomeButton />
    </div>
  )
}
