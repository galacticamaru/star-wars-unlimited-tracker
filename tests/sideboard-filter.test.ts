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

describe('Sideboard Filter Regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('excludes sideboard cards from looking for calculation', async () => {
    const userId = 123;
    const mockDecks = [{ id: 456, leaderCardDefinitionId: null, baseCardDefinitionId: null }];
    
    // We want to capture the calls to db.select().from().where()
    // Specially when from(deckCards) is called.

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
          // Handle decks query
          // In Drizzle, eq(decks.userId, userId) results in a SQL object or similar
          // For mocking, we can just check what we return based on call order or some heuristic
          return Promise.resolve([]);
        })
      };
    });

    // Setup the mock sequence for getPublicBinderData
    // 1. Offerings
    // 2. Inventory
    // 3. Manual Wants
    // 4. Exclusions
    // 5. Decks
    // 6. DeckCards (if decks.length > 0)
    
    (db.select as any).mockReturnValue({ from: mockFrom });

    // We need to return mockDecks for the 5th query (decks)
    // and we need it to go into the if (userDecks.length > 0) block
    
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
    
    // Check for isSideboard filter
    // When we use 'and', it usually has a 'filters' property
    // For now it's just an inArray which has 'column' and 'values'
    
    const hasSideboardFilter = (clause: any): boolean => {
      if (!clause) return false;
      if (clause.left && clause.left.name === 'is_sideboard') return true;
      if (clause.filters) {
        return clause.filters.some((f: any) => hasSideboardFilter(f));
      }
      return false;
    };

    expect(hasSideboardFilter(capturedWhereClause)).toBe(true);
  });
});
