# Phase 27: /decks Route Performance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** 27-decks-route-performance
**Areas discussed:** INP optimization scope, Cache lifetime, Speed Insights review (PERF-09)

---

## INP Optimization Scope

### Which interactions get startTransition?

| Option | Description | Selected |
|--------|-------------|----------|
| Card +/- dispatch calls only | Wrap onClick handlers for UPDATE_CARD, SET_LEADER, SET_BASE in startTransition. High-frequency taps that cause deck list re-renders. | ✓ |
| All user interactions | Wrap every dispatch call AND handleSave async operation. More thorough but adds boilerplate to ~10 handlers. | |
| You decide | Leave exact scope to planner/executor based on Speed Insights data. | |

**User's choice:** Card +/- dispatch calls only (Recommended)
**Notes:** Save operations are already async awaits; INP is not the concern there.

---

### startTransition only vs both startTransition + useDeferredValue?

| Option | Description | Selected |
|--------|-------------|----------|
| startTransition only | Sufficient for a deck capped at ~60 cards. useDeferredValue adds complexity without meaningful gain at this scale. | ✓ |
| Both startTransition + useDeferredValue | Apply useDeferredValue to the deck cards array. More thorough for larger decks. | |
| You decide | Let executor benchmark and apply whichever approach Speed Insights shows is needed. | |

**User's choice:** startTransition only (Recommended)
**Notes:** Deck size cap (~60 cards) makes useDeferredValue unnecessary.

---

## Cache Lifetime

### What cacheLife for deck query functions?

| Option | Description | Selected |
|--------|-------------|----------|
| No cacheLife (indefinite, revalidateTag-only) | Cache expires only on revalidateTag after mutations. Always fresh after any write; no stale window. | ✓ |
| cacheLife('minutes') | Short TTL as safety net. Self-heals if revalidateTag is ever missed. | |
| cacheLife('hours') | Medium TTL. Less aggressive self-healing. | |

**User's choice:** No cacheLife (Recommended)
**Notes:** Per-user deck data is invalidated on every write, so TTL would just cause unnecessary cache misses for users who don't mutate.

---

### Which cache tags does revalidateTag invalidate on mutations?

| Option | Description | Selected |
|--------|-------------|----------|
| Both specific-deck + user-list tags | PATCH invalidates deck-{deckId}-user-{userId} + decks-user-{userId}; DELETE same; POST invalidates decks-user-{userId} only. Ensures both /decks list and /decks/[id] stay fresh. | ✓ |
| User-list tag only | Always invalidate decks-user-{userId}. Simpler — one tag. /decks/[id] cache not explicitly invalidated. | |

**User's choice:** Both specific-deck + user-list tags (Recommended)

---

## Speed Insights Review (PERF-09)

### How to handle PERF-09 in the plan?

| Option | Description | Selected |
|--------|-------------|----------|
| Prescribe likely fixes, mark PERF-09 verified post-deploy | Researcher identifies likely regressions; executor applies them; verified when Speed Insights data improves. No live dashboard review required. | |
| Build a review checkpoint into execution | Mandatory step where user opens Vercel Speed Insights dashboard, identifies specific regressions, provides findings to executor. Slower but more precise. | ✓ |

**User's choice:** Build a review checkpoint into execution
**Notes:** Requires a plan step where execution pauses for user to review dashboard before targeted fixes are applied.

---

### Fallback when no Speed Insights data is available?

| Option | Description | Selected |
|--------|-------------|----------|
| Apply catalog-parity improvements anyway | Suspense boundaries, loading.tsx skeleton, image lazy loading — same class of fixes that worked in Phase 24. Document that no regression data was available. | ✓ |
| Block and wait for data | Defer PERF-09 to a future phase if no data is available. | |
| You decide | Let executor decide based on what they see in the dashboard. | |

**User's choice:** Apply catalog-parity improvements anyway (Recommended)

---

## Claude's Discretion

- Exact placement of `cacheTag` / `revalidateTag` imports
- Whether `getDecks` needs a `cacheLife` argument alongside `cacheTag` (D-03 says no TTL, but Claude may add one if there's a strong technical reason)
- Specific Suspense boundary placement within `/decks/[id]/page.tsx` for the PERF-09 fallback path

## Deferred Ideas

None — discussion stayed within phase scope.
