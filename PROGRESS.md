# Session Log

What actually happened, session by session. Identity, rules and the measurement
trap live in `CLAUDE.md`; the roadmap lives in `PLAN.md`.

Entries through July 2026 are in `docs/archive/PROGRESS-history-2026-07.md`.

---

## Template

Only these fields. The old eighteen-field version was mostly left blank — these
are the ones eight sessions of real entries actually used.

```
## YYYY-MM-DD — <one-line title>

Objective:      what, and which PLAN.md item it is
Why:            why it improves the site
Changes Made:   files, and what changed in each
Verification:   build, real-window check, what was actually confirmed
Discovered:     anything learned that outlives this session (optional)
Next:           recommended focus
Risk:           low / medium / high
```

Before finishing: run `next build`, verify navigation and mobile, confirm no
regressions. If the work made the site feel more generic, more professional, or
less mysterious — revert it and choose something smaller.

---

## 2026-08-10 — One sky over eleven worlds

Objective:
The shared-reality pillar: real Boulder time and weather reaching every world in
its own dialect, from one source.

Why:
Connectedness that isn't inventory following you around. The worlds don't share
objects — they share a *world*. It is the same hour in Boulder in all of them,
so the site is one place observed from eleven angles rather than eleven demos
behind one menu. It also satisfies the data rule: the garage's clock was a
hardcoded 12:47 AM, which is exactly the fabricated value the project bans.

Changes Made:
- `lib/environment.ts` (new) — real Boulder wall clock, weather, and solar
  altitude (NOAA low-precision, no dependency). Weather is cached across worlds
  for 15 minutes so walking the whole site costs one request, and stays null
  until it lands rather than substituting a number.
- World 0 reads it instead of running its own clock tick and weather fetch.
- World 6's dash clock and state line were hardcoded `12:47`; both are now real.
  The name stays "Midnight Garage" — that's the place's name, the way a diner
  called Midnight is still called that at noon.
- World 1's SYNC readout drifted off a random seed, so the hub disagreed with
  every other world. Now real Boulder time; the coordinate display's own glitch
  still carries the "unreliable instrument" idea.
- `HiddenTerminal`'s `git log` printed four invented commits while the real feed
  was already being fetched two files away. It now prints this repo's actual
  history with real short SHAs; `useSiteCommits` exposes `sha`.

Verification:
Build clean. At 3:25 PM Boulder time: surface `03:25 PM`, garage
`3:25 PM · engine off`, hub `SYNC 15:25:38`, weather 96F mainly clear — three
worlds, one clock. Terminal `git log` prints c057580 / 946de81 / 0176b12,
matching the repo. All 11 worlds render with zero JS errors.

Discovered:
`git log` first returned its failure line even though the fetch was fine — the
`exec` callback's dep array was `[flyTo, discoveredIds]`, so it closed over the
initial null commits forever. Worth remembering: a stale closure in a useCallback
looks exactly like a failed network request.

Next:
Cut the string pools (`AbstractIndex`, `GlitchOverlay`) and start the hub's
objects on real artifacts. Emoji breaking the era in the Machine.

Risk:
Low. One new module, three worlds, all verified against a real clock.

---

## 2026-08-10 — Every world gets a URL, and the gate index opens

Objective:
PLAN.md P5a plus the routing work Tyler asked for — give each world its own
address so links are shareable and the back button works.

Why:
The whole site was one route with the world held in a zustand store. No deep
links, no back button, no per-world titles, and `te-return-world` in
localStorage standing in for an address bar. Also: `PortalDirectory.tsx` gated
the only in-world route to nine worlds behind three "discoveries", which
register by clicking universe objects — so a first-time visitor clicked the one
visible affordance and was told no, by a mechanic they had no way to know about.

Changes Made:
- `lib/worlds.ts` (new) — canonical slug + in-fiction aliases + title per world.
  Plain slugs because people paste them (`/map`, `/machine`, `/garage`);
  aliases (`/kwnd`, `/emdur-486`, `/sector-02b`) redirect via next.config.
- `app/[world]/` (new) — one static page per world, `generateStaticParams` over
  the slug list, per-world metadata, `dynamicParams: false` so unknown slugs 404.
- `WorldManager` moved from `app/page.tsx` into the root layout. This is the
  load-bearing decision: because it never unmounts, moving between worlds keeps
  the store alive and the portal animates over a live scene. Pages only declare
  which world.
