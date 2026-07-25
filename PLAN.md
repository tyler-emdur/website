# Immersion Plan — from "worlds" to "places"

Written 2026-07-24, after walking all ten worlds in a browser and reading the
render code behind each one. Every claim in the Diagnosis is checkable against
a file and line; see Appendix A.

This plan is scoped to the rules already in PROGRESS.md: one major feature OR
two medium OR five small per session, never more than three worlds touched at
once, branch → build → verify → log.

---

## Diagnosis

There are two kinds of world on this site, and only one kind works.

**Screen worlds — these are finished.** Surface (0), the Machine (5), and
Departures (8) are excellent and need nothing. They work because a screen is
*supposed* to fill the frame: the fiction is that you are looking at a display,
so an edge-to-edge rectangle is the correct and honest composition. Departures
in particular is the most confident thing on the site — dense, real ALPR data,
live camera thumbnail, no explanation offered.

**Object worlds — these are the problem.** Broadcast (3), Garage (6), Contact
(7), Answering Machine (9), and Explorer (2) all do the same thing: one
well-drawn object centered in a black void.

- Broadcast is a CRT floating in pure black, playing real Icelandic TV.
- Garage puts you in the driver's seat at eye height 1.16m, and at rest you can
  make out a steering-wheel arc and nothing else.
- The Answering Machine is a rounded rectangle on a black gradient with "the
  light is blinking" floating above nothing.
- Contact is a centered card. (The press-and-hold-to-lock-the-signal
  interaction is genuinely good — it just has no place around it.)
- Explorer is a small blue blob under a title card reading "TYLER STRAVA RUN
  MAP", after twenty seconds of "SURVEYING BOULDER…", and it opens pointed at
  empty space.

**That shape — one object, centered, on black — is the thing that reads as
generated.** It is the default output of asking for a scene. Cameron's World,
the reference that inspired this project most, never does it: every section is
*full*. Neither does agrshch, galekto, or igloo. The fix is not more objects.
It is giving the objects a room.

**Warehouse 14 is the proof and the template.** It is the one world that is
already a place — real perspective, an aisle that genuinely doesn't end, and the
best writing on the site. It is what every object world should be measured
against.

**One defect runs through everything with geometry: nothing casts a shadow.**
No `castShadow`, no `receiveShadow`, no `shadows` on any Canvas (the Garage sets
`shadows={false}` explicitly), and no environment map anywhere — yet the
materials are `meshStandardMaterial` with metalness up to 0.8. Metal with
nothing to reflect renders as grey plastic, and without contact shadows nothing
sits on the floor, it hovers. This is the single largest gap between Warehouse
14 and twomuch.studio, and it costs no new geometry to close.

---

## The bar

A world is done when a screenshot of it, with all HUD text removed, still reads
as somewhere. If removing the text leaves an object on black, it is not done.

---

## Session 1 — Explorer triage — ✅ DONE 2026-07-24

Shipped. Full write-up in PROGRESS.md. **Two of the three diagnoses in the
original draft of this session were wrong, and the real bug was worse:**

- **Planned:** "the opening camera is framed on empty space."
  **Actual:** the canvas was never initializing at all. Mounting
  `<StravaCanvas>` conditionally on loaded data raced R3F's container
  measurement — `react-use-measure` read 0×0 and R3F never completed init.
  Live WebGL context, correct drawing buffer, zero frames, zero children
  mounted, no console error. A bare `window.resize` brought the whole scene up.
  Same silent R3F signature as the Garage incident of 2026-07-16/17.
  **Standing rule for this codebase: mount R3F canvases unconditionally and let
  them render an empty scene. Never gate a Canvas on async data.**
- **Planned:** "the 3.8 MB street-coverage.json blocks first paint."
  **Actual:** it serves gzipped in ~150 ms and was never the problem. The wait
  was `/api/strava` — 23 ms warm, ~21 s on a cold `unstable_cache` miss. So one
  visitor per 6-hour revalidation window ate a 21-second black screen while
  terrain.json (8 kB, 40 ms) sat downloaded and unused in the same `Promise.all`.
