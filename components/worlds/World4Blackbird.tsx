'use client'
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import HomeButton from './HomeButton'

const GREEN = '#33ff66'
const GREEN_DIM = '#1a8033'
const RED = '#ff3333'

interface CaseFile {
  id: string
  date: string
  line: string
  redacted: string
}

const CASES: CaseFile[] = [
  { id: '001_flagstaff.txt', date: '03.14.97', line: 'Subject reports object hovering above Flagstaff Mountain, no sound, no exhaust.', redacted: '████████ ███ ███████ ████ ████████ ██████, ██ █████, ██ ███████.' },
  { id: '002_witnesses.txt', date: '07.02.98', line: 'Three witnesses, three different drawings, same triangle.', redacted: '█████ ████████, █████ ███████ ████████, ████ ████████.' },
  { id: '003_audio.txt', date: '11.19.01', line: 'Audio log corrupted at 00:42. Background hum measured at 19Hz before loss.', redacted: '█████ ███ ████████ ██ ██:██. ██████████ ███ ███████ ██ ████ █████ ████.' },
  { id: '004_balloon.txt', date: '05.06.04', line: 'Filed under "weather balloon." It was not a weather balloon.', redacted: '██████ █████ "███████ ████████." ██ ███ ███ █ ███████ ████████.' },
  { id: '005_duplicate.txt', date: '02.28.09', line: 'Two case numbers assigned to the same incident. Neither office will explain why.', redacted: '███ ████ ███████ ██████████ ██ ███ ████ ████████. ███████ ██████ ████ ███████ ███.' },
  { id: '006_denied.txt', date: '09.11.14', line: 'Request for this file was denied. This page exists anyway.', redacted: '███████ ███ ████ ████ ███ ██████. ████ ████ ██████ ██████.' },
]

const DIRS = ['cases', 'photos', 'logs', 'admin', 'archive'] as const
type Dir = typeof DIRS[number] | '/'

function Scanlines() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)',
      mixBlendMode: 'multiply',
    }} />
  )
}

function StaticPhoto() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    c.width = 280; c.height = 180
    let raf = 0
    const draw = () => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, 280, 180)
      for (let i = 0; i < 1800; i++) {
        const v = Math.random()
        ctx.fillStyle = v > 0.5 ? `rgba(${[51, 60, 80][Math.floor(Math.random() * 3)]},255,${[51, 80, 120][Math.floor(Math.random() * 3)]},${Math.random() * 0.5})` : 'rgba(0,0,0,0.3)'
        ctx.fillRect(Math.random() * 280, Math.random() * 180, 1, 1)
      }
      ctx.strokeStyle = 'rgba(51,255,102,0.4)'
      ctx.beginPath()
      ctx.ellipse(140 + Math.sin(Date.now() / 900) * 6, 80, 38, 12, 0, 0, Math.PI * 2)
      ctx.stroke()
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} style={{ width: '100%', maxWidth: 280, border: `1px solid ${GREEN_DIM}`, display: 'block', marginTop: 6 }} />
}

// procedurally generated "endless filing cabinet" of purged case numbers
function archiveNumber(n: number): string {
  const year = 1994 + (n % 31)
  return `CF-${String(year).slice(2)}-${String(n).padStart(5, '0')}`
}
const ARCHIVE_SIZE = 240
const ARCHIVE_REAL_SLOT = 88641 % ARCHIVE_SIZE // one purged-looking slot secretly aliases a real case

let lineSeq = 0
function nextId() { return `l${++lineSeq}` }

