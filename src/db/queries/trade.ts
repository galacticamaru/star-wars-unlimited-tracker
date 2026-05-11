import { db } from '@/db';
import { userCollections, tradeExclusions, tradeManualWants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
