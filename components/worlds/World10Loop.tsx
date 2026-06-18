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
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => () => cleanupRef.current?.(), [])

  const onDown = (e: React.MouseEvent) => {
    dragging.current = true; last.current = { x: e.clientX, y: e.clientY }
    onFocus()
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      onDrag(e.clientX - last.current.x, e.clientY - last.current.y)
      last.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      cleanupRef.current = null
    }
    cleanupRef.current = onUp
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

// ── Generic dialog ────────────────────────────────────────────────────────────
function SystemDialog({ title, icon, msg, onOk }: { title: string; icon: string; msg: string; onOk: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
      background: 'rgba(0,0,0,0.4)',
    }}>
      <div style={{
        background: '#c0c0c0', border: '2px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080',
        boxShadow: '2px 2px 0 #000', width: 320, fontFamily: '"MS Sans Serif", Arial, sans-serif',
      }}>
        <div style={{ background: 'linear-gradient(to right, #000080, #1084d0)', padding: '3px 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{title}</span>
        </div>
        <div style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 11 }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
          <span style={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>{msg}</span>
        </div>
        <div style={{ padding: '4px 8px 10px', display: 'flex', justifyContent: 'center' }}>
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

// ── Data ─────────────────────────────────────────────────────────────────────
const ERRORS = [
  'An error occurred in module UNKNOWN.EXE.\nThe system has no record of this module.\nThis is normal.',
  'STACK OVERFLOW in MEMORY.DLL\nContents: 1 recovered fragment, 46 missing\nPlease contact an administrator who does not exist.',
  'Warning: This window has been open longer than expected.\nExpected duration: undefined\nActual duration: longer than that.',
  'Cannot locate file: TYLER_EMDUR.EXE\nThe file exists but is currently occupied.\nTry again when it finishes whatever it is doing.',
]

const DRIVE_DIALOGS: { title: string; icon: string; msg: string }[] = [
  {
    title: 'C:\\ (MAIN)',
    icon: '💾',
    msg: 'C:\\\n47 items found.\n1 item recovered.\n46 items: status unknown.\n\nFree space: indeterminate.\nFile system: MEMORY.FAT',
  },
  {
    title: 'D:\\ (BACKUP)',
    icon: '💾',
    msg: 'D:\\ BACKUP\nLast backup: [DATE CORRUPTED]\nBackup integrity: partial\n\nContents mirror C:\\ with a 3-month delay.\nSome memories arrive late. Some do not arrive.',
  },
  {
    title: 'E:\\ (UNKNOWN)',
    icon: '💾',
    msg: 'E:\\\nDrive type: unknown\nContents: unknown\nOrigin: unknown\n\nThe drive mounts successfully.\nNothing appears to be on it.\nSomething may be on it.',
  },
  {
    title: 'F:\\ (DO NOT OPEN)',
    icon: '🔒',
    msg: 'F:\\\nAccess denied.\n\nThis drive was flagged by the system at install.\nNo record of what it contains.\nNo record of who flagged it.\n\nDo not open.',
  },
]

const FILE_DIALOGS: { title: string; icon: string; msg: string }[] = [
  {
    title: 'survey_te-zero.txt',
    icon: '📄',
    msg: 'survey_te-zero.txt\n\n[SURVEY — SUBJECT: TE]\nOrigin: midwest\nRelocation: Boulder, CO (2022)\nOccupation: software engineer\nBuilds: software, mostly\nRuns: trails, mostly\n\nStatus: active\nFrequency: 88.7',
  },
  {
    title: 'mem_001.fragment',
    icon: '📄',
    msg: 'mem_001.fragment\n\nFragment recovered.\n\nContent: "Boulder, CO. Oct 2022.\nThis is the one.\nHigh altitude. Good."\n\n[END OF FRAGMENT]',
  },
  {
    title: 'mem_047_warm.fragment',
    icon: '📄',
    msg: 'mem_047_warm.fragment\n\nFragment recovered.\n\nContent: "Marathon day.\nOct 2024. 3:41:22.\nStarted at 6am. Finished.\nThe last mile was wrong.\nWorth it."\n\n[END OF FRAGMENT]',
  },
  {
    title: 'do_not_catalog.exe',
    icon: '⚙️',
    msg: 'Access denied.\nThis file is currently in use by itself.\n\nAttempting to open it will cause it to\nopen itself first, before you can open it.',
  },
  {
    title: 'tyler_emdur.exe',
    icon: '⚙️',
    msg: 'tyler_emdur.exe (read-only)\n\nCannot execute read-only process.\nFile is currently occupied.\n\nNote: this file modifies itself\nbetween reads. Contents may differ\nfrom cached version.',
  },
]

const START_ITEMS = [
  { icon: '📁', label: 'Documents' },
  { icon: '🔧', label: 'Settings (unavailable)' },
  { icon: '🔍', label: 'Find...' },
  { icon: '❓', label: 'Help' },
  { icon: '🚪', label: 'Shut Down...' },
]

// ── Main ─────────────────────────────────────────────────────────────────────
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
  const [dialog, setDialog] = useState<{ title: string; icon: string; msg: string } | null>(null)
  const [errorCount, setErrorCount] = useState(0)
  const [clockStr, setClockStr] = useState('11:59')
  const [trashCount, setTrashCount] = useState(0)
  const [startOpen, setStartOpen] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [findOpen, setFindOpen] = useState(false)

  useEffect(() => {
    let h = 11, m = 59
    const iv = setInterval(() => {
      m += Math.floor(Math.random() * 5 + 1)
      if (m >= 60) { m -= 60; h = (h + 1) % 24 }
      setClockStr(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    }, 3000)
    const errTimer = setTimeout(() => {
      setDialog({ title: '⚠ System Error', icon: '⚠️', msg: ERRORS[Math.floor(Math.random() * ERRORS.length)] })
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

  const handleDialogOk = useCallback(() => {
    const next = errorCount + 1
    setErrorCount(next)
    if (next >= 3) {
      setDialog(null)
    } else {
      setDialog({ title: '⚠ System Error', icon: '⚠️', msg: ERRORS[next % ERRORS.length] })
    }
  }, [errorCount])

  const handleStartItem = (label: string) => {
    setStartOpen(false)
    if (label === 'Documents') openWin('documents')
    else if (label === 'Find...') setFindOpen(true)
    else if (label === 'Shut Down...') {
      setDialog({ title: 'Shut Down', icon: '🚪', msg: 'SHUTDOWN FAILED\n\nThis system does not shut down.\nIt only restarts.\n\nThe loop is a feature, not a bug.' })
    } else if (label === 'Help') {
      setDialog({ title: 'Help', icon: '❓', msg: 'HELP FILE: room_10.hlp\n\nYou are in Room 10.\nThe clock is wrong.\nThe windows can be dragged.\nThe recycle bin never empties.\n\nTo leave: use ← universe (top left).' })
    } else {
      setDialog({ title: 'Settings', icon: '🔧', msg: 'Settings (unavailable)\n\nThis panel has no settings to show.\nThe configuration was set before you arrived.\nChanges are not persisted.' })
    }
  }

  return (
    <div data-world="10" style={{
      position: 'fixed', inset: 0,
      background: '#008080',
      overflow: 'hidden',
    }}
      onClick={() => setStartOpen(false)}
    >
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
          {DRIVE_DIALOGS.map((d, i) => (
            <div key={i}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'default', width: 64 }}
              onDoubleClick={() => setDialog(d)}
            >
              <span style={{ fontSize: 22 }}>{d.icon}</span>
              <span style={{ fontSize: 9, textAlign: 'center', lineHeight: 1.3 }}>
                {d.title.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: '#808080', borderTop: '1px solid #808080', paddingTop: 6 }}>
          4 objects · 1 object has no properties · double-click to open
        </div>
      </OsWindow>

      <OsWindow title="Documents" icon="📁" win={w('documents')} onClose={() => closeWin('documents')} onFocus={() => focus('documents')} onMinimize={() => minimizeWin('documents')} onDrag={(dx,dy) => dragWin('documents',dx,dy)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {FILE_DIALOGS.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '2px 4px', cursor: 'default' }}
              onDoubleClick={() => setDialog(f)}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ fontSize: 10 }}>{f.title}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: '#808080', borderTop: '1px solid #808080', paddingTop: 6 }}>
          5 objects · double-click to open
        </div>
      </OsWindow>

      <OsWindow title="Archive — Sector 03-Ω" icon="📦" win={w('archive')} onClose={() => closeWin('archive')} onFocus={() => focus('archive')} onMinimize={() => minimizeWin('archive')} onDrag={(dx,dy) => dragWin('archive',dx,dy)}>
        <div style={{ fontSize: 10, color: '#444', lineHeight: 1.8, marginBottom: 8 }}>
          Contents: 47 items<br />
          Items recovered: 1<br />
          Items missing: estimated 46<br />
          Last access: [DATE CORRUPTED]<br />
          Origin: SECTOR 03-Ω
        </div>
        <div style={{ background: '#808080', height: 1, marginBottom: 8 }} />
        <div style={{ fontSize: 9, color: '#444', lineHeight: 1.7 }}>
          Frequency cross-reference: 88.7<br />
          Coordinates logged: 40.0150°N, 105.2705°W<br />
          Entry sequence: <span style={{ color: '#c00' }}>INTERRUPTED</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 9, fontStyle: 'italic', color: '#666' }}>
          &quot;Central storage. Not all of it made it.&quot;
        </div>
      </OsWindow>

      <OsWindow title="Recycle Bin" icon="🗑" win={w('recycle')} onClose={() => closeWin('recycle')} onFocus={() => focus('recycle')} onMinimize={() => minimizeWin('recycle')} onDrag={(dx,dy) => dragWin('recycle',dx,dy)}>
        <div style={{ marginBottom: 6, color: '#666', fontSize: 10 }}>
          {trashCount === 0 ? 'Recycle Bin is empty.' : `${trashCount} item(s).\nSome may not be recoverable.\nSome were never meant to be recovered.`}
        </div>
        <button onClick={() => setTrashCount(c => c + 1)}
          style={{ fontSize: 10, padding: '3px 10px', background: '#c0c0c0', border: '2px solid', borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer', fontFamily: 'inherit' }}>
          Empty Recycle Bin
        </button>
        {trashCount >= 5 && (
          <div style={{ marginTop: 8, fontSize: 9, color: '#808080', fontStyle: 'italic' }}>
            The bin does not empty. It accepts.
          </div>
        )}
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

      {/* Find dialog */}
      {findOpen && (
        <div style={{
          position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%,-50%)',
          zIndex: 8500, width: 300, background: '#c0c0c0',
          border: '2px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080',
          boxShadow: '2px 2px 0 #000', fontFamily: '"MS Sans Serif", Arial, sans-serif',
        }}>
          <div style={{ background: 'linear-gradient(to right, #000080, #1084d0)', padding: '3px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>🔍 Find: Files or Folders</span>
            <button onClick={() => setFindOpen(false)} style={{ width: 16, height: 14, background: '#c0c0c0', border: '1px solid', borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>×</button>
          </div>
          <div style={{ padding: 12, fontSize: 11 }}>
            <div style={{ marginBottom: 8 }}>Named:</div>
            <input value={findQuery} onChange={e => setFindQuery(e.target.value)} style={{ width: '100%', padding: '2px 4px', fontSize: 11, fontFamily: 'inherit', border: '2px solid', borderColor: '#808080 #fff #fff #808080', marginBottom: 10 }} />
            <button
              onClick={() => {
                setFindOpen(false)
                if (findQuery) {
                  setDialog({
                    title: '🔍 Search Results',
                    icon: '🔍',
                    msg: `Searching for: "${findQuery}"\n\nResults found: 0\n\nThe file may exist.\nThe file may be hidden.\nThe file may be looking for you instead.`,
                  })
                }
              }}
              style={{ padding: '3px 14px', background: '#c0c0c0', border: '2px solid', borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
              Find Now
            </button>
          </div>
        </div>
      )}

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
        <div style={{ position: 'relative' }}>
          <button
            onClick={e => { e.stopPropagation(); setStartOpen(s => !s) }}
            style={{
              padding: '2px 10px', background: startOpen ? '#808080' : '#c0c0c0', border: '2px solid',
              borderColor: startOpen ? '#808080 #fff #fff #808080' : '#fff #808080 #808080 #fff',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>⊞ Start</button>
          {startOpen && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', bottom: 28, left: 0,
                background: '#c0c0c0', border: '2px solid',
                borderColor: '#fff #808080 #808080 #fff',
                boxShadow: '2px 2px 0 #000',
                width: 180, zIndex: 9000,
              }}>
              <div style={{ background: 'linear-gradient(to top, #000080, #1084d0)', width: 20, position: 'absolute', left: 0, top: 0, bottom: 0, writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '4px 2px', fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', fontFamily: 'inherit' }}>
                room 10
              </div>
              <div style={{ marginLeft: 20 }}>
                {START_ITEMS.map(item => (
                  <div key={item.label}
                    onClick={() => handleStartItem(item.label)}
                    style={{ padding: '5px 10px', fontSize: 11, cursor: 'default', display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#000080', e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#000')}
                  >
                    <span>{item.icon}</span>{item.label}
                  </div>
                ))}
                <div style={{ height: 1, background: '#808080', margin: '2px 0' }} />
                <div
                  onClick={() => { setStartOpen(false); navigateTo(1 as WorldId, { type: 'fold' as PortalType }) }}
                  style={{ padding: '5px 10px', fontSize: 11, cursor: 'default', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#000080', e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#000')}
                >
                  <span>🌐</span> Return to Universe
                </div>
              </div>
            </div>
          )}
        </div>

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

      {dialog && (
        <SystemDialog
          title={dialog.title}
          icon={dialog.icon}
          msg={dialog.msg}
          onOk={() => {
            if (dialog.title === '⚠ System Error') {
              handleDialogOk()
            } else {
              setDialog(null)
            }
          }}
        />
      )}
    </div>
  )
}
