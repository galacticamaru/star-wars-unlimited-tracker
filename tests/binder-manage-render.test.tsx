/**
 * @vitest-environment jsdom
 */
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ManageBinderPage from '@/app/binder/manage/page';
import { authClient } from '@/lib/auth-client';
import React from 'react';

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    user: {
      update: vi.fn(),
    },
  },
}));

// Mock fetch
global.fetch = vi.fn();

test('renders ManageBinderPage and shows loading state', () => {
  (authClient.useSession as any).mockReturnValue({
    data: null,
    isPending: true,
  });

  const { container } = render(<ManageBinderPage />);
  expect(container.querySelector('.animate-spin')).not.toBeNull();
});

test('renders Unauthorized message when not logged in', () => {
  (authClient.useSession as any).mockReturnValue({
    data: null,
    isPending: false,
  });

  render(<ManageBinderPage />);
  expect(screen.getByText(/Please login to manage your trade binder/i)).toBeDefined();
});

test('renders management UI when logged in', async () => {
  (authClient.useSession as any).mockReturnValue({
    data: {
      user: {
        id: '1',
        username: 'testuser',
      },
    },
    isPending: false,
  });

  (global.fetch as any).mockImplementation((url: string) => {
    if (url === '/api/binder') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ offerings: [], manualWants: [], exclusions: [] }),
      });
    }
    if (url === '/api/cards/all') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    return Promise.reject(new Error('Unknown URL'));
  });

  render(<ManageBinderPage />);
  
  // Wait for loading to finish
  const title = await screen.findByText(/Manage Trade Binder/i);
  expect(title).toBeDefined();
  expect(screen.getByText(/Trade Profile/i)).toBeDefined();
  expect(screen.getByText(/Add Cards/i)).toBeDefined();
});
