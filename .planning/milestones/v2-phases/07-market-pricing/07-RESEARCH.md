# Phase 7 Research: Market Pricing (pokemon-api.com / pokewallet.io)

## API Overview
- **Service Name**: PokéWallet (referred to as `pokemon-api.com` in context).
- **Base URL**: `https://api.pokewallet.io`
- **RapidAPI Host**: `pokemon-tcg-api.p.rapidapi.com`
- **Game ID for Star Wars: Unlimited**: `3`

## Endpoints
### 1. List Sets
`GET /sets?game_id=3`
- Used to map set names to codes (SOR, SHD, TWI) and numeric IDs if needed.

### 2. Get Set Prices
`GET /prices/{set_code}`
- Returns pricing for all cards and their variants in a specific set.
- **Example**: `GET /prices/SOR`

### 3. Single Card Details
`GET /cards/{card_id}`
- Returns detailed info and real-time prices for one card.

## Response Schema (Prices)
Prices are nested under `tcgplayer` and `cardmarket` objects.

```json
{
  "tcgplayer": {
    "url": "https://www.tcgplayer.com/product/...",
    "variants": {
      "Normal": {
        "current": { "market": 85.50, "low": 78.00, ... }
      },
      "Foil": { ... }
    }
  },
  "cardmarket": {
    "url": "https://www.cardmarket.com/en/...",
    "variants": {
      "normal": {
        "current": { "low": 68.00, "avg": 75.20, ... }
      }
    }
  }
}
```

### Field Mapping
| Metric | API Path | Note |
|--------|----------|------|
| **USD (Market)** | `tcgplayer.variants.Normal.current.market` | TCGPlayer Market Price |
| **EUR (Low)** | `cardmarket.variants.normal.current.low` | Cardmarket Lowest Near Mint equivalent |

## Handling Variants
The API returns multiple keys under `variants`:
- `Normal` / `normal`
- `Foil` / `foil`
- `Hyperspace`
- `Hyperspace Foil`
- `Showcase`

**Strategy**: As per `07-CONTEXT.md`, we will prioritize the `Normal` variant for base price tracking.

## Sync Strategy
1. **Cron Job**: Trigger daily.
2. **Iterate Sets**: Fetch active sets (SOR, SHD, TWI).
3. **Throttling**: 2-second delay between sets to stay within the 30 req/min limit.
4. **Update DB**: Upsert `priceEur`, `priceUsd`, and `pricesUpdatedAt` into `card_definitions` matching by `set_code` and `card_number`.

## Cards Not Found
- If a card is missing from the API, we keep the existing price (if within 24h) or set it to `null`/`0` and display `—` in the UI.

## Authentication
Header: `X-API-Key`
Env Var: `POKEMON_API_KEY`
