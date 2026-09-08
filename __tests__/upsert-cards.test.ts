// @vitest-environment node
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

import { upsertCards, syncAllCards, normalizeStringArray } from '@/lib/sync/upsert-cards';
import { db } from '@/db';

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

  // Local helper (syncAllCards tests only — the `upsertCards` describe block's
  // beforeEach is untouched): builds a working db.insert() chain — insert ->
  // values -> onConflictDoUpdate -> returning — modelled on that block's setup,
  // so individual tests below can make a DB write throw or make .returning()
  // resolve to an empty array to exercise the two per-set-isolation DB paths.
  function setupWorkingDbInsertChain() {
    let lastValuesArg: Record<string, unknown>[] = [];
    let idCounter = 1;
    const mockReturning = vi.fn(() =>
      Promise.resolve(
        lastValuesArg.map((row) => ({ id: idCounter++, swudbId: row.swudbId as string }))
      )
    );
    const mockOnConflict = vi.fn().mockReturnValue({
      returning: mockReturning,
      then: (resolve: (v: unknown) => void) => resolve([]),
    });
    const mockValues = vi.fn((arg: unknown) => {
      lastValuesArg = Array.isArray(arg)
        ? (arg as Record<string, unknown>[])
        : [arg as Record<string, unknown>];
      return { onConflictDoUpdate: mockOnConflict };
    });
    const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
    return { mockInsert, mockReturning };
  }

  // Three-set list shared by the four new per-set-isolation tests below —
  // only SOR (index 0) fails in each case, so "later sets still process" and
  // set-list ordering are both asserted inline against SHD and TWI.
  const THREE_SET_LIST = [
    { setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 1 },
    { setId: 'SHD', fullName: 'Shadows of the Galaxy', numberCards: 1 },
    { setId: 'TWI', fullName: 'Twilight of the Republic', numberCards: 1 },
  ];

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

  it('uses an injected sets array without fetching /sets', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const injectedSets = [
      { setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 1 },
      { setId: 'SHD', fullName: 'Shadows of the Galaxy', numberCards: 1 },
    ];

    const result = await syncAllCards({ sets: injectedSets });

    const fetchCalls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(fetchCalls.some((url: string) => url.includes('api.swu-db.com/sets'))).toBe(false);
    expect(fetchCalls.some((url: string) => url.includes('/cards/SOR'))).toBe(true);
    expect(fetchCalls.some((url: string) => url.includes('/cards/SHD'))).toBe(true);
    expect(result.setsTotal).toBe(2);
    expect(result.setsProcessed).toBe(2);
  });

  it('resolves with no argument, keeping scripts/seed.ts working', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 1 }],
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const result = await syncAllCards();
    expect(result.setsTotal).toBe(1);
  });

  it('a deadlineAt already in the past leaves setsProcessed at 0 and lists every set as unprocessed', async () => {
    const injectedSets = [
      { setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 1 },
      { setId: 'SHD', fullName: 'Shadows of the Galaxy', numberCards: 1 },
    ];
    const pastDeadline = Date.now() - 1000;

    const result = await syncAllCards({ sets: injectedSets, deadlineAt: pastDeadline });

    expect(result.setsProcessed).toBe(0);
    expect(result.unprocessedSets).toEqual(['SOR', 'SHD']);
    expect(result.deadlineHit).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(
      result.setsProcessed + result.failedSets.length + result.unprocessedSets.length
    ).toBe(result.setsTotal);
  });

  it('a set whose cards fetch fails appears in failedSets while later sets still process', async () => {
    const injectedSets = [
      { setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 1 },
      { setId: 'SHD', fullName: 'Shadows of the Galaxy', numberCards: 1 },
    ];

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/cards/SOR')) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });

    const result = await syncAllCards({ sets: injectedSets });

    expect(result.failedSets).toEqual(['SOR']);
    expect(result.setsProcessed).toBe(1);
    expect(
      result.setsProcessed + result.failedSets.length + result.unprocessedSets.length
    ).toBe(result.setsTotal);
  });

  it('two consecutive calls with the same past deadlineAt return identical unprocessedSets — no state carries between runs', async () => {
    const injectedSets = [
      { setId: 'SOR', fullName: 'Spark of Rebellion', numberCards: 1 },
      { setId: 'SHD', fullName: 'Shadows of the Galaxy', numberCards: 1 },
    ];
    const pastDeadline = Date.now() - 1000;

    const first = await syncAllCards({ sets: injectedSets, deadlineAt: pastDeadline });
    const second = await syncAllCards({ sets: injectedSets, deadlineAt: pastDeadline });

    expect(first.unprocessedSets).toEqual(second.unprocessedSets);
    expect(first.unprocessedSets).toEqual(['SOR', 'SHD']);
  });

  it('a rejected cards fetch lands the set in failedSets and later sets still process', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/cards/SOR')) {
        return Promise.reject(new Error('network blip: ECONNRESET'));
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });

    // Never a bare await — a rejecting syncAllCards() would surface here as an
    // unhandled rejection instead of a clean assertion failure (CR-01 gap 1).
    const resultPromise = syncAllCards({ sets: THREE_SET_LIST });
    await expect(resultPromise).resolves.toBeDefined();
    const result = await resultPromise;

    expect(result.failedSets).toEqual(['SOR']);
    expect(result.setsProcessed).toBe(2);
    expect(
      result.setsProcessed + result.failedSets.length + result.unprocessedSets.length
    ).toBe(result.setsTotal);

    const fetchCalls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(fetchCalls.some((url: string) => url.includes('/cards/SHD'))).toBe(true);
    expect(fetchCalls.some((url: string) => url.includes('/cards/TWI'))).toBe(true);
    // No reattempt: exactly one fetch to /cards/SOR, no delay-and-retry.
    const sorCalls = fetchCalls.filter((url: string) => url.includes('/cards/SOR'));
    expect(sorCalls.length).toBe(1);
  });

  it('a cards response with no data key lands the set in failedSets and later sets still process', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/cards/SOR')) {
        // No `data` key — destructuring `{ data: cards }` leaves `cards`
        // undefined, and upsertCards()'s `.filter()` call throws a TypeError.
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });

    const resultPromise = syncAllCards({ sets: THREE_SET_LIST });
    await expect(resultPromise).resolves.toBeDefined();
    const result = await resultPromise;

    expect(result.failedSets).toEqual(['SOR']);
    expect(result.setsProcessed).toBe(2);
    expect(
      result.setsProcessed + result.failedSets.length + result.unprocessedSets.length
    ).toBe(result.setsTotal);

    const fetchCalls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(fetchCalls.some((url: string) => url.includes('/cards/SHD'))).toBe(true);
    expect(fetchCalls.some((url: string) => url.includes('/cards/TWI'))).toBe(true);
  });

  it('a DB write error inside upsertCards lands the set in failedSets and later sets still process', async () => {
    const { db } = await import('@/db');
    const { mockInsert, mockReturning } = setupWorkingDbInsertChain();
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(mockInsert);
    // Only the first .returning() call (SOR's card_definitions insert) rejects —
    // a constraint-violation-style DB error surfacing mid-upsertCards().
    mockReturning.mockRejectedValueOnce(
      new Error('duplicate key value violates unique constraint "card_definitions_swudb_id_key"')
    );

    mockFetch.mockImplementation((url: string) => {
      const setId = url.includes('/cards/SOR')
        ? 'SOR'
        : url.includes('/cards/SHD')
          ? 'SHD'
          : 'TWI';
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [makeCard({ Set: setId, Number: '001', Name: `Card ${setId}`, Subtitle: '' })],
        }),
      });
    });

    const resultPromise = syncAllCards({ sets: THREE_SET_LIST });
    await expect(resultPromise).resolves.toBeDefined();
    const result = await resultPromise;

    expect(result.failedSets).toEqual(['SOR']);
    expect(result.setsProcessed).toBe(2);
    expect(
      result.setsProcessed + result.failedSets.length + result.unprocessedSets.length
    ).toBe(result.setsTotal);

    const fetchCalls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(fetchCalls.some((url: string) => url.includes('/cards/SHD'))).toBe(true);
    expect(fetchCalls.some((url: string) => url.includes('/cards/TWI'))).toBe(true);
  });

  it('the deliberate unresolved-swudbId throw inside upsertCards lands the set in failedSets, not an uncaught rejection', async () => {
    const { db } = await import('@/db');
    const { mockInsert, mockReturning } = setupWorkingDbInsertChain();
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(mockInsert);
    // SOR's definitions RETURNING resolves empty — idBySwudbId has no entry
    // for its anchor, so Phase D's unresolved-swudbId Error fires (this
    // phase's own deliberate throw, per upsert-cards.ts Phase D).
    mockReturning.mockResolvedValueOnce([]);

    mockFetch.mockImplementation((url: string) => {
      const setId = url.includes('/cards/SOR')
        ? 'SOR'
        : url.includes('/cards/SHD')
          ? 'SHD'
          : 'TWI';
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [makeCard({ Set: setId, Number: '001', Name: `Card ${setId}`, Subtitle: '' })],
        }),
      });
    });

    const resultPromise = syncAllCards({ sets: THREE_SET_LIST });
    await expect(resultPromise).resolves.toBeDefined();
    const result = await resultPromise;

    expect(result.failedSets).toEqual(['SOR']);
    expect(result.setsProcessed).toBe(2);
    expect(
      result.setsProcessed + result.failedSets.length + result.unprocessedSets.length
    ).toBe(result.setsTotal);

    const fetchCalls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(fetchCalls.some((url: string) => url.includes('/cards/SHD'))).toBe(true);
    expect(fetchCalls.some((url: string) => url.includes('/cards/TWI'))).toBe(true);
  });
});

