/**
 * Dev script: `pnpm exec tsx scripts/run-growth-brain.ts` (from apps/web)
 * Requires DATABASE_URL and optionally CRON_SECRET for parity (not used here).
 */
import { PrismaClient } from "@prisma/client";
import { runGrowthBrainEngine } from "../lib/growth-brain/engine";

async function main() {
  const prisma = new PrismaClient();
  try {
    const r = await runGrowthBrainEngine(prisma);
    console.log(JSON.stringify(r, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
