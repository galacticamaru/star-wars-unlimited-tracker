/**
 * Normalizes rows from the Reddit community collection spreadsheet.
 *
 * Returns an array of unique card variants with their aggregated counts.
 * This format is designed for a batch API that can look up card printings
 * by `swudbId` and `variantType`.
 *
 * Columns: Card #, Card Name, Standard (or Non-Foil), Foil, Hyperspace, F-Hyperspace
 * Some set tabs use "Standard" and others use "Non-Foil" for the first count column.
 */
export function normalizeRedditCsv(
  rows: any[],
  setCode: string
): Array<{ swudbId: string; variantType: string; count: number }> {
  // Aggregate by `swudbId|variantType` to prevent duplicate upserts if the
  // CSV has multiple rows for the same card (e.g. from different sets or tabs).
  const aggregated: Record<string, number> = {};

  for (const row of rows) {
    const rawNum = row['Card #']?.toString().trim();
    if (!rawNum || !setCode) continue;

    const num = rawNum.padStart(3, '0');
    const swudbId = `${setCode}-${num}`;

    const standard = parseInt(row['Standard'] || '0', 10) || 0;
    const nonFoil = parseInt(row['Non-Foil'] || '0', 10) || 0;
    const foil = parseInt(row['Foil'] || '0', 10) || 0;
    const hyperspace = parseInt(row['Hyperspace'] || '0', 10) || 0;
    const fHyperspace = parseInt(row['F-Hyperspace'] || '0', 10) || 0;

    // These two columns represent the same physical variant. Take the max to
    // prevent double-counting from malformed sheets.
    const normalCount = Math.max(0, Math.max(standard, nonFoil));
    const foilCount = Math.max(0, foil);
    const hyperspaceCount = Math.max(0, hyperspace);
    const fHyperspaceCount = Math.max(0, fHyperspace);

    if (normalCount > 0) {
      const key = `${swudbId}|Normal`;
      aggregated[key] = (aggregated[key] || 0) + normalCount;
    }
    if (foilCount > 0) {
      const key = `${swudbId}|Foil`;
      aggregated[key] = (aggregated[key] || 0) + foilCount;
    }
    if (hyperspaceCount > 0) {
      const key = `${swudbId}|Hyperspace`;
      aggregated[key] = (aggregated[key] || 0) + hyperspaceCount;
    }
    if (fHyperspaceCount > 0) {
      // Correctly map "F-Hyperspace" to the DB "Hyperspace Foil" variant type.
      const key = `${swudbId}|Hyperspace Foil`;
      aggregated[key] = (aggregated[key] || 0) + fHyperspaceCount;
    }
  }

  // Transform the aggregated map into the final array structure.
  return Object.entries(aggregated).map(([key, count]) => {
    const [swudbId, variantType] = key.split('|');
    return { swudbId, variantType, count };
  });
}
