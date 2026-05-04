import type { NextRequest } from 'next/server';
import { syncAllCards } from '@/lib/sync/upsert-cards';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Guard: cronSecret must be set AND header must match exactly
  // Checking !cronSecret first prevents empty-string bypass
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await syncAllCards();
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('Card sync failed:', error);
    return new Response('Sync failed', { status: 500 });
  }
}
