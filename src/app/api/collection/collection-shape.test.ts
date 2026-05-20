import { describe, it, expect } from 'vitest';
import { buildCollectionMap, type CollectionRow } from './collection-shape';

describe('buildCollectionMap', () => {
  it('returns empty map for empty rows', () => {
    expect(buildCollectionMap([])).toEqual({});
  });

  it('builds total and variants map for a card with two printings', () => {
    const rows: CollectionRow[] = [
      { cardDefinitionId: 1, total: 3, cardPrintingId: 10, variantCount: 2 },
      { cardDefinitionId: 1, total: 3, cardPrintingId: 11, variantCount: 1 },
    ];
    expect(buildCollectionMap(rows)).toEqual({
      1: { total: 3, variants: { 10: 2, 11: 1 } },
    });
  });

  it('handles card with null printingId (legacy total-only row)', () => {
    const rows: CollectionRow[] = [
      { cardDefinitionId: 2, total: 5, cardPrintingId: null, variantCount: null },
    ];
    const result = buildCollectionMap(rows);
    expect(result[2].total).toBe(5);
    expect(result[2].variants).toEqual({});
  });

  it('handles multiple cards', () => {
    const rows: CollectionRow[] = [
      { cardDefinitionId: 1, total: 2, cardPrintingId: 10, variantCount: 2 },
      { cardDefinitionId: 2, total: 4, cardPrintingId: 20, variantCount: 4 },
    ];
    const result = buildCollectionMap(rows);
    expect(result[1].total).toBe(2);
    expect(result[2].total).toBe(4);
  });
});
