import { db } from '@/db';
import { decks, deckCards, cardDefinitions, cardPrintings } from '@/db/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';

export async function getDecks(userId: number = 1) {
  return db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(desc(decks.updatedAt));
}

export async function getDeckWithCards(deckId: number) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, deckId));

  if (!deck) return null;

  const cards = await db
    .select()
    .from(deckCards)
    .where(eq(deckCards.deckId, deckId));

  return {
    ...deck,
    cards,
  };
}

export async function createDeck(name: string, userId: number = 1) {
  const [newDeck] = await db
    .insert(decks)
    .values({
      name,
      userId,
      isDraft: true,
    })
    .returning();
  return newDeck;
}

export async function updateDeck(
  deckId: number,
  data: {
    name?: string;
    leaderCardDefinitionId?: number | null;
    baseCardDefinitionId?: number | null;
    isDraft?: boolean;
    cards?: { cardDefinitionId: number; quantity: number; isSideboard: boolean }[];
  }
) {
  return await db.transaction(async (tx) => {
    // Update deck metadata
    const updatePayload: Record<string, any> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.leaderCardDefinitionId !== undefined) updatePayload.leaderCardDefinitionId = data.leaderCardDefinitionId;
    if (data.baseCardDefinitionId !== undefined) updatePayload.baseCardDefinitionId = data.baseCardDefinitionId;
    if (data.isDraft !== undefined) updatePayload.isDraft = data.isDraft;
    
    if (Object.keys(updatePayload).length > 0) {
      updatePayload.updatedAt = new Date();
      await tx
        .update(decks)
        .set(updatePayload)
        .where(eq(decks.id, deckId));
    }

    // Update cards if provided
    if (data.cards) {
      await tx.delete(deckCards).where(eq(deckCards.deckId, deckId));
      
      if (data.cards.length > 0) {
        await tx.insert(deckCards).values(
          data.cards.map((c) => ({
            deckId,
            cardDefinitionId: c.cardDefinitionId,
            quantity: c.quantity,
            isSideboard: c.isSideboard,
          }))
        );
      }
    }

    return deckId;
  });
}

export async function deleteDeck(deckId: number) {
  return db.delete(decks).where(eq(decks.id, deckId));
}

export async function getCardsByDefinitionIds(ids: number[]) {
  if (ids.length === 0) return [];
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
      frontText: cardDefinitions.frontText,
      backText: cardDefinitions.backText,
      epicAction: cardDefinitions.epicAction,
      doubleSided: cardDefinitions.doubleSided,
      unique: cardDefinitions.unique,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      frontArtUrl: cardPrintings.frontArtUrl,
      backArtUrl: cardPrintings.backArtUrl,
      rarity: cardPrintings.rarity,
    })
    .from(cardDefinitions)
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(
      and(
        inArray(cardDefinitions.id, ids),
        eq(cardPrintings.variantType, 'Normal')
      )
    );
}

export async function getDeckForExport(deckId: number) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, deckId));

  if (!deck) return null;

  // Fetch leader and base printings
  const leaderId = deck.leaderCardDefinitionId;
  const baseId = deck.baseCardDefinitionId;

  const printingDetails = async (defId: number | null) => {
    if (!defId) return null;
    const [result] = await db
      .select({
        name: cardDefinitions.name,
        subtitle: cardDefinitions.subtitle,
        setCode: cardPrintings.setCode,
        collectorNumber: cardPrintings.collectorNumber,
        type: cardDefinitions.type,
      })
      .from(cardDefinitions)
      .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
      .where(
        and(
          eq(cardDefinitions.id, defId),
          eq(cardPrintings.variantType, 'Normal')
        )
      )
      .limit(1);
    return result;
  };

  const leader = await printingDetails(leaderId);
  const base = await printingDetails(baseId);

  const cards = await db
    .select({
      name: cardDefinitions.name,
      subtitle: cardDefinitions.subtitle,
      quantity: deckCards.quantity,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      isSideboard: deckCards.isSideboard,
      type: cardDefinitions.type,
    })
    .from(deckCards)
    .innerJoin(cardDefinitions, eq(deckCards.cardDefinitionId, cardDefinitions.id))
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(
      and(
        eq(deckCards.deckId, deckId),
        eq(cardPrintings.variantType, 'Normal')
      )
    );

  return {
    name: deck.name,
    leader: leader ? { ...leader, quantity: 1, isSideboard: false } : null,
    base: base ? { ...base, quantity: 1, isSideboard: false } : null,
    cards,
  };
}

export async function getDeckCardsForUser(userId: number = 1) {
  // Step 1: Get all deck IDs for this user, including leader/base FK columns
  const userDecks = await db
    .select({
      id: decks.id,
      leaderCardDefinitionId: decks.leaderCardDefinitionId,
      baseCardDefinitionId: decks.baseCardDefinitionId,
    })
    .from(decks)
    .where(eq(decks.userId, userId));

  if (userDecks.length === 0) return [];

  const deckIds = userDecks.map(d => d.id);

  // Step 2: Fetch all deck cards with card definition + Normal printing details
  const deckCardRows = await db
    .select({
      deckId: deckCards.deckId,
      cardDefinitionId: deckCards.cardDefinitionId,
      quantity: deckCards.quantity,
      isSideboard: deckCards.isSideboard,
      name: cardDefinitions.name,
      type: cardDefinitions.type,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      frontArtUrl: cardPrintings.frontArtUrl,
      backArtUrl: cardPrintings.backArtUrl,
    })
    .from(deckCards)
    .innerJoin(cardDefinitions, eq(deckCards.cardDefinitionId, cardDefinitions.id))
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(
      and(
        inArray(deckCards.deckId, deckIds),
        eq(cardPrintings.variantType, 'Normal')
      )
    );

  // Step 3: Resolve printing details for a leader/base card definition ID
  const resolvePrinting = async (defId: number | null) => {
    if (!defId) return null;
    const [result] = await db
      .select({
        name: cardDefinitions.name,
        type: cardDefinitions.type,
        setCode: cardPrintings.setCode,
        collectorNumber: cardPrintings.collectorNumber,
        frontArtUrl: cardPrintings.frontArtUrl,
        backArtUrl: cardPrintings.backArtUrl,
      })
      .from(cardDefinitions)
      .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
      .where(
        and(
          eq(cardDefinitions.id, defId),
          eq(cardPrintings.variantType, 'Normal')
        )
      )
      .limit(1);
    return result ?? null;
  };

  // Step 4: Emit synthetic rows for each non-null leader/base on every deck (D-01/D-02/D-08)
  const syntheticRows: typeof deckCardRows = [];

  for (const deck of userDecks) {
    for (const defId of [deck.leaderCardDefinitionId, deck.baseCardDefinitionId]) {
      if (!defId) continue;
      const printing = await resolvePrinting(defId);
      if (!printing) continue;
      syntheticRows.push({
        deckId: deck.id,
        cardDefinitionId: defId,
        quantity: 1,
        isSideboard: false,
        name: printing.name,
        type: printing.type,
        setCode: printing.setCode,
        collectorNumber: printing.collectorNumber,
        frontArtUrl: printing.frontArtUrl,
        backArtUrl: printing.backArtUrl,
      });
    }
  }

  return [...deckCardRows, ...syntheticRows];
}
