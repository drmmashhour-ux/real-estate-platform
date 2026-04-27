/**
 * Prisma-based smoke test (uses @/lib/db). For raw TCP check, use test-db.ts.
 * Run: pnpm tsx scripts/test-db-prisma.ts
 */
import { prisma } from "../lib/db";

async function main() {
  try {
    console.log("Testing DB connection via Prisma...");
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("DB Result:", result);
    process.exit(0);
  } catch (e) {
    console.error("DB Error:", e);
    process.exit(1);
  }
}

void main();
