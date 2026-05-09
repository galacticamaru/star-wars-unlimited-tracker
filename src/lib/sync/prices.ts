import { db } from '@/db';
import { cardDefinitions } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SWU_DB_API_URL = 'https://api.swu-db.com';

export interface SWUDBCard {
  Set: string;
  Number: string;
  Name: string;
  VariantType: string;
  MarketPrice?: string;
  LowPrice?: string;
  FoilPrice?: string;
}

/**
 * Fetches all cards for a set from swu-db.com
 */
export async function fetchSetPrices(setCode: string): Promise<SWUDBCard[]> {
  console.log(`Fetching prices for set: ${setCode} from swu-db.com...`);
  
  // Use the search endpoint to ensure we get the full list in the expected format
  const response = await fetch(`${SWU_DB_API_URL}/cards/search?q=set:${setCode.toLowerCase()}&format=json`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch prices for ${setCode}: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const json = await response.json();
  // SWU-DB search endpoint returns an array directly, whereas /cards/{set} returns { data: [] }
  return Array.isArray(json) ? json : (json.data || []);
}

/**
 * Maps the swu-db card data to our internal format (cents as integers).
 */
export function mapPriceData(card: SWUDBCard) {
  const marketPrice = card.MarketPrice ? parseFloat(card.MarketPrice) : null;
  
  if (marketPrice === null || isNaN(marketPrice)) {
    return { priceEur: null, priceUsd: null };
  }

  // SWU-DB prices are in USD. 
  // We'll map to USD directly and apply a fixed 0.92 conversion for EUR as a proxy 
  // since this API doesn't provide native EUR data.
  const priceUsd = Math.round(marketPrice * 100);
  const priceEur = Math.round(marketPrice * 0.92 * 100);

  return { priceEur, priceUsd };
}

/**
 * Orchestrates price synchronization for all active sets using swu-db.com.
 */
export async function syncPrices() {
  const activeSets = ['SOR', 'SHD', 'TWI', 'JTL', 'SEC', 'LAW', 'IBH'];
  let totalUpdated = 0;
  const setSummaries = [];

  console.log('Starting price synchronization via swu-db.com...');

  for (const setCode of activeSets) {
    try {
      const cards = await fetchSetPrices(setCode);
      let setUpdated = 0;
      const now = new Date();

      for (const card of cards) {
        // Only sync pricing for Normal variants to avoid inflation from foils/showcases
        if (card.VariantType !== 'Normal') continue;

        const { priceEur, priceUsd } = mapPriceData(card);
        const swudbId = `${card.Set}-${card.Number}`;

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

      // swu-db.com doesn't specify strict limits, but we'll keep a small 1s delay
      if (setCode !== activeSets[activeSets.length - 1]) {
        console.log('Waiting 1s for rate limit...');
        await new Promise(resolve => setTimeout(resolve, 1000));
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
