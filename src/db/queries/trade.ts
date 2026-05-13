import { db } from '@/db';
import { userCollections, tradeExclusions, tradeManualWants, cardDefinitions, cardPrintings, decks, deckCards } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { calculateLookingFor } from '@/lib/binder-logic';

export async function getUserTradeData(userId: number) {
  const offerings = await db
    .select({
      cardDefinitionId: userCollections.cardDefinitionId,
      tradeQuantity: userCollections.tradeQuantity,
      name: cardDefinitions.name,
      type: cardDefinitions.type,
      frontArtUrl: cardPrintings.frontArtUrl,
    })
    .from(userCollections)
    .innerJoin(cardDefinitions, eq(userCollections.cardDefinitionId, cardDefinitions.id))
    .innerJoin(cardPrintings, eq(cardPrintings.cardDefinitionId, cardDefinitions.id))
    .where(
      and(
        eq(userCollections.userId, userId),
        eq(cardPrintings.variantType, 'Normal'),
        sql`${userCollections.tradeQuantity} > 0`
      )
    );

  const exclusions = await db
    .select({
      cardDefinitionId: tradeExclusions.cardDefinitionId,
      name: cardDefinitions.name,
      subtitle: cardDefinitions.subtitle,
    })
    .from(tradeExclusions)
    .innerJoin(cardDefinitions, eq(tradeExclusions.cardDefinitionId, cardDefinitions.id))
    .where(eq(tradeExclusions.userId, userId));

  const manualWants = await db
    .select({
      cardDefinitionId: tradeManualWants.cardDefinitionId,
      quantity: tradeManualWants.quantity,
      name: cardDefinitions.name,
      subtitle: cardDefinitions.subtitle,
    })
    .from(tradeManualWants)
    .innerJoin(cardDefinitions, eq(tradeManualWants.cardDefinitionId, cardDefinitions.id))
    .where(eq(tradeManualWants.userId, userId));

  // --- Auto-wants: deck-driven shortfall computation ---

  // Step 1: Build exclusions set for isExcluded flag
  const exclusionsSet = new Set(exclusions.map(e => e.cardDefinitionId));

  // Step 2: Fetch user's decks
  const userDecks = await db
    .select({
      id: decks.id,
      leaderCardDefinitionId: decks.leaderCardDefinitionId,
      baseCardDefinitionId: decks.baseCardDefinitionId,
    })
    .from(decks)
    .where(eq(decks.userId, userId));

  // Step 3: Build autoTargetMap — max quantity needed per card across all decks
  const autoTargetMap = new Map<number, number>();

  if (userDecks.length > 0) {
    const deckIds = userDecks.map(d => d.id);
    const cardQuantities = await db
      .select({
        cardDefinitionId: deckCards.cardDefinitionId,
        quantity: deckCards.quantity,
      })
      .from(deckCards)
      .where(
        and(
          inArray(deckCards.deckId, deckIds),
          eq(deckCards.isSideboard, false)
        )
      );

    for (const cq of cardQuantities) {
      const current = autoTargetMap.get(cq.cardDefinitionId) ?? 0;
      autoTargetMap.set(cq.cardDefinitionId, Math.max(current, cq.quantity));
    }

    // Leaders and bases count as 1 each
    for (const deck of userDecks) {
      if (deck.leaderCardDefinitionId) {
        autoTargetMap.set(
          deck.leaderCardDefinitionId,
          Math.max(autoTargetMap.get(deck.leaderCardDefinitionId) ?? 0, 1)
        );
      }
      if (deck.baseCardDefinitionId) {
        autoTargetMap.set(
          deck.baseCardDefinitionId,
          Math.max(autoTargetMap.get(deck.baseCardDefinitionId) ?? 0, 1)
        );
      }
    }
  }

  // Step 4: Fetch inventory to compute shortfalls
  const inventory = await db
    .select({
      cardDefinitionId: userCollections.cardDefinitionId,
      count: userCollections.count,
    })
    .from(userCollections)
    .where(eq(userCollections.userId, userId));

  const inventoryMap = new Map(inventory.map(i => [i.cardDefinitionId, i.count]));

  // Step 5: Compute shortfall per card using calculateLookingFor
  // Pass isExcluded=false here — exclusion only controls visibility, isExcluded on
  // the returned item controls render style in the UI
  const autoWantsRaw: Array<{ cardDefinitionId: number; quantity: number }> = [];

  for (const [cardId, autoTarget] of autoTargetMap.entries()) {
    const shortfall = calculateLookingFor(
      autoTarget,
      0,
      inventoryMap.get(cardId) ?? 0,
      false
    );
    if (shortfall > 0) {
      autoWantsRaw.push({ cardDefinitionId: cardId, quantity: shortfall });
    }
  }

  // Step 6: Fetch card names/subtitles for shortfall items
  const autoWantCardIds = autoWantsRaw.map(r => r.cardDefinitionId);
  let autoWants: Array<{
    cardDefinitionId: number;
    quantity: number;
    name: string;
    subtitle: string | null;
    isExcluded: boolean;
  }> = [];

  if (autoWantCardIds.length > 0) {
    const cardDetails = await db
      .select({
        id: cardDefinitions.id,
        name: cardDefinitions.name,
        subtitle: cardDefinitions.subtitle,
      })
      .from(cardDefinitions)
      .where(inArray(cardDefinitions.id, autoWantCardIds));

    const detailsMap = new Map(cardDetails.map(d => [d.id, d]));

    autoWants = autoWantsRaw
      .map(r => {
        const detail = detailsMap.get(r.cardDefinitionId);
        if (!detail) return null;
        return {
          cardDefinitionId: r.cardDefinitionId,
          quantity: r.quantity,
          name: detail.name,
          subtitle: detail.subtitle,
          isExcluded: exclusionsSet.has(r.cardDefinitionId),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }

  return {
    offerings,
    exclusions,
    manualWants,
    autoWants,
  };
}

export async function upsertTradeQuantity(userId: number, cardDefinitionId: number, tradeQuantity: number) {
  return db
    .insert(userCollections)
    .values({
      userId,
      cardDefinitionId,
      count: 0,
      tradeQuantity,
    })
    .onConflictDoUpdate({
      target: [userCollections.userId, userCollections.cardDefinitionId],
      set: { 
        tradeQuantity,
        updatedAt: new Date(),
      },
    })
    .returning();
}

export async function upsertManualWant(userId: number, cardDefinitionId: number, quantity: number) {
  return db
    .insert(tradeManualWants)
    .values({
      userId,
      cardDefinitionId,
      quantity,
    })
    .onConflictDoUpdate({
      target: [tradeManualWants.userId, tradeManualWants.cardDefinitionId],
      set: { 
        quantity,
        updatedAt: new Date(),
      },
    })
    .returning();
}

export async function deleteManualWant(userId: number, cardDefinitionId: number) {
  return db
    .delete(tradeManualWants)
    .where(
      and(
        eq(tradeManualWants.userId, userId),
        eq(tradeManualWants.cardDefinitionId, cardDefinitionId)
      )
    );
}

export async function addExclusion(userId: number, cardDefinitionId: number) {
  return db
    .insert(tradeExclusions)
    .values({
      userId,
      cardDefinitionId,
    })
    .onConflictDoNothing()
    .returning();
}

export async function removeExclusion(userId: number, cardDefinitionId: number) {
  return db
    .delete(tradeExclusions)
    .where(
      and(
        eq(tradeExclusions.userId, userId),
        eq(tradeExclusions.cardDefinitionId, cardDefinitionId)
      )
    );
}
