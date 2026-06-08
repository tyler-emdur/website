'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useUniverseStore, REGIONS, getAllObjects } from '@/lib/universe-store'

const MORSE: Record<string, string> = {
  A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',
  N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..',
  '9':'----.','.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','-':'-....-',' ':'/'
}

const ASCII_TYLER = `
 _____ __ _____ _____ ____
|_   _|\\ \\  __/|  ___|  _ \\
  | |   \\ \\/ /  | |__ | |_) |
  | |    )  (   |  __||    /
 _| |_  / /\\ \\  | |___| |\\ \\
|_____|/_/  \\_\\ |_____|_| \\_\\

 _____  __  __ ____  _   _ ____
|_   _||  \\/  |  _ \\| | | |  _ \\
  | |  | |\\/| | | | | | | | |_) |
  | |  | |  | | |_| | |_| |  _ <
  |_|  |_|  |_|____/ \\___/|_| \\_\\`

const PROCESSES = [
  'PID  TT  STAT    TIME COMMAND',
  ' 001  ??  Ss   0:00.01 universe-core',
  ' 002  ??  S    0:00.44 signal-monitor',
  ' 003  ??  R    2:18.99 discovery-engine',
  ' 004  ??  S    0:00.08 comet-system',
  ' 005  ??  Ss   0:00.12 nebula-renderer',
  ' 006  ??  S    0:00.03 region-probe [projects]',
  ' 007  ??  S    0:00.03 region-probe [running]',
  ' 008  ??  S    0:00.03 region-probe [archives]',
  ' 009  ??  S    0:00.03 region-probe [explore]',
  ' 010  ??  S    0:00.03 region-probe [lab]',
  ' 011  ??  S    0:28.72 cursor-physics',
  ` 012  s1  S+   ${(Math.random()*100).toFixed(2)} terminal.sh`,
]

const ARCHIVE_RECORDS = [
  'RECORD 904 // Core temperature decaying. Delta: -0.04/hr.',
  'RECORD 112 // Signal reacquisition failed in SECTOR 04-Δ. Retrying...',
  'RECORD 047 // Multiple duplicate frames detected during index sync.',
  'RECORD 887 // FM transmitter frequency drifting. Resonance detected at 88.7 MHz.',
  'RECORD 009 // White room coordinate boundaries confirmed stable. Exit vector locked.',
  'RECORD 309 // Diagnostic warning: 47 files remain unprocessed. Access restricted.',
  'RECORD 404 // Trace heavy isotope levels in SECTOR 02-B path: elevated.',
  'RECORD 104 // Gravity lens anomaly at coordinates [-2500, 1800, -1200] is expanding.',
]

const VOID_READOUTS = [
  'SENSOR DETECT // BARO: 0.00 PSI | GRAVITY: +0.02g | RAD: 42 mSv/h',
  'SENSOR DETECT // BARO: 0.00 PSI | GRAVITY: -0.14g | RAD: 12 mSv/h',
  'SENSOR DETECT // BARO: 0.00 PSI | GRAVITY: NOMINAL | RAD: 104 mSv/h',
  'SENSOR DETECT // BARO: 0.00 PSI | GRAVITY: FLUCTUATING | RAD: 88 mSv/h',
]

const INTERCEPTED_TRACKS = [
  'INTERCEPT // FREQ: 94.2MHz - Khruangbin — People Everywhere (Still Alive)',
  'INTERCEPT // FREQ: 88.7MHz - Tame Impala — Eventually',
  'INTERCEPT // FREQ: 101.5MHz - Mac DeMarco — Chamber of Reflection',
  'INTERCEPT // FREQ: 92.0MHz - FKJ — Ylang Ylang',
  'INTERCEPT // FREQ: 96.6MHz - Hiatus Kaiyote — Laputa',
  'INTERCEPT // FREQ: 89.1MHz - Unknown Mortal Orchestra — Multi-Love',
  'INTERCEPT // FREQ: 90.8MHz - Bon Iver — Holocene',
]

type Line = { text: string; cls?: string }

