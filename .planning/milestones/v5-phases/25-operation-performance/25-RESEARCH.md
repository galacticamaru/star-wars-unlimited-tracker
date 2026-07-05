# Phase 25: Operation Performance - Research

**Researched:** 2026-05-27
**Domain:** Drizzle ORM batch upsert, Next.js loading.tsx, React progress feedback
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Replace per-card sequential `await incrementVariantCount()` / `await upsertVariantCount()` loops in both routes with a single batch `INSERT ... VALUES (row1, row2, ...) ON CONFLICT DO UPDATE`. Reduces N Neon HTTP round-trips to 1.
- **D-02:** Replace per-definition sequential `await recomputeTotal()` loops with a single batch `INSERT ... SELECT SUM(...) ... GROUP BY card_definition_id ... ON CONFLICT DO UPDATE` query. Reduces M Neon HTTP calls to 1.
- **D-03:** Both Quick Add (`/api/collection/starter-deck`) and CSV Import (`/api/collection/import`) get batch treatment. Shared helpers `batchUpsertVariantCounts` and `batchRecomputeTotals` in `src/db/queries/collection.ts`.
- **D-04:** Show indeterminate spinner with card count status text during processing. No fake progress bar.
- **D-05:** Status text pattern for CSV Import: "Importing 847 cards..." while POST is in-flight → "Done! 847 cards imported." on success.
- **D-06:** Quick Add status text: "Adding 55 cards from [Deck Name]..." → "Added 55 cards from [Deck Name] to your collection."
- **D-07:** Add `loading.tsx` at `src/app/decks/[id]/loading.tsx` — renders guided onboarding shell with skeleton/pulse placeholders.
- **D-08:** Skeleton mirrors real guided onboarding layout — not a generic spinner. Use `animate-pulse` on placeholder areas.
- **D-09:** Phase 24's `unstable_cache` on `getAllCards()` and `getFilterOptions()` means data fetches resolve quickly. No additional DB optimization for PERF-05.

### Claude's Discretion

- Exact SQL for the batch recompute query (WITH clause vs subquery vs plain INSERT SELECT)
- Whether `batchUpsertVariantCounts` and `batchRecomputeTotals` are new exported functions or inline in each route
- Exact skeleton layout details (column count, sidebar width, number of pulse placeholder rows)
- Whether the collection page's existing `status === 'uploading'` text is replaced or augmented with the card count

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-04 | Quick Add (starter decks) and CSV Import provide real-time progress feedback (row count or percentage) and complete without timeout for collections up to 1,000 cards | D-01/D-02: batch upsert removes N+M sequential awaits; D-04/D-05/D-06: card count available client-side before POST fires — can be shown in status text immediately |
| PERF-05 | Creating a new deck navigates to the Deck Builder empty skeleton in ≤500ms — no perceptible delay before the empty deck guided onboarding appears | D-07/D-08: loading.tsx file convention with animate-pulse skeleton; D-09: Phase 24 caching makes subsequent data resolution fast |

</phase_requirements>

---

## Summary

Phase 25 has two independent tracks. The first track (PERF-04) replaces sequential per-row `await` loops in two API route handlers with single-round-trip batch Drizzle queries, and extends the collection page's existing status state machine with a card count for richer progress text. The second track (PERF-05) creates a `loading.tsx` file at `src/app/decks/[id]/loading.tsx` that renders an `animate-pulse` skeleton mirroring the DeckBuilder layout, giving instant visual feedback while the Server Component fetches data.

Both tracks are pure refactors and additions with no schema changes, no new packages, and no impact on existing routes outside the direct implementation path. The critical constraint for PERF-04 is that `incrementVariantCount` uses SQL addition on conflict (not overwrite), so the batch variant must preserve the same additive semantics. The critical constraint for PERF-05 is that `loading.tsx` covers ALL `/decks/[id]` navigations, not just new decks — the skeleton must be structurally valid for any deck, including existing ones.

