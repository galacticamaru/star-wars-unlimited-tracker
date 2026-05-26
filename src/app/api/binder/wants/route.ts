import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { upsertManualWant, deleteManualWant } from '@/db/queries/trade';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { cardPrintingId, quantity } = body;

    if (cardPrintingId === undefined || quantity === undefined) {
      return new Response('Missing cardPrintingId or quantity', { status: 400 });
    }

    if (quantity <= 0) {
      await deleteManualWant(Number(session.user.id), cardPrintingId);
    } else {
      await upsertManualWant(Number(session.user.id), cardPrintingId, quantity);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to update manual want:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cardPrintingId = searchParams.get('cardPrintingId');

    if (!cardPrintingId) {
      return new Response('Missing cardPrintingId', { status: 400 });
    }

    await deleteManualWant(Number(session.user.id), parseInt(cardPrintingId, 10));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete manual want:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
