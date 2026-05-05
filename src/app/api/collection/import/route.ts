import { NextRequest } from 'next/server';
import { db } from '@/db';
import { userCollections, cardPrintings } from '@/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const normalizedCounts: Record<string, number> = await request.json();
    const collectorNumbers = Object.keys(normalizedCounts);

    if (collectorNumbers.length === 0) {
      return Response.json({ success: true, count: 0 });
    }

    // 1. Map collectorNumbers to cardDefinitionIds
    // Chunking to avoid potential SQL parameter limits
    const CHUNK_SIZE = 500;
    const mapping: Record<string, number> = {};

    for (let i = 0; i < collectorNumbers.length; i += CHUNK_SIZE) {
      const chunk = collectorNumbers.slice(i, i + CHUNK_SIZE);
      const results = await db
        .select({
          collectorNumber: cardPrintings.collectorNumber,
          cardDefinitionId: cardPrintings.cardDefinitionId,
        })
        .from(cardPrintings)
        .where(inArray(cardPrintings.collectorNumber, chunk));

      for (const row of results) {
        mapping[row.collectorNumber] = row.cardDefinitionId;
      }
    }

    // 2. Transactional upsert
    const userId = 1; // D-04: Hardcoded for v1
    let processedCount = 0;

    await db.transaction(async (tx) => {
      // Note: We're doing individual upserts in a transaction for simplicity.
      // A bulk insert with onConflictUpdate would be faster if supported/constructed correctly.
      for (const [collectorNumber, count] of Object.entries(normalizedCounts)) {
        const cardDefinitionId = mapping[collectorNumber];
        if (!cardDefinitionId) continue;

        await tx
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
          });
        
        processedCount++;
      }
    });

    return Response.json({ success: true, count: processedCount });
  } catch (error) {
    console.error('Import failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
