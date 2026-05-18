/**
 * Normalizes rows from the Reddit community collection spreadsheet.
 *
 * Phase 17 update: Returns per-variant collectorNumber keys instead of a summed total.
 * Each variant column with a non-zero count emits its own entry keyed by the variant's
 * collectorNumber (as stored in card_printings.collector_number).
 *
 * collectorNumber suffix conventions (verified from live card_printings table — see normalize.test.ts header):
 * - Standard / Non-Foil: `{Set}-{NNN}`  (3-digit base number, no suffix — e.g. "SOR-059")
 * - Foil:                `{Set}-{NNN}F`  (F suffix appended to base number — e.g. "SOR-059F")
 * - Hyperspace:           DIFFERENT number range (SOR: 269-510) — NOT a suffix of the base number.
 *                         Cannot be constructed from the CSV "Card #" field alone.
 *                         Hyperspace and F-Hyperspace columns are SKIPPED by this normalizer.
 *                         These variants require a (cardDefinitionId, variantType) DB lookup which
 *                         is outside the scope of a pure CSV normalizer.
 *
 * Columns: Card #, Card Name, Standard (or Non-Foil), Foil, Hyperspace, F-Hyperspace
 * Some set tabs use "Standard" and others use "Non-Foil" for the first count column.
 */
export function normalizeRedditCsv(rows: any[], setCode: string): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const row of rows) {
    const rawNum = row['Card #']?.toString().trim();
    if (!rawNum || !setCode) continue;

    // Zero-pad card number to 3 digits (e.g. "1" -> "001")
    const num = rawNum.padStart(3, '0');
    const base = `${setCode}-${num}`;

    // Parse each variant column
    const standard = parseInt(row['Standard'] || '0', 10) || 0;
    const nonFoil = parseInt(row['Non-Foil'] || '0', 10) || 0;
    const foil = parseInt(row['Foil'] || '0', 10) || 0;

    // Standard or Non-Foil → base collectorNumber (no suffix)
    // Math.max floors negative input at 0 (T-17-06-02 threat mitigation)
    const normalCount = Math.max(0, standard + nonFoil);
    if (normalCount > 0) {
      counts[base] = (counts[base] || 0) + normalCount;
    }

    // Foil → base + "F" suffix (verified from live DB: SOR-059F, SOR-010F, etc.)
    // Math.max floors negative input at 0 (T-17-06-02 threat mitigation)
    const foilCount = Math.max(0, foil);
    if (foilCount > 0) {
      counts[`${base}F`] = (counts[`${base}F`] || 0) + foilCount;
    }

    // Hyperspace and F-Hyperspace columns are intentionally skipped.
    // Hyperspace variants use a completely different number range (SOR: 269-510),
    // NOT a suffix of the base number. Example: Normal=SOR-059, Hyperspace=SOR-324.
    // There is no derivable relationship from CSV "Card #" to Hyperspace collectorNumber.
    // Future work: emit a variantType key if import route gains a (cardDefinitionId, variantType) lookup.
  }

  return counts;
}
