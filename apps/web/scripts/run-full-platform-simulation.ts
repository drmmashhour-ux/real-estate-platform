#!/usr/bin/env npx tsx
/**
 * LECIPM Full Platform End-to-End Simulation v1
 *
 *   cd apps/web
 *   E2E_SIMULATION_LIVE_STRIPE=1 pnpm exec tsx scripts/run-full-platform-simulation.ts
 *
 * Writes: tests/reports/final-e2e-report.json + .md
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { prisma } from "../lib/db";
import { runFullPlatformSimulation } from "../modules/e2e-simulation/e2e-simulation.service";

config({ path: resolve(process.cwd(), ".env"), override: true });

async function main() {
  const report = await runFullPlatformSimulation({
    writeReports: true,
  });
  console.log(JSON.stringify({ decision: report.decision, scenarios: report.scenarios.length }, null, 2));
  await prisma.$disconnect();
  process.exit(report.decision === "NO_GO" ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
