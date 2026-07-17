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
  'README.TXT — DO NOT TURN THIS MACHINE OFF',
  '',
  'This machine hosts tyleremdur.com.',
  '',
  'Not a copy. Not a mirror. The site you are standing in right now',
  'is served from this disk, out of a closet in Boulder, Colorado,',
  'on a carrier of 88.7 MHz. SRVHOST.EXE keeps it on the air.',
  '',
  'The worlds live in C:\\WORLDS\\ as .WLD files. Opening one loads',
  'it — the machine renders the world, and then you are in it.',
  '',
  'Some sectors were damaged in the outage and are still being',
  'recovered. Boot the machine again; more of the disk becomes',
  'readable each time.',
  '',
  'If you can read this file, you are already inside the server.',
  '',
  '— T. EMDUR, BOULDER CO',
]

// The .WLD files — every world on this site, as seen from the machine
// that serves them. Opening one really does take you there.
export interface WorldFile {
  file: string
  world: number
  size: string
  note: string
}

export const WORLD_FILES: WorldFile[] = [
  { file: 'SURFACE.WLD',  world: 0,  size: '12K',   note: 'the front door' },
  { file: 'UNIVERSE.WLD', world: 1,  size: '4,096K', note: 'the hub' },
  { file: 'TRACE.WLD',    world: 2,  size: '881K',  note: 'boulder, from above' },
  { file: 'BROADCST.WLD', world: 3,  size: '88K',   note: 'seven channels + one' },
  { file: 'MACHINE.WLD',  world: 5,  size: '486K',  note: 'this machine' },
  { file: 'GARAGE.WLD',   world: 6,  size: '124K',  note: '12:47 am, engine off' },
  { file: 'ENDPOINT.WLD', world: 7,  size: '1K',    note: 'signal terminus' },
  { file: 'ANSWERNG.WLD', world: 9,  size: '33K',   note: 'one new message' },
  { file: 'AISLE_14.WLD', world: 14, size: '???K',  note: "it doesn't end" },
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

// The Recycle Bin: files Tyler deleted that the disk refused to let go of.
// Emptying it does nothing — some things stay on the disk. (See FORMAT, README,
// and the EXPERIMENTS folder: "deleted, not gone.") The centerpiece is
// WORLD_04.WLD — 0 bytes, matching the gap the whole site keeps around it:
// the counter skips 4, the doors skip 4, the answering machine insists there
// has never been a world 4. And yet the socket is still on the disk.
export interface RecycledItem {
  file: string
  icon: string
  deleted: string   // fake, unresolved delete stamp
  body: string[]
}

export const RECYCLED: RecycledItem[] = [
  {
    file: 'WORLD_04.WLD', icon: '🌐', deleted: 'deleted ????-??-??',
    body: [
      'CANNOT RESTORE — CANNOT DELETE',
      '',
      "There's no world 4. There's never been a world 4.",
      'The counter skips it. The doors skip it. This disk skips it.',
      '',
      'And still: here it is. Zero bytes. Sitting in the bin since',
      'before the bin. Restore does nothing. Empty does nothing.',
      '',
      'Some worlds you never build. You just leave the socket wired',
      'and let people wonder what was supposed to plug in.',
    ],
  },
  {
    file: 'resume_2019.doc', icon: '📄', deleted: 'deleted, again',
    body: [
      'resume_2019.doc',
      '',
      'TYLER EMDUR — Boulder, CO — available upon request',
      '',
      'I keep dragging this to the bin. It keeps coming back on the',
      'next boot. A list of jobs is a true thing about a person and',
      'somehow the least interesting true thing.',
      '',
      'You are standing in the alternative. Close this. Go open a world.',
    ],
  },
  {
    file: 'cover_letter_FINAL_final_v4.doc', icon: '📄', deleted: 'deleted before sending',
    body: [
      'cover_letter_FINAL_final_v4.doc',
      '',
      'Dear Hiring Manager,',
      '',
      'I am writing to express my—',
      '',
      '[the rest of this file is blank.]',
      '[it was always going to be blank.]',
    ],
  },
  {
    file: 'the_next_big_thing.ppt', icon: '📊', deleted: 'deleted at slide 3',
    body: [
      'the_next_big_thing.ppt — 14 slides',
      '',
      'Slide 1 ....... THE NEXT BIG THING',
      'Slide 2 ....... (the problem)',
      'Slide 3 ....... (the bigger problem)',
      'Slides 4–13 ... [deleted]',
      'Slide 14 ...... THANK YOU',
      '',
      'Slides 4 through 13 were the entire idea. They are gone.',
      'This happens more often than anyone puts on a slide.',
    ],
  },
  {
    file: 'NOTES_TO_SELF.txt', icon: '🗒', deleted: 'deleted, ironically',
    body: [
      'note to self — undated',
      '',
      'stop starting new things.',
      '',
      '(deleted this note. immediately started three new things.',
      ' one of them was the recycle bin you are reading it inside of.)',
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
