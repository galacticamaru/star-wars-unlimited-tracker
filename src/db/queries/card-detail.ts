import { db } from '@/db';
import { cardDefinitions, cardPrintings, userCollections } from '@/db/schema';
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
        eq(cardPrintings.variantType, 'Normal')
      )
    )
    .limit(1);

  return card ?? null;
}
