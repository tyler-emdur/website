# Front Door Pivot — a real entry point, nothing deleted

Started 2026-07-27. Separate initiative from PLAN.md's "Immersion Plan" (which
is about making individual worlds feel like places). This one is about the
*entrance* to the whole site — who it's for and what they learn in the first
five seconds.

**Ground rule, non-negotiable per Tyler: delete nothing.** Every existing
world stays exactly as it is. This is additive only.

---

## The actual problem

The site currently proves *skill* extremely well — ten worlds, live APIs
(Strava, HLS camera feeds), a working DOS shell, procedural audio, a
game-quality endless aisle. Nobody who walks through it doubts this person can
build things.

It proves *nothing else*. A cold visitor — someone from a VC firm, a college
admissions reader, a recruiter, anyone Tyler hands the link to — lands on
World 0, a Geocities/Netscape parody, with zero signal about who they're
looking at or why it matters to them. The bio in World 0's sidebar says
"Software engineer. Builder of worlds. Boulder, Colorado." That's not wrong,
but it's also not the real story.

**The real story, from Tyler directly (2026-07-27):** student at Boulder High
School, does real software design/engineering for Faraday Construction, builds
ambitious personal projects (this site, Digger), and is aiming long-term at
finance — specifically venture capital. That's a genuinely strong, specific
narrative — a builder who's headed toward evaluating and backing other
builders — and none of it is legible anywhere on the site right now.

## What "timeless" means for this pivot

Not "less retro." The multiverse concept is the differentiator and won't date
the way a generic template portfolio does — that's staying exactly as built.
Timeless here means: the first thing a stranger sees shouldn't depend on
"get" the joke to extract who Tyler is. A clear, honest identity layer ages
fine regardless of when someone opens the link; a cold nostalgia gag as the
*only* opening beat doesn't.

---

## The shape (decided with Tyler, 2026-07-27)

**Option chosen: a new, quiet screen in front of World 0** — not a rebuild of
World 0, not a new world buried in the hub. Whoever lands on the site sees
this first, gets oriented in five seconds, and either leaves with what they
came for or clicks through into the multiverse exactly as it exists today.

```
┌─────────────────────────────┐
│                             │
│      Tyler Emdur            │
│      [positioning line]     │
│                             │
│  Boulder, CO · [resume]     │
│  [github] [email]           │
│                             │
│  ───────────────────────    │
│                             │
│   [ enter the multiverse ]  │
│                             │
└─────────────────────────────┘
```

Small "skip" affordance for repeat visitors / anyone who wants straight into
the retro experience. World 0 is otherwise completely untouched.

### Copy — decided 2026-07-27

Tyler shared his real resume. Explicit direction: **it should not read like a
resume** — "none of these are that impressive in the grand scheme of things."
Of everything on it, two threads actually build the builder→VC narrative:
Faraday Construction (real sales/financial-projections work) and Scoutout AI
(built models evaluating real-estate investment opportunities — a dry run for
venture-style thinking). Everything else on the resume (science fair
placements, Model UN, G&T board, youth group, DSI camps) is real but is
clutter on a five-second front door — deliberately left off.

Tone: minimalist, chosen from three drafts. No school/age mention — matches
how Tyler's own resume handles it (implied by content, never stated).

```
Tyler Emdur
Builder · Boulder, CO
Faraday Construction · Scoutout AI · headed toward VC
```

**No resume link.** Considered and explicitly declined — a "resume" link
(relabeled or not) still reads as resume-like. Front door is the line above
plus GitHub + email. Anyone who wants more can ask directly.

---

## Threading identity through the rest of the site ("more me")

Small, additive touches elsewhere — none of these replace or restructure
anything that exists:

- **World 5 (EMDUR-486 desktop)** already has `README.TXT` and a `PROGRAMS`
  folder in-fiction. A `RESUME.TXT` or `ABOUT.TXT` icon fits the desktop
  metaphor exactly and costs almost nothing to add.
- **World 7 (Contact)** and the **World 1 hub gate index** could carry a
  resume/LinkedIn link alongside the email/GitHub that's already there —
  one more line, not a redesign.

These are optional polish, lower priority than the front door itself, and can
land whenever — they don't block or gate anything.

---

## Phasing

Following the same discipline as PLAN.md: one scoped unit of work per
session, branch → build → verify → log.

| # | Session | Depends on |
|---|---|---|
| 1 | Build the front-door screen — DOM/CSS only, no WebGL, so it's fully verifiable without the automation-tab trap PLAN.md already documents. Wire it in front of World 0 with a skip control. Ship with placeholder copy. | Nothing — can start immediately |
| 2 | Real content pass — final positioning line, resume link (or confirmed alternative), decision on how explicit to be about school | Tyler's answers above |
| 3 (optional) | Small identity touches inside World 5 / World 7 / hub | Nothing, can slot in anytime, lowest priority |

## Explicitly not doing

- Not touching, rebuilding, or gating World 0 — it stays the front door's
  "then" beat, unchanged.
- Not deleting or altering any of the 10 existing worlds.
- Not inventing job titles, seniority, or achievements that aren't real —
  the actual story (real shipped engineering work + a specific finance/VC
  trajectory) is strong enough on its own.
- Not blocking entry to the multiverse behind the new screen — it's a
  prelude with a skip, not a gate.
