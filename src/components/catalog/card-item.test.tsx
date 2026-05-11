/**
 * @vitest-environment jsdom
 */
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardItem } from './card-item';
import React from 'react';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const defaultProps = {
  id: 1,
  name: 'Vader',
  type: 'Unit',
  setCode: 'SOR',
  collectorNumber: 'SOR-010',
  frontArtUrl: '/vader.jpg',
  backArtUrl: null,
  ownedCount: 0,
};

test('renders card name in read-only modes', () => {
  render(<CardItem {...defaultProps} mode="binder" />);
  // The name is in the hover overlay
  expect(screen.getByText('Vader')).toBeDefined();
});

test('shows Available badge in binder mode', () => {
  render(<CardItem {...defaultProps} mode="binder" tradeQuantity={5} />);
  expect(screen.getByText('5 Available')).toBeDefined();
});

test('shows Needed badge in want mode', () => {
  render(<CardItem {...defaultProps} mode="want" lookingForQuantity={3} />);
  expect(screen.getByText('3 Needed')).toBeDefined();
});

test('shows owned count badge in catalog mode', () => {
  render(<CardItem {...defaultProps} mode="catalog" ownedCount={10} onUpdateCount={() => {}} />);
  // Check that "10" is rendered (it appears in both badge and controls)
  expect(screen.getAllByText('10').length).toBeGreaterThan(0);
});

test('does not show owned count badge in binder mode', () => {
  render(<CardItem {...defaultProps} mode="binder" ownedCount={10} tradeQuantity={5} />);
  // Total owned count (10) should be hidden in public binder
  expect(screen.queryByText('10')).toBeNull();
  expect(screen.getByText('5 Available')).toBeDefined();
});
