# Phase 25: Operation Performance - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 25 delivers two performance improvements to bulk data operations and deck creation:

1. **PERF-04 — Bulk ops: no timeout + progress feedback**: Quick Add (starter decks) and CSV Import complete without timeout for collections up to 1,000 cards, and show real-time status (card count + spinner) while processing.

2. **PERF-05 — Deck creation ≤500ms**: After clicking "New Deck", the guided onboarding skeleton appears immediately (within ≤500ms) — no blank screen or perceptible delay before the empty deck builder renders.

No new features. No UI redesigns. No changes to any other route or component outside the direct implementation path.

</domain>

<decisions>
## Implementation Decisions

### Bulk Operations — Timeout Fix (PERF-04)

- **D-01:** Replace the per-card sequential `await incrementVariantCount()` / `await upsertVariantCount()` loops in both routes with a single batch `INSERT ... VALUES (row1, row2, ...) ON CONFLICT DO UPDATE` call. This reduces N Neon HTTP round-trips to 1 for the upsert phase.
- **D-02:** Replace the per-definition sequential `await recomputeTotal()` loops with a single batch `INSERT ... SELECT SUM(...) ... GROUP BY card_definition_id ... ON CONFLICT DO UPDATE` query. This reduces M Neon HTTP calls (2 each) to 1 query that recomputes all affected totals in one round-trip.
- **D-03:** Both Quick Add (`/api/collection/starter-deck`) and CSV Import (`/api/collection/import`) routes get this batch treatment. A shared helper (e.g., `batchUpsertVariantCounts` + `batchRecomputeTotals` in `src/db/queries/collection.ts`) is used by both.

### Bulk Operations — Progress Feedback (PERF-04)

- **D-04:** Show an indeterminate spinner with card count status text during processing. No fake progress bar.
- **D-05:** Status text pattern: "Importing 847 cards..." while the POST is in-flight → "Done! 847 cards imported." on success. The card count is available client-side before the request fires (from PapaParse results for CSV Import, from the known deck size for Quick Add).
- **D-06:** Quick Add shows the deck card count in status text: "Adding 55 cards from [Deck Name]..." → "Added 55 cards from [Deck Name] to your collection."

### Deck Creation Speed (PERF-05)

- **D-07:** Add a `loading.tsx` file to `src/app/decks/[id]/` that renders the guided onboarding shell with skeleton/pulse placeholders. Next.js shows this immediately on navigation (before the Server Component data fetches complete), giving instant visual feedback.
- **D-08:** The skeleton should mirror the real guided onboarding layout — not a generic spinner. Use `animate-pulse` on placeholder areas for the card browser and sidebar. This makes it look like content is loading rather than the page itself.
- **D-09:** Phase 24's `unstable_cache` on `getAllCards()` and `getFilterOptions()` means the data fetches after the skeleton resolve quickly. No additional DB optimization needed for PERF-05 beyond the loading.tsx addition.

### Claude's Discretion

- Exact SQL for the batch recompute query (WITH clause vs subquery vs plain INSERT SELECT)
- Whether `batchUpsertVariantCounts` and `batchRecomputeTotals` are new exported functions or inline in each route
- Exact skeleton layout details (column count, sidebar width, number of pulse placeholder rows)
- Whether the collection page's existing `status === 'uploading'` text is replaced or augmented with the card count

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

**IMPORTANT: Per AGENTS.md, read `node_modules/next/dist/docs/` before writing any Next.js loading.tsx or Suspense code — APIs and conventions may differ from training data.**

### Bulk operation routes
- `src/app/api/collection/starter-deck/route.ts` — Quick Add route; sequential loop to replace with batch upsert
- `src/app/api/collection/import/route.ts` — CSV Import route; sequential loop to replace with batch upsert
- `src/db/queries/collection.ts` — `incrementVariantCount`, `upsertVariantCount`, `recomputeTotal`; batch helpers go here

### Collection UI (progress feedback)
- `src/app/collection/page.tsx` — Client Component; status state machine (`idle | parsing | uploading | success | error`) and Quick Add state (`idle | loading | success | error`); progress text lives here

### Deck creation (PERF-05)
- `src/app/decks/[id]/page.tsx` — Server Component that fetches `getAllCards()`, `getFilterOptions()`, `getDeckWithCards()` in parallel; `loading.tsx` shields this
- `src/components/decks/deck-builder.tsx` — DeckBuilder component; understand the empty/guided-onboarding render to mirror it in the skeleton
- `src/components/decks/decks-client.tsx` — `handleCreateDeck`: POST `/api/decks` → `router.push('/decks/${deck.id}')` — this is the navigation trigger for PERF-05

### Prior phase context (Phase 24 caching)
- `.planning/phases/24-catalog-page-load-performance/24-CONTEXT.md` — D-06 through D-09: `getAllCards()`, `getFilterOptions()`, `getPrintingArtMap()` get cached via `unstable_cache` tagged `'cards'`; PERF-05 depends on this caching being in place

### Requirements
- `.planning/REQUIREMENTS.md` — PERF-04 and PERF-05 requirement text and acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `incrementVariantCount` / `upsertVariantCount` (`src/db/queries/collection.ts`) — existing per-row upsert helpers; the batch variant follows the same `onConflictDoUpdate` pattern, just with `.values([...multipleRows...])`
- `recomputeTotal` (`src/db/queries/collection.ts`) — the logic to replicate in batch: SUM variant counts per definition, then upsert into `userCollections`
- `animate-pulse` skeleton pattern — used throughout the app (card grid in catalog); apply same approach in `loading.tsx`
- Existing `status` state machine in `collection/page.tsx` (`idle | parsing | uploading | success | error`) — extend with card count, don't replace the shape

### Established Patterns
- Drizzle batch insert: `db.insert(table).values([...array...]).onConflictDoUpdate({...})` — supports multiple rows in one call (same Neon HTTP trip)
- Next.js `loading.tsx` — file-system convention; place at `src/app/decks/[id]/loading.tsx` to show skeleton during RSC render
- Card count available before POST: for CSV Import, `normalized.length` from PapaParse; for Quick Add, `deck.cards.length` from `starterDecks` data

### Integration Points
- Both bulk routes share the same pattern; a shared `batchUpsertVariantCounts(items, userId)` helper serves both
- `loading.tsx` for `/decks/[id]` must not break existing deck builder renders (non-new decks) — it shows while ANY `/decks/[id]` page is loading, not just new ones
- The `recomputeTotal` batch query touches `user_printing_collections` (JOIN `card_printings`) and `user_collections` — same tables as current implementation

</code_context>

<specifics>
## Specific Ideas

- Status text for CSV Import: "Importing 847 cards..." (count from `normalized.length` before POST fires)
- Status text for Quick Add: "Adding 55 cards from [Deck Name]..." (count from `deck.cards.length`)
- Batch recompute SQL shape: `INSERT INTO user_collections (user_id, card_definition_id, count) SELECT upc.user_id, cp.card_definition_id, COALESCE(SUM(upc.count), 0) FROM user_printing_collections upc JOIN card_printings cp ON cp.id = upc.card_printing_id WHERE upc.user_id = $userId AND cp.card_definition_id IN (...affectedIds) GROUP BY upc.user_id, cp.card_definition_id ON CONFLICT (user_id, card_definition_id) DO UPDATE SET count = EXCLUDED.count, updated_at = NOW()`
- loading.tsx should show the same two-panel layout as DeckBuilder (card browser left, sidebar right) with pulse placeholders — not a full-page spinner

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 25-operation-performance*
*Context gathered: 2026-05-27*
