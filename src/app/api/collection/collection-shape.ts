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
  const map: CollectionMap = {};

  for (const row of rows) {
    if (!map[row.cardDefinitionId]) {
      map[row.cardDefinitionId] = { total: row.total, variants: {} };
    }
    if (row.cardPrintingId !== null && row.variantCount !== null) {
      map[row.cardDefinitionId].variants[row.cardPrintingId] = row.variantCount;
    }
  }

  return map;
}
