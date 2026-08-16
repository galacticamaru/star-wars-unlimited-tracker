// SYNC-02 / D-10: single source of truth for "the sets we sync". Both
// syncAllCards() and (in 34-02) syncPrices() consume this — no other file
// should fetch https://api.swu-db.com/sets or re-implement the token-set filter.

export interface SWUSet {
  setId: string;
  fullName: string;
  numberCards: number;
}

/**
 * Canonical token-set predicate — verbatim from the pre-existing pre-filter.
 * A set is a "token set" when its id starts with "T", is longer than 3
 * characters, and does not match the TS## pattern — TS26 is a real playable
 * set whose id happens to start with "T" and must not be treated as a token set.
 */
export function isTokenSetId(setId: string): boolean {
  return setId.startsWith('T') && setId.length > 3 && !setId.match(/^TS\d{2}$/);
}

/**
 * Fetches every set from swu-db.com and returns only the non-token ones.
 * No fetch timeout, retry, or backoff — that is deferred resilience work,
 * not part of this phase.
 */
export async function getNonTokenSets(): Promise<SWUSet[]> {
  const setsResponse = await fetch('https://api.swu-db.com/sets');
  if (!setsResponse.ok) {
    throw new Error(`Failed to fetch sets: ${setsResponse.status}`);
  }
  const sets: SWUSet[] = await setsResponse.json();
  return sets.filter((s) => !isTokenSetId(s.setId));
}