function buildCommands(flyTo: (pos: [number,number,number]) => void, discoveredIds: string[]) {
  const R = (text: string, cls?: string): Line => ({ text, cls })

  return {
    help: [
      R('── KNOWN COMMANDS ─────────────────────────────', 'dim'),
      R('  about        who is this'),
      R('  skills       technology stack'),
      R('  projects     things that have been built'),
      R('  runs         race log'),
      R('  contact      how to reach'),
      R('  goto [name]  navigate to a sector'),
      R('  scan         scan the universe'),
      R('  status       sector status report'),
      R('  weather      void sensor readouts'),
      R('  time         current time, multiple zones'),
      R('  music        audio band intercepts'),
      R('  fortune      archived record entries'),
      R('  ascii        banner'),
      R('  ls           list sectors'),
      R('  pwd          current path'),
      R('  clear        wipe terminal'),
      R(''),
      R('other commands exist. most are hidden.', 'dim'),
    ],

    about: [
      R('TYLER EMDUR', 'hi'),
      R('────────────────────────'),
      R('builder. runner. colorado.'),
      R(''),
      R('makes things that work — dashboards, tools,'),
      R('discovery engines, weird little websites.'),
      R(''),
      R('currently: somewhere above 5000ft', 'dim'),
      R('typically: boulder, co', 'dim'),
      R('status: shipping', 'cy'),
    ],

    skills: [
      R('TECHNOLOGY STACK', 'hi'),
      R('────────────────────────'),
      R('languages   TypeScript, JavaScript, Python'),
      R('frontend    Next.js, React, Three.js, GLSL'),
      R('backend     Node.js, Flask, Express'),
      R('databases   PostgreSQL, Redis, SQLite'),
      R('apis        Spotify, Strava, Open-Meteo,'),
      R('            Last.fm, Gemini, Discord'),
      R('tools       Vercel, Tailwind, shadcn/ui'),
      R('infra       Vercel, GitHub Actions'),
      R(''),
      R('currently learning: GLSL shaders, WebGPU', 'dim'),
    ],

    projects: [
      R('SHIPPED PROJECTS', 'hi'),
      R('────────────────────────'),
      R('  Digger          music discovery engine (Spotify + Last.fm)'),
      R('  Faraday Tools   construction tools, solar estimator'),
      R('  Strava Analytics  GPS-confirmed stop detection + Redis'),
      R('  Wildfire Risk   scikit-learn + real-time weather data'),
      R('  AP Practice     Gemini-graded FRQs, study platform'),
      R('  Fit Maker       daily outfit gen + weather matching'),
      R('  Hail Bot        Discord bot, hail monitoring'),
      R('  Mathibex        math equation generator (Flask)'),
      R('  Trackflation    HS running data viz (Chart.js)'),
      R(''),
      R('→ enter PROJECTS sector for full detail', 'dim'),
    ],

    runs: [
      R('RACE LOG', 'hi'),
      R('────────────────────────'),
      R('  Pikes Peak Ascent    13.3mi  +7,815ft  3:00:00'),
      R('  Boulder Marathon     26.2mi  +820ft    3:39:00'),
      R('  Denver Half          13.1mi  +310ft    1:44:00'),
      R('  Golden Gate 25K      15.5mi  +3,200ft  2:48:00'),
      R('  Chatfield 10K        6.2mi   +180ft    47:35'),
      R('  Maroon Bells Trail   12.0mi  +2,100ft  2:15:00'),
      R(''),
      R('total: ~86 miles logged · ~14,425 ft gained', 'cy'),
      R('→ enter RUNNING sector for splits and maps', 'dim'),
    ],

    contact: [
      R('CONTACT', 'hi'),
      R('────────────────────────'),
      R('email    tyler@tyleremdur.com', 'cy'),
      R('github   github.com/tyler-emdur', 'cy'),
      R('site     tyleremdur.com'),
      R(''),
      R('response time: usually fast, sometimes slow', 'dim'),
    ],

    scan: [
      R('SCANNING UNIVERSE...', 'dim'),
      R(''),
      R(`SECTORS DETECTED: ${REGIONS.length}`, 'hi'),
      ...REGIONS.map(r => R(`  ${r.designation.padEnd(10)} ${r.label.padEnd(14)} ${r.objects.length} objects`)),
      R(''),
      R(`TOTAL OBJECTS: ${getAllObjects().length}`, 'cy'),
      R(`DISCOVERED: ${discoveredIds.length} / ${getAllObjects().length}`),
      R(`UNDISCOVERED: ${getAllObjects().length - discoveredIds.length}`),
      R(''),
      R('ANOMALIES: present · WORMHOLES: sealed · COMETS: active', 'dim'),
    ],

    status: [
      R('UNIVERSE STATUS REPORT', 'hi'),
      R('────────────────────────'),
      R('SECTOR 01-A  PROJECTS      ■ ONLINE'),
      R('SECTOR 02-B  RUNNING       ■ ONLINE'),
      R('SECTOR 03-Ω  ARCHIVES      ▲ DEGRADED — database fault detected'),
      R('SECTOR 04-Δ  EXPLORE       ■ ONLINE'),
      R('SECTOR 05-Ψ  LAB           ▲ UNSTABLE — experimental cycles running'),
      R('SECTOR 06-∅  UNMAPPED      ▲ UNVERIFIED — signal leak detected'),
      R('ORIGIN       TE-∅          ■ NOMINAL'),
      R(''),
      R('COMET NETWORK: active · SIGNAL RELAY: broadcasting', 'dim'),
      R('WORMHOLE ARCHIVE-DEEP: sealed · requires 6 discoveries', 'dim'),
    ],

    weather: [R(VOID_READOUTS[Math.floor(Math.random() * VOID_READOUTS.length)], 'cy')],

    time: [
      R('CURRENT TIME', 'hi'),
      R('────────────────────────'),
      R(`  Mountain (MST/MDT)  ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/Denver', hour12: true })}`, 'cy'),
      R(`  Eastern   (EST/EDT)  ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true })}`),
      R(`  Pacific   (PST/PDT)  ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour12: true })}`),
      R(`  UTC                  ${new Date().toUTCString().split(' ').slice(4,5).join('')}`),
    ],

    music: [
      R('INTERCEPTED TRANSMISSIONS', 'hi'),
      R('────────────────────────'),
      R(INTERCEPTED_TRACKS[Math.floor(Math.random() * INTERCEPTED_TRACKS.length)], 'cy'),
      R(''),
      R('← source frequency drifting · check Digger for details', 'dim'),
    ],

    fortune: [R(ARCHIVE_RECORDS[Math.floor(Math.random() * ARCHIVE_RECORDS.length)], 'cy')],

    ascii: ASCII_TYLER.trim().split('\n').map(l => R(l, 'hi')),

    ls: [
      R('SECTORS:', 'hi'),
      ...REGIONS.map(r => R(`  ${r.designation.padEnd(10)} ${r.label}   →  ${r.id}/`)),
    ],

    pwd: [R('/universe/tyler-emdur/website', 'cy')],

    whoami: [
      R('visitor · unclassified · access-level-0', 'cy'),
      R(''),
      R('subject: unknown', 'dim'),
      R('entry vector: browser', 'dim'),
      R('threat level: minimal', 'dim'),
    ],

    uname: [R('Universe-OS 0.1.0 (tyler-emdur) GLSL/WebGL arm64 NextJS', 'cy')],

    uptime: [
      R(`uptime: ${Math.floor(Date.now() / 86400000)} days since epoch`, 'cy'),
      R('load average: 0.42, 0.38, 0.35', 'dim'),
    ],

    ps: PROCESSES.map(l => R(l, l.includes('terminal') ? 'cy' : undefined)),

    top: [
      R('UNIVERSE PROCESSES (sorted by interestingness)', 'hi'),
      R(''),
      ...PROCESSES.map(l => R(l)),
      R(''),
      R('[q] to stop watching, but there is no q', 'dim'),
    ],

    sudo: [R('ACCESS PRIVILEGE VIOLATION // ACTION LOGGED', 'er')],

    vi:   [R('ERROR: WRITE PRIVILEGE DENIED', 'er'), R('Terminal is in read-only archive mode.', 'dim')],
    vim:  [R('ERROR: WRITE PRIVILEGE DENIED', 'er'), R('Terminal is in read-only archive mode.', 'dim')],
    emacs:[R('ERROR: EXECUTE PRIVILEGE DENIED', 'er')],
    nano: [R('ERROR: WRITE PRIVILEGE DENIED', 'er')],

    exit: [R('press ESC to close terminal overlay.', 'dim')],

    meow:   [R('INTERCEPT // Unresolved audio pattern detected: "meow"', 'cy')],
    hello:  [R('RECEPTION ACKNOWLEDGED', 'hi')],
    hi:     [R('RECEPTION ACKNOWLEDGED', 'hi')],
    hey:    [R('RECEPTION ACKNOWLEDGED', 'hi')],
    ping:   [R('pong.', 'cy'), R('ping-trip: 0.12ms (local origin loopback)', 'dim')],
    yes:    [R('input logged.', 'dim')],
    no:     [R('input logged.', 'dim')],
    maybe:  [R('indifference registered.', 'dim')],

    cowsay: [
      R('ERROR: GRAPHIC GENERATOR OFFLINE', 'er'),
      R('Unsanctioned telemetry detected at Sector 06-∅.', 'dim'),
    ],

    date: [R(new Date().toString(), 'cy')],

    echo: [R('ERROR: RECURSIVE ECHO BLOCKED', 'er')],

    'git log': [
      R('commit 7f3a291  (HEAD -> main, origin/main)', 'hi'),
      R('Author: Tyler Emdur <tyler@tyleremdur.com>'),
      R('Date:   ' + new Date().toDateString()),
      R(''),
      R('    restructure coordinate bounds and cataloging rules'),
      R(''),
      R('commit 1c8e044'),
      R('    integrate signal concourse and cartography grids'),
      R(''),
      R('commit 2b91fa8'),
      R('    universe core v0.1 — initialize sector sync'),
      R(''),
      R('commit 0000001'),
      R('    init archive database --blank grid', 'dim'),
    ],

    'git blame': [
      R('operator: tyler-emdur (2026)', 'cy'),
    ],

    'npm install': [
      R('ERROR: WRITE PERMISSION DENIED -- lockfile is read-only', 'er'),
    ],

    'brew install': [
      R('ERROR: ACCESS LEVEL 0 IS NOT AUTHORIZED TO INSTALL PACKAGE ARTIFACTS', 'er'),
    ],

    python: [
      R('Python 3.12.0 (restricted execution environment)', 'dim'),
      R('>>> import tyler', 'cy'),
      R('>>> tyler.status()', 'cy'),
      R("'operational'", 'hi'),
    ],

    node: [
      R('Welcome to Node.js v22.0.0 (sandboxed)', 'dim'),
      R('> require("./universe")', 'cy'),
      R('{ status: "active", sectors: 6, unmapped: 1 }', 'hi'),
    ],

    decode: [
      R('DECODING SECURE HEADER...', 'dim'),
      R(''),
      R('T·Y·L·E·R ·/· E·M·D·U·R', 'cy'),
      R(''),
      R('01010100 01111001 01101100 01100101 01110010', 'dim'),
      R('01000101 01101101 01100100 01110101 01110010', 'dim'),
      R(''),
      R('Header decrypted. System identity: OPERATOR.', 'cy'),
    ],

    map: [
      R('UNIVERSE MAP (schematic)', 'hi'),
      R(''),
      R('               [LAB]', 'pk'),
      R('                 |'),
      R('     [ARCHIVES] [TE-∅] [PROJECTS]'),
      R('                 |'),
      R('              [EXPLORE]'),
      R('                 |'),
      R('              [RUNNING]'),
      R('    [SECTOR 06-∅]', 'dim'),
      R(''),
      R('drag map to pan · scroll to zoom', 'dim'),
    ],

    unlocked: getAllObjects().filter(o => discoveredIds.includes(o.id)).length === 0
      ? [R('no telemetry logged yet.', 'er'), R('explore coordinate nodes.', 'dim')]
      : [
          R(`DISCOVERED TELEMETRY (${getAllObjects().filter(o => discoveredIds.includes(o.id)).length}):`, 'hi'),
          ...getAllObjects()
            .filter(o => discoveredIds.includes(o.id))
            .map(o => R(`  · ${o.label}`, 'cy')),
        ],

    secret: [
      R('SURVEY ANOMALIES LOG:', 'cy'),
      R(''),
      R('  1. Spend 90 seconds observing SECTOR 04-Δ to unlock beacon.'),
      R('  2. Search coordinates [-2500, 1800, -1200] for gravitational null-void.'),
      R('  3. Sector 06-∅ remains hidden at coordinates [-2400, -1800, 500].'),
    ],

    morse: null,

    hex: null,
  }
}

