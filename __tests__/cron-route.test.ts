// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock every dependency the route now touches — tests should not hit Neon,
// swu-db.com, or the real Next.js cache.
vi.mock('@/lib/sync/upsert-cards', () => ({
  syncAllCards: vi.fn(),
}));
vi.mock('@/lib/sync/prices', () => ({
  syncPrices: vi.fn(),
}));
vi.mock('@/lib/sync/set-list', () => ({
  getNonTokenSets: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

import { syncAllCards } from '@/lib/sync/upsert-cards';
import { syncPrices } from '@/lib/sync/prices';
import { getNonTokenSets } from '@/lib/sync/set-list';
import { revalidateTag } from 'next/cache';

const DEFAULT_SETS = [
  { setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 300 },
  { setId: 'SHD', fullName: 'Shadows of the Galaxy', numberCards: 262 },
  { setId: 'TWI', fullName: 'Twilight of the Republic', numberCards: 300 },
  { setId: 'JTL', fullName: 'Jump to Lightspeed', numberCards: 262 },
  { setId: 'LOF', fullName: 'Legends of the Force', numberCards: 262 },
];

function fullCardResult(overrides: Partial<{
  setsTotal: number;
  setsProcessed: number;
  cardsUpserted: number;
  failedSets: string[];
  unprocessedSets: string[];
  deadlineHit: boolean;
}> = {}) {
  return {
    setsTotal: 5,
    setsProcessed: 5,
    cardsUpserted: 100,
    failedSets: [],
    unprocessedSets: [],
    deadlineHit: false,
    ...overrides,
  };
}

function fullPriceResult(overrides: Partial<{
  setsTotal: number;
  setsProcessed: number;
  totalUpdated: number;
  failedSets: string[];
  unprocessedSets: string[];
  deadlineHit: boolean;
  sets: Array<{ setCode: string; updated: number }>;
}> = {}) {
  return {
    setsTotal: 5,
    setsProcessed: 5,
    totalUpdated: 100,
    failedSets: [],
    unprocessedSets: [],
    deadlineHit: false,
    sets: [],
    ...overrides,
  };
}

describe('GET /api/cron/sync-cards', () => {
  let handler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getNonTokenSets).mockResolvedValue(DEFAULT_SETS);
    vi.mocked(syncAllCards).mockResolvedValue(fullCardResult());
    vi.mocked(syncPrices).mockResolvedValue(fullPriceResult());
    // Re-import the route handler each time so handler always reflects current mock state.
    // vi.resetModules() is NOT used here — vi.clearAllMocks() is sufficient for mock state,
    // and resetModules() can cause the hoisted vi.mock() at the top to not apply on re-import.
    const mod = await import('../src/app/api/cron/sync-cards/route');
    handler = mod.GET;
    // Guard: ensure the mocked dependencies are still mocks after re-import
    expect(vi.isMockFunction(syncAllCards)).toBe(true);
    expect(vi.isMockFunction(syncPrices)).toBe(true);
    expect(vi.isMockFunction(getNonTokenSets)).toBe(true);
    expect(vi.isMockFunction(revalidateTag)).toBe(true);
  });

  it('returns 401 when Authorization header is missing', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    const req = new NextRequest('http://localhost/api/cron/sync-cards');
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header has wrong secret', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 with sync result when Authorization header is correct', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer test-secret-abc123' },
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 401 when CRON_SECRET env var is not set', async () => {
    delete process.env.CRON_SECRET;
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer anything' },
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it('reports a cards shortfall as status 500 with success false and names the failing set', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    vi.mocked(syncAllCards).mockResolvedValue(
      fullCardResult({ setsProcessed: 4, failedSets: ['JTL'] })
    );
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer test-secret-abc123' },
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.cards.failedSets).toContain('JTL');
  });

  it('reports a prices-only shortfall as status 500 with success false (D-07)', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    vi.mocked(syncPrices).mockResolvedValue(
      fullPriceResult({ setsProcessed: 4, failedSets: ['LOF'] })
    );
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer test-secret-abc123' },
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('exact-equality boundary: 5-of-5 both halves is exactly 200, 4-of-5 cards is exactly 500 — no band between them', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer test-secret-abc123' },
    });

    const okRes = await handler(req);
    expect(okRes.status).toBe(200);

    vi.mocked(syncAllCards).mockResolvedValue(
      fullCardResult({ setsProcessed: 4, failedSets: ['LOF'] })
    );
    const shortfallRes = await handler(req);
    expect(shortfallRes.status).toBe(500);
  });

  it('an empty set list on both halves is a failed run, not a trivially complete one', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    vi.mocked(getNonTokenSets).mockResolvedValue([]);
    vi.mocked(syncAllCards).mockResolvedValue(
      fullCardResult({ setsTotal: 0, setsProcessed: 0 })
    );
    vi.mocked(syncPrices).mockResolvedValue(
      fullPriceResult({ setsTotal: 0, setsProcessed: 0 })
    );
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer test-secret-abc123' },
    });
    const res = await handler(req);
    // Zero-of-zero must NOT read as a complete sync — an empty upstream
    // /sets response means the run learned and synced nothing, which is
    // itself a failure, not a vacuously successful one.
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('a fired soft deadline surfaces the unprocessed set codes and fails the run', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    vi.mocked(syncAllCards).mockResolvedValue(
      fullCardResult({
        setsProcessed: 3,
        failedSets: [],
        unprocessedSets: ['LOF', 'TS26'],
        deadlineHit: true,
      })
    );
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer test-secret-abc123' },
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.deadlineHit).toBe(true);
    expect(body.cards.unprocessedSets).toEqual(expect.arrayContaining(['LOF', 'TS26']));
  });

  it('accounts for every set in exactly one of processed, failed, or unprocessed', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    vi.mocked(syncAllCards).mockResolvedValue(
      fullCardResult({
        setsProcessed: 3,
        failedSets: [],
        unprocessedSets: ['LOF', 'TS26'],
        deadlineHit: true,
      })
    );
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer test-secret-abc123' },
    });
    const res = await handler(req);
    const body = await res.json();
    expect(
      body.cards.setsProcessed + body.cards.failedSets.length + body.cards.unprocessedSets.length
    ).toBe(body.cards.setsTotal);
  });

  it('still invalidates the cards cache tag on a failed (500) run — invalidation is not gated on the verdict', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    vi.mocked(syncAllCards).mockResolvedValue(
      fullCardResult({ setsProcessed: 4, failedSets: ['LOF'] })
    );
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer test-secret-abc123' },
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledTimes(1);
  });

  it('fetches the set list exactly once and passes the identical array as `sets` to both syncAllCards and syncPrices', async () => {
    process.env.CRON_SECRET = 'test-secret-abc123';
    const req = new NextRequest('http://localhost/api/cron/sync-cards', {
      headers: { Authorization: 'Bearer test-secret-abc123' },
    });
    await handler(req);
    expect(vi.mocked(getNonTokenSets)).toHaveBeenCalledTimes(1);
    const cardsArgs = vi.mocked(syncAllCards).mock.calls[0][0];
    const pricesArgs = vi.mocked(syncPrices).mock.calls[0][0];
    expect(cardsArgs?.sets).toBe(DEFAULT_SETS);
    expect(pricesArgs?.sets).toBe(DEFAULT_SETS);
  });
});
