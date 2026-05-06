import { NextRequest } from 'next/server';
import { getDecks, createDeck } from '@/db/queries/decks';

export async function GET() {
  try {
    const decks = await getDecks(1);
    return Response.json(decks);
  } catch (error) {
    console.error('Failed to fetch decks:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return new Response('Missing deck name', { status: 400 });
    }

    const deck = await createDeck(name, 1);
    return Response.json(deck);
  } catch (error) {
    console.error('Failed to create deck:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
