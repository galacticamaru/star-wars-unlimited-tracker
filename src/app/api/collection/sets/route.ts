import { db } from '@/db';
import { cardPrintings } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const sets = await db
      .selectDistinct({ setCode: cardPrintings.setCode })
      .from(cardPrintings)
      .orderBy(asc(cardPrintings.setCode));

    return Response.json(sets.map(s => s.setCode));
  } catch (error) {
    console.error('Failed to fetch sets:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
