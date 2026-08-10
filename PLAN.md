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

- [ ] **`HiddenTerminal`'s `git log` prints invented commits** while
      `hooks/use-site-commits.ts` fetches the real ones two files away. Point it
      at the real feed. Free, and strictly cooler.
- [ ] **Hub object descriptions are fake telemetry over real facts.** Pikes Peak
      — 14,115 ft, run in 3:00:00 — renders as `PEAK-14115 / Geological spire.
      Local gravity variance: +1.2%`. The real fact is more interesting than the
      fiction wrapped around it. Rewrite `lib/universe-store.ts` descriptions to
      lead with the true thing.
- [ ] **Audit every numeric readout** for whether it's sourced or invented.
      Known-real: Explorer coverage, Departures reads, weather, commits, boot
      count. Known-invented: universe object counts, `FIELD INTEGRITY CHECK`,
      coordinate glitches.
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
- [ ] **Contact:** a genuine endpoint/signal lock, not a generic mystery reveal.
      The press-and-hold interaction is good; the space around it isn't a place.
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
- [ ] Tell the user when cross-world state fires. An unannounced consequence is
      indistinguishable from no consequence.
- [ ] **A second visit should differ from the first.** `visited_worlds` and
      `world_secrets` already persist and nothing consumes them.

## P4 — Cut filler

- [ ] **Delete `AbstractIndex.tsx`'s 15-string marker pool and 12-string status
      pool.** Randomly scattered `UNMAPPED ANOMALY` / `ORIGIN UNKNOWN` /
      `POSITION DISPUTED` is decorative telemetry that changes nothing the user
      can do — the exact "meaningless" category `CLAUDE.md` bans.
- [ ] Same pass on `GlitchOverlay.tsx`'s phrase pool.
- [ ] Cut repeated mystery phrasing that doesn't reveal new structure.
- [ ] Cut anything that exists only to sound cool.

Mystery works when there's something real underneath to find. Fifteen rotating
strings have nothing underneath.

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
- **Give the object a room** — World 9, then World 7. Both DOM, both a centered
  card on black. Reuse the Broadcast approach: anchor floor/seam/shadow off the
  object, not the viewport.
- **Explorer is still not a place.** Its session was triage only.
- **`RESUME.TXT` on the desktop** — proposed in the pivot, never built. World 5
  already has `resume_2019.doc` in `RECYCLED` as a joke about deleting it; an
  earnest one beside it undercuts the better gag. Probably drop.

## Housekeeping

Untracked `.md` (17 KB, 2026-06-06) at repo root — an early scaffolding prompt
for "tylerAndrew.com" / "Tyler Andrew", a different name and site. Recommend
deleting.
