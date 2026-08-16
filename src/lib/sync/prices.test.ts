// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB module — tests should not hit Neon
vi.mock('@/db', () => ({
  db: {
    update: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  cardDefinitions: {
    swudbId: 'swudb_id',
    id: 'id',
    priceEur: 'price_eur',
    priceUsd: 'price_usd',
  },
}));

vi.mock('@/lib/sync/set-list', () => ({
  getNonTokenSets: vi.fn(),
}));

// Mock global fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { mapPriceData, syncPrices, type SWUDBCard } from './prices';
import { getNonTokenSets } from '@/lib/sync/set-list';

describe('mapPriceData', () => {
  it('should map valid MarketPrice to integer cents for both USD and EUR', () => {
    const mockCard: SWUDBCard = {
      Set: 'SOR',
      Number: '001',
      Name: 'Test Card',
      VariantType: 'Normal',
      MarketPrice: '10.00'
    };

    const result = mapPriceData(mockCard);
    expect(result.priceUsd).toBe(1000);
    expect(result.priceEur).toBe(920); // 10.00 * 0.92 * 100
  });

  it('should handle missing MarketPrice', () => {
    const mockCard: SWUDBCard = {
      Set: 'SOR',
      Number: '001',
      Name: 'Test Card',
      VariantType: 'Normal',
      MarketPrice: undefined
    };

    const result = mapPriceData(mockCard);
    expect(result.priceEur).toBeNull();
    expect(result.priceUsd).toBeNull();
  });

  it('should handle invalid MarketPrice', () => {
    const mockCard: SWUDBCard = {
      Set: 'SOR',
      Number: '001',
      Name: 'Test Card',
      VariantType: 'Normal',
      MarketPrice: 'invalid'
    };

    const result = mapPriceData(mockCard);
    expect(result.priceEur).toBeNull();
    expect(result.priceUsd).toBeNull();
  });
});

describe('syncPrices', () => {
  let mockReturning: ReturnType<typeof vi.fn>;
  let mockWhere: ReturnType<typeof vi.fn>;
  let mockSet: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    const { db } = await import('@/db');

    // Single-row update chain: db.update(...).set(...).where(...).returning(...)
    mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
    mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
    mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
    (db.update as ReturnType<typeof vi.fn>).mockImplementation(mockUpdate);
  });

  it('derives the set list from getNonTokenSets() and fetches prices for ASH, LOF and TS26', async () => {
    (getNonTokenSets as ReturnType<typeof vi.fn>).mockResolvedValue([
      { setId: 'ASH', fullName: 'Ashes of the Empire', numberCards: 1 },
      { setId: 'LOF', fullName: 'Legends of the Force', numberCards: 1 },
      { setId: 'TS26', fullName: 'Twin Suns', numberCards: 1 },
    ]);
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

    await syncPrices();

    const fetchCalls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(fetchCalls.some((url: string) => url.includes('set:ash'))).toBe(true);
    expect(fetchCalls.some((url: string) => url.includes('set:lof'))).toBe(true);
    expect(fetchCalls.some((url: string) => url.includes('set:ts26'))).toBe(true);
    expect(getNonTokenSets).toHaveBeenCalledTimes(1);
  });

  it('an injected sets option suppresses the getNonTokenSets() call', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
    const injectedSets = [{ setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 1 }];

    const result = await syncPrices({ sets: injectedSets });

    expect(getNonTokenSets).not.toHaveBeenCalled();
    expect(result.setsTotal).toBe(1);
  });

  it('a set whose fetch rejects appears in failedSets with setsProcessed strictly less than setsTotal, while a later set still processes', async () => {
    const injectedSets = [
      { setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 1 },
      { setId: 'SHD', fullName: 'Shadows of the Galaxy', numberCards: 1 },
    ];
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('set:sor')) {
        return Promise.reject(new Error('network error'));
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const result = await syncPrices({ sets: injectedSets });

    expect(result.failedSets).toEqual(['SOR']);
    expect(result.setsProcessed).toBe(1);
    expect(result.setsProcessed).toBeLessThan(result.setsTotal);
    expect(
      result.setsProcessed + result.failedSets.length + result.unprocessedSets.length
    ).toBe(result.setsTotal);
  });

  it('a failing set is attempted exactly once per run — no retry fetch for the same set code', async () => {
    const injectedSets = [{ setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 1 }];
    mockFetch.mockRejectedValue(new Error('boom'));

    await syncPrices({ sets: injectedSets });

    const sorCalls = mockFetch.mock.calls.filter((c: unknown[]) =>
      (c[0] as string).includes('set:sor')
    );
    expect(sorCalls).toHaveLength(1);
  });

  it('a past deadlineAt yields deadlineHit true with every set in unprocessedSets', async () => {
    const injectedSets = [
      { setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 1 },
      { setId: 'SHD', fullName: 'Shadows of the Galaxy', numberCards: 1 },
    ];
    const pastDeadline = Date.now() - 1000;

    const result = await syncPrices({ sets: injectedSets, deadlineAt: pastDeadline });

    expect(result.deadlineHit).toBe(true);
    expect(result.unprocessedSets).toEqual(['SOR', 'SHD']);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(
      result.setsProcessed + result.failedSets.length + result.unprocessedSets.length
    ).toBe(result.setsTotal);
  });

  it('resolves when called with no argument (scripts/sync-prices-now.ts and scripts/test-sync.ts contract)', async () => {
    (getNonTokenSets as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await syncPrices();

    expect(result.setsTotal).toBe(0);
    expect(result.sets).toEqual([]);
  });
});
