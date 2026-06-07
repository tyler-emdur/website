'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorldStore, type WorldId } from '@/lib/world-store'
import HomeButton from './HomeButton'

interface DoorDef {
  label: string
  sub: string
  world?: WorldId
  portal?: 'fold' | 'vortex' | 'nothing' | 'scatter' | 'expand-white' | 'chromatic' | 'slide-right' | 'cursor-flood' | 'rotate'
  loop?: boolean
}

const ROOMS: DoorDef[][] = [
  [
    { label: 'NORTH', sub: 'coordinates: 10.0, 10.0', loop: true },
    { label: 'EAST', sub: 'coordinates: 10.1, 10.0', loop: true },
    { label: 'SOUTH', sub: 'coordinates: 9.9, 10.0', world: 12, portal: 'nothing' },
    { label: 'WEST', sub: 'coordinates: 10.0, 9.9', loop: true },
  ],
  [
    { label: 'NORTH', sub: 'coordinates: 10.0, 10.0', loop: true },
    { label: 'EAST', sub: 'coordinates: 10.0, 10.0', loop: true },
    { label: 'SOUTH', sub: 'coordinates: 10.0, 10.0', world: 13, portal: 'vortex' },
    { label: 'WEST', sub: 'coordinates: 10.0, 10.0', loop: true },
  ],
  [
    { label: 'NORTH', sub: 'coordinates: ???, ???', loop: true },
    { label: 'EAST', sub: 'same room. different door.', loop: true },
    { label: 'SOUTH', sub: 'you have been here', loop: true },
    { label: 'EXIT', sub: 'if you can find it', world: 11, portal: 'scatter' },
  ],
  [
    { label: 'BACK', sub: 'to before you knew', world: 2, portal: 'fold' },
    { label: 'FORWARD', sub: 'deeper still', world: 6, portal: 'nothing' },
    { label: 'SIDEWAYS', sub: 'channel 99', world: 3, portal: 'expand-white' },
    { label: 'PIXEL', sub: 'insert coin', world: 14, portal: 'chromatic' },
    { label: 'DIAL', sub: '88.0—108.0', world: 15, portal: 'chromatic' },
    { label: 'INDEX', sub: 'incomplete list', world: 16, portal: 'fold' },
    { label: 'NOWHERE', sub: 'universe', world: 1, portal: 'fold' },
  ],
]

const OBSERVATIONS = [
  'the wallpaper repeats every 4 meters',
  'someone scratched "10" into the baseboard',
  'a faint hum — 60hz or your imagination',
  'the light fixture flickers on a prime number schedule',
  'footprints. yours. older than you remember.',
  'the door numbers don\'t add up',
  'the floor\'s tilt is 0.3 degrees. you can\'t feel it yet.',
  'the air gets colder toward the center',
  'there is a second room behind this one. it is identical.',
  'the hum has a frequency: 88.7',
  'the coordinates don\'t exist on any map you know',
  'someone has been counting. the marks are yours.',
]

const WALL_COLORS = ['#0d0d12', '#111018', '#0f0e14', '#12101a']

