import { NextRequest } from 'next/server';
import { getUserCollection, upsertCardCount } from '@/db/queries/collection';

export async function GET() {
  try {
    const collection = await getUserCollection(1); // Hardcoded user 1 as per D-04
    
    // Convert to a map for easier client-side consumption: { [cardDefinitionId]: count }
    const countMap = collection.reduce((acc, row) => {
      acc[row.cardDefinitionId] = row.count;
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
    const body = await request.json();
    const { cardDefinitionId, count } = body;

    if (cardDefinitionId === undefined || count === undefined) {
      return new Response('Missing cardDefinitionId or count', { status: 400 });
    }

    await upsertCardCount(cardDefinitionId, count, 1); // Hardcoded user 1

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to update collection:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