export default function World4Blackbird() {
  const [cwd, setCwd] = useState<Dir>('/')
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [unlocked, setUnlocked] = useState(false)
  const [output, setOutput] = useState<{ id: string; node: ReactNode }[]>([])
  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState<number | null>(null)
  const [stampVisible, setStampVisible] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const iv = setInterval(() => setStampVisible(v => !v), 900)
    return () => clearInterval(iv)
  }, [])

  const push = useCallback((node: ReactNode) => {
    setOutput(prev => [...prev, { id: nextId(), node }])
  }, [])

  const bootedRef = useRef(false)
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    const boot = [
      'DEPARTMENT OF UNRESOLVED MATTERS — FIELD DIVISION',
      'ARCHIVE TERMINAL v2.3 — CONNECTION ESTABLISHED',
      '',
      'This file was never supposed to be public. A misconfigured archive server',
      'left it reachable for one afternoon in 2019. It has stayed up ever since',
      'because nobody who could take it down has admitted it exists.',
      '',
      "Type 'help' for commands. Type 'ls' to look around.",
    ]
    boot.forEach((line, i) =>
      setTimeout(() => push(<div style={{ color: i < 2 ? GREEN : '#88cc99' }}>{line || ' '}</div>), i * 90)
    )
  }, [push])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [output])

  function findCase(name: string): CaseFile | undefined {
    const clean = name.replace(/^\/?(cases\/)?/, '')
    return CASES.find(c => c.id === clean || c.id.startsWith(clean))
  }

  function runCommand(raw: string) {
    const cmd = raw.trim()
    push(<div><span style={{ color: GREEN_DIM }}>{cwd === '/' ? '/' : `/${cwd}`}&gt;</span> <span style={{ color: '#fff' }}>{cmd}</span></div>)
    if (!cmd) return

    const [word, ...rest] = cmd.split(/\s+/)
    const arg = rest.join(' ')
    const lc = word.toLowerCase()

    switch (lc) {
      case 'help': {
        push(<div style={{ color: '#88cc99', lineHeight: 1.8 }}>
          ls [dir] &middot; cd &lt;dir&gt; &middot; pwd &middot; cat &lt;file&gt; &middot; unredact &lt;file&gt;<br />
          view &lt;file&gt; &middot; search &lt;term&gt; &middot; access &lt;codename&gt; &middot; request &lt;file&gt; &middot; clear
        </div>)
        break
      }
      case 'pwd':
        push(<div>{cwd === '/' ? '/' : `/${cwd}`}</div>)
        break
      case 'clear':
        setOutput([])
        break
      case 'whoami':
        push(<div style={{ color: '#88cc99' }}>UNKNOWN. Session not authenticated. That has never stopped anyone before.</div>)
        break
      case 'cd': {
        const target = arg.replace(/^\//, '')
        if (target === '' || target === '/') { setCwd('/'); break }
        if (target === '..') { setCwd('/'); break }
        if ((DIRS as readonly string[]).includes(target)) {
          if (target === 'admin' && !unlocked) {
            push(<div style={{ color: RED }}>ACCESS DENIED. /admin requires clearance. Use: access &lt;codename&gt;</div>)
          } else {
            setCwd(target as Dir)
          }
        } else {
          push(<div style={{ color: RED }}>No such directory: {arg}</div>)
        }
        break
      }
      case 'ls': {
        const target = (arg || (cwd === '/' ? '' : cwd)).replace(/^\//, '')
        if (target === '') {
          push(<div style={{ color: '#88cc99' }}>
            {DIRS.map(d => <div key={d}>{d === 'admin' && !unlocked ? 'admin/  [LOCKED]' : `${d}/`}</div>)}
          </div>)
        } else if (target === 'cases') {
          push(<div style={{ color: '#88cc99' }}>{CASES.map(c => <div key={c.id}>{c.id}{revealed.has(c.id) ? '  [unredacted]' : ''}</div>)}</div>)
        } else if (target === 'photos') {
          push(<div style={{ color: '#88cc99' }}>fig1_flagstaff.img</div>)
        } else if (target === 'logs') {
          push(<div style={{ color: '#88cc99' }}>access.log</div>)
        } else if (target === 'admin') {
          if (!unlocked) push(<div style={{ color: RED }}>ACCESS DENIED.</div>)
          else push(<div style={{ color: '#88cc99' }}>codename.txt</div>)
        } else if (target === 'archive') {
          push(<div style={{ color: GREEN_DIM, fontSize: 10, lineHeight: 1.6, maxHeight: 160, overflowY: 'auto' }}>
            {Array.from({ length: ARCHIVE_SIZE }, (_, i) => archiveNumber(i)).join('   ')}
          </div>)
          push(<div style={{ color: '#88cc99', marginTop: 4 }}>{ARCHIVE_SIZE} entries. Most return nothing. cat one if you have time to waste.</div>)
        } else {
          push(<div style={{ color: RED }}>No such directory: {arg}</div>)
        }
        break
      }
      case 'cat': {
        if (!arg) { push(<div style={{ color: RED }}>usage: cat &lt;file&gt;</div>); break }
        const c = findCase(arg)
        if (c) {
          push(<div style={{ color: revealed.has(c.id) ? '#fff' : GREEN, lineHeight: 1.7 }}>
            <div style={{ color: GREEN_DIM, fontSize: 10, marginBottom: 4 }}>{c.date}</div>
            {revealed.has(c.id) ? c.line : c.redacted}
            {!revealed.has(c.id) && <div style={{ color: GREEN_DIM, fontSize: 10, marginTop: 4 }}>// try: unredact {c.id}</div>}
          </div>)
        } else if (arg.replace(/^\/?(logs\/)?/, '') === 'access.log') {
          push(<div style={{ color: '#88cc99', lineHeight: 1.8, fontSize: 11 }}>
            03.14.97 04:12 — read access — user unknown<br />
            11.19.01 22:58 — write access — user unknown<br />
            06.03.19 13:40 — full archive dump — checked out under project codename ████████ (8 letters, starts with B)<br />
            06.03.19 13:41 — connection left open — never closed
          </div>)
        } else if (arg.replace(/^\/?(admin\/)?/, '') === 'codename.txt') {
          if (!unlocked) {
            push(<div style={{ color: RED }}>ACCESS DENIED. Use: access &lt;codename&gt;</div>)
          } else {
            push(<div style={{ color: '#fff', lineHeight: 1.7 }}>
              Codename accepted. There is no Project Blackbird. There never was. The
              codename was assigned to a budget line, not an investigation — a
              placeholder someone forgot to remove. Six field reports got filed under
              it by mistake and nobody ever reopened them.
              <br /><br />
              That&apos;s the whole secret. Sorry. The hum at 19Hz was a transformer
              two buildings over. Some files just stay open because closing them
              is somebody else&apos;s job.
            </div>)
          }
        } else {
          const m = arg.match(/CF-\d{2}-(\d{5})/i)
          const num = m ? parseInt(m[1], 10) : NaN
          if (!isNaN(num) && Array.from({ length: ARCHIVE_SIZE }, (_, i) => archiveNumber(i)).includes(arg.toUpperCase())) {
            const idx = Array.from({ length: ARCHIVE_SIZE }, (_, i) => archiveNumber(i)).indexOf(arg.toUpperCase())
            if (idx === ARCHIVE_REAL_SLOT) {
              push(<div style={{ color: GREEN }}>{arg.toUpperCase()} — misfiled. Contents match cases/003_audio.txt. // try: cat 003_audio.txt</div>)
            } else {
              push(<div style={{ color: GREEN_DIM }}>{arg.toUpperCase()} — RECORDS PURGED. No further information available.</div>)
            }
          } else {
            push(<div style={{ color: RED }}>File not found: {arg}</div>)
          }
        }
        break
      }
      case 'unredact':
      case 'decrypt': {
        const c = findCase(arg)
        if (!c) { push(<div style={{ color: RED }}>File not found: {arg}</div>); break }
        setRevealed(prev => new Set(prev).add(c.id))
        push(<div style={{ color: '#fff', lineHeight: 1.7 }}>
          <div style={{ color: GREEN_DIM, fontSize: 10, marginBottom: 4 }}>{c.date}</div>
          {c.line}
        </div>)
        break
      }
      case 'view': {
        const clean = arg.replace(/^\/?(photos\/)?/, '')
        if (clean === 'fig1_flagstaff.img' || clean === 'fig1') {
          push(<div>
            <div style={{ color: '#88cc99', fontSize: 10, marginBottom: 4 }}>FIG. 1 — UNIDENTIFIED, FLAGSTAFF MTN, 03.14.97</div>
            <StaticPhoto />
          </div>)
        } else {
          push(<div style={{ color: RED }}>File not found: {arg}</div>)
        }
        break
      }
      case 'search': {
        if (!arg) { push(<div style={{ color: RED }}>usage: search &lt;term&gt;</div>); break }
        const term = arg.toLowerCase()
        const hits = CASES.filter(c => c.line.toLowerCase().includes(term) || c.id.toLowerCase().includes(term))
        if (hits.length === 0) {
          push(<div style={{ color: GREEN_DIM }}>No matches in accessible records.</div>)
        } else {
          push(<div style={{ color: '#88cc99', lineHeight: 1.8 }}>
            {hits.map(h => <div key={h.id}>match: cases/{h.id} {revealed.has(h.id) ? `— "${h.line}"` : '— [still redacted]'}</div>)}
          </div>)
        }
        if (term.includes('19hz') || term.includes('hum')) {
          push(<div style={{ color: GREEN, marginTop: 4 }}>cross-reference: logs/access.log — a matching frequency signature appears in the 06.03.19 dump entry.</div>)
        }
        break
      }
      case 'access': {
        if (!arg) { push(<div style={{ color: RED }}>usage: access &lt;codename&gt;</div>); break }
        if (arg.trim().toUpperCase() === 'BLACKBIRD') {
          setUnlocked(true)
          push(<div style={{ color: GREEN }}>ACCESS GRANTED. /admin unlocked.</div>)
        } else {
          push(<div style={{ color: RED }}>ACCESS DENIED. Codename not recognized.</div>)
        }
        break
      }
      case 'request': {
        if (!arg) { push(<div style={{ color: RED }}>usage: request &lt;file&gt;</div>); break }
        push(<div style={{ color: RED }}>REQUEST DENIED. This decision is final and not subject to appeal.</div>)
        break
      }
      default:
        push(<div style={{ color: RED }}>Command not recognized: {word}. Type &apos;help&apos;.</div>)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    runCommand(input)
    setCmdHistory(prev => [...prev, input])
    setHistIdx(null)
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length === 0) return
      const next = histIdx === null ? cmdHistory.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(next)
      setInput(cmdHistory[next])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx === null) return
      const next = histIdx + 1
      if (next >= cmdHistory.length) { setHistIdx(null); setInput('') }
      else { setHistIdx(next); setInput(cmdHistory[next]) }
    }
  }

  return (
    <div data-world="4" style={{
      position: 'fixed', inset: 0, overflow: 'hidden', background: '#040603',
      fontFamily: '"Courier New", monospace', color: GREEN,
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #0a1208 0%, #040603 70%)',
      display: 'flex', flexDirection: 'column',
    }} onClick={() => inputRef.current?.focus()}>
      <style>{`
        @keyframes w4-blink { 50% { opacity: 0 } }
        .w4-blink { animation: w4-blink 1s step-end infinite }
        @keyframes w4-cursor { 50% { opacity: 0 } }
        .w4-cursor { animation: w4-cursor 1s step-end infinite }
      `}</style>
      <Scanlines />
      <HomeButton />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 20px 0', width: '100%', flexShrink: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: GREEN_DIM, letterSpacing: 4, marginBottom: 6 }}>
            DEPARTMENT OF UNRESOLVED MATTERS &mdash; FIELD DIVISION
          </div>
          <div style={{
            fontSize: 'clamp(18px,4vw,26px)', fontWeight: 900, color: GREEN,
            textShadow: `0 0 10px ${GREEN}`, letterSpacing: 2, marginBottom: 6,
          }}>
            CASE FILE: PROJECT BLACKBIRD
          </div>
          <div className={stampVisible ? 'w4-blink' : ''} style={{
            display: 'inline-block', border: `2px solid ${RED}`, color: RED,
            fontSize: 11, fontWeight: 900, letterSpacing: 3, padding: '3px 10px',
            transform: 'rotate(-3deg)',
          }}>
            TOP SECRET // EYES ONLY
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
        <div ref={scrollRef} style={{
          flex: 1, minHeight: 0, overflowY: 'auto', border: `1px solid ${GREEN_DIM}`,
          background: 'rgba(0,10,0,0.5)', padding: 14, fontSize: 12,
        }}>
          {output.map(o => <div key={o.id} style={{ marginBottom: 6 }}>{o.node}</div>)}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 6, borderTop: `1px solid ${GREEN_DIM}`, padding: '10px 4px 0' }}>
          <span style={{ color: GREEN_DIM, fontSize: 12 }}>{cwd === '/' ? '/' : `/${cwd}`}&gt;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none', color: GREEN,
              fontFamily: 'inherit', fontSize: 12, caretColor: GREEN,
            }}
          />
          <span className="w4-cursor" style={{ color: GREEN }}>&#9608;</span>
        </form>
      </div>

      <div style={{ textAlign: 'center', fontSize: 9, color: GREEN_DIM, padding: '4px 0 14px', flexShrink: 0 }}>
        if you found this page, you already know too much &middot; visitors since 1997: 004,219
      </div>
    </div>
  )
}
