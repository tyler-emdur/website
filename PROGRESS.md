# tyleremdur.com — Build Log

## What This Is

A portfolio that refuses to be one. Structured as an ARG where the work, bio, and contact information are distributed across 17 distinct "worlds." Each world is a completely different type of experience — game, government form, television, vintage OS, arcade cabinet, signal lab — not a themed webpage. The goal is that a visitor forgets they are on a website.

---

## Design Philosophy

**Not themed environments. Unique experiences.**

Each world must have a unique interaction model, visual language, pacing, emotional tone, and objective. No repeated mechanics. No repeated navigation systems. No repeated puzzle structures.

**Meow Wolf standard:** Every world should feel like it was built by a different team with a completely different goal. A visitor should constantly think "how is this part of the same website?" while slowly realizing everything connects through the same hidden system.

- Forbidden: cards, dashboards, section layouts, button grids, menus disguised as worlds
- Required: interaction language unique to each world (not just a different color palette)
- Connection system: worlds share recurring anomalies — frequency **88.7**, coordinates **40.0150°N 105.2705°W**, designation **T.EMDUR**, survey **TE-∅** — not shared visual style

---

## Architecture

**Stack:** Next.js 15 · TypeScript (strict) · React Three Fiber · Three.js · Zustand · Canvas 2D API

**Entry point:** `app/page.tsx` → `WorldManager` (renders current world, manages portal transitions)

**State:** `lib/world-store.ts` — Zustand store, persisted to `localStorage`

```
lib/
  world-store.ts          Global world state, portal triggers, session log
  universe-store.ts       Three.js universe state (W1)
  data/
    projects.ts           4 projects with tech stack, links, status
    runs.ts               Marathon, Pikes Peak, Golden Gate 25K, others
    adventures.ts         9 Colorado/Utah locations with coordinates
    memories.ts           14 archive entries

components/
  worlds/
    WorldManager.tsx      Renders current world + portal overlay
    PortalTransition.tsx  8 unique portal animations (PortalType)
    HomeButton.tsx        Persistent back-to-hub in each world
    World0Surface.tsx     Particle field entry
    World1Apartment.tsx   Three.js Universe hub
    World2Depth.tsx       Sonar ping ocean
    World3Broadcast.tsx   ★ REBUILT — Late-night CRT television
    World4Corridor.tsx    ★ REBUILT — Kafkaesque government building
    World5FieldStation.tsx  Ham radio cabin with draggable dial
    World6Document.tsx    Investigation corkboard with drag + redaction
    World7Mall.tsx        Perspective canvas mall corridor
    World8Signal.tsx      ★ REBUILT — Signal reconstruction lab
    World9Contact.tsx     ★ REBUILT — CAPTCHA that breaks down
    World10Loop.tsx       ★ REBUILT — Vintage OS desktop (Windows 95)
    World11Flicker.tsx    ★ REBUILT — Full arcade cabinet
    World12Terminal.tsx   Command-line interface
    World13Spiral.tsx     Scrollable descent spiral
    World14Pixel.tsx      ★ FIXED — 2D pixel platformer
    World15Dial.tsx       FM radio tuner
    World16Index.tsx      Grid world catalog
  universe/               Three.js universe scene, regions, effects
  cursor/                 Custom cursor system
  hud/                    Universe HUD
```

---

## Portal System

| Type | Effect |
|------|--------|
| `fold` | CSS 3D perspective fold to black |
| `expand-white` | White circle expands from click origin |
| `rotate` | Black overlay rotates 90° |
| `scatter` | All body elements fly to random positions |
| `vortex` | Spiral vortex |
| `chromatic` | Chromatic aberration burst |
| `cursor-flood` | 80 particles expand from random positions |
| `slide-right` | New world slides in from right |
| `nothing` | Immediate swap |

---

## The 17 Worlds

### World 0 — The Surface
**Identity:** threshold / particle field entry
**Interaction:** presence and time

Particle field. Mouse moves particles. Wait 47s → W1. Click cursor → W3. Scroll → W7. Right-click → W5. Type any key → W6.

---

### World 1 — The Universe
**Identity:** Three.js impossible machine, slowly learned
**Interaction:** drag to pan, scroll to zoom, click objects to discover

47 catalogued objects across 5 regions. PortalDirectory unlocks after 3 discoveries. Survey markers, corner terminal with `OPERATOR T.EMDUR`. Glitch overlay can flash `DESIGNATION: TYLER EMDUR`. Objects have clinical/archival descriptions (no humor). GiantStructures fills background with ancient rings, megastructures, debris fields at 700–2100 unit scale.

Connection system: coordinates `40.0150°N 105.2705°W` in AmbientTransmissions, frequency 88.7 in gate lore, `SURVEY TE-∅` throughout.

---

### World 2 — The Depth
**Identity:** deep ocean sonar station
**Interaction:** click to ping — rings expand from click point and briefly illuminate objects in darkness

Dark ocean gradient. 18 deep objects at different depths. Objects fade back to black; only visible while a ring passes through them. Clicking a visible door navigates. "CLICK TO PING" hint disappears after first ping.

---