- **Correct as planned:** the "TYLER STRAVA / RUN MAP" title card was the most
  portfolio-shaped object on the site and is gone; the ghost runner now has a
  start marker that brightens as it gets further round the loop.

Delivered: canvas mounts unconditionally at z-index 0; one `Promise.all` split
into three independent loads; title card removed; start marker added;
OrbitControls `maxDistance` raised so the authored opening shot is no longer
silently clamped.

**Measured:** renders unaided in a fresh tab on a production build, ~2.5 s from
navigation start (network complete at 369 ms; route geometry build 21 ms for 367
activities / 27,795 points; remainder is WebGL init). Screenshot-based timing
carries ~±0.5 s of tooling latency — approximate, not instrumented.

---

## Session 2 — Light that lands (Warehouse 14)

**Objective:** Make the best world look like the place it already is, and
establish the lighting standard the other worlds will be held to.

**Why:** Warehouse 14's lighting is already *sophisticated* — zone decay,
brown-outs on a scheduler, fog tracking the walker's depth, pooled lights riding
the nearest fixtures (`AisleCanvas.tsx:735-800`). It is doing real work and
getting almost no credit for it, because none of that light ever lands on
anything. Adding shadow and reflection multiplies work that already exists.

**Changes:**

1. **Enable shadows on the Canvas** (`AisleCanvas.tsx:986`) with soft PCF.
2. **Do not shadow-map the point lights.** Three shadow-casting point lights
   means six cube-map faces each, every frame, in an infinite corridor — it will
   tank. Instead add one shadow-casting light that rides the camera with a tight
   frustum, sized to the visible window only.
3. **Contact shadows under everything on the floor** — carts, pallets, featured
   items, rack feet. This is what makes objects sit rather than hover, and it is
   cheap.
4. **A procedural environment map** via drei's `<Environment>` with
   `<Lightformer>` children — bright strips overhead matching the fixture grid,
   dark below. No network fetch, no HDR asset, no CSP concern. This is what
   turns the metalness values already set on the racking and the shelf posts
   into actual metal.
5. **Fix the controls overlay.** It currently never dismisses — after twenty
   scroll ticks it is still parked over the vanishing point, which is the entire
   composition of a world called "it doesn't end." Fade it out on first
   movement.

**Risks:** Medium, and entirely about frame rate. Mitigation: measure before and
after on a mid-range device, gate shadow resolution on `dpr`, and be willing to
ship contact shadows + env map alone (items 3–4) if the shadow-casting light
costs more than it returns. Items 3–5 are safe independent of item 2.

**Done when:** Frame time no worse than +15% on the baseline device; boxes cast
shadows on the floor; racking reads as painted steel; the vanishing point is
never occluded.

---

## Session 3 — Broadcast gets a room

**Objective:** Put the television somewhere. This is the galekto session.

**Why:** Galekto's TV aesthetic works because CRT light falls on a room. A
flickering screen in a void is just a video element. Broadcast already has the
hard part — real streams, Channel 88, VHS noise — and is one room short of
being the best world on the site.

**Changes:**

1. Build a minimal room around the set: a surface it stands on, a wall behind,
   a floor with falloff. Sparse and dark. It does not need furniture; it needs
   *extent*.
2. **Let the channel light the room.** Sample the video texture's average colour
   each frame and drive a light from it. Flipping channels then changes the
   room, not just the rectangle — which is the immersion payoff, and it makes
   the existing VHS flicker land physically instead of decoratively.
3. One object in the room that is not the TV, and is never explained.

**Risks:** Medium. Reading pixels from a cross-origin video texture will taint
the canvas — sample via a 1×1 downscale into an offscreen canvas and fall back
to a fixed warm light if the stream blocks it. Verify against the HLS streams
specifically, and against `gotcha_hls_canplaytype` (readyState, not
screenshots).

**Done when:** A screenshot with HUD text removed reads as a dark room with a
television in it; changing channel visibly changes the light in the room.

---

## Session 4 — Garage: raise the floor

**Objective:** Make the resting state legible without removing the reward for
turning things on.

