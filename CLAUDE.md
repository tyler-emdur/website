# tyleremdur.com

A digital universe disguised as a website. Eleven worlds, each a real place with
its own rules, personality, and hidden details. **Not** a portfolio, dashboard,
startup site, or personal brand page.

A visitor should feel: *"I wonder what's over there."*

---

## Current goals — in order

Detail in `PLAN.md`. The site is strongest where it is **mechanically real** and
weakest where generic "mysterious internet artifact" language stands in for
structure. The problem isn't too much lore — it's lore substituting for platform
logic, interface identity, and things the user can actually do.

**Every world should feel like its own operating system, interface, or
environment,** with its own rules and visual language.

0. **Unlock the gate index** — prerequisite, not a competing priority.
   `PortalDirectory.tsx` gates nine worlds behind `discovered >= 3`. One file,
   ~an hour, and until it's done nothing below is visible to a new visitor.
1. **Make the worlds technically believable.** Real file systems, terminals,
   maps, logs, boot screens. Replace decorative filler with things the user can
   inspect, use, or navigate.
2. **Give each world a distinct interface identity.** One interaction model that
   is only its own. Convincing interface design over decorative weirdness.
3. **Connect worlds through persistent mechanics**, not lore. Actions in one
   world visibly affect another. Extend the existing stores, don't add a
   parallel system.
4. **Cut filler** — generic anomaly string pools, fake telemetry where real
   state would be better, anything that exists only to sound cool.
5. **Keep it navigable and revisitable.** Strangeness is fine; friction isn't.

### Decided (2026-08-10) — don't reopen without a reason

Audience is **both, layered** — front door for people Tyler sends it to, depth
for wanderers. The hub becomes **a map of real artifacts**. Connectedness means
**one design grammar under eleven skins**, **shared reality (real Boulder time
and weather reaching every world in its own dialect)**, and **quiet echoes** —
*not* inventory or state that literally follows you between worlds, and not
lore-facts. **Audio stays as it is**: per-world and opt-in. **The front door
stays minimal** — name, city, GitHub, email; the positioning line is retired.
Free to restructure **Contact, Broadcast, and the hub's text layer**; leave
Surface, the Machine, Explorer and Warehouse alone unless discussed. **World 8
does look empty** — the middle is real work.

---

## The bar

> A world is done when a screenshot of it, with all HUD text removed, still
> reads as **somewhere**. If removing the text leaves an object on black, it is
> not done.

> **Mystery** = you can see something is there and don't yet know what.
> **Broken** = you can't see anything is there.

Convert the second into the first. Never explain what things mean once you arrive.

---

## Hard rules

Never turn this into a portfolio, dashboard, or generic developer site. Never
trade mystery for explanation or weirdness for professionalism. No tutorials,
onboarding modals, tooltips, or nav bars.

Never make it feel AI-generated. That means no random particles, meaningless
animation, generic cards, placeholder content, fake data, chatbots, or features
added because they're technically impressive. **One well-drawn object centered in
a black void is the default output of asking for a scene — that shape is the
tell.** Give objects a room instead.

Depth before breadth. No new worlds until the existing ones are places. Prefer
small polished improvements over large unfinished systems. If no meaningful
improvement exists, do nothing.

**If a world presents something as data, state, or system output, it must either
be real or be clearly fictional by design** — part of that world's internal
system, never an accidental-looking placeholder. Never generate a
plausible-sounding value where a true one exists. If it can't be made real,
remove it or replace it with something interactive.

Leave mysteries open. Don't establish definitive canon, explain every anomaly, or
close a narrative possibility — prefer clues, fragments, and contradictions. But
mystery only works when there's something real underneath to find.

Personal memories and emotional artifacts stay rare: **at most one major personal
revelation per seven days.** Don't over-explain the owner of the universe.

**Every session ships at least one small delightful detail** — a hidden note, a
secret interaction, a strange object, a subtle callback. Small details compound
into atmosphere.

When choosing what to work on and the roadmap doesn't decide it, prefer the world
that has gone longest without attention. The universe should deepen together.

Never break navigation, regress performance or mobile, or leave the repo worse
than you found it.

Every addition must answer: why does this exist, does it make the world feel more
real, does it reward exploration, would a human intentionally build this?

---

## Never diagnose a 3D world from an automation screenshot

Browser-automation tabs run with `visibilityState === "hidden"`, so
`requestAnimationFrame` is throttled or paused. **Every WebGL world renders black
there, R3F may never initialize at all, and no timing or frame-rate measured
there means anything.** This has produced four wrong findings across two months.

| Tech | Worlds | Screenshots |
|---|---|---|
| DOM/CSS | 0, 3, 5, 7, 8, 9, 10 | trustworthy |
| R3F / three.js | 1, 2, 6, 14 | **not** trustworthy for brightness, lighting, animation, or timing |

Claims sourced from *code* are trustworthy for every world. Otherwise verify by
`curl` timings, effect probes, `next build`, or ask Tyler to look in a real window.

---

## Worlds

`0` Surface (retro homepage) · `1` Universe (hub) · `2` Boulder Explorer ·
`3` Broadcast · `5` Machine (EMDUR-486) · `6` Garage · `7` Contact ·
`8` Departures · `9` Answering Machine · `10` Directory · `14` Warehouse

Done, do not restyle: **0, 5**. Deliberately frozen: World 5's `WEBSITE.V1`
museum copy, including its "last updated 2024" stamp.

## Conventions

- **Every world has a URL.** `lib/worlds.ts` owns the mapping. Canonical slugs
  are plain and guessable (`/map`, `/machine`, `/garage`) because people paste
  them; in-fiction aliases (`/kwnd`, `/emdur-486`, `/sector-02b`) redirect to
  them. `/` is the front door and nothing else.
- **`WorldManager` lives in the root layout, not a page.** That's what lets
  moving between `/map` and `/garage` keep the store and animate the portal
  instead of remounting. Pages under `app/[world]/` only declare which world.
  Travelling in-site animates; arriving at a URL directly doesn't — you didn't
  come through anything.
- `lib/identity.ts` is the single source of truth for name, email, location,
  GitHub, repo. If a string identifies the person rather than the place, it goes
  there. Never hardcode a second copy.
- `reactStrictMode: false` is load-bearing — StrictMode's double-mount kills the
  WebGL context in worlds using drei `<Text>`.
- One WebGL context per world. Two simultaneous R3F `<Canvas>` elements produced
  a valid context that silently never rendered.
- Vercel auto-deploys `main`. Work on a branch; never deploy directly.

## Workflow

Branch → build → verify → log. One major feature *or* two medium *or* five small
per session; never more than three worlds at once. Run `next build` and verify
navigation and mobile before logging to `PROGRESS.md`.

## Files

| | |
|---|---|
| `PLAN.md` | The roadmap — goals above, in full |
| `PROGRESS.md` | Session log |
| `docs/archive/` | Retired plans and history. Nothing active. |