export default function World10Loop() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [roomIndex, setRoomIndex] = useState(0)
  const [loops, setLoops] = useState(0)
  const [flash, setFlash] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [showLog, setShowLog] = useState(false)
  const visitCount = useRef(0)

  useEffect(() => {
    document.title = loops > 6
      ? 'room 10 · room 10 · room 10 · room 10'
      : 'room 10 · room 10 · room 10'
  }, [loops])

  const handleDoor = useCallback((door: DoorDef, e: React.MouseEvent) => {
    visitCount.current++
    if (door.world != null && door.portal) {
      navigateTo(door.world, { type: door.portal, origin: { x: e.clientX, y: e.clientY } })
      return
    }
    if (door.loop) {
      setFlash(true)
      setTimeout(() => setFlash(false), 120)
      const newLoops = loops + 1
      setLoops(newLoops)
      setRoomIndex(i => (i + 1 + Math.floor(Math.random() * 2)) % 3)

      // Add observation to log
      const obsIdx = Math.min(newLoops - 1, OBSERVATIONS.length - 1)
      if (newLoops <= OBSERVATIONS.length) {
        setLog(prev => {
          const obs = OBSERVATIONS[obsIdx]
          if (prev.includes(obs)) return prev
          return [...prev, obs]
        })
      }

      if (visitCount.current >= 8 && roomIndex < 3) {
        setTimeout(() => setRoomIndex(3), 400)
      }
    }
  }, [navigateTo, roomIndex, loops])

  const doors = roomIndex === 3 ? ROOMS[3] : ROOMS[roomIndex % 3]
  const wallColor = WALL_COLORS[roomIndex % WALL_COLORS.length]

  // Tally marks — 5-bar system
  const renderTallyMarks = (count: number) => {
    const groups = Math.floor(count / 5)
    const rem = count % 5
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {Array.from({ length: groups }).map((_, g) => (
          <div key={g} style={{ position: 'relative', width: 24, height: 20 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                position: 'absolute', left: i * 5, top: 0, width: 2, height: 20,
                background: 'rgba(255,255,255,0.25)',
              }} />
            ))}
            <div style={{
              position: 'absolute', left: -2, top: '50%', width: 28, height: 2,
              background: 'rgba(255,255,255,0.2)',
              transform: 'rotate(-15deg)',
            }} />
          </div>
        ))}
        {rem > 0 && (
          <div style={{ position: 'relative', width: 24, height: 20 }}>
            {Array.from({ length: rem }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', left: i * 5, top: 0, width: 2, height: 20,
                background: 'rgba(255,255,255,0.25)',
              }} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      data-world="10"
      style={{
        position: 'fixed', inset: 0,
        background: wallColor,
        overflow: 'hidden',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {/* Flash on loop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: flash ? 'rgba(255,255,255,0.06)' : 'transparent',
        transition: 'background 0.08s',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Ceiling perspective */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: '35%',
        background: `linear-gradient(180deg, ${wallColor} 0%, rgba(0,0,0,0.4) 100%)`,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transform: 'perspective(400px) rotateX(12deg)',
        transformOrigin: 'top center',
      }} />

      {/* Floor */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%',
        background: 'linear-gradient(0deg, #08080c 0%, transparent 100%)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 56,
      }}>
        {/* Tally marks scratched into the floor */}
        {loops > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.2em', marginBottom: 4 }}>
              TIMES THROUGH
            </div>
            {renderTallyMarks(loops)}
          </div>
        )}
        {loops === 0 && (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.2em' }}>
            the wallpaper repeats every 4 meters
          </div>
        )}
      </div>

      {/* Doors */}
      <div style={{
        position: 'absolute', top: '38%', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: loops > 4 ? 8 : 24, transition: 'gap 0.5s',
      }}>
        {doors.map(door => (
          <button
            key={door.label + door.sub}
            onClick={e => handleDoor(door, e)}
            style={{
              width: loops > 5 ? 52 : 72,
              height: loops > 5 ? 100 : 130,
              background: 'rgba(15,12,20,0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'width 0.4s, height 0.4s, border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            <div style={{
              position: 'absolute', right: 8, top: '50%',
              width: 4, height: 4, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
            }} />
            <div style={{
              position: 'absolute', bottom: -36, left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap', fontSize: 8,
              color: door.label === 'EXIT' ? 'rgba(99,241,150,0.6)' : 'rgba(255,255,255,0.35)',
              letterSpacing: '0.15em',
            }}>
              {door.label}
            </div>
          </button>
        ))}
      </div>

      {/* HUD — top left */}
      <div style={{
        position: 'absolute', top: 24, left: 24,
        fontSize: 9, color: 'rgba(255,255,255,0.2)',
        letterSpacing: '0.12em', lineHeight: 2,
        zIndex: 2,
      }}>
        <div>ROOM: 10.{roomIndex}.{loops % 10}</div>
        <div>LOOPS: {loops}</div>
        <div style={{ opacity: loops > 3 ? 1 : 0.3 }}>
          STATUS: {loops > 7 ? 'UNSTABLE' : 'NOMINAL'}
        </div>
      </div>

      {/* Top right: context */}
      <div style={{
        position: 'absolute', top: 24, right: 32,
        fontSize: 8, color: 'rgba(99,102,241,0.25)',
        letterSpacing: '0.2em', textAlign: 'right',
        zIndex: 2,
      }}>
        THE LOOP
        <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.1)' }}>
          {loops < 4 ? 'pick a door' : loops < 8 ? 'they all look the same' : 'something is different now'}
        </div>
      </div>

      {/* Discovery log button */}
      {log.length > 0 && (
        <button
          onClick={() => setShowLog(s => !s)}
          style={{
            position: 'fixed', bottom: 24, right: 32,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: 'rgba(99,102,241,0.7)',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 8, padding: '6px 14px',
            cursor: 'pointer', letterSpacing: '0.15em',
            zIndex: 10,
          }}
        >
          LOG ({log.length}) {showLog ? '▲' : '▼'}
        </button>
      )}

      {/* Discovery log panel */}
      {showLog && log.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 64, right: 32,
          width: 300,
          background: 'rgba(8,6,16,0.95)',
          border: '1px solid rgba(99,102,241,0.3)',
          padding: '16px',
          zIndex: 10,
          maxHeight: 300, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 7, color: 'rgba(99,102,241,0.5)', letterSpacing: '0.25em', marginBottom: 12 }}>
            OBSERVATIONS
          </div>
          {log.map((obs, i) => (
            <div key={i} style={{
              fontSize: 8, color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.06em', lineHeight: 2,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              paddingBottom: 6, marginBottom: 6,
            }}>
              <span style={{ color: 'rgba(99,102,241,0.4)' }}>{(i + 1).toString().padStart(2, '0')}.</span> {obs}
            </div>
          ))}
          {loops >= 8 && (
            <div style={{ marginTop: 8, fontSize: 8, color: 'rgba(99,241,150,0.4)', letterSpacing: '0.1em', lineHeight: 1.8 }}>
              pattern recognized.<br />
              an exit has appeared.
            </div>
          )}
        </div>
      )}

      {/* Scratch on wall: room number, different each loop */}
      {loops > 2 && (
        <div style={{
          position: 'absolute', top: '42%', left: 32,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 8, color: 'rgba(255,255,255,0.06)',
          letterSpacing: '0.2em', lineHeight: 2,
          transform: 'rotate(-90deg)', transformOrigin: 'left center',
        }}>
          10 · 10 · 10 · 10 · 10
        </div>
      )}

      <HomeButton />
    </div>
  )
}