### World 3 — The Broadcast ★ REBUILT
**Identity:** late-night cable television, physical CRT set in a dark room
**Interaction:** channel knob (▲▼ buttons or arrow keys), brief static burst on channel change

Physical wood-cabinet TV. CRT scanlines overlay. Vignette. Green power LED.

| CH | Content |
|----|---------|
| 2 | Pure static (canvas noise) |
| 4 | KWND News 4 — absurd stories, lore ticker scrolling coordinates + object counts |
| 7 | Nature Hour — narrator describes unclassifiable creature transmitting on 88.7 |
| 9 | DOOR-LESS™ infomercial — impossible product, fake testimonials |
| 13 | Emergency Alert System — strange message about unmapped objects |
| 22 | Mr. Static's Playhouse — cheerful kids show that goes dark |
| 44 | Classic test pattern |
| 66 | SECURITEL — camera grid watching sectors of other worlds |
| 88 | Frequency 88.7 acquired → countdown → routes to W15 |

---

### World 4 — The Corridor ★ REBUILT
**Identity:** Kafkaesque government building
**Interaction:** navigate a bureaucratic form system that loops on itself

Institutional beige walls, fluorescent lighting (with cleanup-safe flicker). Ticket dispenser. Form B-7 requires Form A-3 which requires Form B-7. After 2 loop cycles, a supervisor admits there is a maintenance door that was always unlocked. That door leads to W1.

Flow: Lobby → Window 3 (ticket) → Room 114 (Form B-7) → Room 108 (Form A-3, requires B-7) → Room 122 (Form C-12, requires A-3 + B-7) → Escalate → Supervisor → Lobby with maintenance door visible.

---

### World 5 — The Field Station
**Identity:** remote ham radio outpost
**Interaction:** drag the frequency dial to tune; each band has its own transmission

Three-column cabin layout: window (sky changes by time of day) + barometer + floor hatch | radio transceiver with draggable dial | notebook + lamp + mug.

Frequencies: 72.4, 80.0, **88.7** (portal → W15, special styling), 94.1 (portal → W3), 101.5, 107.3, 114.9. Transmissions type out character by character. Floor hatch: 5 clicks → W6. Barometer drifts ±0.002/second.

---

### World 6 — The Document
**Identity:** investigation corkboard
**Interaction:** drag documents around, click redacted sections 5× to unredact

Cork texture background. 10 pinned items (docs, photos, notes, 2 redacted classified docs). SVG bezier strings connect related items. Final unredacted doc → W8 portal.

---

### World 7 — The Mall
**Identity:** 1993 dead mall corridor you walk through
**Interaction:** drag to walk perspective corridor; click stores to enter interiors

Canvas-rendered perspective with vanishing-point projection. Checkerboard tile floor (projected quads). Ceiling fluorescent strips with glow. PA announcements every 24s including `Frequency 88.7 is currently unavailable in this location.`

| Store | Interior |
|-------|---------|
| Vending | 6 machines (CERTAINTY, SLEEP, PURPOSE, REASONS, STATIC, THE ORIGINAL IDEA) |
| Food Court | Menu board; CASHIER → W9 |
| Gallery | 4 mannequins track cursor; click to speak |
| Escalator | 3rd click → random world warp |

---

### World 8 — The Signal ★ REBUILT
**Identity:** signal reconstruction lab, single dark monitor
**Interaction:** drag scrambled waveform segments into correct order; clarity meter fills

6 scrambled waveform segments (canvas-drawn, noise floor visible). Drag to reorder. Each segment that snaps to correct position decodes and shows its text line. Full message when all correct: `T.EMDUR / 40.0150°N 105.2705°W / 88.7 MHz / 47 OBJECTS / YOU ARE BEING OBSERVED`. Decode animation, then exit to W1.

---

### World 9 — The Contact ★ REBUILT
**Identity:** CAPTCHA verification system that breaks down
**Interaction:** complete progressively impossible challenges until reclassified

White institutional background, Google CAPTCHA aesthetic.

Phase 1–2: Normal image tiles (traffic lights, crosswalks)
Phase 3: Impossible prompts — "Select all images containing distance" / "Select all images where it is currently 3:00pm" / "Identify every object that sounds like the number seven" / "Select every memory you regret" (tiles labeled MEMORY_001–009)
Phase 4: Canvas draw — "Please draw the shape of silence"
Phase 5: Analysis → lists detected attributes: hesitation, backtracking, strategy attempt, wondering if this is a trick
Phase 6: "ENTITY CLASS: HUMAN ENOUGH / DESIGNATION: T.EMDUR / ACCESS GRANTED" → W1

---

### World 10 — The Loop ★ REBUILT
**Identity:** Windows 95-era desktop, something wrong with the system
**Interaction:** double-click desktop icons to open windows; drag to reposition

