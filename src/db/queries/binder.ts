import { db } from '@/db';
import { user, userCollections, tradeExclusions, tradeManualWants, cardDefinitions, cardPrintings, decks, deckCards } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { calculateLookingFor } from '@/lib/binder-logic';

export async function getUserIdByUsername(username: string) {
  const [u] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username.toLowerCase()))
    .limit(1);
  return u?.id ?? null;
}

export async function getPublicBinderData(userId: number) {
  // 1. Fetch Offerings
  const offerings = await db
    .select({
      id: cardDefinitions.id,
      name: cardDefinitions.name,
      subtitle: cardDefinitions.subtitle,
      type: cardDefinitions.type,
      aspects: cardDefinitions.aspects,
      traits: cardDefinitions.traits,
      keywords: cardDefinitions.keywords,
      arenas: cardDefinitions.arenas,
      cost: cardDefinitions.cost,
      power: cardDefinitions.power,
      hp: cardDefinitions.hp,
      rarity: cardPrintings.rarity,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      frontArtUrl: cardPrintings.frontArtUrl,
      tradeQuantity: userCollections.tradeQuantity,
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

  // 2. Calculate Looking For
  // Inventory
  const inventory = await db
    .select({
      cardDefinitionId: userCollections.cardDefinitionId,
      count: userCollections.count,
    })
    .from(userCollections)
    .where(eq(userCollections.userId, userId));
  
  const inventoryMap = new Map(inventory.map(i => [i.cardDefinitionId, i.count]));

  // Manual Wants
  const manualWants = await db
    .select({
      cardDefinitionId: tradeManualWants.cardDefinitionId,
      quantity: tradeManualWants.quantity,
    })
    .from(tradeManualWants)
    .where(eq(tradeManualWants.userId, userId));
  
  const manualWantsMap = new Map(manualWants.map(w => [w.cardDefinitionId, w.quantity]));

  // Exclusions
  const exclusions = await db
    .select({
      cardDefinitionId: tradeExclusions.cardDefinitionId,
    })
    .from(tradeExclusions)
    .where(eq(tradeExclusions.userId, userId));
  
  const exclusionsSet = new Set(exclusions.map(e => e.cardDefinitionId));

  // Auto target from decks
  const userDecks = await db
    .select({
      id: decks.id,
      leaderCardDefinitionId: decks.leaderCardDefinitionId,
      baseCardDefinitionId: decks.baseCardDefinitionId,
    })
    .from(decks)
    .where(eq(decks.userId, userId));
  
  const autoTargetMap = new Map<number, number>();

  if (userDecks.length > 0) {
    const deckIds = userDecks.map(d => d.id);
    const cardQuantities = await db
      .select({
        cardDefinitionId: deckCards.cardDefinitionId,
        quantity: deckCards.quantity,
      })
      .from(deckCards)
      .where(inArray(deckCards.deckId, deckIds));
    
    for (const cq of cardQuantities) {
      const current = autoTargetMap.get(cq.cardDefinitionId) ?? 0;
      autoTargetMap.set(cq.cardDefinitionId, Math.max(current, cq.quantity));
    }

    // Leaders and Bases
    for (const deck of userDecks) {
      if (deck.leaderCardDefinitionId) {
        autoTargetMap.set(deck.leaderCardDefinitionId, Math.max(autoTargetMap.get(deck.leaderCardDefinitionId) ?? 0, 1));
      }
      if (deck.baseCardDefinitionId) {
        autoTargetMap.set(deck.baseCardDefinitionId, Math.max(autoTargetMap.get(deck.baseCardDefinitionId) ?? 0, 1));
      }
    }
  }

  // Combine to find all card IDs that have Looking For > 0
  const relevantCardIds = new Set<number>();
  for (const id of manualWantsMap.keys()) relevantCardIds.add(id);
  for (const id of autoTargetMap.keys()) relevantCardIds.add(id);

  const lookingForList: any[] = [];
  const cardsToFetch: number[] = [];

  for (const cardId of relevantCardIds) {
    const lf = calculateLookingFor(
      autoTargetMap.get(cardId) ?? 0,
      manualWantsMap.get(cardId) ?? 0,
      inventoryMap.get(cardId) ?? 0,
      exclusionsSet.has(cardId)
    );
    if (lf > 0) {
      cardsToFetch.push(cardId);
      lookingForList.push({ cardDefinitionId: cardId, lookingForQuantity: lf });
    }
  }

  // Fetch details for Looking For cards
  if (cardsToFetch.length > 0) {
    const cardDetails = await db
      .select({
        id: cardDefinitions.id,
        name: cardDefinitions.name,
        subtitle: cardDefinitions.subtitle,
        type: cardDefinitions.type,
        aspects: cardDefinitions.aspects,
        traits: cardDefinitions.traits,
        keywords: cardDefinitions.keywords,
        arenas: cardDefinitions.arenas,
        cost: cardDefinitions.cost,
        power: cardDefinitions.power,
        hp: cardDefinitions.hp,
        rarity: cardPrintings.rarity,
        setCode: cardPrintings.setCode,
        collectorNumber: cardPrintings.collectorNumber,
        frontArtUrl: cardPrintings.frontArtUrl,
      })
      .from(cardDefinitions)
      .innerJoin(cardPrintings, eq(cardPrintings.cardDefinitionId, cardDefinitions.id))
      .where(
        and(
          inArray(cardDefinitions.id, cardsToFetch),
          eq(cardPrintings.variantType, 'Normal')
        )
      );
    
    const detailsMap = new Map(cardDetails.map(d => [d.id, d]));
    
    return {
      offerings,
      lookingFor: lookingForList.map(lf => ({
        ...detailsMap.get(lf.cardDefinitionId),
        lookingForQuantity: lf.lookingForQuantity,
      })).filter(lf => lf.id !== undefined)
    };
  }

  return {
    offerings,
    lookingFor: []
  };
}
