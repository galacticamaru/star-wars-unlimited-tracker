import { NextRequest } from 'next/server';
import { getUserCollection, upsertCardCount } from '@/db/queries/collection';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const collection = await getUserCollection(Number(session.user.id));

    // TODO(Plan 03): Update to new shape { [cardDefinitionId]: { total, variants } }
    // For now, deduplicate by cardDefinitionId and expose total as count to preserve
    // existing consumer compatibility until Plan 03 updates all callers.
    const countMap = collection.reduce((acc, row) => {
      // Use first occurrence (cardDefinitionId is the same across joined printing rows)
      if (!(row.cardDefinitionId in acc)) {
        acc[row.cardDefinitionId] = row.total;
      }
      return acc;
    }, {} as Record<number, number>);

    return Response.json(countMap);
  } catch (error) {
    console.error('Failed to fetch collection:', error);
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
    const { cardDefinitionId, count } = body;

    if (cardDefinitionId === undefined || count === undefined) {
      return new Response('Missing cardDefinitionId or count', { status: 400 });
    }

    await upsertCardCount(cardDefinitionId, count, Number(session.user.id));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to update collection:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
