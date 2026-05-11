import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { upsertTradeQuantity } from '@/db/queries/trade';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { cardDefinitionId, tradeQuantity } = body;

    if (cardDefinitionId === undefined || tradeQuantity === undefined) {
      return new Response('Missing cardDefinitionId or tradeQuantity', { status: 400 });
    }

    await upsertTradeQuantity(Number(session.user.id), cardDefinitionId, tradeQuantity);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to update trade quantity:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
