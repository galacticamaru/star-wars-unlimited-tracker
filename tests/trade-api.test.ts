// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH as tradePATCH } from '@/app/api/trade/route';
import { POST as wantsPOST } from '@/app/api/binder/wants/route';
import { POST as exclusionsPOST } from '@/app/api/binder/exclusions/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/db/queries/trade', () => ({
  upsertTradeQuantity: vi.fn(),
  upsertManualWant: vi.fn(),
  deleteManualWant: vi.fn(),
  addExclusion: vi.fn(),
  removeExclusion: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { upsertTradeQuantity, upsertManualWant, deleteManualWant, addExclusion, removeExclusion } from '@/db/queries/trade';

describe('Trade Binder APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.api.getSession as any).mockResolvedValue({ user: { id: '1' } });
  });

  describe('PATCH /api/trade', () => {
    it('updates trade quantity', async () => {
      const request = new NextRequest('http://localhost/api/trade', {
        method: 'PATCH',
        body: JSON.stringify({ cardDefinitionId: 101, tradeQuantity: 5 }),
      });

      const response = await tradePATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(upsertTradeQuantity).toHaveBeenCalledWith(1, 101, 5);
    });

    it('returns 401 if not authenticated', async () => {
      (auth.api.getSession as any).mockResolvedValue(null);
      const request = new NextRequest('http://localhost/api/trade', {
        method: 'PATCH',
        body: JSON.stringify({ cardDefinitionId: 101, tradeQuantity: 5 }),
      });

      const response = await tradePATCH(request);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/binder/wants', () => {
    it('upserts manual want', async () => {
      const request = new NextRequest('http://localhost/api/binder/wants', {
        method: 'POST',
        body: JSON.stringify({ cardDefinitionId: 202, quantity: 3 }),
      });

      const response = await wantsPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(upsertManualWant).toHaveBeenCalledWith(1, 202, 3);
    });

    it('deletes manual want if quantity is 0', async () => {
      const request = new NextRequest('http://localhost/api/binder/wants', {
        method: 'POST',
        body: JSON.stringify({ cardDefinitionId: 202, quantity: 0 }),
      });

      const response = await wantsPOST(request);
      expect(response.status).toBe(200);
      expect(deleteManualWant).toHaveBeenCalledWith(1, 202);
    });
  });

  describe('POST /api/binder/exclusions', () => {
    it('adds exclusion', async () => {
      const request = new NextRequest('http://localhost/api/binder/exclusions', {
        method: 'POST',
        body: JSON.stringify({ cardDefinitionId: 303, excluded: true }),
      });

      const response = await exclusionsPOST(request);
      expect(response.status).toBe(200);
      expect(addExclusion).toHaveBeenCalledWith(1, 303);
    });

    it('removes exclusion', async () => {
      const request = new NextRequest('http://localhost/api/binder/exclusions', {
        method: 'POST',
        body: JSON.stringify({ cardDefinitionId: 303, excluded: false }),
      });

      const response = await exclusionsPOST(request);
      expect(response.status).toBe(200);
      expect(removeExclusion).toHaveBeenCalledWith(1, 303);
    });
  });
});
