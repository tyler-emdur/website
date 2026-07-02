'use client'
import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from '../HomeButton'
import { projects } from '@/lib/data/projects'
import { PROGRAMS } from './programs'
import {
  EXPERIMENTS, README_TXT, RECOVERED_SECTORS, WEBSITE_V1_LINKS,
  garbleLine, getBootCount, recordBoot,
} from './machine-data'

const TEAL = '#00807e'
const GRAY = '#c0c0c0'

// ── tiny WebAudio chimes ──────────────────────────────────────────────────────
function playNotes(notes: { f: number; t: number; d: number }[]) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    notes.forEach(({ f, t, d }) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'square'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + d)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + d + 0.05)
    })
    setTimeout(() => ctx.close(), 2500)
  } catch { /* audio blocked — fine */ }
}
const startupChime = () => playNotes([
  { f: 523, t: 0, d: 0.18 }, { f: 659, t: 0.14, d: 0.18 }, { f: 784, t: 0.28, d: 0.3 }, { f: 1047, t: 0.44, d: 0.5 },
])
const shutdownChime = () => playNotes([
  { f: 784, t: 0, d: 0.16 }, { f: 523, t: 0.14, d: 0.2 }, { f: 392, t: 0.3, d: 0.45 },
])

// ── window contents ───────────────────────────────────────────────────────────
function Notepad({ lines }: { lines: string[] }) {
  return (
    <div style={{ background: '#fff', height: '100%', overflowY: 'auto', padding: '10px 12px', fontFamily: '"Courier New", monospace', fontSize: 12, lineHeight: 1.7, color: '#000', whiteSpace: 'pre-wrap' }}>
      {lines.join('\n')}
    </div>
  )
}

function ProjectExe({ p }: { p: (typeof projects)[number] }) {
  const STATUS: Record<string, string> = { shipped: '#008000', wip: '#808000', archived: '#808080' }
  return (
    <div style={{ background: '#fff', height: '100%', overflowY: 'auto', padding: '12px 14px', fontFamily: '"Courier New", monospace', fontSize: 12, color: '#000' }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.title} <span style={{ color: '#666', fontWeight: 400 }}>({p.year})</span></div>
      <div style={{ color: STATUS[p.status], fontSize: 10, textTransform: 'uppercase', margin: '4px 0 10px' }}>status: {p.status}</div>
      <div style={{ lineHeight: 1.7, marginBottom: 10 }}>{p.description}</div>
      <div style={{ color: '#555', fontSize: 10, marginBottom: 12 }}>stack: {p.tech.join(' · ')}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {p.links.live && <a href={p.links.live} target="_blank" rel="noopener noreferrer" style={{ background: '#000080', color: '#fff', padding: '4px 10px', fontSize: 10, textDecoration: 'none' }}>RUN →</a>}
        {p.links.github && <a href={p.links.github} target="_blank" rel="noopener noreferrer" style={{ border: '1px solid #000080', color: '#000080', padding: '4px 10px', fontSize: 10, textDecoration: 'none' }}>SOURCE →</a>}
      </div>
    </div>
  )
}

function SectorFile({ idx, healed }: { idx: number; healed: boolean }) {
  const sector = RECOVERED_SECTORS[idx]
  return (
    <div style={{ background: '#000', height: '100%', overflowY: 'auto', padding: '10px 12px', fontFamily: '"Courier New", monospace', fontSize: 12, lineHeight: 1.8 }}>
      {healed
        ? sector.content.map((l, i) => <div key={i} style={{ color: i === 0 ? '#5ecbe0' : '#c8e6c9' }}>{l || ' '}</div>)
        : (
          <>
            {sector.content.map((l, i) => <div key={i} style={{ color: '#3a5a3a' }}>{garbleLine(l, idx * 97 + i)}</div>)}
            <div style={{ color: '#5ecbe0', marginTop: 10 }}>SECTOR DAMAGED — recovery in progress.</div>
            <div style={{ color: '#5ecbe0' }}>Boot this machine again and try later.</div>
          </>
        )}
    </div>
  )
}

