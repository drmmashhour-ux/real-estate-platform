/**
 * Raw TCP auth test (outside Prisma). Run: pnpm tsx scripts/test-db-connection.ts
 */
import "./load-apps-web-env";

import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DB CONNECTION FAILED: DATABASE_URL is not set");
    process.exit(1);
  }
  try {
    await client.connect();
    console.log("DB CONNECTED");
    await client.end();
  } catch (err) {
    console.error("DB CONNECTION FAILED:", err);
    process.exit(1);
  }
}

void run();
