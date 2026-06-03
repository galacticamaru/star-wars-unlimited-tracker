# Phase 29: Card Detail Page Performance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-03
**Phase:** 29-card-detail-page-performance
**Areas discussed:** Query Caching Approach, Loading Skeleton, Image Priority Fix, Speed Insights Checkpoint

---

## Query Caching Approach

### Q1: How to cache getCardByPrinting?

| Option | Description | Selected |
|--------|-------------|----------|
| Split into two queries | New getCardDefinition() with only public data — 'use cache' + cacheTag('cards') + cacheLife('days'). Keep user collection count as a separate lightweight query. Mirrors catalog pattern. | ✓ |
| Per-user cache | Cache the whole query with cacheTag per user. Fast for repeat visits, but requires revalidateTag in /api/collection/variants after every count update. | |
| No caching on this query | Skip caching — focus gains on loading skeleton + image priority. Simpler but no TTFB improvement. | |

**User's choice:** Split into two queries (catalog pattern)
**Notes:** None

---

### Q2: Legacy hydration block — keep or remove?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep it, move to separate query | Fetch collectionCount via a small separate query. Legacy hydration still runs server-side. | |
| Remove legacy hydration | Per-variant tracking shipped Phase 17 (May 2026). Any user who's used the app since has migrated. Remove the block — simplifies query split. | ✓ |
| You decide | Claude picks based on how old the migration is and whether it's safe to drop. | |

**User's choice:** Remove legacy hydration
**Notes:** None

---

### Q3: Cache getSameSetPrintingsWithCounts per-user?

| Option | Description | Selected |
|--------|-------------|----------|
| Cache per-user (Recommended) | cacheTag('card-printings-{cardDefinitionId}-user-{userId}'). Requires revalidateTag in /api/collection/variants and /api/trade route. | ✓ |
| Leave uncached | Only public card data gets cached. Variant counts always hit DB. Simpler — no revalidateTag wiring. | |
| You decide | Claude picks based on whether the query is performance-critical. | |

**User's choice:** Cache per-user
**Notes:** None

---

### Q4: Two-layer cache invalidation (revalidateTag + router.refresh())?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — two-layer invalidation (Recommended) | revalidateTag in API routes (server Data Cache) + router.refresh() in VariantCollectionSection/VariantTradeSection after mutations (Router Cache). Matches Phase 27 pattern. | ✓ |
| revalidateTag only | Skip router.refresh() — rely solely on server-side tag invalidation. May leave stale Router Cache. | |

**User's choice:** Two-layer invalidation
**Notes:** None

---

## Loading Skeleton

### Q1: Add loading.tsx?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add loading.tsx (Recommended) | Immediately shows skeleton matching two-column layout. Instant perceived FCP improvement without waiting for Speed Insights data. | ✓ |
| Wait for Speed Insights data | Don't assume LCP is the issue — let the checkpoint guide what to fix. Add skeleton only if regressions are confirmed. | |

**User's choice:** Yes — add loading.tsx
**Notes:** None

---

### Q2: Level of skeleton detail?

| Option | Description | Selected |
|--------|-------------|----------|
| Full layout skeleton (Recommended) | Two-column: image placeholder + title/subtitle/badge row/stat chips/text boxes. Matches real layout to prevent shift. | ✓ |
| Minimal skeleton | Centered spinner or full-width gray block. Faster to implement, less precise. | |

**User's choice:** Full layout skeleton
**Notes:** None

---

### Q3: Include variant section placeholders?

| Option | Description | Selected |
|--------|-------------|----------|
| Image + metadata only | Variant sections are below the fold. Covers the LCP area. Simpler. | ✓ |
| Include variant section placeholders | Full-page skeleton including variant collection and trade rows. More complete, more complex. | |

**User's choice:** Image + metadata only (above-fold coverage)
**Notes:** None

---

## Image Priority Fix

### Q1: Replace preload={true} with priority?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — replace preload with priority (Recommended) | priority tells Next.js to preload the image and skip lazy loading. Standard fix for above-fold LCP candidates. | ✓ |
| You decide | Claude handles it based on image optimization best practices. | |

**User's choice:** Yes
**Notes:** None

---

### Q2: Any other image optimizations beyond priority?

| Option | Description | Selected |
|--------|-------------|----------|
| priority only — that's sufficient | sizes prop is already correct. priority alone moves card art from lazy to preloaded. | ✓ |
| Also add blur placeholder | blurDataURL for blur-up effect. More complex but reduces perceived LCP. | |

**User's choice:** priority only
**Notes:** None

---

## Speed Insights Checkpoint

### Q1: Same checkpoint pattern as Phase 27?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — same pattern as Phase 27 (Recommended) | Wave 1: proactive fixes. Checkpoint: review Speed Insights data + provide findings. Wave 2: targeted fixes per findings. | ✓ |
| Proactive fixes only — no checkpoint | Apply known improvements and close the phase. Accept that we don't have per-route data. | |

**User's choice:** Same pattern as Phase 27
**Notes:** None

---

### Q2: Fallback if Speed Insights has insufficient data?

| Option | Description | Selected |
|--------|-------------|----------|
| Close the phase (Wave 1 is sufficient) | Document that no regression data was available. Phase closes after proactive fixes. | ✓ |
| Apply INP hardening as fallback | Add startTransition around VariantCollectionSection update handlers — same as PERF-08. | |

**User's choice:** Close the phase after Wave 1 if no data
**Notes:** None

---

## Claude's Discretion

- Exact function signature for `getCardDefinition` — retain same return shape minus `collectionCount`, or rename/restructure
- How to derive `cardDefinitionId` from `cardPrintingId` in API route handlers for revalidateTag (small lookup query or pass `cardDefinitionId` in request body from client)
- Whether `router.refresh()` is already present in `VariantCollectionSection` / `VariantTradeSection` — check before adding
- Exact skeleton line heights and widths — mirror real layout proportions

## Deferred Ideas

None — discussion stayed within phase scope.
