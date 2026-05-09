# Phase 07 Plan 01: Database Schema and API Client Summary

Implemented the database schema updates to support market pricing and developed the PokéWallet API client infrastructure. Verified the price mapping logic against the expected API response format.

## Key Changes

### Database
- Added `price_eur` (integer, cents), `price_usd` (integer, cents), and `prices_updated_at` (timestamp) to the `card_definitions` table in `src/db/schema.ts`.
- Generated and applied migrations to the database.

### API Integration
- Created `src/lib/sync/prices.ts` with `fetchSetPrices` and `mapPriceData` functions.
- `mapPriceData` correctly converts decimal prices from Cardmarket (EUR) and TCGPlayer (USD) into integer cents.
- Documented `POKEMON_API_KEY` in `.env.example`.

### Verification
- Created `scripts/test-api-prices.ts` to test connectivity and mapping.
- **Mapping Verified**: Confirmed `mapPriceData` correctly handles the nested API structure and rounds to cents.
- **Connectivity Note**: The provided `POKEMON_API_KEY` in `.env.local` was rejected by `api.pokewallet.io` with an "Invalid API key format" error. This key appears to be a RapidAPI key, while the client currently targets the native PokéWallet endpoint.

## Deviations from Plan

### Auto-fixed Issues

None - plan followed as written.

### Observed Issues / Blockers

**1. [Rule 3 - Blocking] Invalid API Key Format**
- **Found during**: Task 3 (API Verification)
- **Issue**: The `POKEMON_API_KEY` provided in the environment is likely a RapidAPI key (50 chars), but the implemented client targets `https://api.pokewallet.io` which expects a native key format.
- **Impact**: Live price synchronization will fail until a valid native key is provided or the client is updated to support RapidAPI headers/endpoints.
- **Action**: Verified mapping logic using mock data in the test script to ensure implementation readiness.

## Decisions Made
- **Pricing Storage**: Prices are stored as integers (cents) to avoid floating-point issues and align with existing numeric field patterns in the database.
- **Variant Prioritization**: Mapping specifically targets "Normal" variants as the baseline for card definition pricing.

## Tech Stack
- **Database**: Drizzle ORM / PostgreSQL
- **API**: Fetch API with TypeScript interfaces for PokéWallet responses
- **Tooling**: `tsx` for script execution

## Key Files
- `src/db/schema.ts`
- `src/lib/sync/prices.ts`
- `scripts/test-api-prices.ts` (Verification script)
- `drizzle/0002_lumpy_silverclaw.sql` (Migration)

## Self-Check: PASSED
- [x] Database columns exist: `price_eur`, `price_usd`, `prices_updated_at`.
- [x] API client implemented in `src/lib/sync/prices.ts`.
- [x] Mapping logic verified via script.
- [x] `.env.example` updated.
- [x] Task commits exist.

---
**Status**: Ready for Plan 02 (Sync Cron Job Implementation).
