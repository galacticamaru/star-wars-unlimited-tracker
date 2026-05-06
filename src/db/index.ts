import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// Required for neon-serverless to work in Node.js environments (local, build, and serverless functions)
neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Add it to .env.local for local dev or to Vercel environment variables for deployment.'
  );
}

const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool });
