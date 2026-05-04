import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    environmentMatchGlobs: [
      // Use jsdom only for UI/browser tests — server-side tests use the node default
      ['**/*.browser.test.{ts,tsx}', 'jsdom'],
    ],
  },
});