- `world-store.ts` — added `arriveAt()` for landing on a URL (no portal, since
  you didn't travel), removed `applyReturnWorld()` and the `te-return-world` hack.
- `WorldManager` syncs the URL both ways: `history.pushState` on world change
  (not the Next router, which would remount and kill the portal mid-animation),
  and a `popstate` listener so back/forward work.
- `PortalDirectory.tsx` — dropped the `discovered >= 3` lock entirely. Labels
  stay mangled, so the door is open but the contents are still unknown.
- `FrontDoor.tsx` — the reveal is driven by rAF, which browsers pause in
  backgrounded tabs; switching away mid-entrance left a door that would never
  open. Added a timeout fallback so the handoff always completes.

Verification:
`next build` clean; all 11 worlds prerender as static routes. curl: `/map` 200,
`/kwnd` → `/broadcast` 307, `/nope` 404. In a browser: `/map` loads World 2
directly with the right title and `data-world`; clicking the Garage tile on
`/surface` ran the portal and moved the URL to `/garage`; back returned to
`/surface`; the gate index opens with 0 discoveries showing all 10 gates.

Discovered:
**The automation trap caught me again, twice in one session.** The front door
appeared stuck after entering — I measured `visibilityState: "hidden"` and
**0 rAF frames in 1.5 s**, confirming the documented cause rather than a bug.
Then a second false alarm: `seen: null` showed my click had missed the button
entirely. Both would have been wrong findings. The one real thing that fell out
is the backgrounded-tab edge case, which is genuine in production and now fixed.

Next:
`lib/environment.ts` — shared reality. Real Boulder time, weather and sun
position, read by each world in its own dialect.

Risk:
Medium. Touches how every world mounts. Build green and the main paths verified,
but the portal animation itself can't be judged from automation — worth a real
click-through.

---

## 2026-08-10 — Identity source of truth, and a plan consolidation

Objective:
Collapse three divergent contact identities into one, then consolidate three
out-of-sync plan documents into a single roadmap.

Why:
The site had three email addresses across five screens, and a "last updated"
stamp frozen at June 30 while the newest commit was August 7. Three different
addresses doesn't read as layered fiction — it reads as an abandoned site with
several owners.

Changes Made:
- `lib/identity.ts` (new) — single source of truth for name, handle, email,
  city/region, coords, domain, GitHub, repo slug, role. Every identity string
  in the app now reads from it.
- `hooks/use-site-commits.ts` (new) — World 0 and World 5's terminal were each
  fetching the GitHub commits endpoint with different parsing. Now one hook.
- Email unified on `tyleremdur@gmail.com` across ten sites: front door, the
  hidden source comment in `layout.tsx`, World 0 (×4), World 7, machine data,
  hidden terminal (×2).
- The last-updated stamp now reads the live commit feed, with the build-time
  git date as fallback. If neither is known it **hides** rather than falling
  back to `new Date()`, which was the old behavior and printed today's date as
  a lie.
- `app/page.tsx` no longer returns `null` on first load — lays down the black
  ground with a dim name instead of a blank white frame.
- Docs restructured: `CLAUDE.md` (new, auto-loads), `PLAN.md` (roadmap),
  `PROGRESS.md` (this log), `docs/archive/` (four retired docs + README).
- `PROGRESS.md`'s world roster was wrong — listed a **Mall** that doesn't
  exist, called Warehouse 14 "Isle 14", and omitted Worlds 5, 8 and 10.

Verification:
`next build` clean, no type errors. Walked all eleven worlds in Chrome against
a production build. Confirmed the surface now reads August 7, 2026 from the
live feed, and `grep` for both old addresses returns nothing.

Discovered:
1. **The gate index is locked for every new visitor.** `PortalDirectory.tsx`
   gates the only in-world route to nine worlds behind three "discoveries",
   which register by clicking universe objects — so the door is held shut by a
   mechanic whose input a first-timer has no way to know exists. Now PLAN.md #1.
2. **July's plan had already found August's headline.** The immersion plan's
   "Later" list contains the hub's missing loading state, diagnosed from code a
   month before the browser pass rediscovered it.
3. **The trap caught me too.** `PLAN-immersion-2026-07.md` documents that
   automation tabs pause `requestAnimationFrame`; I measured the hub's black
   window in exactly that environment and reported a duration I shouldn't have
   trusted. The gap is code-confirmed; the timing isn't. Now caveated in PLAN.md.
4. **The front door shipped without its argument.** `PIVOT.md` exists to make a
   cold visitor understand who this is; commit `cfe83c3` stripped the
   positioning line the whole document rests on. Open Question 1.

Next:
PLAN.md #1 — unlock the gate index. One file, unlocks most of the site.

Risk:
Low. Additive plus string substitution; build and browser verification green.

---

## 2026-08-26 — The answering machine gets a room

Objective:
Take World 9 out of the void it was floating in, and cut the hub's two pools of
invented telemetry.

Why:
World 9 was the site's clearest example of the shape `CLAUDE.md` names as the
tell — one well-drawn object centered on black. `World9Answering.tsx` drew a
radial vignette, a machine, and a 10px bar under it labelled "table edge" that
was exactly as wide as the machine. Nothing it sat on, nothing behind it,
nothing else in frame. It was also the world that had gone longest without
attention (July 19).

The hub's corner terminal, meanwhile, printed `OBJECTS 47 [UNVERIFIED]` and
random-walked that number between 44 and 51 every seven seconds, next to a
status line drawn from twelve invented strings, over nine scattered markers
drawn from fifteen more. `getAllObjects()` was two imports away the whole time.

Changes Made:
- **`Room` in `World9Answering.tsx`.** Wall, window light, counter surface,
  front edge and lip, floor, the machine's shadow thrown up the wall, and its
  contact shadow on the counter. Every layer positions off the machine's own
  box — `top: 100%` is the countertop — so the object sits on something at any
  window size instead of hovering near a viewport percentage.
- **The room keeps the same clock the greeting does.** `ROOM_LIGHT` maps the
  five existing `HourMood` values to a second light source: a slab of daylight
  falling across the wall and continuing onto the counter, cool at midday,
  orange in the evening, gone after dark. The lamp comes up as it goes.
- **The phone line out is drawn, and it is real.** `/api/tape` now reports
  whether the tape directory is writable; the cord runs over the counter's front
  edge and out of frame when it is, and lies loose on the counter with the plug
  out when it isn't. Production is read-only, so on the live site the line is
  visibly unplugged — which is what the machine already said in words after you
  record, only now it says it before.
- Mail nobody opened, and a duplex outlet with **both** sockets occupied. One
  cord goes to the machine. The other goes down behind the counter, and there is
  nothing else in the room it could belong to. Never mentioned.
- `.room-prop` drops out under 720px and the stand-back margin under 780px tall,
  so narrow windows keep the wall, counter and shadow and lose only furniture
  that would be hanging off the frame.
- **`AbstractIndex.tsx`:** both string pools and the drifting count deleted. The
  corner terminal prints `OBJECTS n IN VIEW` (objects passing `isVisible`),
  `INDEXED n` (`discoveredIds.length`), and a status line derived from those two.
- **`GlitchOverlay.tsx`:** 17 transmissions down to 5. Everything naming a
  sector, node, or percentage that doesn't exist is gone. The fifth line names
  the object you opened most recently.

Verification:
`tsc --noEmit` and `next build` clean. Walked `/messages` in Chrome (DOM world —
screenshots are trustworthy here per `CLAUDE.md`): idle, playback with the
typing display, both `lineLive` branches, and both `day` and `latenight` light,
each forced temporarily and reverted. Narrow layout checked at 390px through an
iframe, since window resize doesn't move the automation viewport. On `/universe`
the corner terminal read `OBJECTS 34 IN VIEW / INDEXED 0 / SURVEY NOT BEGUN`,
and 36 fourteen seconds later as the timed objects surfaced — 49 objects total,
so the number is real and climbing.

Discovered:
1. **The wall was painting over the tape's display text.** The room's layers are
   absolutely positioned and the display card was in normal flow, so the wall
   won the paint order and the greeting typed out invisibly. `position:
   relative` on the card fixes it, and the comment there says why so the next
   person doesn't remove it.
2. **`next build` clobbers `.next` under a running dev server** and leaves it
   throwing ENOENT on every route until restarted. Cost a confusing minute.

Next:
World 7 is the last centered-card-on-black. The `Room` approach ports directly:
anchor off the object, one real second light source, two props that imply
something off frame.

Risk:
Low. World 9 is DOM/CSS and was verified by looking; the hub changes delete code
and read state that four other files already read.
