'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'
import HomeButton from './HomeButton'

interface Line {
  type: 'in' | 'out' | 'err'
  text: string
}

const WORLDS: Record<string, { id: WorldId; portal: PortalType }> = {
  depth: { id: 2, portal: 'scatter' },
  broadcast: { id: 3, portal: 'expand-white' },
  corridor: { id: 4, portal: 'slide-right' },
  field: { id: 5, portal: 'rotate' },
  document: { id: 6, portal: 'nothing' },
  mall: { id: 7, portal: 'cursor-flood' },
  signal: { id: 8, portal: 'fold' },
  contact: { id: 9, portal: 'expand-white' },
  loop: { id: 10, portal: 'vortex' },
  flicker: { id: 11, portal: 'scatter' },
  terminal: { id: 12, portal: 'nothing' },
  spiral: { id: 13, portal: 'vortex' },
  pixel: { id: 14, portal: 'chromatic' },
  dial: { id: 15, portal: 'chromatic' },
  index: { id: 16, portal: 'fold' },
  universe: { id: 1, portal: 'fold' },
  surface: { id: 0, portal: 'door' },
}

const FILES = [
  'readme.txt',
  'wormhole.map',
  'depth.log',
  'infinite.worlds',
  'pixel.rom',
  'dial.frequencies',
  'do_not_open',
  '.hidden/exit',
]

