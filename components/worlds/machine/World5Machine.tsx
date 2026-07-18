'use client'
import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { useWorldStore, type WorldId } from '@/lib/world-store'
import HomeButton from '../HomeButton'
import { projects } from '@/lib/data/projects'
import { PROGRAMS } from './programs'
import {
  EXPERIMENTS, README_TXT, RECOVERED_SECTORS, RECYCLED, WEBSITE_V1_LINKS, WORLD_FILES,
  garbleLine, getBootCount, recordBoot, type RecycledItem,
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

// ── SRVHOST.EXE — the server monitor ─────────────────────────────────────────
// The reason this machine exists: it is serving tyleremdur.com, right now,
// to you. The log is a mix of the truth (worlds you have actually visited,
// damage that is actually on the disk) and the machine's own bookkeeping.
const SRV_EPOCH = new Date('2024-11-09T23:47:00').getTime() // digger v1.0 deploy
const SRV_CITIES = [
  'BOULDER, CO', 'PORTLAND, OR', 'BROOKLYN, NY', 'DELHI', 'REYKJAVIK',
  'TAIPEI', 'ULAANBAATAR', 'ISTANBUL', 'DUSHANBE', 'SAXON HARBOR, WI',
]
let srvSeq = 0
function ServerMonitor({ bootCount }: { bootCount: number }) {
  const visited = useWorldStore(s => s.visited)
  const current = useWorldStore(s => s.current)
  const [lines, setLines] = useState<{ id: number; text: string; color?: string }[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const visitorRef = useRef(1200 + Math.floor(Math.random() * 90))

  const stamp = () => {
    const d = new Date()
    return `[${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}]`
  }

  useEffect(() => {
    const damaged = Math.max(0, RECOVERED_SECTORS.length - Math.max(0, bootCount - 1))
    const boot: { id: number; text: string; color?: string }[] = [
      { id: ++srvSeq, text: 'SRVHOST.EXE v4.86 — tyleremdur.com', color: '#5ecbe0' },
      { id: ++srvSeq, text: `carrier 88.7 MHz · listening`, color: '#5ecbe0' },
      { id: ++srvSeq, text: '' },
      ...visited.map(w => ({ id: ++srvSeq, text: `${stamp()} cache warm · WORLD_${w}.WLD (visited this session)` })),
      { id: ++srvSeq, text: `${stamp()} serving WORLD_${current}.WLD to visitor #1247 — that's you`, color: '#f6c66a' },
      ...(damaged > 0 ? [{ id: ++srvSeq, text: `${stamp()} WARN ${damaged} damaged sector(s) — recovery on next boot`, color: '#f66' }] : []),
    ]
    setLines(boot)

    let tid: ReturnType<typeof setTimeout>
    const tick = () => {
      tid = setTimeout(() => {
        const r = Math.random()
        let text = ''
        let color: string | undefined
        if (r < 0.42) {
          const w = WORLD_FILES[Math.floor(Math.random() * WORLD_FILES.length)]
          text = `${stamp()} GET /world/${w.world} · 200 · ${8 + Math.floor(Math.random() * 120)}ms`
        } else if (r < 0.62) {
          visitorRef.current += 1
          text = `${stamp()} visitor #${visitorRef.current} connected (${SRV_CITIES[Math.floor(Math.random() * SRV_CITIES.length)]})`
        } else if (r < 0.78) {
          text = `${stamp()} carrier 88.7 MHz — signal ${Math.random() < 0.85 ? 'good' : 'drifting'}`
        } else if (r < 0.9) {
          text = `${stamp()} mem ${(6.2 + Math.random() * 1.6).toFixed(1)}MB/8.0MB · disk ok · fan ok`
        } else if (r < 0.97) {
          text = `${stamp()} keepalive → visitor #1247 · you're still here`
          color = '#f6c66a'
        } else {
          text = `${stamp()} visitor #0000 connected (40.0150°N 105.2705°W)`
          color = '#f472b6'
        }
        setLines(prev => [...prev.slice(-140), { id: ++srvSeq, text, color }])
        tick()
      }, 1200 + Math.random() * 2600)
    }
    tick()
    return () => clearTimeout(tid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [lines])

  const upDays = Math.floor((Date.now() - SRV_EPOCH) / 86400000)

  return (
    <div style={{ background: '#000', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: '"Courier New", monospace', fontSize: 12 }}>
      <div style={{ padding: '5px 10px', borderBottom: '1px solid #1c3a2c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ color: '#5ecbe0' }}>STATUS: <span style={{ color: '#6ee86e' }}>ON THE AIR</span></span>
        <span style={{ color: '#3a7a3a' }}>up {upDays}d · visitors now: 3</span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3fae4a', boxShadow: '0 0 6px rgba(63,174,74,0.9)', animation: 'm5-blink 1.8s step-end infinite' }} />
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', lineHeight: 1.65 }}>
        {lines.map(l => <div key={l.id} style={{ color: l.color ?? '#3a9a4a', whiteSpace: 'pre-wrap' }}>{l.text || ' '}</div>)}
      </div>
      <div style={{ padding: '4px 10px', borderTop: '1px solid #1c3a2c', color: '#2a5a3a', fontSize: 10, flexShrink: 0 }}>
        do not close this window. the site stays up either way, but still.
      </div>
    </div>
  )
}

// ── terminal ──────────────────────────────────────────────────────────────────
let termSeq = 0
function Terminal({ bootCount, onRun, onSecret, onWorld, onSrv }: {
  bootCount: number
  onRun: (progId: string) => void
  onSecret: (id: string) => void
  onWorld: (world: number) => void
  onSrv: () => void
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
    'C:\\': ['WORLDS         <DIR>', 'PROJECTS       <DIR>', 'EXPERIMENTS    <DIR>', 'GAMES          <DIR>', 'RECOVERED      <DIR>', 'RECYCLED       <DIR>', 'WEBSITE.V1     <DIR>', 'SRVHOST.EXE', 'README.TXT', 'COMMITS.LOG'],
    'C:\\WORLDS': WORLD_FILES.map(w => `${w.file.padEnd(14)}${w.size.padStart(7)}  ${w.note}`),
    'C:\\RECYCLED': RECYCLED.map(r => `${r.file.padEnd(34)}    0  ${r.deleted}`),
    'C:\\PROJECTS': projects.map(p => `${p.id.toUpperCase().slice(0, 12)}.EXE`),
    'C:\\EXPERIMENTS': EXPERIMENTS.map(e => e.title.toUpperCase().replace(/[^A-Z0-9.]/g, '_').slice(0, 20) + '.LOG'),
    'C:\\GAMES': ['MINESWEEPER.EXE', ...PROGRAMS.map(p => p.title.toUpperCase())],
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
        print([
          'DIR · CD <dir> · TYPE <file> · RUN <program> · COMMITS · CLS · VER · FORMAT',
          '',
          'This machine serves tyleremdur.com. The worlds are in C:\\WORLDS\\ —',
          'RUN <name>.WLD loads one. RUN SRVHOST attaches the server monitor.',
        ])
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
        const rec = RECYCLED.find(r => { const b = r.file.toUpperCase(); return arg === b || arg === b.split('.')[0] })
        if (rec) { print(rec.body, '#c8e6c9'); break }
        if (arg.includes('INDEX')) { print(['<html> — it renders. Open WEBSITE.V1 on the desktop to see it.'], '#c8e6c9'); break }
        print([`File not found: ${arg || '?'}`], '#f66')
        break
      }
      case 'RUN': {
        if (arg.startsWith('SRVHOST')) { print(['SRVHOST.EXE is already running. Attaching monitor...']); onSrv(); break }
        if (arg.endsWith('.WLD')) {
          const wf = WORLD_FILES.find(w => w.file === arg)
          if (!wf) { print([`No such world: ${arg}`], '#f66'); break }
          if (wf.world === 5) { print(['MACHINE.WLD is already running. You are inside it.'], '#f6c66a'); break }
          print([`Loading ${wf.file} — ${wf.note}...`], '#5ecbe0')
          setTimeout(() => onWorld(wf.world), 900)
          break
        }
        if (arg.replace('.EXE', '').startsWith('MINESWEEP')) { print(['Starting Minesweeper...']); onRun('minesweeper'); break }
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
      // not in HELP — for whoever thinks to try it
      case 'UNDELETE':
        print([
          'UNDELETE C:\\RECYCLED\\*.*',
          '',
          ...RECYCLED.map(r => `  ${r.file.padEnd(34)} recovery declined — file was never fully gone`),
          '',
          'Nothing to undelete. Nothing ever left.',
          "Open the Recycle Bin on the desktop if you don't believe the terminal.",
        ], '#f6c66a')
        onSecret('machine-undelete')
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
// Click selects (like a real machine); double-click opens.
function FolderGrid({ items }: { items: { icon: string; label: string; sub?: string; onOpen: () => void; dim?: boolean }[] }) {
  const [sel, setSel] = useState<string | null>(null)
  return (
    <div onClick={() => setSel(null)} style={{ background: '#fff', height: '100%', overflowY: 'auto', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 92px)', gap: 8, alignContent: 'start' }}>
      {items.map(it => (
        <div key={it.label}
          onClick={e => { e.stopPropagation(); setSel(it.label) }}
          onDoubleClick={e => { e.stopPropagation(); it.onOpen() }}
          style={{ textAlign: 'center', cursor: 'pointer', opacity: it.dim ? 0.45 : 1, userSelect: 'none' }}>
          <div style={{ fontSize: 26 }}>{it.icon}</div>
          <div style={{
            fontFamily: 'Arial, sans-serif', fontSize: 9, wordBreak: 'break-all', lineHeight: 1.3, marginTop: 2,
            display: 'inline-block', padding: '1px 3px',
            background: sel === it.label ? '#000080' : 'transparent',
            color: sel === it.label ? '#fff' : '#000',
            outline: sel === it.label ? '1px dotted #ff0' : 'none',
          }}>{it.label}</div>
          {it.sub && <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 8, color: '#666', marginTop: 1 }}>{it.sub}</div>}
        </div>
      ))}
    </div>
  )
}

// ── Recycle Bin ───────────────────────────────────────────────────────────────
// The files Tyler deleted that the disk won't let go of. Double-click to read
// one; try to empty it and the disk holds on — some things stay on the disk.
function RecycleBin({ onOpen, onRefused }: { onOpen: (item: RecycledItem) => void; onRefused: () => void }) {
  const [sel, setSel] = useState<string | null>(null)
  const [dlg, setDlg] = useState<'confirm' | 'emptying' | 'blocked' | null>(null)
  const [emptyingFile, setEmptyingFile] = useState('')

  const runEmpty = useCallback(async () => {
    setDlg('emptying')
    for (const it of RECYCLED) {
      setEmptyingFile(it.file)
      await new Promise(r => setTimeout(r, 260))
    }
    await new Promise(r => setTimeout(r, 240))
    setDlg('blocked')
    onRefused()
  }, [onRefused])

  return (
    <div style={{ background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* toolbar */}
      <div style={{ background: GRAY, borderBottom: '1px solid #808080', padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, color: '#000' }}>{RECYCLED.length} item(s)</span>
        <button
          onClick={() => setDlg('confirm')}
          style={{ padding: '2px 8px', background: GRAY, border: '2px outset #fff', fontFamily: 'Arial, sans-serif', fontSize: 10, cursor: 'pointer', color: '#000' }}
        >🗑 Empty Recycle Bin</button>
      </div>
      {/* file grid */}
      <div onClick={() => setSel(null)} style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 100px)', gap: 8, alignContent: 'start' }}>
        {RECYCLED.map(it => (
          <div key={it.file}
            onClick={e => { e.stopPropagation(); setSel(it.file) }}
            onDoubleClick={e => { e.stopPropagation(); onOpen(it) }}
            style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ fontSize: 26 }}>{it.icon}</div>
            <div style={{
              fontFamily: 'Arial, sans-serif', fontSize: 9, wordBreak: 'break-word', lineHeight: 1.3, marginTop: 2,
              display: 'inline-block', padding: '1px 3px',
              background: sel === it.file ? '#000080' : 'transparent',
              color: sel === it.file ? '#fff' : '#000',
              outline: sel === it.file ? '1px dotted #ff0' : 'none',
            }}>{it.file}</div>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 8, color: '#888', marginTop: 1 }}>{it.deleted}</div>
          </div>
        ))}
      </div>

      {/* dialogs */}
      {dlg && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <div style={{ width: 'min(320px, 90%)', background: GRAY, border: '2px outset #fff', boxShadow: '3px 3px 0 rgba(0,0,0,0.4)', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ background: 'linear-gradient(90deg, #000080, #1084d0)', color: '#fff', padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
              {dlg === 'blocked' ? 'Cannot Empty Recycle Bin' : 'Confirm File Delete'}
            </div>
            {dlg === 'confirm' && (
              <>
                <div style={{ padding: '16px 16px 6px', display: 'flex', gap: 12, fontSize: 12, color: '#000', lineHeight: 1.5 }}>
                  <div style={{ fontSize: 26 }}>🗑</div>
                  <div>Are you sure you want to delete these {RECYCLED.length} items?</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 14px 14px' }}>
                  <button onClick={runEmpty} style={{ padding: '3px 14px', background: GRAY, border: '2px outset #fff', fontSize: 11, cursor: 'pointer' }}>Yes</button>
                  <button onClick={() => setDlg(null)} style={{ padding: '3px 14px', background: GRAY, border: '2px outset #fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>No</button>
                </div>
              </>
            )}
            {dlg === 'emptying' && (
              <div style={{ padding: '18px 16px', fontSize: 11, color: '#000', fontFamily: '"Courier New", monospace' }}>
                Deleting <b>{emptyingFile}</b>…
                <div style={{ marginTop: 10, height: 14, border: '1px inset #808080', background: '#fff', padding: 1 }}>
                  <div style={{ height: '100%', width: `${((RECYCLED.findIndex(r => r.file === emptyingFile) + 1) / RECYCLED.length) * 100}%`, background: 'repeating-linear-gradient(90deg,#000080 0 8px,#1084d0 8px 12px)' }} />
                </div>
              </div>
            )}
            {dlg === 'blocked' && (
              <>
                <div style={{ padding: '16px 16px 6px', display: 'flex', gap: 12, fontSize: 12, color: '#000', lineHeight: 1.55 }}>
                  <div style={{ fontSize: 26 }}>⚠️</div>
                  <div>
                    The disk is still holding these files.<br /><br />
                    They were deleted a long time ago. They are still here.<br />
                    Some things stay on the disk.
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 14px 14px' }}>
                  <button onClick={() => setDlg(null)} style={{ padding: '3px 18px', background: GRAY, border: '2px outset #fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>OK</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── draggable window ──────────────────────────────────────────────────────────
interface Win {
  id: string; title: string; node: ReactNode
  x: number; y: number; w: number; h: number; z: number
  min?: boolean; max?: boolean
}

const winBtn: React.CSSProperties = {
  width: 18, height: 15, background: GRAY, border: '1px outset #fff',
  fontSize: 9, lineHeight: 1, cursor: 'pointer', color: '#000',
  fontFamily: 'Arial, sans-serif', padding: 0,
}

function MachineWindow({ win, onFocus, onClose, onMin, onMax, onMoved }: {
  win: Win; onFocus: () => void; onClose: () => void; onMin: () => void; onMax: () => void
  onMoved: (x: number, y: number) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const posRef = useRef({ x: win.x, y: win.y })

  return (
    <div ref={elRef} onPointerDown={onFocus} style={{
      position: 'absolute',
      left: win.max ? 4 : win.x, top: win.max ? 4 : win.y,
      width: win.max ? 'calc(100% - 8px)' : win.w, height: win.max ? 'calc(100% - 38px)' : win.h,
      maxWidth: 'calc(100% - 8px)', maxHeight: 'calc(100% - 38px)',
      display: win.min ? 'none' : 'flex', flexDirection: 'column', zIndex: win.z,
      border: '2px outset #fff', background: GRAY,
      boxShadow: '2px 2px 0 rgba(0,0,0,0.5)',
    }}>
      <div
        onPointerDown={e => {
          if (win.max) return
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
        onPointerUp={() => {
          if (dragRef.current) onMoved(posRef.current.x, posRef.current.y)
          dragRef.current = null
        }}
        onDoubleClick={onMax}
        style={{
          background: 'linear-gradient(90deg, #000080, #1084d0)', color: '#fff',
          padding: '3px 4px 3px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, userSelect: 'none', flexShrink: 0, cursor: 'default',
        }}
      >
        <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{win.title}</span>
        <span style={{ display: 'flex', gap: 2 }} onPointerDown={e => e.stopPropagation()}>
          <button onClick={onMin} style={winBtn}>▁</button>
          <button onClick={onMax} style={winBtn}>{win.max ? '❐' : '□'}</button>
          <button onClick={onClose} style={{ ...winBtn, marginLeft: 2 }}>×</button>
        </span>
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
      { t: 4900, line: 'SRVHOST.EXE ........ OK — tyleremdur.com on the air (88.7 MHz)' },
      { t: 5300, line: 'Starting EMDUR/OS...' },
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
      <div style={{ fontFamily: '"Courier New", monospace', fontSize: 10, color: 'rgba(255,136,0,0.4)', textAlign: 'center', lineHeight: 1.8 }}>
        (click to leave the machine)<br />
        <span style={{ opacity: 0.6 }}>the site comes back up. it always does.</span>
      </div>
    </div>
  )
}

// ── Minesweeper ─────────────────────────────────────────────────────────────
const MS_W = 9, MS_H = 9, MS_MINES = 10
const NUM_COLORS = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080']

interface Cell { mine: boolean; revealed: boolean; flagged: boolean; n: number }

function makeGrid(): Cell[] {
  return Array.from({ length: MS_W * MS_H }, () => ({ mine: false, revealed: false, flagged: false, n: 0 }))
}
function neighbors(i: number): number[] {
  const x = i % MS_W, y = Math.floor(i / MS_W), out: number[] = []
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (dx === 0 && dy === 0) continue
    const nx = x + dx, ny = y + dy
    if (nx >= 0 && nx < MS_W && ny >= 0 && ny < MS_H) out.push(ny * MS_W + nx)
  }
  return out
}

function Minesweeper({ onWin }: { onWin: () => void }) {
  const [grid, setGrid] = useState<Cell[]>(makeGrid)
  const [state, setState] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready')
  const [flags, setFlags] = useState(0)
  const [time, setTime] = useState(0)
  const [pressed, setPressed] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (state !== 'playing') return
    const t = setInterval(() => setTime(v => Math.min(999, v + 1)), 1000)
    return () => clearInterval(t)
  }, [state])

  const reset = () => { setGrid(makeGrid()); setState('ready'); setFlags(0); setTime(0); startedRef.current = false }

  const placeMines = (safe: number): Cell[] => {
    const g = makeGrid()
    const forbidden = new Set([safe, ...neighbors(safe)])
    let placed = 0
    while (placed < MS_MINES) {
      const i = Math.floor(Math.random() * MS_W * MS_H)
      if (forbidden.has(i) || g[i].mine) continue
      g[i].mine = true; placed++
    }
    for (let i = 0; i < g.length; i++) if (!g[i].mine) g[i].n = neighbors(i).filter(j => g[j].mine).length
    return g
  }

  const reveal = (i: number) => {
    if (state === 'won' || state === 'lost') return
    let g = grid
    if (!startedRef.current) { g = placeMines(i); startedRef.current = true; setState('playing') }
    if (g[i].revealed || g[i].flagged) return
    g = g.map(c => ({ ...c }))
    if (g[i].mine) {
      g.forEach(c => { if (c.mine) c.revealed = true })
      setGrid(g); setState('lost'); return
    }
    // flood fill zeros
    const stack = [i]
    while (stack.length) {
      const k = stack.pop()!
      if (g[k].revealed || g[k].flagged) continue
      g[k].revealed = true
      if (g[k].n === 0 && !g[k].mine) for (const j of neighbors(k)) if (!g[j].revealed) stack.push(j)
    }
    setGrid(g)
    const safeLeft = g.filter(c => !c.mine && !c.revealed).length
    if (safeLeft === 0) { g.forEach(c => { if (c.mine) c.flagged = true }); setGrid(g); setState('won'); onWin() }
  }

  const toggleFlag = (e: React.MouseEvent, i: number) => {
    e.preventDefault()
    if (grid[i].revealed || state === 'won' || state === 'lost') return
    setGrid(g => g.map((c, k) => k === i ? { ...c, flagged: !c.flagged } : c))
    setFlags(f => f + (grid[i].flagged ? -1 : 1))
  }

  const face = state === 'lost' ? '😵' : state === 'won' ? '😎' : pressed ? '😮' : '🙂'
  const lcd = (v: number) => String(Math.max(0, Math.min(999, v))).padStart(3, '0')

  return (
    <div style={{ background: GRAY, height: '100%', padding: 8, fontFamily: '"Courier New", monospace', userSelect: 'none' }}>
      <div style={{ border: '3px inset #fff', padding: 6, background: GRAY }}>
        {/* header */}
        <div style={{ border: '2px inset #fff', padding: '4px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ background: '#000', color: '#ff0000', fontSize: 20, padding: '1px 4px', letterSpacing: 1, fontWeight: 700 }}>{lcd(MS_MINES - flags)}</div>
          <button onClick={reset}
            onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
            style={{ width: 30, height: 30, border: '2px outset #fff', background: GRAY, fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>{face}</button>
          <div style={{ background: '#000', color: '#ff0000', fontSize: 20, padding: '1px 4px', letterSpacing: 1, fontWeight: 700 }}>{lcd(time)}</div>
        </div>
        {/* grid */}
        <div style={{ border: '3px inset #fff', display: 'grid', gridTemplateColumns: `repeat(${MS_W}, 22px)`, width: 'max-content' }}>
          {grid.map((c, i) => (
            <div key={i}
              onClick={() => reveal(i)}
              onContextMenu={(e) => toggleFlag(e, i)}
              onMouseDown={() => { if (!c.revealed) setPressed(true) }}
              onMouseUp={() => setPressed(false)}
              style={{
                width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', boxSizing: 'border-box',
                border: c.revealed ? '1px solid #808080' : '2px outset #fff',
                background: c.revealed && c.mine ? '#ff0000' : GRAY,
                color: NUM_COLORS[c.n] || '#000',
              }}>
              {c.revealed ? (c.mine ? '💣' : c.n > 0 ? c.n : '') : c.flagged ? '🚩' : ''}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: '#333', marginTop: 6, textAlign: 'center' }}>
          left-click clears · right-click flags {state === 'won' ? '· YOU WIN' : state === 'lost' ? '· BOOM' : ''}
        </div>
      </div>
    </div>
  )
}

// ── Idle screensaver: a starfield, the way the CRT drifts off when you stop ──
function Screensaver({ onWake }: { onWake: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize()
    let stars = Array.from({ length: 320 }, () => ({ x: (Math.random() - 0.5) * c.width, y: (Math.random() - 0.5) * c.height, z: Math.random() * c.width }))
    let raf = 0
    const draw = () => {
      const W = c.width, H = c.height, cx = W / 2, cy = H / 2
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H)
      stars = stars.map(s => {
        s.z -= 3.2
        if (s.z <= 1) { s.x = (Math.random() - 0.5) * W; s.y = (Math.random() - 0.5) * H; s.z = W }
        const k = 128 / s.z
        const px = cx + s.x * k, py = cy + s.y * k
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const size = (1 - s.z / W) * 2.6
          const shade = Math.min(255, (1 - s.z / W) * 255)
          ctx.fillStyle = `rgb(${shade},${shade},${shade})`
          ctx.fillRect(px, py, size, size)
        }
        return s
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div
      onPointerDown={onWake} onWheel={onWake}
      style={{ position: 'absolute', inset: 0, zIndex: 9400, background: '#000', cursor: 'none' }}>
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

// ── System-tray clock: keeps time, badly ────────────────────────────────────
function TrayClock() {
  // Starts from a fixed skewed offset and drifts — the machine's clock was never right.
  const [label, setLabel] = useState('--:-- --')
  const baseRef = useRef<number | null>(null)
  useEffect(() => {
    const fmt = () => {
      if (baseRef.current === null) baseRef.current = performance.now()
      // fake wall time: 11:47 PM start, running ~1.7% fast, occasional jump
      const elapsed = (performance.now() - baseRef.current) / 1000
      let mins = 23 * 60 + 47 + Math.floor(elapsed * 1.017 / 60)
      mins %= 24 * 60
      const h = Math.floor(mins / 60), m = mins % 60
      const ap = h >= 12 ? 'PM' : 'AM'
      const h12 = ((h + 11) % 12) + 1
      setLabel(`${h12}:${String(m).padStart(2, '0')} ${ap}`)
    }
    fmt()
    const t = setInterval(fmt, 5000)
    return () => clearInterval(t)
  }, [])
  return <>{label}</>
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function World5Machine() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const findSecret = useWorldStore(s => s.findSecret)
  const [phase, setPhase] = useState<'boot' | 'desktop' | 'shutdown'>('boot')
  const [bootCount, setBootCount] = useState(1)
  const [windows, setWindows] = useState<Win[]>([])
  const [startOpen, setStartOpen] = useState(false)
  const [saver, setSaver] = useState(false)
  const [confirmOff, setConfirmOff] = useState(false)
  const [selIcon, setSelIcon] = useState<string | null>(null)
  const zRef = useRef(10)
  const openCount = useRef(0)
  const lastActiveRef = useRef(0)

  useEffect(() => { setBootCount(recordBoot()) }, [])

  // Screensaver: if the desktop sits untouched, the CRT drifts off into a starfield.
  useEffect(() => {
    if (phase !== 'desktop') return
    lastActiveRef.current = performance.now()
    const bump = () => { lastActiveRef.current = performance.now(); setSaver(false) }
    window.addEventListener('pointermove', bump)
    window.addEventListener('pointerdown', bump)
    window.addEventListener('keydown', bump)
    window.addEventListener('wheel', bump)
    const check = setInterval(() => {
      if (performance.now() - lastActiveRef.current > 45000) setSaver(true)
    }, 1500)
    return () => {
      window.removeEventListener('pointermove', bump)
      window.removeEventListener('pointerdown', bump)
      window.removeEventListener('keydown', bump)
      window.removeEventListener('wheel', bump)
      clearInterval(check)
    }
  }, [phase])

  const focus = useCallback((id: string) => {
    zRef.current++
    setWindows(prev => prev.map(w => w.id === id ? { ...w, z: zRef.current } : w))
  }, [])

  const close = useCallback((id: string) => setWindows(prev => prev.filter(w => w.id !== id)), [])

  const minimize = useCallback((id: string) =>
    setWindows(prev => prev.map(w => w.id === id ? { ...w, min: true } : w)), [])

  const toggleMax = useCallback((id: string) => {
    zRef.current++
    setWindows(prev => prev.map(w => w.id === id ? { ...w, max: !w.max, min: false, z: zRef.current } : w))
  }, [])

  const moved = useCallback((id: string, x: number, y: number) =>
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w)), [])

  const open = useCallback((id: string, title: string, node: ReactNode, w = 420, h = 320) => {
    setWindows(prev => {
      if (prev.some(win => win.id === id)) {
        zRef.current++
        return prev.map(win => win.id === id ? { ...win, z: zRef.current, min: false } : win)
      }
      zRef.current++
      const n = openCount.current++
      return [...prev, {
        id, title, node, w, h, z: zRef.current,
        x: 60 + (n % 6) * 32, y: 40 + (n % 6) * 26,
      }]
    })
  }, [])

  const openMinesweeper = useCallback(() => {
    open('minesweeper', 'Minesweeper', <Minesweeper onWin={() => findSecret('machine-minesweeper-win')} />, 232, 306)
  }, [open, findSecret])

  const openProgram = useCallback((progId: string) => {
    if (progId === 'minesweeper') { openMinesweeper(); return }
    const prog = PROGRAMS.find(p => p.id === progId)
    if (prog) open(`prog:${progId}`, prog.title, <ProgramWindow progId={progId} />, 480, 380)
  }, [open, openMinesweeper])

  const healedCount = Math.min(RECOVERED_SECTORS.length, Math.max(0, bootCount - 1))

  // Opening a .WLD file really loads that world. The machine serves the
  // site; from here you can go anywhere on it.
  const loadWorld = useCallback((world: number) => {
    if (world === 5) {
      open('wld-running', 'MACHINE.WLD', (
        <Notepad lines={[
          'Cannot load MACHINE.WLD:',
          '',
          'This world is already running.',
          'You are inside it right now.',
        ]} />
      ), 340, 180)
      return
    }
    findSecret('machine-opened-a-wld')
    navigateTo(world as WorldId, { type: 'fold' })
  }, [open, findSecret, navigateTo])

  const openWorlds = useCallback(() => {
    open('dir:worlds', 'C:\\WORLDS — the whole site lives here', (
      <FolderGrid items={WORLD_FILES.map(wf => ({
        icon: wf.world === 5 ? '💾' : '🌐',
        label: wf.file,
        sub: `${wf.size} · ${wf.note}`,
        onOpen: () => loadWorld(wf.world),
      }))} />
    ), 520, 330)
  }, [open, loadWorld])

  const openSrvhost = useCallback(() => {
    findSecret('machine-found-the-server')
    open('srvhost', 'SRVHOST.EXE — tyleremdur.com', <ServerMonitor bootCount={bootCount} />, 560, 380)
  }, [open, findSecret, bootCount])

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

  const openRecycleBin = useCallback(() => {
    open('recyclebin', 'Recycle Bin', (
      <RecycleBin
        onOpen={(it) => open(`recycled:${it.file}`, it.file, <Notepad lines={it.body} />, 440, 300)}
        onRefused={() => findSecret('machine-bin-wont-empty')}
      />
    ), 480, 320)
  }, [open, findSecret])

  useEffect(() => {
    if (healedCount >= RECOVERED_SECTORS.length && phase === 'desktop') findSecret('machine-all-sectors')
  }, [healedCount, phase, findSecret])

  const DESKTOP_ICONS = [
    { icon: '💻', label: 'My Computer', act: () => open('dir:root', 'C:\\', (
      <FolderGrid items={[
        { icon: '🌐', label: 'WORLDS', onOpen: openWorlds },
        { icon: '📁', label: 'PROJECTS', onOpen: () => openIcon('projects') },
        { icon: '📁', label: 'EXPERIMENTS', onOpen: () => openIcon('experiments') },
        { icon: '📁', label: 'GAMES', onOpen: () => openIcon('games') },
        { icon: '📁', label: 'RECOVERED', onOpen: openRecovered },
        { icon: '📡', label: 'SRVHOST.EXE', onOpen: openSrvhost },
        { icon: '🗑', label: 'Recycle Bin', onOpen: openRecycleBin },
        { icon: '📄', label: 'README.TXT', onOpen: () => openIcon('readme') },
        { icon: '🌐', label: 'WEBSITE.V1', onOpen: () => openIcon('v1') },
      ]} />
    ), 440, 260) },
    { icon: '📡', label: 'SRVHOST.EXE', act: openSrvhost },
    { icon: '🌐', label: 'WORLDS', act: openWorlds },
    { icon: '⌨', label: 'TERMINAL', act: () => openIcon('terminal') },
    { icon: '📄', label: 'README.TXT', act: () => openIcon('readme') },
    { icon: '💣', label: 'MINESWEEPER', act: openMinesweeper },
    { icon: '📁', label: 'PROGRAMS', act: () => openIcon('games') },
    { icon: '🗒', label: 'RECOVERED', act: openRecovered },
    { icon: '🗑', label: 'Recycle Bin', act: openRecycleBin },
  ]

  function openIcon(kind: string) {
    switch (kind) {
      case 'terminal':
        open('terminal', 'MS-DOS Prompt — EMDUR/OS', (
          <Terminal bootCount={bootCount} onRun={openProgram} onSecret={findSecret}
            onWorld={loadWorld} onSrv={openSrvhost} />
        ), 520, 340)
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
          <FolderGrid items={[
            { icon: '💣', label: 'MINESWEEPER', onOpen: openMinesweeper },
            ...PROGRAMS.map(p => ({
              icon: '🕹', label: p.title,
              onOpen: () => openProgram(p.id),
            })),
          ]} />
        ), 460, 300)
        break
    }
  }

  function shutDown() {
    setStartOpen(false)
    setConfirmOff(false)
    shutdownChime()
    setPhase('shutdown')
  }

  return (
    <div data-world="5" style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <style>{`
        @keyframes m5-blink { 50% { opacity: 0 } }
        .m5-blink { animation: m5-blink 0.9s step-end infinite }
      `}</style>
      <HomeButton />

      {/* the screen IS the viewport — you're not looking at this machine, you're on it */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div
          onClick={() => setSelIcon(null)}
          style={{
            position: 'relative', width: '100%', height: '100%',
            background: phase === 'desktop' ? TEAL : '#000',
            overflow: 'hidden',
          }}>
          {phase === 'boot' && <BootScreen bootCount={bootCount} onDone={() => setPhase('desktop')} />}
          {phase === 'shutdown' && <ShutdownScreen onOut={() => navigateTo(1, { type: 'fold' })} />}

          {phase === 'desktop' && (
            <>
              {/* wallpaper texture + reminder of what this box is doing */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'radial-gradient(rgba(0,0,0,0.10) 1px, transparent 1px)',
                backgroundSize: '6px 6px',
              }} />
              <div style={{
                position: 'absolute', right: 14, bottom: 40, pointerEvents: 'none',
                fontFamily: '"Courier New", monospace', fontSize: 11, textAlign: 'right',
                color: 'rgba(255,255,255,0.28)', lineHeight: 1.7,
              }}>
                EMDUR/OS 4.86<br />serving tyleremdur.com · 88.7 MHz<br />do not turn off
              </div>

              {/* desktop icons — click selects, double-click opens */}
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 13, zIndex: 1, maxHeight: 'calc(100% - 60px)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {DESKTOP_ICONS.map(ic => (
                  <div key={ic.label}
                    onClick={e => { e.stopPropagation(); setSelIcon(ic.label) }}
                    onDoubleClick={e => { e.stopPropagation(); setSelIcon(null); ic.act() }}
                    style={{ width: 78, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ fontSize: 26, filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))' }}>{ic.icon}</div>
                    <div style={{
                      fontFamily: 'Arial, sans-serif', fontSize: 9, color: '#fff', textShadow: '1px 1px 1px #000',
                      padding: '1px 3px', marginTop: 2, display: 'inline-block',
                      background: selIcon === ic.label ? '#000080' : 'transparent',
                      outline: selIcon === ic.label ? '1px dotted rgba(255,255,255,0.7)' : 'none',
                    }}>{ic.label}</div>
                  </div>
                ))}
              </div>

              {/* windows */}
              {windows.map(w => (
                <MachineWindow key={w.id} win={w}
                  onFocus={() => focus(w.id)}
                  onClose={() => close(w.id)}
                  onMin={() => minimize(w.id)}
                  onMax={() => toggleMax(w.id)}
                  onMoved={(x, y) => moved(w.id, x, y)}
                />
              ))}

              {/* start menu */}
              {startOpen && (
                <div style={{
                  position: 'absolute', bottom: 30, left: 2, width: 190, zIndex: 9000,
                  background: GRAY, border: '2px outset #fff', boxShadow: '2px 2px 0 rgba(0,0,0,0.5)',
                  fontFamily: 'Arial, sans-serif', fontSize: 11,
                }}>
                  {[
                    { label: '📡  Server Monitor', act: () => { openSrvhost(); setStartOpen(false) } },
                    { label: '🌐  Worlds', act: () => { openWorlds(); setStartOpen(false) } },
                    { label: '⌨  MS-DOS Prompt', act: () => { openIcon('terminal'); setStartOpen(false) } },
                    { label: '💣  Minesweeper', act: () => { openMinesweeper(); setStartOpen(false) } },
                    { label: '🕹  Games', act: () => { openIcon('games'); setStartOpen(false) } },
                    { label: '⚙  Projects', act: () => { openIcon('projects'); setStartOpen(false) } },
                    { label: '🧪  Experiments', act: () => { openIcon('experiments'); setStartOpen(false) } },
                    { label: '🗑  Recycle Bin', act: () => { openRecycleBin(); setStartOpen(false) } },
                    { label: '📄  Read Me', act: () => { openIcon('readme'); setStartOpen(false) } },
                  ].map(item => (
                    <div key={item.label} onClick={item.act}
                      style={{ padding: '7px 10px', cursor: 'pointer', color: '#000', borderBottom: '1px solid #aaa' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#000080'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000' }}
                    >{item.label}</div>
                  ))}
                  <div onClick={() => { setStartOpen(false); setConfirmOff(true) }}
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
                  {windows.map(w => {
                    const topZ = Math.max(...windows.filter(x => !x.min).map(x => x.z), 0)
                    const active = !w.min && w.z === topZ
                    return (
                      <div key={w.id}
                        onClick={() => { if (w.min) { focus(w.id); setWindows(prev => prev.map(x => x.id === w.id ? { ...x, min: false } : x)) } else if (active) minimize(w.id); else focus(w.id) }}
                        style={{
                          padding: '2px 8px', background: active ? '#d8d8d8' : GRAY,
                          border: active ? '2px inset #fff' : '2px outset #fff',
                          fontFamily: 'Arial, sans-serif', fontSize: 10, cursor: 'pointer',
                          fontWeight: active ? 700 : 400,
                          maxWidth: 130, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flexShrink: 0,
                        }}>{w.title}</div>
                    )
                  })}
                </div>
                <div style={{ padding: '2px 8px', border: '1px inset #808080', fontFamily: 'Arial, sans-serif', fontSize: 10 }}>
                  boot #{bootCount}
                </div>
                <div style={{ padding: '2px 8px', border: '1px inset #808080', fontFamily: 'Arial, sans-serif', fontSize: 10, minWidth: 62, textAlign: 'center' }}>
                  <TrayClock />
                </div>
              </div>

              {/* shut down? the machine would like a word first */}
              {confirmOff && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 9200, background: 'rgba(0,0,0,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 'min(400px, 92vw)', background: GRAY, border: '2px outset #fff', boxShadow: '3px 3px 0 rgba(0,0,0,0.5)' }}>
                    <div style={{ background: 'linear-gradient(90deg, #000080, #1084d0)', color: '#fff',
                      padding: '3px 8px', fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700 }}>
                      Shut Down EMDUR/OS
                    </div>
                    <div style={{ padding: '16px 16px 6px', display: 'flex', gap: 12, fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#000', lineHeight: 1.6 }}>
                      <div style={{ fontSize: 28 }}>⚠️</div>
                      <div>
                        SRVHOST.EXE is still serving <b>3 visitors</b>.<br />
                        One of them appears to be you.<br /><br />
                        If this machine shuts down, the site you are standing in goes with it.
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 16px 14px' }}>
                      <button onClick={() => { findSecret('machine-pulled-the-plug'); shutDown() }}
                        style={{ padding: '4px 14px', background: GRAY, border: '2px outset #fff', fontFamily: 'Arial, sans-serif', fontSize: 11, cursor: 'pointer' }}>
                        Shut down anyway
                      </button>
                      <button onClick={() => setConfirmOff(false)}
                        style={{ padding: '4px 14px', background: GRAY, border: '2px outset #fff', fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* idle screensaver */}
              {saver && <Screensaver onWake={() => { lastActiveRef.current = performance.now(); setSaver(false) }} />}
            </>
          )}

          {/* CRT glass — the one reminder that this screen is 30 years old */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9500,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9500,
            background: 'radial-gradient(ellipse 100% 100% at center, transparent 78%, rgba(0,0,0,0.32) 100%)',
          }} />
        </div>
      </div>
    </div>
  )
}
