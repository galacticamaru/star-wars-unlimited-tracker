---
phase: 19
slug: variant-filter-enhancements
status: validated
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-21
audited: 2026-05-21
---

# Phase 19 — Validation Strategy

> Retroactive Nyquist audit — phase executed without VALIDATION.md; gaps filled 2026-05-21.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run src/lib/filter-cards.test.ts __tests__/variant-filter.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~250ms |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/filter-cards.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~1 second

---

## Per-Task Verification Map

| Task ID | Plan | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-gap1 | 01 | REQ-FILTER-01 | unit | `npx vitest run src/lib/filter-cards.test.ts` | ✅ | ✅ green |
| 19-01-gap2 | 01 | REQ-FILTER-01 | contract | `npx vitest run __tests__/variant-filter.test.ts` | ✅ | ✅ green |
| 19-01-ui | 01 | REQ-FILTER-01 | manual | browser | N/A | manual |
| 19-02-binder | 02 | REQ-BINDER-05 | manual | browser | N/A | manual |
| 19-02-badges | 02 | REQ-BINDER-06 | N/A | not implemented (schema gap) | N/A | deferred |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Automated Verification Results (2026-05-21)

```
Test Files  2 passed (2)
     Tests  25 passed (25)
  Duration  ~250ms
```

**`src/lib/filter-cards.test.ts`** — 21 tests total; 6 new variant filter cases added:
- `selectedVariants: []` passes all cards including those without variantType (empty = All)
- `['Foil']` passes only Foil cards; excludes Normal, Hyperspace etc.
- `['Foil', 'Hyperspace Foil']` passes both via OR logic
- Card with `variantType: undefined` is excluded when any filter is active (the `card.variantType &&` guard)
- `selectedVariants` ANDs correctly with `selectedTypes` across categories
- `null` is treated as no filter (all cards pass)

**`__tests__/variant-filter.test.ts`** — 4 contract tests:
- All 7 `VARIANT_OPTIONS` strings ('Normal', 'Foil', 'Hyperspace', 'Hyperspace Foil', 'Showcase', 'Prestige', 'Serialized') round-trip correctly through `filterCards`
- 'Foil' (Phase 19 addition) passes exact match
- 'Hyperspace Foil' (Phase 19 addition) passes exact match
- Empty selectedVariants shows all variants

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Catalog shows Foil/Hyperspace Foil in VariantFilter UI | REQ-FILTER-01 | React component rendering requires browser | Open /cards, expand Variant filter, confirm 'Foil' and 'Hyperspace Foil' appear |
| Selecting 'Foil' in catalog shows only Foil cards | REQ-FILTER-01 | nuqs URL state + filterCards integration requires running app | Select Foil in variant filter; confirm only Foil variant cards shown |
| Deck Builder Add Cards tab shows Foil/HF filter options | REQ-FILTER-01 | Browser interaction required | Open deck builder, Add Cards tab, expand Variant filter |
| Public Binder variant filter works | REQ-FILTER-01 | Browser + real binder data required | Open /binder/[username], select Foil, confirm filter applies |
| Binder manage page VariantFilter filters search results | REQ-BINDER-05 | Browser + authenticated session required | Go to /binder/manage, select Foil in variant filter, search for card — only Foil variants appear |

---

## Known Gaps

| Requirement | Status | Reason |
|-------------|--------|--------|
| REQ-BINDER-06 | Not implemented | Schema gap: `tradeQuantity` stored by `cardDefinitionId`, not per variant. Variant badges on trade binder offerings require a schema migration. Acknowledged during Phase 19 execution. |

---

## Validation Audit — 2026-05-21

| Metric | Count |
|--------|-------|
| Gaps found | 2 automatable, 5 manual-only, 1 N/A (schema gap) |
| Resolved (automated) | 2 |
| Resolved (manual documented) | 5 |
| Escalated (unimplementable) | 1 (REQ-BINDER-06) |

---

## Validation Sign-Off

- [x] All tasks have automated verify or manual-only documentation
- [x] 2 automated test suites passing (25/25 tests)
- [x] Manual-only items documented with test instructions
- [x] No watch-mode flags
- [x] Feedback latency < 1s
- [x] `nyquist_compliant: true` set in frontmatter
- [ ] REQ-BINDER-06 — deferred (schema constraint, not a test gap)

**Approval:** approved 2026-05-21 (retroactive audit)
