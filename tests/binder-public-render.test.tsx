/**
 * @vitest-environment jsdom
 */
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PublicBinderPage from '@/app/binder/[username]/page';
import React from 'react';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock queries
vi.mock('@/db/queries/binder', () => ({
  getUserIdByUsername: vi.fn(),
  getPublicBinderData: vi.fn(),
}));

vi.mock('@/db/queries/catalog', () => ({
  getFilterOptions: vi.fn(),
}));

// Mock components
vi.mock('@/components/binder/public-binder-client', () => ({
  PublicBinderClient: ({ username }: any) => <div>{username}'s Trade Binder</div>,
}));

test('renders public binder page', async () => {
  const { getUserIdByUsername, getPublicBinderData } = await import('@/db/queries/binder');
  const { getFilterOptions } = await import('@/db/queries/catalog');

  (getUserIdByUsername as any).mockResolvedValue(1);
  (getPublicBinderData as any).mockResolvedValue({
    offerings: [],
    lookingFor: [],
  });
  (getFilterOptions as any).mockResolvedValue({
    sets: [],
    types: [],
  });

  const page = await PublicBinderPage({ params: Promise.resolve({ username: 'testuser' }) });
  render(page);

  expect(screen.getByText(/testuser's Trade Binder/i)).toBeDefined();
});
