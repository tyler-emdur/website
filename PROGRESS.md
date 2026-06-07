# tyleremdur.com — Build Log

## What This Is

A portfolio that refuses to be one. Structured as an ARG (alternate reality game) where the work, bio, and contact information are distributed across nine distinct "worlds" — each with its own visual language, physics, and way of moving between them. The site is navigable without a map, but a map would help.

---

## Architecture

**Stack:** Next.js 15 · TypeScript (strict) · React Three Fiber · Three.js · Zustand · Canvas 2D API · Web Audio API

**Entry point:** `app/page.tsx` → `WorldManager` (renders current world, manages portal transitions)

**State:** `lib/world-store.ts` — Zustand store, persisted to `localStorage`

```
lib/
  world-store.ts          Global world state, portal triggers, session log
  universe-store.ts       Three.js universe state (legacy v1 entry, still live at /build etc.)
  types.ts                Shared TypeScript interfaces
  data/
    projects.ts           4 projects with tech stack, links, status
    runs.ts               Boulder Marathon, Pikes Peak, Golden Gate 25K, others
    adventures.ts         9 Colorado/Utah locations with coordinates and descriptions
    memories.ts           14 archive entries (notes, photos, objects)

components/
  worlds/
    WorldManager.tsx      Renders current world + portal overlay; sets data-world on <html>
    PortalTransition.tsx  8 unique portal animations keyed by PortalType
    World0Surface.tsx     The Surface
    World1Apartment.tsx   The Apartment
    World2Depth.tsx       The Depth
    World3Broadcast.tsx   The Broadcast
    World4Corridor.tsx    The Corridor
    World5FieldStation.tsx Field Station
    World6Document.tsx    The Document
    World7Mall.tsx        The Mall
    World8Signal.tsx      The Signal
    World9Contact.tsx     The Contact Page
  universe/               Three.js universe (v1 — accessible at sub-routes)
  cursor/                 Custom cursor system (hidden on W6, W9)
  hud/                    Universe HUD (v1 only)

app/
  page.tsx                Home → WorldManager
  layout.tsx              Loads all 9 world fonts; sets initial title to "[untitled document]"
  globals.css             World-scoped CSS via html[data-world="N"] selectors
  build/                  /build — Projects page (v1)
  run/                    /run — Running page (v1)
  archive/                /archive — Archive page (v1)
  explore/                /explore — Explore page (v1)
  lab/                    /lab — Lab experiments page (v1)
```

---

## The Nine Worlds

Each world has one font, one color palette, and one way out (minimum).

### World 0 — The Surface
**Font:** IM Fell English · **Background:** #fafaf8

A blank white page with a blinking cursor. No nav, no labels. Four different things happen depending on how you interact:

| Action | Destination | Portal |
|--------|-------------|--------|
| Wait 47 seconds (idle) | W1 | Fold |
| Click the cursor | W3 | White circle expand |
| Scroll | W7 | Cursor flood (brown) |
| Right-click | W5 | Viewport rotation |
| Type any key | W6 | Letter expands to fill screen |

Hidden: counter in bottom-right corner counts down slowly, never reaches zero. Clicking it resets to 1247. `window.__counter = 0` in console triggers a message. HTML source contains email in a comment.

### World 1 — The Apartment
**Font:** VT323 · **Background:** #1a1210

A flat CSS dollhouse cutaway. Interactive objects:
- **Bookshelf** — 4 books, each opens a modal with real content (bio, running notes, tech stack, Colorado)
- **TV** — Clicks on; shows static for 8 seconds, then a YouTube embed
- **Window** — Cycles through 4 scenes (morning, overcast, night, sunset) on click
- **Door** (right wall) → W4 · Slide-right portal
- **Rug/hatch** (center floor) → W2 · Scatter portal
- **Phone** — Pulses after 45 seconds and every 3 minutes; click to dismiss

### World 2 — The Depth
**Font:** Special Elite · **Background:** #000000

A black void with objects drifting in on random vectors. 5 types: polaroids, cassette tapes, floating doors, GPS coordinates, ransom-note text. All move independently on sinusoidal drift paths. Background breathes (radial gradient, 0→0.2 opacity) every 12 seconds.

Clickable doors:
- *Before the Decision* → W1
- *What You Were Looking For* → W9 (expand-white)
- *Room 47* → W6 (cursor flood)

### World 3 — The Broadcast
**Font:** Libre Baskerville · **Background:** #0d0d0d

A 4:3 CRT TV set. 6 channels + a knob. Turn knob past CH13 → W8.

| CH | Content |
|----|---------|
| 2 | Tyler bio, rotating sentences (TTS-style) |
| 4 | Project slideshow (auto-advances every 4s) |
| 7 | Dead air + fake phone number (email as digits) |
| 9 | Live news ticker with fake headlines about Tyler |
| 11 | YouTube embed (lofi/found video) |
| 13 | Full site iframed — loads after 90s |

### World 4 — The Corridor
**Font:** Oxanium · **Background:** #0a0806

A 3000px-wide perspective hallway. Drag to traverse. Five doors spaced along the length, scaling by distance from center. Floor text resolves letter-by-letter to "TYLER EMDUR" over 3 minutes.

| Door | Destination | Portal |
|------|-------------|--------|
| BEFORE THE DECISION | W1 | Fold |
| AFTER THE SOUND | W5 | Rotation |
| THE SECOND TUESDAY | W7 | Cursor flood |
| WHAT YOU WERE LOOKING FOR | W9 | Expand-white |
| DO NOT | Locked — 3 tries → W0 | Fold |

