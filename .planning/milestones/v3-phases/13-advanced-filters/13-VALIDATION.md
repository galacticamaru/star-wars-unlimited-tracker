---
phase: 13
slug: advanced-filters
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/filter-cards.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/filter-cards.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | REQ-DECK-06 | — | `ownedOnly=false` returns all cards regardless of collection | unit | `npx vitest run src/lib/filter-cards.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | REQ-DECK-06 | — | `ownedOnly=true` returns only cards with `collection[id] >= 1` | unit | `npx vitest run src/lib/filter-cards.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | REQ-DECK-06 | — | `ownedOnly=true` with empty collection returns 0 cards | unit | `npx vitest run src/lib/filter-cards.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-04 | 01 | 1 | REQ-DECK-06 | — | `ownedOnly=true` ANDs correctly with other active filters | unit | `npx vitest run src/lib/filter-cards.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/filter-cards.test.ts` — add 4 new ownedOnly test cases (extend existing file using makeCard + emptyFilters pattern)

*Existing test infrastructure (Vitest + jsdom) is already in place. Only new test cases are needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toggle renders disabled + tooltip "Log in to filter by owned cards" when logged out | REQ-DECK-06 (D-02) | Requires browser session state | Log out, open /cards, confirm toggle is greyed out and shows tooltip on hover |
| `?owned=true` in URL persists across page refresh | REQ-DECK-06 (D-04) | Requires live browser + nuqs routing | Enable toggle, refresh page, confirm filter still active and URL shows `?owned=true` |
| "Clear All Filters" resets owned-only toggle to false | REQ-DECK-06 | Requires browser interaction | Enable toggle, click Clear All, confirm toggle resets and URL param is removed |
| Toggle appears in deck builder card browser (not just /cards) | REQ-DECK-06 (D-05) | Requires navigating to deck builder | Open a deck's builder view, confirm owned-only toggle is visible in the sidebar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
