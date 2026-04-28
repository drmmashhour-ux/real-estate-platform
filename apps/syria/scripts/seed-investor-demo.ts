/**
 * Sy-only investor demo seed — fake data, DEMO_ emails / titles. No real PII.
 *   cd apps/syria && DEMO_DATA_ENABLED=true pnpm exec tsx scripts/seed-investor-demo.ts
 *
 * Production guard: assertDemoWriteAllowed() — implemented in src/lib/sybnb/investor-demo-write-guard.ts (called below before any DB write).
 */
import { PrismaClient } from "../src/generated/prisma";
import { executeInvestorDemoSeed } from "../src/lib/sybnb/investor-demo-seed";

const prisma = new PrismaClient();

async function main() {
  await executeInvestorDemoSeed(prisma);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
