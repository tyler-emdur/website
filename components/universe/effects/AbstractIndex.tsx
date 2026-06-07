'use client'
import { useEffect, useMemo, useState } from 'react'

const TAGS = [
  'weather for a room that has no roof',
  'index of half-decisions',
  'click the wrong thing',
  'portfolio / not portfolio',
  'receipt found inside a browser',
  'sector with no deliverable',
  'loading the previous visitor',
  'annotation pretending to be a door',
  'image missing from the future',
  'scroll until it lies',
]

const FLOATERS = [
  'TYPOGRAPHIC RESIDUE',
  '5051?',
  'S I G N A L / S A L A D',
  'DO NOT SORT',
  '38 SPACES MISVISITED',
  'milk.exe',
  'COLOR: MAYBE',
  'A SMALL BAD MAP',
  'OPENING HOURS: 02:17-02:18',
  'PERMISSION TO WANDER',
  'NO HERO SECTION FOUND',
  'ALT TEXT FOR A DREAM',
]

const SPECIMENS = [
  'banana longitude',
  'folder named folder named folder',
  'tiny chair inventory',
  'half marathon for pixels',
  'unpaid moon invoice',
  'three tabs arguing',
  'a button that remembers you',
  'Colorado but misspelled',
]

const glyphs = ['∴', '※', '⌁', '░', '◌', '□', '↯', '0', '1', '?', '§', '×']

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

export default function AbstractIndex() {
  const [mounted, setMounted] = useState(false)
  const [drift, setDrift] = useState({ x: 0, y: 0 })
  const [phrase, setPhrase] = useState(TAGS[0])
  const [visits, setVisits] = useState(0)
  const [specimens, setSpecimens] = useState<string[]>([])
  const [scramble, setScramble] = useState(false)

  const floaters = useMemo(() => FLOATERS.map((label, i) => ({
    label,
    top: 8 + ((i * 19) % 84),
    left: 4 + ((i * 29) % 88),
    rotate: -18 + ((i * 11) % 37),
    delay: i * -0.73,
  })), [])

  useEffect(() => {
    setMounted(true)
    const phraseTimer = setInterval(() => setPhrase(pick(TAGS)), 3200)
    const scrambleTimer = setInterval(() => setScramble(v => !v), 1700)

    const onMove = (event: PointerEvent) => {
      setDrift({
        x: (event.clientX / window.innerWidth - 0.5) * 18,
        y: (event.clientY / window.innerHeight - 0.5) * 18,
      })
    }

    window.addEventListener('pointermove', onMove)
    return () => {
      clearInterval(phraseTimer)
      clearInterval(scrambleTimer)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  if (!mounted) return null

  const mutate = () => {
    setVisits(v => v + 1)
    setPhrase(pick(TAGS))
    setSpecimens(items => [pick(SPECIMENS), ...items].slice(0, 5))
  }

  return (
    <div className="abstract-index">
      <button
        className="abstract-index__plate"
        type="button"
        onClick={mutate}
        style={{ transform: `translate(${drift.x}px, ${drift.y}px) rotate(${scramble ? -1.5 : 1.5}deg)` }}
      >
        <span className="abstract-index__eyebrow">HIGHLIGHTS FROM THE CONFUSING COLLECTION</span>
        <span className="abstract-index__title">{scramble ? 'TYL ER / EM DUR' : 'TYLER EMDUR'}</span>
        <span className="abstract-index__phrase">{phrase}</span>
        <span className="abstract-index__counter">SPACES MISUNDERSTOOD {'->'} {String(visits).padStart(3, '0')} / 378</span>
      </button>

      <div className="abstract-index__ticker">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i}>{i % 2 ? pick(glyphs) : pick(FLOATERS)}</span>
        ))}
      </div>

      {floaters.map(item => (
        <button
          key={item.label}
          className="abstract-index__floater"
          type="button"
          onClick={mutate}
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            transform: `rotate(${item.rotate + (scramble ? 4 : 0)}deg)`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.label}
        </button>
      ))}

      <div className="abstract-index__specimens">
        <div className="abstract-index__stamp">RANDOM STUFF</div>
        {specimens.length === 0 ? (
          <p>click a label for unsolicited inventory</p>
        ) : specimens.map((item, i) => (
          <p key={`${item}-${i}`}>{String(i + 1).padStart(2, '0')} / {item}</p>
        ))}
      </div>
    </div>
  )
}
