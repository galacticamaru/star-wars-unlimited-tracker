import { db } from '@/db';
import { cardDefinitions, cardPrintings, userPrintingCollections, userTradeOfferings } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { cacheTag, cacheLife } from 'next/cache';

// Alias used to join the Normal printing independently of the requested variant
const normalPrinting = alias(cardPrintings, 'normal_printing');

export async function getCardDefinition(setCode: string, cardNumber: string) {
  'use cache'
  cacheTag('cards');
  cacheLife('days');
  // collectorNumber stored as "SOR-059" — reconstruct from URL route params
  const collectorNumber = `${setCode}-${cardNumber}`;

  // Join any variant printing (matches the URL) → card definition → Normal printing.
  // This allows variant collector numbers (e.g. "SOR-059H") to resolve to the correct
  // card detail page; the displayed art and collector number always come from the
  // Normal printing so the detail page is consistent regardless of which variant URL
  // the user arrived from.
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
      setCode: normalPrinting.setCode,
      collectorNumber: normalPrinting.collectorNumber,
      rarity: normalPrinting.rarity,
      frontArtUrl: normalPrinting.frontArtUrl,
      backArtUrl: normalPrinting.backArtUrl,
      artist: normalPrinting.artist,
      priceEur: cardDefinitions.priceEur,
      priceUsd: cardDefinitions.priceUsd,
    })
    .from(cardPrintings)
    .innerJoin(cardDefinitions, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .innerJoin(
      normalPrinting,
      and(
        eq(normalPrinting.cardDefinitionId, cardDefinitions.id),
        eq(normalPrinting.setCode, cardPrintings.setCode),
        eq(normalPrinting.variantType, 'Normal')
      )
    )
    .where(
      and(
        eq(cardPrintings.setCode, setCode),
        eq(cardPrintings.collectorNumber, collectorNumber),
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
  userId: number
) {
  'use cache'
  cacheTag(`card-printings-${cardDefinitionId}-user-${userId}`);
  return db
    .select({
      id: cardPrintings.id,
      variantType: cardPrintings.variantType,
      collectorNumber: cardPrintings.collectorNumber,
      ownedCount: sql<number>`COALESCE(${userPrintingCollections.count}, 0)`,
      tradeQuantity: sql<number>`COALESCE(${userTradeOfferings.quantity}, 0)`,
    })
    .from(cardPrintings)
    .leftJoin(
      userPrintingCollections,
      and(
        eq(cardPrintings.id, userPrintingCollections.cardPrintingId),
        userId ? eq(userPrintingCollections.userId, userId) : sql`FALSE`
      )
    )
    .leftJoin(
      userTradeOfferings,
      and(
        eq(cardPrintings.id, userTradeOfferings.cardPrintingId),
        userId ? eq(userTradeOfferings.userId, userId) : sql`FALSE`
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
