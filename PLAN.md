# Roadmap

Ranked goals auto-load from `CLAUDE.md`. This file is the detail behind them.
Rules and the measurement trap live in `CLAUDE.md`; nothing here overrides them.

**Thesis:** the site is strongest where it is *mechanically real* — Explorer's
street coverage, Departures' cameras and read counts, the Machine's file system
and boot state, live weather and commits. It weakens where generic "mysterious
internet artifact" language stands in for structure. The problem isn't too much
lore; it's lore substituting for platform logic, interface identity, and things
the user can actually do.

**Every world should feel like its own operating system, interface, or
environment** — with its own rules, conventions, and visual language.

---

## Priority order

1. Make the worlds technically believable
2. Give each world a distinct interface identity
3. Connect worlds through persistent mechanics
4. Cut filler and generic mystery language
5. Keep the site easy to navigate and revisit

**Prerequisite, not a competing priority:** unlock the gate index (P5a below).
It's one file and roughly an hour, and until it's done a first-time visitor
can't reach nine of the eleven worlds — so none of P1–P4 is visible to anyone
new. Do it first, then work the order above.

---

## P1 — Technically believable

**The rule:** if a world presents something as data, state, or system output,
it must either be real or be clearly fictional *by design* — part of that
world's internal system, never an accidental-looking placeholder. If it can't
be made real, remove it or replace it with something interactive.

- [x] **`HiddenTerminal`'s `git log` reads the real feed** (2026-08-10, in the
      identity pass). It had been printing four invented commits.
- [x] **Hub object descriptions rewritten** (2026-10-23). All 50 now lead with
      the true thing; Pikes Peak reads "14,115 feet, 13.3 miles of it uphill,
      three hours exactly." The `lore` field is **gone from the interface** along
      with its 35 strings, so the second invented voice can't return. Five
      objects describe their own reveal rule, which pays part of P3 in copy.
- [x] **Numeric readouts audited across the hub** (2026-10-23). `FIELD
      INTEGRITY CHECK` and the other 15 `CartographyLayer` labels are gone (7
      remain, each anchored to something really at that coordinate); the
      coordinate glitch and `redact()` are deleted; the terminal's `weather`
      prints the real Boulder temperature instead of invented mSv/h; `uptime`
      reads the real visit length. Known-real now also: the object panel's
      stamp, which reads `visited` from the world store.
      **Blind spot worth remembering:** a lowercase-pattern grep missed all 16
      caps-locked `CartographyLayer` labels. Grep the rendered DOM, not just the
      source.
- [~] Where a value must stay fictional, give it a rule inside the world that
      generates it, so it behaves consistently instead of randomly.
      *(Worked example, 2026-10-24: Departures' TIME column. The rows are still
      the board's own ordering rather than observed reads — nothing there has
      ever watched your car — but they run from the real Boulder minute now
      instead of a hard-coded 04:00, so at 3am the board says 3am. Fiction with
      a rule, anchored to something true.)*

## P2 — Distinct interface identity

