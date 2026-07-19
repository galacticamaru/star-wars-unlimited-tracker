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
  upsertTradeOffering: vi.fn(),
  upsertManualWant: vi.fn(),
  deleteManualWant: vi.fn(),
  addExclusion: vi.fn(),
  removeExclusion: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { upsertTradeOffering, upsertManualWant, deleteManualWant, addExclusion, removeExclusion } from '@/db/queries/trade';
import { db } from '@/db';

describe('Trade Binder APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.api.getSession as any).mockResolvedValue({ user: { id: '1' } });
  });

  describe('PATCH /api/trade', () => {
    it('updates trade quantity when the user owns the printing', async () => {
      // First db.select call = ownership check (userPrintingCollections); second = cardDefinitionId lookup
      const ownershipLimit = vi.fn().mockResolvedValue([{ count: 2 }]);
      const ownershipWhere = vi.fn().mockReturnValue({ limit: ownershipLimit });
      const ownershipFrom = vi.fn().mockReturnValue({ where: ownershipWhere });

      const printingLimit = vi.fn().mockResolvedValue([{ cardDefinitionId: 9 }]);
      const printingWhere = vi.fn().mockReturnValue({ limit: printingLimit });
      const printingFrom = vi.fn().mockReturnValue({ where: printingWhere });

      (db.select as any)
        .mockReturnValueOnce({ from: ownershipFrom })
        .mockReturnValueOnce({ from: printingFrom });

      const request = new NextRequest('http://localhost/api/trade', {
        method: 'PATCH',
        body: JSON.stringify({ cardPrintingId: 101, tradeQuantity: 5 }),
      });

      const response = await tradePATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(upsertTradeOffering).toHaveBeenCalledWith(1, 101, 5);
    });

    it('returns 403 and does not persist an offering for an unowned printing (T-30-01)', async () => {
      const ownershipLimit = vi.fn().mockResolvedValue([]);
      const ownershipWhere = vi.fn().mockReturnValue({ limit: ownershipLimit });
      const ownershipFrom = vi.fn().mockReturnValue({ where: ownershipWhere });

      (db.select as any).mockReturnValueOnce({ from: ownershipFrom });

      const request = new NextRequest('http://localhost/api/trade', {
        method: 'PATCH',
        body: JSON.stringify({ cardPrintingId: 101, tradeQuantity: 5 }),
      });

      const response = await tradePATCH(request);

      expect(response.status).toBe(403);
      expect(upsertTradeOffering).not.toHaveBeenCalled();
    });

    it('allows clearing an offering (tradeQuantity 0) without an ownership check', async () => {
      const printingLimit = vi.fn().mockResolvedValue([{ cardDefinitionId: 9 }]);
      const printingWhere = vi.fn().mockReturnValue({ limit: printingLimit });
      const printingFrom = vi.fn().mockReturnValue({ where: printingWhere });

      (db.select as any).mockReturnValueOnce({ from: printingFrom });

      const request = new NextRequest('http://localhost/api/trade', {
        method: 'PATCH',
        body: JSON.stringify({ cardPrintingId: 101, tradeQuantity: 0 }),
      });

      const response = await tradePATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(upsertTradeOffering).toHaveBeenCalledWith(1, 101, 0);
      // Only one db.select call (the cardDefinitionId lookup) — ownership check is skipped for quantity 0
      expect((db.select as any).mock.calls.length).toBe(1);
    });

    it('returns 401 if not authenticated', async () => {
      (auth.api.getSession as any).mockResolvedValue(null);
      const request = new NextRequest('http://localhost/api/trade', {
        method: 'PATCH',
        body: JSON.stringify({ cardPrintingId: 101, tradeQuantity: 5 }),
      });

      const response = await tradePATCH(request);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/binder/wants', () => {
    it('upserts manual want', async () => {
      const request = new NextRequest('http://localhost/api/binder/wants', {
        method: 'POST',
        body: JSON.stringify({ cardPrintingId: 202, quantity: 3 }),
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
        body: JSON.stringify({ cardPrintingId: 202, quantity: 0 }),
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
