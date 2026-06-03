import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { upsertTradeOffering } from '@/db/queries/trade';
import { db } from '@/db';
import { cardPrintings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { cardPrintingId, tradeQuantity } = body;

    if (cardPrintingId === undefined || tradeQuantity === undefined) {
      return new Response('Missing cardPrintingId or tradeQuantity', { status: 400 });
    }

    const userId = Number(session.user.id);

    await upsertTradeOffering(
      userId,
      cardPrintingId,
      Math.max(0, tradeQuantity)
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
