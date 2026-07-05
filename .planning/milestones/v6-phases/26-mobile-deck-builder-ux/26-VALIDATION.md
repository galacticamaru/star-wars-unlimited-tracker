---
phase: 26
slug: mobile-deck-builder-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-29
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 + @testing-library/react 16.3.2 |
| **Config file** | `vitest.config.mts` (root) |
| **Quick run command** | `npx vitest run src/components/decks/ src/components/catalog/card-item.deck.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/decks/ src/components/catalog/card-item.deck.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 0 | MOBILE-01, MOBILE-02, MOBILE-03, MOBILE-04 | — | N/A | unit | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ W0 | ⬜ pending |
| 26-01-02 | 01 | 0 | MOBILE-02 | — | N/A | unit | `npx vitest run src/components/catalog/card-item.deck.test.tsx` | ✅ (partial) | ⬜ pending |
| 26-02-01 | 02 | 1 | MOBILE-01 | — | N/A | unit | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ W0 | ⬜ pending |
| 26-02-02 | 02 | 1 | MOBILE-04 | — | N/A | unit | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ W0 | ⬜ pending |
| 26-03-01 | 03 | 1 | MOBILE-02 | — | N/A | unit | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ W0 | ⬜ pending |
| 26-03-02 | 03 | 1 | MOBILE-02 | — | N/A | unit | `npx vitest run src/components/catalog/card-item.deck.test.tsx` | ✅ (partial) | ⬜ pending |
| 26-04-01 | 04 | 1 | MOBILE-03 | — | N/A | unit | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/decks/deck-builder.test.tsx` — stubs covering:
  - MOBILE-01: sticky summary bar is present in DOM; Sheet not rendered initially
  - MOBILE-02: deck list +/- buttons have class `h-11 w-11`
  - MOBILE-03: toolbar root div has `flex-col md:flex-row` (or equivalent two-row class)
  - MOBILE-04: inline `DeckSidebar` wrapper has `hidden md:flex`
- [ ] `src/components/catalog/card-item.deck.test.tsx` — extend with:
  - MOBILE-02: catalog overlay +/- buttons have `min-h-[44px]` or `min-w-[44px]` in class list

*Existing infrastructure (vitest + @testing-library/react) covers all phase requirements — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Desktop layout unchanged — three-tab layout with inline sidebar visible | MOBILE-04 | Visual regression requires browser at >= 768px | Open deck builder on desktop, verify sidebar visible alongside content; no overlap or layout shift |
| Bottom sheet opens and scrolls correctly on mobile | MOBILE-01 | Requires browser DevTools touch simulation or real device | Open deck builder in DevTools mobile mode (< 480px), tap sticky bar, verify sheet slides up with DeckSidebar content scrollable |
| Virtual keyboard does not cut off Save buttons | MOBILE-01 | Requires real device or DevTools keyboard simulation | On mobile with keyboard open in deck name input, verify Sheet still reachable and Save buttons accessible |
| Touch target accuracy — no mis-taps | MOBILE-02 | Requires real touch device | On touch device, tap +/- buttons rapidly; verify no adjacent-target mis-fires |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
