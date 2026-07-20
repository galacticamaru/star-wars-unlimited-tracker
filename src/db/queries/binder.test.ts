// @vitest-environment node
// Query-shape test for getUserIdByUsername (BINDER-17 data path).
// Mocks only this query's db.select().from().where().limit() chain — does NOT
// attempt to mock getPublicBinderData's much larger query surface (fragile per
// 21-REVIEW.md), mirroring the narrow-mock pattern in collection.test.ts.
import { describe, it, vi, expect, beforeEach } from 'vitest';

const { limitMock, whereMock, fromMock, selectMock } = vi.hoisted(() => {
  const limitMock = vi.fn();
  const whereMock = vi.fn(() => ({ limit: limitMock }));
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  return { limitMock, whereMock, fromMock, selectMock };
});

vi.mock('@/db', () => ({
  db: {
    select: selectMock,
  },
}));

import { getUserIdByUsername } from './binder';

beforeEach(() => {
  vi.clearAllMocks();
  limitMock.mockReset();
  whereMock.mockImplementation(() => ({ limit: limitMock }));
  fromMock.mockImplementation(() => ({ where: whereMock }));
  selectMock.mockImplementation(() => ({ from: fromMock }));
});

describe('getUserIdByUsername()', () => {
  it('returns { id, tradeNote } when a matching user row is found', async () => {
    limitMock.mockResolvedValue([{ id: 42, tradeNote: 'EU only, will ship' }]);

    const result = await getUserIdByUsername('SomeUser');

    expect(result).toEqual({ id: 42, tradeNote: 'EU only, will ship' });
  });

  it('returns null when no user row matches', async () => {
    limitMock.mockResolvedValue([]);

    const result = await getUserIdByUsername('nobody');

    expect(result).toBeNull();
  });
});
