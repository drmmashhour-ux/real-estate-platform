/**
 * SD Transaction — Phase 2 validation (services + DB, no HTTP).
 *
 *   pnpm exec tsx scripts/sd-transaction-phase2-validation.ts
 *
 * Requires: DATABASE_URL, at least one User with role BROKER.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { closeTransactionIfAllowed } from "@/modules/transactions/transaction-closing.service";
import { generateDocument, getDocuments } from "@/modules/transactions/transaction-document.service";
import { createOrGetFinancial, updateFinancialApproval } from "@/modules/transactions/transaction-financial.service";
import { prepareNotaryPackage, sendNotaryPackage } from "@/modules/transactions/transaction-notary.service";
import { listTimeline } from "@/modules/transactions/transaction-timeline.service";
import { createTransaction } from "@/modules/transactions/transaction.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const MANDATORY = (n: string) => `Transaction No: ${n}`;

async function main(): Promise<void> {
  console.log("\n========== SD Transaction Phase 2 validation ==========\n");
  let failed = 0;

  const broker = await prisma.user.findFirst({
    where: { role: "BROKER" },
    select: { id: true },
  });
  if (!broker) {
    console.log("SKIP — no BROKER user in DB");
    process.exit(0);
  }

  try {
    const tx = await createTransaction(
      {
        brokerId: broker.id,
        transactionType: "SALE",
        title: "Phase 2 smoke",
      },
      "BROKER"
    );
    const sd = tx.transactionNumber;
    console.log(`PASS create transaction ${sd}`);

    const doc = await generateDocument(tx.id, "TEST_TEMPLATE");
    const html = doc.bodyHtml ?? "";
    if (!html.includes(MANDATORY(sd))) {
      console.log(`FAIL generated HTML missing mandatory line for ${sd}`);
      failed++;
    } else {
      console.log("PASS generate document — Transaction No in body");
    }

    await prisma.lecipmSdDocument.update({
      where: { id: doc.id },
      data: { requiredForClosing: true, status: "FINAL" },
    });
    console.log("PASS required doc marked FINAL");

    await createOrGetFinancial(tx.id);
    await updateFinancialApproval({
      transactionId: tx.id,
      approvalStatus: "APPROVED",
      lenderName: "Test Bank",
      approvedAmount: 500000,
      interestRate: 5.25,
      conditionsJson: [{ label: "Appraisal", fulfilled: true }],
    });
    console.log("PASS financial APPROVED + conditions fulfilled");

    await prepareNotaryPackage(tx.id);
    console.log("PASS prepare notary package");

    await sendNotaryPackage(tx.id, "Maître Test", "notary@example.test");
    console.log("PASS send notary package");

    const events = await listTimeline(tx.id);
    const types = new Set(events.map((e) => e.eventType));
    const need = [
      "DOCUMENT_GENERATED",
      "FINANCIAL_SUBMITTED",
      "FINANCIAL_APPROVED",
      "NOTARY_PACKAGE_SENT",
    ];
    for (const t of need) {
      if (!types.has(t)) {
        console.log(`FAIL timeline missing ${t}`);
        failed++;
      } else {
        console.log(`PASS timeline has ${t}`);
      }
    }

    const close = await closeTransactionIfAllowed(tx.id);
    if (!close.ok) {
      console.log(`FAIL close: ${close.reasons.join("; ")}`);
      failed++;
    } else {
      console.log("PASS close transaction");
    }

    const after = await listTimeline(tx.id);
    if (!after.some((e) => e.eventType === "TRANSACTION_CLOSED")) {
      console.log("FAIL timeline missing TRANSACTION_CLOSED");
      failed++;
    } else {
      console.log("PASS timeline TRANSACTION_CLOSED");
    }

    const docs = await getDocuments(tx.id);
    const bad = docs.filter((d) => d.transactionNumber !== sd);
    if (bad.length > 0) {
      console.log("FAIL document without matching transactionNumber");
      failed++;
    } else {
      console.log("PASS all documents carry SD number");
    }

    console.log("\n----------");
    if (failed === 0) console.log("PASS — Phase 2 validation\n");
    else console.log(`FAIL — ${failed} check(s)\n`);

    process.exit(failed === 0 ? 0 : 1);
  } catch (e) {
    console.error(e);
    console.log("\nFAIL — exception\n");
    process.exit(1);
  }
}

main();