type Commands = ReturnType<typeof buildCommands>

export default function HiddenTerminal() {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState<Line[]>([{ text: 'UNIVERSE OS v0.1 · type "help" for commands', cls: 'dim' }])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { flyTo, discoveredIds } = useUniverseStore()

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

  const push = useCallback((...newLines: Line[]) => {
    setLines(prev => [...prev, ...newLines])
  }, [])

  const exec = useCallback((raw: string) => {
    const cmd = raw.trim().toLowerCase()
    setHistory(h => [raw, ...h.slice(0, 49)])
    setHistIdx(-1)

    const echo: Line = { text: `> ${raw}`, cls: 'prompt' }

    if (!cmd) { setLines(prev => [...prev, echo]); return }
    if (cmd === 'clear') { setLines([]); return }

    const cmds = buildCommands(flyTo, discoveredIds)

    if (cmd.startsWith('goto ')) {
      const target = cmd.slice(5).trim()
      const region = REGIONS.find(r => r.label.toLowerCase() === target || r.id === target)
      if (region) {
        flyTo([region.position[0], region.position[1], 300])
        setLines(prev => [...prev, echo,
          { text: `AUTOPILOT ENGAGED → ${region.label}`, cls: 'hi' },
          { text: `coordinates: ${region.position[0].toFixed(0)} / ${region.position[1].toFixed(0)}`, cls: 'dim' },
        ])
      } else {
        setLines(prev => [...prev, echo,
          { text: `SECTOR NOT FOUND: "${target}"`, cls: 'er' },
          { text: 'sectors: projects | running | archives | explore | lab', cls: 'dim' },
        ])
      }
      return
    }

    if (cmd.startsWith('morse ')) {
      const text = raw.slice(6).toUpperCase()
      const encoded = text.split('').map(c => MORSE[c] ?? '?').join('  ')
      setLines(prev => [...prev, echo,
        { text: 'MORSE ENCODE:', cls: 'hi' },
        { text: encoded, cls: 'cy' },
      ])
      return
    }

    if (cmd.startsWith('hex ')) {
      const text = raw.slice(4)
      const encoded = Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ')
      setLines(prev => [...prev, echo,
        { text: 'HEX ENCODE:', cls: 'hi' },
        { text: encoded, cls: 'cy' },
      ])
      return
    }

    if (cmd.startsWith('echo ')) {
      setLines(prev => [...prev, echo, { text: raw.slice(5), cls: 'cy' }])
      return
    }

    if (cmd === 'status') {
      const statusLines = [
        { text: `UNIVERSE STATUS · ${new Date().toLocaleTimeString()}`, cls: 'hi' },
        ...((cmds as any).status as Line[]),
      ]
      setLines(prev => [...prev, echo, ...statusLines])
      return
    }

    const result = (cmds as any)[cmd] as Line[] | null | undefined
    if (Array.isArray(result)) {
      setLines(prev => [...prev, echo, ...result])
    } else {
      setLines(prev => [...prev, echo,
        { text: `command not found: ${cmd}`, cls: 'er' },
        { text: 'type "help" to see known commands', cls: 'dim' },
      ])
    }
  }, [flyTo, discoveredIds])

  const clsColor = (cls?: string) => {
    switch (cls) {
      case 'hi':     return 'rgba(202,255,0,0.9)'
      case 'cy':     return 'rgba(0,255,234,0.85)'
      case 'pk':     return 'rgba(255,45,120,0.85)'
      case 'er':     return '#FF5F57'
      case 'dim':    return 'rgba(255,255,255,0.22)'
      case 'prompt': return 'rgba(168,85,247,0.8)'
      default:       return 'rgba(255,255,255,0.55)'
    }
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
      width: 'min(680px, 92vw)', zIndex: 200,
      background: 'rgba(0,0,8,0.96)', border: '1px solid rgba(168,85,247,0.28)',
      backdropFilter: 'blur(16px)', fontFamily: 'var(--font-mono)',
      boxShadow: '0 0 60px rgba(168,85,247,0.12), 0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(168,85,247,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(168,85,247,0.04)' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FEBC2E' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28C840' }} />
          <span style={{ marginLeft: 8, fontSize: 8, letterSpacing: '0.2em', color: 'rgba(168,85,247,0.6)' }}>UNIVERSE TERMINAL — tyler@emdur</span>
        </div>
        <button onClick={() => setOpen(false)} style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', cursor: 'none', background: 'none', border: 'none' }}>ESC ×</button>
      </div>

      <div style={{ height: 240, overflowY: 'auto', padding: '10px 14px', fontSize: 10, lineHeight: 1.9, scrollbarWidth: 'none' }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: clsColor(l.cls), fontFamily: 'var(--font-mono)', whiteSpace: 'pre' }}>{l.text}</div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(168,85,247,0.08)', display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)' }}>
        <span style={{ color: 'rgba(168,85,247,0.7)', fontSize: 10 }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { exec(input); setInput('') }
            if (e.key === 'ArrowUp') {
              const h = history[histIdx + 1]
              if (h) { setInput(h); setHistIdx(i => i + 1) }
            }
            if (e.key === 'ArrowDown') {
              const h = history[histIdx - 1]
              setInput(h ?? '')
              setHistIdx(i => Math.max(-1, i - 1))
            }
            if (e.key === 'Tab') {
              e.preventDefault()
              const cmds = buildCommands(flyTo, discoveredIds)
              const partial = input.toLowerCase()
              const match = Object.keys(cmds).find(k => k.startsWith(partial) && k !== partial)
              if (match) setInput(match)
            }
          }}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: '0.04em',
            fontFamily: 'var(--font-mono)', cursor: 'none',
          }}
          placeholder="type a command... (TAB to autocomplete)"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
