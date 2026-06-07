# tyleremdur.com — Build Log

## What This Is

A portfolio that refuses to be one. Structured as an ARG (alternate reality game) where the work, bio, and contact information are distributed across 17 distinct "worlds" — each with its own visual language, physics, and way of moving between them. Each world should feel like a different application, game, machine, or reality — not a themed webpage. The goal is that a visitor forgets they are on a website.

---

## Design Philosophy

**Places, not pages.** Each world is an environment you occupy, not a layout you look at.

- Forbidden: cards, dashboards, section layouts, button grids, menus disguised as worlds
- Required: interaction language unique to each world (not just a different color palette)
- Connection system: worlds share recurring anomalies — frequency **88.7**, coordinates **40.0150°N 105.2705°W**, organization names — not shared visual style

---

## Architecture

**Stack:** Next.js 15 · TypeScript (strict) · React Three Fiber · Three.js · Zustand · Canvas 2D API · Web Audio API

**Entry point:** `app/page.tsx` → `WorldManager` (renders current world, manages portal transitions)

**State:** `lib/world-store.ts` — Zustand store, persisted to `localStorage`

```
lib/
  world-store.ts          Global world state, portal triggers, session log
  universe-store.ts       Three.js universe state (v1 entry, still live at /build etc.)
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
    HomeButton.tsx        Persistent back-to-home in each world
    World0Surface.tsx     The Surface
    World1Apartment.tsx   The Apartment (Universe entry — Three.js)
    World2Depth.tsx       The Depth
    World3Broadcast.tsx   The Broadcast
    World4Corridor.tsx    The Corridor
    World5FieldStation.tsx Field Station
    World6Document.tsx    The Document
    World7Mall.tsx        The Mall
    World8Signal.tsx      The Signal
    World9Contact.tsx     The Contact Page
    World10Loop.tsx       The Loop
    World11Flicker.tsx    The Flicker (Arcade)
    World12Terminal.tsx   The Terminal
    World13Spiral.tsx     The Spiral
    World14Pixel.tsx      The Pixel
    World15Dial.tsx       The Dial
    World16Index.tsx      The Index
  universe/               Three.js universe (v1 — accessible at sub-routes)
  cursor/                 Custom cursor system
  hud/                    Universe HUD (v1 only)

app/
  page.tsx                Home → WorldManager
  layout.tsx              Loads world fonts; initial title "[untitled document]"
  globals.css             World-scoped CSS via html[data-world="N"] selectors
  build/                  /build — Projects page (v1)
  run/                    /run — Running page (v1)
  archive/                /archive — Archive page (v1)
  explore/                /explore — Explore page (v1)
  lab/                    /lab — Lab experiments page (v1)
```

---

## Portal System

| Type | Effect |
|------|--------|
| `fold` | CSS 3D perspective fold to black |
| `expand-white` | White circle expands from click origin |
| `rotate` | Black overlay rotates 90° over content |
| `scatter` | All body elements fly to random positions |
| `vortex` | Spiral vortex |
| `chromatic` | Chromatic aberration burst |
| `cursor-flood` | 80 particles expand from random positions, flooding the screen |
| `slide-right` | New world slides in from right |
| `nothing` | Immediate swap |

---

## The 17 Worlds

### World 0 — The Surface
**Identity:** waiting room / threshold
**Interaction:** time and stillness

A blank white page with a blinking cursor. No nav, no labels. Behavior depends on input type.

| Action | Destination | Portal |
|--------|-------------|--------|
| Wait 47s (idle) | W1 | Fold |
| Click the cursor | W3 | White circle expand |
| Scroll | W7 | Cursor flood |
| Right-click | W5 | Viewport rotation |
| Type any key | W6 | Letter expands to fill screen |

Hidden: counter in bottom-right counts down slowly, never reaches zero. `window.__counter = 0` in console triggers a message.

---

### World 1 — The Apartment (Universe Entry)
**Identity:** Three.js immersive space — navigation hub
**Interaction:** spatial exploration, portals scattered as objects in 3D space

The Three.js universe. The main entry into the rest of the project's older sub-pages. Portals appear as floating objects. Still functional as a nav hub for `/build`, `/run`, `/archive`, `/explore`, `/lab`.

---

### World 2 — The Depth
**Identity:** underwater descent
**Interaction:** vertical scrolling/drifting into darkness, bioluminescent objects floating up

