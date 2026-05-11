---
milestone: v2
audited: 2026-05-11T00:00:00Z
status: gaps_found
scores:
  requirements: 15/19
  phases: 3/4
  integration: 9/11
  flows: 3/4
gaps:
  requirements:
    - id: "TRADE-05"
      status: "unsatisfied"
      phase: "Phase 10"
      claimed_by_plans: ["10-01-PLAN.md", "10-04-PLAN.md"]
      completed_by_plans: []
      verification_status: "missing"
      evidence: "src/db/queries/binder.ts:93-104 queries deckCards with no isSideboard filter — sideboard cards are included in autoTargetMap, inflating 'Looking For' shortfalls. Contrast: src/lib/want-list.ts:19 correctly skips isSideboard rows. UAT test 8 passed but did not test with sideboard-containing decks."
    - id: "DOTD-01"
      status: "abandoned"
      phase: "Phase 8"
      claimed_by_plans: []
      completed_by_plans: []
      verification_status: "missing"
      evidence: "Phase 8 abandoned due to swustats.net API unreliability (404 on GetDeck.php, LoadDeck.php missing names). No code shipped. Feature deferred to v3 or indefinitely."
    - id: "DOTD-02"
      status: "abandoned"
      phase: "Phase 8"
      claimed_by_plans: []
      completed_by_plans: []
      verification_status: "missing"
      evidence: "Phase 8 abandoned — no code shipped."
    - id: "DOTD-03"
      status: "abandoned"
      phase: "Phase 8"
      claimed_by_plans: []
      completed_by_plans: []
      verification_status: "missing"
      evidence: "Phase 8 abandoned — no code shipped."
    - id: "DOTD-04"
      status: "abandoned"
      phase: "Phase 8"
      claimed_by_plans: []
      completed_by_plans: []
      verification_status: "missing"
      evidence: "Phase 8 abandoned — no code shipped."
  integration:
    - item: "/binder/manage not in proxy middleware matcher"
      phase: "Phase 10 → Phase 6"
      evidence: "src/proxy.ts:8 — protectedRoutes and matcher only cover /collection/:path* and /decks/:path*. /binder/manage renders without server-side redirect for unauthenticated users. Client-side guard exists (if (!session) return <Unauthorized />) but is a UI-only check. API layer does enforce auth (401 on /api/binder, /api/trade routes), so data mutation is safe. Classified as UX gap, not data breach."
  flows: []
tech_debt:
  - phase: "07-market-pricing"
    items:
      - "PokéWallet API key mismatch — POKEMON_API_KEY in env is a RapidAPI key (50 chars) but client targets native api.pokewallet.io endpoint. Prices return 404 during sync. Prices stored in DB will be null until a valid key or endpoint reconfiguration is applied. Code is correct — config issue only."
      - "No permanent Vitest unit tests for pricing sync logic (src/lib/sync/prices.ts). Verification relied on manual scripts. src/lib/sync/prices.test.ts was added in Plan 07-04 but coverage is not confirmed for the mapping edge cases flagged in 07-VALIDATION.md."
  - phase: "09-Sideboard"
    items:
      - "Human visual verification still pending for 4 browser-UI checks (stacked bar rendering, disabled Move to SB at 10-card cap, legend display, atomic reducer state transition on quantity-1 move). All 12 must-haves verified via static analysis and tests."
  - phase: "10-trade-binder"
    items:
      - "No formal VERIFICATION.md created for Phase 10. Verification was performed via UAT.md (10/10 tests passed) and VALIDATION.md, but the standard verification artifact is absent."
---

# Milestone v2 Audit Report

**Milestone:** v2 Multi-User, Market, Decks & Trading
**Audited:** 2026-05-11
**Status:** ⚠ GAPS FOUND
**Score:** Requirements 15/19 shipped, 4 DOTD abandoned, 1 TRADE broken

---

## 1. Milestone Scope

**Phases included:** 6, 7, 8 (abandoned), 9, 10
**Milestone goal:** Expand from single-user personal tool to multi-user platform with card pricing, curated tournament decks, a public trade binder, and sideboard support.

| Phase | Name | Status | Plans | VERIFICATION.md |
|-------|------|--------|-------|-----------------|
| 6 | Auth & Multi-User | ✅ Complete | 4/4 | ✅ passed |
| 7 | Market Pricing | ✅ Complete | 4/4 | ❌ Missing |
| 8 | Deck of the Day | ❌ Abandoned | 0/4 | N/A |
| 9 | Sideboard | ✅ Complete | 3/3 | ⚠ human_needed |
| 10 | Trade Binder | ✅ Complete | 4/4 | ❌ Missing (UAT.md present) |

---

## 2. Requirements Coverage (3-Source Cross-Reference)

### Auth (Phase 6) — ALL SATISFIED

