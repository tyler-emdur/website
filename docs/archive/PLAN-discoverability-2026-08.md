# Discoverability Plan

Written 2026-08-10, after walking all 11 worlds in Chrome against a production
build (`next build && next start`, not the dev server — dev compile times made
every world look far worse than it is).

The premise: the worlds are good. The problem is that a visitor cannot find
them, and in the hub world cannot even see them. This is a plan to fix reach,
not to add content.

---

## The finding that matters

**World 1 is the hub, and for a new visitor it is a locked black screen.**

The entry path is FrontDoor → World 0 (retro surface) → "CLICK TO ENTER" →
World 1. What a first-timer actually gets in World 1:

1. **~5–10 seconds of near-black** while the WebGL scene loads. No spinner, no
   copy, no skeleton. Nothing distinguishes "loading" from "broken." Measured
   locally on a warm production build; a real network on a mid-range laptop will
   be worse.
2. Once it loads it is genuinely beautiful — origin star, orbiting planets,
   giant blue wireframe structures, drifting survey text. This is the best
   single frame on the site and almost nobody sees it.
3. The one visible affordance is a small dim `GATES ?` button. Clicking it
   returns:

   > GATE INDEX — LOCKED
   > INSUFFICIENT DISCOVERIES (0 / 3 required)
   > explore the field first

That lock is in `components/universe/effects/PortalDirectory.tsx`. A
"discovery" is registered by clicking a universe object — but at that moment
the visitor has not seen an object, because either the scene has not painted
yet or nothing signals that the drifting labels are clickable.

So the gate to the other nine worlds is held shut by a mechanic whose input the
visitor has no way to know exists. **The gating punishes exactly the person who
does not yet know there is anything to find.** That is the whole
"features are too hard to find" complaint in one screen.

---

## Ranked fixes

### 1. Unlock the gate index — or teach it in the same breath (highest leverage)

Pick one, not both:

- **Preferred:** drop the 3-discovery lock entirely. The gate index is a map,
  and a map that refuses to open is not mysterious, it is broken. Let the panel
  list all gates from the first second, with unvisited ones rendered in the
  existing glitched/partial style so the *content* stays mysterious while the
  *door* stays open.
- **If the lock stays:** the locked state must name its own verb. "explore the
  field first" is not actionable. Something closer to "click any object to log
  a discovery — 0 of 3" tells the visitor what to do without explaining the
  world away.

### 2. Give every world an honest load state

Nine of eleven worlds currently open on near-black with no signal. Worlds 1, 2,
3, 8 and 14 are the worst. The fix is not a generic spinner — it is a per-world
holding frame in that world's own voice, the way `app/page.tsx` now lays down
the black ground with a dim name.

World 2 already does this correctly with `READING THE TRACE..` — that's the
model. World 1 should say something like `SURVEY LOADING` in HUD type; the
warehouse should say the aisle is being stocked. Same shape, eleven voices.

### 3. Raise instructional contrast to a floor

A lot of the "here is how you interact" copy sits at `rgba(255,255,255,0.2)`–
`0.3`. That is below WCAG AA against these backgrounds and, more practically,
invisible on a laptop screen in daylight. Examples: World 3's
`← → or ▲▼ to change channel`, World 9's `5 messages on tape`, World 1's
footer hint bar.

Proposal: atmosphere text may stay dim; **any string that teaches a control
gets a minimum of `rgba(255,255,255,0.55)`.** Two tiers, applied consistently.
This is the cheapest broad win in the list.

### 4. One persistent way to see all eleven worlds

Right now navigation is inconsistent:

| Where | How you get around |
|---|---|
| World 0 | Rich world grid at the bottom — the best navigator on the site |
| World 1 | The locked gate index |
| Everywhere else | A single dim `UNIVERSE` button, bottom-left |

World 0's bottom strip already solves this problem well. Something with its
information density — 11 tiles, visited state, world names — should be
reachable from every world, not just the one that happens to be a 1998
homepage. Keep it in-world (a summoned overlay, not a nav bar) so it doesn't
turn the site into a normal website.

### 5. Fill the dead centers

Worlds 6 (Garage) and 8 (Departures) render their content in a band at the
bottom and leave the middle 60% of the viewport empty and black. World 8 in
particular shows a table header, one row, and a void — it reads as half-broken
rather than as sparse-on-purpose. Either bring the content up into the frame or
put something in the space that belongs there.

---

## Explicitly not doing

`PROGRESS.md` sets the rule: choose mystery, atmosphere, exploration over
explanations and professionalism. Nothing above is an argument for tutorials,
onboarding modals, tooltips, or a navbar.

The distinction this plan runs on:

- **Mystery** = you can see there is something there and you do not yet know
  what it is.
- **Broken** = you cannot see there is anything there.

Every item above converts the second into the first. None of them explain what
anything means once you arrive.

---

## Suggested order

1. Gate index (#1) — one file, unlocks nine worlds
2. Contrast floor (#3) — mechanical, broad, low risk
3. Load states (#2) — per-world, do World 1 and 2 first
4. Persistent world index (#4) — new component, needs design
5. Dead centers (#5) — per-world design work
