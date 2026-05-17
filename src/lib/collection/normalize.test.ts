/**
 * Tests for the updated normalizeRedditCsv function (Phase 17).
 *
 * collectorNumber suffix conventions (verified from live card_printings table, 2026-05-17):
 *
 * Queried: SELECT variant_type, COUNT(*), MIN(collector_number), MAX(collector_number)
 *          FROM card_printings WHERE set_code = 'SOR' GROUP BY variant_type
 *
 * Results (SOR set):
 * - Normal:         SOR-001 to SOR-252  (no suffix — base padded number)
 * - Foil:           SOR-019F to SOR-252F  (F suffix appended to base number)
 * - Hyperspace:     SOR-269 to SOR-510   (COMPLETELY DIFFERENT number range — no suffix relationship to base)
 * - Hyperspace Foil:SOR-285F to SOR-510F (Hyperspace range number + F suffix)
 * - Showcase:       SOR-253 to SOR-268   (distinct range, no suffix)
 *
 * IMPORTANT: The assumption in RESEARCH.md (A1) that Hyperspace uses an "H" suffix is WRONG.
 * Hyperspace variants have entirely different collector numbers in the DB.
 * For example, "2-1B Surgical Droid":
 *   Normal:         SOR-059
 *   Foil:           SOR-059F
 *   Hyperspace:     SOR-324  (NOT SOR-059H)
 *   Hyperspace Foil:SOR-324F
 *
 * Implication for Phase 17 normalizer (Plan 06):
 * The updated normalizeRedditCsv cannot compute Hyperspace/Showcase collectorNumbers from the
 * base card number alone using a simple suffix. Instead, the import route must look up
 * cardPrintingId by (setCode + variantType + cardDefinitionId), or the normalizer must return
 * per-variant counts keyed by variantType (not collectorNumber) for non-suffix variants.
 * Plan 06 must resolve this — these tests define the expected output contract.
 *
 * For Normal and Foil variants, the collectorNumber CAN be constructed:
 *   Normal:  `${setCode}-${num.padStart(3, '0')}`
 *   Foil:    `${setCode}-${num.padStart(3, '0')}F`
 * For Hyperspace and Hyperspace Foil, the normalizer must emit a variant-type key
 * so the import route can look up the actual collectorNumber via variantType join.
 */
import { describe, it, expect } from 'vitest';
import { normalizeRedditCsv } from './normalize';

describe('normalizeRedditCsv (Phase 17 — per-variant)', () => {
  const setCode = 'SOR';

  it('emits separate collectorNumber keys for each non-zero variant column', () => {
    const rows = [
      { 'Card #': '59', 'Card Name': 'Test Card', 'Standard': '2', 'Foil': '1', 'Hyperspace': '0', 'F-Hyperspace': '0' },
    ];
    const result = normalizeRedditCsv(rows, setCode);

    // Normal variant — base collectorNumber with no suffix
    expect(result['SOR-059']).toBe(2);

    // Foil variant — base collectorNumber + F suffix
    expect(result['SOR-059F']).toBe(1);

    // Hyperspace count is 0, should not appear
    expect(Object.keys(result)).toHaveLength(2);
  });

  it('skips variant columns with count 0', () => {
    const rows = [
      { 'Card #': '1', 'Card Name': 'Darth Vader', 'Standard': '0', 'Foil': '0', 'Hyperspace': '0', 'F-Hyperspace': '0' },
    ];
    const result = normalizeRedditCsv(rows, setCode);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('handles Non-Foil column as alias for Standard', () => {
    const rows = [
      { 'Card #': '2', 'Card Name': 'Test', 'Non-Foil': '3', 'Foil': '0', 'Hyperspace': '0', 'F-Hyperspace': '0' },
    ];
    const result = normalizeRedditCsv(rows, setCode);
    expect(result['SOR-002']).toBe(3);
    expect(Object.keys(result)).toHaveLength(1);
  });

  it('floors counts at 0 — does not emit negative counts', () => {
    const rows = [
      { 'Card #': '3', 'Card Name': 'Test', 'Standard': '-1', 'Foil': '0', 'Hyperspace': '0', 'F-Hyperspace': '0' },
    ];
    const result = normalizeRedditCsv(rows, setCode);
    // Negative count rows must not appear
    expect(Object.values(result).every(v => v >= 0)).toBe(true);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('emits per-variant entries for all non-zero columns including Foil', () => {
    const rows = [
      { 'Card #': '10', 'Card Name': 'Multi-Variant', 'Standard': '1', 'Foil': '2', 'Hyperspace': '0', 'F-Hyperspace': '0' },
    ];
    const result = normalizeRedditCsv(rows, setCode);
    // Normal variant
    expect(result['SOR-010']).toBe(1);
    // Foil variant
    expect(result['SOR-010F']).toBe(2);
  });
});
