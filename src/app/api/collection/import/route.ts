import { NextRequest } from 'next/server';
import { db } from '@/db';
import { cardPrintings } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { upsertVariantCount, recomputeTotal } from '@/db/queries/collection';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const normalizedCounts: Record<string, number> = await request.json();
    const collectorNumbers = Object.keys(normalizedCounts);

    if (collectorNumbers.length === 0) {
      return Response.json({ success: true, count: 0 });
    }

    // 1. Map collectorNumbers to cardPrintingId AND cardDefinitionId
    // Chunking to avoid SQL parameter limits (same pattern as before)
    const CHUNK_SIZE = 500;
    const mapping: Record<string, { printingId: number; cardDefinitionId: number }> = {};

    for (let i = 0; i < collectorNumbers.length; i += CHUNK_SIZE) {
      const chunk = collectorNumbers.slice(i, i + CHUNK_SIZE);
      const results = await db
        .select({
          collectorNumber: cardPrintings.collectorNumber,
          printingId: cardPrintings.id,
          cardDefinitionId: cardPrintings.cardDefinitionId,
        })
        .from(cardPrintings)
        .where(inArray(cardPrintings.collectorNumber, chunk));

      for (const row of results) {
        mapping[row.collectorNumber] = {
          printingId: row.printingId,
          cardDefinitionId: row.cardDefinitionId,
        };
      }
    }

    // 2. Upsert per-variant rows into user_printing_collections
    // Note: neon-http driver does not support transactions — sequential awaits (same as before)
    const userId = Number(session.user.id);
    let processedCount = 0;

    // Track which cardDefinitionIds need total recompute (D-02)
    const affectedDefinitions = new Set<number>();

    for (const [collectorNumber, count] of Object.entries(normalizedCounts)) {
      const lookup = mapping[collectorNumber];
      if (!lookup) continue;

      // Floor at 0 before upsert (T-17-06-02 threat mitigation)
      const safeCount = Math.max(0, count);

      await upsertVariantCount(lookup.printingId, safeCount, userId);
      affectedDefinitions.add(lookup.cardDefinitionId);
      processedCount++;
    }

    // 3. Recompute totals for all affected card definitions (D-02)
    for (const cardDefinitionId of affectedDefinitions) {
      await recomputeTotal(userId, cardDefinitionId);
    }

    return Response.json({ success: true, count: processedCount });
  } catch (error) {
    console.error('Import failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
