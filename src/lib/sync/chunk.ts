// SYNC-01: shared chunking helper for batched multi-row upserts.
//
// 500 is the researched chunk size: 500 rows x 17 columns (card_definitions) = 8,500
// bind parameters, 500 x 9 columns (card_printings) = 4,500 — both far under Postgres's
// 65,535 bind-parameter ceiling per statement, and comfortably above the measured
// per-set averages (~79 definitions, ~254 printings), so most sets fit in a single chunk.
export const SYNC_CHUNK_SIZE = 500;

/**
 * Splits an array into consecutive chunks of at most `size` items.
 * Returns `[]` for an empty input (never an array containing an empty array).
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
