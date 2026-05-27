---
phase: 25-operation-performance
verified: 2026-05-27T19:08:00Z
status: human_needed
score: 11/11 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Upload a CSV file with ~100 rows through the Collection page"
    expected: "The in-flight status text reads 'Importing 100 cards...' immediately after PapaParse finishes — before the POST resolves. On success the banner reads 'Done! 100 cards imported.' (not the old 'Successfully imported ... for {set}!' format)"
    why_human: "PapaParse complete callback + File object interaction cannot be exercised with vitest mocks alone; three page.test.tsx stubs remain it.todo for this exact reason (tests 1, 2, 5)"
  - test: "Click Add to Collection on any starter deck and observe the network request timing"
    expected: "POST /api/collection/starter-deck completes in under 2 seconds for a ~50-card deck. Card counts in the collection increase by the deck quantities."
    why_human: "Vercel function timeout elimination requires a live Neon DB connection and a deployed environment — cannot be verified locally"
  - test: "Add the same starter deck a second time"
    expected: "Card counts are now exactly 2x the deck quantities (additive semantics confirmed). NOT reset to single-deck quantities."
    why_human: "Additive vs overwrite semantic distinction (batchIncrementVariantCounts uses count + EXCLUDED.count) requires a live DB to confirm the SQL conflict resolution path executes correctly"
  - test: "Import a CSV with approximately 1,000 card rows"
    expected: "The request completes without a 504 Gateway Timeout. The user_collections totals match the SUM of variant counts per definition."
    why_human: "1,000-card timeout prevention is the core PERF-04 claim — requires a live Vercel + Neon environment to verify. Cannot be simulated in unit tests."
  - test: "Import the same CSV a second time with different counts"
    expected: "Card counts reflect the second import's values only (overwrite semantics confirmed, NOT added to first import)"
    why_human: "batchUpsertVariantCounts overwrite semantics require live DB confirmation of the EXCLUDED.count SQL path"
  - test: "Navigate from /decks to any /decks/[id] URL (new or existing deck)"
    expected: "The animate-pulse skeleton appears immediately (within ~100ms) and is replaced by the real DeckBuilder once server data resolves. The skeleton is visually recognizable as the DeckBuilder layout (left panel + sidebar)."
    why_human: "Next.js loading.tsx Suspense firing in production navigation cannot be tested in vitest/jsdom. The ≤500ms timing claim requires a browser with DevTools network throttling."
---

# Phase 25: Operation Performance Verification Report

