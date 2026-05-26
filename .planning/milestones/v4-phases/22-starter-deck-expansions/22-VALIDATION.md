---
phase: 22
slug: starter-deck-expansions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-21
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (no test framework for this data file) |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds (tsc); ~30 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds (tsc check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | REQ-CAT-04 | — | N/A (static data only) | type-check | `npx tsc --noEmit` | ✅ (existing) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test stubs needed — the TypeScript compiler validates all `StarterDeck` entries against the interface automatically.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| New decks appear in Quick Add dropdown | REQ-CAT-04 | UI rendering cannot be automated without browser | Visit `/collection`, open Quick Add dropdown, verify new deck names appear |
| Quick Add adds correct card count | REQ-CAT-04 | Requires live DB + browser interaction | Select a new deck, click "Add to Collection", verify toast shows expected card count |
| TS26 collector numbers resolve in DB | REQ-CAT-04 | Requires seeded `card_printings` for TS26 set | Add a TS26 deck and verify non-zero `cardsAdded` (TS26 must be seeded first) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
