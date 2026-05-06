/**
 * Normalizes rows from the Reddit community collection spreadsheet.
 *
 * Format:
 * Columns: Card #, Card Name, Standard (or Non-Foil), Foil, Hyperspace, F-Hyperspace
 * Some set tabs use "Standard" and others use "Non-Foil" for the first count column.
 *
 * Returns a map of collectorNumber (Set-Number) to total count.
 */
export function normalizeRedditCsv(rows: any[], setCode: string) {
  const counts: Record<string, number> = {};

  for (const row of rows) {
    const rawNum = row['Card #']?.toString().trim();
    if (!rawNum || !setCode) continue;

    // Zero-pad card number to 3 digits (e.g. "1" -> "001")
    const num = rawNum.padStart(3, '0');

    // collectorNumber format matches src/lib/sync/upsert-cards.ts: Set-Number
    const collectorNumber = `${setCode}-${num}`;

    // Some tabs use "Standard", others use "Non-Foil" for the base non-foil count
    const standard = parseInt(row['Standard'] || '0', 10) || 0;
    const nonFoil = parseInt(row['Non-Foil'] || '0', 10) || 0;
    const foil = parseInt(row['Foil'] || '0', 10) || 0;
    const hyperspace = parseInt(row['Hyperspace'] || '0', 10) || 0;
    const fHyperspace = parseInt(row['F-Hyperspace'] || '0', 10) || 0;

    const total = standard + nonFoil + foil + hyperspace + fHyperspace;
    if (total > 0) {
      counts[collectorNumber] = (counts[collectorNumber] || 0) + total;
    }
  }

  return counts;
}