| REQ-ID | Description | VERIFICATION.md | SUMMARY frontmatter | REQUIREMENTS.md | Final Status |
|--------|-------------|-----------------|---------------------|-----------------|--------------|
| AUTH-01 | Register with email/password | passed | confirmed | [x] | **satisfied** |
| AUTH-02 | Log in with email/password | passed | confirmed | [x] | **satisfied** |
| AUTH-03 | Session persists across restarts | passed | confirmed | [x] | **satisfied** |
| AUTH-04 | User can log out | passed | confirmed | [x] | **satisfied** |
| AUTH-05 | Google OAuth login | passed | confirmed | [x] | **satisfied** |
| AUTH-06 | Discord OAuth login | passed | confirmed | [x] | **satisfied** |
| AUTH-07 | v1 data migrated to first account | passed | confirmed | [x] | **satisfied** |

### Market Pricing (Phase 7) — SATISFIED (with known config gap)

No VERIFICATION.md exists for Phase 7. Coverage sourced from 4 SUMMARY.md files and 07-VALIDATION.md.

| REQ-ID | Description | VERIFICATION.md | SUMMARY frontmatter | REQUIREMENTS.md | Final Status |
|--------|-------------|-----------------|---------------------|-----------------|--------------|
| MARKET-01 | Card price (EUR/USD) on detail page | missing | confirmed (07-03) | [x] | **satisfied** ¹ |
| MARKET-02 | Total deck cost in deck builder | missing | confirmed (07-04) | [x] | **satisfied** ¹ |
| MARKET-03 | Want list completion cost | missing | confirmed (07-04) | [x] | **satisfied** ¹ |
| MARKET-04 | Prices cached, refreshed daily | missing | confirmed (07-01, 07-02) | [x] | **satisfied** ¹ |

¹ _Code correctly implemented. Known issue: PokéWallet API key is a RapidAPI key targeting wrong endpoint — live price sync returns 404. Prices in DB will be null until config is corrected. Classified as tech debt, not a requirement gap._

### Deck of the Day (Phase 8) — ABANDONED

| REQ-ID | Description | Status | Notes |
|--------|-------------|--------|-------|
| DOTD-01 | View Deck of the Day | **abandoned** | Phase 8 scrapped — swustats.net API unreliable |
| DOTD-02 | Owned-card overlay on DOTD | **abandoned** | Phase 8 scrapped |
| DOTD-03 | Copy DOTD to library | **abandoned** | Phase 8 scrapped |
| DOTD-04 | Daily auto-fetch via cron | **abandoned** | Phase 8 scrapped |

These requirements are formally abandoned for v2. Recommend moving to Out of Scope or v3 backlog in PROJECT.md.

### Sideboard (Phase 9) — ALL SATISFIED

| REQ-ID | Description | VERIFICATION.md | SUMMARY frontmatter | REQUIREMENTS.md | Final Status |
|--------|-------------|-----------------|---------------------|-----------------|--------------|
| SIDE-01 | Mark cards as sideboard | human_needed | [SIDE-01, SIDE-02] (09-02) | [ ] ² | **satisfied** |
| SIDE-02 | Sideboard capped at 10 cards | human_needed | [SIDE-02, SIDE-03] (09-01) | [ ] ² | **satisfied** |
| SIDE-03 | Cost curve with distinct color | human_needed | [SIDE-03, SIDE-04] (09-03) | [ ] ² | **satisfied** |
| SIDE-04 | Sideboard section separate from main | human_needed | [SIDE-03, SIDE-04] (09-03) | [ ] ² | **satisfied** |

² _REQUIREMENTS.md traceability table is stale — shows "Pending" despite implementation being verified. Checkbox staleness only, not a code gap._

### Trade Binder (Phase 10) — 4/5 SATISFIED

| REQ-ID | Description | VERIFICATION.md | SUMMARY (UAT) | REQUIREMENTS.md | Final Status |
|--------|-------------|-----------------|---------------|-----------------|--------------|
| TRADE-01 | Add cards with trade quantity | missing | UAT#3 pass | [ ] ² | **satisfied** |
| TRADE-02 | Update or remove trade cards | missing | UAT#4 pass | [ ] ² | **satisfied** |
| TRADE-03 | Public binder at /binder/[username] | missing | UAT#7,#10 pass | [ ] ² | **satisfied** |
| TRADE-04 | Catalog-style filters on public binder | missing | UAT#9 pass | [ ] ² | **satisfied** |
| TRADE-05 | "Looking For" want section | missing | UAT#8 pass ³ | [ ] ² | **⚠ unsatisfied** |

³ _UAT#8 passed but test did not include decks with sideboard cards. binder.ts:93-104 includes sideboard cards in autoTargetMap — inflates "Looking For" shortfall. See BLOCKER below._

---

## 3. Cross-Phase Integration

### ✅ Wired Correctly (9/11)

