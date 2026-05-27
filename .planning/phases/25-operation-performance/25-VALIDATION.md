---
phase: 25
slug: operation-performance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-27
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 0 | PERF-04 | — | N/A | unit | `npx vitest run src/db/queries/collection.test.ts` | ❌ W0 | ⬜ pending |
| 25-01-02 | 01 | 1 | PERF-04 | T-batch-add | `userId` from session; batch helpers inherit same auth | unit | `npx vitest run src/db/queries/collection.test.ts` | ❌ W0 | ⬜ pending |
| 25-01-03 | 01 | 1 | PERF-04 | T-batch-csv | `userId` from session; array size cap enforced | unit | `npx vitest run src/db/queries/collection.test.ts` | ❌ W0 | ⬜ pending |
| 25-02-01 | 02 | 0 | PERF-04 | — | N/A | unit | `npx vitest run src/app/collection/` | ❌ W0 | ⬜ pending |
| 25-02-02 | 02 | 1 | PERF-04 | — | N/A | unit | `npx vitest run src/app/collection/` | ❌ W0 | ⬜ pending |
| 25-03-01 | 03 | 0 | PERF-05 | — | N/A | unit | `npx vitest run src/app/decks/` | ❌ W0 | ⬜ pending |
| 25-03-02 | 03 | 1 | PERF-05 | — | N/A | unit | `npx vitest run src/app/decks/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/db/queries/collection.test.ts` — stubs for PERF-04: `batchIncrementVariantCounts` (additive), `batchUpsertVariantCounts` (overwrite), `batchRecomputeTotals` (multi-def sum), empty-array guard
- [ ] `src/app/collection/page.test.tsx` — stub for PERF-04: card count in status text during `uploading` state
- [ ] `src/app/decks/[id]/loading.test.tsx` — stub for PERF-05: `DeckBuilderLoading` renders without crash

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skeleton appears ≤500ms after clicking "New Deck" | PERF-05 | Timing is a perceptual metric, not programmatically assertable | Click "New Deck", observe that the pulse skeleton appears before data loads; skeleton must be visible before DeckBuilder replaces it |
| Quick Add + CSV Import complete without timeout for ~1,000 cards | PERF-04 | Requires a production-scale dataset and Neon HTTP connection | Import a 1,000-row CSV; Quick Add a large starter deck; verify no 504 timeout and correct counts in collection afterward |
| Status text shows correct card count before POST resolves | PERF-04 | React state timing is hard to assert in unit tests | Upload a CSV; verify "Importing N cards..." text appears immediately when upload starts (N matches file row count) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
