import { db } from '@/db';
import { cardDefinitions, cardPrintings, userCollections, userPrintingCollections } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function getCardByPrinting(setCode: string, cardNumber: string, userId?: number) {
  // collectorNumber stored as "SOR-059" — reconstruct from URL route params
  const collectorNumber = `${setCode}-${cardNumber}`;

  const [card] = await db
    .select({
      id: cardDefinitions.id,
      name: cardDefinitions.name,
      subtitle: cardDefinitions.subtitle,
      type: cardDefinitions.type,
      aspects: cardDefinitions.aspects,
      arenas: cardDefinitions.arenas,
      traits: cardDefinitions.traits,
      keywords: cardDefinitions.keywords,
      cost: cardDefinitions.cost,
      power: cardDefinitions.power,
      hp: cardDefinitions.hp,
      frontText: cardDefinitions.frontText,
      backText: cardDefinitions.backText,
      epicAction: cardDefinitions.epicAction,
      doubleSided: cardDefinitions.doubleSided,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      rarity: cardPrintings.rarity,
      frontArtUrl: cardPrintings.frontArtUrl,
      backArtUrl: cardPrintings.backArtUrl,
      artist: cardPrintings.artist,
      priceEur: cardDefinitions.priceEur,
      priceUsd: cardDefinitions.priceUsd,
      collectionCount: sql<number>`COALESCE(${userCollections.count}, 0)`,
    })
    .from(cardDefinitions)
    .innerJoin(
      cardPrintings,
      eq(cardDefinitions.id, cardPrintings.cardDefinitionId)
    )
    .leftJoin(
      userCollections,
      and(
        eq(cardDefinitions.id, userCollections.cardDefinitionId),
        userId ? eq(userCollections.userId, userId) : sql`FALSE`
      )
    )
    .where(
      and(
        eq(cardPrintings.setCode, setCode),
        eq(cardPrintings.collectorNumber, collectorNumber),
        // WR-04: variantType='Normal' filter is intentional.
        // Card detail URLs are always constructed from the Normal variant's collectorNumber
        // (e.g. "SOR-059", not "SOR-059F" or a Hyperspace number). CardItem and any other
        // URL builders MUST use the Normal collectorNumber — if a Foil/Hyperspace
        // collectorNumber is ever used in a URL, this query will return null and
        // notFound() will be called even though the card exists in the DB.
        // This coupling must be maintained until this query is updated to prefer Normal
        // with an ORDER BY fallback.
        eq(cardPrintings.variantType, 'Normal')
      )
    )
    .limit(1);

  return card ?? null;
}

/**
 * Fetches all card_printings rows for a given cardDefinitionId + setCode,
 * with the per-user owned count from user_printing_collections.
 *
 * Used by the card detail RSC to build the VariantCollectionSection variant list.
 * IMPORTANT: No variantType filter — all variants are returned (D-07).
 */
export async function getSameSetPrintingsWithCounts(
  cardDefinitionId: number,
  setCode: string,
  userId?: number
) {
  return db
    .select({
      id: cardPrintings.id,
      variantType: cardPrintings.variantType,
      collectorNumber: cardPrintings.collectorNumber,
      ownedCount: sql<number>`COALESCE(${userPrintingCollections.count}, 0)`,
    })
    .from(cardPrintings)
    .leftJoin(
      userPrintingCollections,
      and(
        eq(cardPrintings.id, userPrintingCollections.cardPrintingId),
        userId ? eq(userPrintingCollections.userId, userId) : sql`FALSE`
      )
    )
    .where(
      and(
        eq(cardPrintings.cardDefinitionId, cardDefinitionId),
        eq(cardPrintings.setCode, setCode)
      )
    )
    .orderBy(cardPrintings.variantType);
}
