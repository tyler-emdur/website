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
