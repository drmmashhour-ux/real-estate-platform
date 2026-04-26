/**
 * Raw Postgres check (not Prisma). Loads DATABASE_URL from env files in merge order (last wins).
 *
 * Usage (from apps/web):
 *   node scripts/verify-pg-database-connection.cjs
 *
 * After Neon password reset, paste the full connection string into apps/web/.env.local (and root .env if you use it).
 */

const path = require("path");
const { config } = require("dotenv");
const { Client } = require("pg");

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(__dirname, "../..");

function loadEnvFile(filePath) {
  const r = config({ path: filePath, override: true });
  if (r.error && r.error.code !== "ENOENT") {
    console.warn("dotenv:", filePath, r.error.message);
  }
}

// Weakest → strongest (typical monorepo pattern)
loadEnvFile(path.join(repoRoot, ".env"));
loadEnvFile(path.join(repoRoot, ".env.local"));
loadEnvFile(path.join(webRoot, ".env"));
loadEnvFile(path.join(webRoot, ".env.local"));

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("FAIL: DATABASE_URL is empty after loading:");
    console.error("  -", path.join(repoRoot, ".env"));
    console.error("  -", path.join(repoRoot, ".env.local"));
    console.error("  -", path.join(webRoot, ".env"));
    console.error("  -", path.join(webRoot, ".env.local"));
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    await client.query("SELECT 1 AS ok");
    console.log("CONNECTED (no error) — raw pg OK");
    await client.end();
    process.exit(0);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FAIL:", msg);
    if (/password authentication failed|P1000|28P01/i.test(msg)) {
      console.error("Hint: reset role password in Neon → copy full connection string → update DATABASE_URL everywhere.");
    }
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

main();
