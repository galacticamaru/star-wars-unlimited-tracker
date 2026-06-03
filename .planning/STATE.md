---
gsd_state_version: 1.0
milestone: v6
milestone_name: milestone
status: executing
last_updated: "2026-06-03T01:21:07.804Z"
last_activity: 2026-06-03 -- Phase 28 execution started
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 11
  completed_plans: 9
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-29)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus**: v6 — Mobile, Performance & Polish

## Current Position

Phase: 28 (tech-debt-sweep) — EXECUTING
Plan: 1 of 2
Status: Executing Phase 28
Last activity: 2026-06-03 -- Phase 28 execution started

```
v6 Progress: [░░░░░░░░░░] 0% (0/3 phases)
```

## Performance Metrics

**Velocity:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1 MVP | 7 | 22 | 5 days |
| v2 Multi-User | 5 | 16 | 1 day |
| v3 Catalog & Polish | 4 | 12 | 1 day |
| v4 Deck Builder & Collection | 11 | 34 | 10 days |
| v5 Trade Binder & Performance | 4 | 14 | 4 days |
| Phase 27 P03 | 10min | 1 tasks | 2 files |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Want List | Export / share want list (WANT-03) | v7+ | v4 planning |
| Collection | SWUDB CSV import (COLLECT-05) | v7+ | v4 planning |
| Collection | CSV export (COLLECT-04 v2) | v7+ | v4 planning |
| Filters | Market price threshold filter (REQ-MARKET-05) | v7+ | v4 planning |
| Tech Debt | DeckBuilder Add Cards tab variant art (DEBT-02) | v7+ | v6 planning |
| Tech Debt | LAW spotlight deck 9 unknown cards (DEBT-05) | v7+ | v6 planning (pending DB sync) |

## Accumulated Context

### Roadmap Evolution

- Phase 25.1 inserted after Phase 25: Speed Insights Integration (URGENT)
- Phase 25.1 complete: @vercel/speed-insights@2.0.0 wired in root layout; user must enable Speed Insights in Vercel dashboard post-deploy for PERF-06 to fully close
- v6 roadmap defined 2026-05-29: Phases 26 (Mobile UX), 27 (/decks Performance), 28 (Tech Debt Sweep)
- DEBT-02 and DEBT-05 deferred out of v6 scope: DEBT-02 needs more investigation on virtualized list interaction; DEBT-05 pending DB sync

### Key Architectural Notes for v6

- Mobile sidebar: `hidden md:flex` on inline desktop sidebar; `Sheet` trigger (`md:hidden`) in toolbar; `DeckSidebar` renders inside `SheetContent` portal to `document.body` — must not be a child of the `overflow-hidden` clipping container
- Height fix: `h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)]` on deck builder root — `dvh` is keyboard-safe on mobile, `svh` stays on desktop
- Cache tagging: `cacheTag('decks-user-{userId}')` on `getDecks`; `cacheTag('deck-{deckId}-user-{userId}')` on `getDeckWithCards`; never cache without userId in key (cross-user data leak risk)
- Two-layer cache invalidation required: `revalidateTag()` busts Data Cache; `router.refresh()` busts Router Cache — both must fire after mutations
- DEBT-04 (catalog invalidation): existing `useEffect` collection re-fetch on `/cards` is already the correct mechanism — verify it runs after card detail mutations, no new code needed
- Speed Insights data is live: review Vercel dashboard for /decks FCP/LCP/INP before fixing (PERF-09 is data-driven)
- Phase 27 depends on Phase 26 (save-flow testing surfaces missing `revalidateTag` calls)
- Phase 28 depends on Phase 26 (DEBT-03 should land after Phase 26 merge to avoid conflicts on `deck-builder.tsx`)
- PERF-09 PATH A complete: /decks very poor LCP fixed with streaming skeleton (loading.tsx); /decks/[id] very poor LCP fixed by strengthening card area skeleton; INP covered by Plan 02 startTransition — Base UI internals out of scope if INP persists