**Why:** The darkness is deliberate — "12:47 AM · engine off", with headlights
and a bulb you can bring up. That mechanic is good and stays. But the resting
state currently sits below the threshold where a visitor can tell there is a
place there at all, so most will never reach for the switch. The scene is fully
built (`GarageScene.tsx`) and simply invisible.

**Changes:** Raise the resting light just enough to read the shape of the garage
— instrument backlight, one sodium lamp bleeding under the door, dash glow.
Keep the headlight reveal as the payoff. Consider whether `shadows={false}`
(`GarageScene.tsx:213`) can be lifted now that Session 2 has established the
pattern; a single shadow-casting bulb in an enclosed garage is cheap.

**Risks:** Low, but this is a taste change and easy to overshoot. If the
headlight moment stops feeling like a reveal, it went too far — revert and take
less.

---

## Session 5 — The Answering Machine gets a surface

**Objective:** Put the machine on something, in something.

**Why:** It is currently a `<div>` on a gradient. It is the world with the most
emotional weight on the site and the least physical presence.

**Changes:** A surface it rests on, a wall behind, a single light source that
makes the blinking light matter by being the only other thing in the room.
Restraint applies harder here than anywhere — this world earns its atmosphere
from the tape contents, not from set dressing.

---

## Later — deliberately not scheduled yet

These matter but are downstream of the sessions above.

- **The Universe hub is a pannable poster.** `CameraRig.tsx:124-136` never
  rotates the camera: drag translates X/Y, scroll translates Z, and `lookAt`
  always targets the camera's own x/y. Orbit-and-dolly with real Z spread would
  turn the same 47 objects into a volume. Deferred because the object worlds are
  what visitors spend time in.
- **The front door opens onto nothing.** `UniverseRoot.tsx:14` lazy-loads the
  canvas with no `loading` state, so ~1.2 MB of three.js chunks download *after*
  the door portal commits and you land on black. Prefetch during Surface, and
  make the wait diegetic.
- **No sound layer.** Five worlds have audio; none survives a transition, and
  there is no ambient bed. A single persistent WebAudio context with per-world
  beds that crossfade *through* portals would do more for presence than any
  geometry — and would make Broadcast and the Garage radio feel like rooms in
  one building.
- **Transitions are curtains over a hard cut.** `PortalTransition.tsx` is twelve
  CSS overlays, and `completePortal()` fires on a fixed `setTimeout` that knows
  nothing about whether the destination has mounted. Gate the swap on readiness;
  carry something across the boundary.

---

## Explicitly not doing

- No new worlds until the object worlds are places. Depth before breadth.
- No changes to Surface (0), Machine (5), or Departures (8). They are done.
- No physics/grab-and-throw system yet, despite extraordinarythings and twomuch.
  It belongs in Warehouse 14 and only after Session 2 gives objects weight to
  begin with.
- No CRT/VHS work in Broadcast beyond lighting — `Channel88.tsx:39` already has
  it and it is good.

---

## Appendix A — verified findings

| Claim | Evidence |
|---|---|
| No shadows anywhere | No `castShadow`/`receiveShadow`/`shadows` in `AisleCanvas.tsx`; `GarageScene.tsx:213` sets `shadows={false}` |
| Metalness with no env map | `AisleCanvas.tsx:463,472` — metalness 0.8, no `<Environment>` in any scene |
| ~~Explorer blocks on 3.8 MB~~ — **wrong**, see Session 1 | street-coverage.json serves gzipped in ~150 ms. The real blocker was `/api/strava`: 20.8 s cold, 23 ms warm |
| ~~Explorer opens on empty space~~ — **wrong**, see Session 1 | The canvas never initialized. `window.dispatchEvent(new Event('resize'))` brought the entire scene up instantly |
| Hub camera never rotates | `CameraRig.tsx:124-136` |
| Front-door chunks load after commit | `UniverseRoot.tsx:14`, `dynamic(..., { ssr: false })` with no `loading`; chunks 504K + 376K + 352K |
| Portal completion is untimed to readiness | `world-store.ts:130-140`, `PortalTransition.tsx` — every variant calls `onDone` from a `setTimeout` |
| Warehouse controls overlay never dismisses | Observed after 20+ scroll ticks, still over the vanishing point |
