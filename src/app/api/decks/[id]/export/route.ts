import { NextRequest } from 'next/server';
import { getDeckForExport } from '@/db/queries/decks';
import { toMeleeFormat, toJSONFormat } from '@/lib/export';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const deckId = parseInt(id, 10);
    
    if (isNaN(deckId)) {
      return new Response('Invalid deck ID', { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'melee';

    const deck = await getDeckForExport(deckId, Number(session.user.id));
    if (!deck) {
      return new Response('Deck not found', { status: 404 });
    }

    let content: string;
    let contentType: string;
    let fileName: string;

    const safeName = (deck.name || 'deck').replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'json') {
      content = toJSONFormat(deck);
      contentType = 'application/json';
      fileName = `${safeName}.json`;
    } else {
      content = toMeleeFormat(deck);
      contentType = 'text/plain';
      fileName = `${safeName}.txt`;
    }

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export deck:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
