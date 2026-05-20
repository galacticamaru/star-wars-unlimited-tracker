import { getUserCollection } from '@/db/queries/collection';
import { buildCollectionMap } from '@/app/api/collection/collection-shape';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const rows = await getUserCollection(Number(session.user.id));

    // Build the new response shape: { [cardDefinitionId]: { total, variants: { [cardPrintingId]: count } } }
    // All consumers of this endpoint must read .total instead of the raw value (D-05)
    const countMap = buildCollectionMap(rows);

    return Response.json(countMap);
  } catch (error) {
    console.error('Failed to fetch collection:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// POST /api/collection has been REMOVED (D-03).
// All count mutations now go through POST /api/collection/variants.
