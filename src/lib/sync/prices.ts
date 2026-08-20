import { db } from '@/db';
import { cardDefinitions } from '@/db/schema';
import { inArray, sql, type SQL } from 'drizzle-orm';
import { chunk, SYNC_CHUNK_SIZE } from './chunk';
import { getNonTokenSets, type SWUSet } from './set-list';

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

export interface PriceSyncOptions {
  /** Caller-supplied non-token set list. When absent, fetched via getNonTokenSets(). */
  sets?: SWUSet[];
  /** Absolute epoch-milliseconds instant. When absent, the run is unbounded. */
  deadlineAt?: number;
}

export interface PriceSyncResult {
  setsTotal: number;
  setsProcessed: number; // successfully processed sets (fetch + writes did not throw)
  totalUpdated: number;
  failedSets: string[]; // setIds whose fetch or write threw (D-07: run continues)
  unprocessedSets: string[]; // setIds never attempted because the deadline hit (D-08)
  deadlineHit: boolean;
  sets: Array<{ setCode: string; updated: number }>;
}

interface PriceUpdateRow {
  swudbId: string;
  priceEur: number | null;
  priceUsd: number | null;
}

/**
 * Builds a Drizzle CASE WHEN SQL fragment for a batched multi-row UPDATE
 * (D-11) — the officially documented pattern for "update N rows, each with
 * different values, in one round trip." Every swu-db-derived value
 * (`swudbId`, the price value) is interpolated through the `sql` template so
 * Drizzle binds it as a parameter; `sql.raw()` is used only for the fixed
 * `case`/`end` keywords and the `sql.join` separator, never for API data —
 * Postgres infers each branch's type from the target column, avoiding the
 * explicit-cast pitfalls a hand-rolled VALUES list would need for the
 * nullable priceEur/priceUsd columns.
 */
export function buildCaseUpdate(rows: PriceUpdateRow[], valueKey: 'priceEur' | 'priceUsd'): SQL {
  const fragments: SQL[] = [sql`(case`];
  for (const row of rows) {
    fragments.push(sql`when ${cardDefinitions.swudbId} = ${row.swudbId} then ${row[valueKey]}`);
  }
  fragments.push(sql`end)`);
  return sql.join(fragments, sql.raw(' '));
}

/**
 * Orchestrates price synchronization for all non-token sets using swu-db.com.
 * Set list mirrors syncAllCards() — derived from getNonTokenSets() (D-10) unless
 * a caller supplies one directly.
 */
export async function syncPrices(options: PriceSyncOptions = {}): Promise<PriceSyncResult> {
  const nonTokenSets = options.sets ?? (await getNonTokenSets());

  let totalUpdated = 0;
  let setsProcessed = 0;
  const failedSets: string[] = [];
  const unprocessedSets: string[] = [];
  let deadlineHit = false;
  const setSummaries: Array<{ setCode: string; updated: number }> = [];

  console.log('Starting price synchronization via swu-db.com...');

  for (let i = 0; i < nonTokenSets.length; i++) {
    const set = nonTokenSets[i];
    const setCode = set.setId;

    // D-08: soft deadline, checked once per set boundary — never interrupts a
    // set already in progress. Reports and stops; does not persist a resume
    // cursor (that is SYNC-05, deferred).
    if (options.deadlineAt !== undefined && Date.now() >= options.deadlineAt) {
      deadlineHit = true;
      for (let j = i; j < nonTokenSets.length; j++) {
        unprocessedSets.push(nonTokenSets[j].setId);
      }
      break;
    }

    try {
      const cards = await fetchSetPrices(setCode);

      // Collect Normal-variant rows in memory first (to avoid inflating
      // prices from foils/showcases), mapping through the unchanged
      // mapPriceData(). De-duplicate by swudbId, last-write-wins, so a
      // duplicated upstream row cannot produce two conflicting CASE
      // branches for the same key.
      const rowsBySwudbId = new Map<string, PriceUpdateRow>();
      for (const card of cards) {
        if (card.VariantType !== 'Normal') continue;
        const { priceEur, priceUsd } = mapPriceData(card);
        const swudbId = `${card.Set}-${card.Number}`;
        rowsBySwudbId.set(swudbId, { swudbId, priceEur, priceUsd });
      }
      const rows = Array.from(rowsBySwudbId.values());

      let setUpdated = 0;
      for (const priceChunk of chunk(rows, SYNC_CHUNK_SIZE)) {
        if (priceChunk.length === 0) continue;
        const returned = await db
          .update(cardDefinitions)
          .set({
            priceEur: buildCaseUpdate(priceChunk, 'priceEur'),
            priceUsd: buildCaseUpdate(priceChunk, 'priceUsd'),
            pricesUpdatedAt: sql`now()`,
          })
          .where(inArray(cardDefinitions.swudbId, priceChunk.map((r) => r.swudbId)))
          .returning({ id: cardDefinitions.id });
        setUpdated += returned.length;
      }

      console.log(`Updated ${setUpdated} prices for set ${setCode}`);
      totalUpdated += setUpdated;
      setSummaries.push({ setCode, updated: setUpdated });
      setsProcessed++;
    } catch (error) {
      console.error(`Error syncing prices for set ${setCode}:`, error);
      failedSets.push(setCode);
    }
  }

  console.log(`Price sync complete. Total cards updated: ${totalUpdated}`);

  return {
    setsTotal: nonTokenSets.length,
    setsProcessed,
    totalUpdated,
    failedSets,
    unprocessedSets,
    deadlineHit,
    sets: setSummaries,
  };
}
