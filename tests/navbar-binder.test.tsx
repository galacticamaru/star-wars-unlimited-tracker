/**
 * @vitest-environment jsdom
 */
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavBar } from '@/components/nav-bar';
import { authClient } from '@/lib/auth-client';
import React from 'react';

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

// Mock usePathname
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

test('NavBar does not show My Binder when not logged in', () => {
  (authClient.useSession as any).mockReturnValue({
    data: null,
    isPending: false,
  });

  render(<NavBar />);
  expect(screen.queryByText(/My Binder/i)).toBeNull();
});

test('NavBar shows My Binder when logged in', () => {
  (authClient.useSession as any).mockReturnValue({
    data: {
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    isPending: false,
  });

  render(<NavBar />);
  const link = screen.getByText(/My Binder/i);
  expect(link).toBeDefined();
  expect(link.getAttribute('href')).toBe('/binder/manage');
});
