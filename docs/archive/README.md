# Archive

Nothing in this folder is active. It is kept for provenance — what was decided,
what was tried, and which findings turned out to be wrong.

**The active plan is `/PLAN.md` at the repo root.** The constitution — identity,
principles, anti-slop rules, session-log template — is `/PROGRESS.md`.

| File | What it was | Why it's here |
|---|---|---|
| `PLAN-immersion-2026-07.md` | "Immersion Plan" — turning worlds into places, 2026-07-24 | Sessions 1 and 3 shipped. Its live items (Warehouse 14 shadows, the Answering Machine, the "Later" list) and its measurement-trap warning were pulled forward into `/PLAN.md`. |
| `PIVOT.md` | "Front Door Pivot" — a real entry point, 2026-07-27 | The front door shipped, but without the positioning line the document's whole argument rests on. Recorded as Open Question 1 in `/PLAN.md`. |
| `PLAN-discoverability-2026-08.md` | Discoverability pass after walking all 11 worlds, 2026-08-10 | Folded into the `/PLAN.md` roadmap. |
| `PROGRESS-history-2026-07.md` | Dated session-log entries through July 2026 | Moved out of `PROGRESS.md` to keep that file focused. Still the record of what actually happened. |

## Why the retractions are kept

`PLAN-immersion-2026-07.md` documents three confident findings that were wrong,
all traced to the same cause: browser-automation tabs pause
`requestAnimationFrame`, so every WebGL world renders black there and no timing
measured there means anything. That warning is reproduced at the top of
`/PLAN.md` and is the most expensive lesson in this repository. Do not delete
these files without carrying it forward.
