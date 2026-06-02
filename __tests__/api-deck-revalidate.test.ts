// @vitest-environment node
// Wave 0 stub — asserts that PERF-07 revalidateTag calls are added to mutation handlers.
// Uses vi.mock for next/cache so that revalidateTag is a spy; the test currently FAILS
// (RED) because the handlers do not yet call revalidateTag. Will turn green in Plan 01.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Hoisted mocks (must be at top level so vi.mock hoisting works) ---

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: () => unknown) => fn),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => ({ user: { id: '7' } })),
    },
  },
}));

vi.mock('@/db/queries/decks', () => ({
  getDecks: vi.fn(async () => []),
  createDeck: vi.fn(async () => ({ id: 99, name: 'Test Deck', userId: 7, isDraft: true })),
  getDeckWithCards: vi.fn(async () => ({
    id: 5,
    name: 'Deck 5',
    userId: 7,
    isDraft: true,
    leaderCardDefinitionId: null,
    baseCardDefinitionId: null,
    cards: [],
  })),
  updateDeck: vi.fn(async () => 5),
  deleteDeck: vi.fn(async () => undefined),
  getCardsByDefinitionIds: vi.fn(async () => []),
}));

vi.mock('@/lib/deck-validation', () => ({
  validateDeck: vi.fn(() => ({ isValid: true, errors: [], warnings: [], stats: {} })),
}));

// --- Test suites ---

describe('POST /api/decks — revalidateTag after deck creation (PERF-07)', () => {
  let POST: (req: NextRequest) => Promise<Response>;
  let revalidateTag: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../src/app/api/decks/route');
    POST = mod.POST;
    const cache = await import('next/cache');
    revalidateTag = cache.revalidateTag as ReturnType<typeof vi.fn>;
  });

  it('calls revalidateTag("decks-user-7", "max") after creating a deck', async () => {
    const req = new NextRequest('http://localhost/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Deck' }),
    });

    await POST(req);

    expect(revalidateTag).toHaveBeenCalledWith('decks-user-7', 'max');
  });
});

describe('PATCH /api/decks/[id] — revalidateTag after deck update (PERF-07)', () => {
  let PATCH: (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
  ) => Promise<Response>;
  let revalidateTag: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../src/app/api/decks/[id]/route');
    PATCH = mod.PATCH;
    const cache = await import('next/cache');
    revalidateTag = cache.revalidateTag as ReturnType<typeof vi.fn>;
  });

  it('calls revalidateTag for deck-specific and user-list tags after draft save', async () => {
    const req = new NextRequest('http://localhost/api/decks/5', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDraft: true, name: 'Updated Name' }),
    });

    await PATCH(req, { params: Promise.resolve({ id: '5' }) });

    // Both the deck-specific tag and the user list tag must be busted (D-04)
    expect(revalidateTag).toHaveBeenCalledWith('deck-5-user-7', 'max');
    expect(revalidateTag).toHaveBeenCalledWith('decks-user-7', 'max');
  });
});

describe('DELETE /api/decks/[id] — revalidateTag after deck deletion (PERF-07)', () => {
  let DELETE: (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
  ) => Promise<Response>;
  let revalidateTag: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../src/app/api/decks/[id]/route');
    DELETE = mod.DELETE;
    const cache = await import('next/cache');
    revalidateTag = cache.revalidateTag as ReturnType<typeof vi.fn>;
  });

  it('calls revalidateTag for deck-specific and user-list tags after delete', async () => {
    const req = new NextRequest('http://localhost/api/decks/5', {
      method: 'DELETE',
    });

    await DELETE(req, { params: Promise.resolve({ id: '5' }) });

    // Both the deck-specific tag and the user list tag must be busted
    expect(revalidateTag).toHaveBeenCalledWith('deck-5-user-7', 'max');
    expect(revalidateTag).toHaveBeenCalledWith('decks-user-7', 'max');
  });
});
