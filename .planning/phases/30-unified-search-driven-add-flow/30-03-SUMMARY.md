---
phase: 30-unified-search-driven-add-flow
plan: 03
subsystem: ui
tags: [react, nextjs, typescript, vitest]

# Dependency graph
requires:
  - phase: 30-unified-search-driven-add-flow (Plan 01)
    provides: "Ownership-gated VariantTradeSection, always-available VariantWantSection, server-side /api/trade ownership enforcement"
  - phase: 30-unified-search-driven-add-flow (Plan 02)
    provides: "Extended VariantTradeSheet composing collection/trade/want sections, quantity field on SheetPrinting, onWantQuantityChange prop"
provides:
  - "mergeCatalogWithOwnership / filterSearchCards pure functions (src/lib/binder/merge-search-cards.ts) merging full catalog + ownership + wants into per-definition search results"
  - "Manage Binder page: lazy first-keystroke catalog+owned fetch, single 'Add Cards & Wants' search card replacing both legacy add surfaces"
  - "VariantTradeSheet on the manage page now receives every printing (owned and unowned), live-refreshed from mergedCards"
affects: [31, 32]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fetched-once ref guard pattern: a useRef boolean (not state) gates a first-keystroke Promise.all fetch so it fires exactly once, is reset to false only on error to allow Retry, and never re-fires on later keystrokes"
    - "Live sheet data via ID re-lookup: sheet state stores the clicked card snapshot for stable identity, but the printings actually rendered are re-derived on every render from the current mergedCards by cardDefinitionId, so ownedCount/tradeQuantity/quantity never go stale while the sheet is open"

key-files:
  created:
    - src/lib/binder/merge-search-cards.ts
    - src/lib/binder/merge-search-cards.test.ts
  modified:
    - src/app/binder/manage/page.tsx
  deleted:
    - src/components/binder/manual-wants-add-flow.tsx

key-decisions:
  - "Kept the results grid's per-tile onUpdateTradeQuantity shortcut (single-printing cards) with the exact same card.printings.length === 1 shape as the old owned-only grid, per the phase's pattern map's explicit 'keep this shape exactly' guidance and to satisfy the plan's grep-based verification that ownedCount > 0 no longer appears anywhere in the file — an unowned single-printing card's quick +/- click is a safe no-op (server 403s, no optimistic state change occurs) rather than a new gated code path"
  - "Sheet's printings prop re-looks-up the live card from mergedCards by cardDefinitionId on every render (falling back to the sheetCard snapshot) instead of freezing sheetCard.printings at click time, so ownedCount/tradeQuantity/quantity stay live while the sheet is open — extends the pre-existing pattern where 'quantity' was already re-derived live from tradeData in the prior implementation"
  - "Unowned card definitions derive bestArtUrl/bestVariantType by taking the highest VARIANT_PRECEDENCE catalog row (Showcase > ... > Normal) since selectBestVariantArtUrl requires ownership counts and can't be reused for the zero-ownership case"

patterns-established:
  - "Pure merge/filter module pattern (src/lib/binder/merge-search-cards.ts): no React/fetch/DOM, fully unit-testable, consumed by the page via useMemo — mirrors src/lib/filter-cards.ts's separation of pure logic from the client component"

requirements-completed: [BINDER-10, BINDER-11, BINDER-12]

coverage:
  - id: D1
    description: "mergeCatalogWithOwnership merges catalog rows + owned cards + manual wants into one MergedCard per card definition, unowned definitions included, printings default ownedCount/tradeQuantity/quantity to 0 when absent"
    requirement: "BINDER-11"
    verification:
      - kind: unit
        ref: "src/lib/binder/merge-search-cards.test.ts#mergeCatalogWithOwnership (5 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "filterSearchCards enforces the 2-char gate, case-insensitive name/subtitle match, 20-result cap with wasTruncated"
    requirement: "BINDER-11"
    verification:
      - kind: unit
        ref: "src/lib/binder/merge-search-cards.test.ts#filterSearchCards (3 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Manage Binder page mount fetch is reduced to /api/binder only; catalog + owned-cards fetch fires once on the first 2-char keystroke via a fetched-once ref guard, with a 150ms debounced search term"
    requirement: "BINDER-11"
    verification:
      - kind: unit
        ref: "grep -n \"/api/cards/all\" / grep -n \"150\" / fetched-once ref src/app/binder/manage/page.tsx (manual verification per plan's <verify> block); npm run build compiles + type-checks clean (fails only at the pre-existing DATABASE_URL-less page-data-collection stage)"
        status: pass
    human_judgment: true
    rationale: "No component-level test harness exists for this client page's fetch-timing/debounce behavior; visual confirmation (nothing renders on mount, catalog loads once on first keystroke) needs a human in the browser."
  - id: D4
    description: "The 'Add Cards to Binder' owned-only grid and the sidebar 'Add Manual Want' box are replaced by one 'Add Cards & Wants' search card with pre-gate/loading/error+retry/empty/cap-note states per UI-SPEC copy; manual-wants-add-flow.tsx is deleted and de-imported"
    requirement: "BINDER-10"
    verification:
      - kind: unit
        ref: "grep -n \"Add Cards & Wants\" src/app/binder/manage/page.tsx; test ! -f src/components/binder/manual-wants-add-flow.tsx; grep -rn ManualWantsAddFlow src/app/binder/manage/page.tsx (0 hits)"
        status: pass
    human_judgment: true
    rationale: "Visual/interaction correctness of the new search card's state machine (pre-gate hint, spinner, error+retry, empty state, results grid, cap note) needs human confirmation in the browser."
  - id: D5
    description: "Clicking a result tile opens VariantTradeSheet with every printing (owned and unowned) unfiltered, and onWantQuantityChange wired alongside onTradeQuantityChange"
    requirement: "BINDER-12"
    verification:
      - kind: unit
        ref: "grep -n \"ownedCount > 0\" src/app/binder/manage/page.tsx (0 hits — filter removed); grep -n onWantQuantityChange src/app/binder/manage/page.tsx"
        status: pass
    human_judgment: true
    rationale: "End-to-end confirmation that the sheet shows an unowned card's variant with a disabled, reasoned trade stepper and a live want stepper requires a human in the browser (composed sections built in Plans 01/02)."

