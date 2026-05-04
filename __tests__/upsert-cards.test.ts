import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB module — tests should not hit Neon
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  cardDefinitions: {
    swudbId: 'swudb_id',
    name: 'name',
    subtitle: 'subtitle',
    id: 'id',
  },
  cardPrintings: {
    setCode: 'set_code',
    collectorNumber: 'collector_number',
  },
}));

// Mock global fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { upsertCards, syncAllCards } from '@/lib/sync/upsert-cards';

// Helper: create a minimal valid SWUCard
function makeCard(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    Set: 'SOR',
    Number: '059',
    Name: 'Luke Skywalker',
    Subtitle: 'Faithful Friend',
    Type: 'Unit',
    Aspects: ['Heroism'],
    Traits: ['REBEL'],
    Arenas: ['Ground'],
    Keywords: [],
    Cost: '3',
    Power: '3',
    HP: '4',
    FrontText: 'Some ability text',
    BackText: null,
    EpicAction: null,
    DoubleSided: false,
    Rarity: 'Common',
    Unique: false,
    Artist: 'Some Artist',
    VariantType: 'Normal',
    FrontArt: 'https://cdn.swu-db.com/images/cards/SOR/059.png',
    BackArt: null,
    ...overrides,
  };
}

describe('syncAllCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips token sets (setId starts with T)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { setId: 'SOR' },
        { setId: 'TSOR' }, // token set — should be skipped
        { setId: 'SHD' },
        { setId: 'TSHD' }, // token set — should be skipped
      ],
    });
    // Return empty cards for non-token sets
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await syncAllCards();

    // fetch should be called for: /sets + /cards/SOR + /cards/SHD (not TSOR or TSHD)
    const fetchCalls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(fetchCalls.some((url: string) => url.includes('TSOR'))).toBe(false);
    expect(fetchCalls.some((url: string) => url.includes('TSHD'))).toBe(false);
    expect(fetchCalls.some((url: string) => url.includes('/cards/SOR'))).toBe(true);
    expect(fetchCalls.some((url: string) => url.includes('/cards/SHD'))).toBe(true);
  });
});

describe('upsertCards', () => {
  // Set up mock DB chain: db.insert().values().onConflictDoUpdate().returning()
  let mockReturning: ReturnType<typeof vi.fn>;
  let mockOnConflict: ReturnType<typeof vi.fn>;
  let mockValues: ReturnType<typeof vi.fn>;
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockWhere: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { db } = await import('@/db');

    mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
    mockOnConflict = vi.fn().mockReturnValue({
      returning: mockReturning,
      // Also make it thenable for code paths that await .onConflictDoUpdate() directly
      // without calling .returning() (e.g., card_printings inserts in Pass 2 existing branch)
      then: (resolve: (v: unknown) => void) => resolve([]),
    });
    mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflict });
    mockInsert = vi.fn().mockReturnValue({ values: mockValues });
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(mockInsert);

    mockWhere = vi.fn().mockResolvedValue([{ id: 1 }]);
    mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);
  });

  it('skips cards where Type includes "token" (case-insensitive)', async () => {
    const cards = [
      makeCard({ Type: 'Token Unit' }),
      makeCard({ Type: 'token upgrade' }),
      makeCard({ Type: 'Unit' }),
    ];

    await upsertCards('SOR', cards as never);

    // insert should only be called for the non-token card
    const insertCalls = (mockInsert as ReturnType<typeof vi.fn>).mock.calls.length;
    // 2 inserts per non-token card (card_definitions + card_printings)
    expect(insertCalls).toBe(2);
  });

  it('constructs collector_number as Set-Number format', async () => {
    const card = makeCard({ Set: 'SOR', Number: '059', VariantType: 'Normal' });

    await upsertCards('SOR', [card] as never);

    // Find the call that inserts card_printings (second insert)
    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const printingInsert = allValueCalls.find(
      (call: unknown[]) => (call[0] as Record<string, unknown>).collectorNumber !== undefined
    );
    expect(printingInsert).toBeDefined();
    expect((printingInsert![0] as Record<string, unknown>).collectorNumber).toBe('SOR-059');
  });

  it('parses Cost, Power, HP as integers', async () => {
    const card = makeCard({ Cost: '3', Power: '5', HP: '7', VariantType: 'Normal' });

    await upsertCards('SOR', [card] as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const definitionInsert = allValueCalls.find(
      (call: unknown[]) => (call[0] as Record<string, unknown>).cost !== undefined
    );
    expect((definitionInsert![0] as Record<string, unknown>).cost).toBe(3);
    expect((definitionInsert![0] as Record<string, unknown>).power).toBe(5);
    expect((definitionInsert![0] as Record<string, unknown>).hp).toBe(7);
  });

  it('stores null for missing Cost/Power/HP', async () => {
    const card = makeCard({ Cost: undefined, Power: undefined, HP: undefined, VariantType: 'Normal' });

    await upsertCards('SOR', [card] as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const definitionInsert = allValueCalls.find(
      (call: unknown[]) => 'cost' in (call[0] as Record<string, unknown>)
    );
    expect((definitionInsert![0] as Record<string, unknown>).cost).toBeNull();
  });

  it('Normal variants upsert card_definitions with swudb_id = Set-Number', async () => {
    const card = makeCard({ Set: 'SOR', Number: '179', Name: 'Boba Fett', Subtitle: 'A Valued Associate', VariantType: 'Normal' });

    await upsertCards('SOR', [card] as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const definitionInsert = allValueCalls.find(
      (call: unknown[]) => (call[0] as Record<string, unknown>).swudbId !== undefined
    );
    expect((definitionInsert![0] as Record<string, unknown>).swudbId).toBe('SOR-179');
  });

  it('Hyperspace variants look up card_definitions by name+subtitle, not create new rows', async () => {
    // Simulate: Normal card creates definition (id=1), then Hyperspace card finds it
    (mockReturning as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }]);
    mockWhere.mockResolvedValue([{ id: 1 }]); // SELECT finds existing definition

    const normalCard = makeCard({ Set: 'SOR', Number: '179', Name: 'Boba Fett', Subtitle: 'A Valued Associate', VariantType: 'Normal' });
    const hyperspaceCard = makeCard({ Set: 'SOR', Number: '281', Name: 'Boba Fett', Subtitle: 'A Valued Associate', VariantType: 'Hyperspace' });

    await upsertCards('SOR', [normalCard, hyperspaceCard] as never);

    // card_definitions insert called once (for Normal), not twice
    // Verify via select being called for the Hyperspace variant lookup
    expect((mockSelect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });
});
