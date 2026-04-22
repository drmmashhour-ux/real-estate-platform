/**
 * Transaction File System — Phase 1 validation (service-level + DB).
 *
 *   pnpm exec tsx scripts/sd-transaction-phase1-validation.ts
 *
 * Requires: DATABASE_URL, at least one User with role BROKER (or ADMIN).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { createTransaction } from "@/modules/transactions/transaction.service";
import { addParty, listParties } from "@/modules/transactions/transaction-party.service";
import { listTimeline } from "@/modules/transactions/transaction-timeline.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const SD_RE = /^LEC-SD-\d{4}-\d{6}$/;

async function main(): Promise<void> {
  console.log("\n========== SD Transaction Phase 1 validation ==========\n");
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
        title: "Phase 1 smoke",
      },
      "BROKER"
    );

    if (!SD_RE.test(tx.transactionNumber)) {
      console.log(`FAIL transactionNumber format: ${tx.transactionNumber}`);
      failed++;
    } else {
      console.log(`PASS transactionNumber ${tx.transactionNumber}`);
    }

    await addParty({
      transactionId: tx.id,
      role: "BUYER",
      displayName: "Test Buyer",
      email: "buyer@example.test",
    });

    const parties = await listParties(tx.id);
    const hasBuyer = parties.some((p) => p.role === "BUYER");
    if (!hasBuyer) {
      console.log("FAIL parties list missing buyer");
      failed++;
    } else {
      console.log("PASS parties list");
    }

    const timeline = await listTimeline(tx.id);
    const created = timeline.some((e) => e.eventType === "CREATED");
    if (!created) {
      console.log("FAIL timeline missing CREATED");
      failed++;
    } else {
      console.log("PASS timeline includes CREATED");
    }

    const partyAdded = timeline.some((e) => e.eventType === "PARTY_ADDED");
    if (!partyAdded) {
      console.log("FAIL timeline missing PARTY_ADDED");
      failed++;
    } else {
      console.log("PASS timeline includes PARTY_ADDED");
    }

    console.log("\n----------");
    if (failed === 0) console.log("PASS — Phase 1 validation\n");
    else console.log(`FAIL — ${failed} check(s)\n`);

    process.exit(failed === 0 ? 0 : 1);
  } catch (e) {
    console.error(e);
    console.log("\nFAIL — exception\n");
    process.exit(1);
  }
}

main();
