---
phase: 2
slug: card-catalog
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-04
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | `vitest.config.mts` (root) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run` + `npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green + `npm run build` exits 0 + manual smoke test in browser
- **Max feedback latency:** ~10 seconds (automated), + ~2 min (build)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| next.config.ts update | 01 | 1 | CATALOG-01 | T-2-01 | remotePatterns restricts to cdn.swu-db.com only | build | `npm run build` | ✅ | ⬜ pending |
| getAllCards() query | 01 | 1 | CATALOG-01 | — | Token types excluded, Normal variant only | unit (node) | `npm test -- --run src/db/queries/catalog.test.ts` | ❌ W0 | ⬜ pending |
| filterCards() pure fn | 01 | 1 | CATALOG-02, CATALOG-03 | — | N/A (no external input to DB) | unit (node) | `npm test -- --run src/lib/filter-cards.test.ts` | ❌ W0 | ⬜ pending |
| CatalogClient + filtering | 02 | 2 | CATALOG-02, CATALOG-03 | — | N/A | browser unit | `npm test -- --run src/components/catalog/catalog-client.browser.test.tsx` | ❌ W0 | ⬜ pending |
| CardItem image render | 02 | 2 | CATALOG-01 | — | N/A | browser unit | `npm test -- --run src/components/catalog/card-item.browser.test.tsx` | ❌ W0 | ⬜ pending |
| Detail page params | 03 | 3 | CATALOG-01 | — | N/A | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/db/queries/catalog.test.ts` — covers CATALOG-01: getAllCards() returns non-token cards with image URLs; stubs with mock DB or fixtures
- [ ] `src/lib/filter-cards.test.ts` — covers CATALOG-02 + CATALOG-03: pure filterCards() function, search substring match, AND logic across categories, OR within aspect category
- [ ] `src/components/catalog/card-item.browser.test.tsx` — covers CATALOG-01 image render (jsdom environment)
- [ ] `src/components/catalog/catalog-client.browser.test.tsx` — covers CATALOG-02/03 search/filter DOM behavior (jsdom environment)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Grey placeholder renders during image load | CATALOG-01 (D-02) | Requires real browser + throttled network; jsdom cannot simulate image load timing | Open catalog with DevTools Network tab, throttle to Slow 3G, observe grey shimmer before images load |
| Hover ring appears on card | CATALOG-01 (D-02) | Visual CSS interaction; not reproducible in jsdom | Hover over a card in the browser, confirm sky-blue ring appears |
| Grid column count at each viewport | CATALOG-01 (UI-SPEC) | CSS breakpoint behavior; requires real browser resize | Resize browser window through 640/1024/1280/1536px breakpoints, verify 3/5/7/9/11 column layouts |
| Card click navigates to /cards/SOR/059 | CATALOG-01 (D-06) | Next.js client-side routing integration | Click a card in the catalog, confirm URL changes to /cards/{set}/{number} format |
| Back button returns to catalog | CATALOG-01 (D-06) | Navigation integration | From detail page, click "Back to catalog", confirm return to / |
| Empty state "No matching cards" | CATALOG-02, CATALOG-03 | Visual DOM state; integration-level | Search for a non-existent card name, confirm empty state renders with correct copy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
