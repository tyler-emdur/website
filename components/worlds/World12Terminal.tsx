'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

interface Line {
  type: 'in' | 'out' | 'err'
  text: string
}

const KNOWN_WORLDS = [
  'depth', 'broadcast', 'corridor', 'field', 'document',
  'mall', 'signal', 'contact', 'loop', 'flicker',
  'terminal', 'spiral', 'pixel', 'dial', 'universe',
]

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

const PRESET_HISTORY = [
  'ls /worlds',
  'cd boulder && stay',
  'grep -r "frequency 88.7" ./universe',
  'cat do_not_open',
  'ping depth',
  'run marathon --distance=26.2 --year=2024',
  'ship portfolio.next --prod',
  'sleep 3h',
  'wake',
  'dig deeper',
  '[this line intentionally left blank]',
]

export default function World12Terminal() {
  const sessionStart = useWorldStore(s => s.sessionStart)
  const [lines, setLines] = useState<Line[]>([
    { type: 'out', text: 'wormhole OS v0.∞ — type "help" or get lost' },
    { type: 'out', text: '47 objects detected in parent universe. 15 worlds mounted.' },
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
        { type: 'out', text: '  ls · cat <file> · whoami · clear · ping <world>' },
        { type: 'out', text: '  ps · history · man <subject> · uptime · date · uname' },
        { type: 'out', text: '  echo <anything> · top · glitch · wormhole' },
        { type: 'out', text: '' },
        { type: 'out', text: 'worlds: depth broadcast corridor field document mall signal' },
        { type: 'out', text: '        contact loop flicker spiral pixel dial universe' },
        { type: 'out', text: '' },
        { type: 'out', text: 'note: direct traversal currently sealed' },
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
          { type: 'out', text: 'traversal is sealed. ping a world to confirm it exists.' },
        ])
      } else if (file === 'wormhole.map') {
        append([
          { type: 'out', text: 'N→E→S→W→?  (loop)' },
          { type: 'out', text: '∞→13→∞→11→∞  (spiral/flicker)' },
          { type: 'out', text: 'all paths converge at origin TE-∅' },
        ])
      } else if (file === 'depth.log') {
        append([
          { type: 'out', text: '[DEPTH LOG — SECTOR 02]' },
          { type: 'out', text: '  00.0m : surface entry' },
          { type: 'out', text: '  10.3m : pressure nominal' },
          { type: 'out', text: '  22.7m : first signal detected · 88.7' },
          { type: 'out', text: '  40.0m : doors visible on sonar' },
          { type: 'out', text: '  61.4m : room 47 confirmed' },
          { type: 'out', text: '  88.7m : something heard' },
          { type: 'out', text: '  ∞     : [recording stopped]' },
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
          { type: 'out', text: 'warp zones present. most are decorative.' },
        ])
      } else if (file === 'dial.frequencies') {
        append([
          { type: 'out', text: '88.8 depth · 91.1 pixel · 94.7 loop · 99.0 endpoint' },
          { type: 'out', text: 'fake stations exist. trust nothing below 88.8.' },
          { type: 'out', text: 'the broadcast at 88.7 does not appear on this dial.' },
          { type: 'out', text: 'it appears everywhere else.' },
        ])
      } else if (file === 'do_not_open') {
        append([{ type: 'err', text: 'permission denied.' }])
        setTimeout(() => append([{ type: 'err', text: '[you tried anyway. noted.]' }]), 600)
      } else if (file === '.hidden/exit') {
        append([
          { type: 'out', text: "there's no exit file here." },
          { type: 'out', text: 'there is a ← universe button in the corner.' },
          { type: 'out', text: 'that is the exit.' },
        ])
      } else {
        append([{ type: 'err', text: `cat: ${file}: no such file` }])
      }
      return
    }

    if (verb === 'cd' && parts[1]) {
      append([{ type: 'err', text: `cd: traversal sealed. use "ping ${parts[1]}" to confirm it exists.` }])
      return
    }

    if (verb === 'ping' && parts[1]) {
      const known = KNOWN_WORLDS.includes(parts[1])
      if (known) {
        append([
          { type: 'out', text: `PING ${parts[1]}.world: transmitting...` },
          { type: 'out', text: `reply from ${parts[1]}: world confirmed. sealed. cannot enter from here.` },
        ])
      } else {
        append([{ type: 'err', text: `ping: ${parts[1]}: no route to world` }])
      }
      return
    }

    if (verb === 'wormhole') {
      append([
        { type: 'err', text: 'wormhole: aperture sealed.' },
        { type: 'err', text: 'reason: inter-world traversal disabled.' },
      ])
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

    if (verb === 'ps') {
      append([
        { type: 'out', text: 'USER       PID   STAT  COMMAND' },
        { type: 'out', text: 'te         001   S     falling.exe' },
        { type: 'out', text: 'te         002   S     portfolio.next --watching' },
        { type: 'out', text: 'te         004   S     signal.monitor --freq=88.7' },
        { type: 'out', text: 'te         007   Z     [THE_DECISION] <defunct>' },
        { type: 'out', text: 'te         013   R     loop.worker --room=10' },
        { type: 'out', text: 'te         ∞     S     memory.persist --never-exits' },
      ])
      return
    }

    if (verb === 'history') {
      append(PRESET_HISTORY.map((h, i) => ({
        type: 'out' as const,
        text: `  ${String(i + 1).padStart(3)} ${h}`,
      })))
      return
    }

    if (verb === 'man') {
      const subject = parts[1] || ''
      if (!subject) {
        append([{ type: 'err', text: 'man: what manual page do you want?' }])
        return
      }
      if (subject === 'tyler' || subject === 'te') {
        append([
          { type: 'out', text: 'TYLER(1)               User Commands               TYLER(1)' },
          { type: 'out', text: '' },
          { type: 'out', text: 'NAME' },
          { type: 'out', text: '     tyler — software engineer; builder; runner' },
          { type: 'out', text: '' },
          { type: 'out', text: 'SYNOPSIS' },
          { type: 'out', text: '     tyler [build] [ship] [run] [repeat]' },
          { type: 'out', text: '' },
          { type: 'out', text: 'DESCRIPTION' },
          { type: 'out', text: '     tyler operates in Boulder, CO. builds software.' },
          { type: 'out', text: '     runs trails. ships things before they are perfect.' },
          { type: 'out', text: '' },
          { type: 'out', text: '     relocated from the midwest: 2022.' },
          { type: 'out', text: '     first marathon: oct 2024. 3:41:22.' },
          { type: 'out', text: '     current altitude: 5430 ft.' },
          { type: 'out', text: '' },
          { type: 'out', text: 'ENVIRONMENT' },
          { type: 'out', text: '     FREQ=88.7' },
          { type: 'out', text: '     COORDS=40.0150N,105.2705W' },
          { type: 'out', text: '     STATUS=actively building' },
          { type: 'out', text: '' },
          { type: 'out', text: 'SEE ALSO' },
          { type: 'out', text: '     depth(2), signal(8), spiral(13), contact(9)' },
          { type: 'out', text: '' },
          { type: 'out', text: 'BUGS' },
          { type: 'out', text: '     will keep going past the point of reasonable effort.' },
          { type: 'out', text: '' },
          { type: 'out', text: 'TYLER(1)               Tyler Emdur               TYLER(1)' },
        ])
      } else {
        append([{ type: 'err', text: `man: no entry for ${subject}. try "man tyler".` }])
      }
      return
    }

    if (verb === 'uptime') {
      const secs = Math.floor((Date.now() - sessionStart) / 1000)
      const m = Math.floor(secs / 60)
      const s = secs % 60
      append([
        { type: 'out', text: `up ${m}m ${s}s since session start` },
        { type: 'out', text: 'load: 1 project, 1 person, 0 regrets' },
      ])
      return
    }

    if (verb === 'date') {
      append([
        { type: 'err', text: '[WRONG DATE: this system does not track time accurately]' },
        { type: 'out', text: '[KNOWN TIME: 11:59]' },
        { type: 'out', text: '[KNOWN FACT: it is always 11:59 in room 10]' },
      ])
      return
    }

    if (verb === 'uname') {
      append([{ type: 'out', text: 'wormhole OS v0.∞ (wormhole-kernel) #1 SMP [DATE UNKNOWN] x86_undefined' }])
      return
    }

    if (verb === 'top') {
      append([
        { type: 'out', text: 'top — processes ordered by depth' },
        { type: 'out', text: '' },
        { type: 'out', text: '  TASK          CPU%   MEM    STATUS' },
        { type: 'out', text: '  falling.exe    99.9%  ∞MB    running' },
        { type: 'out', text: '  thinking       87.3%  ---    zombie' },
        { type: 'out', text: '  88.7 monitor   12.0%  small  sleeping' },
        { type: 'out', text: '  letting_go      4.1%  ---    waiting' },
        { type: 'out', text: '' },
        { type: 'out', text: '  press q to quit  (q does nothing here)' },
      ])
      return
    }

    if (verb === 'echo') {
      const rest = raw.trim().slice(5).trim()
      if (rest) {
        append([
          { type: 'out', text: rest },
          { type: 'out', text: '(noted.)' },
        ])
      } else {
        append([{ type: 'out', text: '' }])
      }
      return
    }

    if (verb === 'exit' || cmd === 'sudo rm -rf /') {
      append([{ type: 'out', text: 'nice try. nowhere to route to from here.' }])
      append([{ type: 'out', text: 'use ← universe to leave.' }])
      return
    }

    if (verb === 'glitch') {
      glitchCount.current++
      append([{ type: 'err', text: `#${glitchCount.current} static... signal goes nowhere` }])
      return
    }

    append([{ type: 'err', text: `${verb}: command not found. type help.` }])
  }, [append, sessionStart])

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
