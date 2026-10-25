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

## 2026-08-14 — The warehouse gets opening hours

Objective:
Make Warehouse 14 a place that is different depending on when you walk into it,
using the shared clock the rest of the site already runs on.

Why:
Two gaps, both in the code rather than in the concept.

World 14 was the only world outside `lib/environment.ts`. "One sky over eleven
worlds" reached the surface and the garage; the warehouse ignored it — and it
is the one world on the site with a legitimate reason to be *shut* when you
arrive, which is the strongest dialect the shared clock had available anywhere.

And `StockItem.star` was dead data. There is a comment in `aisle-data.ts`
explaining the death-star asterisk, and a gem (`the-asterisk`) whose entire
flavor text explains what an asterisk in the corner of a sign means — but no
sign in the world had ever had one. The world was explaining a mechanic it did
not have.

Changes Made:
- `warehouseHours()` in `aisle-data.ts` — real posted club-store hours (Mon–Fri
  10:00–20:30, Sat 9:30–18:00, Sun 10:00–18:00) read against Boulder's real
  weekday and clock. Returns `open` / `lastCall` / `closed`, the countdown, and
  the line the door sign prints.
- The building now runs on it. `Sky` (daylight, phase, dimming) threads through
  `AisleCanvas`: skylights carry the actual solar elevation over Boulder, the
  sun pool light and the shadow caster go out with the real sun, and the caster
  swings overhead after dark so night shadows point down instead of vanishing.
- Closing time is not a fader. Fixtures die in banks across the last half hour
  (the roll is drawn *after* the three existing ones, so the daytime aisle is
  dealt exactly as before), then the building settles to night-crew lighting.
- The night crew's floor scrubber — parked mid-aisle at idx 26, amber beacon
  still turning, squeegee dropped, wet floor behind it, sign folded open across
  the aisle. Present only when the doors are actually locked.
- The asterisk renders: top-right of the 3D shelf tag via a new `corner` slot in
  `makeLabelTexture`, and on the HUD tag. Never explained. 41 of the first 300
  slots carry one; the first is at index 0.
- HUD posts the hours and the live notice. Two PA lines that fire on the real
  clock rather than on depth. Receipt stamps `SALE RUNG OUTSIDE POSTED HOURS`.

Verification:
`tsc --noEmit` and `next build` clean. `warehouseHours()` unit-checked against
ten constructed instants including both open/close boundaries, the Sat 9:30
exception, and both day-rollovers — all ten correct. Walked `/warehouse` in
Chrome against the dev server: HUD reads `9:30 AM — 6:00 PM · CLOSED · OPENS
9:30 AM` (correct — it was past Friday close in Boulder), slot 0 renders
`$3.97*`, no console errors on load or reload.

**Not verified: the night lighting.** Per `CLAUDE.md` an automation tab cannot
be trusted for brightness in an R3F world, and this change is almost entirely
brightness. The numbers were chosen so the fluorescents do *not* dim with the
sun — a club store at 8pm is fully lit and only the sky is missing — and so the
closed building sits near 58% house output with ~70% of fixtures dark. Whether
that reads as "night crew" or as "broken" needs a real window.

Discovered:
1. The sign contradicted itself after closing — it posted today's hours while
   announcing tomorrow's opening. Fixed: past close, the sign posts the next
   day's row.
2. The world already contained the asterisk's *explanation* before it contained
   a single asterisk. Worth watching for elsewhere: lore written against a
   mechanic that was never built.

Next:
Look at the closed warehouse in a real window and tune the night exposure. The
levers are `house`, the two `sunlit` mix constants in `Atmosphere`, and
`dimming` for `closed` in `World14Aisle`.

Risk:
Medium — additive in structure, but it moves the exposure balance in a world
whose own file warns that the balance can only be checked by looking.

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

---

## 2026-08-26 (2) — The hub could not be panned on a phone

Objective:
Chase down a report that the site is hard to move around on a phone.

