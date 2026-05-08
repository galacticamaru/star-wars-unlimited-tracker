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
 */
export async function fetchSetPrices(setCode: string): Promise<SetPricesResponse> {
  if (!POKEMON_API_KEY) {
    throw new Error('POKEMON_API_KEY is not set in environment variables');
  }

  console.log(`Fetching prices for set: ${setCode}...`);

  const response = await fetch(`${API_BASE_URL}/prices/${setCode}`, {
    headers: {
      'X-API-Key': POKEMON_API_KEY,
    },
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