**Primary recommendation:** Write batch helpers first (D-01/D-02) verified with unit tests against the existing `recomputeTotal` logic, then update the collection page UI (D-04/D-05/D-06), then add `loading.tsx` (D-07/D-08) as a standalone file with no coupling to the above.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Batch upsert (PERF-04) | API / Backend | Database / Storage | Route handlers own the SQL; query helpers in `src/db/queries/collection.ts` |
| Progress feedback text (PERF-04) | Browser / Client | — | Card count is computed client-side before POST fires; status state machine lives in the Client Component |
| Deck loading skeleton (PERF-05) | Frontend Server (SSR) | — | `loading.tsx` is a Server Component rendered before RSC data fetches complete |

---

## Standard Stack

No new packages are required for this phase. All needed capabilities are already in the project.

### Core (already installed)
| Library | Purpose | Used By This Phase |
|---------|---------|-------------------|
| `drizzle-orm` | Batch INSERT with `.values([...array...]).onConflictDoUpdate(...)` | D-01, D-02 |
| `@neondatabase/serverless` | Neon HTTP driver — one TCP handshake per `.execute()` call | D-01, D-02 (reducing call count is the fix) |
| React `useState` | Extend status state machine with card count | D-04, D-05, D-06 |
| Tailwind `animate-pulse` | Skeleton placeholder animation | D-08 |
| Next.js `loading.tsx` | File-system convention for Suspense boundary fallback | D-07, D-08 |

### No New Packages

Confirmed: `@tanstack/react-virtual` is already in `dependencies` (installed in Phase 24). No other additions needed.

## Package Legitimacy Audit

No new packages to install in this phase. All libraries used are already project dependencies.

---

## Architecture Patterns

### System Architecture Diagram

```
PERF-04: Bulk Operation Path
=====================================

[Client: collection/page.tsx]
  │ knows card count BEFORE POST fires
  │ sets status → 'uploading' + cardCount
  │ renders "Importing N cards..." text
  │
  ▼ POST /api/collection/import (or /starter-deck)
[API Route Handler]
  │
  ├─ 1x DB round-trip: batchUpsertVariantCounts([...rows])
  │    INSERT INTO user_printing_collections VALUES (r1),(r2),...
  │    ON CONFLICT DO UPDATE SET count = count + excluded.count
  │
  └─ 1x DB round-trip: batchRecomputeTotals([...defIds], userId)
       INSERT INTO user_collections
       SELECT SUM(upc.count) GROUP BY card_definition_id
       WHERE card_definition_id IN (...)
       ON CONFLICT DO UPDATE SET count = EXCLUDED.count
  │
  ▼ Response { cardsAdded: N }
[Client: collection/page.tsx]
  sets status → 'success'
  renders "Done! N cards imported."


PERF-05: Deck Creation Path
=====================================

[decks-client.tsx: handleCreateDeck]
  │ POST /api/decks → { id: N }
  │ router.push(`/decks/${N}`)
  │
  ▼ Next.js router navigates to /decks/[id]
[loading.tsx: DeckBuilderSkeleton]        ← renders IMMEDIATELY
  │ animate-pulse skeleton (two-panel layout)
  │ Toolbar: pulse name bar + tab pills
  │ Left: pulse leader/base cards + pulse card rows
  │ Right (sidebar): pulse w-80 panel
  │
  ▼ [Server Component: page.tsx resolves]
  │ Promise.all([getDeckWithCards, getAllCards, getFilterOptions])
  │ getAllCards + getFilterOptions: served from unstable_cache (fast)
  │ getDeckWithCards: one DB query (new deck has 0 cards — fast)
  │
  ▼ DeckBuilder renders with real data
  loading.tsx skeleton is replaced
```

### Recommended Project Structure

No structural changes required. New files:

```
src/
├── app/
│   └── decks/
│       └── [id]/
│           ├── page.tsx          (existing — no changes)
│           └── loading.tsx       (NEW — PERF-05)
├── db/
│   └── queries/
│       └── collection.ts         (MODIFIED — add batchUpsertVariantCounts, batchRecomputeTotals)
├── app/
│   └── api/
│       └── collection/
│           ├── starter-deck/
│           │   └── route.ts      (MODIFIED — replace sequential loops)
│           └── import/
│               └── route.ts      (MODIFIED — replace sequential loops)
└── app/
    └── collection/
        └── page.tsx              (MODIFIED — extend status state machine with card count)
```

