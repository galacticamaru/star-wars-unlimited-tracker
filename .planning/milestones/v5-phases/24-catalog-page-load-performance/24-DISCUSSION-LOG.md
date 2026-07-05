# Phase 24: Catalog & Page Load Performance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 24-catalog-page-load-performance
**Areas discussed:** Search debounce, Card grid rendering, LCP caching strategy, Image priority + placeholder

---

## Search Debounce

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — local state + debounce | Input value in local React state; nuqs/filter only updates after ~150ms of no typing. Eliminates mid-keystroke re-renders. | ✓ |
| No — keep instant URL sync | Every keystroke syncs URL and re-runs filter. Simpler but no debouncing. | |

**User's choice:** Yes — local state + debounce

---

| Option | Description | Selected |
|--------|-------------|----------|
| 150ms | Fast enough to feel responsive while skipping most mid-word keystrokes. Standard choice. | ✓ |
| 300ms | More conservative — user has clearly paused. Slightly more noticeable lag. | |
| You decide | Leave the exact value within 100–300ms range. | |

**User's choice:** 150ms

---

| Option | Description | Selected |
|--------|-------------|----------|
| Instant for dropdowns | Dropdowns are discrete selections — no debouncing benefit. Only search debounces. | ✓ |
| Debounce everything | Consistent treatment, but adds latency to discrete selections. | |

**User's choice:** Instant for dropdowns only

---

## Card Grid Rendering

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — @tanstack/virtual | Only renders visible rows. Fixes DOM-size bottleneck for 1000+ card catalog. | ✓ |
| No — trust filtering | Most filter combos return <200 cards. No virtualization complexity. | |
| You decide | Leave to implementer based on profiling. | |

**User's choice:** Yes — @tanstack/virtual

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed column count per breakpoint | Hardcode 3/5/7/9/11 matching existing CSS. Simpler and predictable. | ✓ |
| Dynamic column detection | Measure container width + compute from tile width. More accurate but adds ResizeObserver complexity. | |

**User's choice:** Fixed column count per breakpoint (3/5/7/9/11)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing scroll container | @tanstack/virtual observes the existing 100svh-56px container. No layout changes. | ✓ |
| Change scroll behavior | Switch to window scroll for simpler setup. Changes current fixed-sidebar layout. | |

**User's choice:** Reuse existing scroll container

---

## LCP Caching Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Remove force-dynamic, cache card data | Page becomes RSC-cacheable. Card data is user-agnostic when userId is dropped. | ✓ |
| Keep force-dynamic, optimize queries | DB index improvements — doesn't eliminate per-request cost. | |
| You decide | Leave caching strategy to implementer. | |

**User's choice:** Remove force-dynamic, cache card data

---

| Option | Description | Selected |
|--------|-------------|----------|
| Drop userId from getAllCards | Pure card+printing JOIN. No userCollections LEFT JOIN. Fully cacheable. | ✓ |
| Keep userId but cache selectively | Pass no userId for cached route, keep userId path for API routes. | |

**User's choice:** Drop userId from getAllCards entirely

---

| Option | Description | Selected |
|--------|-------------|----------|
| revalidateTag('cards') in sync cron | Tag cache with 'cards'. Daily sync calls revalidateTag after insert. On-demand invalidation. | ✓ |
| Time-based revalidation (86400s) | Cache expires after 24h automatically. Simpler but stale for up to 24h. | |
| You decide | Leave invalidation approach to implementer. | |

**User's choice:** revalidateTag('cards') in the daily sync cron

---

| Option | Description | Selected |
|--------|-------------|----------|
| Short-lived cache (revalidate: 60s) | ISR — most visitors get cached response, stays reasonably fresh. | |
| Stay force-dynamic | Always fresh. Best if user immediately previews own binder after editing. | ✓ |
| You decide | Leave to implementer. | |

**User's choice:** Binder page stays force-dynamic

---

## Image Priority + Placeholder

| Option | Description | Selected |
|--------|-------------|----------|
| First N by index | CardGrid passes priority={index < N}. Deterministic and simple. | ✓ |
| First row only, responsive | Compute columns at current breakpoint, priority = exactly first row count. Requires columnCount prop. | |
| You decide | Leave priority cutoff to implementer. | |

**User's choice:** First N cards by index

---

| Option | Description | Selected |
|--------|-------------|----------|
| First 11 (one full row at xl) | Conservative — only top row gets priority. | |
| First 22 (two full rows at xl) | A bit more generous. Better perceived performance for initial scroll. | ✓ |
| You decide | Leave exact count to implementer. | |

**User's choice:** First 22 cards (index < 22)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current skeleton only | animate-pulse + opacity-0 already gives good skeleton feel. No blurDataURL needed. | ✓ |
| Add blur placeholder | placeholder="blur" + blurDataURL. Softer transition but adds build complexity. | |

**User's choice:** Keep current skeleton behavior (no blur placeholder)

---

## Claude's Discretion

- Exact implementation of breakpoint hook for virtualization column count
- Whether to introduce a shared `useDebounce` hook or inline with `useEffect`
- Whether `unstable_cache` or `cache()` from React is used (check Next.js docs per AGENTS.md)
- How scroll container ref plumbing works for @tanstack/virtual

## Deferred Ideas

- Blur placeholder — explicitly deferred; current skeleton is sufficient
- Public binder page ISR caching — explicitly deferred; stays force-dynamic for freshness
- Database query indexes — not in scope; Phase 24 is frontend-side performance only
- PERF-04/PERF-05 (Quick Add progress, new deck speed) — Phase 25 scope
