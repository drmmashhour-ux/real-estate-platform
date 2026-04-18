/**
 * LECIPM Full System Validation v1 — end-to-end tunnel runner (DB + HTTP).
 *
 *   pnpm --filter @lecipm/web run validate:lecipm-system
 *
 * Requires: DATABASE_URL, deps installed. For HTTP tunnels, run the Next dev server or set VALIDATION_BASE_URL.
 */
import { config } from "dotenv";
import { resolve } from "node:path";

import { prisma } from "@/lib/db";
import { runLecipmValidationSuite } from "@/modules/testing/test-runner.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  console.log("\n========== LECIPM Full System Validation v1 ==========\n");
  try {
    await prisma.$connect();
    const report = await runLecipmValidationSuite();

    console.log("\n========== SUMMARY ==========");
    console.log(JSON.stringify(report, null, 2));

    const exitCode = report.recommendation === "GO" && report.failed === 0 ? 0 : 1;
    if (exitCode !== 0) {
      console.error("\n[validate:lecipm-system] FAILED or NO_GO — see tests/reports/final-report.json");
    } else {
      console.log("\n[validate:lecipm-system] Completed.");
    }
    process.exit(exitCode);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
