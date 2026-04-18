/**
 * CLI: LECIPM Real User Simulation v1 (writes tests/reports/ux-simulation-report.json).
 *
 *   pnpm --filter @lecipm/web run simulate:users
 */
import { config } from "dotenv";
import { resolve } from "node:path";

import { prisma } from "@/lib/db";
import { runUserSimulationEngine } from "@/modules/simulation/user-simulation.engine";
import { writeUserSimulationReport } from "@/modules/simulation/simulation-report.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  try {
    await prisma.$connect();
    const report = await runUserSimulationEngine();
    writeUserSimulationReport(report);
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

void main();
