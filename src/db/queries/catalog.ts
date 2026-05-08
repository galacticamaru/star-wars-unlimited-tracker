import { db } from '@/db';
import { cardDefinitions, cardPrintings, userCollections } from '@/db/schema';
import { eq, and, notIlike, asc, sql } from 'drizzle-orm';

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
        eq(cardPrintings.variantType, 'Normal')
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
