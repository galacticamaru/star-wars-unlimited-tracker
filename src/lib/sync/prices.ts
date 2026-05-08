import { db } from '@/db';
import { cardDefinitions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const POKEMON_API_KEY = process.env.POKEMON_API_KEY;
const API_BASE_URL = 'https://api.pokewallet.io';

export interface PriceData {
  tcgplayer?: {
    variants?: {
      Normal?: {
        current?: {
          market?: number;
        };
      };
    };
  };
  cardmarket?: {
    variants?: {
      normal?: {
        current?: {
          low?: number;
        };
      };
    };
  };
}

export interface SetPricesResponse {
  [collectorNumber: string]: PriceData;
}

/**
 * Fetches prices for all cards in a given set from PokéWallet API.
 * Uses POKEMON_API_KEY from environment variables.
 * Supports both native PokéWallet and RapidAPI endpoints.
 */
export async function fetchSetPrices(setCode: string): Promise<SetPricesResponse> {
  if (!POKEMON_API_KEY) {
    throw new Error('POKEMON_API_KEY is not set in environment variables');
  }

  const isRapidApi = POKEMON_API_KEY.length === 50;
  const baseUrl = isRapidApi 
    ? 'https://pokemon-tcg-api.p.rapidapi.com' 
    : API_BASE_URL;

  const headers: Record<string, string> = isRapidApi 
    ? {
        'x-rapidapi-key': POKEMON_API_KEY,
        'x-rapidapi-host': 'pokemon-tcg-api.p.rapidapi.com',
      }
    : {
        'X-API-Key': POKEMON_API_KEY,
      };

  console.log(`Fetching prices for set: ${setCode} (${isRapidApi ? 'RapidAPI' : 'Native'})...`);

  const response = await fetch(`${baseUrl}/prices/${setCode}?game_id=3`, {
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch prices for ${setCode}: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: SetPricesResponse = await response.json();
  return data;
}

/**
 * Maps the raw API price data to our internal format (cents as integers).
 */
export function mapPriceData(data: PriceData) {
  const priceEur = data.cardmarket?.variants?.normal?.current?.low 
    ? Math.round(data.cardmarket.variants.normal.current.low * 100) 
    : null;
    
  const priceUsd = data.tcgplayer?.variants?.Normal?.current?.market 
    ? Math.round(data.tcgplayer.variants.Normal.current.market * 100) 
    : null;

  return { priceEur, priceUsd };
}

/**
 * Orchestrates price synchronization for all active sets.
 * Respects rate limits by throttling between sets.
 */
export async function syncPrices() {
  const activeSets = ['SOR', 'SHD', 'TWI'];
  let totalUpdated = 0;
  const setSummaries = [];

  console.log('Starting price synchronization...');

  for (const setCode of activeSets) {
    try {
      const prices = await fetchSetPrices(setCode);
      let setUpdated = 0;

      // Update cards sequentially to avoid overwhelming the DB
      // and ensure consistent pricesUpdatedAt timestamps per set
      const now = new Date();

      for (const [collectorNumber, priceData] of Object.entries(prices)) {
        const { priceEur, priceUsd } = mapPriceData(priceData);
        
        // Collector number from API might be "059", swudbId is "SOR-059"
        const swudbId = `${setCode}-${collectorNumber}`;

        const result = await db.update(cardDefinitions)
          .set({
            priceEur,
            priceUsd,
            pricesUpdatedAt: now,
          })
          .where(eq(cardDefinitions.swudbId, swudbId))
          .returning({ id: cardDefinitions.id });

        if (result.length > 0) {
          setUpdated++;
        }
      }

      console.log(`Updated ${setUpdated} prices for set ${setCode}`);
      totalUpdated += setUpdated;
      setSummaries.push({ setCode, updated: setUpdated });

      // Throttle: wait 2 seconds before next set to respect API rate limits
      if (setCode !== activeSets[activeSets.length - 1]) {
        console.log('Waiting 2s for rate limit...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error syncing prices for set ${setCode}:`, error);
    }
  }

  console.log(`Price sync complete. Total cards updated: ${totalUpdated}`);

  return {
    totalUpdated,
    sets: setSummaries,
  };
}