Teal desktop (#008080). 5 desktop icons: My Computer, Documents, Archive, Recycle Bin, THE WORLD.

| Window | Contents |
|--------|---------|
| My Computer | 4 drives including F:\\ (DO NOT OPEN) |
| Documents | 5 files; tyler_emdur.exe (read-only); do_not_catalog.exe denies access |
| Archive — Sector 03-Ω | 47 items, 1 recovered, last access corrupted |
| Recycle Bin | Descends to W13 via vortex |
| THE WORLD | Shortcut to W1 |

Clock runs on wrong time (jumps by random minutes). Error dialogs spawn spontaneously. Clicking OK spawns another dialog until 3 OKs.

---

### World 11 — The Flicker ★ REBUILT
**Identity:** full fake arcade cabinet
**Interaction:** insert coin, select game, play, see leaderboard

Physical cabinet with marquee, CRT screen with scanlines, joystick buttons. Attract mode cycles title → ★★★★★ → INSERT COIN with fake leaderboard (T.E. at 999,990 / ??? at 47,047).

Games:
- **Memory Match**: 4×3 grid of 6 pairs (DEPTH, SIGNAL, MALL, SPIRAL, BROADCAST, ARCHIVE)
- **Reaction Test**: press when screen goes green; measures reaction time

High score table shows your session score blended into the leaderboard.

---

### World 12 — The Terminal
**Identity:** command-line interface
**Interaction:** type commands to navigate and discover

A terminal. Commands explore fragments of data. `help` lists commands.

---

### World 13 — The Spiral
**Identity:** disorienting descent
**Interaction:** scroll to descend, click wormholes arranged radially

Reached from W7 escalator, W10 Recycle Bin, W14 door.

---

### World 14 — The Pixel ★ FIXED
**Identity:** 2D pixel art platformer
**Interaction:** arrow keys / WASD move, space jumps; walk into numbered doors to warp

Neon pixel aesthetic (#1a0a2e sky). Player spawns in bottom corridor (row 26). Walk right to find 9 numbered warp doors and 24 coins. Warps lead to W3, W4, W5, W7, W10, W13, W15, W16, W1. Moving platform and spring. Collect all coins → W16 vault unlocked.

Bug fixed: warp doors and coins were positioned at y=27 (solid floor), moved to y=26 (walkable corridor).

---

### World 15 — The Dial
**Identity:** FM radio receiver
**Interaction:** drag frequency dial through 70–120 MHz; different content at each band

Frequencies: 72.4, 80.0, 88.7 (significant), 94.1, 101.5, 107.3, 114.9. Connected to W5 and W3.

---

### World 16 — The Index
**Identity:** grid catalog of all worlds
**Interaction:** click cells to navigate; fake entries locked

Grid of world cells. Fake entries (Attic, Basement, World 17, NULL, Cache, Mirror) show locked responses.

---

## Connection System (Cross-World Anomalies)

These recurring elements create continuity without shared visual style:

| Anomaly | Appears in |
|---------|-----------|
| **88.7 MHz** | W3 CH88 (portal), W3 CH7 (narration), W3 CH4 (ticker), W5 (band with portal), W7 (PA announcement), W8 (decoded message), W1 (ambient + gate lore) |
| **40.0150°N 105.2705°W** | W2 (depth readout), W1 (AmbientTransmissions), W8 (decoded message) |
| **T.EMDUR / TYLER EMDUR** | W1 (corner terminal as OPERATOR, glitch flash), W9 (final CAPTCHA result), W8 (decoded message) |
| **47 objects** | W1 (survey count drifts around 47), W8 (decoded message), W11 (??? high score 47,047) |
| **SURVEY TE-∅** | W1 (AbstractIndex corner terminal, AmbientTransmissions) |

---

## Recent Commits

| Hash | Description |
|------|-------------|
| `e80a05f` | Rebuild 7 worlds as radically different Meow Wolf experiences |
| `c838dc3` | Strip internet-humor tone from Universe — replace with archival/clinical voice |
| `701a1bc` | (prior universe redesign pass) |
| `a8e5c0d` | Fix game and portals |
| `087aaad` | Strip HUD to bare text, surface portals, fix start screen |

---

## Known Behaviors (Not Bugs)

- W4 maintenance door only appears after completing 2 form loops (by design)
- W7 escalator warp destination is random each ride
- W9 CAPTCHA always marks weird-phase answers wrong (by design)
- W9 canvas drawing is never actually analyzed (by design)
- W10 clock shows wrong time and jumps randomly (by design)
- W11 T.E. high score is permanently at 999,990 (by design)
- W14 bottom corridor is isolated from upper level — access only via warp doors (by design)
- W0 counter never reaches zero (by design)
- Browser back button behaves unexpectedly across worlds (intentional — history not wired to world stack)

---

## Remaining Work

| World | Status | Priority |
|-------|--------|----------|
| W13 Spiral | Basic scroll descent, needs Meow Wolf pass — could become psychological depth test | Medium |
| W16 Index | Grid catalog, could become 2004 educational website (Worldpedia) | Low |
| W5 Field Station | Good but dial mechanic could use active anomaly-hunting spectrogram layer | Low |
| W12 Terminal | Functional but could be more surprising | Low |

---

## V1 Universe Sub-routes (Still Live)

- `/build` — Projects
- `/run` — Running log with pace profiles
- `/archive` — Memory archive
- `/explore` — Adventure log
- `/lab` — 11 interactive canvas experiments
