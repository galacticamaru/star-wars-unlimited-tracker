import type { NextRequest } from 'next/server';
import { syncAllCards } from '@/lib/sync/upsert-cards';
import { syncPrices } from '@/lib/sync/prices';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Guard: cronSecret must be set AND header must match exactly
  // Checking !cronSecret first prevents empty-string bypass
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('Starting card sync...');
    const cardResult = await syncAllCards();
    
    console.log('Starting price sync...');
    const priceResult = await syncPrices();

    const duration = (Date.now() - startTime) / 1000;

    return Response.json({ 
      success: true, 
      cards: cardResult,
      prices: priceResult,
      duration: `${duration}s`
    });
  } catch (error) {
    console.error('Sync failed:', error);
    return new Response('Sync failed', { status: 500 });
  }
}
