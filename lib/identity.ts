// Every world is free to say who runs this place in its own voice — the retro
// surface shouts it in all caps, the terminal prints it lowercase, the contact
// world calls the email address a TRANSMIT channel. What none of them may do is
// disagree on the underlying facts. Three different email addresses across five
// screens doesn't read as layered fiction, it reads as an abandoned site with
// several owners. So the facts live here once, and the worlds style them.
//
// Rule of thumb when adding a world: if a string identifies the person rather
// than the place, it belongs in this file.

export const IDENTITY = {
  name: 'Tyler Emdur',
  handle: 'tyler-emdur',

  // One canonical inbox. Do not introduce a second one for a "more formal"
  // world — that's exactly the drift this file exists to prevent.
  email: 'tyleremdur@gmail.com',

  city: 'Boulder',
  region: 'Colorado',
  regionAbbr: 'CO',
  /** "Boulder, Colorado" — the long form, for prose and headings. */
  location: 'Boulder, Colorado',
  /** "Boulder, CO" — the short form, for dense readouts and tickers. */
  locationShort: 'Boulder, CO',
  /** Downtown Boulder, the origin the universe's coordinate system is built on. */
  coords: '40.0150°N 105.2705°W',

  domain: 'tyleremdur.com',
  github: 'https://github.com/tyler-emdur',
  githubLabel: 'github.com/tyler-emdur',
  repo: 'https://github.com/tyler-emdur/website',
  repoSlug: 'tyler-emdur/website',

  // The "what I do" facts, kept as atoms so each world can punctuate and order
  // them however its typography wants without inventing a new claim.
  role: 'Software engineer',
  doing: 'Builder of worlds',
} as const

export const MAILTO = `mailto:${IDENTITY.email}`

/** GitHub's commits endpoint for this repo. `n` is how many to pull back. */
export const commitsApi = (n: number) =>
  `https://api.github.com/repos/${IDENTITY.repoSlug}/commits?per_page=${n}`

// ---------------------------------------------------------------------------
// Last-updated
//
// This stamp is literal, not lore — it claims the site changed on a real date,
// so it has to be true. It used to come only from `git log -1` inlined at build
// time by next.config.ts, which meant the number froze at whenever the last
// production build happened and drifted further from reality every day nothing
// deployed. The live commit feed is now the primary source and this is only the
// fallback for when GitHub is unreachable.
//
// (World 5's machine says "last updated 2024" on purpose. That one is a museum
// piece — the v1 site as it was — and is deliberately exempt.)
// ---------------------------------------------------------------------------

export const BUILD_COMMIT_DATE = process.env.NEXT_PUBLIC_LAST_COMMIT_DATE || ''

/** "August 7, 2026" — the long form used in prose and panels. */
export function formatUpdated(input?: string | Date | null): string {
  const d = input ? new Date(input) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/** "08.07.26" — the compact form used in the commit list. */
export function formatUpdatedShort(input?: string | Date | null): string {
  const d = input ? new Date(input) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '.')
}
