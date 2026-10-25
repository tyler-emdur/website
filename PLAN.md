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

- [ ] **Emoji break the era.** `📁` is the PROGRAMS desktop icon
      (`World5Machine.tsx:978`), `📄` marks RECYCLED files, `📻` and `🔇` sit in
      the Garage and Broadcast. World 0 already ships a real icon pipeline at
      `/retro/*.svg` — use it. Era dingbats (`★ ✦ ♦ ✉`) are fine; color emoji
      are not.
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
- [~] **Shared reality reaches six of eleven worlds** (Departures added
      2026-10-24). Surface, Garage, Contact, Warehouse, Departures, plus the
      hub's terminal and the portal flood. Remaining and unblocked: Broadcast,
      the Directory. Blocked by the leave-alone list: Explorer, the Machine.
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

## Broadcast — execution plan (2026-10-24)

From a full audit of the dial: every feed probed for CORS, playlist validity,
declared signal and segment shape, plus thirty candidate channels vetted.
`scripts/probe-stream.mjs` is the tool; `lib/broadcast/reception.json` is the
record. Ordered so the repairs land before the additions — there is no point
widening a dial that is lying in three places.

**Found, and worth knowing before anything else:** finding new channels cannot
be done from memory. Thirty candidates assembled by analogy with the working
ones returned twenty-three dead, including twelve webcam IDs invented by
incrementing the two real ones. Camera IDs must come out of the provider's own
index. The one hit from a real index — `it_kronplatz07`, pulled off
whatsupcams' front page — needed its CDN host found by probe.

### P0 — repair the existing dial

- [ ] **Channel 05 does not show Istanbul when TRT drops.** Its understudies
      are DW English (Bonn) and France 24 (Paris), against a contract stated in
      `channels.ts`: *"different stations from the same place — the city stays
      the city."* Tune 05, lose the primary, and a German newsroom is labelled
      ISTANBUL. Either find real Istanbul feeds, or adopt Opatija's honest
      framing — *"a foreign signal drifting in when the cam drops"* — and say so
      in the comment. Opatija's version is deliberate and good; 05's is a
      shortcut wearing the same clothes.
- [ ] **One stream is the understudy on two dial positions.** The identical DW
      Bonn URL backs both 05 and 12. If TRT and the Opatija cam are both down,
      05 and 12 are the same picture on a dial whose whole premise is that each
      position is a different place. One has to go, and 12's is the one with a
      reason to exist.
- [ ] **Delhi's primary is a hard 404** (`cdn-2.pishow.tv/live/12/master.m3u8`),
      confirmed across every probe. The cascade covers it silently, so what
      anyone actually watches is the DD India understudy — but every tune to 02
      pays a failed request first. Promote the understudy, drop the corpse.
- [ ] **`chaotic` is unreachable.** Nothing derives to it, and channel 88 is
      `kind: 'custom'` and returns `<Channel88 />` before `ReceptionJitter` is
      ever reached, so its filter has never once been applied. Either wire it or
      cut it from the union.
- [ ] **Liveness still accepts a slate.** `/api/broadcast` tests only that the
      body starts with `#EXTM3U`, which is exactly how a geo-blocked station
      serving a rights notice reads as live — the RÚV trap, already written down
      in `channels.ts`. The probe script knows the stronger test: segment count
      above zero and no `#EXT-X-ENDLIST`. Tightening it risks darkening channels
      that currently work, so measure every feed against the new test first and
      only then change the route.

### P1 — recalibrate from the new data

- [ ] **`CLEAN_BITRATE` is overfitted.** 4 Mbps was picked from a dial whose
      clean feeds happened to sit at 4.2, 4.7 and 11.5. Arirang Seoul measures
      1920x1080 at 3.26 Mbps across four rungs and derives `grainy`, which is
      almost certainly wrong for adaptive full HD. Make the rule
      resolution-aware (1080p or better on three or more rungs is clean) rather
      than nudging the number until Seoul passes.
- [ ] **Window depth is measured and unused.** Reykjavik, Vientiane and Arirang
      all run three-segment windows; Istanbul runs six hundred. A three-deep
      window is one late segment away from stopping, and that — not bitrate — is
      what predicts a stall mid-watch. It should drive something.

### P2 — additions, both verified

- [ ] **KRONPLATZ** — `cdn-006.whatsupcams.com/hls/it_kronplatz07.m3u8`.
      CORS `*`, single playlist, no declared bitrate, 6s segments, 5-deep
      window; derives `grainy`, the same shape as Opatija and Saxon Harbor. A
      Dolomites ski slope is a kind of place this dial does not have — it is all
      harbours and newsrooms. Strongest single addition found.
- [ ] **ARIRANG, Seoul** — adaptive 1080p, CORS `*`, 4s segments. Real and
      usable, but it is a branded international broadcaster, nearer to TRT and
      DW than to the dial's obscure character. Hold until P1 fixes the bitrate
      rule, then decide on character rather than availability.
- [ ] **A real discovery pass.** whatsupcams' index exposed seven genuine IDs
      and the manifest URLs live on the per-camera pages, not the index. Walking
      those pages is the only honest way to widen the cam side of the dial.

### P3 — what this unlocks

The standing Broadcast item above asks for *"signal acquisition, not a swap."*
That is now buildable without inventing anything: a channel's real segment
length and window depth say how long it genuinely takes to fill a buffer.
Vientiane at twelve-second segments three deep should take visibly longer to
come in than Istanbul at six seconds six hundred deep. Tuning time derived from
the manifest, rather than a random delay dressed up as one.


## Housekeeping

Clear. The untracked `tylerAndrew.com` scaffolding prompt is gone; the only
`.md` files at the root are `CLAUDE.md`, `PLAN.md` and `PROGRESS.md`.

**Unmerged and undeployed:** `main` is at `ea95353`. Four sessions of work sit
on `hub-plain-language` → `motion-grammar` → `shared-sky` and the live site has
none of it. Vercel auto-deploys `main`, so that merge is Tyler's call.
