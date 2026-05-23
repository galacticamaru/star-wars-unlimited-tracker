import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { upsertTradeOffering } from '@/db/queries/trade';

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

    await upsertTradeOffering(
      Number(session.user.id),
      cardPrintingId,
      Math.max(0, tradeQuantity)
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to update trade offering:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