**Phase Goal:** Eliminate Vercel function timeouts for 1,000-card bulk operations (Quick Add + CSV Import) by replacing N+M sequential Neon HTTP round-trips with batch Drizzle queries, and deliver immediate user-visible feedback via card-count progress text and an animate-pulse loading skeleton for /decks/[id] navigations.
**Verified:** 2026-05-27T19:08:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Quick Add of a 1,000+ card deck completes in one batch INSERT round-trip for variant upserts (not N sequential awaits) | VERIFIED | `starter-deck/route.ts` has exactly one `await batchIncrementVariantCounts(batchItems, userId)` after a loop that builds batchItems without any per-card awaits. Only one `for (const card of deck.cards)` loop exists and it only pushes to batchItems. |
| 2 | CSV Import of a 1,000+ row file completes in one batch INSERT round-trip for variant upserts | VERIFIED | `import/route.ts` has exactly one `await batchUpsertVariantCounts(batchItems, userId)` after a loop that builds batchItems. No per-row awaits in the payload processing loop. |
| 3 | Both routes recompute all affected user_collections totals via a single SELECT GROUP BY + single batch INSERT (not M sequential awaits) | VERIFIED | Both routes call `await batchRecomputeTotals([...affectedDefinitionIds], userId)` exactly once after the variant batch call. `batchRecomputeTotals` implements two-step SELECT GROUP BY + batch INSERT confirmed at lines 364-393 of collection.ts. |
| 4 | Quick Add increments existing variant counts additively (does NOT overwrite existing counts) | VERIFIED | `batchIncrementVariantCounts` uses `count: sql\`${userPrintingCollections.count} + EXCLUDED.count\`` (collection.ts line 313). Route imports specifically `batchIncrementVariantCounts` (not the overwrite variant). |
| 5 | CSV Import overwrites existing variant counts (matches existing upsertVariantCount semantics) | VERIFIED | `batchUpsertVariantCounts` uses `count: sql\`EXCLUDED.count\`` (collection.ts line 342). Route imports specifically `batchUpsertVariantCounts`. |
| 6 | Both batch helpers guard against empty arrays and return without throwing | VERIFIED | `if (items.length === 0) return;` at lines 302 and 332. `if (cardDefinitionIds.length === 0) return;` at line 362. Three real (non-todo) tests pass verifying this: collection.test.ts 3 passed. |
| 7 | CSV Import progress text displays row count from PapaParse (set BEFORE the POST fires) | VERIFIED (static) | `setImportCardCount(normalized.length)` at page.tsx line 58, `setStatus('uploading')` at line 59. Ordering is correct. Runtime confirmation deferred to human UAT (PapaParse + File object). |
| 8 | Quick Add button shows card count + deck name during loading | VERIFIED | `deckCardCount` set at line 89 before `setDeckStatus('loading')` at line 90. Button renders `` `Adding ${deckCardCount} cards from ${currentDeck?.name ?? ''}...` `` at line 221. Confirmed by 2 real passing tests in page.test.tsx. |
| 9 | CSV success banner reads "Done! {N} cards imported." (not old format) | VERIFIED | page.tsx line 177: `Done! {result?.count} cards imported.` No occurrence of "Syncing with database..." or "Successfully imported" anywhere in the file. |
| 10 | loading.tsx exists, exports a Server Component, contains animate-pulse skeleton mirroring DeckBuilder + DeckSidebar layout | VERIFIED | File confirmed at `src/app/decks/[id]/loading.tsx`. No `'use client'` directive, no auth/cookies/headers imports. `flex h-[calc(100svh-56px)] overflow-hidden` outer container. 4 occurrences of `animate-pulse`. `w-80 bg-slate-50 border-l` sidebar. `aspect-[4/3]` leader/base placeholders. All 5 loading.test.tsx tests pass. |
| 11 | Existing per-row helpers (incrementVariantCount, upsertVariantCount, recomputeTotal) remain exported and unmodified | VERIFIED | All three confirmed present at collection.ts lines 222, 238, 261. Batch helpers are additions at lines 298-394. |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/queries/collection.ts` | Exports batchIncrementVariantCounts, batchUpsertVariantCounts, batchRecomputeTotals | VERIFIED | Three batch exports confirmed at lines 298, 328, 358. All three per-row originals preserved. |
| `src/app/api/collection/starter-deck/route.ts` | Quick Add route using batch helpers (no per-card await loop) | VERIFIED | Imports batchIncrementVariantCounts + batchRecomputeTotals. Single for-of loop building batchItems. Two batch awaits after loop. |
| `src/app/api/collection/import/route.ts` | CSV Import route using batch helpers (no per-row await loop) | VERIFIED | Imports batchUpsertVariantCounts + batchRecomputeTotals. Payload processing loop builds batchItems only. Two batch awaits after loop. |
| `src/app/collection/page.tsx` | Progress text with card count for CSV Import and Quick Add | VERIFIED | importCardCount and deckCardCount state variables. setImportCardCount called before setStatus. setDeckCardCount called before setDeckStatus. Correct text rendered at lines 172, 221. |
| `src/app/decks/[id]/loading.tsx` | animate-pulse skeleton for /decks/[id] navigations | VERIFIED | File exists. Server Component (no 'use client'). 4 animate-pulse containers. Full two-panel layout mirroring DeckBuilder + DeckSidebar. |
| `src/db/queries/collection.test.ts` | PERF-04 batch helper unit tests | VERIFIED | 3 real tests pass (empty-array guards), 4 it.todo (require live DB — intentional per project strategy). |
| `src/app/collection/page.test.tsx` | PERF-04 progress text unit tests | VERIFIED | 2 real tests pass (Quick Add loading + success), 3 it.todo (require PapaParse + File object — intentional). |
| `src/app/decks/[id]/loading.test.tsx` | PERF-05 loading skeleton smoke tests | VERIFIED | 5/5 real tests pass including static-analysis test asserting no auth/cookies/headers. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `starter-deck/route.ts` | `src/db/queries/collection.ts` | `import { batchIncrementVariantCounts, batchRecomputeTotals }` | WIRED | Import confirmed line 8. Both functions called at lines 70-71. |
| `import/route.ts` | `src/db/queries/collection.ts` | `import { batchUpsertVariantCounts, batchRecomputeTotals }` | WIRED | Import confirmed line 5. Both functions called at lines 108-109. |
| `collection/page.tsx` | PapaParse complete callback | `setImportCardCount(normalized.length)` called before `setStatus('uploading')` | WIRED | Lines 58-59 confirm ordering. Count flows from PapaParse output to render. |
| `decks/[id]/loading.tsx` | Next.js file-system Suspense convention | `export default function DeckBuilderLoading` | WIRED | File at correct Next.js route path. Default export present line 1. No 'use client'. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `collection/page.tsx` | `importCardCount` | `normalized.length` from PapaParse complete callback (client-side) | Yes — PapaParse result count, set before POST | FLOWING |
| `collection/page.tsx` | `deckCardCount` | `deck.cards.reduce((sum, c) => sum + c.qty, 0)` from static starterDecks data | Yes — reduce over deck card array | FLOWING |
| `collection/page.tsx` | `currentDeck` | `starterDecks.find((d) => d.id === selectedDeckId)` at render time | Yes — find over static data | FLOWING |
| `decks/[id]/loading.tsx` | N/A (static skeleton) | No data source — intentionally static JSX | N/A — skeleton has no dynamic data | N/A (static) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| collection.test.ts 3 empty-array guard tests pass | `npx vitest run src/db/queries/collection.test.ts` | 3 passed, 4 todo, 0 failed | PASS |
| loading.test.tsx 5 smoke tests pass | `npx vitest run src/app/decks/[id]/loading.test.tsx` | 5 passed, 0 failed | PASS |
| page.test.tsx 2 Quick Add tests pass | `npx vitest run src/app/collection/page.test.tsx` | 2 passed, 3 todo, 0 failed | PASS |
| No per-card await loops in starter-deck route | `grep "for (const" starter-deck/route.ts` | 1 occurrence (batchItems building loop — correct) | PASS |
| No per-card await loops in import route (payload processing) | Only 3 for-of loops: validation, chunk results, payload build — none await per-item | No `upsertVariantCount(` or `recomputeTotal(` in file | PASS |
| 3 batch exports in collection.ts | `grep "^export async function batch" collection.ts` count | 3 matches at lines 298, 328, 358 | PASS |
| All 9 commits from SUMMARY files exist | `git log --oneline grep` | All 9 hashes found | PASS |

### Probe Execution

No probe scripts declared or found for this phase. Step 7c: SKIPPED (no probe-*.sh files in phase directory or scripts/).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| PERF-04 | 25-01, 25-02, 25-03 | Quick Add and CSV Import provide real-time progress feedback and complete without timeout for collections up to 1,000 cards | SATISFIED (automated) / NEEDS HUMAN (runtime) | Batch helpers implemented and wired. Progress text wired to pre-computed counts. Timeout elimination confirmed structurally. Runtime 1,000-card performance requires human smoke test. |
| PERF-05 | 25-01, 25-03 | Creating a new deck navigates to the Deck Builder empty skeleton in ≤500ms | SATISFIED (static) / NEEDS HUMAN (timing) | loading.tsx exists at correct path, Server Component confirmed, animate-pulse layout verified by 5 passing tests. ≤500ms timing requires browser + network throttling human test. |

All requirement IDs declared in PLAN frontmatter (PERF-04 in 25-01 + 25-02 + 25-03; PERF-05 in 25-01 + 25-03) are accounted for. REQUIREMENTS.md maps both to Phase 25 with plans 25-01, 25-02, 25-03 — no orphaned requirements.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| (none) | — | — | — |

No TBD, FIXME, or XXX markers found in any file modified by this phase. No placeholder text found in production code. No return null / return {} / return [] stubs found in production code paths. All it.todo stubs in test files are intentional (require live DB or PapaParse + File object — consistent with project test strategy used since Phase 24/catalog.test.ts).

### Human Verification Required

The automated checks all pass. The following behaviors require a live deployed environment (Vercel + Neon) or a browser to confirm:

#### 1. CSV Import Progress Text (PERF-04 D-05)

**Test:** Upload a CSV file with ~100 rows through the Collection page
**Expected:** "Importing 100 cards..." appears immediately after PapaParse parses the file, before the POST response arrives. On success the banner reads "Done! 100 cards imported."
**Why human:** PapaParse complete callback + File object interaction cannot be exercised in vitest/jsdom. Three page.test.tsx stubs remain it.todo for this exact reason.

#### 2. Timeout Elimination for Large Quick Add (PERF-04 core claim)

**Test:** Quick Add any starter deck via the Collection page; observe the network request duration in DevTools
**Expected:** POST /api/collection/starter-deck completes in under 2 seconds (down from potential timeouts with N sequential DB calls)
**Why human:** Vercel function timeout elimination requires a deployed environment with a live Neon connection. Cannot be verified locally or with unit tests.

#### 3. Additive Quick Add Semantics (PERF-04 D-01)

**Test:** Add the same starter deck twice in succession
**Expected:** Card counts are exactly 2x the deck quantities after the second add — not reset to single-deck quantities
**Why human:** `count + EXCLUDED.count` SQL semantics require a live Neon DB to execute the ON CONFLICT path. Unit tests only verify the guard (empty array). Live DB integration tests are marked it.todo per project convention.

#### 4. Timeout Elimination for CSV Import 1,000-row file (PERF-04 core claim)

**Test:** Import a CSV with approximately 1,000 card rows
**Expected:** Request completes without 504 Gateway Timeout. user_collections totals match SUM of variants per definition.
**Why human:** Core PERF-04 claim. Requires Vercel + Neon environment.

#### 5. Overwrite CSV Import Semantics (PERF-04 D-03)

**Test:** Import the same CSV a second time with different counts
**Expected:** Card counts reflect the second import's values only (overwrite, NOT additive)
**Why human:** EXCLUDED.count SQL path requires live DB.

#### 6. Deck Loading Skeleton Timing (PERF-05)

**Test:** Navigate from /decks to any /decks/[id] URL using the browser
**Expected:** animate-pulse skeleton appears within ~100ms of navigation; replaced by real DeckBuilder once data resolves. Skeleton is visually recognizable as the two-panel DeckBuilder layout.
**Why human:** Next.js Suspense + loading.tsx firing in production navigation is not testable in vitest. The ≤500ms timing requires browser DevTools with network throttling.

### Gaps Summary

No gaps found. All 11 automated must-haves are VERIFIED against the actual codebase. The 6 human verification items are runtime/deployment concerns that cannot be verified statically — they are structural to the project's test strategy (unit tests where mockable, manual UAT for live-DB and browser behaviors). No deferred items identified — all milestone phases after 25 address different requirements (PERF-01, PERF-02, PERF-03 are Phases 26+).

---

_Verified: 2026-05-27T19:08:00Z_
_Verifier: Claude (gsd-verifier)_
