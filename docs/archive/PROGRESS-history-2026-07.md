# Session History Archive — July 2026

Dated session log entries moved out of PROGRESS.md to keep that file focused on living rules/context. Chronology within this file is as it was in the original log (not strictly date-ordered).

---

## 2026-07-24 — World 3 (Broadcast): the set gets a floor to stand on

Objective:
PLAN.md Session 3 — stop the television floating in a void.

Why:
Tyler sent a screenshot from a real browser window confirming the one
compositional reading that survived the bad-tab problem: the set sits in pure
black, with no surface under it, no wall behind it, and no floor. Galekto's TV
aesthetic — his reference for this world — works because the CRT's light falls
on a room. A flickering screen in a void is just a video element.

Brought forward ahead of Session 2 (Warehouse 14 shadows) because this is the
one world whose diagnosis Tyler had independently confirmed, and because after a
session of invisible plumbing work the project needed a change you can actually
see.

Changes Made (all CSS — this world has no three.js, which is also why it is
verifiable from the automation tab: DOM composites regardless of rAF):
- components/worlds/World3Broadcast.tsx
  - A back wall: a faint vertical gradient replacing flat `#030201`. Barely
    there, but it is the difference between a dark room and no room.
  - A floor, running from the set's base toward the viewer, with sheen falling
    off by distance so it reads as a plane going away rather than a band.
  - The floor/wall seam, lit only across the middle where the screen reaches it.
  - A contact shadow under the cabinet — the thing that stops the set floating.
  - `floorPool`: the channel's own colour thrown forward onto the floor, reusing
    the existing per-channel SLOT_GLOW palette at a readable alpha. **Change the
    channel and the room changes with it** — verified: CH 23 (Reykjavík) lays a
    warm pool on the floor, CH 17 (Taipei) a cool blue one.

Notable detail:
Floor, seam and shadow are positioned off the cabinet (`top: 100%` — its base)
rather than off the viewport, so the ground meets the set exactly wherever the
cabinet happens to size at a given window. Anchoring them to viewport
percentages would have put the seam in the wrong place at most aspect ratios.

Verification:
- `next build` clean.
- Production build, screenshotted at two channels; floor, seam and contact
  shadow all present, and the floor colour tracks the channel.
- No JS, no new dependencies, no animation added — nothing here can cost frame
  rate, which sidesteps the measurement problem entirely.

Website Scores:
- Immersion: +  Atmosphere: +  Cohesion: + (the room now responds to content)
- Performance: = (static CSS)  Mystery: = (nothing explained)

Recommended Focus For Tomorrow:
Session 2 (Warehouse 14 light + shadow) still needs a foreground window for its
frame-time gate. Session 4 (Garage) is in doubt — Tyler reports the Garage
"looks pretty similar, works fine", so the "it is invisible" reading was
probably another bad-tab artifact and that session may not need to exist.

Risk Level: Low

---

## 2026-07-24 (correction, same day) — the "it was never rendering" claim was wrong

Retracting the headline of the entry below. Read this first.

The claim was that mounting `<StravaCanvas>` conditionally stalled R3F's
container measurement and left World 2 permanently black. It does not. After
shipping the "fix", a mount probe inside the Canvas showed R3F **still** not
mounting its children under identical conditions — the stall reproduces with and
without the change, so the conditional mount was never the cause.

The actual cause was the verification environment. The browser-automation tab
runs with `document.visibilityState === "hidden"`, where `requestAnimationFrame`
is fully paused (measured: 0 frames in 4s) and no rendering steps run, so
ResizeObserver never delivers its first callback and R3F never initializes.
Worlds 1, 6 and 14 appeared to work only because I clicked or scrolled in them
first, which forces a rendering step; World 2 was the one world I loaded and
passively waited on. All four use the identical
`dynamic(..., { ssr: false })` pattern — there was never a difference between them.

**World 2 was most likely never broken for real visitors.** A foreground tab runs
the rendering pipeline, ResizeObserver fires, R3F initializes normally.