### Pattern 1: Drizzle Batch Upsert (Multiple Rows, One Round-Trip)

**What:** Pass an array of row objects to `.values()`. Drizzle generates a single `INSERT INTO ... VALUES (r1), (r2), ..., (rN) ON CONFLICT DO UPDATE` statement.

**When to use:** Replacing a `for ... of` loop with individual `await db.insert(...).values(row)` calls.

**Critical detail for `incrementVariantCount`:** The existing per-row helper uses SQL addition on conflict (`count + qtyToAdd`), not overwrite. The batch variant MUST preserve this additive semantics — use `sql\`${userPrintingCollections.count} + EXCLUDED.count\`` in the conflict update set.

```typescript
// Source: drizzle-orm documentation + existing collection.ts pattern
export async function batchUpsertVariantCounts(
  items: Array<{ cardPrintingId: number; qtyToAdd: number }>,
  userId: number
) {
  if (items.length === 0) return;
  return db
    .insert(userPrintingCollections)
    .values(items.map(({ cardPrintingId, qtyToAdd }) => ({
      userId,
      cardPrintingId,
      count: qtyToAdd,
    })))
    .onConflictDoUpdate({
      target: [userPrintingCollections.userId, userPrintingCollections.cardPrintingId],
      set: {
        count: sql`${userPrintingCollections.count} + EXCLUDED.count`,
        updatedAt: new Date(),
      },
    });
}
```

**Note:** `upsertVariantCount` (CSV Import) overwrites the count (no SQL addition). The batch variant for CSV Import uses `EXCLUDED.count` directly (not additive). Both helpers are needed.

### Pattern 2: Batch Recompute Totals (INSERT SELECT with IN clause)

**What:** A single query that recomputes the SUM for all affected card definitions in one round-trip, replacing a `for (const id of affectedDefinitionIds) await recomputeTotal(userId, id)` loop.

**When to use:** After any bulk variant upsert that touches multiple card definitions.

```typescript
// Source: CONTEXT.md D-02 specifics + existing recomputeTotal logic
export async function batchRecomputeTotals(
  cardDefinitionIds: number[],
  userId: number
) {
  if (cardDefinitionIds.length === 0) return;
  await db.execute(sql`
    INSERT INTO user_collections (user_id, card_definition_id, count, created_at, updated_at)
    SELECT
      ${userId},
      cp.card_definition_id,
      COALESCE(SUM(upc.count), 0),
      NOW(),
      NOW()
    FROM user_printing_collections upc
    JOIN card_printings cp ON cp.id = upc.card_printing_id
    WHERE upc.user_id = ${userId}
      AND cp.card_definition_id IN ${sql.raw(`(${cardDefinitionIds.join(',')})`)}
    GROUP BY cp.card_definition_id
    ON CONFLICT (user_id, card_definition_id)
    DO UPDATE SET count = EXCLUDED.count, updated_at = NOW()
  `);
}
```

**Alternative using Drizzle's `inArray`:**

```typescript
// Cleaner approach using Drizzle ORM constructs
export async function batchRecomputeTotals(
  cardDefinitionIds: number[],
  userId: number
) {
  if (cardDefinitionIds.length === 0) return;
  // Step 1: fetch sums for all affected definitions in one query
  const sums = await db
    .select({
      cardDefinitionId: cardPrintings.cardDefinitionId,
      total: sql<number>`COALESCE(SUM(${userPrintingCollections.count}), 0)`,
    })
    .from(userPrintingCollections)
    .innerJoin(cardPrintings, eq(cardPrintings.id, userPrintingCollections.cardPrintingId))
    .where(
      and(
        eq(userPrintingCollections.userId, userId),
        inArray(cardPrintings.cardDefinitionId, cardDefinitionIds)
      )
    )
    .groupBy(cardPrintings.cardDefinitionId);

  if (sums.length === 0) return;

  // Step 2: batch upsert all totals
  return db
    .insert(userCollections)
    .values(sums.map(r => ({
      userId,
      cardDefinitionId: r.cardDefinitionId,
      count: Number(r.total),
    })))
    .onConflictDoUpdate({
      target: [userCollections.userId, userCollections.cardDefinitionId],
      set: { count: sql`EXCLUDED.count`, updatedAt: new Date() },
    });
}
```

