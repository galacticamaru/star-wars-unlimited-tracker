# Phase 7 Context: Market Pricing

## Goal
Integrate real-world card pricing (EUR/USD) from `pokemon-api.com` into the card catalog, deck builder, and want list. Ensure the implementation is extremely conservative with API usage to stay within the 100 req/day free tier.

## Decisions

### 1. Data Storage & Accuracy
- **Pricing Strategy**: Focus on **Normal** variants only. The application will track and display the price of the standard printing for all calculations.
- **Schema**: Add `priceEur`, `priceUsd`, and `pricesUpdatedAt` columns to the `card_definitions` table.
  - `priceEur`: Cardmarket `lowest_near_mint` value.
  - `priceUsd`: TCGPlayer `market_price` value.
- **Variant Logic**: Since the current DB logic (Pass 2 of sync) may overwrite Normal cards with Hyperspace/Foil variants sharing the same collector number, we will treat the single entry for each card number as the "canonical" version for pricing.

### 2. API Integration Strategy (pokemon-api.com)
- **Extremely Conservative Sync**: 
  - Sync prices **ONLY once per day** via Vercel Cron.
  - **Fetch by Set (Expansion)**: Use `GET /episodes/{id}/cards` to fetch all cards for a set in a single request.
  - **Sequential Throttling**: Process sets one-by-one with a short delay (e.g., 2 seconds) to ensure we stay well under the 30 req/min limit.
  - **Daily Quota Management**: With ~4–5 active sets, we will use < 10 requests per day, leaving 90% of the quota for testing or emergency refreshes.
- **API Config**:
  - Key: `8e7cb0e5c3mshaedc77954464904p1e6402jsn08dac73763ab` (stored in `.env.local` as `POKEMON_API_KEY`).
  - Base URL: `https://pokemon-api.com/` (or the RapidAPI host provided in documentation).

### 3. Price Calculation Logic
- **Total Deck Cost**: Sum of `priceEur` / `priceUsd` for all cards in the deck (Main + Sideboard).
- **Estimated Want List Cost**: Sum of prices for "Missing" cards in the want list (Quantity Needed - Quantity Owned).
- **Condition Baseline**: Always target "Near Mint" (NM).

### 4. UI/UX Implementation
- **Currency Toggle**: Implement a client-side toggle (e.g., in the `TopBar` or a specialized `CurrencySettings` component) to switch between EUR and USD.
- **Card Detail Page**: Display the "Near Mint" price for both currencies in the metadata column.
- **Deck Builder**: Show "Total Cost" in the sidebar or summary section.
- **Want List**: Show "Estimated Cost to Complete" at the bottom of the missing cards list.

## Remaining Inquiries (Deferred to Planning)
- Exact `game_id` or set IDs for Star Wars: Unlimited in `pokemon-api.com`.
- Handling cards that might be missing from the pricing API (fallback to '—' or 0.00).

## Reusable Patterns
- **Cron Route**: Extend `src/app/api/cron/sync-cards/route.ts` to include `syncPrices`.
- **Query Pattern**: Update `src/db/queries/card-detail.ts` and `src/db/queries/decks.ts` to select price columns.
- **Component Pattern**: Use the `Badge` or a new `PriceTag` component for consistent pricing display.
