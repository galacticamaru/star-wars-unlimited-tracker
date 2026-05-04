import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Add it to .env.local for local dev or to Vercel environment variables for deployment.'
  );
}
const sql = neon(databaseUrl);
export const db = drizzle({ client: sql });
