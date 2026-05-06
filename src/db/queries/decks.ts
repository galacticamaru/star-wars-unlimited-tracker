import { db } from '@/db';
import { decks, deckCards, cardDefinitions } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function getDecks(userId: number = 1) {
// ... (omitted for brevity in replace call, but I must provide context)
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
    .select()
    .from(cardDefinitions)
    .where(inArray(cardDefinitions.id, ids));
}
