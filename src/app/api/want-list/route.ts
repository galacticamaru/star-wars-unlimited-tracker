import { getWantList } from '@/lib/want-list';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = Number(session.user.id);
    const result = await getWantList(userId);

    return Response.json(result);
  } catch (error) {
    console.error('Failed to compute want list:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
