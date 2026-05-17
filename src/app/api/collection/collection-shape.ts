// src/app/api/collection/collection-shape.ts

export type CollectionMap = Record<number, { total: number; variants: Record<number, number> }>;

export interface CollectionRow {
  cardDefinitionId: number;
  total: number;
  cardPrintingId: number | null;
  variantCount: number | null;
}

/**
 * Converts flat DB rows (one row per printing, with total replicated)
 * into the GET /api/collection response shape.
 *
 * Input rows come from a LEFT JOIN of userCollections → user_printing_collections → card_printings.
 * A card with no variant rows appears as a single row with cardPrintingId=null, variantCount=null.
 */
export function buildCollectionMap(rows: CollectionRow[]): CollectionMap {
  // STUB — implement in Plan 02 (collection.ts query update)
  // Tests written against this stub will be RED until Plan 02 implements this
  throw new Error('Not implemented');
}
