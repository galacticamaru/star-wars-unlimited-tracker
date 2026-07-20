import { db } from '@/db';
import { user, userCollections, tradeExclusions, tradeManualWants, cardDefinitions, cardPrintings, decks, deckCards, userTradeOfferings } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { calculateLookingFor } from '@/lib/binder-logic';

export async function getUserIdByUsername(username: string) {
  const [u] = await db
    .select({ id: user.id, tradeNote: user.tradeNote })
    .from(user)
    .where(eq(user.username, username.toLowerCase()))
    .limit(1);
  return u ?? null;
}

export async function getPublicBinderData(userId: number) {
  // 1. Fetch Offerings — joins user_trade_offerings → card_printings → card_definitions
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
      variantType: cardPrintings.variantType,
      tradeQuantity: userTradeOfferings.quantity,
    })
    .from(userTradeOfferings)
    .innerJoin(cardPrintings, eq(cardPrintings.id, userTradeOfferings.cardPrintingId))
    .innerJoin(cardDefinitions, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(
      and(
        eq(userTradeOfferings.userId, userId),
        sql`${userTradeOfferings.quantity} > 0`
      )
    );

  // 2. Fetch Manual Wants — per-printing entries (D-04, D-05)
  // Each manual want row is one tile with its own variantType from the joined printing.
  const manualWantRows = await db
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
      variantType: cardPrintings.variantType,
      lookingForQuantity: tradeManualWants.quantity,
    })
    .from(tradeManualWants)
    .innerJoin(cardPrintings, eq(cardPrintings.id, tradeManualWants.cardPrintingId))
    .innerJoin(cardDefinitions, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(eq(tradeManualWants.userId, userId));

  // 3. Calculate Looking For (auto-wants — card-definition level, D-03)
  // Inventory
  const inventory = await db
    .select({
      cardDefinitionId: userCollections.cardDefinitionId,
      count: userCollections.count,
    })
    .from(userCollections)
    .where(eq(userCollections.userId, userId));

  const inventoryMap = new Map(inventory.map(i => [i.cardDefinitionId, i.count]));

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

  // Compute auto-want shortfalls (card-definition level, D-03)
  const autoWantCardIds: number[] = [];
  const autoWantQuantityMap = new Map<number, number>();

  for (const [cardId, autoTarget] of autoTargetMap.entries()) {
    const lf = calculateLookingFor(
      autoTarget,
      0,
      inventoryMap.get(cardId) ?? 0,
      exclusionsSet.has(cardId)
    );
    if (lf > 0) {
      autoWantCardIds.push(cardId);
      autoWantQuantityMap.set(cardId, lf);
    }
  }

  // Fetch Normal printing details for auto-want entries (D-03 — auto-wants join to Normal printing)
  let autoWantEntries: Array<{
    id: number;
    name: string;
    subtitle: string | null;
    type: string;
    aspects: string[];
    traits: string[];
    keywords: string[];
    arenas: string[];
    cost: number | null;
    power: number | null;
    hp: number | null;
    rarity: string;
    setCode: string;
    collectorNumber: string;
    frontArtUrl: string | null;
    variantType: string;
    lookingForQuantity: number;
  }> = [];

  if (autoWantCardIds.length > 0) {
    const autoWantDetails = await db
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
        variantType: cardPrintings.variantType,
      })
      .from(cardDefinitions)
      .innerJoin(cardPrintings, eq(cardPrintings.cardDefinitionId, cardDefinitions.id))
      .where(
        and(
          inArray(cardDefinitions.id, autoWantCardIds),
          eq(cardPrintings.variantType, 'Normal')
        )
      );

    autoWantEntries = autoWantDetails.map(d => ({
      ...d,
      lookingForQuantity: autoWantQuantityMap.get(d.id) ?? 1,
    }));
  }

  // 4. Combine manual want entries + auto-want entries (D-06)
  // Every entry has variantType: manual wants use the printing's type; auto-wants use 'Normal'
  const lookingFor = [
    ...manualWantRows,
    ...autoWantEntries,
  ];

  return {
    offerings,
    lookingFor,
  };
}
