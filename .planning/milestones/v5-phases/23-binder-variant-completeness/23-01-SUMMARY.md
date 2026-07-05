---
phase: 23-binder-variant-completeness
plan: "01"
subsystem: data-layer
tags:
  - drizzle
  - migration
  - schema
  - trade-manual-wants
  - binder
  - looking-for
dependency_graph:
  requires: []
  provides:
    - tradeManualWants-printing-keyed-schema
    - upsertManualWant-cardPrintingId
    - deleteManualWant-cardPrintingId
    - getPublicBinderData-per-printing-lookingFor
    - getUserTradeData-per-printing-manualWants
  affects:
    - src/db/schema.ts
    - src/db/queries/trade.ts
    - src/db/queries/binder.ts
    - src/app/api/binder/wants/route.ts
    - src/app/binder/manage/page.tsx
    - src/components/binder/manage-wants-list.tsx
tech_stack:
  added: []
  patterns:
    - Hand-written Drizzle SQL migration for multi-step PK swap
    - innerJoin chain tradeManualWants -> cardPrintings -> cardDefinitions for per-printing wants
    - Separate manual-want and auto-want paths in getPublicBinderData
key_files:
  created:
    - drizzle/0005_binder_variant_completeness.sql
  modified:
    - drizzle/meta/_journal.json
    - src/db/schema.ts
    - src/db/queries/trade.ts
    - src/db/queries/binder.ts
    - src/app/api/binder/wants/route.ts
    - src/app/binder/manage/page.tsx
    - src/components/binder/manage-wants-list.tsx
decisions:
  - "Manual wants per-printing join (tradeManualWants -> cardPrintings -> cardDefinitions) bypasses calculateLookingFor entirely; auto-wants continue to use calculateLookingFor with inventory shortfall"
  - "Migration applied directly via @neondatabase/serverless with explicit WebSocket constructor (drizzle-kit migrate fails in WSL due to TLS certificate issue with its child process)"
  - "DELETE handler in /api/binder/wants also updated to use cardPrintingId query param for consistency"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-26"
  tasks_completed: 4
  files_modified: 7
---

# Phase 23 Plan 01: Binder Variant Completeness Data Layer Summary

**One-liner:** Migrated `tradeManualWants` from `card_definition_id` PK to `card_printing_id` PK; updated all server-side consumers to produce per-printing manual-want Looking For entries with `variantType`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | SQL migration + schema.ts update | dc93252 | drizzle/0005_binder_variant_completeness.sql, drizzle/meta/_journal.json, src/db/schema.ts |
| 2 | trade.ts query functions to cardPrintingId | 4cebf51 | src/db/queries/trade.ts |
| 3 | getPublicBinderData per-printing Looking For | f6ed2e8 | src/db/queries/binder.ts |
| 4 | wants route + manage binder client | 5b61b7b | src/app/api/binder/wants/route.ts, src/app/binder/manage/page.tsx, src/components/binder/manage-wants-list.tsx |

## Migration Details

### SQL Steps Applied (drizzle/0005_binder_variant_completeness.sql)

1. `ALTER TABLE "trade_manual_wants" ADD COLUMN "card_printing_id" integer`
2. `UPDATE trade_manual_wants SET card_printing_id = cp.id FROM card_printings cp WHERE cp.card_definition_id = tmw.card_definition_id AND cp.variant_type = 'Normal'`
3. `DELETE FROM "trade_manual_wants" WHERE "card_printing_id" IS NULL` (data loss per D-02)
4. `ALTER COLUMN card_printing_id SET NOT NULL` + FK constraint to `public.card_printings(id)`
5. `DROP CONSTRAINT trade_manual_wants_user_id_card_definition_id_pk` + `DROP COLUMN card_definition_id`
6. `ADD CONSTRAINT trade_manual_wants_user_id_card_printing_id_pk PRIMARY KEY (user_id, card_printing_id)`

### Data Migration Results

- **Rows before migration:** 21
- **Rows migrated to Normal printing:** 21 (all existing manual want rows had a Normal printing)
- **Rows dropped (no Normal printing):** 0
- **Data loss:** None (all 21 rows successfully mapped)

## Key Behavioral Changes

### getPublicBinderData lookingFor

