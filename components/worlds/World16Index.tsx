'use client'
import { useMemo, useState } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

interface IndexCell {
  id: string
  label: string
  sub?: string
  world?: WorldId
  portal?: PortalType
  fake?: boolean
  needsSecret?: string
  locked?: string
  clickMsg?: string[]
}

const CELLS: IndexCell[] = [
  { id: 's0', label: 'SURFACE', sub: '0', world: 0, portal: 'door' },
  { id: 's1', label: 'UNIVERSE', sub: '1', world: 1, portal: 'fold' },
  { id: 's2', label: 'DEPTH', sub: '2', world: 2, portal: 'scatter' },
  { id: 's3', label: 'BROADCAST', sub: '3', world: 3, portal: 'expand-white' },
  { id: 's4', label: 'CORRIDOR', sub: '4', world: 4, portal: 'slide-right' },
  { id: 's5', label: 'FIELD STN', sub: '5', world: 5, portal: 'rotate' },
  { id: 's6', label: 'DOCUMENT', sub: '6', world: 6, portal: 'nothing' },
  { id: 's7', label: 'MALL', sub: '7', world: 7, portal: 'cursor-flood' },
  { id: 's8', label: 'SIGNAL', sub: '8', world: 8, portal: 'fold' },
  { id: 's9', label: 'CONTACT', sub: '9', world: 9, portal: 'expand-white' },
  { id: 's10', label: 'LOOP', sub: '10', world: 10, portal: 'vortex' },
  { id: 's11', label: 'FLICKER', sub: '11', world: 11, portal: 'scatter' },
  { id: 's12', label: 'TERMINAL', sub: '12', world: 12, portal: 'nothing' },
  { id: 's13', label: 'SPIRAL', sub: '13', world: 13, portal: 'vortex' },
  { id: 's14', label: '★ PIXEL ★', sub: '14', world: 14, portal: 'chromatic' },
  { id: 's15', label: 'DIAL', sub: '15', world: 15, portal: 'chromatic' },
  { id: 'fake1', label: 'ATTIC', sub: '—', fake: true, clickMsg: ['locked from inside', 'knock again', 'no answer'] },
  { id: 'fake2', label: 'BASEMENT', sub: '—', fake: true, clickMsg: ['flooded', 'always was', 'forget it'] },
  { id: 'fake3', label: 'WORLD 17', sub: '???', fake: true, clickMsg: ['not mounted', 'never was', 'stop counting'] },
  { id: 'fake4', label: 'NULL', sub: '∅', fake: true, clickMsg: ['0 objects', '0 worlds', '0 you'] },
  { id: 'fake5', label: 'CACHE', sub: 'tmp', fake: true, clickMsg: ['cleared', 'except this', 'recursive'] },
  { id: 'fake6', label: 'MIRROR', sub: 'you', fake: true, clickMsg: ['already here', 'look behind you', 'just kidding'] },
  { id: 'secret1', label: 'VAULT', sub: '🔒', needsSecret: 'pixel-coins-max', world: 14, portal: 'chromatic', locked: 'collect all pixel coins' },
  { id: 'secret2', label: 'ARCHIVE+', sub: '🔒', needsSecret: 'dial-8-stations', world: 15, portal: 'nothing', locked: 'find 8 radio stations' },
  { id: 'worm', label: 'RANDOM', sub: '?', world: undefined, portal: undefined, clickMsg: ['rolling…'] },
  { id: 'worm2', label: 'AGAIN', sub: '↻', world: undefined, portal: undefined, clickMsg: ['different each time'] },
  { id: 'idx', label: 'INDEX', sub: '16', fake: true, clickMsg: ['you are here', 'you are here', 'you are here'] },
  { id: 'fake7', label: 'LOBBY', sub: '…', fake: true, clickMsg: ['elevator broken', 'use stairs', 'stairs also broken'] },
  { id: 'fake8', label: 'ERROR', sub: '418', fake: true, clickMsg: ['i am a teapot', 'short and stout', 'tip me over'] },
  { id: 'fake9', label: 'DREAM', sub: 'zz', fake: true, clickMsg: ['wake up', 'no', 'wake up'] },
  { id: 'fake10', label: 'BUFFER', sub: '…', fake: true, clickMsg: ['loading', 'still loading', 'give up'] },
  { id: 'fake11', label: 'SECTOR Ω', sub: '—', fake: true, clickMsg: ['decommissioned', '2019', 'maybe'] },
  { id: 'fake12', label: 'EXIT', sub: '→', fake: true, clickMsg: ['no exits', 'only entrances', 'only wormholes'] },
  { id: 'fake13', label: 'HELP', sub: '?', fake: true, clickMsg: ['no help available', 'type help', 'that wont work here'] },
  { id: 'fake14', label: 'LORE', sub: '∞', fake: true, clickMsg: ['tyler built this', 'you found it', 'good'] },
  { id: 'fake15', label: 'NEXT', sub: '→', fake: true, clickMsg: ['there is no next', 'only sideways'] },
  { id: 'fake16', label: 'PREV', sub: '←', fake: true, clickMsg: ['cant go back', 'wouldnt anyway'] },
]

