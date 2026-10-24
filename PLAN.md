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
- [ ] Where a value must stay fictional, give it a rule inside the world that
      generates it, so it behaves consistently instead of randomly.

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

Mystery works when there's something real underneath to find. Fifteen rotating
strings had nothing underneath.

## P5 — Navigable and revisitable

- [x] **Gate index unlocked** (2026-08-10). It gated nine worlds behind
      `discovered >= 3`, where a discovery registers by clicking a universe
      object — a door held shut by a mechanic a first-timer had no way to know
      existed. Now opens from the first second; labels stay mangled, so the
      contents are still unknown. Mystery in the contents, not the door.
- [x] **Every world reachable by URL** (2026-08-10).
- [ ] Clear path back to the hub from all of them.
- [ ] **Contrast floor:** any string teaching a control gets
      `rgba(255,255,255,0.55)` minimum. Atmosphere text stays dim. Interaction
      copy currently sits at `0.2`–`0.3`, below WCAG AA.
- [ ] **Hub loading state.** `UniverseRoot.tsx:14` lazy-loads ~1.2 MB of
      three.js *after* the portal commits, with no `loading` state — an empty
      black frame with nothing separating "loading" from "broken." Prefetch
      during Surface; give the wait a voice (World 2's `READING THE TRACE..` is
      the model). *Timing caveat: the duration measured in August came from an
      automation tab and isn't trustworthy. The gap is code-confirmed; its
      length isn't.*
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

## Housekeeping

Untracked `.md` (17 KB, 2026-06-06) at repo root — an early scaffolding prompt
for "tylerAndrew.com" / "Tyler Andrew", a different name and site. Recommend
deleting.
