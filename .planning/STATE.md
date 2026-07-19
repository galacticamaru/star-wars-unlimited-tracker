---
gsd_state_version: 1.0
milestone: v7
milestone_name: Trade Binder Improvements
current_phase: 31
current_phase_name: Trade Profile Modal & Public Trade Note
status: ready_to_plan
stopped_at: Phase 31 context gathered
last_updated: "2026-07-19T22:11:31.382Z"
last_activity: 2026-07-19
last_activity_desc: Phase 30 complete, transitioned to Phase 31
progress:
  total_phases: 12
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-19)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus**: Phase 31 — Trade Profile Modal & Public Trade Note

## Current Position

Phase: 31 — Trade Profile Modal & Public Trade Note
Plan: Not started
Status: Ready to plan Phase 31
Last activity: 2026-07-19 — Phase 30 complete, transitioned to Phase 31

Progress: [█░░░░░░░░░] 8% (1/12 phases)

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
- v7 roadmap defined 2026-07-05: Phases 30 (Unified Search-Driven Add Flow), 31 (Trade Profile Modal & Public Trade Note), 32 (Combined Wants & Exclusions List), 33 (Ashes of the Empire Spotlight Decks — GATED)
- Phase 33 is gated/blocked pending (a) user-supplied Luke Skywalker (ASH) and Emperor Palpatine (ASH) deck lists, and (b) the ASH set syncing into the catalog DB via swu-db.com — same blocker class as DEBT-05 (LAW spotlight deck); sequenced last so it never blocks Phases 30–32 shipping

### Key Architectural Notes for v7

- Manage Binder page (`src/app/binder/manage/page.tsx`) today has separate "Add Cards to Binder" grid, `ManualWantsAddFlow`, `VariantTradeSheet`, and `ManageWantsList` — Phase 30 collapses the first two into one search-driven flow
- Existing manual wants are limited to owned cards (`/api/collection/owned-cards`); Phase 30 needs a full-catalog search query/endpoint since BINDER-11/14 require unowned cards to be searchable and want-able
- Trade note (BINDER-16/17) needs a new user-level schema field — not yet in `src/db/schema.ts`
- Username/binder-URL section is currently inline on the manage page; Phase 31 extracts it into a profile-button modal
- Hold v6 per-user cache-tag + two-layer invalidation pattern (`revalidateTag()` + `router.refresh()`) for any new mutation endpoints in Phases 30–32
- No @radix-ui imports — Base UI (@base-ui/react) + shadcn/ui only, per project constraint

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

## Session

**Last session:** 2026-07-19T22:11:31.373Z
**Stopped at:** Phase 31 context gathered
**Resume file:** .planning/phases/31-trade-profile-modal-public-trade-note/31-CONTEXT.md
