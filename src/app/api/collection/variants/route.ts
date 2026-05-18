import { NextRequest } from 'next/server';
import { db } from '@/db';
import { cardPrintings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { upsertVariantCount, recomputeTotal } from '@/db/queries/collection';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { cardPrintingId, count } = body;

    // V5 Input Validation (ASVS): validate presence and type before DB call
    if (cardPrintingId === undefined || count === undefined) {
      return new Response('Missing cardPrintingId or count', { status: 400 });
    }
    if (typeof cardPrintingId !== 'number' || isNaN(cardPrintingId)) {
      return new Response('cardPrintingId must be a number', { status: 400 });
    }
    if (typeof count !== 'number' || !Number.isFinite(count)) {
      return new Response('count must be a finite number', { status: 400 });
    }

    // V4 Access Control: userId always from session, never from request body
    const userId = Number(session.user.id);

    // V5 Input Validation: floor count at 0, floor to integer (D-04 + security)
    const safeCount = Math.max(0, Math.floor(count));

    // Step 1: Upsert per-variant count
    await upsertVariantCount(cardPrintingId, safeCount, userId);

    // Step 2: Look up cardDefinitionId for this printing (needed by recomputeTotal)
    const [printing] = await db
      .select({ cardDefinitionId: cardPrintings.cardDefinitionId })
      .from(cardPrintings)
      .where(eq(cardPrintings.id, cardPrintingId))
      .limit(1);

    if (!printing) {
      return new Response('cardPrintingId not found', { status: 404 });
    }

    // Step 3: Auto-sum to userCollections (D-02)
    // Note: Neon HTTP driver does not support transactions — these are sequential awaits (Pitfall 5)
    await recomputeTotal(userId, printing.cardDefinitionId);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to update variant count:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
