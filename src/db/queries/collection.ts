import { db } from '@/db';
import { userCollections } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getUserCollection(userId: number) {
  return db
    .select({
      cardDefinitionId: userCollections.cardDefinitionId,
      count: userCollections.count,
    })
    .from(userCollections)
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