**Start from what's already there.** The Machine is much closer than it looks
from the boot screen — `World5Machine.tsx` already has draggable windows with
z-order, a taskbar, a start menu, minimize, right-click context menus,
Minesweeper, Tetris, a working `C:\` shell with `DIR`/`CD`, and ten program
EXEs. Don't rebuild it. Close the specific gaps:

- [ ] **Emoji break the era.** `📁` is the PROGRAMS desktop icon, `📄` marks
      RECYCLED files, `💾 🌐 😵 💣 🗑` sit on the desktop and in Minesweeper,
      `📻` and `🔇` sit in the Garage and Broadcast. World 0 already ships a
      real icon pipeline at `/retro/*.svg` — use it. Era dingbats
      (`★ ✦ ♦ ✉`) are fine; color emoji are not.
      **Blocked on a ruling** (2026-10-24): this is the most era-breaking thing
      left in World 5, and World 5 is on CLAUDE.md's "done, do not restyle"
      list. Swapping icons is restyling. Needs Tyler's yes.
- [ ] **Machine:** window conventions of the era — a menu bar with File/Edit/
      Help that actually opens, modal dialogs with OK/Cancel, a title-bar system
      box, keyboard focus. Convincing beats decorative.
- [ ] **Broadcast:** should read as a live signal environment, not a page with
      static graphics. Channel changes should feel like tuning — signal
      acquisition, not a swap.
- [x] **Contact is a place** (2026-10-23). It is the closet the Machine's README
      already said this site is served out of: shelf, bracket, antenna lead with
      a strain loop, power strip, taped drywall seam, masking tape reading 88.7.
      Light under the door runs on the real Boulder clock, and at night there is
      none — the set's phosphor and one LED are the only light. The corner of
      the 486 is on the same shelf, three inches of it, out of frame.
- [ ] **Surface:** an old personal homepage, not a modern landing page wearing
      nostalgia. Mostly there already.
- [ ] Each world gets one interaction model that is *only* its own.

## P3 — Connect worlds through persistent mechanics

Right now it reads as eleven demos behind one menu. One direction of cross-world
state exists — `visible: { visited: n }` reveals hub objects as you explore —
and the visitor is never told, so it may as well not.

- [ ] Extend the existing store (`lib/world-store.ts`, `lib/universe-store.ts`)
      rather than adding a parallel system. One source for identity, world
      state, discoveries, navigation — the way `lib/identity.ts` is now the one
      source for identity strings.
- [~] **Shared reality reaches seven of eleven worlds** (Departures and the
      Machine added 2026-10-24). Surface, Garage, Contact, Warehouse,
      Departures, the Machine, plus the hub's terminal and the portal flood.
      Remaining and unblocked: Broadcast, the Directory. Blocked by the leave-alone list: Explorer.
      **World 9 is a deliberate exception** — it reads the *visitor's* clock on
      purpose ("it's the middle of the night where you are"), and Boulder time
      would break the one thing that world is about. Leave it.
- [ ] **Make shared state physical and visible:**
      the station tuned in the Garage keeps playing while you walk Warehouse 14 ·
      the item taken in the aisle stays in your basket across worlds ·
      the plate looked up in Departures appears on the answering machine ·
      files recovered in the Machine unlock hub entries
- [~] Tell the user when cross-world state fires. An unannounced consequence is
      indistinguishable from no consequence. *(Partly done 2026-10-23: the hub
      panel now stamps VISITED on worlds you have been to, reading the
      `visited` array that had persisted for months with nothing consuming it.
      Five object descriptions state their own reveal rule.)*
- [ ] **A second visit should differ from the first.** `visited_worlds` and
      `world_secrets` already persist and nothing consumes them.

## P4 — Cut filler

- [x] **`AbstractIndex.tsx`'s two pools are gone** (2026-08-26). Fifteen
      scattered markers and twelve rotating status lines deleted, along with an
      object count that random-walked 44–51 behind `[UNVERIFIED]`. The corner
      terminal now prints how many objects have surfaced for you, how many
      you've opened, and the survey state that follows from those.
- [x] **`GlitchOverlay.tsx`'s pool cut 17 → 5** (2026-08-26). Everything naming
      a sector, node, or percentage that doesn't exist is gone; the last line
      reads back the object you opened most recently.
- [x] **`AmbientTransmissions.tsx` deleted** (2026-10-23) — the last and
      largest pool, 43 strings. Its `DEEP` band flattered the reader ("you have
      stayed longer than most · the map remembers this"); the map did not
      remember this. Flattery-as-atmosphere is the most AI-shaped register there
      is — watch for it returning anywhere.
- [x] **The hub's duplicate readouts collapsed** (2026-10-23). `scan` and
      `status` were two terminal commands over the same facts, one of them with
      three invented faults. One readout, two names.
- [x] **Every remaining world read with this lens** (2026-10-23). Only two
      strings survived it, both in Channel 88, both telling the visitor they
      were special; they now state facts about the dial, computed from
      `CHANNELS`. **Broadcast, Garage and Explorer were already clean** — real
      HLS streams and cities, real Colorado road signs over real FM, real Strava
      figures. The note above accusing "World 2's HUD" was wrong.

- [x] **Departures' fake telemetry removed** (2026-10-24). `READS ON FILE
      40,331`, climbing three a second from an invented base, was the only
      invented number on a board of real OpenStreetMap cameras. It counts
      something real now. The clock above it said BOULDER and printed the
      visitor's own timezone; the index line below it names the actual source
      and bake date, both of which were in `alpr.json` and unread.
      **Worth remembering:** the string-pool lens does not catch this class.
      These were arithmetic, not prose, and the 2026-10-23 sweep marked
      Departures clean because it was looking for sentences.

- [x] **The machine's invented traffic removed** (2026-10-24). SRVHOST.EXE
      fabricated its entire log — visitors from ten cities, request times,
      memory use, a carrier that drifted 15% of the time — under a header
      reading `visitors now: 3`, hard-coded. It reports the one connection it
      really has now. The hub terminal's `INTERCEPTED_TRACKS` (seven radio
      intercepts at invented frequencies) and its `ps` table (invented CPU
      times, one of them `Math.random()`) went with it.
      **The lens that found these:** grep `Math.random` and read every hit in a
      text position. Two October sweeps missed all of it because they were
      looking for prose, and `visitor #${n} connected (${CITIES[r]})` is a
      template made of arithmetic.

Mystery works when there's something real underneath to find. Fifteen rotating
strings had nothing underneath.

## P5 — Navigable and revisitable

- [x] **Gate index unlocked** (2026-08-10). It gated nine worlds behind
      `discovered >= 3`, where a discovery registers by clicking a universe
      object — a door held shut by a mechanic a first-timer had no way to know
      existed. Now opens from the first second; labels stay mangled, so the
      contents are still unknown. Mystery in the contents, not the door.
- [x] **Every world reachable by URL** (2026-08-10).
- [x] Clear path back to the hub from all of them. `HomeButton` is in all nine
      worlds that need one; the two without it are the front door and the hub
      itself.
- [ ] **Contrast floor:** any string teaching a control gets
      `rgba(255,255,255,0.55)` minimum. Atmosphere text stays dim. Interaction
      copy currently sits at `0.2`–`0.3`, below WCAG AA.
- [x] **Hub loading state** (2026-10-24). The hub boots now, in the corner
      terminal's dialect, and every line on the panel is true — `PLOTTER`
      tracks whether the renderer exists, `CATALOG` is the real catalog size,
      `SYNC` is the real Boulder clock. The honest answer to "is this loading
      or broken" turned out not to be a progress bar (invented progress is the
      banned kind of telemetry) but one number that is really moving. The seven
      DOM overlays now wait for the renderer instead of painting over an empty
      canvas. *Still open: prefetching the chunk during Surface. And the
      length of the gap remains unmeasurable from here.*
- [ ] Strangeness shouldn't become friction. Opaque is fine; unnavigable isn't.

---

## Decided 2026-08-10 — both open questions closed

**1. The front door stays minimal.** Name, city, GitHub, email, enter. The
positioning line is retired and `docs/archive/PIVOT.md`'s goal with it — the
multiverse is the signal, and anyone who matters will ask. Audience is still
*both, layered*; the layering now happens through URLs rather than copy.

**2. World 8 does look empty.** Tyler confirmed in a real window. The middle is
real work, and Departures is no longer off-limits.

**Also decided:** hub becomes a map of real artifacts · connectedness means one
design grammar + shared reality (time/weather) + quiet echoes, *not* inventory
following you · audio stays per-world and opt-in · free to restructure Contact,
Broadcast and the hub text layer, but not Surface, the Machine, Explorer or
Warehouse without discussion.

## Shipped 2026-08-10 — routing

Every world now has a URL. `lib/worlds.ts` owns slug + aliases; `WorldManager`
moved to the root layout so in-site portals still animate while the address bar
follows along via `history.pushState`; direct URLs hard-load through
`app/[world]/`. Aliases redirect. The gate index no longer locks. The
`te-return-world` localStorage hack is gone — it only ever existed because there
were no URLs.

**Next:** `lib/environment.ts` — shared reality. Real Boulder time, weather and
sun position, read by each world in its own dialect. The Garage is hardcoded to
12:47 AM; it should be the real hour, dark or bright accordingly.

## Blocked

**Warehouse 14 shadows** — nothing in the project casts a shadow, so lighting
that already does real work (`AisleCanvas.tsx:735-800`) lands on nothing.
Enable soft PCF on the Canvas (`:986`); **do not shadow-map the point lights**
(three of them is six cube faces each, per frame, in an infinite corridor) — one
shadow-casting light riding the camera instead; contact shadows under everything
on the floor; procedural env map via drei `<Environment>` + `<Lightformer>` to
make the racking's metalness (`:463,472`, 0.8, no env map anywhere) read as
metal. **Blocked on a frame-time baseline from Tyler** — frame time can't be
measured from automation. Items 3–4 are safe independently of item 2.

## Later — not scheduled

- **No sound layer.** Five worlds have audio; none survives a transition, and
  there's no ambient bed. One persistent WebAudio context with per-world beds
  crossfading *through* portals would do more for presence than any geometry.
- **The hub is a pannable poster.** `CameraRig.tsx:124-136` never rotates —
  drag translates X/Y, scroll translates Z, `lookAt` always targets the camera's
  own x/y. Orbit-and-dolly with real Z spread would make the same 47 objects a
  volume.
- **Transitions are curtains over a hard cut.** `completePortal()` fires on a
  fixed `setTimeout` that knows nothing about whether the destination mounted.
  Same root problem as the hub loading state.
- **Give the object a room** — World 9 (2026-08-26) and **World 7 (2026-10-23)**
  are done. Every layer anchors off the object's own box rather than a viewport
  percentage, which is the part worth copying — and that applies to the *light*
  too: World 7's door was first pinned at 68% of 100vw and sat behind the
  receiver at some widths. A second lesson from it: a near-vertical gradient on
  a 240vh element drifts out of frame; make it exactly 90deg.
  No world is currently a bare object on black.
- **Explorer is still not a place.** Its session was triage only. It is now the
  world that has gone longest without attention, and six hub objects make
  promises about it (2026-10-23) — but it is on the "leave alone unless
  discussed" list, so it needs Tyler's go-ahead.
- **`RESUME.TXT` on the desktop** — proposed in the pivot, never built. World 5
  already has `resume_2019.doc` in `RECYCLED` as a joke about deleting it; an
  earnest one beside it undercuts the better gag. Probably drop.

## Broadcast — what the audit left (2026-10-24)

The audit's repairs and recalibration are done, and the tuner now reports the
real acquisition instead of the word TUNING (see `PROGRESS.md`). What is left:

- [ ] **The discovery pass is only started.** whatsupcams' directory is four
      levels deep — country, region, place, camera — and the manifest URL lives
      on the camera page. `scripts/find-cams.mjs` walks it. The first full walk
      produced one new manifest beyond Kronplatz, Mostar's Old Bridge, and that
      one 404s from the provider's own page: even a real index lists dead
      cameras, so every candidate still has to answer `probe-stream.mjs`. The
      cam side of the dial is where it can still grow — it is mostly newsrooms.
- [ ] **Arirang, Seoul — decided against, not blocked.** It measured clean and
      usable, and under the new resolution-aware rule it would derive `clean`
      rather than `grainy`. It is a branded international broadcaster, and the
      dial already carries TRT and DW; a third one buys availability at the cost
      of the character the obscure feeds give it. Revisit only if two cities go
      dark at once.
- [ ] **Dushanbe still cannot be measured.** Its host resolves and never
      completes a connection from here, through every header combination, at 25
      seconds. It is the one channel left wearing a hand-written reception
      label, and there is no way to tell a dark station from one that declines
      to talk to this machine without asking from somewhere else.
- [ ] **TELE1 flaps.** Istanbul's third feed answers 200 one minute and 404 for
      the next ten, with no pattern in the headers. It sits third in a cascade
      and costs nothing when it is down, but it is the reason the baked record
      shows a live newsroom as dark: a bake is a snapshot, and a flapping
      station is whatever it was at the moment it was asked.

## Housekeeping

Clear. The untracked `tylerAndrew.com` scaffolding prompt is gone; the only
`.md` files at the root are `CLAUDE.md`, `PLAN.md` and `PROGRESS.md`.

**Merged.** Everything that was stacked up on `hub-plain-language` →
`motion-grammar` → `shared-sky` → `authentic-sweep` is on `main` at `c05cccf`,
and `main` auto-deploys, so the live site now has all of it.
