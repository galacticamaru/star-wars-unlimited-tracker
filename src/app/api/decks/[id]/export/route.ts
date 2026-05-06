import { NextRequest } from 'next/server';
import { getDeckForExport } from '@/db/queries/decks';
import { toMeleeFormat, toJSONFormat } from '@/lib/export';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deckId = parseInt(id, 10);
    
    if (isNaN(deckId)) {
      return new Response('Invalid deck ID', { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'melee';

    const deck = await getDeckForExport(deckId);
    if (!deck) {
      return new Response('Deck not found', { status: 404 });
    }

    // T-04-05-01: Information Disclosure - Mitigate by checking userId
    // In this MVP, we assume userId 1 for everyone.
    // In a multi-user system, we would check if deck.userId === currentUser.id.

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
