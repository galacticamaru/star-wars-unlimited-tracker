---
phase: 11
slug: new-home-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | `vitest.config.mts` (project root) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | REQ-HOME-01 | — | N/A | unit | `npx vitest run src/db/queries/catalog.test.ts` | ✅ (stub) | ⬜ pending |
| 11-01-02 | 01 | 1 | REQ-HOME-01 | — | N/A | unit | `npx vitest run src/db/queries/catalog.test.ts` | ✅ (stub) | ⬜ pending |
| 11-02-01 | 02 | 2 | REQ-HOME-02 | — | N/A | unit (jsdom) | `npx vitest run src/components/home/hero-section.test.tsx` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | REQ-HOME-03 | — | N/A | unit (jsdom) | `npx vitest run src/components/home/high-value-grid.test.tsx` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 2 | REQ-HOME-03 | — | N/A | unit (jsdom) | `npx vitest run src/components/home/high-value-grid.test.tsx` | ❌ W0 | ⬜ pending |
| 11-03-03 | 03 | 2 | REQ-HOME-03 | — | N/A | unit (jsdom) | `npx vitest run src/components/home/high-value-grid.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/home/hero-section.test.tsx` — stubs for REQ-HOME-02 (title, subtitle, CTA link hrefs)
- [ ] `src/components/home/high-value-grid.test.tsx` — stubs for REQ-HOME-03 (price display `$X.XX`, null handling `'—'`, link routing to `/cards/[set-code]/[card-number]`)
- [ ] Add `getTopCardsByPrice` test cases to existing `src/db/queries/catalog.test.ts` (file exists as stub with `.todo` tests — add cases for: excludes tokens, excludes non-Normal variants, orders by priceUsd DESC)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero visual treatment (dark background, gradient, font scale) | REQ-HOME-02 | CSS layout and visual design not testable via Vitest | Navigate to `/` and confirm dark themed hero with large Oxanium title renders correctly |
| Card grid responsive layout (5-col desktop, fewer on mobile) | REQ-HOME-03 | Responsive breakpoints require browser rendering | Check grid at 375px, 768px, 1280px widths |
| NavBar brand link navigates to `/` | REQ-HOME-01 | Requires browser click simulation | Click brand name in NavBar, confirm navigation to `/` |
| Catalog nav link navigates to `/cards` | REQ-HOME-01 | Requires browser click simulation | Click "Catalog" in NavBar, confirm navigation to `/cards` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
