import { db } from '@/db';
import { cardPrintings } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

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
