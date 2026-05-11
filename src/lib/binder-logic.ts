/**
 * Calculates the quantity of a card the user is "Looking For" in their trade binder.
 * 
 * The logic merges auto-calculated requirements from decks with manual user wants,
 * subtracts current inventory, and respects explicit exclusions.
 * 
 * @param autoTarget The quantity required by the user's decks (max quantity in any single deck)
 * @param manualTarget The quantity manually requested by the user for their trade binder
 * @param currentInventory The quantity the user already owns in their collection
 * @param isExcluded Whether the user has explicitly excluded this card from their "Looking For" list
 * @returns The quantity of the card the user is seeking (0 if none or excluded)
 */
export function calculateLookingFor(
  autoTarget: number,
  manualTarget: number,
  currentInventory: number,
  isExcluded: boolean
): number {
  if (isExcluded) {
    return 0;
  }

  const shortfall = Math.max(0, autoTarget - currentInventory);
  return Math.max(shortfall, manualTarget);
}
