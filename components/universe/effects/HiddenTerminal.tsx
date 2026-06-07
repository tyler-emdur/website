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

const FORTUNES = [
  'The best time to plant a tree was 20 years ago. The second best time is in this terminal.',
  'You have been in this universe for longer than the architects intended.',
  'Not all who wander are lost. Some are just zoomed in too far.',
  'The signal you are looking for is between the stars you already know.',
  'If you are reading this, you found the part that was not meant to be found.',
  'Elevation changes everything. So does zoom level.',
  'A wormhole is just a door that forgot which room it leads to.',
  'Some objects are only visible after enough time has passed. Keep looking.',
  'Error: fortune not found. This IS the fortune.',
  'Reduce, reuse, recurse.',
]

const WEATHER_PHRASES = [
  '⛅  partly cloudy, 62°F, Boulder, CO',
  '🌤  mostly clear, 58°F, Boulder, CO',
  '🌧  light rain, 49°F, Boulder, CO',
  '❄️  snow advisory, 31°F, Boulder, CO',
  '🌞  sunny and warm, 74°F, Boulder, CO',
  '💨  windy, 55°F, Boulder, CO — expect bad hair day',
]

const MUSIC_TRACKS = [
  'Khruangbin — People Everywhere (Still Alive)',
  'Tame Impala — Eventually',
  'Mac DeMarco — Chamber of Reflection',
  'FKJ — Ylang Ylang',
  'Hiatus Kaiyote — Laputa',
  'Unknown Mortal Orchestra — Multi-Love',
  'Bon Iver — Holocene',
  'Fleet Foxes — White Winter Hymnal',
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
      R('  weather      local conditions'),
      R('  time         current time, multiple zones'),
      R('  music        last known listening'),
      R('  fortune      unsolicited wisdom'),
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
      R('ANOMALIES: present · WORMHOLES: sealed · COMETS: in transit', 'dim'),
    ],

    status: [
      R('UNIVERSE STATUS REPORT', 'hi'),
      R('────────────────────────'),
      R('SECTOR 01-A  PROJECTS      ■ ONLINE'),
      R('SECTOR 02-B  RUNNING       ■ ONLINE'),
      R('SECTOR 03-Ω  ARCHIVES      ▲ DEGRADED — some records corrupted'),
      R('SECTOR 04-Δ  EXPLORE       ■ ONLINE'),
      R('SECTOR 05-Ψ  LAB           ▲ UNSTABLE — experiments in progress'),
      R('ORIGIN       TE-∅          ■ NOMINAL'),
      R(''),
      R('COMET NETWORK: active · SIGNAL RELAY: broadcasting', 'dim'),
      R('WORMHOLE ARCHIVE-DEEP: sealed · requires 6 discoveries', 'dim'),
    ],

    weather: [R(WEATHER_PHRASES[Math.floor(Math.random() * WEATHER_PHRASES.length)], 'cy')],

    time: [
      R('CURRENT TIME', 'hi'),
      R('────────────────────────'),
      R(`  Mountain (MST/MDT)  ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/Denver', hour12: true })}`, 'cy'),
      R(`  Eastern   (EST/EDT)  ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true })}`),
      R(`  Pacific   (PST/PDT)  ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour12: true })}`),
      R(`  UTC                  ${new Date().toUTCString().split(' ').slice(4,5).join('')}`),
    ],

    music: [
      R('LAST KNOWN LISTENING', 'hi'),
      R('────────────────────────'),
      R(MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)], 'cy'),
      R(''),
      R('← taste varies. check Digger for the real picture.', 'dim'),
    ],

    fortune: [R(FORTUNES[Math.floor(Math.random() * FORTUNES.length)], 'cy')],

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

    sudo: [R('no.', 'er')],

    vi:   [R('you opened vim. there is no :q here.', 'er'), R('there is no escape.', 'er')],
    vim:  [R('you opened vim. there is no :q here.', 'er'), R('there is no escape.', 'er')],
    emacs:[R('emacs started. it will finish eventually.', 'dim'), R('(probably)', 'dim')],
    nano: [R('this is not nano. this is a universe.', 'dim')],

    exit: [R('there is no exit.', 'er'), R('press ESC to close the terminal. not the universe.', 'dim')],

    meow:   [R('🐈', 'hi'), R('yes.', 'cy')],
    hello:  [R('hello.', 'hi')],
    hi:     [R('hey.', 'hi')],
    hey:    [R('hi.', 'hi')],
    ping:   [R('pong.', 'cy'), R('latency: 0ms (local universe)', 'dim')],
    yes:    [R('noted.', 'dim')],
    no:     [R('also noted.', 'dim')],
    maybe:  [R('classic.', 'dim')],

    cowsay: [
      R('  _____________', 'dim'),
      R(' < moo. explore. >', 'cy'),
      R('  -------------', 'dim'),
      R('        \\   ^__^', 'dim'),
      R('         \\  (oo)\\_______', 'dim'),
      R('            (__)\\       )\\/\\', 'dim'),
      R('                ||----w |', 'dim'),
      R('                ||     ||', 'dim'),
    ],

    date: [R(new Date().toString(), 'cy')],

    echo: [R('I am not a parrot.', 'dim')],

    'git log': [
      R('commit 7f3a291  (HEAD -> main, origin/main)', 'hi'),
      R('Author: Tyler Emdur <tyler@tyleremdur.com>'),
      R('Date:   ' + new Date().toDateString()),
      R(''),
      R('    make it weirder'),
      R(''),
      R('commit 1c8e044'),
      R('    add comet system + fix signal renderers'),
      R(''),
      R('commit 2b91fa8'),
      R('    universe v0.1 — five sectors, discovery system'),
      R(''),
      R('commit 0000001'),
      R('    init — blank canvas, uncertain future', 'dim'),
    ],

    'git blame': [
      R('tyler (2026) all of it', 'cy'),
    ],

    'npm install': [
      R('added 47,823 packages, and audited 47,824 packages in 3s', 'dim'),
      R(''),
      R('3 packages are looking for funding', 'dim'),
      R('  run `npm fund` for details', 'dim'),
      R(''),
      R('found 0 vulnerabilities', 'cy'),
    ],

    'brew install': [
      R('==> Downloading universe from apple silicon', 'dim'),
      R('Already poured: universe (HEAD)', 'cy'),
    ],

    python: [
      R('Python 3.12.0 (universe build)', 'dim'),
      R('>>> import tyler', 'cy'),
      R('>>> tyler.hello()', 'cy'),
      R("'hey'", 'hi'),
    ],

    node: [
      R('Welcome to Node.js v22.0.0.', 'dim'),
      R('Type ".help" for more information.', 'dim'),
      R('> require("./universe")', 'cy'),
      R('{ version: "0.1.0", sectors: 5, wormholes: 2 }', 'hi'),
    ],

    decode: [
      R('DECODING...', 'dim'),
      R(''),
      R('T·Y·L·E·R ·/· E·M·D·U·R', 'cy'),
      R(''),
      R('01010100 01111001 01101100 01100101 01110010', 'dim'),
      R('01000101 01101101 01100100 01110101 01110010', 'dim'),
      R(''),
      R('nothing hidden here. or maybe everything is.', 'dim'),
    ],

    map: [
      R('UNIVERSE MAP (schematic)', 'hi'),
      R(''),
      R('          [LAB]', 'pk'),
      R('            |'),
      R('[ARCHIVES] [TE-∅] [PROJECTS]'),
      R('            |'),
      R('         [EXPLORE]'),
      R('            |'),
      R('         [RUNNING]'),
      R(''),
      R('drag to navigate · scroll to zoom', 'dim'),
    ],

    unlocked: getAllObjects().filter(o => discoveredIds.includes(o.id)).length === 0
      ? [R('nothing discovered yet.', 'er'), R('go click things.', 'dim')]
      : [
          R(`DISCOVERED (${getAllObjects().filter(o => discoveredIds.includes(o.id)).length}):`, 'hi'),
          ...getAllObjects()
            .filter(o => discoveredIds.includes(o.id))
            .map(o => R(`  · ${o.label}`, 'cy')),
        ],

    secret: [
      R('you found the help text for the secret command.', 'cy'),
      R(''),
      R('try: ↑↑↓↓←→←→BA', 'hi'),
      R('or: keep exploring until hidden objects appear.', 'dim'),
      R('or: spend 2 minutes in explore sector.', 'dim'),
      R('or: discover 8 objects to unlock lab-quantum.', 'dim'),
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
