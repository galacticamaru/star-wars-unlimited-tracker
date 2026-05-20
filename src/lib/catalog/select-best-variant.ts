/**
 * Variant art precedence for catalog tile display (REQ-COLLECT-08).
 *
 * When a user owns multiple variants of the same card, the catalog tile shows
 * the art of the variant with the highest owned count. On ties, the more premium
 * variant wins.
 *
 * Precedence: Showcase(5) > Hyperspace Foil(4) > Hyperspace(3) > Foil(2) > Normal(1)
 * Unknown variant types are treated as 0 (lowest priority).
 */

export type PrintingArtMap = Record<number, { variantType: string; frontArtUrl: string | null }>;

export const VARIANT_PRECEDENCE: Record<string, number> = {
  Showcase: 5,
  'Hyperspace Foil': 4,
  Hyperspace: 3,
  Foil: 2,
  Normal: 1,
};

/**
 * Returns the frontArtUrl for the best variant a user owns, or null if no
 * variants are owned or the best art URL is null.
 *
 * @param variants - Map of cardPrintingId → owned count (from CollectionMap.variants)
 * @param printingArtMap - Map of cardPrintingId → { variantType, frontArtUrl }
 */
export function selectBestVariantArtUrl(
  variants: Record<number, number>,
  printingArtMap: PrintingArtMap
): string | null {
  let highestCount = 0;
  let highestPrecedence = 0;
  let bestArtUrl: string | null = null;

  for (const [printingIdStr, count] of Object.entries(variants)) {
    if (count <= 0) continue;

    const pId = Number(printingIdStr);
    const artData = printingArtMap[pId];
    if (!artData) continue;

    const precedence = VARIANT_PRECEDENCE[artData.variantType] ?? 0;

    if (
      count > highestCount ||
      (count === highestCount && precedence > highestPrecedence)
    ) {
      highestCount = count;
      highestPrecedence = precedence;
      bestArtUrl = artData.frontArtUrl;
    }
  }

  return highestCount > 0 ? bestArtUrl : null;
}
