/**
 * Smoke checks for Senior Command Center aggregations (no HTTP — DB layer only).
 *
 *   cd apps/web && pnpm exec tsx scripts/senior-command-validation.ts
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import {
  getAreaInsights,
  getCommandAlerts,
  getHotLeads,
  getSeniorCommandKpis,
  getStuckDeals,
} from "@/modules/senior-living/command/senior-command.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  let failed = 0;
  try {
    const kpis = await getSeniorCommandKpis();
    if (kpis.leadsWeek < 0) failed++;
    console.log("PASS kpis");

    await getHotLeads(5);
    console.log("PASS hot leads query");

    await getStuckDeals(5);
    console.log("PASS stuck deals query");

    await getAreaInsights();
    console.log("PASS area insights");

    await getCommandAlerts();
    console.log("PASS alerts");
  } catch (e) {
    failed++;
    console.error("FAIL", e);
  }
  console.log(failed === 0 ? "\nPASS senior command validation\n" : "\nFAIL\n");
  process.exit(failed === 0 ? 0 : 1);
}

void main();
