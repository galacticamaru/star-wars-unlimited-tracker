// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the DB module's select chain — tests should not hit Neon.
// db.select({...}).from(cardPrintings).groupBy(cardPrintings.setCode).orderBy(asc(...))
// resolves to a caller-controlled row array, wired up via mockOrderBy per test.
const mockOrderBy = vi.fn();
const mockGroupBy = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockFrom = vi.fn(() => ({ groupBy: mockGroupBy }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock('@/db', () => ({
  db: {
    select: mockSelect,
  },
}));

vi.mock('@/db/schema', () => ({
  cardPrintings: {
    setCode: 'set_code',
    updatedAt: 'updated_at',
  },
}));

// Assign to global.fetch so an accidental outbound call is observable (D-04).
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const SECRET = 'test-secret-abc123';
const HOUR_MS = 3_600_000;

function makeRequest(headers?: Record<string, string>) {
  return new NextRequest('http://localhost/api/cron/sync-status', { headers });
}

describe('GET /api/cron/sync-status', () => {
  let handler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockOrderBy.mockResolvedValue([]);
    // Re-import the route handler each time so it reflects current mock state,
    // mirroring __tests__/cron-route.test.ts's established pattern.
    const mod = await import('../src/app/api/cron/sync-status/route');
    handler = mod.GET;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('auth guard', () => {
    it('returns 401 when Authorization header is missing', async () => {
      process.env.CRON_SECRET = SECRET;
      const res = await handler(makeRequest());
      expect(res.status).toBe(401);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header has wrong secret', async () => {
      process.env.CRON_SECRET = SECRET;
      const res = await handler(makeRequest({ Authorization: 'Bearer wrong-secret' }));
      expect(res.status).toBe(401);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns 401 when CRON_SECRET env var is not set, even with a Bearer header present', async () => {
      delete process.env.CRON_SECRET;
      const res = await handler(makeRequest({ Authorization: 'Bearer anything' }));
      expect(res.status).toBe(401);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns 200 when Authorization header matches CRON_SECRET', async () => {
      process.env.CRON_SECRET = SECRET;
      mockOrderBy.mockResolvedValue([]);
      const res = await handler(makeRequest({ Authorization: `Bearer ${SECRET}` }));
      expect(res.status).toBe(200);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('verdict semantics', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = SECRET;
    });

    it('a set at exactly 24.00 hours old reports stale:false, and fresh is true when it is the only set', async () => {
      const now = new Date('2026-08-16T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const exactlyBoundary = new Date(now.getTime() - 24 * HOUR_MS).toISOString();
      mockOrderBy.mockResolvedValue([{ setCode: 'SOR', lastSyncedAt: exactlyBoundary }]);

      const res = await handler(makeRequest({ Authorization: `Bearer ${SECRET}` }));
      const body = await res.json();

      expect(body.sets[0].ageHours).toBe(24);
      expect(body.sets[0].stale).toBe(false);
      expect(body.fresh).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('a set at 24.01 hours old reports stale:true and drives fresh to false', async () => {
      const now = new Date('2026-08-16T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const justPastBoundary = new Date(now.getTime() - 24.01 * HOUR_MS).toISOString();
      mockOrderBy.mockResolvedValue([{ setCode: 'SOR', lastSyncedAt: justPastBoundary }]);

      const res = await handler(makeRequest({ Authorization: `Bearer ${SECRET}` }));
      const body = await res.json();

      expect(body.sets[0].stale).toBe(true);
      expect(body.fresh).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('a set at 1 hour old reports stale:false', async () => {
      const now = new Date('2026-08-16T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const oneHourAgo = new Date(now.getTime() - 1 * HOUR_MS).toISOString();
      mockOrderBy.mockResolvedValue([{ setCode: 'SOR', lastSyncedAt: oneHourAgo }]);

      const res = await handler(makeRequest({ Authorization: `Bearer ${SECRET}` }));
      const body = await res.json();

      expect(body.sets[0].stale).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('a mixed array of one fresh and one stale set yields fresh:false with both sets present', async () => {
      const now = new Date('2026-08-16T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const fresh = new Date(now.getTime() - 1 * HOUR_MS).toISOString();
      const stale = new Date(now.getTime() - 48 * HOUR_MS).toISOString();
      mockOrderBy.mockResolvedValue([
        { setCode: 'SOR', lastSyncedAt: fresh },
        { setCode: 'SHD', lastSyncedAt: stale },
      ]);

      const res = await handler(makeRequest({ Authorization: `Bearer ${SECRET}` }));
      const body = await res.json();

      expect(body.fresh).toBe(false);
      expect(body.sets).toHaveLength(2);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('an empty row set produces fresh:false and sets:[] — an empty catalog is the worst case, not a healthy one', async () => {
      mockOrderBy.mockResolvedValue([]);

      const res = await handler(makeRequest({ Authorization: `Bearer ${SECRET}` }));
      const body = await res.json();

      expect(body.fresh).toBe(false);
      expect(body.sets).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('serialises scrambled input rows in ascending setCode order, identically across two calls', async () => {
      const now = new Date('2026-08-16T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const scrambled = [
        { setCode: 'TWI', lastSyncedAt: now.toISOString() },
        { setCode: 'LOF', lastSyncedAt: now.toISOString() },
        { setCode: 'SOR', lastSyncedAt: now.toISOString() },
      ];

      mockOrderBy.mockResolvedValueOnce(scrambled);
      const res1 = await handler(makeRequest({ Authorization: `Bearer ${SECRET}` }));
      const body1 = await res1.json();
      expect(body1.sets.map((s: { setCode: string }) => s.setCode)).toEqual([
        'LOF',
        'SOR',
        'TWI',
      ]);

      mockOrderBy.mockResolvedValueOnce(scrambled);
      const res2 = await handler(makeRequest({ Authorization: `Bearer ${SECRET}` }));
      const body2 = await res2.json();

      expect(JSON.stringify(body1)).toBe(JSON.stringify(body2));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns a 200 body with exactly the keys fresh, checkedAt, sets, and no set entry carries an extra key', async () => {
      const now = new Date('2026-08-16T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);
      mockOrderBy.mockResolvedValue([
        { setCode: 'SOR', lastSyncedAt: now.toISOString() },
      ]);

      const res = await handler(makeRequest({ Authorization: `Bearer ${SECRET}` }));
      const body = await res.json();

      expect(Object.keys(body).sort()).toEqual(['checkedAt', 'fresh', 'sets']);
      for (const set of body.sets) {
        expect(Object.keys(set).sort()).toEqual([
          'ageHours',
          'lastSyncedAt',
          'setCode',
          'stale',
        ]);
      }
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
