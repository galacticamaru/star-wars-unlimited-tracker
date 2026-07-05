---
phase: 27-decks-route-performance
plan: "03"
subsystem: ui
tags: [perf, lcp, inp, loading-skeleton, suspense, perf-09]
dependency_graph:
  requires: [27-01, 27-02]
  provides: [27-03-perf09-complete]
  affects:
    - src/app/decks/loading.tsx
    - src/app/decks/[id]/loading.tsx
tech_stack:
  added: []
  patterns:
    - loading-tsx-streaming-skeleton
    - suspense-boundary-lcp-fix
key_files:
  created:
    - src/app/decks/loading.tsx
  modified:
    - src/app/decks/[id]/loading.tsx
decisions:
  - "PATH A taken — sufficient Speed Insights data available for both /decks and /decks/[id]"
  - "/decks loading.tsx skeleton headers heading + three deck row placeholders before DB resolves"
  - "/decks/[id] card area skeleton replaced with four divide-y rows to cover the empty-state LCP region"
  - "INP: startTransition already applied in Plan 02; Base UI internals out-of-scope"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-02"
  tasks_completed: 1
  files_changed: 2
---

# Phase 27 Plan 03: PERF-09 Speed Insights Fixes Summary

**One-liner:** PATH A — streaming skeletons added/strengthened for /decks and /decks/[id] to fix very poor LCP identified in Vercel Speed Insights; startTransition INP fix confirmed applied in Plan 02.

## Speed Insights Findings (Verbatim from Human Review)

### /decks route

| Metric | Value | Status | Finding |
|--------|-------|--------|---------|
| LCP | very poor | VERY POOR | LCP element: `div>h2.text-xl.font-semibold` — the deck list page heading is the LCP element, meaning the page waits for data before painting anything meaningful above the fold |
| INP | — | — | No data surfaced for this route |
| FCP | — | — | No separate FCP data surfaced |

### /decks/[id] route

| Metric | Value | Status | Finding |
|--------|-------|--------|---------|
| LCP | very poor | VERY POOR | LCP element: `div.bg-white.border.rounded-lg.divide-y.shadow-sm>div.p-8.text-center.text-slate-400.text-sm>p` — an empty-state paragraph inside the deck builder card area; nothing above-fold renders before it |
| INP | poor | POOR | Elements: `#base-ui-_r_n_` and `#base-ui-_r_o_` — Base UI auto-generated IDs, likely Combobox or Sheet interactive primitives from Phase 26 mobile toolbar |

## Finding → Fix Mapping Table (PATH A)

| Route | Metric | Finding | Fix Applied | Commit |
|-------|--------|---------|-------------|--------|
| /decks | LCP VERY POOR | Page heading (`h2.text-xl.font-semibold`) is LCP; page waits for DB before paint | Created `src/app/decks/loading.tsx`: skeleton renders heading placeholder + three deck row placeholders immediately; DB queries (getDecks + getWantList) no longer block first paint | 313706a |
| /decks/[id] | LCP VERY POOR | Empty-state paragraph inside card area (`div.p-8.text-center.text-slate-400.text-sm>p`) is LCP | Strengthened `src/app/decks/[id]/loading.tsx`: replaced sparse `p-12 text-center` two-bar placeholder with four `divide-y` card rows (bg-white border rounded-lg) matching real card list structure; filled skeleton blocks are now the above-fold LCP candidate | 352f6e6 |
| /decks/[id] | INP POOR | Base UI auto-IDs `#base-ui-_r_n_` / `#base-ui-_r_o_` (Combobox/Sheet primitives) | startTransition already applied to all three dispatch calls (SET_LEADER, SET_BASE, UPDATE_CARD) in handleDeckUpdate in Plan 02 (commit e0a90ee). Base UI component internals are not in scope for this plan's files_modified; if INP persists, follow up targeting Base UI primitive event handling. | e0a90ee (Plan 02) |

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 2a | Add /decks streaming skeleton (LCP fix) | 313706a | src/app/decks/loading.tsx (new) |
| 2b | Strengthen /decks/[id] card area skeleton (LCP fix) | 352f6e6 | src/app/decks/[id]/loading.tsx |

## What Was Built

**`src/app/decks/loading.tsx` (new)**

Loading skeleton for the /decks list route. Mirrors DecksClient layout:
- Heading placeholder (`h-9 w-36 bg-slate-200`) — replaces the `h1.text-3xl.font-bold` LCP candidate with a filled skeleton block
- Create-deck form placeholder — input + button skeleton
- Three deck row skeletons — each mirrors `flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm` with name/date lines and Edit/Delete button placeholders
- Uses `animate-pulse`; no auth/headers calls (loading.tsx Server Component constraint)

**`src/app/decks/[id]/loading.tsx` (modified)**

Replaced the sparse `p-12 text-center` two-bar placeholder in the card list area with four `divide-y` card row skeletons:
```
<div className="bg-white border rounded-lg shadow-sm divide-y">
  {[0,1,2,3].map(i => (
    <div key={i} className="flex items-center gap-3 p-4">
      <div className="h-10 w-8 bg-slate-200 rounded shrink-0" />
      <div className="flex-1 space-y-2">...</div>
      <div className="h-6 w-12 bg-slate-200 rounded shrink-0" />
    </div>
  ))}
</div>
```
The `divide-y` class matches the real deck card list structure. The filled blocks are a solid above-fold LCP candidate, displacing the empty-state text paragraph that was recording as LCP.

All five `DeckBuilderLoading` tests remain green (animate-pulse present, w-80 sidebar present, h-[calc(100svh-56px)] outer, no auth/headers, renders without throwing).

## Verification

```
npx vitest run src/app/decks/[id]/loading.test.tsx
```

Result: 1 test file, 5 tests — all passing.

## Deviations from Plan

None — plan executed as written. PATH A taken because actionable regression data was provided for both routes. The INP finding for /decks/[id] was handled by confirming the Plan 02 fix covers the dispatch layer; Base UI internals are documented as out-of-scope per the plan's acceptance criteria.

## Known Stubs

None — all skeleton blocks are static placeholders with no data source; no production data is deferred.

## Threat Flags

None. `src/app/decks/loading.tsx` streams before authenticated RSC resolves — it contains only static placeholder shapes, no user data (T-27-03-01 accepted). No new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

Files verified:
- src/app/decks/loading.tsx: FOUND (created, contains animate-pulse)
- src/app/decks/[id]/loading.tsx: FOUND (modified, contains divide-y card rows)

Commits verified:
- 313706a: FOUND (feat(27-03): add /decks streaming skeleton to fix very poor LCP)
- 352f6e6: FOUND (feat(27-03): strengthen /decks/[id] skeleton card area coverage for LCP)

Test suite: npx vitest run src/app/decks/[id]/loading.test.tsx — 5/5 passed
