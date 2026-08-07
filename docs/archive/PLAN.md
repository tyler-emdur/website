# Immersion Plan — from "worlds" to "places"

Started 2026-07-24. Written against Tyler's inspiration sheet (agrshch, galekto,
igloo.inc, extraordinarythings, cameronsworld, rietveld, twomuch.studio,
activetheory) after walking all ten worlds and reading the render code.

Scoped to the rules already in PROGRESS.md: one major feature OR two medium OR
five small per session, never more than three worlds at once, branch → build →
verify → log.

---

# READ THIS FIRST

## State

Branch `immersion-plan`, **6 commits, not pushed, not merged to `main`.**

```
f1f6366  Broadcast: give the set a floor to stand on
38f0b98  Fix a regression I introduced: the wait was silent instead of shorter
6226f34  Retract the World 2 "never rendering" diagnosis — it was my test environment
4e741b8  Self-review fixes: dead import, and a failure state I had deleted
7b16887  Retract the Warehouse 14 overlay finding; record the measurement caveat
d3ad718  World 2 was never rendering: the canvas never initialized   ← headline retracted by 6226f34
```

Two of those six commits are retractions. That is not incidental — see below.

## The trap that produced both retractions

**The browser-automation tab runs with `document.visibilityState === "hidden"`.
`requestAnimationFrame` is fully paused there — measured at 0 frames in 4
seconds.**

Consequences, all of which cost real time before being understood:

1. **Every WebGL world renders black in that tab** until some input (click,
   scroll, resize) forces a rendering step. A black canvas there means nothing.
2. **R3F may never initialize at all**, because ResizeObserver is starved, so
   `react-use-measure` never reports a size. This looks exactly like a real bug
   and is not one.
3. **Frame rate cannot be measured from that environment. At all.** Any FPS
   number taken there is meaningless.

