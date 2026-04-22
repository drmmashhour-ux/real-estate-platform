/**
 * Validates AI CEO decision generation + guarded execution.
 *
 *   cd apps/web && npx tsx scripts/ceo-validation.ts
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { gatherMarketSignals, runCeo, approveCeoDecision, executeCeoDecision } from "@/modules/ceo-ai/ceo-ai.service";
import { generateCeoDecisions } from "@/modules/ceo-ai/ceo-ai-decision.engine";
import type { CeoMarketSignals } from "@/modules/ceo-ai/ceo-ai.types";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  console.log("\n========== AI CEO validation ==========\n");
  let failed = 0;

  try {
    const base = await gatherMarketSignals();

    const lowConv: CeoMarketSignals = {
      ...base,
      seniorConversionRate30d: 0.03,
      leadsLast30d: 42,
      demandIndex: 0.36,
      churnInactiveBrokersApprox: Math.max(base.churnInactiveBrokersApprox, 20),
    };
    const genLow = await generateCeoDecisions(lowConv, { maxDecisions: 14 });
    console.log(`Scenario A (low conversion): ${genLow.proposedDecisions.length} proposal(s)`);

    const hotDemand: CeoMarketSignals = {
      ...base,
      demandIndex: 0.74,
      leadsLast30d: 60,
      leadsPrev30d: 35,
      seniorConversionRate30d: 0.095,
    };
    const genHot = await generateCeoDecisions(hotDemand, { maxDecisions: 14 });
    console.log(`Scenario B (high demand): ${genHot.proposedDecisions.length} proposal(s)`);

    const churnRisk: CeoMarketSignals = {
      ...base,
      churnInactiveBrokersApprox: 28,
      revenueTrend30dProxy: -0.08,
    };
    const genChurn = await generateCeoDecisions(churnRisk, { maxDecisions: 14 });
    console.log(`Scenario C (churn risk): ${genChurn.proposedDecisions.length} proposal(s)`);

    const run = await runCeo("manual");
    console.log(`runCeo: persisted ${run.persistedIds.length} row(s)`);

    if (run.persistedIds.length > 0) {
      let picked: string | null = null;
      for (const id of run.persistedIds) {
        const row = await prisma.ceoDecision.findUnique({
          where: { id },
          select: { requiresApproval: true, domain: true },
        });
        if (row && !row.requiresApproval) {
          picked = id;
          break;
        }
      }
      if (picked) {
        await approveCeoDecision(picked, "ceo-validation-script");
        await executeCeoDecision(picked);
        const done = await prisma.ceoDecision.findUnique({ where: { id: picked } });
        if (done?.status !== "EXECUTED") failed++;
        else console.log(`PASS approve → execute (${done.domain})`);
      } else {
        console.log("INFO no auto-eligible proposal to execute — approve flow still validated via API routes");
      }
    }
  } catch (e) {
    console.log(`FAIL: ${e instanceof Error ? e.message : e}`);
    failed++;
  }

  console.log(failed ? `\n❌ Completed with ${failed} failure(s)\n` : "\n✅ CEO validation passed\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
