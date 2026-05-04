import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the sync function — tests should not hit Neon or swu-db.com
vi.mock('@/lib/sync/upsert-cards', () => ({
  syncAllCards: vi.fn().mockResolvedValue({ setsTotal: 5, setsProcessed: 5, cardsUpserted: 100 }),
}));

describe('GET /api/cron/sync-cards', () => {
  let handler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import the route handler each time so handler always reflects current mock state.
    // vi.resetModules() is NOT used here — vi.clearAllMocks() is sufficient for mock state,
    // and resetModules() can cause the hoisted vi.mock() at the top to not apply on re-import.
    const mod = await import('../src/app/api/cron/sync-cards/route');
    handler = mod.GET;
    // Guard: ensure syncAllCards is still the mock function after re-import
    const { syncAllCards } = await import('@/lib/sync/upsert-cards');
    expect(vi.isMockFunction(syncAllCards)).toBe(true);
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
});
