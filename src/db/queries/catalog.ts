import { db } from '@/db';
import { cardDefinitions, cardPrintings, userCollections } from '@/db/schema';
import { eq, and, notIlike, asc, sql, desc, isNotNull, inArray } from 'drizzle-orm';
import type { PrintingArtMap } from '@/lib/catalog/select-best-variant';

export async function getAllCards(userId?: number) {
  return db
    .select({
      id: cardDefinitions.id,
      swudbId: cardDefinitions.swudbId,
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
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      frontArtUrl: cardPrintings.frontArtUrl,
      backArtUrl: cardPrintings.backArtUrl,
      rarity: cardPrintings.rarity,
      variantType: cardPrintings.variantType,
      printingId: cardPrintings.id,  // D-07
      frontText: cardDefinitions.frontText,
      backText: cardDefinitions.backText,
      epicAction: cardDefinitions.epicAction,
      doubleSided: cardDefinitions.doubleSided,
      unique: cardDefinitions.unique,
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
        notIlike(cardDefinitions.type, '%token%'),
      )
    )
    .orderBy(asc(cardPrintings.setCode), asc(cardPrintings.collectorNumber));
}

export async function getFilterOptions() {
  const sets = await db
    .selectDistinct({ setCode: cardPrintings.setCode })
    .from(cardPrintings)
    .innerJoin(cardDefinitions, eq(cardPrintings.cardDefinitionId, cardDefinitions.id))
    .where(
      and(
        notIlike(cardDefinitions.type, '%token%'),
        eq(cardPrintings.variantType, 'Normal')
      )
    )
    .orderBy(asc(cardPrintings.setCode));

  const types = await db
    .selectDistinct({ type: cardDefinitions.type })
    .from(cardDefinitions)
    .where(notIlike(cardDefinitions.type, '%token%'))
    .orderBy(asc(cardDefinitions.type));

  return {
    sets: sets.map(r => r.setCode),
    types: types.map(r => r.type),
    // aspects: derived client-side from the full card array (avoids PostgreSQL unnest)
  };
}

/**
 * Returns a map of all card printings keyed by cardPrintingId.
 * Used by the catalog RSC (src/app/cards/page.tsx) to pass art data
 * to the client for variant art resolution (REQ-COLLECT-08, D-01).
 *
 * This is public catalog data — no user filter needed.
 */
export async function getPrintingArtMap(): Promise<PrintingArtMap> {
  const rows = await db
    .select({
      id: cardPrintings.id,
      variantType: cardPrintings.variantType,
      frontArtUrl: cardPrintings.frontArtUrl,
    })
    .from(cardPrintings);

  return rows.reduce<PrintingArtMap>((acc, row) => {
    acc[row.id] = { variantType: row.variantType, frontArtUrl: row.frontArtUrl };
    return acc;
  }, {});
}

export async function getTopCardsByPrice(limit: number) {
  // Deduplicate first: one printing per card definition (reprints share the same price).
  // DISTINCT ON requires the grouped column to lead ORDER BY; the outer query then sorts by price.
  const deduped = db
    .selectDistinctOn([cardDefinitions.id], {
      id: cardDefinitions.id,
      name: cardDefinitions.name,
      type: cardDefinitions.type,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      frontArtUrl: cardPrintings.frontArtUrl,
      backArtUrl: cardPrintings.backArtUrl,
      priceUsd: cardDefinitions.priceUsd,
    })
    .from(cardDefinitions)
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(
      and(
        isNotNull(cardDefinitions.priceUsd),
        notIlike(cardDefinitions.type, '%token%'),
        eq(cardPrintings.variantType, 'Normal'),
      )
    )
    .orderBy(cardDefinitions.id)
    .as('deduped');

  return db
    .select()
    .from(deduped)
    .orderBy(desc(deduped.priceUsd))
    .limit(limit);
}