Dark ocean environment. Canvas-rendered bubble particles float upward with sinusoidal drift. Items appear at different depths with parallax. Caustic light patches render as SVG ellipses near the surface.

- Depth counter auto-increments in corner
- Boulder coordinates (`40.0150°N 105.2705°W`) displayed lower left
- `FREQUENCY: 88.7` appears in item text (connection system)
- Clickable floating doors lead to W1, W9, W6

---

### World 3 — The Broadcast
**Identity:** physical CRT television in a dark room
**Interaction:** click the channel knob to cycle channels; room glows react to on-screen content

A large CRT TV housing sits in a dark room (`#060402`). Ambient room glow changes color based on what's on screen (`CHANNEL_GLOW` record). Physical components: antenna (two arms), speaker grille (7 bars), brand nameplate "S I G N A L", LED channel display (VT323 font, orange glow). Static burst (320ms canvas noise) transitions between channels.

**No button grid.** Only the physical knob navigates channels.

| CH | Content |
|----|---------|
| 2 | Tyler bio, rotating sentences |
| 4 | Project slideshow (quiz show format) |
| 7 | Shopping channel / dead air |
| 9 | Live news ticker with fake headlines |
| 11 | YouTube embed |
| 13 | Static / glitch |

"CLICK TO CHANGE" hint fades after 4 seconds.

---

### World 4 — The Corridor
**Identity:** brutalist concrete hallway, impossible geometry
**Interaction:** drag to traverse; doors shift position every ~4 seconds

A 3000px-wide perspective hallway (`#1e1c1c` concrete gray). Doors are numbered room plates (`B-01`, `B-04`, `B-12`, `B-??`, `DO NOT`). Floor uses radial-gradient dot texture + expansion joints. Ceiling has fluorescent strip lights every 300px. Wall stamps include load ratings, fire ratings, drawing refs, and anomalies (`88.7`, `40.0150°N`). The DO NOT door has welded X-bars.

`doorShifts` state causes random doors to shift position by up to ±40px every ~4 seconds (30% probability per interval).

| Door | Destination | Portal |
|------|-------------|--------|
| B-01 | W1 | Fold |
| B-04 | W5 | Rotation |
| B-12 | W7 | Cursor flood |
| B-?? | W9 | Expand-white |
| DO NOT | 3 tries → W0 | Fold |

---

### World 5 — The Field Station
**Identity:** remote outpost you physically occupy
**Interaction:** observation (not dashboard-reading)

Scientific monitoring interface. The feeling of being inside a remote station — not looking at a monitoring panel. Three live panels: signal analysis (strength meter flatlines after 30s), location matrix (SVG map with Boulder pulsing dot), systems (antenna + maintenance hatch). Real-time clock and session uptime. Coordinates `40.0150°N 105.2705°W` visible.

---

### World 6 — The Document
**Identity:** classified archive investigation
**Interaction:** reading a dossier, not a PDF viewer

52-page document. Serif text, white background, prose in the third person ("the individual in question"). Content appears on scattered pages; most are blank. Email appears on a random page each visit. Social links on page 40 as archival citations. Page 52 → W8 (slide-right).

---

### World 7 — The Mall
**Identity:** 1993 mall corridor you physically walk through
**Interaction:** drag left/right to walk the perspective corridor; click stores to enter

Canvas-rendered perspective corridor with proper vanishing-point projection. Stores are drawn on-canvas with depth-correct scaling — they recede as you walk forward. Checkerboard tile floor (perspective-projected quads), fluorescent ceiling strips with radial glow, store signage with colored sign bands.

**Drag to walk.** Clicking a hovered store opens its interior overlay.

| Store | Interior |
|-------|---------|
| MACHINES | 6 vending machines (CERTAINTY · SLEEP · PURPOSE · REASONS · STATIC · THE ORIGINAL IDEA). Each selection returns a random failure/absurdist response. Buy 6 → glitch portal to Spiral. |
| FOOD COURT | Menu board: TIME SOUP · YESTERDAY · STATIC LG · DECISION. CASHIER button → W9. |
| GALLERY | 4 mannequins whose heads rotate to track cursor. Click one → it speaks. |
| ESCALATOR | Click 3×: first two warn, third warps to a random world. |

PA announcements slide up from below every 24 seconds. Includes: `Frequency 88.7 is currently unavailable in this location.`

---

### World 8 — The Signal
**Identity:** degraded transmission clearing over time
**Interaction:** wait or type passphrase to decode

