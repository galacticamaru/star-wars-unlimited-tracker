---
phase: 17
slug: variant-collection-tracking
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-17
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

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
| 17-01-01 | 01 | 0 | REQ-COLLECT-06 | T-17-01 | count floor `Math.max(0, n)` | unit | `npx vitest run src/lib/collection/normalize.test.ts` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 0 | REQ-COLLECT-07 | T-17-02 | count floor `Math.max(0, n)` | unit | `npx vitest run src/lib/collection/normalize.test.ts` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 0 | D-05 | — | N/A | unit | `npx vitest run src/app/api/collection/collection-shape.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/collection/normalize.test.ts` — per-variant normalizer output (REQ-COLLECT-06, REQ-COLLECT-07)
- [ ] `src/app/api/collection/collection-shape.test.ts` — GET response shape reducer (D-05)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Card detail page shows all same-set variants with owned counts | REQ-COLLECT-06 | Requires live DB + auth | Navigate to a card detail page as logged-in user; verify variant rows appear with correct counts |
| Increment/decrement persists across page reload | REQ-COLLECT-07 | Requires live DB + auth | Click + on a variant; reload page; verify count persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
