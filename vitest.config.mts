import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    // DEBT-05 (34-04): scope to the DATABASE_ prefix only (least privilege) —
    // AUTH_SECRET and every other .env.local value must not reach the test
    // environment. Only __tests__/starter-decks-resolve.test.ts needs this.
    env: loadEnv(mode, process.cwd(), 'DATABASE_'),
  },
}));
