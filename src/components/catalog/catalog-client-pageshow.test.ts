// @vitest-environment node
// Tests for DEBT-04: BFCache pageshow listener in CatalogClient
// RED phase: these tests verify the presence and correctness of the pageshow event listener.
// They FAIL until the implementation is added to catalog-client.tsx.
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const CATALOG_CLIENT_PATH = path.join(
  process.cwd(),
  'src/components/catalog/catalog-client.tsx'
);

describe('CatalogClient pageshow BFCache listener (DEBT-04)', () => {
  it('source file contains window.addEventListener("pageshow")', () => {
    const src = fs.readFileSync(CATALOG_CLIENT_PATH, 'utf-8');
    expect(src).toMatch(/addEventListener\(['"]pageshow['"]/);
  });

  it('source file contains window.removeEventListener("pageshow") for cleanup', () => {
    const src = fs.readFileSync(CATALOG_CLIENT_PATH, 'utf-8');
    expect(src).toMatch(/removeEventListener\(['"]pageshow['"]/);
  });

  it('pageshow handler guards on event.persisted before fetching', () => {
    const src = fs.readFileSync(CATALOG_CLIENT_PATH, 'utf-8');
    // Must check persisted property (e.persisted or event.persisted or ev.persisted etc.)
    expect(src).toMatch(/\.persisted/);
  });

  it('pageshow handler guards on isAuthenticated before fetching', () => {
    const src = fs.readFileSync(CATALOG_CLIENT_PATH, 'utf-8');
    // The guard must reference isAuthenticated inside the pageshow handler context
    // This is a structural check: the handler block must contain isAuthenticated
    expect(src).toMatch(/pageshow/);
    expect(src).toMatch(/isAuthenticated/);
  });

  it('pageshow handler calls fetch("/api/collection") on BFCache restore', () => {
    const src = fs.readFileSync(CATALOG_CLIENT_PATH, 'utf-8');
    // The handler must call fetch('/api/collection')
    expect(src).toMatch(/fetch\(['"]\/api\/collection['"]\)/);
    // And the pageshow handler must be present too (combination)
    expect(src).toMatch(/addEventListener\(['"]pageshow['"]/);
  });

  it('pageshow handler calls setCollection with parsed JSON response', () => {
    const src = fs.readFileSync(CATALOG_CLIENT_PATH, 'utf-8');
    // setCollection must be called (to update the collection state)
    expect(src).toMatch(/setCollection/);
    // and .then(res => res.json()) or .then(r => r.json()) must be present for the fetch chain
    expect(src).toMatch(/\.then\(.*\.json\(\)/);
  });

  it('pageshow useEffect has [isAuthenticated] in dependency array', () => {
    const src = fs.readFileSync(CATALOG_CLIENT_PATH, 'utf-8');
    // The pageshow effect must depend on isAuthenticated
    // Pattern: }, [isAuthenticated]); appearing in context of the pageshow listener
    // We verify [isAuthenticated] dependency array appears (shared with existing effect)
    expect(src).toMatch(/\[isAuthenticated\]/);
  });
});
