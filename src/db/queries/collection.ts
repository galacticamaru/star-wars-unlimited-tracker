import { db } from '@/db';
import { userCollections, userPrintingCollections, cardPrintings } from '@/db/schema';
import { sql, eq, and } from 'drizzle-orm';

export async function getUserCollection(userId: number) {
  // LEFT JOIN path: userCollections → cardPrintings → userPrintingCollections
  // Gives one row per printing variant for each owned card definition.
  // Cards with no per-variant rows: cardPrintingId=null, variantCount=null (handled by buildCollectionMap).
  return db
    .select({
      cardDefinitionId: userCollections.cardDefinitionId,
      total: userCollections.count,
      cardPrintingId: userPrintingCollections.cardPrintingId,
      variantCount: userPrintingCollections.count,
    })
    .from(userCollections)
    .leftJoin(
      cardPrintings,
      eq(cardPrintings.cardDefinitionId, userCollections.cardDefinitionId)
    )
    .leftJoin(
      userPrintingCollections,
      and(
        eq(userPrintingCollections.cardPrintingId, cardPrintings.id),
        eq(userPrintingCollections.userId, userId)
      )
    )
    .where(eq(userCollections.userId, userId));
}

export async function upsertCardCount(cardDefinitionId: number, count: number, userId: number) {
  return db
    .insert(userCollections)
    .values({
      userId,
      cardDefinitionId,
      count,
    })
    .onConflictDoUpdate({
      target: [userCollections.userId, userCollections.cardDefinitionId],
      set: {
        count,
        updatedAt: new Date(),
      },
    })
    .returning();
}

export async function upsertVariantCount(cardPrintingId: number, count: number, userId: number) {
  return db
    .insert(userPrintingCollections)
    .values({ userId, cardPrintingId, count })
    .onConflictDoUpdate({
      target: [userPrintingCollections.userId, userPrintingCollections.cardPrintingId],
      set: { count, updatedAt: new Date() },
    })
    .returning();
}

/**
 * After a variant upsert, recompute and persist the total count for a card definition.
 * Must be called after every upsertVariantCount.
 * Note: Neon HTTP driver does not support transactions — these are two sequential awaits.
 */
export async function recomputeTotal(userId: number, cardDefinitionId: number) {
  // SUM all variant counts for this user+cardDefinitionId via cardPrintings join
  const [{ total }] = await db
    .select({ total: sql<number>`COALESCE(SUM(${userPrintingCollections.count}), 0)` })
    .from(userPrintingCollections)
    .innerJoin(cardPrintings, eq(cardPrintings.id, userPrintingCollections.cardPrintingId))
    .where(
      and(
        eq(userPrintingCollections.userId, userId),
        eq(cardPrintings.cardDefinitionId, cardDefinitionId)
      )
    );

  // Upsert total into userCollections (same onConflictDoUpdate pattern as upsertCardCount)
  await db
    .insert(userCollections)
    .values({ userId, cardDefinitionId, count: Number(total) })
    .onConflictDoUpdate({
      target: [userCollections.userId, userCollections.cardDefinitionId],
      set: { count: Number(total), updatedAt: new Date() },
    });
}
