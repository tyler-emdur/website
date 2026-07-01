'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import HomeButton from './HomeButton'
import { projects } from '@/lib/data/projects'
import { memories } from '@/lib/data/memories'
import type { Project, Memory } from '@/lib/types'

const CYAN = '#5ecbe0'
const CYAN_DIM = '#2a5560'
const CHROME = '#111827'
const CHROME_LIGHT = '#1c2534'

interface Experiment {
  id: string
  title: string
  status: 'shelved' | 'abandoned' | 'revisit someday'
  note: string
}

const EXPERIMENTS: Experiment[] = [
  { id: 'exp1', title: 'font-that-breathes.css', status: 'shelved', note: 'Tried making body text subtly expand and contract with a sine wave tied to scroll velocity. Nauseating at anything above 40wpm. Kept the keyframes, deleted the idea.' },
  { id: 'exp2', title: 'markov-commit-messages.py', status: 'abandoned', note: 'Trained a tiny Markov chain on my own commit history to auto-generate commit messages. It mostly produced "fix fix bug the the thing." Accurate, unfortunately.' },
  { id: 'exp3', title: 'terrain-from-strava.js', status: 'revisit someday', note: 'Idea: turn a GPX file into a 3D relief you can fly through. Got as far as a flat, ugly triangle mesh before getting distracted by Digger.' },
  { id: 'exp4', title: 'inbox-zero-simulator', status: 'abandoned', note: 'A game where you sort a fake inbox against the clock. Realized halfway through that I was building a worse version of my actual job.' },
  { id: 'exp5', title: 'css-only-solar-system.html', status: 'shelved', note: 'No JS, pure CSS animation, all 8 planets plus Pluto out of spite. Runs at 6fps on anything older than 2 years old. Beautiful and useless.' },
  { id: 'exp6', title: 'sleep-data-to-midi.py', status: 'revisit someday', note: 'Mapped a week of sleep-tracker data to a MIDI sequence. The result sounded like a fax machine having a bad week. There is something here. Not sure what.' },
  { id: 'exp7', title: 'unfinished-chess-engine', status: 'abandoned', note: 'Got minimax working to depth 3 and then remembered how much I do not know about chess. The bot still loses to the tutorial mode.' },
  { id: 'exp8', title: 'this-website-v1', status: 'shelved', note: 'A much plainer version of this exact site. One page, one font, a list of links. It worked fine. That was somehow not the point.' },
]

const MEMORY_ICON: Record<Memory['type'], string> = { photo: '🖼', note: '📝', object: '📦' }
const STATUS_COLOR: Record<Project['status'], string> = { shipped: '#4ade80', wip: '#facc15', archived: '#9ca3af' }
const EXP_COLOR: Record<Experiment['status'], string> = { shelved: '#facc15', abandoned: '#f87171', 'revisit someday': '#5ecbe0' }

function ExperimentThumb({ seed }: { seed: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    const rand = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296 }
    c.width = 120; c.height = 80
    ctx.fillStyle = '#0a0e14'
    ctx.fillRect(0, 0, 120, 80)
    const hue = Math.floor(rand() * 360)
    for (let i = 0; i < 24; i++) {
      ctx.strokeStyle = `hsla(${hue + rand() * 40 - 20},70%,60%,${0.15 + rand() * 0.3})`
      ctx.beginPath()
      ctx.moveTo(rand() * 120, rand() * 80)
      ctx.lineTo(rand() * 120, rand() * 80)
      ctx.stroke()
    }
  }, [seed])
  return <canvas ref={ref} style={{ width: '100%', maxWidth: 200, border: `1px solid ${CYAN_DIM}`, display: 'block' }} />
}

interface WinState { id: string; title: string; icon: string; node: React.ReactNode; z: number; x: number; y: number }

