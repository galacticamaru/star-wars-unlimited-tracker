/**
 * Filters and sorts aspect counts for display in the deck sidebar.
 * Excludes the "Basic" aspect (D-05) and sorts descending by count (D-06).
 *
 * @param aspectCounts - Record from ValidationStats.aspectCounts (includes "Basic")
 * @returns Array of [aspectName, count] tuples, sorted descending by count, "Basic" excluded
 */
export function filterAndSortAspects(
  aspectCounts: Record<string, number>
): [string, number][] {
  return Object.entries(aspectCounts)
    .filter(([aspect]) => aspect !== 'Basic')
    .sort(([, a], [, b]) => b - a);
}
