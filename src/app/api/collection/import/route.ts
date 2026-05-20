import { NextRequest } from 'next/server';
import { db } from '@/db';
import { cardDefinitions, cardPrintings } from '@/db/schema';
import { and, eq, inArray, or } from 'drizzle-orm';
import { upsertVariantCount, recomputeTotal } from '@/db/queries/collection';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

type ImportPayload = Array<{
  swudbId: string;
  variantType: string;
  count: number;
}>;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const rawBody: unknown = await request.json();

    // Validate incoming payload
    if (!Array.isArray(rawBody)) {
      return new Response('Body must be a JSON array', { status: 400 });
    }
    for (const item of rawBody) {
      if (
        typeof item !== 'object' ||
        item === null ||
        typeof item.swudbId !== 'string' ||
        typeof item.variantType !== 'string' ||
        typeof item.count !== 'number' ||
        !Number.isFinite(item.count)
      ) {
        return new Response('Invalid item in payload array', { status: 400 });
      }
    }
    const payload = rawBody as ImportPayload;

    if (payload.length === 0) {
      return Response.json({ success: true, count: 0 });
    }

    const MAX_IMPORT_ITEMS = 2000;
    if (payload.length > MAX_IMPORT_ITEMS) {
      return new Response(`Import exceeds maximum of ${MAX_IMPORT_ITEMS} items`, { status: 400 });
    }

    // 1. Batch-lookup printing and definition IDs.
    // This is more complex than the previous collectorNumber lookup. We need to join
    // card_definitions (on swudb_id) with card_printings (on variant_type).
    const CHUNK_SIZE = 500;
    const mapping: Record<string, { printingId: number; cardDefinitionId: number }> = {};

    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);

      // Drizzle doesn't directly support multi-column `IN` for `(swudbId, variantType)` tuples.
      // We can simulate it with a series of `OR` conditions.
      const conditions = chunk.map(item =>
        and(
          eq(cardDefinitions.swudbId, item.swudbId),
          eq(cardPrintings.variantType, item.variantType)
        )
      );

      const results = await db
        .select({
          swudbId: cardDefinitions.swudbId,
          variantType: cardPrintings.variantType,
          printingId: cardPrintings.id,
          cardDefinitionId: cardPrintings.cardDefinitionId,
        })
        .from(cardPrintings)
        .innerJoin(cardDefinitions, eq(cardPrintings.cardDefinitionId, cardDefinitions.id))
        .where(conditions.length > 0 ? or(...conditions) : undefined);


      for (const row of results) {
        const key = `${row.swudbId}|${row.variantType}`;
        mapping[key] = {
          printingId: row.printingId,
          cardDefinitionId: row.cardDefinitionId,
        };
      }
    }

    // 2. Upsert counts for each variant.
    const userId = Number(session.user.id);
    let processedCount = 0;
    const affectedDefinitions = new Set<number>();

    for (const item of payload) {
      const key = `${item.swudbId}|${item.variantType}`;
      const lookup = mapping[key];
      if (!lookup) continue;

      const safeCount = Math.max(0, item.count);
      await upsertVariantCount(lookup.printingId, safeCount, userId);
      affectedDefinitions.add(lookup.cardDefinitionId);
      processedCount++;
    }

    // 3. Recompute totals for all affected card definitions.
    for (const cardDefinitionId of affectedDefinitions) {
      await recomputeTotal(userId, cardDefinitionId);
    }

    return Response.json({ success: true, count: processedCount });
  } catch (error) {
    console.error('Import failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
