---
phase: 23
slug: binder-variant-completeness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-25
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (`vitest.config.mts`) |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

**Build gate (secondary):** `npm run build` — catches TypeScript type errors in modified files. Run per-wave.

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green + manual smoke test of all three binder surfaces
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 23-W0-migration | — | 0 | BINDER-07 | T-IDOR | Migration SQL runs; `card_printing_id` column exists on `trade_manual_wants` | build | `npm run db:migrate && npm run build` | ❌ W0 | ⬜ pending |
| 23-07-badge | BINDER-07 | 1 | BINDER-07 | — | N/A | unit | `npm test -- card-item` | ✅ | ⬜ pending |
| 23-07-query | BINDER-07 | 1 | BINDER-07 | — | N/A | build | `npm run build` | ✅ | ⬜ pending |
| 23-08-query | BINDER-08 | 1 | BINDER-08 | T-DataLeak | `tradeQuantity` only returned when `userId` present (sql`FALSE` guard) | build | `npm run build` | ✅ | ⬜ pending |
| 23-08-component | BINDER-08 | 1 | BINDER-08 | — | N/A | unit | `npm test -- variant-trade` | ❌ W0 | ⬜ pending |
| 23-09-query | BINDER-09 | 1 | BINDER-09 | — | N/A | build | `npm run build` | ❌ W0 | ⬜ pending |
| 23-09-sheet | BINDER-09 | 1 | BINDER-09 | — | N/A | unit | `npm test -- variant-trade-sheet` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `drizzle/0005_binder_variant_completeness.sql` — hand-written SQL migration (PK swap on `trade_manual_wants`)
- [ ] Migration must complete successfully (`npm run db:migrate`) before any code referencing `card_printing_id` on `trade_manual_wants` is deployed

*Existing test infrastructure (vitest) covers all other requirements — no new test scaffolding needed in Wave 0.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Looking For tiles show variant badge for non-Normal printings | BINDER-07 | DOM rendering; no test covers CardGrid/binder page end-to-end | Visit `/binder/{username}` — Looking For section — verify badge appears on non-Normal tiles |
| Auto-want tiles show no variant badge (Normal default) | BINDER-07 | Same page, different tile type | Same page — auto-want tiles should have no badge |
| Card Detail shows "Available for Trade" section for auth'd user | BINDER-08 | RSC + auth interaction | Log in, navigate to any card detail page, verify section appears below VariantCollectionSection |
| Trade quantity update reflects immediately on Card Detail | BINDER-08 | Client-side optimistic update | +/- control on row, verify count updates without page reload |
| Manage Binder "Add Cards" shows only owned cards | BINDER-09 | Client fetch + filter | Visit `/binder/manage`, browse grid shows only owned card art |
| Clicking tile opens Sheet with per-printing trade controls | BINDER-09 | Sheet render | Click card tile on browse grid — Sheet opens with variant rows |
| Manual wants chip selector shows correct variants | BINDER-07 | Interactive search flow | In Manage Binder wants section, search a card, verify chip selector appears with correct variants |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