- **Manual wants:** Now fetched via innerJoin `tradeManualWants → cardPrintings → cardDefinitions`. Each row is a per-printing entry with `variantType` from the printing. No `calculateLookingFor` needed — the quantity from `tradeManualWants.quantity` is used directly as `lookingForQuantity`.
- **Auto-wants:** Unchanged — card-definition level, use `calculateLookingFor(autoTarget, 0, inventory, excluded)`, then join to Normal printing to get `variantType: 'Normal'`.
- **Combined:** `lookingFor = [...manualWantRows, ...autoWantEntries]` — every entry has `variantType`.

### getUserTradeData manualWants

- Returns `{ cardPrintingId, variantType, quantity, name, subtitle }` per row
- Both `cardPrintingId` and `variantType` available for Manage Binder client and Plan 04 UI work

### /api/binder/wants

- POST: `cardPrintingId` (was `cardDefinitionId`)
- DELETE: `?cardPrintingId=` query param (was `?cardDefinitionId=`)

## Deviations from Plan

### Auto-fixed Issues

None.

### Deviation 1: drizzle-kit migrate runs via direct SQL (not npm run db:migrate)

**Found during:** Task 1
**Issue:** `npm run db:migrate` (drizzle-kit migrate) fails in the WSL/Bash executor environment because drizzle-kit spawns a child process that does not inherit `--use-system-ca`, causing its WebSocket connection to Neon to fail with TLS certificate verification errors. The migration tool hangs indefinitely.
**Fix:** Applied the 6-step migration SQL directly via `@neondatabase/serverless` with an explicit `WebSocket` constructor, then recorded all 6 migration hashes in `drizzle.__drizzle_migrations` so drizzle-kit considers them applied.
**Verification:** Queried `information_schema.columns` and `information_schema.table_constraints` directly to confirm `card_printing_id NOT NULL`, no `card_definition_id`, and PK `trade_manual_wants_user_id_card_printing_id_pk`. All 21 rows migrated with valid `card_printing_id` values.
**Impact:** None — the DB schema matches the intended post-migration state exactly. `npm run db:migrate` will report no pending migrations in future runs.

### Deviation 2: DELETE handler in route.ts also updated

**Found during:** Task 4
**Issue:** The existing DELETE handler in `/api/binder/wants/route.ts` used `?cardDefinitionId=` query param. After Task 1 drops `card_definition_id`, this handler would fail at the DB level.
**Fix:** Updated DELETE handler to use `?cardPrintingId=` query param and pass to `deleteManualWant(userId, cardPrintingId)`.
**Rule:** Rule 1 (bug fix — broken behavior after migration)

## Plans 02-04 Unblocked

This plan is the [BLOCKING] gate for Phase 23. All downstream plans can now proceed:
- **Plan 02** (Looking For variant badges): `lookingFor` entries now carry `variantType`; `CardItem` in want mode can be updated to show badge
- **Plan 03** (Card Detail trade section): No dependency on this plan's changes
- **Plan 04** (Manage Binder UX): `getUserTradeData.manualWants` now returns `{ cardPrintingId, variantType, ... }` as required by the new chip selector flow

## Known Stubs

None — all data flows are wired to real DB queries.

## Threat Flags

None — all security surfaces in this plan are within the threat model defined in the plan frontmatter (T-23-01-01 through T-23-01-05).

## Self-Check

**Checking files exist:**
- drizzle/0005_binder_variant_completeness.sql: FOUND
- src/db/schema.ts (updated): FOUND
- src/db/queries/trade.ts (updated): FOUND
- src/db/queries/binder.ts (updated): FOUND
- src/app/api/binder/wants/route.ts (updated): FOUND
- src/app/binder/manage/page.tsx (updated): FOUND
- src/components/binder/manage-wants-list.tsx (updated): FOUND

**Checking commits exist:**
- dc93252: feat(23-01): migrate tradeManualWants to printing-level PK — FOUND
- 4cebf51: feat(23-01): update trade.ts query functions to use cardPrintingId — FOUND
- f6ed2e8: feat(23-01): update getPublicBinderData for per-printing manual-want entries — FOUND
- 5b61b7b: feat(23-01): update wants route + manage binder client to cardPrintingId — FOUND

**Build:** `npm run build` exits 0 — PASSED

## Self-Check: PASSED