### World 5 — The Field Station
**Font:** Playfair Display · **Background:** #020a04

Scientific monitoring interface. Three panels:
- **Signal Analysis** — Signal strength meter fluctuates, flatlines after 30s, displays: *"BUILDER OF THINGS. RUNNER OF TRAILS. INTERESTED IN INTERESTING PROBLEMS."*
- **Location Matrix** — SVG world map with pulsing dot on Boulder, CO (40.0150°N, 105.2705°W)
- **Systems** — Antenna (2 clicks → W3), Maintenance Hatch (7 clicks → W6)

Real-time clock and session uptime counter.

### World 6 — The Document
**Font:** Unna · **Background:** #fafaf7

A 52-page document. White background, serif font, almost-English prose about "the individual in question" (written in the third person, as if by a committee reviewing Tyler's work and life). Most pages are blank — content appears on pages 1, 4, 7, 13, 19, 27, 33, 40, 47, 52.

Email address appears on a randomly selected page each visit. Social links appear as archival citations on page 40. Page 52 has a "continue reading →" button → W8 (slide-right).

### World 7 — The Mall
**Font:** Pirata One · **Background:** #1a1410

A dead 1993 mall with PA announcements every 4 minutes (7 total, cycling). Four enterable stores:

| Store | Contents |
|-------|---------|
| SYSTEM LOGIC | Software boxes styled like 90s shareware packaging — Digger, this site, Trail Logger, Signal Noise |
| THE GAP BETWEEN | Mannequins facing the wrong way. No other content. |
| CURIOUS BY DEFAULT RECORDS | Tyler's timeline as an album tracklist — 9 tracks, click to "play" |
| BUILDER OF THINGS | Products described in hardware-store language; CHECKOUT button generates a bio receipt |

### World 8 — The Signal
**Font:** Space Mono · **Background:** #050505

The actual portfolio — bio, 4 projects, 3 runs, contact info — but rendered with corruption/glitch overlays that clear over 4 minutes via a progress bar. A partially-legible button reads `[ __ __ EDIATE AC__ SS ]`. Click it or type IMMEDIATEACCESS to clear instantly. Continue → W9.

### World 9 — The Contact Page
**Font:** System (Apple/OS default sans-serif) · **Background:** #ffffff

Completely normal. Clean white page. Name, email, GitHub, LinkedIn, a contact form (collects nothing, submits to void). Footer in 9px text at barely-visible opacity: `you found it.`

---

## Portal System

Each portal transition is unique — no two world connections share a type. Defined in `PortalTransition.tsx`.

| Type | Effect |
|------|--------|
| `fold` | CSS 3D perspective fold to black |
| `expand-white` | White circle expands from click origin |
| `rotate` | Black overlay rotates 90° over content |
| `scatter` | All body elements fly to random positions |
| `letter-expand` | Typed letter grows to fill viewport |
| `cursor-flood` | 80 particles expand from random positions, flooding the screen |
| `slide-right` | New world slides in from right over 4 seconds |
| `nothing` | Immediate swap — subtle change discoverable after 30s |

---

## ARG / Hidden Layer

- `localStorage('visited_worlds')` — array of visited world IDs, persists across sessions
- `window.__worldLog()` — prints visited worlds to console (available from any world)
- `window.__counter = 0` — resets the counter on W0, triggers a console message
- Console on load: `>> SIGNAL ACTIVE` with usage hints
- HTML source of layout.tsx: `<!-- hello: healthreinvented@gmail.com -->`
- Counter on W0: counts down to 1, never reaches zero
- Page `<title>` changes per world (see `WORLD_TITLES` in `world-store.ts`)
- W9 footer: `you found it.` at ~2% above background color

---

## Typography

One font per world, loaded in `app/layout.tsx` via Google Fonts:

| World | Font |
|-------|------|
| 0 | IM Fell English |
| 1 | VT323 |
| 2 | Special Elite |
| 3 | Libre Baskerville |
| 4 | Oxanium |
| 5 | Playfair Display |
| 6 | Unna |
| 7 | Pirata One |
| 8 | Space Mono |
| 9 | System default |

---

## V1 Universe (Still Live)

The Three.js universe (v1) is accessible via direct routes. The main `app/page.tsx` now loads WorldManager (v2), but sub-pages remain functional and are linked from the universe:

- `/build` — Projects with detail panel
- `/run` — Running log with pace profiles and elevation charts
- `/archive` — Memory archive with CRT photo placeholders, glitch text, integrity bars
- `/explore` — Adventure log with elevation canvas and topo visualization
- `/lab` — 11 interactive canvas experiments

The v1 universe is no longer the homepage entry point but its components and data are still shared (projects, runs, adventures, memories).

---

## Commit History (This Project)

| Hash | Description |
|------|-------------|
| `703a616` | Build v2: 9-world ARG anti-portfolio experience |
| `108ce2e` | Massively expand portfolio — 11 lab experiments, comet system, full object rendering, rich terminal |
| earlier | Initial Next.js + Three.js universe, HUD, region system, sub-pages |

---

## Known Behaviors (Not Bugs)

- World 4 corridor perspective is approximate — not ray-traced, just scaled divs
- World 2 items spawn off-screen and drift; density caps at 18 concurrent items
- World 6 email page is determined randomly at module load time — it's the same page for the whole session
- World 8 progress bar takes exactly 4 minutes; typing `IMMEDIATEACCESS` clears it instantly
- World 9 form submits nothing — intentional
- The counter on W0 never reaches zero — intentional
- Back button in W4 may behave unexpectedly — intentional (browser history is not wired to the world stack)
