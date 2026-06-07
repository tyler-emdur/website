'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── Window dragging ──────────────────────────────────────────────────────────
interface WinState { id: string; x: number; y: number; z: number; open: boolean; minimized: boolean }

function OsWindow({
  title, icon, children, win, onClose, onFocus, onMinimize, onDrag,
}: {
  title: string; icon: string; children: React.ReactNode
  win: WinState
  onClose: () => void; onFocus: () => void; onMinimize: () => void
  onDrag: (dx: number, dy: number) => void
}) {
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const onDown = (e: React.MouseEvent) => {
    dragging.current = true; last.current = { x: e.clientX, y: e.clientY }
    onFocus()
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      onDrag(e.clientX - last.current.x, e.clientY - last.current.y)
      last.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!win.open || win.minimized) return null

  return (
    <div
      onClick={onFocus}
      style={{
        position: 'absolute', left: win.x, top: win.y, zIndex: win.z,
        width: 320, background: '#c0c0c0',
        border: '2px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080',
        boxShadow: '2px 2px 0 #000',
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Title bar */}
      <div onMouseDown={onDown} style={{
        background: 'linear-gradient(to right, #000080, #1084d0)',
        padding: '3px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'default',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 11, fontWeight: 700 }}>
          <span>{icon}</span><span>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={e => { e.stopPropagation(); onMinimize() }} style={{
            width: 16, height: 14, background: '#c0c0c0', border: '1px solid',
            borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer', fontSize: 9, lineHeight: 1,
          }}>_</button>
          <button onClick={e => { e.stopPropagation(); onClose() }} style={{
            width: 16, height: 14, background: '#c0c0c0', border: '1px solid',
            borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer', fontSize: 11, lineHeight: 1, fontWeight: 700,
          }}>×</button>
        </div>
      </div>
      {/* Content */}
      <div style={{ padding: 8, fontSize: 11, color: '#000', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  )
}

// ── Desktop icon ─────────────────────────────────────────────────────────────
function DesktopIcon({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const [sel, setSel] = useState(false)
  const clicks = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onClickIcon = () => {
    clicks.current++
    if (timer.current) clearTimeout(timer.current)
    if (clicks.current >= 2) { clicks.current = 0; onClick() }
    else { timer.current = setTimeout(() => { clicks.current = 0; setSel(true) }, 300) }
  }
  return (
    <div onMouseDown={() => setSel(true)} onClick={onClickIcon}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 6px', cursor: 'default', width: 64, textAlign: 'center' }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{
        fontSize: 10, color: sel ? '#000' : '#fff', padding: '1px 3px',
        background: sel ? '#000080' : 'transparent',
        border: sel ? '1px dotted #fff' : '1px solid transparent',
        lineHeight: 1.3,
      }}>{label}</div>
    </div>
  )
}

// ── Error dialog ─────────────────────────────────────────────────────────────
function ErrorDialog({ msg, onOk }: { msg: string; onOk: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
      background: 'rgba(0,0,0,0.4)',
    }}>
      <div style={{
        background: '#c0c0c0', border: '2px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080',
        boxShadow: '2px 2px 0 #000', width: 300, fontFamily: '"MS Sans Serif", Arial, sans-serif',
      }}>
        <div style={{ background: 'linear-gradient(to right, #000080, #1084d0)', padding: '3px 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>⚠ System Error</span>
        </div>
        <div style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 11 }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <span style={{ lineHeight: 1.6 }}>{msg}</span>
        </div>
        <div style={{ padding: '4px 8px 8px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={onOk} style={{
            padding: '3px 20px', background: '#c0c0c0', border: '2px solid',
            borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11,
          }}>OK</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
const ERRORS = [
  'An error occurred in module UNKNOWN.EXE.\nThe system has no record of this module.\nThis is normal.',
  'STACK OVERFLOW in MEMORY.DLL\nContents: 1 recovered fragment, 46 missing\nPlease contact an administrator who does not exist.',
  'Warning: This window has been open longer than expected.\nExpected duration: undefined\nActual duration: longer than that.',
  'Cannot locate file: TYLER_EMDUR.EXE\nThe file exists but is currently occupied.\nTry again when it finishes whatever it is doing.',
]

export default function World10Loop() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [zTop, setZTop] = useState(10)
  const [wins, setWins] = useState<WinState[]>([
    { id: 'mycomputer', x: 80, y: 60, z: 10, open: false, minimized: false },
    { id: 'documents', x: 140, y: 90, z: 9, open: false, minimized: false },
    { id: 'archive', x: 200, y: 120, z: 8, open: false, minimized: false },
    { id: 'recycle', x: 160, y: 180, z: 7, open: false, minimized: false },
    { id: 'world', x: 100, y: 200, z: 6, open: false, minimized: false },
  ])
  const [error, setError] = useState<string | null>(null)
  const [errorCount, setErrorCount] = useState(0)
  const [clockStr, setClockStr] = useState('??:??')
  const [trashCount, setTrashCount] = useState(0)

  useEffect(() => {
    // Wrong clock — drifts unpredictably
    let h = 11, m = 59
    const iv = setInterval(() => {
      m += Math.floor(Math.random() * 5 + 1)
      if (m >= 60) { m -= 60; h = (h + 1) % 24 }
      setClockStr(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    }, 3000)
    // Spontaneous error
    const errTimer = setTimeout(() => {
      setError(ERRORS[Math.floor(Math.random() * ERRORS.length)])
    }, 12000)
    return () => { clearInterval(iv); clearTimeout(errTimer) }
  }, [])

  const focus = (id: string) => {
    setZTop(z => z + 1)
    setWins(ws => ws.map(w => w.id === id ? { ...w, z: zTop + 1 } : w))
  }

  const openWin = (id: string) => {
    setZTop(z => z + 1)
    setWins(ws => ws.map(w => w.id === id ? { ...w, open: true, minimized: false, z: zTop + 1 } : w))
  }

  const closeWin = (id: string) => setWins(ws => ws.map(w => w.id === id ? { ...w, open: false } : w))
  const minimizeWin = (id: string) => setWins(ws => ws.map(w => w.id === id ? { ...w, minimized: true } : w))

  const dragWin = (id: string, dx: number, dy: number) => {
    setWins(ws => ws.map(w => w.id === id ? { ...w, x: w.x + dx, y: w.y + dy } : w))
  }

  const w = (id: string) => wins.find(w => w.id === id)!

  const handleError = () => {
    const next = errorCount + 1
    setErrorCount(next)
    if (next >= 3) {
      setError(null)
    } else {
      setError(ERRORS[next % ERRORS.length])
    }
  }

  return (
    <div data-world="10" style={{
      position: 'fixed', inset: 0,
      background: '#008080',
      overflow: 'hidden',
    }}>
      <HomeButton />

      {/* Desktop icons */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', width: 80 }}>
        <DesktopIcon icon="🖥" label="My Computer" onClick={() => openWin('mycomputer')} />
        <DesktopIcon icon="📁" label="Documents" onClick={() => openWin('documents')} />
        <DesktopIcon icon="📦" label="Archive" onClick={() => openWin('archive')} />
        <DesktopIcon icon="🗑" label="Recycle Bin" onClick={() => openWin('recycle')} />
        <DesktopIcon icon="🌐" label="THE WORLD" onClick={() => openWin('world')} />
      </div>

      {/* Windows */}
      <OsWindow title="My Computer" icon="🖥" win={w('mycomputer')} onClose={() => closeWin('mycomputer')} onFocus={() => focus('mycomputer')} onMinimize={() => minimizeWin('mycomputer')} onDrag={(dx,dy) => dragWin('mycomputer',dx,dy)}>
        <div style={{ marginBottom: 6, color: '#666', fontSize: 10 }}>Drives and devices found on this system:</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['C:\\ (MAIN)', 'D:\\ (BACKUP)', 'E:\\ (UNKNOWN)', 'F:\\ (DO NOT OPEN)'].map((d,i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'default', width: 60 }}>
              <span style={{ fontSize: 22 }}>{i === 3 ? '🔒' : '💾'}</span>
              <span style={{ fontSize: 9, textAlign: 'center', lineHeight: 1.3 }}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: '#808080', borderTop: '1px solid #808080', paddingTop: 6 }}>
          4 objects · 1 object has no properties
        </div>
      </OsWindow>

      <OsWindow title="Documents" icon="📁" win={w('documents')} onClose={() => closeWin('documents')} onFocus={() => focus('documents')} onMinimize={() => minimizeWin('documents')} onDrag={(dx,dy) => dragWin('documents',dx,dy)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {['survey_te-zero.txt','mem_001.fragment','mem_047_warm.fragment','do_not_catalog.exe','tyler_emdur.exe (read-only)'].map((f,i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '2px 4px', cursor: 'default' }}
              onDoubleClick={() => i === 3 ? setError('Access denied.\nThis file is currently in use by itself.') : undefined}>
              <span style={{ fontSize: 14 }}>{f.endsWith('.exe') ? '⚙️' : '📄'}</span>
              <span style={{ fontSize: 10 }}>{f}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: '#808080', borderTop: '1px solid #808080', paddingTop: 6 }}>
          5 objects · Last modified: unknown
        </div>
      </OsWindow>

      <OsWindow title="Archive — Sector 03-Ω" icon="📦" win={w('archive')} onClose={() => closeWin('archive')} onFocus={() => focus('archive')} onMinimize={() => minimizeWin('archive')} onDrag={(dx,dy) => dragWin('archive',dx,dy)}>
        <div style={{ fontSize: 10, color: '#444', lineHeight: 1.8, marginBottom: 8 }}>
          Contents: 47 items<br />
          Items recovered: 1<br />
          Items missing: estimated 46<br />
          Last access: [DATE CORRUPTED]
        </div>
        <div style={{ background: '#808080', height: 1, marginBottom: 8 }} />
        <div style={{ fontSize: 9, fontStyle: 'italic', color: '#666' }}>
          &quot;Central storage. Entry sequence interrupted.&quot;
        </div>
      </OsWindow>

      <OsWindow title="Recycle Bin" icon="🗑" win={w('recycle')} onClose={() => closeWin('recycle')} onFocus={() => focus('recycle')} onMinimize={() => minimizeWin('recycle')} onDrag={(dx,dy) => dragWin('recycle',dx,dy)}>
        <div style={{ marginBottom: 6, color: '#666', fontSize: 10 }}>
          {trashCount === 0 ? 'Recycle Bin is empty.' : `${trashCount} item(s). Some may not be recoverable.`}
        </div>
        <button onClick={() => { setTrashCount(c => c + 1); navigateTo(13 as WorldId, { type: 'vortex' as PortalType }) }}
          style={{ fontSize: 10, padding: '3px 10px', background: '#c0c0c0', border: '2px solid', borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer', fontFamily: 'inherit' }}>
          Discard and Descend
        </button>
      </OsWindow>

      <OsWindow title="THE WORLD.lnk" icon="🌐" win={w('world')} onClose={() => closeWin('world')} onFocus={() => focus('world')} onMinimize={() => minimizeWin('world')} onDrag={(dx,dy) => dragWin('world',dx,dy)}>
        <div style={{ fontSize: 10, lineHeight: 1.8, marginBottom: 10 }}>
          This shortcut points to: <strong>WORLD_01.exe</strong><br />
          Target status: <span style={{ color: '#008000' }}>ACTIVE</span><br />
          Location: Unknown<br />
          Last verified: 03:12
        </div>
        <button onClick={() => navigateTo(1 as WorldId, { type: 'fold' as PortalType })}
          style={{ fontSize: 10, padding: '3px 14px', background: '#c0c0c0', border: '2px solid', borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer', fontFamily: 'inherit' }}>
          Open
        </button>
      </OsWindow>

      {/* Taskbar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
        background: '#c0c0c0',
        borderTop: '2px solid #fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 4px',
        zIndex: 8000,
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
      }}>
        <button style={{
          padding: '2px 10px', background: '#c0c0c0', border: '2px solid',
          borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
        }}>⊞ Start</button>
        <div style={{ display: 'flex', gap: 2 }}>
          {wins.filter(w => w.open && w.minimized).map(w => (
            <button key={w.id} onClick={() => setWins(ws => ws.map(ww => ww.id === w.id ? { ...ww, minimized: false } : ww))}
              style={{ padding: '2px 8px', fontSize: 9, background: '#c0c0c0', border: '2px solid', borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              {w.id}
            </button>
          ))}
        </div>
        <div style={{
          background: '#c0c0c0', border: '2px solid', borderColor: '#808080 #fff #fff #808080',
          padding: '2px 8px', fontSize: 10, minWidth: 52, textAlign: 'center',
        }}>{clockStr}</div>
      </div>

      {error && <ErrorDialog msg={error} onOk={handleError} />}
    </div>
  )
}