What survives from that session, all of it verified independently of the browser:
- The load split. `/api/strava` measured server-side with curl at **20.8s cold /
  23ms warm**; terrain.json is 8kB/40ms and was sharing an await with it. Real,
  and the reason the 20s "SURVEYING BOULDER" was genuine.
- Removing the "TYLER STRAVA / RUN MAP" title card (non-negotiable #1).
- The ghost runner's start marker.
- The OrbitControls `maxDistance` clamp — pure arithmetic, 3.06 vs 3.0 radii.
- Splitting the terrain and Strava failure states apart.

What was downgraded, not reverted:
- Mounting the canvas unconditionally. Kept, because it is how the other three
  worlds do it and because it genuinely stops the ground being gated behind a
  slow fetch — but it is a consistency and load-ordering change, **not** a bug
  fix, and the code comments have been rewritten to stop asserting otherwise.

Lesson for this project, worth more than the session was:
**A black WebGL canvas in the automation tab means nothing.** Every 3D world
looks broken there until something forces a rendering step. Verify 3D worlds in
a real foreground window, or verify them by mechanisms that do not depend on
painting at all (server timings, effect probes, `next build`).

---

## 2026-07-24 — World 2 (Explorer): it was never rendering ⚠️ HEADLINE RETRACTED, see above

Objective:
Session 1 of PLAN.md — stop World 2 being the worst experience on the site.

Why:
Walking all ten worlds against Tyler's inspiration sheet, World 2 was the only
one that was actually broken rather than merely thin. It sat on "SURVEYING
BOULDER…" for ~20s and then showed a black screen with a stats panel in the
corner. Scrolling or dragging would sometimes bring the map up, which is what
disguised it as a framing problem.

Things Discovered (the real bug, and it is not what it looked like):
The canvas was never initializing at all. `<StravaCanvas>` was mounted
conditionally — `{!loading && configured && terrain && <StravaCanvas/>}` — so it
entered the tree in a commit that was still settling, R3F's `react-use-measure`
read the container as 0x0, and R3F then never completed initialization: a live,
non-lost WebGL context, correctly sized drawing buffer, and not one frame ever
rendered, not one child ever mounted. Silent — no console error. Proven by
dispatching a bare `window.resize`, which kicked the ResizeObserver and brought
the entire scene up instantly.

This is the same silent R3F failure logged on 2026-07-16/17 for the Garage
(two simultaneous canvases). Different trigger, same signature. Worth treating
as a standing rule for this codebase: **mount R3F canvases unconditionally and
let them render an empty scene, never gate them on async data.** World 14 does
it that way, which is why World 14 never had this.

Second discovery, also contrary to expectation: the ~20s wait was NOT
street-coverage.json. That file is 3.8MB raw but serves gzipped in ~150ms. The
wait was `/api/strava` — 23ms warm, but ~21s on a cold `unstable_cache` miss
(OAuth refresh + 6 sequential Strava pages, revalidated 6-hourly). So roughly
one visitor every six hours paid a 21-second black screen, and terrain.json —
8kB, 40ms, and the thing that actually makes this a place — sat downloaded and
unused inside the same `Promise.all` the whole time.

Changes Made:
- components/worlds/World2Explorer.tsx
  - `<StravaCanvas>` mounts unconditionally, first in the DOM, in a z-index 0
    wrapper so the HUD overlays keep painting above it.
  - One `Promise.all` split into three independent loads: terrain (draws the
    ground immediately), strava (routes + stats arrive when they arrive),
    coverage (one stat, fills in late). Replaced the single `loading` flag with
    `terrainLoaded` / `stravaLoaded`.
  - "SURVEYING BOULDER" now only covers the gap before the ground lands.
- components/worlds/StravaCanvas.tsx
  - `terrain` is now nullable; background + fog render always, the scene when
    terrain exists.
  - Removed `SkyText` / `ExtrudedTextLine` — the "TYLER STRAVA / RUN MAP /
    66.5% OF BOULDER RUN" floating title card. It was the most portfolio-shaped
    object on the site (non-negotiable #1) and the corner panel already carries
    the number honestly and quietly.
  - OrbitControls `maxDistance` 3.0 → 3.4 radii. The authored opening shot sits
    at ~3.06 radii, so the old cap silently clamped the first frame to a
    framing this file never asked for.

Atmospheric Details Added (Delight Rule):
- The ghost runner now has a start marker: a small cool point at the first
  sample of the route it retraces, invisible while the ghost is standing on it
  and brightening as the ghost gets further round the loop, then fading again on
  the approach. No label. It reads as a place someone left from. Stays dark
  under prefers-reduced-motion, where the ghost is parked at the start anyway.

Verification:
- `next build` clean.
- Production build (`next start`), fresh tab, no resize: world renders on its
  own. Rendered by ~2.5s from navigation start; all network complete at 369ms
  and the route geometry build measured at 21ms for 367 activities / 27,795
  points, so the remainder is WebGL init. (Screenshot-based timing carries
  ~±0.5s of tooling latency — treat 1–2s as approximate, not instrumented.)
- Warm `/api/strava` 23ms, cold 20.8s — confirmed the cache works and that the
  cold miss no longer holds the ground hostage.
- No console errors; orbit/damping unchanged; stats panel and coverage stat
  both present and correctly layered above the canvas.

Caveat on the verification environment (found late, worth recording):
The browser-automation tab runs with `document.visibilityState === "hidden"`,
which throttles `requestAnimationFrame` and makes frame-timing measurements from
there worthless. It also produced one false finding this session — a claim that
World 14's controls overlay never dismisses, which is untrue: it is gated on
`hasMoved` and dismisses correctly on a real wheel or keydown. The World 2 stall
itself is not an artifact — `useEffect` runs regardless of visibility, the probe
effect never fired across repeated loads and a fresh tab, and Worlds 1/6/14
initialize fine under identical conditions. What separates World 2 is the late
conditional mount, and mounting unconditionally makes it behave like the worlds
that already work. Frame-time verification for future sessions has to happen in
a real foreground window.

Website Scores:
- Immersion: + (a world that renders at all)  Polish: +  Performance: +
- Originality: + (title card gone)  Mystery: = (start marker adds, explains nothing)

Recommended Focus For Tomorrow:
PLAN.md Session 2 — the light and shadow pass in Warehouse 14.

Risk Level: Low

---

## 2026-07-16 — The World That Isn't (World 1 · Universe)

Objective:
Turn the site's central "there is no world 4" mystery from a latent navigation
bug into a handcrafted, discoverable payoff in the Universe hub.

Why:
CORRIDOR-A (`explore-corridor` in lib/universe-store.ts) is the ONLY object that
points at `worldId: 4`. There is no world 4 — it's a load-bearing lore beat,
echoed by Channel 88 in Broadcast, the Answering Machine voicemail, and even a
CartographyLayer label ("EMPTY ORBIT REFERENCE: NULL-4"). But the hub itself
never delivered on it: clicking ENTER on the corridor ran `navigateTo(4, …)`,
which set `document.title = WORLD_TITLES[4]` (→ the literal string "undefined"),
fell back to the Surface component, and permanently poisoned the visited-worlds
tally in localStorage (Channel 88 would read e.g. "10/9 WORLDS SEEN"). The
Universe was also the least-recently-touched world (untouched since 2026-06-30).
Now, committing to the traverse hands off to a brief descent that tries to
resolve WORLD 04, fails ([ SIGNAL NOT FOUND ]), settles on a spare line —
"there is no world 4. / you already knew that." — and releases you back to the
corridor mouth exactly where you were. It awards a rare secret,
`universe-there-is-no-world-4`, which feeds Channel 88's recovered-secrets count.

Risks:
- Overlay must always release → guaranteed by an elapsed-time rAF loop reaching
  T_DONE, plus a setTimeout failsafe, plus click/Esc skip after the reveal.
- Must not affect real worlds → special-cased strictly to `worldId === 4`.
- Kept spare (monochrome, minimal text, echoes existing HUD idiom) so it reads
  handcrafted, not AI slop.

Files Modified:
- lib/universe-store.ts — added `nullDescent` state + `beginNullDescent`/`endNullDescent`.
- components/hud/HUD.tsx — ObjectPanel.handleEnter special-cases worldId 4:
  awards the secret and begins the descent instead of navigating.
- components/universe/UniverseRoot.tsx — mount <NullDescent />.
- components/universe/effects/NullDescent.tsx — NEW. The descent overlay.

Worlds Touched:
- World 1 (Universe) only. (One medium improvement.)

Changes Made / Features Added:
- The "World 4" non-event: an earned, atmospheric dead-end that honors the
  running mystery without explaining it, and rewards a curious click on a
  wormhole labelled "traverse with caution / exit vector unknown".

Bugs Fixed:
- Entering CORRIDOR-A no longer dumps you on the Surface with an "undefined"
  browser-tab title, and no longer adds phantom world 4 to the visited list.

Notable engineering detail:
- The sequence is driven by a requestAnimationFrame elapsed-time loop, NOT
  chained setTimeouts: the live WebGL render loop starves background timers into
  catch-up bursts (verified: two setTimeouts firing 1ms apart after a ~4s
  stall). Reading elapsed each frame is self-correcting. The overlay also sits
  at z-index 2147483000 to clear drei's <Html> CartographyLayer labels, which
  portal to a ~16.7M z-index and otherwise bleed over the descent.

Verification:
- `next build` clean (lint + types). Playwright (headless Chromium): universe +
  surface load with zero non-network console errors; all four descent phases
  render correctly on desktop (1280×800) and mobile (390×844); labels are
  covered; the overlay always releases with data-world staying 1 and the title
  staying "Tyler Emdur" (bug fix confirmed).

Website Scores (subjective):
- Immersion: +  Originality: +  Polish: +  Performance: = (bundle +0.1kB)
- Cohesion: + (hub now pays off the lore Broadcast/Answering already reference)
- Exploration: +  Mystery: + (preserved, not explained)

Recommended Focus For Tomorrow:
- World 9 (Answering Machine) is now the least-recently-touched world.
- Consider a matching subtle acknowledgement when all secrets are recovered.

Risk Level: Low

---

## 2026-07-12 — World 2 (Explorer): a ghost still runs the last route

Objective: Give the Boulder GPS trace a heartbeat — a single soft light that endlessly
retraces the most recent run along the lofted point-cloud trail.

Why: World 2's purpose is "a living memory of place," but it was a static point cloud.
The HUD already whispers `LAST: <run> · <date>`; now something out on the map is actually
running it. Rewards lingering, deepens atmosphere, adds no UI and no explanation (mystery
intact). Chose World 2 deliberately — the parallel autonomous branches keep colliding on
Worlds 9/1/5 and none had touched this one.

Risks: Low. One isolated component (GhostRunner in StravaCanvas), cannot affect navigation.
Guarded against distraction (calm 9 samples/sec pace, short additive trail), accessibility
(freezes to a still point under prefers-reduced-motion), and wrong-run selection (sorts by
the per-activity date already in the /api/strava payload; falls back to longest route).

Files Modified: components/worlds/StravaCanvas.tsx

Worlds Touched: World 2 (Explorer) only.

Changes Made:
- New GhostRunner: lofts one route onto the terrain like the dots, animates a hot head +
  ~34-vertex fading tail along it with wrapped linear interpolation, loops seamlessly.
- Scene selects the most-recent usable run (>=8 pts) by date, falls back to the longest.
- Extended RouteActivity with optional date/name (already present in the payload at runtime).

Build: `next build` passes clean (types + lint), no new deps.

Website Scores (delta): Immersion +, Atmosphere +, Exploration +, Mystery preserved.

Recommended Focus For Tomorrow: World 2 could earn a faint start/finish marker where the
ghost begins its lap; or leave it — worlds 3/6/14 have more surface area to deepen.

Risk Level: Low

---

## 2026-07-15 — World 0 (Surface): the front door keeps count

Objective:
Give the GeoCities-era front door the one artifact it was missing — a hit counter — done honestly.

Why:
Surface is a loving pastiche of the early web (ticker, NETSCAPE NOW!, BEST AT 800x600,
sparkle cursor, live traffic feed) but had no visitor counter — the single most iconic
90s-web relic. Its absence was a real gap. Rather than fake traffic numbers (forbidden by
this project), the counter is truthful: it counts *your* visits from this browser via
localStorage, remembers the day you first arrived ("member since"), and switches its caption
from "YOU ARE VISITOR" to "WELCOME BACK" on return — a small reward for coming back.

Worlds Touched:
- World 0 (Surface)

Changes Made:
- New `HitCounter` component in World0Surface.tsx: green LCD odometer digits in a classic
  inset black box, honest localStorage-backed count + first-seen date.
- Added a "> VISITOR COUNT" MiniPanel in the right column (between weather and WHO'S WATCHING).
- Resynced package-lock.json (was out of sync with package.json — missing @emnapi/* entries —
  which breaks Vercel's `npm ci`; preview builds need it).

Risks: Low. Self-contained, client-only render guarded against hydration mismatch, localStorage
wrapped in try/catch, placed in the roomiest column so the fixed-height layout is undisturbed.

Verified: production build passes; screenshotted desktop (000001 → reload → 000002 "WELCOME
BACK") and mobile (390px) — counter legible, layout intact, no regressions.

Notes for future sessions: World 9 (Answering Machine) and World 1 (Universe) have been
edited on many unmerged branches (~7 and ~3 respectively) — that's the "repeating same edits"
problem. Prefer under-served worlds; Surface, Endpoint (7), and the Machine's non-recycle-bin
areas have more headroom.

---

## 2026-07-04 — The Machine grows a Recycle Bin

Goal:
Deepen World 5 (The Machine / EMDUR-486 desktop) per the COMPUTER WORLD
DIRECTIVE. Recent sessions touched Surface (0), Explorer (2), Broadcast (3),
Garage (6); the Machine had gone untouched. Every believable 90s desktop has
one thing this one lacked: a Recycle Bin. Added one — not as chrome, but as
environmental storytelling.

Why it improves the site:
- Lived-in detail the directive explicitly asks for ("recycle bin", "hidden
  files", "notes", "downloads", "easter eggs").
- Rewards exploration: the bin holds five deleted files with real voice.
- Cohesive with existing lore, does not invent new canon:
  - Centerpiece is WORLD_04.WLD — 0 bytes, matching the gap the whole site
    keeps around world 4 (counter skips it; the Answering Machine already
    insists "there's no world 4. there's never been a world 4."). Now you can
    find where that gap lives on the disk. It refuses to restore AND refuses
    to delete — preserves mystery, explains nothing.
  - The bin will not empty. Try, and the disk holds on: "Some things stay on
    the disk." This echoes the existing FORMAT-refused line and the
    EXPERIMENTS folder's "deleted, not gone." A new detail that rhymes with
    old ones instead of contradicting them.
  - Other files: resume_2019.doc (the portfolio-that-refuses-to-be-one, in
    file form), a blank cover letter, a pitch deck missing its middle, a
    self-deleting note-to-self. Wry, not confessional (respects the personal
    lore limit — no emotionally significant artifact added this session).
- GUI ↔ terminal parity, which this world already prizes: the bin appears in
  the desktop, My Computer, the Start menu, AND the terminal (C:\RECYCLED\,
  CD, DIR, TYPE all work on it).

Delight detail (small, discoverable):
- Hidden terminal command UNDELETE — deliberately NOT listed in HELP. Running
  it declines to recover anything ("file was never fully gone") and points you
  back to the desktop bin. For whoever thinks to try it.

Files Modified:
- components/worlds/machine/machine-data.ts — added RECYCLED[] + RecycledItem.
- components/worlds/machine/World5Machine.tsx — RecycleBin component (grid +
  Empty flow with confirm → emptying progress → "cannot empty" block dialog),
  openRecycleBin, desktop icon, My Computer entry, Start-menu entry, terminal
  C:\RECYCLED listing, TYPE support, hidden UNDELETE command.

Features Added:
- Recycle Bin world-object with 5 deleted files; empty-refused interaction;
  WORLD_04.WLD easter egg; UNDELETE terminal secret.
- New secrets: machine-bin-wont-empty, machine-undelete.

Risk Level: Low

---

## 2026-07-16 — Consolidating a week of unmerged autonomous branches

Objective:
While Tyler was traveling, the daily cloud runs couldn't get approval to merge,
so every session forked fresh from the same stale `main` — 15 branches piled up,
several colliding on the same worlds (World 9 got 8 independent takes, World 1's
ambient transmissions got 3). This session reviewed all of it with Tyler and
hand-merged the keepers into one coherent state.

Changes Made:
- World 9 (Answering Machine): combined four of the eight competing ideas into
  one file — the phantom voicemail from "the fourth" after a full listen
  (tape-fourth), the echo tape that reads back your visited-worlds trail
  (tape-knows-your-trail), the hidden blinking-light button (tape-blinking-light),
  and the hour-aware greeting/idle-line/sign-off mood. Dropped the two duplicate
  "click the reels" branches and the two other "listen past the end" branches
  that would have collided with tape-fourth's trigger.
- World 1 (Universe): merged the "there is no world 4" bug fix + descent
  sequence (fixes a real bug — the corridor was setting the tab title to the
  literal string "undefined" and corrupting the visited-worlds tally).
- World 2 (Explorer): merged the ghost runner that retraces the last Strava route.
- World 0 (Surface): merged the honest localStorage hit counter.
- World 5 (Machine): merged the Recycle Bin that won't empty (WORLD_04.WLD).
- Retired AUTONOMOUS_LOG.md in favor of PROGRESS.md across all merged branches.

Still pending a decision: World 1's Ambient Transmissions has 3 more competing
versions to hand-merge (time/linger-tiered pool + index-gap lore + decode
animation) — next in this session.

Risk Level: Low (each piece build-verified individually before and after merge)

---

## 2026-07-16 — World 1 (Universe): merging the ambient transmissions branches

Objective:
Finish consolidating the unmerged autonomous branches — hand-merge the 3
competing versions of AmbientTransmissions.tsx (the drifting green telemetry
line at the bottom of the Universe hub).

Changes Made:
- Base: the 3-tier AMBIENT/NIGHT/DEEP system (7/13) — night-only lines gated to
  the visitor's local 00:00–04:59, and rare DEEP lines that only unlock after
  ~150s of lingering, with per-band no-repeat memory.
- Spliced in from the 7/7 branch: the "index gap" lore lines (tagged tone:
  'gap', rendered in faint red instead of the relay's usual green — a visual
  callback to Broadcast's Channel 88 and the Answering Machine's "no world 4"
  thread) into both AMBIENT and NIGHT, plus the character-decode reveal
  animation so transmissions resolve out of scrambled glyphs instead of
  appearing instantly.
- Kept the mobile overflow fix (maxWidth + ellipsis) both branches had added.

Risk Level: Low (single HTML overlay, no 3D/nav changes; build-verified)

---

## 2026-07-17 — World 2 (Explorer): how much of Boulder have you actually run

Objective:
Tyler is running every street in Boulder and wanted the site to track real
progress toward it — streets and urban paths count, OSMP recreation trails
don't. Accuracy was the explicit bar, not a rough estimate.

Why:
This is a personal goal, not atmosphere set dressing, so it gets built like a
real data pipeline rather than eyeballed. World 2 already has a genuine Strava
integration (OAuth, real GPS traces, real terrain) — this extends that same
honesty to a number that means something to him specifically.

Changes Made:
- scripts/street-coverage/1-fetch-osm-streets.mjs: pulls Boulder's actual city
  boundary + full street/path network from OpenStreetMap (Overpass), then
  cross-references Boulder County's own authoritative "Boulder Area Trails"
  GIS layer (SURTYPE=SoftSurface) to separate real OSMP recreation trails from
  paved urban paths like Boulder Creek Path — spot-checked: Mount Sanitas
  trails correctly excluded, Boulder Creek Path correctly included. 14,202
  eligible streets+paths, 862.7 miles total.
- scripts/street-coverage/2-fetch-strava-traces.mjs: pulls full-resolution GPS
  streams (not the lossy summary_polyline the map view uses) for every run
  near Boulder, self-throttled against Strava's rate limits, cached per-run so
  re-runs only fetch new activities.
- scripts/street-coverage/3-compute-coverage.mjs: grid-indexed spatial match
  (20m threshold) between ~1.2M GPS points and the street network, bakes the
  result to public/street-coverage.json — same static-bake pattern as
  terrain.json/bake-terrain.mjs, not a live per-request computation.
- components/worlds/World2Explorer.tsx: added a "STREETS RUN" stat to the
  existing panel.
- Raw GPS traces and intermediate data are gitignored (data/street-coverage/)
  — only the aggregated public output is committed. Personal running data
  shouldn't sit in git history.

Result: 66.5% (573.5 / 862.7 mi) — streets 63.1%, paths 71.2%.

Risk Level: Low (additive stat, static JSON fetch, no changes to existing
Strava/terrain code paths; build-verified, confirmed live in browser)

---

## 2026-07-16/17 — World 6 (Garage): Radio Garden, done properly

Objective:
Tyler asked directly for a Radio Garden-style globe in the Garage's car radio —
a second way to explore the world radio pool by place instead of by sweeping
the FM dial. Garage already had real, live, global internet radio (radio-browser.info
streams, honest data, no fakes); this was purely a new way to navigate it.

Why:
Radio Garden's whole trick is that geography IS the interface. The FM dial is
great and stays as the default, but a rotating globe studded with glowing
points per station — drag to spin, click a light, it tunes there — turns
"scanning a band" into "visiting a place." Explicitly requested, high-confidence
win, contained to one world.

Changes Made:
- app/api/radio/route.ts: added lat/lon (country centroid) to every station,
  with small deterministic jitter so same-country stations don't stack into
  one dot.
- components/worlds/garage/RadioGlobe.tsx (NEW): the globe content — dark
  sphere, faint wireframe lat/long grid, one glowing point per station
  (brighter + pulsing on the currently-tuned one), hover label, click-to-tune.
- components/worlds/garage/GarageScene.tsx: the globe is rendered *inside the
  same persistent Canvas* as the garage interior (swapped via a `globeMode`
  prop + a CameraRig that snaps the shared camera between the two framings),
  not as a second Canvas. Also drops the interior's fog/garage meshes/spotlights
  when in globe mode.
- components/worlds/World6Garage.tsx: new "🌐 WORLD" button next to SEEK/MUTE;
  dashboard + title-card hide while the globe is open; Esc closes it; selecting
  a station calls the same tuneTo()/ensureRadio() path the dial already uses,
  so LiveRadio's crossfade-out-of-static behavior is shared, not duplicated.

Things Discovered (real engineering finding, not just this-session trivia):
Two independent, simultaneously-mounted @react-three/fiber <Canvas> elements
in this environment produced a canvas with a valid, non-lost WebGL context
that nonetheless never called onCreated and never rendered a single frame —
completely silent, no console errors. Confirmed with `window` markers that
the React component executed but R3F's own render pipeline never completed
initialization on the second context. World 6 previously never had two R3F
canvases mounted at once (NightDrive is a plain 2D canvas, not R3F), so this
had never been hit before. Fix: never open a second WebGL context for this
world — the globe shares GarageScene's one persistent Canvas via a content
swap, which is strictly better anyway (one GPU context per world, not two,
which matters more on real low-end/mobile devices than it did here).

Verification:
- `next build`: clean, no type errors.
- Manually driven in a real browser end-to-end: entered Garage, opened the
  globe, dragged to spin, hovered a station (label + pulse), clicked it —
  dial snapped to 92.6 FM / Radio Jamaica, dashboard reappeared correctly with
  the new station live. Closed via both the X button and Esc.
- Fixed a real mobile bug found in this pass: the "MIDNIGHT GARAGE" title
  card overlapped the globe's own title at narrow widths — now hidden while
  the globe is open, verified at 390px.
- Confirmed driving mode (NightDrive) still works unaffected.

Recommended Focus For Tomorrow:
World 7 (Contact) and World 14 (Aisle) are the most overdue worlds — both
untouched since 2026-07-02, both flagged as "next" by several past sessions
that never got to them because the daily loop kept colliding on Worlds 1/9.

Risk Level: Low (additive, one world, shares existing audio/tuning code paths;
build + manual browser verification both green)

---
