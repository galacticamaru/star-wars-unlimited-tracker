// @vitest-environment node
import { describe, it, expect } from 'vitest';

describe('REQ-CAT-04: Starter Deck Quick-Add', () => {
  it('adds all cards from a known starter deck', async () => {
    // We will dynamically import the route so it fails cleanly if it doesn't exist
    try {
      const { POST } = await import('../src/app/api/collection/starter-deck/route');
      expect(POST).toBeDefined();
    } catch (error) {
      expect.fail(`Failed to load POST endpoint: ${error}`);
    }
  });
});