export default function World12Terminal() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [lines, setLines] = useState<Line[]>([
    { type: 'out', text: 'wormhole OS v0.∞ — type "help" or get lost' },
    { type: 'out', text: '47 objects detected in parent universe. 17 worlds mounted.' },
    { type: 'out', text: '' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const glitchCount = useRef(0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const append = useCallback((newLines: Line[]) => {
    setLines(prev => [...prev, ...newLines])
  }, [])

  const runCommand = useCallback((raw: string) => {
    const cmd = raw.trim().toLowerCase()
    const parts = cmd.split(/\s+/)
    const verb = parts[0]

    append([{ type: 'in', text: `> ${raw}` }])

    if (!verb) return

    if (verb === 'help') {
      append([
        { type: 'out', text: 'commands:' },
        { type: 'out', text: '  ls · cat <file> · cd <world> · wormhole · whoami · clear' },
        { type: 'out', text: '  worlds: depth broadcast corridor field document mall signal' },
        { type: 'out', text: '          contact loop flicker spiral pixel dial index universe surface' },
        { type: 'out', text: '  secret: try "sudo rm -rf /" or "exit"' },
      ])
      return
    }

    if (verb === 'clear') {
      setLines([])
      return
    }

    if (verb === 'ls') {
      append(FILES.map(f => ({ type: 'out' as const, text: `  ${f}` })))
      append([{ type: 'out', text: '' }])
      return
    }

    if (verb === 'cat' && parts[1]) {
      const file = parts[1]
      if (file === 'readme.txt') {
        append([
          { type: 'out', text: 'you are inside the interface.' },
          { type: 'out', text: 'the interface is inside you.' },
          { type: 'out', text: 'type cd <world> to traverse.' },
        ])
      } else if (file === 'wormhole.map') {
        append([
          { type: 'out', text: 'N→E→S→W→?  (loop)' },
          { type: 'out', text: '∞→13→∞→11→∞  (spiral/flicker)' },
          { type: 'out', text: 'all paths converge at origin TE-∅' },
        ])
      } else if (file === 'infinite.worlds') {
        append([
          { type: 'out', text: 'world count: undefined' },
          { type: 'out', text: 'world count: 17' },
          { type: 'out', text: 'world count: ∞+1' },
        ])
      } else if (file === 'pixel.rom') {
        append([
          { type: 'out', text: '8-bit cartridge detected. colors: TOO MANY.' },
          { type: 'out', text: 'type: cd pixel' },
        ])
      } else if (file === 'dial.frequencies') {
        append([
          { type: 'out', text: '88.8 depth · 91.1 pixel · 94.7 loop · 97.5 index' },
          { type: 'out', text: 'fake stations exist. trust nothing.' },
        ])
      } else if (file === 'do_not_open') {
        append([{ type: 'err', text: 'permission denied. opening anyway...' }])
        setTimeout(() => navigateTo(6, { type: 'nothing' }), 800)
      } else {
        append([{ type: 'err', text: `cat: ${file}: no such file` }])
      }
      return
    }

    if (verb === 'cd' && parts[1]) {
      const target = WORLDS[parts[1]]
      if (target) {
        append([{ type: 'out', text: `entering ${parts[1]}...` }])
        setTimeout(() => navigateTo(target.id, { type: target.portal }), 500)
      } else {
        append([{ type: 'err', text: `cd: ${parts[1]}: not a mounted world` }])
      }
      return
    }

    if (verb === 'wormhole') {
      const keys = Object.keys(WORLDS).filter(k => k !== 'terminal' && k !== 'universe')
      const pick = keys[Math.floor(Math.random() * keys.length)]
      const target = WORLDS[pick]
      append([
        { type: 'out', text: 'opening random aperture...' },
        { type: 'out', text: `destination: ${pick}` },
      ])
      setTimeout(() => navigateTo(target.id, { type: 'vortex' }), 700)
      return
    }

    if (verb === 'whoami') {
      append([
        { type: 'out', text: 'guest@wormhole' },
        { type: 'out', text: 'also: you' },
        { type: 'out', text: 'also: the one who clicked enter' },
      ])
      return
    }

    if (verb === 'exit' || cmd === 'sudo rm -rf /') {
      append([{ type: 'out', text: 'nice try. routing to spiral instead.' }])
      setTimeout(() => navigateTo(13, { type: 'vortex' }), 600)
      return
    }

    if (verb === 'glitch') {
      glitchCount.current++
      if (glitchCount.current >= 3) {
        append([{ type: 'out', text: 'signal breach. redirecting.' }])
        setTimeout(() => navigateTo(8, { type: 'fold' }), 500)
      } else {
        append([{ type: 'err', text: `#${glitchCount.current} static... keep going` }])
      }
      return
    }

    append([{ type: 'err', text: `${verb}: command not found. type help.` }])
  }, [append, navigateTo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setHistory(h => [...h, input])
    setHistIdx(-1)
    runCommand(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault()
      const idx = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(idx)
      setInput(history[idx])
    }
    if (e.key === 'ArrowDown' && histIdx >= 0) {
      e.preventDefault()
      const idx = histIdx + 1
      if (idx >= history.length) {
        setHistIdx(-1)
        setInput('')
      } else {
        setHistIdx(idx)
        setInput(history[idx])
      }
    }
  }

  return (
    <div
      data-world="12"
      onClick={() => inputRef.current?.focus()}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0c0c0c',
        overflow: 'hidden',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 13,
        cursor: 'text',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: '24px 28px 80px',
        overflowY: 'auto',
        color: '#22c55e',
      }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: line.type === 'in' ? '#4ade80' : line.type === 'err' ? '#f87171' : '#22c55e',
              opacity: line.type === 'in' ? 0.9 : 0.75,
              marginBottom: 2,
              whiteSpace: 'pre-wrap',
            }}
          >
            {line.text}
          </div>
        ))}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span style={{ color: '#22c55e', opacity: 0.6 }}>{'>'}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#4ade80',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              caretColor: '#22c55e',
            }}
          />
        </form>
        <div ref={bottomRef} />
      </div>

      <div style={{
        position: 'fixed',
        top: 16,
        right: 24,
        fontSize: 8,
        color: 'rgba(34,197,94,0.25)',
        letterSpacing: '0.2em',
      }}>
        THE TERMINAL · world 12
      </div>

      <HomeButton />
    </div>
  )
}
