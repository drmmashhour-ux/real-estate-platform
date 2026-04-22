/**
 * Broker deal pipeline (LECIPM) — Phase 4 service-level validation.
 *   pnpm exec tsx scripts/pipeline-deal-phase4-validation.ts
 *   pnpm run validate:pipeline-deal:phase4
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { createTransaction } from "@/modules/transactions/transaction.service";
import { createDealFromTransaction } from "@/modules/deals/deal.service";
import { recordCommitteeDecision, submitToCommittee } from "@/modules/deals/deal-committee.service";
import { listConditions, updateConditionStatus } from "@/modules/deals/deal-conditions.service";
import { createTask, updateTaskStatus } from "@/modules/deals/deal-diligence.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  console.log("\n========== Pipeline deal Phase 4 validation ==========\n");
  let failed = 0;

  const broker = await prisma.user.findFirst({ where: { role: "BROKER" }, select: { id: true } });
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!broker) {
    console.log("SKIP — no BROKER in DB");
    process.exit(0);
  }
  if (!admin) {
    console.log("FAIL — need an ADMIN user to record committee decision");
    process.exit(1);
  }

  try {
    const tx = await createTransaction(
      { brokerId: broker.id, transactionType: "SALE", title: "Pipeline P4 validation" },
      "BROKER"
    );

    const deal = await createDealFromTransaction({
      transactionId: tx.id,
      brokerId: broker.id,
      actorUserId: broker.id,
    });

    await submitToCommittee(deal.id, "Ready for IC review — Phase 4 smoke", broker.id);

    await recordCommitteeDecision({
      dealId: deal.id,
      recommendation: "PROCEED_WITH_CONDITIONS",
      rationale:
        "Proceed subject to documented conditions including financing and execution of agreements.",
      confidenceLevel: "HIGH",
      decidedByUserId: admin.id,
    });

    const refreshed = await prisma.lecipmPipelineDeal.findUnique({ where: { id: deal.id } });
    if (refreshed?.pipelineStage !== "CONDITIONAL_APPROVAL") {
      console.log(`FAIL stage expected CONDITIONAL_APPROVAL got ${refreshed?.pipelineStage}`);
      failed++;
    } else {
      console.log("PASS stage CONDITIONAL_APPROVAL");
    }

    const conditions = await listConditions(deal.id);
    if (conditions.length === 0) {
      console.log("FAIL expected conditions generated");
      failed++;
    } else {
      console.log(`PASS conditions created (${conditions.length})`);
    }

    const first = conditions[0];
    await updateConditionStatus(first.id, "SATISFIED", { actorUserId: broker.id });

    const task = await createTask(
      deal.id,
      {
        title: "Verify disclosure package",
        category: "DOCUMENT",
        priority: "HIGH",
      },
      broker.id
    );

    await updateTaskStatus(task.id, "COMPLETED", broker.id);

    const audits = await prisma.lecipmPipelineDealAuditEvent.count({ where: { dealId: deal.id } });
    if (audits < 3) {
      console.log(`FAIL audit trail thin (count ${audits})`);
      failed++;
    } else {
      console.log(`PASS audit events (${audits})`);
    }

    console.log("\n----------");
    if (failed === 0) console.log("PASS — Phase 4 validation\n");
    else console.log(`FAIL — ${failed} check(s)\n`);

    process.exit(failed === 0 ? 0 : 1);
  } catch (e) {
    console.error(e);
    console.log("\nFAIL — exception\n");
    process.exit(1);
  }
}

main();
