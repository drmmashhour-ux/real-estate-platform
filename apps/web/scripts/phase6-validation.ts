/**
 * Phase 6 — Closing room, asset onboarding, transaction archive.
 * Run from apps/web: pnpm exec tsx scripts/phase6-validation.ts
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { createCapitalStack } from "@/modules/capital/capital-stack.service";
import {
  importFinalDocs,
  verifyDocument,
} from "@/modules/closing/closing-document.service";
import { updateChecklistItemStatus } from "@/modules/closing/closing-checklist.service";
import { evaluateClosing } from "@/modules/closing/closing-validation.service";
import { completeClosing, initializeClosing } from "@/modules/closing/closing.service";
import { createDealFromTransaction } from "@/modules/deals/deal.service";
import { transitionPipelineStage } from "@/modules/deals/deal-stage.service";
import { createTransaction } from "@/modules/transactions/transaction.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  console.log("\n========== Phase 6 closing room validation ==========\n");
  let failed = 0;

  const broker = await prisma.user.findFirst({ where: { role: "BROKER" }, select: { id: true } });
  if (!broker) {
    console.log("SKIP — no BROKER in DB");
    process.exit(0);
  }

  try {
    const tx = await createTransaction(
      { brokerId: broker.id, transactionType: "SALE", title: "Phase 6 validation TX" },
      "BROKER"
    );

    await prisma.lecipmSdTransactionParty.createMany({
      data: [
        { transactionId: tx.id, role: "BUYER", displayName: "Buyer One" },
        { transactionId: tx.id, role: "SELLER", displayName: "Seller One" },
      ],
    });

    await prisma.lecipmSdFinancialApproval.create({
      data: {
        transactionId: tx.id,
        approvalStatus: "APPROVED",
        approvedAmount: 500_000,
        conditionsJson: [],
      },
    });

    await prisma.lecipmSdDocument.create({
      data: {
        transactionId: tx.id,
        transactionNumber: tx.transactionNumber,
        documentType: "FINAL_DEED",
        title: "Acte de vente",
        status: "SIGNED",
        requiredForClosing: true,
      },
    });

    const deal = await createDealFromTransaction({
      transactionId: tx.id,
      brokerId: broker.id,
      actorUserId: broker.id,
    });

    await createCapitalStack(
      deal.id,
      { totalPurchasePrice: 500_000, equityAmount: 100_000, debtAmount: 400_000 },
      broker.id
    );

    await transitionPipelineStage({
      dealId: deal.id,
      toStage: "EXECUTION",
      actorUserId: broker.id,
      reason: "Phase 6 validation",
    });

    await initializeClosing(deal.id, broker.id);

    const closing = await prisma.lecipmPipelineDealClosing.findUnique({ where: { dealId: deal.id } });
    if (!closing) {
      console.log("FAIL closing not created");
      failed++;
      process.exit(1);
    }

    await importFinalDocs(closing.id, deal.id, tx.id, broker.id);

    const closingDocs = await prisma.lecipmPipelineDealClosingDocument.findMany({
      where: { closingId: closing.id },
    });
    for (const d of closingDocs) {
      await verifyDocument(d.id, deal.id, tx.id, broker.id);
    }

    const items = await prisma.lecipmPipelineDealClosingChecklistItem.findMany({
      where: { closingId: closing.id },
    });
    for (const it of items) {
      await updateChecklistItemStatus(it.id, "DONE", deal.id, broker.id, tx.id);
    }

    const ev = await evaluateClosing(deal.id);
    if (ev.status !== "READY") {
      console.log(`FAIL validation not READY: ${ev.issues.join("; ")}`);
      failed++;
    } else {
      console.log("PASS evaluateClosing READY");
    }

    await completeClosing(deal.id, broker.id);

    const asset = await prisma.lecipmPortfolioAsset.findFirst({ where: { dealId: deal.id } });
    if (!asset) {
      console.log("FAIL asset not created");
      failed++;
    } else {
      console.log("PASS portfolio asset created");
    }

    const archive = await prisma.lecipmSdTransactionArchive.findUnique({
      where: { transactionId: tx.id },
    });
    if (!archive || archive.archiveStatus !== "LOCKED") {
      console.log("FAIL archive missing or not LOCKED");
      failed++;
    } else {
      console.log("PASS transaction archive LOCKED");
    }

    const closingDone = await prisma.lecipmPipelineDealClosing.findUnique({
      where: { dealId: deal.id },
      select: { closingStatus: true },
    });
    if (closingDone?.closingStatus !== "COMPLETED") {
      console.log(`FAIL closing status ${closingDone?.closingStatus}`);
      failed++;
    } else {
      console.log("PASS closing COMPLETED");
    }

    console.log("\n----------");
    if (failed === 0) console.log("PASS — Phase 6 validation\n");
    else console.log(`FAIL — ${failed} check(s)\n`);

    process.exit(failed === 0 ? 0 : 1);
  } catch (e) {
    console.error(e);
    console.log("\nFAIL — exception\n");
    process.exit(1);
  }
}

main();