function WebsiteV1() {
  return (
    <div style={{ background: '#fff', height: '100%', overflowY: 'auto', padding: '18px 20px', fontFamily: 'Times New Roman, serif', color: '#000' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>Tyler Emdur</div>
      <div style={{ fontSize: 13, marginBottom: 14 }}>I build things. Boulder, Colorado.</div>
      <hr />
      <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 2.2 }}>
        {WEBSITE_V1_LINKS.map(l => (
          <li key={l.label}><a href={l.href} target="_blank" rel="noopener noreferrer" style={{ color: '#0000ee' }}>{l.label}</a></li>
        ))}
      </ul>
      <hr />
      <div style={{ fontSize: 10, color: '#666', marginTop: 10 }}>
        last updated 2024 · this page worked fine. that was somehow not the point.
      </div>
    </div>
  )
}

function ProgramWindow({ progId }: { progId: string }) {
  const prog = PROGRAMS.find(p => p.id === progId)!
  const { Comp } = prog
  return (
    <div style={{ height: '100%', position: 'relative', background: '#000' }}>
      <Comp active={true} />
      <div style={{ position: 'absolute', bottom: 4, right: 8, fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }}>{prog.sub}</div>
    </div>
  )
}

// ── terminal ──────────────────────────────────────────────────────────────────
let termSeq = 0
function Terminal({ bootCount, onRun, onSecret }: {
  bootCount: number
  onRun: (progId: string) => void
  onSecret: (id: string) => void
}) {
  const [out, setOut] = useState<{ id: number; text: string; color?: string }[]>([
    { id: ++termSeq, text: 'EMDUR/OS [Version 4.86]' },
    { id: ++termSeq, text: '(C) a bedroom in Boulder. All rights reserved.' },
    { id: ++termSeq, text: '' },
    { id: ++termSeq, text: "Type HELP if you're lost." },
  ])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('C:\\')
  const [commits, setCommits] = useState<string[] | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('https://api.github.com/repos/tyler-emdur/website/commits?per_page=10')
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return
        setCommits(d.map(c => {
          const date = c?.commit?.committer?.date?.slice(0, 10) ?? '????-??-??'
          const msg = (c?.commit?.message ?? '').split('\n')[0]
          return `${date}  ${msg}`
        }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [out])

  const print = (lines: string[], color?: string) =>
    setOut(prev => [...prev, ...lines.map(text => ({ id: ++termSeq, text, color }))])

  const DIRS: Record<string, string[]> = {
    'C:\\': ['PROJECTS       <DIR>', 'EXPERIMENTS    <DIR>', 'GAMES          <DIR>', 'RECOVERED      <DIR>', 'WEBSITE.V1     <DIR>', 'README.TXT', 'COMMITS.LOG'],
    'C:\\PROJECTS': projects.map(p => `${p.id.toUpperCase().slice(0, 12)}.EXE`),
    'C:\\EXPERIMENTS': EXPERIMENTS.map(e => e.title.toUpperCase().replace(/[^A-Z0-9.]/g, '_').slice(0, 20) + '.LOG'),
    'C:\\GAMES': PROGRAMS.map(p => p.title.toUpperCase()),
    'C:\\RECOVERED': RECOVERED_SECTORS.map(s => s.file),
    'C:\\WEBSITE.V1': ['INDEX.HTM'],
  }

  function run(raw: string) {
    const cmd = raw.trim()
    print([`${cwd}> ${cmd}`], '#aaa')
    if (!cmd) return
    const [word, ...rest] = cmd.split(/\s+/)
    const arg = rest.join(' ').toUpperCase()
    switch (word.toUpperCase()) {
      case 'HELP':
        print(['DIR · CD <dir> · TYPE <file> · RUN <program> · COMMITS · CLS · VER · FORMAT'])
        break
      case 'VER':
        print([`EMDUR/OS 4.86 — boot #${bootCount} — uptime: longer than expected`])
        break
      case 'CLS':
        setOut([])
        break
      case 'DIR': {
        const listing = DIRS[cwd] ?? []
        print([` Directory of ${cwd}`, '', ...listing.map(f => `  ${f}`), '', `  ${listing.length} item(s)`])
        break
      }
      case 'CD': {
        if (!arg || arg === '\\' || arg === '..') { setCwd('C:\\'); break }
        const target = `C:\\${arg.replace(/\\$/, '')}`
        if (DIRS[target]) setCwd(target)
        else print([`Invalid directory: ${arg}`], '#f66')
        break
      }
      case 'TYPE': {
        if (arg.includes('README')) { print(README_TXT, '#c8e6c9'); break }
        if (arg.includes('COMMIT')) {
          print(commits ? ['COMMITS.LOG — live from the repository:', '', ...commits] : ['COMMITS.LOG unavailable — network sector unreadable.'], '#c8e6c9')
          break
        }
        const sIdx = RECOVERED_SECTORS.findIndex(s => arg.includes(s.file.replace('.DAT', '')))
        if (sIdx >= 0) {
          const healed = bootCount > sIdx + 1
          print(healed ? RECOVERED_SECTORS[sIdx].content : [...RECOVERED_SECTORS[sIdx].content.map((l, i) => garbleLine(l, sIdx * 97 + i)), '', 'SECTOR DAMAGED — boot again, try later.'], healed ? '#c8e6c9' : '#3a7a3a')
          break
        }
        const exp = EXPERIMENTS.find(e => arg.includes(e.title.toUpperCase().replace(/[^A-Z0-9.]/g, '_').slice(0, 8)))
        if (exp) { print([`${exp.title} — ${exp.status.toUpperCase()}`, '', exp.note], '#c8e6c9'); break }
        if (arg.includes('INDEX')) { print(['<html> — it renders. Open WEBSITE.V1 on the desktop to see it.'], '#c8e6c9'); break }
        print([`File not found: ${arg || '?'}`], '#f66')
        break
      }
      case 'RUN': {
        const prog = PROGRAMS.find(p => p.title.toUpperCase().startsWith(arg.replace('.EXE', '')))
        if (prog) { print([`Starting ${prog.title}...`]); onRun(prog.id) }
        else {
          const proj = projects.find(p => p.id.toUpperCase().startsWith(arg.replace('.EXE', '')))
          if (proj?.links.live) { print([`Launching ${proj.title} (external)...`]); window.open(proj.links.live, '_blank') }
          else print([`Cannot execute: ${arg || '?'}`], '#f66')
        }
        break
      }
      case 'COMMITS':
        print(commits ? ['live from github/tyler-emdur/website:', '', ...commits] : ['network sector unreadable.'], '#c8e6c9')
        break
      case 'FORMAT':
        print([
          'FORMAT C: — WARNING, ALL DATA WILL BE LOST.',
          'Proceed? (Y/N)',
          '> N',
          '',
          'Good. Some things should stay on the disk.',
        ], '#f6c66a')
        onSecret('machine-format-refused')
        break
      default:
        print([`Bad command or file name: ${word}`], '#f66')
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{ background: '#000', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: '"Courier New", monospace', fontSize: 12, padding: '6px 8px', cursor: 'text' }}
    >
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', lineHeight: 1.55 }}>
        {out.map(l => <div key={l.id} style={{ color: l.color ?? '#c8c8c8', whiteSpace: 'pre-wrap' }}>{l.text || ' '}</div>)}
      </div>
      <form
        onSubmit={e => { e.preventDefault(); run(input); setInput('') }}
        style={{ display: 'flex', gap: 6, alignItems: 'center', paddingTop: 4 }}
      >
        <span style={{ color: '#c8c8c8' }}>{cwd}&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          autoFocus
          spellCheck={false}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#c8c8c8', fontFamily: 'inherit', fontSize: 12 }}
        />
      </form>
    </div>
  )
}

// ── folder listings ───────────────────────────────────────────────────────────
function FolderGrid({ items }: { items: { icon: string; label: string; onOpen: () => void; dim?: boolean }[] }) {
  return (
    <div style={{ background: '#fff', height: '100%', overflowY: 'auto', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 84px)', gap: 8 }}>
      {items.map(it => (
        <div key={it.label} onDoubleClick={it.onOpen} onClick={it.onOpen} style={{ textAlign: 'center', cursor: 'pointer', opacity: it.dim ? 0.45 : 1 }}>
          <div style={{ fontSize: 26 }}>{it.icon}</div>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: '#000', wordBreak: 'break-all', lineHeight: 1.3, marginTop: 2 }}>{it.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── draggable window ──────────────────────────────────────────────────────────
interface Win { id: string; title: string; node: ReactNode; x: number; y: number; w: number; h: number; z: number }

function MachineWindow({ win, onFocus, onClose }: { win: Win; onFocus: () => void; onClose: () => void }) {
  const elRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const posRef = useRef({ x: win.x, y: win.y })

  return (
    <div ref={elRef} onPointerDown={onFocus} style={{
      position: 'absolute', left: win.x, top: win.y, width: win.w, height: win.h,
      maxWidth: 'calc(100% - 16px)', maxHeight: 'calc(100% - 46px)',
      display: 'flex', flexDirection: 'column', zIndex: win.z,
      border: '2px outset #fff', background: GRAY,
      boxShadow: '2px 2px 0 rgba(0,0,0,0.5)',
    }}>
      <div
        onPointerDown={e => {
          dragRef.current = { sx: e.clientX, sy: e.clientY, ox: posRef.current.x, oy: posRef.current.y }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={e => {
          if (!dragRef.current) return
          const nx = dragRef.current.ox + e.clientX - dragRef.current.sx
          const ny = Math.max(0, dragRef.current.oy + e.clientY - dragRef.current.sy)
          posRef.current = { x: nx, y: ny }
          if (elRef.current) { elRef.current.style.left = nx + 'px'; elRef.current.style.top = ny + 'px' }
        }}
        onPointerUp={() => { dragRef.current = null }}
        style={{
          background: 'linear-gradient(90deg, #000080, #1084d0)', color: '#fff',
          padding: '3px 4px 3px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, userSelect: 'none', flexShrink: 0, cursor: 'default',
        }}
      >
        <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{win.title}</span>
        <button
          onClick={onClose}
          onPointerDown={e => e.stopPropagation()}
          style={{ width: 18, height: 15, background: GRAY, border: '1px outset #fff', fontSize: 9, lineHeight: 1, cursor: 'pointer', color: '#000', fontFamily: 'Arial, sans-serif' }}
        >×</button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', borderTop: '1px solid #808080', minHeight: 0 }}>
        {win.node}
      </div>
    </div>
  )
}

// ── boot screen ───────────────────────────────────────────────────────────────
function BootScreen({ bootCount, onDone }: { bootCount: number; onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([])
  const [mem, setMem] = useState(0)
  const [ready, setReady] = useState(false)
  const doneRef = useRef(false)

  const healedAll = bootCount > RECOVERED_SECTORS.length
  const damaged = Math.max(0, RECOVERED_SECTORS.length - Math.max(0, bootCount - 1))

  useEffect(() => {
    const SCRIPT: { t: number; line: string }[] = [
      { t: 200, line: 'PHOENIX BIOS v4.04 — EMDUR-486DX2/66' },
      { t: 500, line: '' },
      { t: 700, line: 'MEM' }, // placeholder — memory counts live
      { t: 2300, line: 'Detecting IDE drives... C: MAXTOR 7245A (245MB)' },
      { t: 2700, line: 'Keyboard.......... OK' },
      { t: 2900, line: 'Mouse............. PRESENT' },
      { t: 3300, line: '' },
      { t: 3500, line: bootCount === 1 ? 'Improper shutdown detected. Running CHKDSK...' : `Boot #${bootCount}. Resuming recovery...` },
      { t: 4300, line: healedAll ? 'Disk recovery complete. All sectors readable.' : `CHKDSK: ${damaged} damaged sector(s) remain in C:\\RECOVERED\\` },
      { t: 4700, line: '' },
      { t: 4900, line: 'Starting EMDUR/OS...' },
    ]
    const timers = SCRIPT.map(({ t, line }) =>
      setTimeout(() => { if (line !== 'MEM') setLines(prev => [...prev, line]) }, t)
    )
    timers.push(setTimeout(() => setReady(true), 5600))
    // memory count animation — time-based so remounts can't stall it
    const t0 = performance.now()
    const memTimer = setInterval(() => {
      const v = Math.min(8192, Math.floor((performance.now() - t0) / 80) * 512)
      setMem(v)
      if (v >= 8192) clearInterval(memTimer)
    }, 80)
    return () => { timers.forEach(clearTimeout); clearInterval(memTimer) }
  }, [bootCount, damaged, healedAll])

  useEffect(() => {
    const go = () => {
      if (doneRef.current) return
      doneRef.current = true
      startupChime()
      onDone()
    }
    const onKey = () => { if (ready) go() }
    const onClick = () => { if (ready) go() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onClick)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onClick) }
  }, [ready, onDone])

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', fontFamily: '"Courier New", monospace', fontSize: 13, color: '#c8c8c8', padding: '24px 28px', lineHeight: 1.8 }}>
      {lines.slice(0, 2).map((l, i) => <div key={i}>{l || ' '}</div>)}
      {mem > 0 && <div>Memory Test: {mem}K {mem >= 8192 ? 'OK' : ''}</div>}
      {lines.slice(2).map((l, i) => <div key={i + 2}>{l || ' '}</div>)}
      {ready && <div style={{ marginTop: 16, color: '#fff' }}>Press any key to continue <span className="m5-blink">█</span></div>}
    </div>
  )
}

// ── shutdown screen ───────────────────────────────────────────────────────────
function ShutdownScreen({ onOut }: { onOut: () => void }) {
  return (
    <div onClick={onOut} style={{
      position: 'absolute', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexDirection: 'column', gap: 18,
    }}>
      <div style={{ fontFamily: '"Courier New", monospace', fontSize: 'clamp(16px, 3vw, 26px)', color: '#ff8800', textAlign: 'center', lineHeight: 1.6 }}>
        It&apos;s now safe to turn off<br />your computer.
      </div>
      <div style={{ fontFamily: '"Courier New", monospace', fontSize: 10, color: 'rgba(255,136,0,0.4)' }}>
        (click to leave the machine)
      </div>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function World5Machine() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const findSecret = useWorldStore(s => s.findSecret)
  const [phase, setPhase] = useState<'boot' | 'desktop' | 'shutdown'>('boot')
  const [bootCount, setBootCount] = useState(1)
  const [windows, setWindows] = useState<Win[]>([])
  const [startOpen, setStartOpen] = useState(false)
  const zRef = useRef(10)
  const openCount = useRef(0)

  useEffect(() => { setBootCount(recordBoot()) }, [])

  const focus = useCallback((id: string) => {
    zRef.current++
    setWindows(prev => prev.map(w => w.id === id ? { ...w, z: zRef.current } : w))
  }, [])

  const close = useCallback((id: string) => setWindows(prev => prev.filter(w => w.id !== id)), [])

  const open = useCallback((id: string, title: string, node: ReactNode, w = 420, h = 320) => {
    setWindows(prev => {
      if (prev.some(win => win.id === id)) {
        zRef.current++
        return prev.map(win => win.id === id ? { ...win, z: zRef.current } : win)
      }
      zRef.current++
      const n = openCount.current++
      return [...prev, {
        id, title, node, w, h, z: zRef.current,
        x: 60 + (n % 6) * 32, y: 40 + (n % 6) * 26,
      }]
    })
  }, [])

  const openProgram = useCallback((progId: string) => {
    const prog = PROGRAMS.find(p => p.id === progId)
    if (prog) open(`prog:${progId}`, prog.title, <ProgramWindow progId={progId} />, 480, 380)
  }, [open])

  const healedCount = Math.min(RECOVERED_SECTORS.length, Math.max(0, bootCount - 1))

  const openRecovered = useCallback(() => {
    open('dir:recovered', 'C:\\RECOVERED', (
      <FolderGrid items={RECOVERED_SECTORS.map((s, i) => ({
        icon: bootCount > i + 1 ? '📄' : '🗒',
        label: s.file + (bootCount > i + 1 ? '' : ' (damaged)'),
        dim: bootCount <= i + 1,
        onOpen: () => open(`sector:${i}`, s.file, <SectorFile idx={i} healed={bootCount > i + 1} />, 460, 260),
      }))} />
    ), 400, 220)
  }, [open, bootCount])

  useEffect(() => {
    if (healedCount >= RECOVERED_SECTORS.length && phase === 'desktop') findSecret('machine-all-sectors')
  }, [healedCount, phase, findSecret])

  const DESKTOP_ICONS = [
    { icon: '💻', label: 'My Computer', act: () => open('dir:root', 'C:\\', (
      <FolderGrid items={[
        { icon: '📁', label: 'PROJECTS', onOpen: () => openIcon('projects') },
        { icon: '📁', label: 'EXPERIMENTS', onOpen: () => openIcon('experiments') },
        { icon: '📁', label: 'GAMES', onOpen: () => openIcon('games') },
        { icon: '📁', label: 'RECOVERED', onOpen: openRecovered },
        { icon: '📄', label: 'README.TXT', onOpen: () => openIcon('readme') },
        { icon: '🌐', label: 'WEBSITE.V1', onOpen: () => openIcon('v1') },
      ]} />
    ), 400, 240) },
    { icon: '⌨', label: 'TERMINAL', act: () => openIcon('terminal') },
    { icon: '📄', label: 'README.TXT', act: () => openIcon('readme') },
    { icon: '📁', label: 'PROGRAMS', act: () => openIcon('games') },
    { icon: '🗒', label: 'RECOVERED', act: openRecovered },
    { icon: '🌐', label: 'WEBSITE.V1', act: () => openIcon('v1') },
  ]

  function openIcon(kind: string) {
    switch (kind) {
      case 'terminal':
        open('terminal', 'MS-DOS Prompt — EMDUR/OS', <Terminal bootCount={bootCount} onRun={openProgram} onSecret={findSecret} />, 520, 340)
        break
      case 'readme':
        open('readme', 'README.TXT — Notepad', <Notepad lines={README_TXT} />, 440, 340)
        break
      case 'v1':
        findSecret('machine-website-v1')
        open('v1', 'index.htm — tyleremdur.com (1 of 1 pages)', <WebsiteV1 />, 420, 340)
        break
      case 'projects':
        open('dir:projects', 'C:\\PROJECTS', (
          <FolderGrid items={projects.map(p => ({
            icon: '⚙', label: `${p.id.toUpperCase()}.EXE`,
            onOpen: () => open(`proj:${p.id}`, `${p.title}.EXE`, <ProjectExe p={p} />, 420, 300),
          }))} />
        ), 460, 280)
        break
      case 'experiments':
        open('dir:experiments', 'C:\\EXPERIMENTS — deleted, not gone', (
          <FolderGrid items={EXPERIMENTS.map(e => ({
            icon: '🧪', label: e.title,
            onOpen: () => open(`exp:${e.id}`, e.title, <Notepad lines={[`${e.title}`, `status: ${e.status}`, '', e.note]} />, 420, 240),
          }))} />
        ), 460, 300)
        break
      case 'games':
        open('dir:games', 'C:\\GAMES', (
          <FolderGrid items={PROGRAMS.map(p => ({
            icon: '🕹', label: p.title,
            onOpen: () => openProgram(p.id),
          }))} />
        ), 460, 300)
        break
    }
  }

  function shutDown() {
    setStartOpen(false)
    shutdownChime()
    setPhase('shutdown')
  }

  return (
    <div data-world="5" style={{ position: 'fixed', inset: 0, background: '#1a1614', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <style>{`
        @keyframes m5-blink { 50% { opacity: 0 } }
        .m5-blink { animation: m5-blink 0.9s step-end infinite }
        .m5-icon:hover .m5-icon-lbl { background: #000080; }
      `}</style>
      <HomeButton />

      {/* the physical monitor */}
      <div style={{
        position: 'relative',
        width: 'min(1060px, calc(100vw - 28px))',
        height: 'min(760px, calc(100vh - 28px))',
        background: 'linear-gradient(165deg, #d8d0bc, #b8b09c, #a8a08c)',
        borderRadius: 14,
        padding: '18px 18px 34px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.35)',
      }}>
        {/* screen */}
        <div style={{
          position: 'relative', width: '100%', height: '100%',
          background: phase === 'desktop' ? TEAL : '#000',
          borderRadius: 6, overflow: 'hidden',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.45), inset 0 0 0 2px #222',
        }}>
          {phase === 'boot' && <BootScreen bootCount={bootCount} onDone={() => setPhase('desktop')} />}
          {phase === 'shutdown' && <ShutdownScreen onOut={() => navigateTo(1, { type: 'fold' })} />}

          {phase === 'desktop' && (
            <>
              {/* desktop icons */}
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 1 }}>
                {DESKTOP_ICONS.map(ic => (
                  <div key={ic.label} className="m5-icon" onClick={ic.act} style={{ width: 74, textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 26, filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))' }}>{ic.icon}</div>
                    <div className="m5-icon-lbl" style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, color: '#fff', textShadow: '1px 1px 1px #000', padding: '1px 2px', marginTop: 2 }}>{ic.label}</div>
                  </div>
                ))}
              </div>

              {/* windows */}
              {windows.map(w => (
                <MachineWindow key={w.id} win={w} onFocus={() => focus(w.id)} onClose={() => close(w.id)} />
              ))}

              {/* start menu */}
              {startOpen && (
                <div style={{
                  position: 'absolute', bottom: 30, left: 2, width: 190, zIndex: 9000,
                  background: GRAY, border: '2px outset #fff', boxShadow: '2px 2px 0 rgba(0,0,0,0.5)',
                  fontFamily: 'Arial, sans-serif', fontSize: 11,
                }}>
                  {[
                    { label: '⌨  MS-DOS Prompt', act: () => { openIcon('terminal'); setStartOpen(false) } },
                    { label: '🕹  Games', act: () => { openIcon('games'); setStartOpen(false) } },
                    { label: '⚙  Projects', act: () => { openIcon('projects'); setStartOpen(false) } },
                    { label: '🧪  Experiments', act: () => { openIcon('experiments'); setStartOpen(false) } },
                    { label: '📄  Read Me', act: () => { openIcon('readme'); setStartOpen(false) } },
                  ].map(item => (
                    <div key={item.label} onClick={item.act}
                      style={{ padding: '7px 10px', cursor: 'pointer', color: '#000', borderBottom: '1px solid #aaa' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#000080'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000' }}
                    >{item.label}</div>
                  ))}
                  <div onClick={shutDown}
                    style={{ padding: '7px 10px', cursor: 'pointer', color: '#000', fontWeight: 700 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#000080'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000' }}
                  >⏻  Shut Down...</div>
                </div>
              )}

              {/* taskbar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
                background: GRAY, borderTop: '2px outset #fff',
                display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px', zIndex: 8000,
              }}>
                <button onClick={() => setStartOpen(o => !o)} style={{
                  padding: '2px 10px', background: GRAY, border: startOpen ? '2px inset #fff' : '2px outset #fff',
                  fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                }}>⊞ Start</button>
                <div style={{ width: 2, height: 18, borderLeft: '1px solid #808080', borderRight: '1px solid #fff', margin: '0 2px' }} />
                <div style={{ display: 'flex', gap: 3, overflow: 'hidden', flex: 1 }}>
                  {windows.map(w => (
                    <div key={w.id} onClick={() => focus(w.id)} style={{
                      padding: '2px 8px', background: GRAY, border: '2px outset #fff',
                      fontFamily: 'Arial, sans-serif', fontSize: 10, cursor: 'pointer',
                      maxWidth: 130, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flexShrink: 0,
                    }}>{w.title}</div>
                  ))}
                </div>
                <div style={{ padding: '2px 8px', border: '1px inset #808080', fontFamily: 'Arial, sans-serif', fontSize: 10 }}>
                  boot #{bootCount}
                </div>
              </div>
            </>
          )}

          {/* CRT glass */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9500,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9500,
            background: 'radial-gradient(ellipse 100% 100% at center, transparent 78%, rgba(0,0,0,0.28) 100%)',
          }} />
        </div>

        {/* bezel details */}
        <div style={{ position: 'absolute', bottom: 9, left: 26, fontFamily: 'Arial, sans-serif', fontSize: 10, fontWeight: 700, color: '#6a6254', letterSpacing: 2 }}>
          EMDUR <span style={{ fontWeight: 400 }}>486DX2</span>
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 30, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 7, color: '#6a6254' }}>POWER</div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: phase === 'shutdown' ? '#553311' : '#3fae4a', boxShadow: phase === 'shutdown' ? 'none' : '0 0 6px rgba(63,174,74,0.8)' }} />
        </div>
      </div>
    </div>
  )
}