The actual portfolio — bio, 4 projects, 3 runs, contact — rendered with corruption/glitch overlays that clear over 4 minutes via progress bar. Type `IMMEDIATEACCESS` to clear instantly. Continue → W9.

---

### World 9 — The Contact Page
**Identity:** completely normal
**Interaction:** a regular webpage (intentional contrast)

Clean white page. Name, email, GitHub, LinkedIn, contact form (submits to void). Footer at barely-visible opacity: `you found it.`

---

### World 10 — The Loop
**Identity:** puzzle memory game
**Interaction:** pick doors; the room keeps changing; discoveries accumulate in a log

Repeating room with 3–4 doors. Each door taken through a loop adds an observation to a discovery log (tally marks scratched on the floor track loop count). After 8+ loops, an EXIT door appears. Log entries include `the hum has a frequency: 88.7`.

Room shrinks slightly on each loop. After loop 5, status changes to UNSTABLE.

---

### World 11 — The Flicker (Arcade)
**Identity:** game show arcade
**Interaction:** memory card matching game with timer, combos, and leaderboard

Title screen with fake leaderboard (ACE/REX/ZAP/MAX). PRESS START gates gameplay. 90-second countdown, score system with combo multiplier (combo × 100). 6×3 grid of neon-colored cards. Game Over / Win overlay with RETRY and CORRIDOR buttons. Scanlines overlay throughout.

---

### World 12 — The Terminal
**Identity:** command-line interface
**Interaction:** type commands

A terminal. Commands explore fragments of Tyler's information.

---

### World 13 — The Spiral
**Identity:** disorienting descent
**Interaction:** passive visual spiral

A spiral world. Reached from World 7's vending machine glitch or World 10.

---

### World 14 — The Pixel
**Identity:** indie RPG / adventure game
**Interaction:** mastery, game mechanics

Pixel art adventure game world.

---

### World 15 — The Dial
**Identity:** radio receiver
**Interaction:** audio-first, turning a dial through frequencies

Tune through frequencies. `88.7` is significant. Reached from World 7 (escalator), World 10 (loop log).

---

### World 16 — The Index
**Identity:** incomplete list
**Interaction:** reading, following references

An index that refers to other worlds.

---

## Connection System (Cross-World Anomalies)

These recurring elements create continuity between worlds without shared visual style:

| Anomaly | Appears in |
|---------|-----------|
| Frequency **88.7** | W2 (item text), W4 (wall stamp), W7 (PA announcement), W10 (loop log), W15 (dial) |
| Coordinates **40.0150°N 105.2705°W** | W2 (depth readout), W4 (wall stamp), W5 (map) |

---

## Recent Commit History

| Hash | Description |
|------|-------------|
| `c8dc695` | Rebuild World 3 and World 7 as physical environments |
| `a4cdca4` | (prior session work) |
| `a8e5c0d` | Fix game and portals |
| `087aaad` | Strip HUD to bare text, surface portals, fix start screen |
| `fb1f191` | Restore Three.js universe as entry |
| `3e3dc4e` | Rebuild World 1 as a real hub — all worlds reachable |

---

## In Progress / Remaining Redesigns

Worlds that still need environmental redesign (from pages → places):

| World | Current State | Target |
|-------|--------------|--------|
| W5 Field Station | Monitoring dashboard panels | Remote outpost interior you physically occupy — observation not data-reading |
| W2 Depth | Objects floating on a dark plane | True vertical descent — parallax canvas, deeper = darker, pressure builds |
| W6 Document | PDF viewer aesthetic | Investigation desk — scattered papers, evidence board, redacted files |

---

## Known Behaviors (Not Bugs)

- W4 corridor perspective is CSS-scaled divs, not ray-traced
- W2 items spawn off-screen and drift; density caps at 18 concurrent items
- W6 email page is determined randomly at module load — same page per session
- W7 escalator destination is random each ride
- W9 form submits nothing — intentional
- The counter on W0 never reaches zero — intentional
- Back button may behave unexpectedly across worlds — intentional (browser history not wired to world stack)

---

## V1 Universe (Still Live)

The Three.js universe is accessible via direct routes:

- `/build` — Projects with detail panel
- `/run` — Running log with pace profiles and elevation charts
- `/archive` — Memory archive with CRT photo placeholders, glitch text
- `/explore` — Adventure log with elevation canvas and topo visualization
- `/lab` — 11 interactive canvas experiments