const REAL_WORLDS: WorldId[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

function shuffleCells(cells: IndexCell[]): IndexCell[] {
  const a = [...cells]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function World16Index() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const hasSecret = useWorldStore(s => s.hasSecret)
  const findSecret = useWorldStore(s => s.findSecret)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgIdx, setMsgIdx] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)

  const grid = useMemo(() => shuffleCells(CELLS), [])

  const handleCell = (cell: IndexCell) => {
    if (cell.needsSecret && !hasSecret(cell.needsSecret)) {
      setMsg(cell.locked ?? 'locked')
      setMsgIdx(0)
      return
    }

    if (cell.id === 'worm' || cell.id === 'worm2') {
      const pick = REAL_WORLDS[Math.floor(Math.random() * REAL_WORLDS.length)]
      if (pick === 16) {
        setMsg('rolled index. you stayed.')
        return
      }
      findSecret('index-random')
      setFlash(cell.id)
      setTimeout(() => navigateTo(pick, { type: ['fold', 'vortex', 'chromatic', 'scatter', 'nothing'][Math.floor(Math.random() * 5)] as PortalType }), 300)
      return
    }

    if (cell.fake || !cell.world) {
      const msgs = cell.clickMsg ?? ['nothing']
      setMsg(msgs[msgIdx % msgs.length])
      setMsgIdx(i => i + 1)
      return
    }

    findSecret(`index-${cell.id}`)
    navigateTo(cell.world, { type: cell.portal ?? 'fold' })
  }

  return (
    <div
      data-world="16"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0c0c10',
        overflow: 'auto',
        fontFamily: '"JetBrains Mono", monospace',
        padding: '24px 16px 80px',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3em' }}>THE INDEX</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', marginTop: 8, letterSpacing: '0.12em' }}>
            incomplete · shuffled each visit · some tiles lie · some need secrets
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 8,
        }}>
          {grid.map(cell => {
            const locked = cell.needsSecret && !hasSecret(cell.needsSecret)
            const isFlash = flash === cell.id
            return (
              <button
                key={cell.id}
                onClick={() => handleCell(cell)}
                style={{
                  aspectRatio: '1',
                  background: isFlash
                    ? 'rgba(244,114,182,0.2)'
                    : locked
                      ? 'rgba(40,20,20,0.8)'
                      : cell.fake
                        ? 'rgba(20,20,28,0.9)'
                        : 'rgba(25,30,45,0.95)',
                  border: `1px solid ${cell.world && !locked ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  transition: 'transform 0.1s, background 0.2s',
                  transform: isFlash ? 'scale(0.95)' : 'scale(1)',
                }}
              >
                <div style={{
                  fontSize: 7,
                  color: locked ? 'rgba(255,80,80,0.5)' : cell.fake ? 'rgba(255,255,255,0.25)' : 'rgba(199,210,254,0.7)',
                  letterSpacing: '0.08em',
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}>
                  {cell.label}
                </div>
                <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.15)' }}>{cell.sub}</div>
                {locked && <div style={{ fontSize: 5, color: 'rgba(255,80,80,0.4)' }}>🔒</div>}
              </button>
            )
          })}
        </div>

        {msg && (
          <div style={{
            marginTop: 24,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 9,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.12em',
            textAlign: 'center',
          }}>
            {msg}
          </div>
        )}
      </div>

      <HomeButton />
    </div>
  )
}
