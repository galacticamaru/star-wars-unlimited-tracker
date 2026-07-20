import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { upsertTradeOffering } from '@/db/queries/trade';
import { db } from '@/db';
import { cardPrintings, userPrintingCollections } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { cardPrintingId, tradeQuantity } = body;

    // Validate types, not just presence: a non-numeric tradeQuantity would make
    // Math.max(0, tradeQuantity) NaN, and `NaN > 0` is false — which would skip the
    // ownership check below and still persist an offering (T-30-01 authorization bypass).
    if (
      typeof cardPrintingId !== 'number' ||
      !Number.isInteger(cardPrintingId) ||
      cardPrintingId <= 0 ||
      typeof tradeQuantity !== 'number' ||
      !Number.isInteger(tradeQuantity) ||
      tradeQuantity < 0
    ) {
      return new Response('Missing or invalid cardPrintingId or tradeQuantity', { status: 400 });
    }

    const userId = Number(session.user.id);
    const requestedQuantity = tradeQuantity;

    // T-30-01: server-side authorization — a trade offering can only be set for a
    // printing the user actually owns. Clearing (quantity 0) is always allowed.
    if (requestedQuantity > 0) {
      const [ownedRow] = await db
        .select({ count: userPrintingCollections.count })
        .from(userPrintingCollections)
        .where(
          and(
            eq(userPrintingCollections.userId, userId),
            eq(userPrintingCollections.cardPrintingId, cardPrintingId)
          )
        )
        .limit(1);

      if (!ownedRow || ownedRow.count <= 0) {
        return new Response('You do not own this printing', { status: 403 });
      }
    }

    await upsertTradeOffering(
      userId,
      cardPrintingId,
      requestedQuantity
    );

    // Look up cardDefinitionId for this printing (needed for cache invalidation)
    const [printing] = await db
      .select({ cardDefinitionId: cardPrintings.cardDefinitionId })
      .from(cardPrintings)
      .where(eq(cardPrintings.id, cardPrintingId))
      .limit(1);

    if (!printing) {
      return new Response('cardPrintingId not found', { status: 404 });
    }

    revalidateTag(`card-printings-${printing.cardDefinitionId}-user-${userId}`, 'max');

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to update trade offering:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
