'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useUniverseStore, REGIONS, getAllObjects } from '@/lib/universe-store'
import { IDENTITY } from '@/lib/identity'
import { useSiteCommits, type SiteCommit } from '@/hooks/use-site-commits'
import { useEnvironment, type Environment } from '@/lib/environment'

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

// `PROCESSES` and `INTERCEPTED_TRACKS` used to live here.
//
// The first was a twelve-line `ps` with invented CPU times, one of them
// `(Math.random()*100).toFixed(2)` — so the shell's own process time changed
// every single render. The second was seven intercepted radio transmissions at
// made-up frequencies ("FREQ: 94.2MHz — Khruangbin"), captured by nothing, over
// a line about the source frequency drifting. Nobody intercepted anything.
//
// `ps` is built from the store now, so its numbers are the survey's real ones;
// `music` points at the two worlds that genuinely make sound.

type Line = { text: string; cls?: string }

function buildCommands(
  flyTo: (pos: [number,number,number]) => void,
  discoveredIds: string[],
  commits: SiteCommit[] | null,
  env: Environment,
) {
  const R = (text: string, cls?: string): Line => ({ text, cls })

  // `scan` and `status` used to be two commands over the same facts — one
  // counting objects, one printing six hardcoded sector states with three
  // invented faults among them. One readout, built from the store, under both
  // names, because a shell having an alias is normal and a shell having two
  // commands that disagree about the same thing is not.
  const all = getAllObjects()
  const visibleNow = all.filter(o => useUniverseStore.getState().isVisible(o)).length
  const survey: Line[] = [
    R('THE SURVEY', 'hi'),
    R('────────────────────────────────────────'),
    ...REGIONS.map(r => {
      const seen = r.objects.filter(o => discoveredIds.includes(o.id)).length
      return R(`  ${r.designation.padEnd(26)} ${seen}/${r.objects.length} opened`)
    }),
    R(''),
    R(`  ${visibleNow} of ${all.length} objects have surfaced so far.`, 'cy'),
    R(`  ${discoveredIds.length} opened. the rest arrive on their own, or once you have opened enough.`, 'dim'),
  ]

  // ── ps ─────────────────────────────────────────────────────────────────────
  // A process table with no fake numbers in it. The probes are the real
  // regions, their counts are the store's, and the only figure that moves is
  // the shell's own age — which is the real length of this visit.
  const held = Math.max(0, Math.round((Date.now() - useUniverseStore.getState().visitStartTime) / 1000))
  const survey_ps: Line[] = [
    R('PID  STAT  TIME      COMMAND', 'dim'),
    R(' 001  R     —         universe-scene (webgl)'),
    R(' 002  R     —         cartography-layer'),
    ...REGIONS.map((r, i) => {
      const seen = r.objects.filter(o => discoveredIds.includes(o.id)).length
      return R(` ${String(i + 3).padStart(3, '0')}  S     —         region-probe [${r.id}] · ${seen}/${r.objects.length} opened`)
    }),
    R(` ${String(REGIONS.length + 3).padStart(3, '0')}  S+    ${`${Math.floor(held / 60)}:${String(held % 60).padStart(2, '0')}`.padEnd(9)} terminal.sh`, 'cy'),
  ]

  return {
    help: [
      R('── KNOWN COMMANDS ─────────────────────────────', 'dim'),
      R('  about        who is this'),
      R('  runs         race log'),
      R('  contact      how to reach'),
      R('  goto [name]  navigate to a sector'),
      R('  status       what is on the map, and what you have opened'),
      R('  weather      the weather in boulder'),
      R('  time         current time, multiple zones'),
      R('  music        what makes sound here, and where'),
      R('  ascii        banner'),
      R('  ls           list sectors'),
      R('  pwd          current path'),
      R('  clear        wipe terminal'),
      R(''),
      R('other commands exist. most are hidden.', 'dim'),
    ],

    about: [
      R('T. EMDUR', 'hi'),
      R('────────────────────────'),
      R('one person, in boulder, colorado.'),
      R(''),
      R('this site is eleven rooms and a map of them.'),
      R('nothing on it was commissioned by anyone.'),
      R(''),
      R(`the whole thing is in one repo: ${IDENTITY.repoSlug}`, 'dim'),
      R('type "git log" to see what changed most recently.', 'dim'),
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
      R(`email    ${IDENTITY.email}`, 'cy'),
      R(`github   ${IDENTITY.githubLabel}`, 'cy'),
      R(`site     ${IDENTITY.domain}`),
      R(''),
      R('response time: usually fast, sometimes slow', 'dim'),
    ],

    scan: survey,

    status: survey,

    weather: env.weather
      ? [
          R('BOULDER, COLORADO', 'hi'),
          R('────────────────────────'),
          R(`  ${env.weather.tempF}°F · ${env.weather.label}`, 'cy'),
          R(`  ${env.clock} ${env.meridiem} · sun ${env.sunAltitude >= 0 ? 'up' : 'down'}`),
          R(''),
          R('same sky in all eleven worlds.', 'dim'),
        ]
      : [R('no reading yet.', 'dim')],

    time: [
      R('CURRENT TIME', 'hi'),
      R('────────────────────────'),
      R(`  Mountain (MST/MDT)  ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/Denver', hour12: true })}`, 'cy'),
      R(`  Eastern   (EST/EDT)  ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true })}`),
      R(`  Pacific   (PST/PDT)  ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour12: true })}`),
      R(`  UTC                  ${new Date().toUTCString().split(' ').slice(4,5).join('')}`),
    ],

    music: [
      R('AUDIO', 'hi'),
      R('────────────────────────'),
      R('nothing plays in the hub.', 'cy'),
      R(''),
      R('two worlds make sound, and both of them are live'),
      R('broadcasts rather than files — the garage carries'),
      R('internet radio, the dial carries city television.'),
      R(''),
      R('neither one starts until you ask it to.', 'dim'),
    ],

    ascii: ASCII_TYLER.trim().split('\n').map(l => R(l, 'hi')),

    ls: [
      R('SECTORS:', 'hi'),
      ...REGIONS.map(r => R(`  ${r.designation.padEnd(26)} →  ${r.id}/`)),
    ],

    pwd: [R('/universe/tyler-emdur/website', 'cy')],

    whoami: [
      R('a visitor, in a browser.', 'cy'),
      R(''),
      R(`you have opened ${discoveredIds.length} of ${getAllObjects().length} objects on this map.`, 'dim'),
      R('that number is kept in your own browser and nowhere else.', 'dim'),
    ],

    uname: [R('Universe-OS 0.1.0 (tyler-emdur) GLSL/WebGL arm64 NextJS', 'cy')],

    // Was "days since epoch" and an invented load average. The store has been
    // holding the real start of this visit the whole time.
    uptime: (() => {
      const secs = Math.max(0, Math.round((Date.now() - useUniverseStore.getState().visitStartTime) / 1000))
      const mins = Math.floor(secs / 60)
      return [
        R(`you have been in the hub for ${mins > 0 ? `${mins}m ` : ''}${secs % 60}s.`, 'cy'),
        R('objects keep surfacing the longer you stay.', 'dim'),
      ]
    })(),

    ps: survey_ps,

    top: [
      R('UNIVERSE PROCESSES', 'hi'),
      R(''),
      ...survey_ps,
      R(''),
      R('[q] to stop watching, but there is no q', 'dim'),
    ],

    // Said "ACTION LOGGED". Nothing is logged; there is no server here and
    // nothing you type leaves your browser. The refusal is funnier when it is
    // also true.
    sudo: [
      R('ACCESS PRIVILEGE VIOLATION', 'er'),
      R('nothing was logged. there is nowhere to log it.', 'dim'),
    ],

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
      R('there was never a cow on this disk.', 'dim'),
    ],

    date: [R(new Date().toString(), 'cy')],

    echo: [R('ERROR: RECURSIVE ECHO BLOCKED', 'er')],

    // The repository this universe is served from, read live. It used to print
    // four invented commits while the real feed was already being fetched two
    // files away — a terminal claiming to show a log has to actually show one.
    'git log': commits?.length
      ? [
          ...commits.slice(0, 4).flatMap((c, i) => [
            R(`commit ${c.sha.slice(0, 7)}${i === 0 ? '  (HEAD -> main, origin/main)' : ''}`, i === 0 ? 'hi' : undefined),
            ...(i === 0 ? [R(`Author: ${IDENTITY.name} <${IDENTITY.email}>`)] : []),
            R(`Date:   ${c.isoDate}`),
            R(''),
            R(`    ${c.message}`),
            R(''),
          ]),
          R(`${IDENTITY.repoSlug} — live`, 'dim'),
        ]
      : [R('fatal: unable to reach origin. the log is out there.', 'er')],

    'git blame': [
      R(`operator: ${IDENTITY.handle} (${new Date().getFullYear()})`, 'cy'),
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
      R('     [ARCHIVES] [TE-∅] [INDEX]   '),
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

    // 88.7 MHz is stamped on the machine's README, the broadcast dial, the
    // garage radio and the carrier in the endpoint — five worlds carrying the
    // same number and nothing that answers when you type it. Not in `help`;
    // it is for whoever noticed.
    '88.7': [
      R('88.7 MHz', 'hi'),
      R('────────────────────────'),
      R('carrier present. 50 watts, out of a closet in boulder.', 'cy'),
      R(''),
      R('SRVHOST.EXE is what is on it. it serves this site.'),
      R('the dial in BROADCST.WLD stops here too — channel 88,'),
      R('which is the one that is not a real city.'),
      R(''),
      R('type "goto lab" for the monitor that watches it.', 'dim'),
    ],
    morse: null,

    hex: null,
  }
}

type Commands = ReturnType<typeof buildCommands>

export default function HiddenTerminal() {
  // `git log` prints this repo's actual history, not a story about it.
  const { commits } = useSiteCommits(4)
  // Real Boulder weather, for a command that used to invent it.
  const env = useEnvironment()
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

    const cmds = buildCommands(flyTo, discoveredIds, commits, env)

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
          { text: 'sectors: index | running | archives | explore | lab', cls: 'dim' },
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

    const key = /^88\.?7\s*(mhz)?$/.test(cmd) ? '88.7' : cmd
    const result = (cmds as any)[key] as Line[] | null | undefined
    if (Array.isArray(result)) {
      setLines(prev => [...prev, echo, ...result])
    } else {
      setLines(prev => [...prev, echo,
        { text: `command not found: ${cmd}`, cls: 'er' },
        { text: 'type "help" to see known commands', cls: 'dim' },
      ])
    }
    // `env` belongs here: the weather lands a second or two after mount, and
    // without it this callback keeps the first render's environment forever —
    // the `weather` command would report the station unreachable for the whole
    // visit while the request had already come back 200.
  }, [flyTo, discoveredIds, commits, env])

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
              const cmds = buildCommands(flyTo, discoveredIds, commits, env)
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
