// @vitest-environment jsdom
// Wave 0 stub — covers PERF-04 progress text behavior
// Tests use jsdom rendering of CollectionPage
// Full integration validation: manual smoke test after Wave 1 deployment
// Requirement: PERF-04 (card count in status text for CSV Import and Quick Add)
import { describe, it } from 'vitest';

describe('CollectionPage progress text (PERF-04)', () => {
  it.todo('CSV Import uploading status renders "Importing {N} cards..." where N is normalized.length set before fetch fires');
  it.todo('CSV Import success status renders "Done! {N} cards imported." with count from API response');
  it.todo('Quick Add button label renders "Adding {N} cards from {deckName}..." during deckStatus loading');
  it.todo('Quick Add success status renders "Added {N} cards from {deckName} to your collection." after success');
  it.todo('CSV import card count state is set before fetch is invoked (not from response)');
});
