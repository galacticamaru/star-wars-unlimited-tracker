import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicBinderData } from '@/db/queries/binder';
import { db } from '@/db';
import { deckCards } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/binder-logic', () => ({
  calculateLookingFor: vi.fn().mockReturnValue(0),
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    and: vi.fn((...args) => ({ type: 'and', filters: args })),
    eq: vi.fn((col, val) => ({ type: 'eq', column: col, value: val })),
    inArray: vi.fn((col, vals) => ({ type: 'inArray', column: col, values: vals })),
  };
});

describe('Sideboard Filter Regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('excludes sideboard cards from looking for calculation', async () => {
    const userId = 123;
    const mockDecks = [{ id: 456, leaderCardDefinitionId: null, baseCardDefinitionId: null }];
    
    let capturedWhereClause: any = null;

    const mockWhere = vi.fn().mockImplementation((clause) => {
      capturedWhereClause = clause;
      return Promise.resolve([]);
    });

    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === deckCards) {
        return { where: mockWhere };
      }
      return {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation((clause) => {
          return Promise.resolve([]);
        })
      };
    });

    (db.select as any).mockReturnValue({ from: mockFrom });

    let queryCount = 0;
    mockFrom.mockImplementation((table) => {
      queryCount++;
      const currentQuery = queryCount;
      
      return {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation((clause) => {
          if (currentQuery === 5) { // Decks query
            return Promise.resolve(mockDecks);
          }
          if (table === deckCards) {
            capturedWhereClause = clause;
            return Promise.resolve([]);
          }
          return Promise.resolve([]);
        })
      };
    });

    await getPublicBinderData(userId);

    expect(capturedWhereClause).toBeDefined();
    
    // With mocked operators, capturedWhereClause should look like:
    // { type: 'and', filters: [ { type: 'inArray', ... }, { type: 'eq', ... } ] }
    
    const hasSideboardFilter = (clause: any): boolean => {
      if (!clause) return false;
      if (clause.type === 'eq' && clause.column === deckCards.isSideboard && clause.value === false) return true;
      if (clause.type === 'and' && Array.isArray(clause.filters)) {
        return clause.filters.some(hasSideboardFilter);
      }
      return false;
    };

    expect(hasSideboardFilter(capturedWhereClause)).toBe(true);
  });
});
