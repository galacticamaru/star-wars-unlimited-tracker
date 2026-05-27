# Phase 25: Operation Performance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 25-operation-performance
**Areas discussed:** Timeout fix strategy, Progress feedback UI, Deck creation speed (PERF-05)

---

## Timeout Fix Strategy

### Q1: How should the backend handle bulk card upserts to prevent timeout?

| Option | Description | Selected |
|--------|-------------|----------|
| Batch DB insert | Replace per-card sequential loop with one batch INSERT VALUES ON CONFLICT DO UPDATE. ~1,500 round-trips → 1-3 queries. Works for both routes. | ✓ |
| Client-side chunking | Client splits payload into batches of ~50 items, fires sequential requests, tracks progress between calls. Also enables progress UI. | |
| SSE streaming | Server returns ReadableStream with progress events. Connection stays open, no timeout. Complex in Next.js App Router. | |

**User's choice:** Batch DB insert

---

### Q2: Should we also batch the recomputeTotal step into a single SQL query?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — single batch recompute | Replace per-definition recomputeTotal loop with one INSERT SELECT GROUP BY query. Eliminates last batch of N Neon calls. | ✓ |
| No — leave recomputeTotal as-is | After fixing upsert loop, ~250 recomputeTotal calls remain for CSV Import. ~500 Neon calls. May still near timeout. | |

**User's choice:** Yes — single batch recompute

---

### Q3: Apply batch approach to both Quick Add and CSV Import, or just CSV Import?

| Option | Description | Selected |
|--------|-------------|----------|
| Both | Quick Add (~55 cards) probably doesn't timeout today, but same sequential pattern. One shared batch helper is cleaner and future-proof. | ✓ |
| CSV Import only | Quick Add is small enough. Less refactoring. | |

**User's choice:** Both

---

## Progress Feedback UI

### Q4: How should progress be shown during Quick Add / CSV Import?

| Option | Description | Selected |
|--------|-------------|----------|
| Indeterminate spinner with status text | "Importing 847 cards..." → "Done! 847 cards imported." Honest — no per-card events with batch insert. | ✓ |
| Fake incremental progress bar | Progress bar fills over estimated duration, snaps to 100% on completion. Not tied to real progress. | |

**User's choice:** Indeterminate spinner with status text

---

### Q5: What should the status text show during the upload phase?

| Option | Description | Selected |
|--------|-------------|----------|
| Card count: "Importing 847 cards..." | Shows scale of operation. Count available from parsed CSV / deck size before POST fires. | ✓ |
| Generic: "Syncing with database..." | Same as today's animate-pulse message. | |
| Two-phase: "Parsing..." then "Importing N cards..." | Separate messages for parse and upload phases. | |

**User's choice:** Card count: "Importing 847 cards..."

---

## Deck Creation Speed (PERF-05)

### Q6: What's the primary approach for hitting ≤500ms on new deck creation?

| Option | Description | Selected |
|--------|-------------|----------|
| loading.tsx skeleton | Add loading.tsx for /decks/[id] showing guided onboarding shell immediately on navigation. Phase 24 caching resolves data fast after skeleton appears. | ✓ |
| Optimistic navigation | Navigate to /decks/[tempId] immediately on click while POST runs in background. Complex failure handling. | |
| Measure first | Run Phase 24 first, then measure latency. If caching gets to ≤500ms, loading.tsx alone may suffice. | |

**User's choice:** loading.tsx skeleton

---

### Q7: What should the loading.tsx skeleton look like?

| Option | Description | Selected |
|--------|-------------|----------|
| Guided onboarding shell | Show same layout as empty deck builder — leader+base filter prompt — with skeleton/pulse placeholders. Looks like content loading. | ✓ |
| Minimal spinner | Full-page centered spinner. Simpler but shows nothing meaningful. | |
| You decide | Leave specific skeleton design to Claude. Must be consistent with existing animate-pulse patterns. | |

**User's choice:** Guided onboarding shell

---

## Claude's Discretion

- Exact SQL for batch recompute query (WITH clause vs subquery vs plain INSERT SELECT)
- Whether batch helpers are new exported functions or inline in each route
- Exact skeleton layout details (column count, sidebar width, placeholder row count)
- Whether to replace or augment existing `status === 'uploading'` text with card count

## Deferred Ideas

None — discussion stayed within phase scope.
