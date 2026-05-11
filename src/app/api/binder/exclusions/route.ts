import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { addExclusion, removeExclusion } from '@/db/queries/trade';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { cardDefinitionId, excluded } = body;

    if (cardDefinitionId === undefined || excluded === undefined) {
      return new Response('Missing cardDefinitionId or excluded', { status: 400 });
    }

    if (excluded) {
      await addExclusion(Number(session.user.id), cardDefinitionId);
    } else {
      await removeExclusion(Number(session.user.id), cardDefinitionId);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to update exclusion:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
