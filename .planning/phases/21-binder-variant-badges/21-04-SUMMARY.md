---
phase: 21-binder-variant-badges
plan: "04"
subsystem: database
tags: [drizzle, neon, postgres, schema-migration, trade-offerings]

# Dependency graph
requires:
  - phase: 21-binder-variant-badges/21-02
    provides: userTradeOfferings schema definition and query layer
  - phase: 21-binder-variant-badges/21-03
    provides: UI badge rendering and cardPrintingId wiring

provides:
  - Live user_trade_offerings table in Neon DB (composite PK user_id + card_printing_id)
  - trade_quantity column dropped from user_collections
  - Public binder page rendering variant badges for non-Normal trade offerings

affects: [any phase that reads or writes user_collections or user_trade_offerings]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DDL-first schema push via drizzle-kit push — column drop is atomic with table creation"
    - "No-op data migration pattern — when DDL already dropped the source column, migration SQL is skipped safely"

key-files:
  created: []
  modified:
    - src/app/binder/[username]/page.tsx

key-decisions:
  - "Data migration was a no-op: trade_quantity was dropped atomically during DDL push; no prior trade_quantity rows existed, so user_trade_offerings starts empty and users re-add offerings through the new UI"
  - "Gap fix applied post-checkpoint: mapToFilterable was not forwarding variantType, so the Foil badge never appeared on the public binder page — added variantType: c.variantType to the mapping"

patterns-established:
  - "Public binder page mapToFilterable: always forward all card fields including variantType to avoid silent badge suppression"

requirements-completed: [REQ-BINDER-06]

# Metrics
duration: ~30min
completed: 2026-05-23
---

# Phase 21 Plan 04: DB Deployment + Human Smoke Verification Summary

**Neon DB production schema pushed — user_trade_offerings live, trade_quantity dropped, and public binder Foil badge confirmed visible after variantType mapping fix**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-23
- **Completed:** 2026-05-23
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 1 (plus DB-level DDL)

## Accomplishments

- Applied drizzle-kit push to Neon production DB: created `user_trade_offerings` table with composite PK `(user_id, card_printing_id)` and FK to `card_printings.id`
- Confirmed `trade_quantity` column dropped from `user_collections` (verified via information_schema query — 0 rows)
- Gap fix: `src/app/binder/[username]/page.tsx` `mapToFilterable` now forwards `variantType`, making the Foil badge visible on the public binder page
- Human verification approved — all 5 checks passed

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply DDL to Neon DB** — `35e3e27` (chore)
2. **Task 2: Data migration SQL — no-op** — `d5ea0c3` (chore)
3. **Gap fix: pass variantType through mapToFilterable** — `47259a3` (fix)

## Files Created/Modified

- `src/app/binder/[username]/page.tsx` — Added `variantType: c.variantType` to `mapToFilterable` so the variant badge renders on public binder tiles

## Decisions Made

- Data migration was a no-op: `trade_quantity` was already dropped atomically by the DDL push, and no prior rows with `trade_quantity > 0` existed in the database. `user_trade_offerings` starts empty; users re-add offerings via the new UI.
- No psql or Neon console SQL was needed for migration — the pre-migration row count returned 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Public binder page not passing variantType through mapToFilterable**

- **Found during:** Task 3 (human-verify checkpoint — step 4 of 5)
- **Issue:** `src/app/binder/[username]/page.tsx` `mapToFilterable` function did not include `variantType` in the object it returned. The `CardForFilter` type requires `variantType` for the badge render path, but the field was silently `undefined`, so the Foil badge never appeared on the public binder page even though `CardItem` was correctly wired.
- **Fix:** Added `variantType: c.variantType` to the `mapToFilterable` return object in `src/app/binder/[username]/page.tsx`.
- **Files modified:** `src/app/binder/[username]/page.tsx`
- **Verification:** Human re-checked `/binder/{username}` after fix — Foil badge now visible. All 5 checkpoint checks passed.
- **Committed in:** `47259a3` (gap fix applied during checkpoint)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Fix was essential for the plan's primary deliverable (variant badge on public binder). No scope creep.

## Issues Encountered

- `trade_quantity` column had already been dropped atomically as part of the DDL push, so the migration SQL had no source data to act on. This was a safe no-op — the pre-migration SELECT confirmed 0 rows before any INSERT was attempted.

## User Setup Required

None — no external service configuration required beyond the Neon DB push that was performed during execution.

## Next Phase Readiness

- Phase 21 is complete. All 6 success criteria met:
  1. `user_trade_offerings` exists in Neon DB with correct schema
  2. `trade_quantity` dropped from `user_collections`
  3. Data migration confirmed no-op (no prior trade data lost)
  4. Public binder shows variant badges on non-Normal offering tiles
  5. All automated tests pass (`npx vitest run` exit 0)
  6. Human checkpoint approved — all 5 checks passed
- No blockers for downstream phases.

---
*Phase: 21-binder-variant-badges*
*Completed: 2026-05-23*
