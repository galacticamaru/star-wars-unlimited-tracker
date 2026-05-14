---
phase: 15
slug: deck-list-display-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 15 — Validation Strategy

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
| 15-01-01 | 01 | 1 | REQ-DECK-07 | — | N/A | unit | `npm test -- --run __tests__/deck-grouping.test.ts` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | REQ-DECK-07 | — | N/A | unit | `npm test -- --run __tests__/deck-grouping.test.ts` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 1 | REQ-DECK-10 | — | N/A | unit | `npm test -- --run __tests__/deck-grouping.test.ts` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 2 | REQ-DECK-10 | — | N/A | manual | Browser: hover card row → art preview appears on left | N/A | ⬜ pending |
| 15-03-01 | 03 | 1 | REQ-DECK-08 | — | N/A | unit | `npm test -- --run __tests__/aspect-panel.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/deck-grouping.test.ts` — stubs for REQ-DECK-07 (type grouping logic, arenas-based classification, empty group suppression) and REQ-DECK-10 (frontArtUrl null guard)
- [ ] `__tests__/aspect-panel.test.ts` — stubs for REQ-DECK-08 (Basic aspect exclusion, descending sort by count, numeric display)

*Both test files are pure unit tests against derivation logic — no DOM rendering required. Grouping helper and aspect filter should be extracted to testable pure functions.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hover card row → art preview panel appears to the left | REQ-DECK-10 | Involves Image render + pointer events + CSS transitions | Load deck in editor view; hover a non-leader/base row; confirm art preview appears in left panel |
| Mobile tap → fixed bottom bar shows card art | REQ-DECK-10 | Touch events not easily automated in Vitest | Open on mobile/devtools touch mode; tap a card row; confirm 96px fixed bottom bar appears with art |
| Leader/Base filled slot shows art with Remove overlay on hover | REQ-DECK-10 | Involves CSS group-hover overlay + Image rendering | Select a leader; confirm art fills slot; hover slot; confirm Remove overlay button appears |
| Type-group headers show correct card counts | REQ-DECK-07 | Count display in rendered DOM | Add cards of each type to deck; confirm section headers show correct (N) counts |
| Aspect panel sorted by count descending, Basic excluded | REQ-DECK-08 | Rendered sort order in DOM | Confirm panel lists aspects with highest count first; confirm "Basic" is not listed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
