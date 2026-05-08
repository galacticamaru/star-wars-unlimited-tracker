import { NextRequest } from 'next/server';
import { getDecks, createDeck } from '@/db/queries/decks';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const decks = await getDecks(Number(session.user.id));
    return Response.json(decks);
  } catch (error) {
    console.error('Failed to fetch decks:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return new Response('Missing deck name', { status: 400 });
    }

    const deck = await createDeck(name, Number(session.user.id));
    return Response.json(deck);
  } catch (error) {
    console.error('Failed to create deck:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
