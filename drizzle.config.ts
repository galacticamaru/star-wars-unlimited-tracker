import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Match the rest of the project (db:seed, Next.js) which use .env.local.
config({ path: '.env.local' });
config(); // fall back to .env if present

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set — check .env or .env.local');

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url },
});
