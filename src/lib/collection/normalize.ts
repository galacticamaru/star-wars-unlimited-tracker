/**
 * Normalizes rows from the Reddit community collection spreadsheet.
 * 
 * Format:
 * Columns: Set, Number, Name, Subtitle, Normal, Foil, Hyperspace, Hyperspace Foil
 * 
 * Returns a map of collectorNumber (Set-Number) to total count.
 */
export function normalizeRedditCsv(rows: any[]) {
  const counts: Record<string, number> = {};

  for (const row of rows) {
    const set = row['Set'];
    const num = row['Number'];
    if (!set || !num) continue;

    // collectorNumber format matches src/lib/sync/upsert-cards.ts: Set-Number
    // Note: num is often already zero-padded in the CSV (e.g. "059")
    const collectorNumber = `${set}-${num}`;
    
    // Sum all variant columns (standard community spreadsheet names)
    const normal = parseInt(row['Normal'] || '0', 10) || 0;
    const foil = parseInt(row['Foil'] || '0', 10) || 0;
    const hyperspace = parseInt(row['Hyperspace'] || '0', 10) || 0;
    const hfoil = parseInt(row['Hyperspace Foil'] || '0', 10) || 0;
    
    const total = normal + foil + hyperspace + hfoil;
    if (total > 0) {
      counts[collectorNumber] = (counts[collectorNumber] || 0) + total;
    }
  }

  return counts;
}
