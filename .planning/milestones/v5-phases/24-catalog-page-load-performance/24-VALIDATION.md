---
phase: 24
slug: catalog-page-load-performance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-26
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 0 | PERF-01, PERF-03 | — | N/A | setup | `npm test -- --run src/components/catalog/card-grid.test.tsx` | ❌ W0 | ⬜ pending |
| 24-01-02 | 01 | 1 | PERF-01 | — | N/A | unit (jsdom) | `npm test -- --run src/components/catalog/catalog-client.browser.test.tsx` | ✅ (stub) | ⬜ pending |
| 24-01-03 | 01 | 1 | PERF-01 | — | N/A | unit | `npm test -- --run src/lib/filter-cards.test.ts` | ✅ | ⬜ pending |
| 24-02-01 | 02 | 1 | PERF-01, PERF-03 | — | N/A | unit (jsdom) | `npm test -- --run src/components/catalog/card-grid.test.tsx` | ❌ W0 | ⬜ pending |
| 24-03-01 | 03 | 1 | PERF-02 | — | N/A | unit | `npm test -- --run src/db/queries/catalog.test.ts` | ✅ (stub) | ⬜ pending |
| 24-03-02 | 03 | 1 | PERF-02 | — | N/A | build | `npx tsc --noEmit` | — | ⬜ pending |
| 24-04-01 | 04 | 2 | PERF-02 | — | N/A | build | `npm run build` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/catalog/card-grid.test.tsx` — stubs for PERF-01 (virtualized row rendering) and PERF-03 (priority threshold: first 22 cards priority=true, rest priority=false)
- [ ] Update `src/db/queries/catalog.test.ts` stubs to reflect new `getAllCards()` signature (no `userId` parameter, no `collectionCount` in return type)

*Existing infrastructure covers most phase requirements — only new test file is `card-grid.test.tsx`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Catalog filter interactions feel ≤200ms in the browser | PERF-01 | Debounce timing and grid re-render speed are UX perceptions, not unit-testable | Open catalog, type in search input, observe results update ≤200ms after typing stops; verify no spinner appears |
| LCP measurably reduced vs. baseline | PERF-02 | LCP is a browser metric measured via Chrome DevTools or Lighthouse | Open Chrome DevTools → Performance panel → run Lighthouse audit on catalog page; compare LCP to pre-Phase-24 baseline |
| Card images load lazily below fold | PERF-03 | Network request timing is browser-level | Open DevTools → Network → filter by image type; scroll catalog; verify images below fold load only as they approach viewport |
| No new layout shift during image load | PERF-03 | CLS is a browser metric | Run Lighthouse on catalog; verify CLS score is 0 or unchanged from baseline |
| cacheComponents build compatibility | PERF-02 | Requires actual build execution | Run `npm run build` after enabling `cacheComponents: true`; verify route handlers (`/api/cron/sync-cards`, `/api/cards/all`) build without errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
