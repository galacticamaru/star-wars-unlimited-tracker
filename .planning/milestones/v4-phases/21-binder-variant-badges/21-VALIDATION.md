---
phase: 21
slug: binder-variant-badges
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-21
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| Wave 0 stubs | 01 | 0 | REQ-BINDER-06 | — | badge renders only for non-Normal variant in binder mode | unit | `npx vitest run src/components/catalog/card-item.test.tsx` | ✅ extend | ⬜ pending |
| schema + queries | 01 | 1 | REQ-BINDER-06 | T-TAMPER-01 | userId from session only; FK rejects invalid cardPrintingId | unit | `npx vitest run` | ✅ | ⬜ pending |
| API + component changes | 01 | 1 | REQ-BINDER-06 | — | variantType badge visible on Foil/Showcase tiles; absent on Normal tiles | unit | `npx vitest run src/components/catalog/card-item.test.tsx` | ✅ extend | ⬜ pending |
| drizzle-kit push + migration SQL | 02 | 2 | REQ-BINDER-06 | — | user_trade_offerings table exists; migration rows present | manual smoke | — | ❌ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/catalog/card-item.test.tsx` — extend with 2 new test cases:
  - `shows variant badge in binder mode when variantType is 'Foil'`
  - `does not show variant badge in binder mode when variantType is 'Normal'`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `user_trade_offerings` table exists after schema push | REQ-BINDER-06 | DB DDL — no unit test can assert schema existence | Run `npx drizzle-kit push`; verify table in Neon console or via `SELECT * FROM user_trade_offerings LIMIT 1` |
| Migration SQL: existing `trade_quantity > 0` rows appear in `user_trade_offerings` | REQ-BINDER-06 | One-time data migration — requires live DB state | Check row count before/after migration SQL: `SELECT COUNT(*) FROM user_trade_offerings` vs `SELECT COUNT(*) FROM user_collections WHERE trade_quantity > 0` |
| Public binder shows variant badge on Foil/Showcase offering tiles | REQ-BINDER-06 | End-to-end visual check | Offer a Foil variant in binder manage page; visit public binder URL; confirm badge appears on the tile |
| Public binder shows NO badge on Normal offering tiles | REQ-BINDER-06 | End-to-end visual check | Offer a Normal variant; confirm no badge on public binder tile |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