Why:
`CameraRig.tsx` hand-rolls the hub's camera on raw pointer events, and neither
it, `UniverseCanvas.tsx`, nor `UniverseRoot.tsx` ever set `touch-action`.
Verified in the browser: `touch-action` computed to `auto` on the canvas and
every ancestor up to `<html>`. On a touch device that means the browser claims
any one-finger drag as a scroll gesture, fires `pointercancel`, and stops
delivering `pointermove` — so the hub's pan died on the first swipe. There was
no `pointercancel` handler either, so `dragActive` then stayed true forever.

And zoom was bound only to `wheel`. A phone has no wheel, so a visitor arrived
at z=1640 in a range of 55–9000 and could never move along it.

The hub is the one screen you have to move around in to reach anything, which
is exactly the shape of the report.

Changes Made:
- `touch-action: none` on the hub's Canvas, which lands on R3F's container div
  and covers the canvas by the ancestor-intersection rule.
- **Pinch-to-zoom**, and `pointercancel` handled as `pointerup`, with
  `releasePointerCapture` to match the existing `setPointerCapture`.
- `lib/pointer-gestures.ts` (new) — the drag/pinch bookkeeping as a pure state
  machine, so `CameraRig` is just the adapter that turns its output into camera
  moves. It also encodes the lurch fix: lifting one finger of a pinch does not
  hand the drag to the survivor.
- `scripts/check-gestures.mjs` (new) — 19 assertions over that module.
- `@media (pointer: coarse)` in `globals.css`: the gate index tab, the only way
  into nine worlds, was a 22px-tall target. Now 44. Gates go to 52, and the
  `:hover` style is neutralised on touch, where it sticks after a tap and leaves
  a gate looking selected. Keyed on pointer type, not width — a small laptop
  window is still a mouse.
- Same one-line fix on the Machine's window title bars, which drag on pointer
  events and would have been stolen the same way.
- Removed a dead `idleTime` counter in `CameraRig` that was calling
  `clock.getDelta()` every frame. Nothing read it, and R3F calls `getDelta()`
  itself — the extra call was stealing the delta from the next frame.

Verification:
`tsc --noEmit` and `next build` clean. All 19 gesture assertions pass. Against
the production build in Chrome: `touch-action` now computes to `none` on the
canvas's container, the `(pointer: coarse)` block is present and parsed in the
CSSOM, a real mouse drag throws nothing, and synthetic `pointerType: 'touch'`
sequences — one-finger pan, two-finger pinch, lifting one finger of a pinch,
and `pointercancel` mid-drag — all run through the live handlers with an empty
console.

**Not verified on a real phone.** The gesture logic is unit-tested and the
`touch-action` value is confirmed in a real browser, but nobody has put a thumb
on it. Whether the pinch *speed* feels right (`PINCH_SPEED = 2.2`) is a
judgement only a real device can make.

Discovered:
1. **`/map` and `/garage` were never broken.** Their canvases read
   `touch-action: auto` in the automation tab, which looked like the same bug —
   but three-stdlib's `OrbitControls` sets `touchAction = "none"` on connect
   (`OrbitControls.js:300`), and it simply hadn't connected because R3F never
   ran in a hidden automation tab. The CLAUDE.md trap, caught before it became a
   fifth wrong finding. The fix came from reading `node_modules`, not the DOM.
2. `touch-action` does not inherit, but the browser intersects it up the
   ancestor chain — which is why the warehouse, whose `none` sits on a wrapper
   two levels above its canvas, was fine all along.

Next:
Ask Tyler to try the hub on a phone and say whether the pinch is too fast.

Risk:
Low on desktop — the mouse path is the same one-pointer branch it always was,
and it was exercised. Medium on touch only in the sense that it is new
behaviour nobody has felt yet.

---

## 2026-10-23 — The hub stops making things up

