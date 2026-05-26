---
phase: 20
slug: csv-variant-imports
status: validated
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-21
audited: 2026-05-21
---

# Phase 20 — Validation Strategy

> Retroactive Nyquist audit — phase executed without VALIDATION.md; existing coverage documented 2026-05-21.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run src/lib/collection/normalize.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~250ms |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/collection/normalize.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~1 second

---

## Per-Task Verification Map

| Task ID | Plan | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-task1 | 01 | REQ-COLLECT-09 | unit | `npx vitest run src/lib/collection/normalize.test.ts` | ✅ | ✅ green |
| 20-01-task2-types | 01 | REQ-COLLECT-09 | type check | `npx tsc --noEmit` (route file: no errors) | ✅ | ✅ green |
| 20-01-task2-db | 01 | REQ-COLLECT-09 | manual | live Neon DB | N/A | manual |
| 20-01-e2e | 01 | REQ-COLLECT-09 | manual | browser + authenticated session | N/A | manual |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Automated Verification Results (2026-05-21)

```
Test Files  1 passed (1)
     Tests  7 passed (7)
  Duration  ~250ms
```

**`src/lib/collection/normalize.test.ts`** — 7 tests covering `normalizeRedditCsv` (array-based variant output):

1. Returns an array of objects for each non-zero variant (all 4 types: Normal, Foil, Hyperspace, Hyperspace Foil)
2. Correctly maps `'F-Hyperspace'` column to `'Hyperspace Foil'` variantType
3. Skips variants with a count of 0
4. Handles `'Non-Foil'` as an alias for `'Standard'` → maps to Normal
5. Aggregates duplicate rows (same swudbId + variantType) by summing counts
6. Returns empty array if all counts are zero or negative
7. Ignores rows with missing or invalid `'Card #'` field

**TypeScript (Task 2):** `src/app/api/collection/import/route.ts` compiles without errors. The route implements:
- Array payload validation (400 if not array, 400 if item malformed)
- 2000-item cap + 500-item chunked DB queries
- `Math.max(0, count)` floor (T-20-01-02 mitigation)
- Session auth gate (401 if unauthenticated, T-20-01-03 mitigation)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Import route correctly resolves printingId via swudbId+variantType DB join | REQ-COLLECT-09 | Drizzle ORM + Neon DB required; no viable mock | Upload a test CSV with Normal, Foil, Hyperspace, and F-Hyperspace columns; verify all variant counts are persisted in `user_printing_collections` |
| Hyperspace and F-Hyperspace counts appear on card detail page after import | REQ-COLLECT-09 | Browser + authenticated session + live DB required | After CSV upload, navigate to card detail page; confirm Hyperspace and Hyperspace Foil rows show the imported counts |
| Second import of same CSV accumulates counts (upsert behaviour) | REQ-COLLECT-09 | DB interaction required | Import same CSV twice; verify counts double, not reset |

---

## Validation Audit — 2026-05-21

| Metric | Count |
|--------|-------|
| Gaps found | 0 automatable (all already covered by existing tests), 3 manual-only |
| Resolved (automated) | 0 new (7 existing tests already covered Gap 1) |
| Resolved (manual documented) | 3 |
| Escalated | 0 |

---

## Validation Sign-Off

- [x] All tasks have automated verify or manual-only documentation
- [x] 1 automated test suite passing (7/7 tests) — covers normalizeRedditCsv fully
- [x] TypeScript clean for `src/app/api/collection/import/route.ts`
- [x] Manual-only items documented with test instructions
- [x] No watch-mode flags
- [x] Feedback latency < 1s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-21 (retroactive audit)
