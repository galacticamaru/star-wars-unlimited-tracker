import { db } from '@/db';
import { userCollections, tradeExclusions, tradeManualWants, cardDefinitions, cardPrintings } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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

  return {
    offerings,
    exclusions,
    manualWants,
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
