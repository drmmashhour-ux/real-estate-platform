/**
 * Deletes only investor-demo rows (DEMO_ emails / DEMO titles). Safe additive script.
 *
 * Production guard: assertDemoWriteAllowed() — src/lib/sybnb/investor-demo-write-guard.ts
 */
import { PrismaClient } from "../src/generated/prisma";
import { assertDemoWriteAllowed } from "../src/lib/sybnb/investor-demo-write-guard";
import { resetInvestorDemoData } from "../src/lib/sybnb/investor-demo-reset";

const prisma = new PrismaClient();

async function main() {
  assertDemoWriteAllowed("reset");
  await resetInvestorDemoData(prisma);
  console.log("[investor-demo] reset complete (demo rows only).");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