Objective:
P1 ("hub object descriptions are fake telemetry over real facts") and P4 ("cut
filler", "cut anything that exists only to sound cool"), triggered by Tyler
reading the site cold: *"a lot of it just sounds super AI language... some of it
just needs to go back to the basics, think berkshirehathaway.com."*

Why:
The complaint localised almost entirely to World 1. Across the hub there were
**151 invented strings**, and 41 of the 50 object descriptions were the same
sentence:

    [Adjective] [technical noun]. [Label]: [value]. [Label]: [value].

Not one of the values was real. The template was the tell — a reader does not
consciously count to forty-one, they just stop believing the screen. Meanwhile
Warehouse 14, `catalogue-data.ts`, Departures and World 9 are written in a voice
nobody would mistake for generated text ("A dollar fifty. It has been a dollar
fifty since 1985 and it will be a dollar fifty after the building is gone").

The difference is not tone, it is **reference**: the good copy names something
you could point at, the filler names a category and bolts a number to it. That
is also the actual lesson of the Berkshire page — it is plain because every link
goes to a real document. Plainness is the residue of having something real
underneath. The hub was ornate because it had nothing underneath yet.

Changes Made:
- **`lib/universe-store.ts`** — all 50 descriptions rewritten to one true
  sentence; the `lore` field and its 35 strings **deleted from the interface**,
  so the second voice can't come back. `PEAK-14115 / Local gravity variance:
  +1.2%` is now *"Pikes Peak. 14,115 feet, 13.3 miles of it uphill, three hours
  exactly."* Region designations carry what the sector holds (`SECTOR 02-B ·
  RUNS`) instead of an invented fault (`[SURVEY DETAILED]`).
  Five objects now describe **their own real reveal rule** — BEACON-04-Δ says it
  only surfaces after twenty seconds, RELAY-00 says it appeared once you had
  opened four things. P3's "an unannounced consequence is indistinguishable from
  no consequence", paid for by copy rather than new machinery.
- **`AmbientTransmissions.tsx` deleted** (43-string pool). Its `DEEP` band
  flattered the reader — *"classification: patient · rare"*, *"you have stayed
  longer than most · the map remembers this"*. The map did not remember this.
  The hub still has three text layers, all reading real state.
- **`CartographyLayer.tsx`** — 16 floating annotations → 7. Every grid, arc,
  ring and crosshair kept (that geometry is what makes the void a room); the
  labels now sit on something really at that coordinate: `DATUM · 40.0150°N
  105.2705°W`, `WORLD 4 · NEVER BUILT` on the gate that points at nothing.
- **`components/hud/HUD.tsx`** — `getClassificationStamp()` was a `switch` on
  `obj.type`, so every anomaly read CORRUPTED and every station read STABLE: the
  type restated in scarier letters. It now reads `visited` from the world store
  — VISITED / OPEN / NEVER BUILT / NO EXIT. **That store has persisted for
  months with nothing consuming it** (PLAN.md P3). Also deleted: `redact()`,
  which blanked random words with `██████` off `Math.sin(i * 4.3 + w.length)`,
  and the coordinate readout's self-corruption into `['ERR_0','NULL','???','LOST']`.
  Faking a fault on top of a true number only makes the true number look
  invented too.
- **`HiddenTerminal.tsx`** — `weather` printed four invented sensor lines
  (barometric pressure, gravity, a dose in mSv/h) while `lib/environment.ts` was
  already holding the real Boulder temperature, shared by every world. It now
  prints it. `scan` and `status` were two commands over the same facts, one of
  them with three invented faults; collapsed to one readout under both names.
  `ARCHIVE_RECORDS` and `VOID_READOUTS` pools gone with `fortune`. `uptime` was
  "days since epoch" and a fake load average — now the real length of this visit
  from `visitStartTime`. `about` and `whoami` plainer.
- **`World7Contact.tsx`** — the worst sentence on the site (*"it was only ever
  one person, in boulder, making things at 3am and pointing them at the dark"*)
  replaced with *"the address below is real, and goes to a person rather than a
  form."* Its `47 OBJECTS CATALOGUED` fragment was stale besides — AbstractIndex
  stopped claiming 47 in August — now `ELEVEN WORLDS`, which is checkable.
- **`lib/identity.ts`** — `doing: 'Builder of worlds'` → `'Amateur webmaster'`.
  `role` already makes the serious claim; this is what a homepage of World 0's
  vintage would actually have said.
- **The detail this session ships:** `88.7` is a real command in the hub
  terminal. The frequency is stamped on the machine's README, the broadcast
  dial, the garage radio and the endpoint's carrier — five worlds carrying one
  number with nothing that answered to it. `88.7`, `88.7 mhz` and `887` all
  resolve. Not in `help`.

Net: **−427 / +232**, 195 lines of filler gone.

Verification:
`tsc --noEmit` and `next build` clean. All gesture assertions still pass. Against
the production build in a real Chrome tab, by DOM text rather than screenshot:
the seven cartography labels render, `status` prints the per-sector opened counts
off the store, `88.7 mhz` resolves through the alias, and `weather` returns
**63°F · overcast · 9:27 PM · sun down** — correct for Boulder this evening.
All eleven world routes return 200.

**Not verified in a real window:** the object panel's new VISITED/OPEN stamp.
Reaching it means clicking a 3D object, and R3F never initialises in an
automation tab — the CLAUDE.md trap. The stamp is code-confirmed and type-checked
only. Worth thirty seconds of Tyler clicking a gate.

Discovered:
1. **An all-caps grep blind spot.** My first sweep for filler matched on a
   lowercase `[a-z] [a-z]` pattern and so missed all 16 `CartographyLayer`
   labels, including `FIELD INTEGRITY CHECK: PASSING` — which PLAN.md had
   *already* flagged as invented. They only turned up when the hub's DOM text
   was read in a browser. **Grep the rendered page, not just the source.**
2. **A stale `next start` will lie to you convincingly.** `pkill` then immediate
   restart raced: the new server hit `EADDRINUSE` and the old process kept
   serving the previous build, so a verified-looking browser check showed all 16
   old labels still present after a clean edit and a clean build. Always confirm
   `✓ Ready` in the server log, not just a 200.
3. **I introduced a stale-closure bug and the honest message hid it.** Adding
   `env` to `buildCommands` without adding it to the `run` callback's dep array
   meant the handler kept the first render's environment forever: `weather`
   reported the station unreachable for an entire visit while the request had
   already returned 200. `commits` was in the deps, which is why `git log`
   worked and masked it. The fallback copy now says "no reading yet." rather
   than asserting a failure it cannot distinguish from a pending fetch.

Next:
Explorer (`World2Explorer`) — its one session was triage only, it is the world
that has gone longest without attention, and six hub objects now make promises
about it. Then World 7's room: the endpoint copy is honest now but it is still a
centered card on black, which PLAN.md already has queued behind World 9.

Risk:
Low. No geometry, layout, routing or mobile surface touched — the one removed
element was a `position: fixed` text layer. Every change is copy, a deletion, or
a readout now sourced from state that was already there.

---

## 2026-10-23 (2) — The endpoint gets the closet it was always served from

Objective:
Finish the de-slopping sweep outside World 1, then PLAN.md's "give the object a
room — **World 7 is still a centered card on black** and is next."

Why:
Having fixed the hub, I read every remaining world's strings with the same lens
(reference, not tone) before assuming where the problem was. It mostly wasn't
there: the Broadcast's lineup is ten real HLS streams with real cities and real
operator notes; the Garage's road signs are real Colorado ("ELEV 5430", "RUNAWAY
TRUCK RAMP 1 MILE", "ICES BEFORE ROAD") over real FM streams; Explorer's HUD is
four Strava figures and a street-coverage percentage. **My own PLAN.md note
accusing "World 2's HUD" was wrong, and checking took four minutes.**

What was left was two strings and a shape. World 7 was the shape CLAUDE.md names
as the tell: one well-drawn object centered in a black void.

Changes Made:
- **`Channel88.tsx`** — two of four `STRANGE_MESSAGES` were ominous about
  nothing: "IT HAS BEEN WATCHING SINCE BEFORE YOU ARRIVED" and "YOU ARE NOT
  SUPPOSED TO BE ABLE TO TUNE THIS IN." The second is this site's worst habit —
  telling the visitor they are special. Replaced with two facts about the dial,
  **computed from `CHANNELS`** rather than retyped, so they stay true if the
  lineup changes: "THE DIAL RUNS 02 TO 44. THIS IS 88." and "THE OTHER 9 EACH
  COME FROM A CITY. YOU CAN LOOK THEM UP. THIS ONE HAS NO CITY."
- **`World7Contact.tsx` — the room.** The Machine's README already said where
  this is: the site is served "out of a closet in Boulder, Colorado, on a
  carrier of 88.7 MHz." So the receiver now sits on a shelf in that closet.
  Technique copied from World 9, which is the part PLAN.md says to copy: every
  layer is anchored off the receiver's own box, so the shelf starts exactly
  where the set's feet stop at any window size.
  Shelf board and apron · a bracket under it · the antenna lead leaving the back
  with a strain loop and a zip tie, going up out of frame, which is how a
  carrier gets out of a closet · a power strip and its cord · a taped drywall
  seam for scale · **masking tape on the shelf edge with "88.7" on it in
  marker**, the kind of label a person actually puts on their own gear.
- **The light under the door is the real Boulder clock** (`lib/environment.ts`,
  same source the hub and garage read). Daylight down the jamb in the day, warm
  at dusk, and **at night essentially nothing** — nobody left the hall light on,
  so after dark the only things lighting the closet are the set's phosphor and
  one amber LED. Day and night are genuinely different rooms.
- **A quiet echo, not an inventory:** the corner of the 486 is on the same
  shelf, three inches of it, mostly out of frame, power LED still on. World 5
  says the machine is in this closet; this is what that looks like from here.
  It also fills the left of the frame, which the first pass left empty.
- The wall behind the set picks up the receiver's phosphor **scaled by the
  carrier lock**, so the room is downstream of the mechanic rather than a
  backdrop painted behind it.
- **The scope was saturating into a solid green rectangle** — noise at ±0.34H
  with a persistence fill that never cleared enough to show a trace through it.
  Halved the noise band and deepened the clear; it reads as a noisy trace with
  an envelope now. The hold mechanic is untouched.

Verification:
`tsc` and `next build` clean, all gesture assertions pass, all twelve routes 200.
World 7 is DOM/CSS, so screenshots are trustworthy here (CLAUDE.md's table) and
it was checked by eye at each step. The **day** variant was verified by
temporarily hardcoding `phase="day"`, screenshotting, and reverting — the file
was restored from a backup and re-grepped to confirm no forced state survived.
The **reveal** was verified the same way, by forcing `locked`/`reveal` true: the
new three-line copy and the contact rows lay out correctly below the shelf.

Mobile: the resize tool reported success but never changed the rendered
viewport, so this was checked by measurement instead — `documentElement`, `body`
and the scroll container all report **0 horizontal overflow**, and the container
computes `overflow-x: hidden`, which makes that regression structurally
impossible regardless of width. The room's props hang off `calc(100% + …)` of a
`min(680px, 90vw)` box, so on a phone they simply sit off-frame. **Not checked
by eye at phone width.**

Discovered:
1. **A door jamb has to be plumb.** The light band was `linear-gradient(96deg)`
   on an element 240vh tall; six degrees of tilt walks it ~200px sideways over
   that height, so it drifted out of frame and only ever read near the ceiling.
   It looked like a lighting bug and was a geometry bug.
2. **Anchor to the object, not the viewport — including the light.** Pinned at
   68% of 100vw, the jamb sat *behind* the receiver at some widths and beside it
   at others, because the set has a max-width and the viewport does not. The
   same rule PLAN.md records for the counter applies to everything in the room.
3. **The stale-server trap caught me a second time**, in a new costume: I
   rebuilt, restarted, and screenshotted a tab I had never re-navigated, then
   spent a minute explaining a "bug" that was just the previous page still on
   screen. Reload *and* confirm `✓ Ready`, every time.
4. **Checking beats assuming about one's own notes.** Two worlds I had flagged
   in writing as probably-sloppy were clean.

Next:
Explorer. It is the world that has gone longest without attention, its only
session was triage, and six hub objects now make promises about it — but
CLAUDE.md lists it under "leave alone unless discussed," so it needs Tyler's
go-ahead rather than mine.

Risk:
Low. Broadcast is two strings. World 7 is additive — the room is a set of
pointer-events-none layers behind the existing receiver; the hold mechanic, the
audio, the lock math and the reveal are untouched.

---

## 2026-10-23 (3) — One motion grammar under twelve doors

Objective:
PLAN.md goal 2 — interface identity — approached from the one surface every
world shares. Not a world: the portal layer between them.

Why:
A grep for easing turned up eleven hand-rolled bezier curves, five different
spellings of `cubic-bezier(0.4,0,0.2,1)`, and fourteen uses of `ease-in-out`.
Symmetric easing is the single clearest tell that nobody chose the motion — real
interfaces decelerate into arrivals and accelerate out of departures. Underneath
that, three of the twelve portals were animating properties that force layout,
and the visitor's reduced-motion setting could not reach any of them.

First I checked whether the ten non-`fold`/`door` portal types were dead code.
They are not: every one is reached through a hub gate's `worldPortal`, so all
twelve are on live paths. Worth the five minutes before deleting anything.

Changes Made:
- `lib/motion.ts` (new) — `EASE` (enter / exit / hinge / motor, asymmetric on
  purpose), `DUR` (tap 90 → ceremony 1200, a scale so the number comes from
  somewhere), `transition()`, and the reduced-motion helpers. Deliberately no
  CSS custom properties: nothing would consume them yet.
- `components/worlds/PortalTransition.tsx` — all twelve kept as twelve distinct
  gestures, now with their numbers out of the grammar.
  - `expand-white` grew its own `width`, `height`, `marginLeft` and `marginTop`
    under `transition: all`. Now scales a fixed-size circle. This is the door to
    Contact, Broadcast and the whole lab region, so it was the worst one to have
    running layout at 60fps.
  - `letter-expand` animated `font-size` from 14px to twice the viewport —
    re-rasterising the glyph and re-running text layout every frame. Now scales.
  - `slide-right` was four seconds. Now `DUR.ceremony`, 1200ms.
  - `cursor-flood` and `vortex` stopped after a fixed *frame count*, so they ran
    750ms on a 60Hz panel and 375ms on a 120Hz one. Now driven by elapsed time.
  - Completion now comes from `transitionend`, with the timer demoted to a
    fallback. `expand-white` had set its timer to exactly its own 700ms while
    starting the transition a frame late, so it could call itself finished early.
  - `scatter` reaches outside React and writes to every `body > *`. It restored
    those elements to the empty string, discarding any inline style a world had
    set on itself; it now records and replays the exact prior values.
  - Reduced motion renders a cut instead of a crossing. This is new behaviour,
    not a fix to the existing `@media` block — the portals animate through
    inline styles, which outrank anything in globals.css, so that block was
    never able to reach them.

Delightful detail:
`expand-white` carries the real sky over Boulder. Verified against
`readEnvironment`: at local noon the flood is `rgb(253, 249, 239)`, warm; right
now, with the sun 60° below the horizon, `rgb(228, 235, 247)`, cold. The same
white either way until you have crossed it at both ends of a day. Nobody is told.

Verification:
`tsc --noEmit` clean. `next build` clean, 18/18 static pages, shared JS
unchanged at 103 kB. All twelve world routes 200 against `next start` (with
`✓ Ready` confirmed in the log, per the last session's lesson).

In a real Chrome tab, by computed style rather than screenshot: clicking "Enter
Universe" on World 0 carried world 0 → 1 and `/surface` → `/universe` with the
portal cleaned up afterward, and mid-flight exactly one element was animating —
`transitionProperty: "transform"`, `0.88s`, `cubic-bezier(0.4, 0, 0.2, 1)`,
`matrix3d(...)` part-way through the rotation. That is `DUR.travel` and
`EASE.hinge` arriving from the grammar, with no layout property in the
transition.

**Not verified in a real window:** the other eleven portal types. Every trigger
for them is a hub gate, and the hub is R3F — it never initialises in an
automation tab (the CLAUDE.md trap). They are code-confirmed and type-checked
only. `expand-white`, `letter-expand` and `slide-right` changed the most and are
the ones worth Tyler clicking a gate for.

Discovered:
1. **An easing inventory is a fast read on whether a site has a grammar.**
   `grep -ohE "cubic-bezier\([^)]*\)|ease-in-out"` then `sort | uniq -c`. Five
   spellings of one curve and fourteen `ease-in-out` said more in one table than
   reading the files did.
2. **`transition: all` hides from a property grep.** A sweep for
   `transition:.*\(width|height|top|left\)` came back empty and looked clean —
   while `expand-white` was animating all four through `all`. Grep the keyword,
   not just the property names.
3. **Frame counts are a duration bug on new hardware.** Two canvas portals ran
   at half length on a 120Hz display. Anything that ends on `if (frame < n)` is
   measuring the panel, not time.
4. **An inline style outranks a reduced-motion media query.** The accessibility
   block in globals.css looked like coverage and was unreachable for every
   portal on the site.

Next:
Explorer (`World2Explorer`) is still the world that has gone longest without
attention, and six hub objects make promises about it. Unchanged from the last
two entries.

Risk:
Low. No world's own layout, geometry, routing or mobile surface touched — the
changes are confined to the shared transition layer plus one new file. The
geometry change in `expand-white` strictly reduces per-frame work, and the
mount-time visual size of `letter-expand` is unchanged (14px, now via scale).

---

## 2026-10-24 — The hub boots, and the departures board moves to Boulder

Why:
Two findings from reading the repo rather than the roadmap.

The hub lazy-loads three.js — the largest chunk on the site — through
`dynamic(..., { ssr: false })` with **no loading state at all**. A visitor
crossed a portal, the portal finished, and then there was an empty black frame.
That is exactly the line CLAUDE.md draws between mystery and broken, and it was
the first thing a first-time visitor met.

Departures, meanwhile, printed a clock labelled `BOULDER` that was actually the
*visitor's* timezone — from Sydney the board claimed Boulder was seven hours
behind itself — over a TIME column computed as `(i * 7 + cycle * 13) % 60` on a
hard-coded base hour of 4, so the board opened at 04:00 whatever time you stood
in front of it and never agreed with its own header six inches away. Under them
sat `40331 + elapsedSeconds * 3` labelled READS ON FILE: an invented base
climbing at an invented rate, and the only fake number on a board whose every
other field is real OpenStreetMap data.

Changes Made:
- `components/universe/effects/SurveyBoot.tsx` (new) — the hub boots in the
  corner terminal's dialect, because it is the same instrument warming up.
  Every line is true: `PLOTTER` tracks whether the renderer actually exists,
  `CATALOG` is `getAllObjects().length`, `SYNC` is the real Boulder clock.
- `UniverseCanvas.tsx` — reports two real milestones, `onCreated` for the
  renderer and a sentinel inside the Suspense boundary for the scene. The panel
  leaves when there is genuinely something behind it, not on a timer.
- `UniverseRoot.tsx` — holds the seven DOM overlays until the renderer exists.
  They would otherwise paint over an empty canvas: the corner terminal printing
  `OBJECTS 0 IN VIEW` before there was anything to be in view of, the glitch
  layer muttering about a scene that had not loaded.
- `World8Departures.tsx` — `boulderClockWithSeconds()` in the header; the board
  anchored to the real Boulder minute, so the first row *is* the hour in the
  city the board claims to be in and the rest climb from it; `SHOWN SO FAR
  n OF 74 READERS`, which counts something that is really happening; and
  `INDEX OPENSTREETMAP · 07.19.26` out of the payload's own `source` and
  `generatedAt`, both of which were sitting in `alpr.json` unread. That last
  one is the Berkshire move — name the document the page is built from.

Delightful detail:
The boot panel says `CATALOG 50 OBJECTS`. Four seconds later the corner
terminal in the same spot says `OBJECTS 33 IN VIEW`. Nobody is told why the
number went down, and the seventeen missing ones are the whole invitation.

Verification:
`tsc --noEmit` clean, `next build` clean at 18/18 static pages, shared JS
unchanged at 103 kB, gesture assertions pass, twelve routes 200 against
`next start` with `✓ Ready` confirmed in the log first.

Departures is DOM, so it was checked by eye: the header reads 18:32:15 and the
first row reads 18:32 — the board agrees with itself for the first time. The
panel's four labels land on column 13 by measurement. Zero horizontal overflow
on `documentElement` and `body`, shell `overflow-x: hidden`.

The hub's boot panel completes in well under a second on localhost, so both of
its states were reached by temporarily neutering the two readiness callbacks,
building, screenshotting, then restoring from a backup and re-grepping to
confirm no forced state survived (`FORCED_FOR_SCREENSHOT` → none). The
unforced path was then re-verified: panel unmounted, overlays back, gate index
present.

**Not verified:** how long the gap actually is for a real visitor on a real
connection. The gap is code-confirmed; its length is not measurable from here,
and the August figure came from an automation tab and never meant anything.

Discovered:
1. **Two real defects only showed up because the forced state was reachable.**
   The stalled panel collided with the corner terminal — both live at
   `bottom: 28, left: 28` — and in the genuine no-WebGL case the terminal is
   deliberately on screen, so that collision was real and not an artifact of
   the forcing. The failure state moved to the middle, where a visitor is
   already looking.
2. **drei's `<Html>` z-index has a published ceiling.** It scales each label's
   distance-to-camera into `zIndexRange`, defaulting to `[16777271, 0]`
   (`drei/web/Html.js:99`), and every label on the hub uses the default. So
   16777272 is a bounded answer rather than a big number picked to win an arms
   race — and without it, seven captions float at full opacity on black for the
   whole fade-out while the scene they belong to is still hidden.
3. **`generatedAt` and `source` had been in `alpr.json` since the bake and were
   never rendered.** The honest provenance line was already in the data; the
   invented one was in the component.
4. **The site's own test machine is in Boulder**, so a timezone bug is
   invisible by observation here. Proved it instead by running the formatter
   under `TZ=Europe/London` and `TZ=Australia/Sydney`: board 18:32 both times,
   visitor 01:32 and 11:32.

Next:
Explorer is still the world that has gone longest without attention, and six
hub objects make promises about it — unchanged for four entries now, because it
is on CLAUDE.md's "leave alone unless discussed" list. The shared sky now
reaches six of eleven worlds; Broadcast, the Answering Machine and the
Directory are the remaining ones that are not on that list.

**World 9 is a deliberate exception and should stay one.** It reads the
*visitor's* clock on purpose — "it's the middle of the night where you are" —
and moving it to Boulder time would break the one thing that world is about.

Risk:
Low. Departures' layout, routing and mobile surface are untouched; the hub
gained a layer that removes itself and a gate on layers that were painting over
nothing. The one behaviour change worth watching is that the hub's overlays now
mount a beat later than they used to.