function ProjectContent({ p }: { p: Project }) {
  return (
    <div style={{ fontFamily: '"Courier New", monospace', fontSize: 11, lineHeight: 1.7, color: '#d8e6ea' }}>
      <div style={{ color: CYAN, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{p.title} <span style={{ color: '#666', fontWeight: 400 }}>({p.year})</span></div>
      <div style={{ color: STATUS_COLOR[p.status], fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>status: {p.status}</div>
      <div style={{ marginBottom: 10 }}>{p.description}</div>
      <div style={{ color: '#8aa', fontSize: 10, marginBottom: 10 }}>stack: {p.tech.join(' · ')}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {p.links.live && <a href={p.links.live} target="_blank" rel="noopener noreferrer" style={{ color: '#0a0e14', background: CYAN, padding: '4px 10px', fontSize: 10, textDecoration: 'none', fontWeight: 700 }}>RUN DEMO →</a>}
        {p.links.github && <a href={p.links.github} target="_blank" rel="noopener noreferrer" style={{ color: CYAN, border: `1px solid ${CYAN}`, padding: '4px 10px', fontSize: 10, textDecoration: 'none' }}>VIEW SOURCE →</a>}
      </div>
    </div>
  )
}

function MemoryContent({ m }: { m: Memory }) {
  return (
    <div style={{ fontFamily: '"Courier New", monospace', fontSize: 11, lineHeight: 1.7, color: '#d8e6ea' }}>
      <div style={{ color: CYAN, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{MEMORY_ICON[m.type]} {m.title}</div>
      <div style={{ color: '#8aa', fontSize: 9, marginBottom: 8 }}>{m.year} · {m.type}</div>
      <div>{m.content}</div>
    </div>
  )
}

function ExperimentContent({ e }: { e: Experiment }) {
  return (
    <div style={{ fontFamily: '"Courier New", monospace', fontSize: 11, lineHeight: 1.7, color: '#d8e6ea' }}>
      <div style={{ color: CYAN, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{e.title}</div>
      <div style={{ color: EXP_COLOR[e.status], fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>status: {e.status}</div>
      <ExperimentThumb seed={e.id} />
      <div style={{ marginTop: 10 }}>{e.note}</div>
    </div>
  )
}

type FolderId = 'PROJECTS' | 'MEMORIES' | 'EXPERIMENTS'

function ExplorerContent({ folder, onOpenFile }: { folder: FolderId; onOpenFile: (id: string) => void }) {
  const rows: { id: string; label: string; meta: string; icon: string; color: string }[] =
    folder === 'PROJECTS'
      ? projects.map(p => ({ id: `proj:${p.id}`, label: `${p.id}.exe`, meta: `${p.year} · ${p.status}`, icon: '⚙', color: STATUS_COLOR[p.status] }))
      : folder === 'MEMORIES'
      ? memories.map(m => ({ id: `mem:${m.id}`, label: `${m.id}.${m.type === 'photo' ? 'jpg' : m.type === 'object' ? 'dat' : 'txt'}`, meta: `${m.year}`, icon: MEMORY_ICON[m.type], color: CYAN }))
      : EXPERIMENTS.map(e => ({ id: `exp:${e.id}`, label: `${e.id}.log`, meta: e.status, icon: '🧪', color: EXP_COLOR[e.status] }))

  return (
    <div style={{ fontFamily: '"Courier New", monospace', fontSize: 11 }}>
      {rows.map(r => (
        <div
          key={r.id}
          onClick={() => onOpenFile(r.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer',
            borderBottom: `1px solid ${CYAN_DIM}`, color: '#d8e6ea',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(94,203,224,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <span>{r.icon}</span>
          <span style={{ flex: 1 }}>{r.label}</span>
          <span style={{ fontSize: 9, color: r.color }}>{r.meta}</span>
        </div>
      ))}
    </div>
  )
}

export default function World12DevOS() {
  const [windows, setWindows] = useState<WinState[]>([])
  const zRef = useRef(1)
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setUptime(u => u + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const focus = useCallback((id: string) => {
    zRef.current += 1
    const z = zRef.current
    setWindows(prev => prev.map(w => (w.id === id ? { ...w, z } : w)))
  }, [])

  const openWindow = useCallback((id: string, title: string, icon: string, node: React.ReactNode) => {
    setWindows(prev => {
      if (prev.some(w => w.id === id)) {
        zRef.current += 1
        return prev.map(w => (w.id === id ? { ...w, z: zRef.current } : w))
      }
      zRef.current += 1
      const idx = prev.length
      return [...prev, {
        id, title, icon, node, z: zRef.current,
        x: 80 + (idx % 5) * 34, y: 60 + (idx % 5) * 30,
      }]
    })
  }, [])

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id))
  }, [])

  function openFile(fileId: string) {
    const [kind, id] = fileId.split(':')
    if (kind === 'proj') {
      const p = projects.find(x => x.id === id)
      if (p) openWindow(fileId, `${p.id}.exe`, '⚙', <ProjectContent p={p} />)
    } else if (kind === 'mem') {
      const m = memories.find(x => x.id === id)
      if (m) openWindow(fileId, `${m.id}.${m.type === 'photo' ? 'jpg' : m.type === 'object' ? 'dat' : 'txt'}`, MEMORY_ICON[m.type], <MemoryContent m={m} />)
    } else if (kind === 'exp') {
      const e = EXPERIMENTS.find(x => x.id === id)
      if (e) openWindow(fileId, `${e.id}.log`, '🧪', <ExperimentContent e={e} />)
    }
  }

  function openFolder(folder: FolderId) {
    openWindow(`dir:${folder}`, `C:\\${folder}`, '📁', <ExplorerContent folder={folder} onOpenFile={openFile} />)
  }

  const h = String(Math.floor(uptime / 3600)).padStart(2, '0')
  const m = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0')
  const s = String(uptime % 60).padStart(2, '0')

  const folders: { id: FolderId; label: string }[] = [
    { id: 'PROJECTS', label: 'PROJECTS' },
    { id: 'MEMORIES', label: 'MEMORIES' },
    { id: 'EXPERIMENTS', label: 'EXPERIMENTS' },
  ]

  return (
    <div data-world="12" style={{
      position: 'fixed', inset: 0, overflow: 'hidden', background: '#0a0e14',
      backgroundImage: 'linear-gradient(rgba(94,203,224,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,203,224,0.04) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      fontFamily: '"Courier New", monospace',
    }}>
      <style>{`
        .w17-icon { cursor: pointer; user-select: none; }
        .w17-icon:hover .w17-icon-box { border-color: ${CYAN}; }
      `}</style>
      <HomeButton />

      {/* status bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 26, background: CHROME,
        borderBottom: `1px solid ${CYAN_DIM}`, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 12px', fontSize: 10, color: CYAN, zIndex: 500,
      }}>
        <span>DEVOS v0.9 — C:\TYLER\</span>
        <span style={{ color: '#8aa' }}>uptime {h}:{m}:{s}</span>
      </div>

      {/* desktop icons */}
      <div style={{ position: 'fixed', top: 46, left: 20, display: 'flex', flexDirection: 'column', gap: 22, zIndex: 1 }}>
        {folders.map(f => (
          <div key={f.id} className="w17-icon" onClick={() => openFolder(f.id)} style={{ textAlign: 'center', width: 76 }}>
            <div className="w17-icon-box" style={{
              width: 44, height: 36, margin: '0 auto 4px', border: `1px solid ${CYAN_DIM}`,
              background: CHROME_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>📁</div>
            <div style={{ fontSize: 9, color: CYAN, letterSpacing: 0.5 }}>{f.label}</div>
          </div>
        ))}
      </div>

      {/* windows */}
      {windows.map(w => (
        <div key={w.id} onMouseDown={() => focus(w.id)} style={{
          position: 'fixed', left: w.x, top: w.y, width: 320, maxWidth: 'calc(100vw - 40px)',
          background: CHROME, border: `1px solid ${CYAN_DIM}`, zIndex: 100 + w.z,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
            background: CHROME_LIGHT, borderBottom: `1px solid ${CYAN_DIM}`, fontSize: 10, color: CYAN,
          }}>
            <span>{w.icon}</span>
            <span style={{ flex: 1 }}>{w.title}</span>
            <span onClick={() => closeWindow(w.id)} style={{ cursor: 'pointer', color: '#f87171', padding: '0 4px' }}>✕</span>
          </div>
          <div style={{ padding: 12, maxHeight: 340, overflowY: 'auto' }}>
            {w.node}
          </div>
        </div>
      ))}

      {/* taskbar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 30, background: CHROME,
        borderTop: `1px solid ${CYAN_DIM}`, display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 10px', zIndex: 500, overflowX: 'auto',
      }}>
        {windows.length === 0 && <span style={{ fontSize: 9, color: '#556' }}>no windows open — click a folder above</span>}
        {windows.map(w => (
          <div key={w.id} onClick={() => focus(w.id)} style={{
            fontSize: 9, color: CYAN, border: `1px solid ${CYAN_DIM}`, padding: '3px 8px', cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {w.icon} {w.title}
          </div>
        ))}
      </div>
    </div>
  )
}
