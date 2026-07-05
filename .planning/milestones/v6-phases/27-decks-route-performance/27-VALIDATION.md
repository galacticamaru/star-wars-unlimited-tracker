---
phase: 27
slug: decks-route-performance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-02
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/db/queries/decks.test.ts __tests__/api-deck-revalidate.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 27-W0-01 | Wave 0 | 0 | PERF-07 | — | N/A | unit (source inspection) | `npx vitest run src/db/queries/decks.test.ts` | ❌ W0 | ⬜ pending |
| 27-W0-02 | Wave 0 | 0 | PERF-07 | T-cross-user-cache | `userId` in all cache tags; ownership clause preserved | unit (mock) | `npx vitest run __tests__/api-deck-revalidate.test.ts` | ❌ W0 | ⬜ pending |
| 27-W0-03 | Wave 0 | 0 | PERF-08 | — | N/A | unit (source inspection) | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ W0 | ⬜ pending |
| 27-01-01 | 01 | 1 | PERF-07 | T-cross-user-cache | `userId` interpolated into cacheTag; ownership clause present | unit | `npx vitest run src/db/queries/decks.test.ts` | ❌ W0 | ⬜ pending |
| 27-01-02 | 01 | 1 | PERF-07 | — | revalidateTag called with 'max' after each mutation | unit (mock) | `npx vitest run __tests__/api-deck-revalidate.test.ts` | ❌ W0 | ⬜ pending |
| 27-01-03 | 01 | 1 | PERF-07 | — | router.refresh() called after delete success | unit (jsdom, mock) | `npx vitest run src/app/decks/page.test.tsx` | ✅ (needs update) | ⬜ pending |
| 27-02-01 | 02 | 1 | PERF-08 | — | N/A | unit (source inspection) | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ W0 | ⬜ pending |
| 27-03-01 | 03 | 2 | PERF-09 | — | N/A (human checkpoint for SI review) | manual | — | — | ⬜ pending |
| 27-03-02 | 03 | 2 | PERF-09 | — | loading.tsx skeleton renders correctly | unit (jsdom) | `npx vitest run src/app/decks/[id]/loading.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/db/queries/decks.test.ts` — source inspection stubs for PERF-07 (`'use cache'` + `cacheTag` presence in `getDecks` and `getDeckWithCards`)
- [ ] `__tests__/api-deck-revalidate.test.ts` — mock-based stubs for PERF-07 (`revalidateTag` called with correct tags and `'max'` profile in POST/PATCH/DELETE handlers)
- [ ] `src/components/decks/deck-builder.test.tsx` — source inspection or smoke-render stubs for PERF-08 (`startTransition` wraps dispatch calls in `handleDeckUpdate`)
- [ ] Update `src/app/decks/page.test.tsx` — add `refresh: vi.fn()` to the `mockRouter` object so router.refresh() assertions work

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vercel Speed Insights /decks FCP/LCP/INP review | PERF-09 | Requires human login to Vercel dashboard after deploy | After deploying PERF-07 + PERF-08, navigate to Vercel project → Speed Insights → filter to /decks route; review FCP, LCP, INP data; provide specific regression findings before targeted fixes are applied |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