duration: 8min
completed: 2026-07-19
status: complete
---

# Phase 30 Plan 03: Unified Search-Driven Add Flow Summary

**The Manage Binder page now runs one lazy, catalog-backed search — `mergeCatalogWithOwnership`/`filterSearchCards` merge the full catalog with per-user ownership/trade/want data on the first 2-char keystroke, replacing the owned-only "Add Cards to Binder" grid and the sidebar "Add Manual Want" box, and the extended `VariantTradeSheet` now receives every printing (owned and unowned) instead of an ownership-filtered subset.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-19T10:56:00Z
- **Completed:** 2026-07-19T11:04:35Z
- **Tasks:** 3 completed
- **Files modified:** 4 (2 created, 1 modified, 1 deleted)

## Accomplishments
- New pure module `src/lib/binder/merge-search-cards.ts` — `mergeCatalogWithOwnership` groups full-catalog rows by card definition and merges in per-printing `ownedCount`/`tradeQuantity` (from owned cards) and `quantity` (from manual wants), producing a `MergedCard` even for definitions the user doesn't own at all; `filterSearchCards` applies the 2-char gate, case-insensitive name/subtitle match, and a 20-result cap with `wasTruncated`. 8 unit tests, all passing.
- Manage Binder page mount fetch reduced to `/api/binder` only; the full catalog + owned-cards fetch is deferred to the first keystroke that reaches 2 characters, fired exactly once via a `useRef` guard (resettable on error for Retry), with a 150ms debounced search term matching the catalog page's feel.
- The "Add Cards to Binder" owned-only grid and the "Add Manual Want" sidebar box are both gone, replaced by a single "Add Cards & Wants" card with the full UI-SPEC state machine: pre-gate hint (<2 chars), loading spinner, error+Retry, "No cards found" empty state, results grid (reusing `ManageTradeCard`), and a "Showing top 20 matches" cap note.
- `VariantTradeSheet` now receives every printing of the clicked card — owned and unowned — with the old `.filter(p => p.ownedCount > 0)` removed entirely, and `onWantQuantityChange={updateWantQuantity}` wired alongside the existing `onTradeQuantityChange`.
- `toggleExclusion` no longer depends on `ownedCards` for exclusion name/subtitle (now sources from `tradeData.autoWants`), and `updateWantQuantity`'s not-found fallback now also checks the merged catalog dataset, so wanting a never-before-seen unowned variant still records its name/subtitle correctly.
- `src/components/binder/manual-wants-add-flow.tsx` deleted along with its import and the now-unused `refreshTradeData`/`filteredCards` helpers.

## Task Commits

Each task was committed atomically (TDD RED → GREEN for Task 1):

1. **Task 1: Extract and test the catalog merge + search-filter functions**
   - RED: `b3ebd91` (test) - failing tests for `mergeCatalogWithOwnership` and `filterSearchCards`
   - GREEN: `7231a84` (feat) - implementation, all 8 tests passing
2. **Task 2: Rewire the page data layer — lazy first-keystroke fetch + merge** - `ed75a28` (feat)
3. **Task 3: Swap in the unified search UI, rewire the sheet, delete the old surfaces** - `e17d63c` (feat)

**Plan metadata:** (this commit) `docs(30-03): complete plan`

