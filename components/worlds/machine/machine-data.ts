// The Machine — file system contents for the EMDUR-486.
// Everything in here is real: real projects, real dead experiments, real notes.

export interface MachineExperiment {
  id: string
  title: string
  status: 'shelved' | 'abandoned' | 'revisit someday'
  note: string
}

export const EXPERIMENTS: MachineExperiment[] = [
  { id: 'exp1', title: 'font-that-breathes.css', status: 'shelved', note: 'Tried making body text subtly expand and contract with a sine wave tied to scroll velocity. Nauseating at anything above 40wpm. Kept the keyframes, deleted the idea.' },
  { id: 'exp2', title: 'markov-commit-messages.py', status: 'abandoned', note: 'Trained a tiny Markov chain on my own commit history to auto-generate commit messages. It mostly produced "fix fix bug the the thing." Accurate, unfortunately.' },
  { id: 'exp3', title: 'terrain-from-strava.js', status: 'revisit someday', note: 'Idea: turn a GPX file into a 3D relief you can fly through. Got as far as a flat, ugly triangle mesh before getting distracted by Digger. UPDATE: this one actually shipped. See world 2.' },
  { id: 'exp4', title: 'inbox-zero-simulator', status: 'abandoned', note: 'A game where you sort a fake inbox against the clock. Realized halfway through that I was building a worse version of my actual job.' },
  { id: 'exp5', title: 'css-only-solar-system.html', status: 'shelved', note: 'No JS, pure CSS animation, all 8 planets plus Pluto out of spite. Runs at 6fps on anything older than 2 years old. Beautiful and useless.' },
  { id: 'exp6', title: 'sleep-data-to-midi.py', status: 'revisit someday', note: 'Mapped a week of sleep-tracker data to a MIDI sequence. The result sounded like a fax machine having a bad week. There is something here. Not sure what.' },
  { id: 'exp7', title: 'unfinished-chess-engine', status: 'abandoned', note: 'Got minimax working to depth 3 and then remembered how much I do not know about chess. The bot still loses to the tutorial mode.' },
  { id: 'exp8', title: 'this-website-v1', status: 'shelved', note: 'A much plainer version of this exact site. One page, one font, a list of links. It worked fine. That was somehow not the point. The original INDEX.HTM is still on this disk — try C:\\WEBSITE.V1\\' },
]

export const README_TXT = [
  'README.TXT — last modified a while ago',
  '',
  'This is (a reconstruction of) the machine where all of it started.',
  '',
  'Version 1 of tyleremdur.com was written on a computer a lot like',
  'this one: one page, one font, a list of links. The site you are',
  'standing in grew out of that page the way a house grows out of',
  'a tent.',
  '',
  'Poke around. DIR is a good place to start. Some sectors were',
  'damaged and are still being recovered — come back later and',
  'more of the disk will be readable.',
  '',
  '— T. EMDUR, BOULDER CO',
]

// Recovered sectors: unreadable on early boots, heal over repeat visits.
// Sector N becomes readable once the machine has been booted > N times.
export const RECOVERED_SECTORS = [
  {
    file: 'SECTOR_001.DAT',
    content: [
      'recovered 2022-03-xx · fragment of a note-to-self',
      '',
      'stayed up until 3am making something nobody asked for.',
      'showed it to one person. they said "wait, how did you do that?"',
      'that was enough.',
    ],
  },
  {
    file: 'SECTOR_002.DAT',
    content: [
      'recovered · deploy log, digger v1.0',
      '',
      '2024-11-09 23:47 · git push origin main · deploy complete',
      '47 objects in universe · 3 users online · one of them was me',
    ],
  },
  {
    file: 'SECTOR_003.DAT',
    content: [
      'recovered · last readable entry',
      '',
      'a project is real the moment you can\'t explain it to someone',
      'who isn\'t interested. before that, it\'s just an idea.',
      'most ideas die in transit. this one didn\'t.',
    ],
  },
]

export function garbleLine(line: string, seed: number): string {
  const GLYPHS = '▓▒░█▄▀■□¦╬╫'
  let s = seed
  return line
    .split('')
    .map(ch => {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      if (ch === ' ' && s % 4 === 0) return ' '
      return GLYPHS[s % GLYPHS.length]
    })
    .join('')
}

export const WEBSITE_V1_LINKS = [
  { label: 'digger', href: 'https://digger-five.vercel.app' },
  { label: 'strava analytics', href: 'https://bhs-strava.vercel.app' },
  { label: 'github', href: 'https://github.com/tyler-emdur' },
  { label: 'email me', href: 'mailto:healthreinvented@gmail.com' },
]

export function getBootCount(): number {
  if (typeof window === 'undefined') return 0
  try { return parseInt(localStorage.getItem('machine_boots') ?? '0') || 0 } catch { return 0 }
}

export function recordBoot(): number {
  if (typeof window === 'undefined') return 1
  try {
    // Guard against double-count from StrictMode remounts / rapid re-entry:
    // a "boot" only counts if the last one was over a minute ago.
    const last = parseInt(localStorage.getItem('machine_boot_at') ?? '0') || 0
    if (Date.now() - last < 60000) return Math.max(1, getBootCount())
    const n = getBootCount() + 1
    localStorage.setItem('machine_boots', String(n))
    localStorage.setItem('machine_boot_at', String(Date.now()))
    return n
  } catch { return 1 }
}
