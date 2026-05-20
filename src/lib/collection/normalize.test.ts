/**
 * Tests for the `normalizeRedditCsv` function, refactored to return an
 * array of `{ swudbId, variantType, count }` objects suitable for a batch
 * lookup API.
 */
import { describe, it, expect } from 'vitest';
import { normalizeRedditCsv } from './normalize';

describe('normalizeRedditCsv (array-based variant lookup)', () => {
  const setCode = 'SOR';

  it('returns an array of objects for each non-zero variant', () => {
    const rows = [{ 'Card #': '59', Standard: '2', Foil: '1', Hyperspace: '3', 'F-Hyperspace': '4' }];
    const result = normalizeRedditCsv(rows, setCode);

    expect(result).toEqual(
      expect.arrayContaining([
        { swudbId: 'SOR-059', variantType: 'Normal', count: 2 },
        { swudbId: 'SOR-059', variantType: 'Foil', count: 1 },
        { swudbId: 'SOR-059', variantType: 'Hyperspace', count: 3 },
        { swudbId: 'SOR-059', variantType: 'Hyperspace Foil', count: 4 },
      ])
    );
    expect(result).toHaveLength(4);
  });

  it('correctly maps "F-Hyperspace" column to "Hyperspace Foil" variantType', () => {
    const rows = [{ 'Card #': '1', 'F-Hyperspace': '5' }];
    const result = normalizeRedditCsv(rows, setCode);
    expect(result).toContainEqual({ swudbId: 'SOR-001', variantType: 'Hyperspace Foil', count: 5 });
  });

  it('skips variants with a count of 0', () => {
    const rows = [{ 'Card #': '10', Standard: '1', Foil: '0', Hyperspace: '0' }];
    const result = normalizeRedditCsv(rows, setCode);
    expect(result).toHaveLength(1);
    expect(result).toContainEqual({ swudbId: 'SOR-010', variantType: 'Normal', count: 1 });
  });

  it('handles "Non-Foil" as an alias for "Standard"', () => {
    const rows = [{ 'Card #': '2', 'Non-Foil': '3' }];
    const result = normalizeRedditCsv(rows, setCode);
    expect(result).toContainEqual({ swudbId: 'SOR-002', variantType: 'Normal', count: 3 });
  });

  it('aggregates counts for the same card variant across multiple rows', () => {
    const rows = [
      { 'Card #': '25', Standard: '1', Foil: '2' },
      { 'Card #': '25', Standard: '3', Foil: '4', Hyperspace: '1' },
    ];
    const result = normalizeRedditCsv(rows, setCode);

    expect(result).toHaveLength(3);
    expect(result).toContainEqual({ swudbId: 'SOR-025', variantType: 'Normal', count: 4 }); // 1 + 3
    expect(result).toContainEqual({ swudbId: 'SOR-025', variantType: 'Foil', count: 6 }); // 2 + 4
    expect(result).toContainEqual({ swudbId: 'SOR-025', variantType: 'Hyperspace', count: 1 });
  });

  it('returns an empty array if all counts are zero or negative', () => {
    const rows = [
      { 'Card #': '30', Standard: '0' },
      { 'Card #': '31', Standard: '-1', Foil: '0' },
    ];
    const result = normalizeRedditCsv(rows, setCode);
    expect(result).toHaveLength(0);
  });

  it('ignores rows with missing or invalid "Card #" field', () => {
    const rows = [
      { 'Card #': '40', Standard: '1' },
      { 'Card #': '', Standard: '2' },
      { 'Card #': null, Standard: '3' },
    ];
    const result = normalizeRedditCsv(rows, setCode);
    expect(result).toHaveLength(1);
    expect(result[0].swudbId).toBe('SOR-040');
  });
});