## Files Created/Modified
- `src/lib/binder/merge-search-cards.ts` - New: `mergeCatalogWithOwnership`, `filterSearchCards`, `MergedCard`/`MergedCardPrinting`/`CatalogRow` types
- `src/lib/binder/merge-search-cards.test.ts` - New: 8 unit tests (`@vitest-environment node`)
- `src/app/binder/manage/page.tsx` - Mount fetch reduced to `/api/binder`; added lazy catalog+owned fetch (fetched-once ref, 150ms debounce, `mergedCards`/`searchResults`/`wasTruncated` derivations); replaced "Add Cards to Binder" grid with unified "Add Cards & Wants" search card; deleted "Add Manual Want" card + its import; `sheetCard` retyped to `MergedCard`; `VariantTradeSheet` now receives unfiltered, live-refreshed printings with `onWantQuantityChange` wired; `toggleExclusion` sources name/subtitle from `autoWants`; `updateWantQuantity` fallback extended to check `mergedCards`; removed now-unused `refreshTradeData`/`filteredCards`
- `src/components/binder/manual-wants-add-flow.tsx` - Deleted (superseded by the unified search card)

## Decisions Made
- Kept the results grid's single-printing quick-update shortcut (`card.printings.length === 1 ? updateTradeQuantity(...) : setSheetCard(card)`) exactly as the old owned-only grid had it, per the phase's pattern map's explicit "keep this shape exactly" guidance and the plan's grep verification that `ownedCount > 0` no longer appears in the file. A quick +/- click on an unowned single-printing card's tile is a safe no-op (the server 403s per Plan 01's ownership check, and no optimistic state mutation happens before the fetch resolves) — not a new gated branch.
- The sheet's `printings` prop re-derives from the live `mergedCards` array by `cardDefinitionId` on every render (falling back to the `sheetCard` snapshot only if not found), rather than freezing the printings captured at tile-click time — this keeps `ownedCount`/`tradeQuantity`/`quantity` fresh while the sheet is open, extending the prior implementation's pattern where `quantity` alone was already re-derived live from `tradeData`.
- For card definitions the user doesn't own at all, `bestArtUrl`/`bestVariantType` is derived by picking the catalog row with the highest `VARIANT_PRECEDENCE` value (Showcase > Hyperspace Foil > ... > Normal), since the existing `selectBestVariantArtUrl` helper requires owned counts and can't answer "best available printing" for a zero-ownership card.

## Deviations from Plan

None — plan executed exactly as written (three tasks, TDD gate on Task 1, verified against 30-CONTEXT.md decisions D-01 through D-08 and the 30-UI-SPEC.md copywriting/layout/interaction contracts).

## Issues Encountered
- `npm run build` fails at the page-data-collection stage in this worktree with `DATABASE_URL environment variable is not set` — the same pre-existing environment gap already documented in the 30-01 and 30-02 SUMMARYs, unrelated to this plan's changes. Verified instead via `npx tsc --noEmit` (zero errors in any file this plan touched) and confirmed `next build`'s own "Compiled successfully" + "Finished TypeScript" stages both pass before the unrelated DB-connection failure.
- `npx eslint src/app/binder/manage/page.tsx` reports 2 pre-existing `react-hooks/set-state-in-effect` errors (line ~102 `setUsername` in the session-sync effect, line ~122 `setIsLoading(false)` in the mount-fetch effect's else branch) — both are on code paths this plan did not touch (confirmed identical in the pre-plan version of the file); left untouched per the scope-boundary rule. Targeted lint on the plan's actually-new/changed logic (the fetch/debounce/merge/UI additions) is clean, and the two new files (`merge-search-cards.ts`/`.test.ts`) have zero lint issues.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BINDER-10/11/12 fully delivered: one search-driven add flow over the full catalog replaces both legacy surfaces; results include unowned cards; selecting a result opens a variant picker with ownership-gated trade + always-available want actions (Plans 01/02/03 together).
- `mergeCatalogWithOwnership`/`filterSearchCards` and the `MergedCard`/`MergedCardPrinting` types are available for Phase 31/32 to reuse if either needs merged catalog+ownership data.
- Phase 31 (Trade Profile modal) and Phase 32 (Combined wants & exclusions list) can proceed independently — the Trade Profile card and `ManageWantsList` were explicitly untouched this phase, per the phase boundary.
- No blockers for Phase 31 or 32.

---
*Phase: 30-unified-search-driven-add-flow*
*Completed: 2026-07-19*

## Self-Check: PASSED

- FOUND: src/lib/binder/merge-search-cards.ts
- FOUND: src/lib/binder/merge-search-cards.test.ts
- FOUND: manual-wants-add-flow.tsx correctly deleted
- FOUND: .planning/phases/30-unified-search-driven-add-flow/30-03-SUMMARY.md
- FOUND commit: b3ebd91
- FOUND commit: 7231a84
- FOUND commit: ed75a28
- FOUND commit: e17d63c
- FOUND commit: 0875070
