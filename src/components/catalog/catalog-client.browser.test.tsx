// @vitest-environment jsdom
import { describe, it } from 'vitest';

// Wave 0 stub — CatalogClient search/filter UI coverage (CATALOG-02, CATALOG-03)
// Full interactive testing requires browser with Next.js routing (see VALIDATION.md §Manual-Only)
describe('CatalogClient', () => {
  it.todo('renders search input with placeholder "Search cards..."');
  it.todo('renders Set, Type, Aspect filter dropdowns');
  it.todo('typing in search input reduces visible card count');
  it.todo('shows result count "N cards" above the grid');
  it.todo('shows EmptyState when no cards match the filter');
  it.todo('selecting a set filter applies AND logic with other active filters');
});