**Recommendation:** The two-step Drizzle ORM approach (SELECT + batch INSERT) is preferred over raw SQL. It keeps the type system happy, avoids `sql.raw` (injection risk if `cardDefinitionIds` were user-controlled, though here they are not), and is directly analogous to the existing `recomputeTotal` pattern. Cost: 2 round-trips instead of 1, but vs. the current `M × 2` round-trips this is still a massive reduction. [ASSUMED: planner should confirm which approach to use]

### Pattern 3: Next.js `loading.tsx` File Convention

**What:** A special file at the same level as `page.tsx` that Next.js wraps in a Suspense boundary. Shows immediately on navigation while the Server Component renders.

**Critical detail from official docs:** The loading.tsx fallback is prefetched, making navigation immediate — BUT only if the layout does not access uncached/runtime data. Since `src/app/decks/[id]` has no `layout.tsx`, the root layout's Suspense behavior applies.

**Key insight from docs:** The `loading.tsx` hint in `loading.md` warns: "If the layout accesses uncached or runtime data (e.g. `cookies()`, `headers()`), `loading.js` will not show a fallback for it." The root layout must not block. Since the `/decks/[id]/` page has no intermediate layout file, the `loading.tsx` placed alongside `page.tsx` will fire correctly.

**Important note from instant-navigation.md:** `loading.tsx` does NOT guarantee instant client-side navigations for all entry points. For guaranteed-instant client-side nav, you also need `unstable_instant`. However, for PERF-05 (new deck creation via `router.push`), `loading.tsx` provides the skeleton immediately on navigation — the requirement is ≤500ms visible skeleton, which `loading.tsx` achieves. The `unstable_instant` export is an optional enhancement (see Open Questions).

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md
// File: src/app/decks/[id]/loading.tsx
export default function DeckBuilderLoading() {
  return (
    <div className="flex h-[calc(100svh-56px)] overflow-hidden animate-pulse">
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar skeleton */}
        <div className="border-b bg-white p-4 flex justify-between items-center shadow-sm">
          <div className="h-8 w-64 bg-slate-200 rounded" />
          <div className="flex gap-1">
            <div className="h-8 w-20 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-200 rounded" />
          </div>
        </div>
        {/* Content area: Leader+Base + empty state */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="aspect-[4/3] bg-slate-200 rounded-lg" />
              <div className="aspect-[4/3] bg-slate-200 rounded-lg" />
            </div>
            <div className="bg-white border rounded-lg shadow-sm p-12">
              <div className="h-4 w-32 bg-slate-200 rounded mx-auto" />
            </div>
          </div>
        </div>
      </div>
      {/* Sidebar skeleton */}
      <div className="w-80 bg-slate-50 border-l p-4 flex flex-col gap-4">
        <div className="h-6 w-40 bg-slate-200 rounded" />
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-24 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-200 rounded" />
      </div>
    </div>
  );
}
```

**Note:** The exact skeleton layout is Claude's discretion (per CONTEXT.md). The example above mirrors the DeckBuilder's `flex h-[calc(100svh-56px)] overflow-hidden` container and `w-80` sidebar. Adjust pulse placeholder rows to taste.

### Pattern 4: Collection Page Status State Machine Extension

**What:** Extend the existing `status` state machine in `collection/page.tsx` to carry a card count for display during the `uploading` / `loading` states.

**Current state:** Status `'uploading'` renders `"Syncing with database..."` (line 164). Deck status `'loading'` renders `'Adding...'` inside the button (line 212).

**Required change:** Add a `cardCount` state variable (or inline count), set it before the POST fires, and render it in the status text.

```typescript
// src/app/collection/page.tsx — existing pattern to extend
// Add state for card count
const [importCardCount, setImportCardCount] = useState<number>(0);

// In handleFileUpload, BEFORE setStatus('uploading'):
setImportCardCount(normalized.length);
setStatus('uploading');
// ... then fetch

