/**
 * LECIPM SD transaction file — Phase 3 (signatures, compliance, audit chain).
 *   pnpm exec tsx scripts/sd-transaction-phase3-validation.ts
 */
import { createHash } from "node:crypto";
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { auditPayloadDigest } from "@/modules/transactions/transaction-audit-proof.service";
import { addParty } from "@/modules/transactions/transaction-party.service";
import { createTransaction } from "@/modules/transactions/transaction.service";
import { generateDocument } from "@/modules/transactions/transaction-document.service";
import {
  addSigner,
  createSignaturePacket,
  markViewed,
  sendPacket,
  signDocument,
} from "@/modules/transactions/transaction-signature.service";
import { evaluateCompliance } from "@/modules/transactions/transaction-compliance.service";
import { updateFinancialApproval } from "@/modules/transactions/transaction-financial.service";
import { sendNotaryPackage } from "@/modules/transactions/transaction-notary.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function verifyAuditChain(transactionId: string): Promise<boolean> {
  const rows = await prisma.lecipmSdAuditProof.findMany({
    where: { transactionId },
    orderBy: { timestamp: "asc" },
  });
  if (rows.length === 0) return false;
  let prev: string | null = null;
  for (const row of rows) {
    const payloadDigest = auditPayloadDigest(row.payloadJson ?? {});
    const preimage = `${prev ?? ""}|${row.eventType}|${row.documentId ?? ""}|${payloadDigest}|${row.timestamp.toISOString()}`;
    const expected = createHash("sha256").update(preimage).digest("hex");
    if (expected !== row.hash) return false;
    prev = row.hash;
  }
  return true;
}

async function main(): Promise<void> {
  console.log("\n========== SD Transaction Phase 3 validation ==========\n");
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
        title: "Phase 3 smoke",
      },
      "BROKER"
    );

    await addParty({
      transactionId: tx.id,
      role: "BUYER",
      displayName: "Buyer One",
      email: "buyer@example.test",
    });
    await addParty({
      transactionId: tx.id,
      role: "SELLER",
      displayName: "Seller One",
      email: "seller@example.test",
    });

    const doc = await generateDocument(tx.id, "PHASE3_TEST");
    const packet = await createSignaturePacket(tx.id, doc.id);

    const s1 = await addSigner(packet.id, {
      role: "BUYER",
      name: "Buyer One",
      email: "buyer@example.test",
    });
    const s2 = await addSigner(packet.id, {
      role: "SELLER",
      name: "Seller One",
      email: "seller@example.test",
    });

    await sendPacket(packet.id);

    await markViewed(s1.id, "203.0.113.10", "phase3-validation/1.0");
    await markViewed(s2.id, "203.0.113.11", "phase3-validation/1.0");

    await signDocument(s1.id, { ipAddress: "203.0.113.10", userAgent: "phase3-validation/1.0" });
    await signDocument(s2.id, { ipAddress: "203.0.113.11", userAgent: "phase3-validation/1.0" });

    const locked = await prisma.lecipmSdDocument.findUnique({ where: { id: doc.id } });
    if (locked?.status !== "FINAL" || !locked.lockedAt || !locked.immutableContentHash) {
      console.log("FAIL document not locked with FINAL + hash");
      failed++;
    } else {
      console.log("PASS document immutable after full signature");
    }

    const chainOk = await verifyAuditChain(tx.id);
    if (!chainOk) {
      console.log("FAIL audit hash chain verification");
      failed++;
    } else {
      console.log("PASS audit hash chain");
    }

    await updateFinancialApproval({
      transactionId: tx.id,
      approvalStatus: "APPROVED",
      lenderName: "Test Bank",
      conditionsJson: [{ label: "Cond", fulfilled: true }],
    });

    await sendNotaryPackage(tx.id, "Notary", "notary@example.test");

    const compliance = await evaluateCompliance(tx.id);
    if (compliance.blockingIssues.length > 0) {
      console.log(`FAIL compliance blocking: ${compliance.blockingIssues.join("; ")}`);
      failed++;
    } else {
      console.log("PASS evaluateCompliance (full gates)");
    }

    const timeline = await prisma.lecipmSdTimelineEvent.findMany({
      where: { transactionId: tx.id },
      select: { eventType: true },
    });
    const types = new Set(timeline.map((t) => t.eventType));
    const need = ["SIGNATURE_PACKET_CREATED", "SIGNATURE_SENT", "DOCUMENT_LOCKED"];
    for (const n of need) {
      if (!types.has(n)) {
        console.log(`FAIL timeline missing ${n}`);
        failed++;
      }
    }
    if (failed === 0) console.log("PASS timeline signature events");

    console.log("\n----------");
    if (failed === 0) console.log("PASS — Phase 3 validation\n");
    else console.log(`FAIL — ${failed} check(s)\n`);

    process.exit(failed === 0 ? 0 : 1);
  } catch (e) {
    console.error(e);
    console.log("\nFAIL — exception\n");
    process.exit(1);
  }
}

main();