describe('upsertCards', () => {
  // Set up mock DB chain: db.insert().values(array).onConflictDoUpdate().returning()
  // .values() now receives a chunked ARRAY of rows (batched upsert), not a single
  // row object — every assertion below reads call[0] as an array and indexes into it.
  let mockReturning: ReturnType<typeof vi.fn>;
  let mockOnConflict: ReturnType<typeof vi.fn>;
  let mockValues: ReturnType<typeof vi.fn>;
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockWhere: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let lastValuesArg: Record<string, unknown>[];
  let idCounter: number;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { db } = await import('@/db');

    lastValuesArg = [];
    idCounter = 1;

    // .returning() echoes back { id, swudbId } for every row in the array most
    // recently passed to .values() — derived from each row's own swudbId column,
    // never from array position. Tests can override this with mockImplementationOnce
    // to prove the real code doesn't rely on RETURNING order matching insert order.
    mockReturning = vi.fn(() =>
      Promise.resolve(
        lastValuesArg.map((row) => ({ id: idCounter++, swudbId: row.swudbId as string }))
      )
    );
    mockOnConflict = vi.fn().mockReturnValue({
      returning: mockReturning,
      // Also make it thenable for code paths that await .onConflictDoUpdate() directly
      // without calling .returning() (card_printings inserts).
      then: (resolve: (v: unknown) => void) => resolve([]),
    });
    mockValues = vi.fn((arg: unknown) => {
      lastValuesArg = Array.isArray(arg)
        ? (arg as Record<string, unknown>[])
        : [arg as Record<string, unknown>];
      return { onConflictDoUpdate: mockOnConflict };
    });
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
    // 2 batched inserts for the one non-token card group (card_definitions + card_printings)
    expect(insertCalls).toBe(2);
  });

  it('constructs collector_number as Set-Number format', async () => {
    const card = makeCard({ Set: 'SOR', Number: '059', VariantType: 'Normal' });

    await upsertCards('SOR', [card] as never);

    // Find the call that inserts card_printings (its array's first row has collectorNumber)
    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const printingInsertCall = allValueCalls.find(
      (call: unknown[]) =>
        Array.isArray(call[0]) &&
        (call[0] as Record<string, unknown>[])[0]?.collectorNumber !== undefined
    );
    expect(printingInsertCall).toBeDefined();
    expect((printingInsertCall![0] as Record<string, unknown>[])[0].collectorNumber).toBe(
      'SOR-059'
    );
  });

  it('parses Cost, Power, HP as integers', async () => {
    const card = makeCard({ Cost: '3', Power: '5', HP: '7', VariantType: 'Normal' });

    await upsertCards('SOR', [card] as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const definitionInsertCall = allValueCalls.find(
      (call: unknown[]) =>
        Array.isArray(call[0]) && (call[0] as Record<string, unknown>[])[0]?.cost !== undefined
    );
    const definitionRow = (definitionInsertCall![0] as Record<string, unknown>[])[0];
    expect(definitionRow.cost).toBe(3);
    expect(definitionRow.power).toBe(5);
    expect(definitionRow.hp).toBe(7);
  });

  it('stores null for missing Cost/Power/HP', async () => {
    const card = makeCard({ Cost: undefined, Power: undefined, HP: undefined, VariantType: 'Normal' });

    await upsertCards('SOR', [card] as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const definitionInsertCall = allValueCalls.find(
      (call: unknown[]) =>
        Array.isArray(call[0]) && 'cost' in ((call[0] as Record<string, unknown>[])[0] ?? {})
    );
    const definitionRow = (definitionInsertCall![0] as Record<string, unknown>[])[0];
    expect(definitionRow.cost).toBeNull();
  });

  it('Normal variants upsert card_definitions with swudb_id = Set-Number', async () => {
    const card = makeCard({
      Set: 'SOR',
      Number: '179',
      Name: 'Boba Fett',
      Subtitle: 'A Valued Associate',
      VariantType: 'Normal',
    });

    await upsertCards('SOR', [card] as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const definitionInsertCall = allValueCalls.find(
      (call: unknown[]) =>
        Array.isArray(call[0]) && (call[0] as Record<string, unknown>[])[0]?.swudbId !== undefined
    );
    expect((definitionInsertCall![0] as Record<string, unknown>[])[0].swudbId).toBe('SOR-179');
  });

  it('Normal and Hyperspace variants of the same card share one card_definition insert (in-memory grouping)', async () => {
    // In-memory grouping: both variants grouped by Name|Subtitle key before any DB op.
    // One batched card_definitions insert carrying one row (anchor = Normal), one
    // batched card_printings insert carrying two rows, zero SELECT calls.
    const normalCard = makeCard({
      Set: 'SOR',
      Number: '179',
      Name: 'Boba Fett',
      Subtitle: 'A Valued Associate',
      VariantType: 'Normal',
    });
    const hyperspaceCard = makeCard({
      Set: 'SOR',
      Number: '281',
      Name: 'Boba Fett',
      Subtitle: 'A Valued Associate',
      VariantType: 'Hyperspace',
    });

    await upsertCards('SOR', [normalCard, hyperspaceCard] as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;

    // card_definitions upserted once — a single call whose array has one row
    // (anchor = Normal — swudbId = SOR-179)
    const definitionInsertCalls = allValueCalls.filter(
      (call: unknown[]) =>
        Array.isArray(call[0]) && (call[0] as Record<string, unknown>[])[0]?.swudbId !== undefined
    );
    expect(definitionInsertCalls).toHaveLength(1);
    const definitionRows = definitionInsertCalls[0][0] as Record<string, unknown>[];
    expect(definitionRows).toHaveLength(1);
    expect(definitionRows[0].swudbId).toBe('SOR-179');

    // card_printings upserted in one batched call carrying both variants
    const printingInsertCalls = allValueCalls.filter(
      (call: unknown[]) =>
        Array.isArray(call[0]) &&
        (call[0] as Record<string, unknown>[])[0]?.collectorNumber !== undefined
    );
    expect(printingInsertCalls).toHaveLength(1);
    const printingRows = printingInsertCalls[0][0] as Record<string, unknown>[];
    expect(printingRows).toHaveLength(2);

    // No DB SELECT — in-memory grouping eliminates the name+subtitle lookup
    expect((mockSelect as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it('does not skip TS## sets like TS26', async () => {
    const card = makeCard({ Set: 'TS26', Number: '001', VariantType: 'Normal' });
    const count = await upsertCards('TS26', [card] as never);
    expect(count).toBe(1);
  });

  it('a set of 501 distinct card groups produces exactly 2 definitions inserts with array lengths 500 and 1', async () => {
    const cards = Array.from({ length: 501 }, (_, i) =>
      makeCard({
        Name: `Card ${i}`,
        Subtitle: '',
        Set: 'SOR',
        Number: String(i).padStart(4, '0'),
        VariantType: 'Normal',
      })
    );

    await upsertCards('SOR', cards as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const definitionInsertCalls = allValueCalls.filter(
      (call: unknown[]) =>
        Array.isArray(call[0]) && (call[0] as Record<string, unknown>[])[0]?.swudbId !== undefined
    );
    expect(definitionInsertCalls).toHaveLength(2);
    expect((definitionInsertCalls[0][0] as unknown[]).length).toBe(500);
    expect((definitionInsertCalls[1][0] as unknown[]).length).toBe(1);
  });

  it('exactly 500 groups produces exactly 1 definitions insert', async () => {
    const cards = Array.from({ length: 500 }, (_, i) =>
      makeCard({
        Name: `Card ${i}`,
        Subtitle: '',
        Set: 'SOR',
        Number: String(i).padStart(4, '0'),
        VariantType: 'Normal',
      })
    );

    await upsertCards('SOR', cards as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const definitionInsertCalls = allValueCalls.filter(
      (call: unknown[]) =>
        Array.isArray(call[0]) && (call[0] as Record<string, unknown>[])[0]?.swudbId !== undefined
    );
    expect(definitionInsertCalls).toHaveLength(1);
    expect((definitionInsertCalls[0][0] as unknown[]).length).toBe(500);
  });

  it('an empty card array performs zero insert calls and resolves to 0', async () => {
    const count = await upsertCards('SOR', [] as never);
    expect(count).toBe(0);
    expect((mockInsert as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it('an all-token card array performs zero insert calls and resolves to 0', async () => {
    const cards = [makeCard({ Type: 'Token Unit' }), makeCard({ Type: 'token upgrade' })];
    const count = await upsertCards('SOR', cards as never);
    expect(count).toBe(0);
    expect((mockInsert as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it('a mockReturning that reverses RETURNING row order still links each printing to its own anchor id', async () => {
    mockReturning.mockImplementationOnce(() =>
      Promise.resolve([
        { id: 555, swudbId: 'SOR-0002' },
        { id: 777, swudbId: 'SOR-0001' },
      ])
    );

    const cardA = makeCard({
      Name: 'Alpha',
      Subtitle: '',
      Set: 'SOR',
      Number: '0001',
      VariantType: 'Normal',
    });
    const cardB = makeCard({
      Name: 'Beta',
      Subtitle: '',
      Set: 'SOR',
      Number: '0002',
      VariantType: 'Normal',
    });

    await upsertCards('SOR', [cardA, cardB] as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;
    const printingInsertCall = allValueCalls.find(
      (call: unknown[]) =>
        Array.isArray(call[0]) &&
        (call[0] as Record<string, unknown>[])[0]?.cardDefinitionId !== undefined
    );
    expect(printingInsertCall).toBeDefined();
    const printingRows = printingInsertCall![0] as Record<string, unknown>[];
    const idByCollectorNumber = new Map(
      printingRows.map((r) => [r.collectorNumber, r.cardDefinitionId])
    );
    expect(idByCollectorNumber.get('SOR-0001')).toBe(777);
    expect(idByCollectorNumber.get('SOR-0002')).toBe(555);
  });

  it('two group entries sharing the same anchor swudbId are deduplicated into one row', async () => {
    const cardA = makeCard({
      Name: 'Card A',
      Subtitle: 'X',
      Set: 'SOR',
      Number: '001',
      VariantType: 'Normal',
    });
    const cardB = makeCard({
      Name: 'Card B',
      Subtitle: 'Y',
      Set: 'SOR',
      Number: '001',
      VariantType: 'Normal',
    });

    await upsertCards('SOR', [cardA, cardB] as never);

    const allValueCalls = (mockValues as ReturnType<typeof vi.fn>).mock.calls;

    const definitionInsertCalls = allValueCalls.filter(
      (call: unknown[]) =>
        Array.isArray(call[0]) && (call[0] as Record<string, unknown>[])[0]?.swudbId !== undefined
    );
    expect(definitionInsertCalls).toHaveLength(1);
    expect((definitionInsertCalls[0][0] as unknown[]).length).toBe(1);

    const printingInsertCalls = allValueCalls.filter(
      (call: unknown[]) =>
        Array.isArray(call[0]) &&
        (call[0] as Record<string, unknown>[])[0]?.collectorNumber !== undefined
    );
    expect(printingInsertCalls).toHaveLength(1);
    expect((printingInsertCalls[0][0] as unknown[]).length).toBe(1);
  });
});

// Regression: api.swu-db.com serves Aspects/Traits as single-key wrapper objects
// (`[{"S":"Vigilance"}]`), not the bare strings the older responses returned. Those
// columns are text[], so an object reaching the insert stringified to the literal
// "[object Object]" and corrupted every synced row — collapsing the catalog's Aspect
// dropdown to one junk entry, because the option list is built from
// `new Set(cards.flatMap(c => c.aspects))` and identical bad strings dedupe to one.
//
// The pre-fix fixtures above encode the OLD contract by hand (`Aspects: ['Heroism']`),
// which is exactly why the suite stayed green while production broke. These cases pin
// the wrapper shape so a future revert cannot silently reintroduce the corruption.
describe('normalizeStringArray — upstream shape tolerance', () => {
  it('unwraps single-key wrapper objects to their string value', () => {
    expect(normalizeStringArray([{ S: 'Vigilance' }])).toEqual(['Vigilance']);
  });

  it('unwraps a multi-aspect card in payload order', () => {
    expect(normalizeStringArray([{ S: 'Vigilance' }, { S: 'Villainy' }])).toEqual([
      'Vigilance',
      'Villainy',
    ]);
  });

  it('passes bare strings through unchanged, so an upstream revert is a no-op', () => {
    expect(normalizeStringArray(['Heroism', 'Command'])).toEqual(['Heroism', 'Command']);
  });

  it('handles a mixed-shape array during an upstream transition', () => {
    expect(normalizeStringArray(['Heroism', { S: 'Villainy' }])).toEqual([
      'Heroism',
      'Villainy',
    ]);
  });

  it('returns an empty array for absent or non-array input rather than coercing', () => {
    expect(normalizeStringArray(undefined)).toEqual([]);
    expect(normalizeStringArray(null)).toEqual([]);
    expect(normalizeStringArray('Heroism')).toEqual([]);
  });

  it('drops non-string members instead of letting them reach a text[] column', () => {
    expect(normalizeStringArray([1, true, null, { S: 42 }, ['x']])).toEqual([]);
  });
});

describe('upsertCards — wrapper-shaped aspects reach the DB as plain strings', () => {
  it('never writes "[object Object]" into aspects or traits', async () => {
    const mockValues = vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1, swudbId: 'SOR-059' }]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockValues });

    const card = makeCard({
      Aspects: [{ S: 'Vigilance' }, { S: 'Villainy' }],
      Traits: [{ S: 'DROID' }],
      Arenas: ['Ground'],
    });

    await upsertCards('SOR', [card] as never);

    const definitionRow = mockValues.mock.calls
      .map((call: unknown[]) => call[0])
      .filter(
        (arg): arg is Record<string, unknown>[] =>
          Array.isArray(arg) && (arg[0] as Record<string, unknown>)?.swudbId !== undefined
      )[0][0];

    expect(definitionRow.aspects).toEqual(['Vigilance', 'Villainy']);
    expect(definitionRow.traits).toEqual(['DROID']);
    expect(definitionRow.arenas).toEqual(['Ground']);

    // The actual production symptom, asserted directly.
    const serialized = JSON.stringify(definitionRow);
    expect(serialized).not.toContain('[object Object]');
  });
});