This produced two confident, wrong findings ("World 2 never renders", "Warehouse
14's controls overlay never dismisses"), one of which was shipped as a commit
headline before being caught.

**Rule going forward: never diagnose a 3D world from an automation screenshot.**
Verify by mechanisms that do not depend on painting — `curl` timings, effect
probes, `next build`, reading the code — or ask Tyler to look in a real window.

## Which observations in this document you can trust

This maps exactly onto DOM vs WebGL, because DOM composites regardless of rAF.

| World | Tech | Screenshot evidence |
|---|---|---|
| 0 Surface, 3 Broadcast, 5 Machine, 7 Contact, 8 Departures, 9 Answering | DOM/CSS | **Trustworthy** |
| 1 Universe, 2 Explorer, 6 Garage, 14 Aisle | R3F / three.js | **Not trustworthy** — compositional reading may survive, anything about brightness/lighting/animation does not |

Claims sourced from *code* (e.g. "no `castShadow` anywhere") are trustworthy for
every world.

## Confirmed by Tyler in a real browser

- **Broadcast** — was indeed a set floating in pure black. Diagnosis correct.
  Now fixed (Session 3).
- **Garage** — "looks pretty similar, works fine." **My "it is invisible"
  reading was probably wrong.** See Session 4, which may not need to exist.
- **Machine, Departures** — fine, unchanged, nothing wanted.

---

## Diagnosis

There are two kinds of world on this site, and only one kind works.

**Screen worlds — finished, do not touch.** Surface (0), the Machine (5),
Departures (8). They work because a screen is *supposed* to fill the frame: the
fiction is that you are looking at a display, so an edge-to-edge rectangle is the
correct and honest composition. Departures is the most confident thing on the
site — dense, real ALPR data, live camera thumbnail, no explanation offered.

**Object worlds — the problem.** One well-drawn object centered in a black void:

- ~~Broadcast~~ — **fixed in Session 3.** It has a floor, a wall, a contact
  shadow, and the channel's colour falls on the room.
- **Contact (7)** — a centered card on black. The press-and-hold-to-lock-the-
  signal interaction is genuinely good; it just has no place around it.
  *(DOM — this reading is reliable.)*
- **Answering Machine (9)** — a rounded rectangle on a black gradient with "the
  light is blinking" floating above nothing. *(DOM — reliable.)*
- **Garage (6)** — *reading in doubt, Tyler says it looks fine.* Do not act on
  this without looking yourself.
- **Explorer (2)** — after Session 1 it renders correctly and the portfolio title
  card is gone, but it is still a terrain disc on black. It does **not** meet the
  bar below. Making it a place was never scoped and is still not scheduled.

**That shape — one object, centered, on black — is what reads as generated.** It
is the default output of asking for a scene. Cameron's World, the reference
Tyler cites as most inspiring, never does it: every section is *full*. Neither
does agrshch, galekto, or igloo. The fix is not more objects. It is giving the
objects a room.

**Warehouse 14 is the proof and the template.** The one world that is already a
place — real perspective, an aisle that genuinely doesn't end, and the best
writing on the site.

**One defect runs through everything with geometry: nothing casts a shadow.**
No `castShadow`, no `receiveShadow`, no `shadows` on any Canvas (the Garage sets
`shadows={false}` explicitly), and no environment map anywhere — yet materials
are `meshStandardMaterial` with metalness up to 0.8. Metal with nothing to
reflect renders as grey plastic, and without contact shadows nothing sits on the
floor, it hovers. **This claim is from code, so it stands.**

---

## The bar

A world is done when a screenshot of it, with all HUD text removed, still reads
as somewhere. If removing the text leaves an object on black, it is not done.

---

## Session status

| # | Session | Status |
|---|---|---|
| 1 | Explorer triage | ✅ done — but headline diagnosis was wrong, see below |
| 3 | Broadcast gets a room | ✅ done — brought forward ahead of 2 |
| 2 | Warehouse 14: light that lands | ⏸ **blocked** on a frame-time baseline from Tyler |
| 4 | Garage: raise the floor | ❓ **may not exist** — Tyler says the Garage is fine |
| 5 | Answering Machine gets a surface | ▶ **next, and unblocked** |

---

## Session 1 — Explorer triage — ✅ DONE

Full write-up in PROGRESS.md. Delivered, and what each is actually worth:

| Change | Verified how | Real? |
|---|---|---|
| One `Promise.all` split into three independent loads | `curl` server-side: strava **20.8 s cold / 23 ms warm**; terrain 8 kB, 40 ms | **Yes** — the 20 s wait was genuine |
| "Reading the trace" indicator while Strava is in flight | Tyler caught its absence as a bug | **Yes** — fixes a regression I introduced |
| Title card removed | Code + non-negotiable #1 | **Yes** |
| Ghost start marker | Code | **Yes** (delight detail) |
| `maxDistance` 3.0 → 3.4 radii | Arithmetic: opening shot sits at 3.06 | **Yes** |
| Terrain vs Strava failure states split | Self-review caught I had deleted one | **Yes** |
| Canvas mounts unconditionally | — | **Downgraded** — consistency + load ordering, *not* a bug fix |

**Retracted:** "the canvas never initializes because it is mounted
conditionally." A mount probe disproved it — R3F fails to mount children in the
automation tab with *or* without the change. World 2 was most likely never
broken for real visitors.

**Also wrong in the original plan:** "the 3.8 MB street-coverage.json blocks
first paint." It serves gzipped in ~150 ms and was never the problem.

**Lesson worth more than the session:** splitting the loads made the ground
appear in 40 ms but left the remaining ~17 s Strava wait completely silent, so
the world looked *finished and empty*. Tyler found it. Making something faster
can make it read as more broken if you delete the thing that admitted the wait.

---

## Session 3 — Broadcast gets a room — ✅ DONE

The galekto session. Pure CSS — this world has no three.js, which is also why it
was verifiable without a foreground window.

Delivered: a back wall (faint vertical gradient replacing flat `#030201`); a
floor running from the set's base toward the viewer with sheen falling off by
distance; the floor/wall seam lit only where the screen reaches it; a contact
shadow under the cabinet; and `floorPool` — the channel's own colour thrown onto
the floor, reusing the existing per-channel `SLOT_GLOW` palette at a readable
alpha. **Change the channel and the room changes with it** (verified: CH 23
Reykjavík warm, CH 17 Taipei cool blue).

Notable: floor, seam and shadow anchor off the cabinet (`top: 100%` — its base)
rather than off viewport percentages, so the ground meets the set wherever the
cabinet sizes at a given window.

**Dropped from the original plan:** sampling the video texture's average colour
per frame to drive the light. Unnecessary — the existing `SLOT_GLOW` palette is
per-channel already, needs no pixel readback, and cannot taint a cross-origin
canvas. Also dropped: "one object in the room that is not the TV." Left for
later; the room reads without it and restraint is the house style.

---

## Session 2 — Light that lands (Warehouse 14) — ⏸ BLOCKED

**Objective:** Make the best world look like the place it already is, and set the
lighting standard the other worlds get held to.

**Why:** Warehouse 14's lighting is already *sophisticated* — zone decay,
brown-outs on a scheduler, fog tracking the walker's depth, pooled lights riding
the nearest fixtures (`AisleCanvas.tsx:735-800`). It does real work and gets no
credit, because none of that light lands on anything. Shadow and reflection
multiply work that already exists.

**Changes:**

1. **Enable shadows on the Canvas** (`AisleCanvas.tsx:986`) with soft PCF.
2. **Do not shadow-map the point lights.** Three shadow-casting point lights is
   six cube-map faces each, every frame, in an infinite corridor — it will tank.
   Add one shadow-casting light riding the camera with a tight frustum sized to
   the visible window.
3. **Contact shadows under everything on the floor** — carts, pallets, featured
   items, rack feet. What makes objects sit rather than hover. Cheap.
4. **A procedural environment map** via drei's `<Environment>` with
   `<Lightformer>` children — bright strips overhead matching the fixture grid,
   dark below. No network fetch, no HDR asset, no CSP concern. This is what turns
   the metalness already set on the racking into actual metal.

**Why it is blocked:** this is the one change on the list with real frame-rate
risk, and frame time cannot be measured from the automation environment (see
READ THIS FIRST). **Get a baseline from Tyler before starting** — ask him to walk
the aisle and say whether it currently feels smooth, and on what machine.

Mitigations when it does start: gate shadow resolution on `dpr`; be willing to
ship items 3–4 alone if the shadow-casting light costs more than it returns.
Items 3–4 are safe independent of item 2.

**Done when:** boxes cast shadows on the floor; racking reads as painted steel;
`renderer.info` draw calls up by no more than one shadow pass; frame time
confirmed acceptable by Tyler in a real window.

---

## Session 4 — Garage: raise the floor — ❓ PROBABLY DELETE

**Do not start this without looking at the Garage in a real window first.**

The premise was that the resting state ("12:47 AM · engine off") sits below the
threshold where a visitor can tell there is a place there. That came from a
hidden-tab screenshot, and Tyler has since said the Garage "looks pretty
similar, works fine." The premise is probably false.

If it turns out there *is* something here: raise the resting light just enough to
read the shape of the garage — instrument backlight, one sodium lamp bleeding
under the door, dash glow — and keep the headlight reveal as the payoff. Easy to
overshoot; if the headlight moment stops feeling like a reveal, take less.

Otherwise delete this section.

---

## Session 5 — The Answering Machine gets a surface — ▶ NEXT

**Unblocked, and the best next move**: World 9 is DOM, so it is fully verifiable
without a foreground window, exactly like Broadcast was — and Broadcast is the
proof that this shape of change works and is visible.

**Objective:** Put the machine on something, in something.

**Why:** It is currently a `<div>` on a black gradient with "the light is
blinking" floating above nothing. It is the world with the most emotional weight
on the site and the least physical presence.

**Changes:** A surface it rests on, a wall behind, a single light source that
makes the blinking light matter by being the only other thing in the room.
Restraint applies harder here than anywhere — this world earns its atmosphere
from the tape contents, not from set dressing. Reuse the Broadcast approach:
anchor floor/seam/shadow off the object, not the viewport.

**Then, likely Session 6:** Contact (7), the same treatment. Also DOM, also a
centered card on black, and its press-and-hold interaction deserves a place.

---

## Later — deliberately not scheduled

- **The Universe hub is a pannable poster.** `CameraRig.tsx:124-136` never
  rotates the camera: drag translates X/Y, scroll translates Z, `lookAt` always
  targets the camera's own x/y. Orbit-and-dolly with real Z spread would turn the
  same 47 objects into a volume. Deferred because the object worlds are where
  visitors spend time.
- **The front door opens onto nothing.** `UniverseRoot.tsx:14` lazy-loads the
  canvas with no `loading` state, so ~1.2 MB of three.js chunks download *after*
  the door portal commits. Prefetch during Surface; make the wait diegetic.
- **No sound layer.** Five worlds have audio; none survives a transition, and
  there is no ambient bed. One persistent WebAudio context with per-world beds
  crossfading *through* portals would do more for presence than any geometry.
- **Transitions are curtains over a hard cut.** `PortalTransition.tsx` is twelve
  CSS overlays, and `completePortal()` fires on a fixed `setTimeout` that knows
  nothing about whether the destination has mounted.
- **Explorer is still not a place.** Session 1 was triage only.

---

## Explicitly not doing

- No new worlds until the object worlds are places. Depth before breadth.
- No changes to Surface (0), Machine (5), Departures (8). They are done.
- No physics/grab-and-throw yet, despite extraordinarythings and twomuch. It
  belongs in Warehouse 14, and only after Session 2 gives objects weight.
- No CRT/VHS work in Broadcast beyond the room — `Channel88.tsx:39` already has
  it and it is good.
- No restoring the Explorer sky text unless Tyler asks. It was removed under
  non-negotiable #1 (never a portfolio); he noticed it gone and was offered it
  back.

---

## Appendix A — findings, and whether they held

| Claim | Evidence | Status |
|---|---|---|
| No shadows anywhere | No `castShadow`/`receiveShadow`/`shadows` in `AisleCanvas.tsx`; `GarageScene.tsx:213` sets `shadows={false}` | **Holds** (code) |
| Metalness with no env map | `AisleCanvas.tsx:463,472` — metalness 0.8, no `<Environment>` in any scene | **Holds** (code) |
| Hub camera never rotates | `CameraRig.tsx:124-136` | **Holds** (code) |
| Front-door chunks load after commit | `UniverseRoot.tsx:14`, `dynamic(..., { ssr: false })` with no `loading`; chunks 504K + 376K + 352K | **Holds** (code) |
| Portal completion untimed to readiness | `world-store.ts:130-140`; every `PortalTransition` variant calls `onDone` from a `setTimeout` | **Holds** (code) |
| Broadcast is a TV in a void | Tyler's own screenshot | **Held** — fixed in Session 3 |
| Explorer blocks ~20 s before anything appears | `curl`: `/api/strava` 20.8 s cold / 23 ms warm | **Held** — but the cause was Strava, not street-coverage.json |
| Explorer blocked on 3.8 MB street-coverage.json | Serves gzipped in ~150 ms | **Wrong** |
| Explorer's canvas never initializes | Mount probe: fails identically with and without the "fix" | **Wrong** — automation-tab artifact |
| Warehouse 14 overlay never dismisses | Gated on `hasMoved`, `World14Aisle.tsx:296`; dismisses on a dispatched wheel or keydown | **Wrong** — same artifact |
| Garage resting state is invisible | Hidden-tab screenshot; Tyler says it looks fine | **Probably wrong** |
