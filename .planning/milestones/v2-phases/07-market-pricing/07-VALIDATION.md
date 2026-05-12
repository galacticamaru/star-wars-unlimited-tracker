# 07-VALIDATION.md: Market Pricing

## Dimension 1: Requirement Coverage

| Requirement | Description | Plans | Status |
|-------------|-------------|-------|--------|
| MARKET-01   | See card prices (EUR/USD) on detail pages | 07-03 | ? Covered |
| MARKET-02   | Deck builder total cost in EUR/USD | 07-04 | ? Covered |
| MARKET-03   | Want list estimated acquisition cost | 07-04 | ? Covered |
| MARKET-04   | Prices from DB cache, updated via cron | 07-01, 07-02 | ? Covered |

**Overall: ? PASS** - All requirements from ROADMAP.md have covering tasks.

## Dimension 2: Task Completeness

| Plan | Tasks | Files | Wave | Status |
|------|-------|-------|------|--------|
| 07-01 | 3 | 3 | 1 | ? Valid |
| 07-02 | 3 | 2 | 2 | ? Valid |
| 07-03 | 3 | 4 | 3 | ? Valid |
| 07-04 | 3 | 3 | 4 | ? Valid |

**Overall: ? PASS** - All tasks include <files>, <action>, <verify>, and <done>.

## Dimension 3: Dependency Correctness

- Graph: 01 (Foundation) -> 02 (Sync) -> 03 (UI Core) -> 04 (Calculations)
- Sequential waves 1-4.
- No cycles or forward references.

**Overall: ? PASS**

## Dimension 4: Key Links Planned

| Link | Type | Plan | Task | Status |
|------|------|------|------|--------|
| API -> DB | Pricing Data | 07-01 | 1 | ? Planned |
| Cron -> Sync | Automation | 07-02 | 2 | ? Planned |
| Context -> UI | State Mgmt | 07-03 | 1,2 | ? Planned |
| DB -> Decks | Pricing Calc | 07-04 | 1,2 | ? Planned |

**Overall: ? PASS**

## Dimension 5: Scope Sanity

- Total Plans: 4
- Total Tasks: 12 (3 per plan)
- Avg Files per Plan: 3
- Domain complexity: Market data integration (Moderate)

**Overall: ? PASS** - Plans are right-sized for context budget.

## Dimension 6: Verification Derivation

- Truths: User-observable (e.g., 'User can switch between EUR and USD currencies globally').
- Artifacts: Map to required functionality.
- Key Links: Cover critical wiring between layers.

**Overall: ? PASS**

## Dimension 7: Context Compliance (07-CONTEXT.md)

- **API Efficiency**: Plan 07-02 implements sequential set processing with a 2-second delay, ensuring < 10 requests/day (well under 100).
- **Schema**: Plan 07-01 implements priceEur and priceUsd as integers (cents) as decided.
- **Normal Variants**: Plan 07-01 Task 2 explicitly specifies mapping to 'Normal' variants.
- **Currency Toggle**: Plan 07-03 implements the toggle in TopBar via CurrencyContext.

**Overall: ? PASS**

## Dimension 8: Nyquist Compliance

| Task | Plan | Wave | Automated Command | Status |
|------|------|------|-------------------|--------|
| 07-01-T3 | 01 | 1 | tsx scripts/test-api-prices.ts | ? Valid |
| 07-02-T1 | 02 | 2 | tsx -e 'syncPrices()...' | ? Valid |

**Sampling: 100% of implementation tasks have automated verification.**
**Overall: ? PASS**

---

## Issues Found

### Warnings (should fix)

1. [Dimension 9] Calculation Specificity (Quantity Multiplication)
- **Plan**: 07-04
- **Task**: 2, 3
- **Description**: Tasks mention 'sum of prices' but do not explicitly specify the multiplication of card.quantity * card.price.
- **Fix**: Ensure implementation factors in card quantity for both Deck Total and Want List Shortfall.

2. [Dimension 8] Lack of Formal Unit Tests
- **Plan**: 07-01, 07-02
- **Description**: Verification relies on temporary scripts and grep. There are no plans to create permanent Vitest unit tests for the pricing mapping logic.
- **Fix**: Add a task to create src/lib/sync/prices.test.ts to verify API response mapping with mock data.

---

## Verification Summary

**Status: ? PASSED WITH WARNINGS**

The plans for Phase 07 are comprehensive and technically sound. They strictly adhere to the API usage constraints and storage decisions made in CONTEXT.md. The sequential rollout from infrastructure to UI calculations is logical and well-sized.

Run /gsd:execute-phase 07 to proceed.
