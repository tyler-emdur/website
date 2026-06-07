'use client'
import { useEffect, useState, useRef } from 'react'
import { useUniverseStore, REGIONS } from '@/lib/universe-store'

const COMMANDS: Record<string, string[]> = {
  help:    ['AVAILABLE COMMANDS:', '  goto [sector]', '  scan', '  status', '  clear', '  whoami', '  ls', '  decrypt'],
  whoami:  ['VISITOR · UNCLASSIFIED · ACCESS LEVEL 0'],
  scan:    ['SCANNING UNIVERSE...', 'DETECTED: 5 SECTORS', 'DETECTED: 24 OBJECTS', 'ANOMALIES: 6', 'CLASSIFIED OBJECTS: 4', 'SCAN COMPLETE'],
  status:  ['UNIVERSE STATUS: NOMINAL', 'SECTOR 01-A: ONLINE', 'SECTOR 02-B: ONLINE', 'SECTOR 03-Ω: DEGRADED', 'SECTOR 04-Δ: ONLINE', 'SECTOR 05-Ψ: UNSTABLE'],
  ls:      ['SECTORS:', ...REGIONS.map(r => `  ${r.designation}  ${r.label}`)],
  decrypt: ['DECRYPTING...', '████████████████', '█████ REDACTED ████', 'DECRYPTION FAILED · INSUFFICIENT CLEARANCE'],
  whoami2: ['SUBJECT: TYLER EMDUR', 'STATUS: SOMEWHERE IN COLORADO', 'THREAT LEVEL: MINIMAL'],
}

export default function HiddenTerminal() {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState<string[]>(['UNIVERSE OS v0.1 · TYPE "help" FOR COMMANDS'])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { flyTo } = useUniverseStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '`' || (e.key === 't' && e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const exec = (raw: string) => {
    const cmd = raw.trim().toLowerCase()
    const parts = cmd.split(' ')
    const push = (...l: string[]) => setLines(prev => [...prev, `> ${raw}`, ...l])

    setHistory(h => [raw, ...h])
    setHistIdx(-1)

    if (!cmd) return setLines(prev => [...prev, `> `])

    if (parts[0] === 'goto' && parts[1]) {
      const region = REGIONS.find(r => r.label.toLowerCase() === parts[1] || r.id === parts[1])
      if (region) {
        flyTo([region.position[0], region.position[1], 300])
        push(`NAVIGATING TO ${region.label}...`, 'AUTOPILOT ENGAGED')
      } else {
        push(`ERROR: SECTOR "${parts[1]}" NOT FOUND`, 'TRY: goto projects | running | archives | explore | lab')
      }
      return
    }

    if (parts[0] === 'clear') { setLines([]); return }

    const response = COMMANDS[cmd] ?? COMMANDS[cmd + '2'] ?? [`COMMAND NOT FOUND: "${cmd}"`, 'TYPE "help" FOR COMMANDS']
    push(...response)
  }

  if (!open) return (
    <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.06)', textAlign: 'center' }}>
        PRESS ` TO OPEN TERMINAL
      </div>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      width: 'min(600px, 90vw)', zIndex: 200,
      background: 'rgba(0,0,8,0.95)', border: '1px solid rgba(168,85,247,0.25)',
      backdropFilter: 'blur(12px)', fontFamily: 'var(--font-mono)',
      boxShadow: '0 0 40px rgba(168,85,247,0.1)',
    }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(168,85,247,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(168,85,247,0.6)' }}>UNIVERSE TERMINAL</span>
        <button onClick={() => setOpen(false)} style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', cursor: 'none', background: 'none', border: 'none' }}>ESC ×</button>
      </div>

      <div style={{ height: 180, overflowY: 'auto', padding: '10px 14px', fontSize: 10, lineHeight: 1.8, color: 'rgba(255,255,255,0.55)' }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.startsWith('>') ? 'rgba(168,85,247,0.8)' : undefined }}>{l}</div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(168,85,247,0.08)', display: 'flex', gap: 8 }}>
        <span style={{ color: 'rgba(168,85,247,0.6)', fontSize: 10 }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { exec(input); setInput('') }
            if (e.key === 'ArrowUp') { const h = history[histIdx + 1]; if (h) { setInput(h); setHistIdx(i => i + 1) } }
            if (e.key === 'ArrowDown') { const h = history[histIdx - 1]; setInput(h ?? ''); setHistIdx(i => Math.max(-1, i - 1)) }
          }}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 10, letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', cursor: 'none' }}
          placeholder="type a command..."
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
