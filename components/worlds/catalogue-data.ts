export interface CatalogueEntry {
  id: string
  repos: string[]
  status: string
  summary: string
  rip: string
}

// A real, unsanitized audit of the actual repos on the actual laptop — not a
// highlight reel. The "rip" line is the honest read, kept as written.
export const CATALOGUE: CatalogueEntry[] = [
  {
    id: 'faraday',
    repos: ['faraday-lead-engine/', 'faraday-tools/'],
    status: 'Built, Never Shipped',
    summary: 'A fifteen-channel lead-gen engine — storm alerts, Reddit monitoring, permit tracking, outbound email — plus a separate demo site with a solar estimator, quote form, and hail map. Both for a real construction company.',
    rip: 'Two-thirds of the channels have never run once, gated behind API keys that were never added. Zero leads delivered, ever. Built the entire assembly line before checking whether one unit could roll off it — twice, in two separate repos.',
  },
  {
    id: 'digger',
    repos: ['digger/'],
    status: 'Shipped, Capped At One User',
    summary: 'Profiles Spotify taste and surfaces obscure artists through a Last.fm similarity graph walk. Real OAuth flow, working end to end.',
    rip: "Spotify manually allowlists every user and killed the recommendations endpoint for new apps. Didn't stop because the product failed — the platform walled off distribution after the build was already done.",
  },
  {
    id: 'running-data',
    repos: ['strava/', 'trackflation/'],
    status: 'Most Finished, Least Promoted',
    summary: 'An analytics dashboard with GPS-confirmed stop detection for accurate moving-time stats, and a single self-contained HTML file visualizing the speed revolution in high school running.',
    rip: 'This should sting a little. The thing built with the most discipline, paired with the thing built with the most technical confidence — and neither has gotten a fraction of the attention Faraday got.',
  },
  {
    id: 'hail',
    repos: ['hail-bot/', 'hail-map-website/'],
    status: 'Superseded',
    summary: 'A Discord bot alerting on hail events, and a Flask app mapping hail occurrence — both built before the Faraday engine grew its own storm-check channel.',
    rip: 'Work gets rebuilt inside the next bigger system instead of being finished and shipped on its own first. This is the second time that pattern shows up.',
  },
  {
    id: 'reps',
    repos: ['fashion-rep-tracker/', 'reps-tracker/'],
    status: 'Real Product, Wrong Hill',
    summary: 'A Chrome extension that saves items from a replica-goods marketplace with price filters, paired with a Next.js web catalog to browse what got saved.',
    rip: 'Technically the most complete product here — a narrow tool feeding a companion dashboard, one specific workflow, coordinated across two repos. The instinct is exactly right. The subject matter is the problem.',
  },
  {
    id: 'wildfire',
    repos: ['wildfire/'],
    status: 'Real ML, No Audience',
    summary: 'A wildfire risk predictor — a trained scikit-learn model fed by real-time weather data, with a React frontend.',
    rip: "Probably the most technically impressive single repo on this list — an actual trained model, not an API wrapper around one. No sign anyone but its author has ever opened it.",
  },
  {
    id: 'study-tools',
    repos: ['ap-practice/', 'regular-spanish-verb-conjugation/', 'mathibex.com/'],
    status: 'Same Problem, Built Three Times',
    summary: 'An AP exam platform with AI-graded free-response questions, a Spanish verb-conjugation trainer, and a math equation generator with its own domain.',
    rip: '"I need to study for a test," solved three separate times instead of consolidated once. The sprawl pattern shows up even at the smallest scale.',
  },
  {
    id: 'reps-not-flagships',
    repos: ['fit-maker/', 'space-shooter/', 'website/'],
    status: 'Reps, Not Flagships',
    summary: 'A weather-matched daily outfit generator, a small arcade shooter, and the personal site this catalogue lives inside.',
    rip: 'Fine as practice reps. Not load-bearing to the argument either way — some things get built just to stay in motion.',
  },
  {
    id: 'faraday-adjacent',
    repos: ['faraday-clock/', 'light/'],
    status: 'Local Only, Never Pushed',
    summary: 'An admin dashboard and a PDF-parsing tool, both Faraday-adjacent, both existing only on the laptop that built them.',
    rip: 'Five separate Faraday repos now, counting the lead engine and the order tool below. The relationship is real and it pays. The tooling around it keeps restarting instead of consolidating into one place.',
  },
  {
    id: 'loveland',
    repos: ['loveland/'],
    status: 'Never Committed, At All',
    summary: 'A site for a real small company, with uncommitted changes still sitting on top of the last local save.',
    rip: 'An entire project with zero version-control footprint. If the laptop dies, this goes with it — no five-minute decision has been made either way.',
  },
  {
    id: 'roof-order',
    repos: ['roof-order/'],
    status: 'Active Right Now',
    summary: 'A private materials-order tool for the same construction company — generates a PDF order document, its own deployment, its own small scope.',
    rip: 'Closer to a finished feature than anything else in this catalogue. Narrow, does one real task for a real business, and it was touched today — not resurrected, not planned, actually in progress.',
  },
  {
    id: 'tyleros',
    repos: ['tyleros/'],
    status: 'No Version Control, Ever',
    summary: 'A personal executive-assistant system — a full-text-search memory engine, a project and goal tracker, a planned morning-briefing mode, a global-hotkey command palette. Real architecture docs behind it.',
    rip: 'The same instinct behind the Faraday lead engine, built again for its own author — apparently without noticing it was the same idea twice. Also the single biggest risk in this entire catalogue: months of design and code with no backup at all.',
  },
]