| From | To | Via | Status |
|------|----|-----|--------|
| Phase 6 Auth | All API routes | `auth.api.getSession()` | WIRED — all 7 private routes enforce session |
| Phase 6 User table | Phase 10 username | `user.username` in Better Auth schema | WIRED — public binder query joins on username |
| Phase 6 Auth hooks | Phase 10 manage page | `authClient.useSession()` + `authClient.updateUser()` | WIRED |
| Phase 6 Migration hook | Phase 10 userId isolation | All queries use `Number(session.user.id)` | WIRED |
| Phase 7 CurrencyContext | Phase 9 deck sidebar | `useCurrency()` in `deck-sidebar.tsx` | WIRED — sideboard cards included in cost total |
| Phase 7 priceEur/priceUsd | Phase 10 want list | `want-list.ts:40-41` includes price fields | WIRED |
| Phase 9 isSideboard | want-list.ts | `want-list.ts:19` skips sideboard rows | WIRED |
| Phase 10 public binder | No auth required | `/binder/[username]` is plain Server Component, not in proxy matcher | WIRED |
| Phase 6 v1 migration | Phase 10 trade data | Trade queries use new userId from session | WIRED |

### ⚠ Gaps (2/11)

| Gap | Affected Requirements | Severity |
|-----|-----------------------|----------|
| `/binder/manage` not in `proxy.ts` matcher — client-side guard only | AUTH-02, TRADE-01, TRADE-02 (UX) | Tech debt — data safe via API auth |
| `binder.ts:93-104` includes sideboard cards in `autoTargetMap` — no `isSideboard` filter | TRADE-05 | **BLOCKER** — incorrect data displayed publicly |

---

## 4. E2E Flow Verification

| Flow | Steps | Status | Break Point |
|------|-------|--------|-------------|
| Auth + Collection | Register → login → view collection → add cards (isolated) | COMPLETE | — |
| Auth + Trade Binder | Login → set username → add to binder → public URL shows trade qty only | COMPLETE | — |
| Pricing + Deck Builder | Open deck → see EUR/USD total → switch currency → sideboard costs included | COMPLETE | — |
| Trade Binder + Want List | Public binder "Looking For" reflects deck shortfalls (sans sideboard) | **BROKEN** | `binder.ts:93-104` includes sideboard in shortfall — inflates quantities for users with sideboard-containing decks |

---

## 5. Nyquist Compliance

| Phase | VALIDATION.md | VERIFICATION.md | Compliant | Action |
|-------|---------------|-----------------|-----------|--------|
| 6 | ✅ exists | ✅ passed | COMPLIANT | — |
| 7 | ✅ exists | ❌ missing | PARTIAL | `/gsd-verify-work 7` or accept as tech debt |
| 8 | N/A (abandoned) | N/A | N/A | — |
| 9 | ❌ missing | ✅ human_needed | PARTIAL | `/gsd-validate-phase 9` to generate VALIDATION.md |
| 10 | ✅ exists | ❌ missing (UAT present) | PARTIAL | UAT.md 10/10 covers functional verification; formal VERIFICATION.md absent |

---

## 6. Tech Debt Summary

| Phase | Item | Severity |
|-------|------|----------|
| 7 | PokéWallet API key/endpoint mismatch — prices will be null until corrected | High — feature non-functional in production |
| 7 | No permanent Vitest tests for `src/lib/sync/prices.ts` mapping logic | Medium |
| 9 | 4 browser-UI checks pending human verification (stacked bars, disabled btn, legend, atomic reducer) | Low |
| 10 | No formal VERIFICATION.md (UAT.md substituted) | Low |
| 10 | `/binder/manage` not in proxy middleware matcher (client-side guard only) | Medium — UX inconsistency |

---

## 7. Audit Verdict

**Status: ⚠ GAPS FOUND**

### Critical Blockers

#### BLOCKER 1 — TRADE-05: Sideboard Cards Inflate "Looking For" List

**File:** `src/db/queries/binder.ts:93-104`

```typescript
const cardQuantities = await db
  .select({
    cardDefinitionId: deckCards.cardDefinitionId,
    quantity: deckCards.quantity,
  })
  .from(deckCards)
  .where(inArray(deckCards.deckId, deckIds));  // missing: and(not(deckCards.isSideboard))
```

Fix: add `.where(and(inArray(deckCards.deckId, deckIds), not(eq(deckCards.isSideboard, true))))` to mirror `want-list.ts:19`.

**Affected requirement:** TRADE-05

#### BLOCKER 2 — DOTD Requirements Abandoned

DOTD-01 through DOTD-04 were never implemented. Phase 8 was abandoned due to swustats.net API unreliability. These need to be formally moved to "Out of Scope / Deferred" in REQUIREMENTS.md and PROJECT.md rather than left as "Pending."

---

### Known Deferred Items

| Category | Item | Status |
|----------|------|--------|
| Pricing | PokéWallet API key config — prices are null until resolved | Operational (not code) |
| Deck of the Day | DOTD-01 through DOTD-04 | Abandoned / v3 backlog |
| Middleware | /binder/manage not in proxy.ts | Tech debt (data safe) |
| Testing | Phase 7 no VERIFICATION.md; Phase 10 no VERIFICATION.md | Nyquist gap |

---

*Audited: 2026-05-11*
*Auditor: Claude (gsd-audit-milestone)*