// In status text:
{status === 'uploading' && (
  <p className="text-sm font-medium animate-pulse">
    Importing {importCardCount} cards...
  </p>
)}

// For Quick Add, deck.cards.length gives the count:
const cardCount = deck.cards.reduce((sum, c) => sum + c.qty, 0);
// Use in button label or status text
```

### Anti-Patterns to Avoid

- **Using `sql.raw` with user-controlled arrays:** The `cardDefinitionIds` in `batchRecomputeTotals` come from a DB lookup (not user input), but still prefer `inArray()` operator for safety and readability.
- **Forgetting additive semantics in `incrementVariantCount` batch:** Quick Add increments counts (adds on top of existing), while CSV Import overwrites them. These must be TWO DIFFERENT batch helpers or one helper with a `mode: 'increment' | 'overwrite'` parameter.
- **Passing empty arrays to Drizzle batch insert:** Drizzle throws if `.values([])` is called with an empty array. Always guard with `if (items.length === 0) return;`.
- **Using `loading.tsx` without understanding its scope:** The skeleton will show for ALL `/decks/[id]` loads (new decks AND existing deck opens). Design it to be structurally valid for any deck, not just the empty-deck case.
- **Putting auth logic in `loading.tsx`:** `loading.tsx` is a fallback rendered server-side — no auth headers are available. Do not call `auth.api.getSession()` in `loading.tsx`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-row INSERT | A loop calling `db.insert().values(row)` N times | `db.insert().values([...array...])` | Drizzle handles multi-row VALUES natively |
| Batch total recompute | A loop over definition IDs calling `recomputeTotal()` | Single SELECT+GROUP BY then batch INSERT | One SELECT captures all sums; one INSERT applies them all |
| Skeleton animation | Custom CSS keyframes or JS-driven animation | Tailwind `animate-pulse` | Already used throughout the app (catalog card grid); consistent and zero-cost |
| Loading state | Manual Suspense boundary around `page.tsx` | `loading.tsx` file convention | Next.js handles the Suspense boundary automatically |

**Key insight:** The entire timeout problem is caused by sequential `await` chains over potentially 1,000+ DB round-trips. The fix is architectural (batch), not a timeout increase or background worker.

---

## Common Pitfalls

### Pitfall 1: Additive vs Overwrite Semantics in Batch Upsert

**What goes wrong:** Using the same batch upsert helper for both Quick Add (additive) and CSV Import (overwrite), or using overwrite for Quick Add — silently resetting existing counts to the deck quantity instead of adding to them.

**Why it happens:** The existing `incrementVariantCount` and `upsertVariantCount` functions look similar but differ in their conflict update: `count + qtyToAdd` vs `count = safeCount`. The batch refactor must preserve this distinction.

**How to avoid:** Define two distinct batch helpers — `batchIncrementVariantCounts` (Quick Add) and `batchUpsertVariantCounts` (CSV Import) — or use a single helper with a clearly named `mode` parameter. The conflict update set differs between them.

**Warning signs:** After Quick Add, a user's collection count for a card is exactly 1 or 3 (the deck quantity) rather than their existing count plus the deck quantity.

### Pitfall 2: Empty Array Guard for Drizzle `.values([])`

**What goes wrong:** Calling `db.insert(table).values([])` throws a Drizzle/Neon error at runtime.

**Why it happens:** An import with 0 valid items (all items in the CSV were unrecognized) would pass an empty array to the batch helper.

**How to avoid:** Every batch helper must start with `if (items.length === 0) return;`. The existing routes already handle this case (the `if (payload.length === 0)` check in import/route.ts returns early before the upsert loops), but the helpers themselves should be defensive.

**Warning signs:** `TypeError: values must be a non-empty array` in Neon/Drizzle stack traces.

### Pitfall 3: `loading.tsx` Blocks on Layout Auth

**What goes wrong:** If a parent layout (e.g., `src/app/layout.tsx` or `src/app/decks/layout.tsx`) accesses uncached runtime data (cookies, headers), `loading.tsx` will NOT show immediately — the layout finishes first, blocking the skeleton.

**Why it happens:** Per official docs: "If the layout accesses uncached or runtime data, `loading.js` will not show a fallback for it."

**How to avoid:** Verify that there is no `src/app/decks/layout.tsx` (confirmed: there isn't). Check `src/app/layout.tsx` for `cookies()` or `headers()` calls. If found, they must be wrapped in their own Suspense boundaries.

**Warning signs:** The skeleton takes noticeable time to appear after navigation (same delay as before adding `loading.tsx`).

### Pitfall 4: Card Count Stale from Route Response vs Client State

**What goes wrong:** Showing the count from the API response after it resolves (too late) instead of the count computed before the POST fires (correct for "while processing" messaging).

**Why it happens:** The intent of D-05 is to show the count BEFORE the operation begins so the UI is never silent during a long operation.

**How to avoid:** Set `importCardCount` (or equivalent state) from `normalized.length` / `deck.cards.reduce(...)` immediately before calling `setStatus('uploading')` — not from the API response. The success message can use the API response count as a cross-check, but the in-flight message must use the pre-computed count.

**Warning signs:** The status text briefly shows "Importing 0 cards..." or "Importing cards..." without a number.

### Pitfall 5: `recomputeTotal` For Definitions With Zero Printings Owned

**What goes wrong:** The `batchRecomputeTotals` SELECT returns no row for a definition if the user has no variant counts after the import (e.g., all items were skipped). The missing definition then has a stale total in `user_collections`.

**Why it happens:** The GROUP BY only returns rows where there are matching `user_printing_collections` rows. Definitions with no variant rows produce no sum.

**How to avoid:** After the batch SELECT, also INSERT rows for any affected definition IDs that had NO sum returned (count = 0). Or use a LEFT JOIN approach. In practice, Quick Add always increments (so the definition will have variant rows), and CSV Import upserts (so a count=0 item would be in the DB). This is an edge case — flag for verification in the plan.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Existing incrementVariantCount (to be batched)
```typescript
// Source: src/db/queries/collection.ts (existing — READ BEFORE IMPLEMENTING)
export async function incrementVariantCount(
  cardPrintingId: number,
  qtyToAdd: number,
  userId: number
) {
  return db
    .insert(userPrintingCollections)
    .values({ userId, cardPrintingId, count: qtyToAdd })
    .onConflictDoUpdate({
      target: [userPrintingCollections.userId, userPrintingCollections.cardPrintingId],
      set: {
        count: sql`${userPrintingCollections.count} + ${qtyToAdd}`,
        updatedAt: new Date(),
      },
    })
    .returning();
}
```

The batch version must use `EXCLUDED.count` (the value being inserted) rather than a JS variable `qtyToAdd`:

```typescript
// Batch variant — conflict update references EXCLUDED.count (the inserted value)
set: {
  count: sql`${userPrintingCollections.count} + EXCLUDED.count`,
  updatedAt: new Date(),
},
```

### Existing recomputeTotal (to be batched)
```typescript
// Source: src/db/queries/collection.ts (existing — READ BEFORE IMPLEMENTING)
export async function recomputeTotal(userId: number, cardDefinitionId: number) {
  const [{ total }] = await db
    .select({ total: sql<number>`COALESCE(SUM(${userPrintingCollections.count}), 0)` })
    .from(userPrintingCollections)
    .innerJoin(cardPrintings, eq(cardPrintings.id, userPrintingCollections.cardPrintingId))
    .where(
      and(
        eq(userPrintingCollections.userId, userId),
        eq(cardPrintings.cardDefinitionId, cardDefinitionId)
      )
    );

  await db
    .insert(userCollections)
    .values({ userId, cardDefinitionId, count: Number(total) })
    .onConflictDoUpdate({
      target: [userCollections.userId, userCollections.cardDefinitionId],
      set: { count: Number(total), updatedAt: new Date() },
    });
}
```

The batch version replaces `eq(cardPrintings.cardDefinitionId, cardDefinitionId)` with `inArray(cardPrintings.cardDefinitionId, cardDefinitionIds)` and groups by `cardPrintings.cardDefinitionId`.

### loading.tsx file convention
```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md
// File: src/app/decks/[id]/loading.tsx
// NO parameters accepted. Server Component by default.
export default function Loading() {
  return <YourSkeletonComponent />
}
```

### Status text pattern (collection/page.tsx)
```typescript
// Source: src/app/collection/page.tsx (existing — extend, don't replace)
// Current (line 164): {status === 'uploading' && <p className="text-sm font-medium animate-pulse">Syncing with database...</p>}
// Updated:
{status === 'uploading' && (
  <p className="text-sm font-medium animate-pulse">
    Importing {importCardCount} cards...
  </p>
)}
{status === 'success' && (
  <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-lg">
    <CheckCircle2 className="size-5" />
    Done! {result?.count} cards imported.
  </div>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N sequential DB round-trips for N cards | 1 batch INSERT with N value tuples | This phase | Timeout fixed for 1,000-card imports |
| M × 2 round-trips for M definition totals | 1 SELECT GROUP BY + 1 batch INSERT | This phase | Further reduces call count |
| Status: "Syncing with database..." (no count) | Status: "Importing N cards..." (with count) | This phase | User sees progress context |
| No skeleton on `/decks/[id]` navigation | `loading.tsx` with animate-pulse skeleton | This phase | Instant visual feedback ≤500ms |

**Deprecated/outdated:**
- `incrementVariantCount` / `upsertVariantCount` called in per-card loops: still valid as standalone helpers, but the routes must no longer call them in loops.
- `recomputeTotal` called in per-definition loops: still valid as standalone helper, but the routes must no longer call it in loops.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Two-step Drizzle ORM approach for `batchRecomputeTotals` (SELECT then batch INSERT) is preferred over raw SQL | Architecture Patterns | If raw SQL is preferred, code example in Pattern 2 would change; logic is equivalent |
| A2 | `loading.tsx` will show correctly for client-side navigation via `router.push()` from `decks-client.tsx` | Architecture Patterns | If a parent layout blocks on auth, skeleton may not appear instantly — requires runtime verification |
| A3 | No `src/app/decks/layout.tsx` exists (confirmed by Glob) | Common Pitfalls | If a deck layout is added in future, this assumption breaks |

---

## Open Questions

1. **Does `loading.tsx` require `unstable_instant` export for guaranteed instant navigation?**
   - What we know: `loading.md` says fallback is prefetched and navigation is immediate. `instant-navigation.md` says `unstable_instant` validates the caching structure and ensures the static shell fires at every entry point. The `next.config.ts` already has `cacheComponents: true`.
   - What's unclear: Whether `router.push('/decks/${id}')` from `decks-client.tsx` (a client-side navigation from `/decks` to `/decks/[id]`) benefits from `loading.tsx` without `unstable_instant`, or whether the navigation blocks on uncached data in `page.tsx`.
   - Recommendation: Add `loading.tsx` first and test manually. If the skeleton doesn't appear instantly, add `export const unstable_instant = { prefetch: 'static' }` to `page.tsx` and wrap the `getDeckWithCards` call (which is per-user, uncached) in a Suspense boundary. This is an optional enhancement path, not a blocker.

2. **Should `batchUpsertVariantCounts` (Quick Add increment) and the CSV Import overwrite be two separate helpers or one with a `mode` parameter?**
   - What we know: Per CONTEXT.md Claude's Discretion — this is left to the implementer.
   - Recommendation: Two named functions (`batchIncrementVariantCounts` for Quick Add, `batchUpsertVariantCounts` for CSV Import) makes the distinction explicit and prevents accidental misuse. No shared code is needed between them beyond the table reference.

---

## Environment Availability

No new external tools or services required. All tools are already present.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| drizzle-orm | Batch INSERT queries | Yes | (installed) | — |
| @neondatabase/serverless | DB connection | Yes | (installed) | — |
| Next.js | loading.tsx convention | Yes | (installed, cacheComponents: true) | — |
| Vitest | Test suite | Yes | (vitest.config.mts present) | — |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.mts) |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-04 | `batchIncrementVariantCounts` increments existing count additively | unit | `npx vitest run src/db/queries/collection.test.ts` | No — Wave 0 |
| PERF-04 | `batchUpsertVariantCounts` overwrites existing count | unit | `npx vitest run src/db/queries/collection.test.ts` | No — Wave 0 |
| PERF-04 | `batchRecomputeTotals` sums all variants for multiple definitions | unit | `npx vitest run src/db/queries/collection.test.ts` | No — Wave 0 |
| PERF-04 | Empty array guard: batch helpers return without error on `[]` | unit | `npx vitest run src/db/queries/collection.test.ts` | No — Wave 0 |
| PERF-04 | Collection page renders card count in status text during upload | unit | `npx vitest run src/app/collection/` | No — Wave 0 |
| PERF-05 | `loading.tsx` renders without crashing (smoke test) | unit | `npx vitest run src/app/decks/` | No — Wave 0 |

**Note on DB unit tests:** The existing `src/db/queries/catalog.test.ts` mocks the DB — the same pattern applies for `collection.test.ts`. The batch helpers operate on the same Drizzle schema and can be tested with the same mock approach.

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/db/queries/collection.test.ts` — unit tests for `batchIncrementVariantCounts`, `batchUpsertVariantCounts`, `batchRecomputeTotals`, and empty-array guards
- [ ] `src/app/collection/page.test.tsx` — unit test for card count in status text during `uploading` state
- [ ] `src/app/decks/[id]/loading.test.tsx` — smoke test that `DeckBuilderLoading` renders without error

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (routes are auth-gated) | `auth.api.getSession()` — already present in both routes, unchanged |
| V4 Access Control | Yes | `userId` from session (not request body) — already enforced; batch helpers inherit same userId |
| V5 Input Validation | Yes | Array size cap (`MAX_IMPORT_ITEMS = 2000`) already in import route; `deckId` validated against `starterDecks` in starter-deck route |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Over-large batch (DoS via 10,000 rows) | Denial of Service | `MAX_IMPORT_ITEMS = 2000` already enforced before batch |
| `cardPrintingId` tampering | Tampering | IDs come from a DB lookup keyed by user-provided `swudbId` + `variantType`, not passed directly from client |
| SQL injection in `batchRecomputeTotals` | Tampering | Use `inArray()` Drizzle operator (not `sql.raw`) with DB-sourced integer IDs |

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md` — loading.tsx behavior, Suspense wrapping, prefetch behavior, layout caveat
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md` — `unstable_instant`, `cacheComponents`, client navigation vs page load difference
- `src/db/queries/collection.ts` — existing `incrementVariantCount`, `upsertVariantCount`, `recomputeTotal` patterns (direct codebase read)
- `src/app/api/collection/starter-deck/route.ts` — sequential loop to replace (direct codebase read)
- `src/app/api/collection/import/route.ts` — sequential loop to replace (direct codebase read)
- `src/app/collection/page.tsx` — status state machine, existing card count availability (direct codebase read)
- `src/components/decks/deck-builder.tsx` — layout structure to mirror in skeleton (direct codebase read)
- `src/components/decks/deck-sidebar.tsx` — sidebar structure to mirror in skeleton (direct codebase read)
- `next.config.ts` — `cacheComponents: true` confirmed (relevant to loading.tsx behavior)

### Secondary (MEDIUM confidence)
- `src/app/decks/[id]/page.tsx` — Server Component that `loading.tsx` will shield (direct codebase read)
- `src/components/decks/decks-client.tsx` — `handleCreateDeck` navigation trigger (direct codebase read)
- `.planning/phases/24-catalog-page-load-performance/24-CONTEXT.md` — Phase 24 caching decisions (D-08: `unstable_cache` on `getAllCards`, `getFilterOptions`) [ASSUMED: Phase 24 completed and deployed]

---

## Metadata

**Confidence breakdown:**
- Batch upsert patterns: HIGH — verified against existing codebase helpers and Drizzle's `.values([...array...])` pattern
- loading.tsx behavior: HIGH — read official docs from `node_modules/next/dist/docs/`
- Card count in status text: HIGH — collection page state machine fully read
- Skeleton layout: HIGH — DeckBuilder and DeckSidebar fully read; exact CSS classes confirmed

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (stable APIs — Next.js file conventions do not change between minor versions)
