---
phase: 17-variant-collection-tracking
plan: "03"
subsystem: collection-api
tags: [api, route-handler, auth, variant-tracking, wave-2]
dependency_graph:
  requires:
    - src/db/queries/collection.ts (upsertVariantCount, recomputeTotal — from Plan 02)
    - src/app/api/collection/collection-shape.ts (buildCollectionMap — from Plan 02)
  provides:
    - src/app/api/collection/variants/route.ts (POST /api/collection/variants)
    - src/app/api/collection/route.ts (GET returns CollectionMap; POST removed)
  affects:
    - src/components/catalog/catalog-client.tsx (reads old shape — Plan 04 updates consumers)
    - src/components/decks/want-list-tab.tsx (reads old shape — Plan 04 updates consumers)
    - src/components/catalog/collection-controls.tsx (POSTs to old endpoint — Plan 04 updates)
tech_stack:
  added: []
  patterns:
    - auth.api.getSession auth gate pattern (consistent with existing routes)
    - Math.max(0, Number(count)) for count floor at zero (D-04 security)
    - Sequential await pattern for Neon HTTP driver (no transactions)
    - userId always from session.user.id (V4 Access Control, ASVS L1)
key_files:
  created:
    - src/app/api/collection/variants/route.ts
  modified:
    - src/app/api/collection/route.ts
decisions:
  - "POST /api/collection removed per D-03; all count mutations via POST /api/collection/variants"
  - "recomputeTotal lookup requires cardDefinitionId from cardPrintings join — not available in request body"
  - "Count floor at 0 applied before upsertVariantCount to prevent negative injection (T-17-03-03)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-17"
---

# Phase 17 Plan 03: API Routes — Variants Endpoint and Collection Shape Summary

POST /api/collection/variants created with auth gate, input validation, count flooring, and sequential upsert+recompute; GET /api/collection updated to return enriched CollectionMap shape via buildCollectionMap; POST /api/collection handler removed per D-03.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create POST /api/collection/variants route | 5a4faae | src/app/api/collection/variants/route.ts |
| 2 | Update GET /api/collection and remove POST handler | 7b79054 | src/app/api/collection/route.ts |

## Verification

```
npx tsc --noEmit
```

Result: exits 0 — TypeScript clean after both tasks.

```
grep -n "export async function POST" src/app/api/collection/route.ts
```
Result: no matches (removed).

```
grep -n "export async function POST" src/app/api/collection/variants/route.ts
```
Result: line 9 — matched.

```
grep -n "buildCollectionMap" src/app/api/collection/route.ts
```
Result: lines 2, 17 — import and call present.

```
grep -n "Math.max(0" src/app/api/collection/variants/route.ts
```
Result: line 31 — present.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| File | Line | Description |
|------|------|-------------|
| src/components/catalog/catalog-client.tsx | 64, 107 | Still typed `Record<number, number>` and POSTs to old `/api/collection` — Plan 04 updates consumers to new shape |
| src/components/decks/want-list-tab.tsx | 17, 38 | Reads `collection[id] ?? 0` (flat number) — Plan 04 updates to `.total` access |
| src/components/catalog/collection-controls.tsx | 31 | POSTs to `/api/collection` (removed endpoint) — Plan 04 migrates to `/api/collection/variants` |

These consumers will produce incorrect results at runtime until Plan 04 completes the client update. The API layer (Plan 03's goal) is fully implemented and TypeScript-clean.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: new-endpoint | src/app/api/collection/variants/route.ts | New POST endpoint — mitigated per T-17-03-01 through T-17-03-04: auth gate (401), session-scoped userId, count floor at 0, cardPrintingId type validation |

All five STRIDE threats from the plan's threat model are implemented and verified in the route.

## Self-Check: PASSED

Files exist:
- FOUND: src/app/api/collection/variants/route.ts (contains export async function POST)
- FOUND: src/app/api/collection/route.ts (contains buildCollectionMap, no POST handler)

Commits exist:
- 5a4faae: feat(17-03): create POST /api/collection/variants route
- 7b79054: feat(17-03): update GET /api/collection to enriched shape; remove POST

TypeScript: clean (npx tsc --noEmit exits 0).
