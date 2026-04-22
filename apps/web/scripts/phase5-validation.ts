/**
 * Phase 5 — Capital stack, lender workflow, offers, financing conditions, closing readiness.
 * Run from apps/web: pnpm exec tsx scripts/phase5-validation.ts
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { createCapitalStack } from "@/modules/capital/capital-stack.service";
import { evaluateClosingReadiness } from "@/modules/capital/closing-readiness.service";
import { updateFinancingConditionStatus } from "@/modules/capital/financing-conditions.service";
import { addLender, markPackageSent } from "@/modules/capital/lender.service";
import { addOffer, compareOffers, selectOffer } from "@/modules/capital/lender-offer.service";
import { createStandaloneDeal } from "@/modules/deals/deal.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  console.log("\n========== Phase 5 capital pipeline validation ==========\n");
  let failed = 0;

  const broker = await prisma.user.findFirst({ where: { role: "BROKER" }, select: { id: true } });
  if (!broker) {
    console.log("SKIP — no BROKER in DB");
    process.exit(0);
  }

  try {
    const deal = await createStandaloneDeal({
      brokerId: broker.id,
      title: "Phase 5 validation deal",
      dealType: "ACQUISITION",
      actorUserId: broker.id,
    });

    await createCapitalStack(
      deal.id,
      {
        totalPurchasePrice: 850_000,
        equityAmount: 170_000,
        debtAmount: 680_000,
      },
      broker.id
    );

    const l1 = await addLender(deal.id, { lenderName: "Bank A" }, broker.id);
    const l2 = await addLender(deal.id, { lenderName: "Bank B" }, broker.id);

    await markPackageSent(l1.id, broker.id);
    await markPackageSent(l2.id, broker.id);

    await addOffer(deal.id, l1.id, { offeredAmount: 680_000, interestRate: 5.2, termYears: 25 }, broker.id);
    await addOffer(deal.id, l2.id, { offeredAmount: 675_000, interestRate: 5.0, termYears: 25 }, broker.id);

    await compareOffers(deal.id, broker.id);

    const offers = await prisma.lecipmPipelineDealLenderOffer.findMany({
      where: { dealId: deal.id },
      orderBy: { interestRate: "asc" },
    });
    const pick = offers[0];
    if (!pick) {
      console.log("FAIL no offers");
      failed++;
    } else {
      await selectOffer(pick.id, broker.id);
    }

    const fConds = await prisma.lecipmPipelineDealFinancingCondition.findMany({
      where: { dealId: deal.id },
    });
    if (fConds.length === 0) {
      console.log("FAIL financing conditions not generated");
      failed++;
    } else {
      console.log(`PASS financing conditions (${fConds.length})`);
    }

    for (const c of fConds) {
      await updateFinancingConditionStatus(c.id, {
        status: "SATISFIED",
        actorUserId: broker.id,
        actorRole: "BROKER",
      });
    }

    const ev = await evaluateClosingReadiness(deal.id, broker.id);
    if (ev.readinessStatus !== "READY" && ev.readinessStatus !== "CONDITIONAL") {
      console.log(`FAIL readiness ${ev.readinessStatus}`);
      failed++;
    } else {
      console.log(`PASS closing readiness: ${ev.readinessStatus}`);
    }

    const stage = await prisma.lecipmPipelineDeal.findUnique({
      where: { id: deal.id },
      select: { pipelineStage: true },
    });
    if (stage?.pipelineStage !== "EXECUTION") {
      console.log(`FAIL expected EXECUTION got ${stage?.pipelineStage}`);
      failed++;
    } else {
      console.log("PASS deal stage EXECUTION");
    }

    console.log("\n----------");
    if (failed === 0) console.log("PASS — Phase 5 validation\n");
    else console.log(`FAIL — ${failed} check(s)\n`);

    process.exit(failed === 0 ? 0 : 1);
  } catch (e) {
    console.error(e);
    console.log("\nFAIL — exception\n");
    process.exit(1);
  }
}

main();
