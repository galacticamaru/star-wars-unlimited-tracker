// @vitest-environment jsdom
import { describe, it } from 'vitest';

// Wave 0 stub — CardItem image render coverage (CATALOG-01)
// Full visual testing requires real browser (see VALIDATION.md §Manual-Only)
// These stubs satisfy Nyquist Wave 0 requirement.
describe('CardItem', () => {
  it.todo('renders a link to /cards/{setCode}/{cardNumber}');
  it.todo('renders next/image with fill and correct alt text');
  it.todo('container has aspect-[2/3] class for correct placeholder ratio');
  it.todo('shows animate-pulse before image loads');
  it.todo('removes animate-pulse after onLoad fires');
  it.todo('keeps grey box (no broken-image icon) when onError fires');
});
