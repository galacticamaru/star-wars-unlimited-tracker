---
phase: 28-tech-debt-sweep
plan: "02"
subsystem: catalog
tags: [bfcache, pageshow, collection, debt]
dependency_graph:
  requires: []
  provides: [DEBT-04]
  affects: [src/components/catalog/catalog-client.tsx]
tech_stack:
  added: []
  patterns: [pageshow-bfcache-listener, useEffect-cleanup-pattern, shared-fetch-helper]
key_files:
  created:
    - src/components/catalog/catalog-client-pageshow.test.ts
  modified:
    - src/components/catalog/catalog-client.tsx
decisions:
  - "Extracted shared fetchCollection() helper to avoid duplicating fetch('/api/collection').then().then(setCollection) in both the remount effect and the new pageshow handler"
  - "Used [isAuthenticated] dependency array on the pageshow useEffect — consistent with existing collection effect; re-registers handler when auth state changes"
  - "eslint-disable-line react-hooks/exhaustive-deps on both effects — fetchCollection is a stable inline function (same pattern used elsewhere)"
metrics:
  duration: "~6 minutes"
  completed: "2026-06-03T01:25:33Z"
  tasks_completed: 1
  files_modified: 2
---

# Phase 28 Plan 02: BFCache Catalog State Invalidation Summary

**One-liner:** pageshow listener re-fetches /api/collection on BFCache restore for authenticated users, eliminating stale owned-count overlays after mobile back-button navigation (DEBT-04).

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 (TDD RED) | Failing pageshow tests | 8972a8c | catalog-client-pageshow.test.ts |
| 1 (TDD GREEN) | pageshow listener implementation | 50f6221 | catalog-client.tsx |

## What Was Built

Added a `pageshow` event listener to `CatalogClient` that re-fetches the collection from `/api/collection` when the browser restores the page from the BFCache (`event.persisted === true`) and the user is authenticated.

**Root cause closed:** When a user edits owned counts on a card detail page and presses the device back button, mobile browsers often restore the catalog page from the BFCache rather than remounting React. The existing `useEffect([isAuthenticated])` collection re-fetch only runs on remount, so BFCache restores showed stale owned-count overlays. The new `pageshow` listener covers this gap.

**Changes to `catalog-client.tsx`:**
- Extracted a `fetchCollection()` helper (lines 72-79) from the inline fetch in the remount effect — avoids duplicating the fetch chain in two places
- Updated the remount effect to call `fetchCollection()` (behavior preserved exactly)
- Added a new `useEffect` (lines 93-101) that registers `window.addEventListener('pageshow', handlePageShow)` and returns a cleanup that calls `window.removeEventListener('pageshow', handlePageShow)`
- Handler signature: `(e: PageTransitionEvent)` — guards on `e.persisted && isAuthenticated` before calling `fetchCollection()`

**TDD compliance:**
- RED: 7 tests written; 5 failed (pageshow not yet present), 2 passed (setCollection/[isAuthenticated] already in file). Committed at 8972a8c.
- GREEN: Implementation added; all 7 tests pass. Committed at 50f6221.
- No REFACTOR step needed — fetchCollection extraction was done inline during GREEN.

## Deviations from Plan

### Auto-applied

**1. [Rule 2 - Missing critical functionality] Extracted shared fetchCollection() helper**
- **Found during:** Task 1 (GREEN phase)
- **Context:** Plan explicitly permitted extraction as optional ("you MAY extract the shared fetch logic")
- **Fix:** Extracted `fetchCollection()` inline function used by both effects instead of duplicating the fetch chain
- **Files modified:** `src/components/catalog/catalog-client.tsx`
- **Commit:** 50f6221

## Known Stubs

None — the pageshow listener is fully wired to the real `/api/collection` endpoint.

## Threat Flags

None — no new trust boundaries introduced. The pageshow listener uses the same `fetch('/api/collection')` call already present in the remount effect. T-28-03 (Information Disclosure) mitigated: handler only fetches when `isAuthenticated` is true; the GET /api/collection route independently enforces session auth (verified in route.ts lines 8-11).

## Out-of-Scope Pre-existing Failures (deferred)

The full test suite run revealed 15 pre-existing test failures across unrelated test files (`tests/catalog-variant.test.ts`, `tests/binder-queries.test.ts`, `tests/data-isolation.test.ts`, `tests/trade-api.test.ts`, `__tests__/api-deck-validation.test.ts`, `tests/binder-manage-render.test.tsx`). These failures pre-date this plan and are not caused by the pageshow listener changes. Logged for visibility; out of scope per deviation boundary rules.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/components/catalog/catalog-client.tsx | FOUND |
| src/components/catalog/catalog-client-pageshow.test.ts | FOUND |
| .planning/phases/28-tech-debt-sweep/28-02-SUMMARY.md | FOUND |
| Commit 8972a8c (RED tests) | FOUND |
| Commit 50f6221 (GREEN impl) | FOUND |
