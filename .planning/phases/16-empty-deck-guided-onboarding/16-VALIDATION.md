---
phase: 16
slug: empty-deck-guided-onboarding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run src/lib/auto-filter.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/auto-filter.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| auto-filter-pure-fn | 01 | 0 | REQ-DECK-09 | — | N/A | unit | `npx vitest run src/lib/auto-filter.test.ts` | ❌ W0 | ⬜ pending |
| types-empty-state | 01 | 0 | REQ-DECK-09 | — | N/A | unit | `npx vitest run src/lib/auto-filter.test.ts` | ❌ W0 | ⬜ pending |
| types-leader-only | 01 | 0 | REQ-DECK-09 | — | N/A | unit | `npx vitest run src/lib/auto-filter.test.ts` | ❌ W0 | ⬜ pending |
| aspects-both-selected | 01 | 0 | REQ-DECK-09 | — | N/A | unit | `npx vitest run src/lib/auto-filter.test.ts` | ❌ W0 | ⬜ pending |
| basic-excluded | 01 | 0 | REQ-DECK-09 | — | N/A | unit | `npx vitest run src/lib/auto-filter.test.ts` | ❌ W0 | ⬜ pending |
| override-flag-set | 01 | 0 | REQ-DECK-09 | — | N/A | unit | `npx vitest run src/lib/auto-filter.test.ts` | ❌ W0 | ⬜ pending |
| override-flag-reset | 01 | 0 | REQ-DECK-09 | — | N/A | unit | `npx vitest run src/lib/auto-filter.test.ts` | ❌ W0 | ⬜ pending |
| neutral-cards-pass | 01 | — | REQ-DECK-09 | — | N/A | unit | `npx vitest run src/lib/filter-cards.test.ts` | ✅ | ⬜ pending |
| cta-rename | 02 | 1 | REQ-DECK-09 | — | N/A | unit | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/auto-filter.ts` — pure functions `computeAutoFilter(leader, base, isOverridden)` and `computeAutoFilterLabel(autoFilter, isOverridden)` extracted from DeckBuilder render logic
- [ ] `src/lib/auto-filter.test.ts` — unit tests for D-01 three states (empty, leader-only, both-selected), D-08 Basic exclusion, D-03/D-04 override flag set/reset behavior

*Neutral card aspect-pass behavior is already covered by `filter-cards.test.ts` (vacuous truth). No new test file needed for that case.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Auto-filter chip renders with correct label ("Auto: Leader & Base" / "Auto: Aspect filter") in each state | REQ-DECK-09 (D-09) | Requires Next.js render context + browser DOM inspection | Open deck builder → confirm chip text matches current state; switch leader/base and re-confirm |
| Override persists after user manually unchecks an aspect, until leader/base change | REQ-DECK-09 (D-03/D-04) | Requires real browser interaction | Enable auto-filter → manually change filter → confirm no revert; then change leader → confirm auto-filter reapplied |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
