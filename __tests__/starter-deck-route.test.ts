// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/collection/starter-deck/route';
import { batchIncrementVariantCounts, batchRecomputeTotals } from '@/db/queries/collection';

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(() => Promise.resolve({ user: { id: '1' } })),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

const mockSelect = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => mockSelect()),
      })),
    })),
  },
}));

vi.mock('@/db/queries/collection', () => ({
  batchIncrementVariantCounts: vi.fn(() => Promise.resolve()),
  batchRecomputeTotals: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/data/starter-decks', () => ({
  starterDecks: [
    {
      id: 'luke-sor',
      name: 'Luke Skywalker (SOR)',
      cards: [
        { collectorNumber: 'SOR-001', qty: 2 },
        { collectorNumber: 'SOR-002', qty: 1 },
        { collectorNumber: 'SOR-003', qty: 3 },
      ],
    },
  ],
}));

import { auth } from '@/lib/auth';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/collection/starter-deck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/collection/starter-deck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: '1' } } as never);
  });

  it('returns 401 when there is no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as never);

    const res = await POST(makeRequest({ deckId: 'luke-sor' }));

    expect(res.status).toBe(401);
  });

  it('returns 400 when deckId is missing', async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it('returns 400 when deckId is unknown', async () => {
    const res = await POST(makeRequest({ deckId: 'nonexistent-deck' }));

    expect(res.status).toBe(400);
  });

  it('returns skipped: [] and cardsAdded === cardsRequested when every collector number resolves', async () => {
    mockSelect.mockResolvedValueOnce([
      { id: 1, collectorNumber: 'SOR-001', cardDefinitionId: 100 },
      { id: 2, collectorNumber: 'SOR-002', cardDefinitionId: 101 },
      { id: 3, collectorNumber: 'SOR-003', cardDefinitionId: 102 },
    ]);

    const res = await POST(makeRequest({ deckId: 'luke-sor' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.skipped).toEqual([]);
    expect(data.cardsAdded).toBe(data.cardsRequested);
    expect(data.cardsRequested).toBe(6);
  });

  it('reports the exact skipped collector numbers when two of three are missing', async () => {
    mockSelect.mockResolvedValueOnce([
      { id: 1, collectorNumber: 'SOR-001', cardDefinitionId: 100 },
    ]);

    const res = await POST(makeRequest({ deckId: 'luke-sor' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.skipped).toEqual(['SOR-002', 'SOR-003']);
    expect(data.cardsAdded).toBeLessThan(data.cardsRequested);
    expect(data.cardsAdded).toBe(2);
    expect(data.cardsRequested).toBe(6);
  });

  it('returns cardsAdded: 0 with a fully populated skipped array and status 200 when nothing resolves', async () => {
    mockSelect.mockResolvedValueOnce([]);

    const res = await POST(makeRequest({ deckId: 'luke-sor' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cardsAdded).toBe(0);
    expect(data.skipped).toEqual(['SOR-001', 'SOR-002', 'SOR-003']);
  });

  it('calls batchIncrementVariantCounts with only the resolved printing ids', async () => {
    mockSelect.mockResolvedValueOnce([
      { id: 1, collectorNumber: 'SOR-001', cardDefinitionId: 100 },
      { id: 3, collectorNumber: 'SOR-003', cardDefinitionId: 102 },
    ]);

    await POST(makeRequest({ deckId: 'luke-sor' }));

    expect(batchIncrementVariantCounts).toHaveBeenCalledWith(
      [
        { cardPrintingId: 1, qtyToAdd: 2 },
        { cardPrintingId: 3, qtyToAdd: 3 },
      ],
      1
    );
    expect(batchRecomputeTotals).toHaveBeenCalledWith([100, 102], 1);
  });
});
