/**
 * Raw Postgres connection (no Prisma). Load env the same way as Prisma CLI.
 * Run: pnpm tsx scripts/test-db.ts
 */
import "./load-apps-web-env";

import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

void (async () => {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DB FAILED: DATABASE_URL is not set (check apps/web/.env and .env.local)");
    process.exit(1);
  }
  try {
    await client.connect();
    console.log("DB CONNECTED");
    await client.end();
  } catch (e) {
    console.error("DB FAILED:", e);
    process.exit(1);
  }
})();
