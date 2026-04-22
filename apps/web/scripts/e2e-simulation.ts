/**
 * E2E simulation: 10 × full SD transaction flow + integrity checks + edge-case probes.
 *
 * Requires: DATABASE_URL, migrated schema (includes UserConsent, LecipmSd*, Lead, PlatformPayment).
 *
 * Run from monorepo root:
 *   pnpm --filter @lecipm/web exec tsx scripts/e2e-simulation.ts
 *
 * Or from apps/web:
 *   pnpm exec tsx scripts/e2e-simulation.ts
 */

import "./load-apps-web-env";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { allocateUniqueUserCode } from "@/lib/user-code";
import { closeTransactionIfAllowed } from "@/modules/transactions/transaction-closing.service";
import { generateDocument } from "@/modules/transactions/transaction-document.service";
import { updateFinancialApproval } from "@/modules/transactions/transaction-financial.service";
import { sendNotaryPackage } from "@/modules/transactions/transaction-notary.service";
import { addParty } from "@/modules/transactions/transaction-party.service";
import {
  addSigner,
  createSignaturePacket,
  markViewed,
  sendPacket,
  signDocument,
} from "@/modules/transactions/transaction-signature.service";
import { createTransaction } from "@/modules/transactions/transaction.service";

const SD_RE = /^LEC-SD-\d{4}-\d{6}$/;
const ITERATIONS = 10;

type IterationReport = {
  iteration: number;
  ok: boolean;
  errors: string[];
  warnings: string[];
  sdNumber?: string;
};

function pushUnique(arr: string[], msg: string) {
  if (!arr.includes(msg)) arr.push(msg);
}

async function runFullIteration(i: number): Promise<IterationReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suffix = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const email = `e2e.sim.${suffix}@lecipm.test`;
    const user = await prisma.$transaction(async (tx) => {
      const userCode = await allocateUniqueUserCode(tx);
      const passwordHash = await hashPassword("E2E-Sim-Pass-2026!");
      const u = await tx.user.create({
        data: {
          userCode,
          email,
          passwordHash,
          role: "BROKER",
          name: `E2E Broker ${i}`,
          emailVerifiedAt: new Date(),
        },
      });
      await tx.userConsent.createMany({
        data: [
          { userId: u.id, type: "TERMS" },
          { userId: u.id, type: "PRIVACY" },
        ],
      });
      return u;
    });

    const listingCode = `E2E-LST-${suffix}`;
    const listing = await prisma.listing.create({
      data: {
        listingCode,
        title: `E2E Simulation Listing ${i}`,
        price: 599000,
        ownerId: user.id,
        listingType: "HOUSE",
        crmMarketplaceLive: false,
      },
    });

    await prisma.brokerListingAccess.create({
      data: { listingId: listing.id, brokerId: user.id, role: "owner" },
    });

    const sdTx = await createTransaction(
      {
        brokerId: user.id,
        listingId: listing.id,
        transactionType: "SALE",
        title: `E2E SD ${suffix}`,
      },
      "ADMIN"
    );

    if (!SD_RE.test(sdTx.transactionNumber)) {
      errors.push(`transactionNumber format invalid: ${sdTx.transactionNumber}`);
    }

    await addParty({
      transactionId: sdTx.id,
      role: "BUYER",
      displayName: "E2E Buyer",
      email: `buyer.${suffix}@test.lecipm`,
    });
    await addParty({
      transactionId: sdTx.id,
      role: "SELLER",
      displayName: "E2E Seller",
      email: `seller.${suffix}@test.lecipm`,
    });

    const doc = await generateDocument(sdTx.id, `E2E_SIM_${i}`);
    const packet = await createSignaturePacket(sdTx.id, doc.id);
    const s1 = await addSigner(packet.id, {
      role: "BUYER",
      name: "E2E Buyer",
      email: `buyer.${suffix}@test.lecipm`,
    });
    const s2 = await addSigner(packet.id, {
      role: "SELLER",
      name: "E2E Seller",
      email: `seller.${suffix}@test.lecipm`,
    });

    await sendPacket(packet.id);
    await markViewed(s1.id, "203.0.113.10", "e2e-simulation/1.0");
    await markViewed(s2.id, "203.0.113.11", "e2e-simulation/1.0");
    await signDocument(s1.id, { ipAddress: "203.0.113.10", userAgent: "e2e-simulation/1.0" });
    await signDocument(s2.id, { ipAddress: "203.0.113.11", userAgent: "e2e-simulation/1.0" });

    await prisma.lead.create({
      data: {
        name: "E2E Lead",
        email: `lead.${suffix}@test.lecipm`,
        phone: "5145550000",
        message: "E2E inquiry",
        listingId: listing.id,
        listingCode,
        status: "new",
        score: 50,
        leadSource: "e2e_simulation",
      },
    });

    await prisma.lecipmTenantCreditCheck.create({
      data: {
        transactionId: sdTx.id,
        applicantName: "E2E Buyer",
        email: `buyer.${suffix}@test.lecipm`,
        status: "COMPLETED",
        score: 720,
        provider: "SIMULATION",
      },
    });

    await updateFinancialApproval({
      transactionId: sdTx.id,
      approvalStatus: "APPROVED",
      lenderName: "Simulation Bank",
      conditionsJson: [{ label: "Financing", fulfilled: true }],
    });

    await sendNotaryPackage(sdTx.id, "Notary Sim", `notary.${suffix}@test.lecipm`);

    const payment = await prisma.platformPayment.create({
      data: {
        userId: user.id,
        listingId: listing.id,
        paymentType: "closing_fee",
        amountCents: 250000,
        currency: "cad",
        status: "paid",
        metadata: { sdTransactionId: sdTx.id, simulation: true },
      },
    });

    await recordPlatformEvent({
      eventType: "e2e_payment_simulated",
      sourceModule: "e2e-simulation",
      entityType: "PlatformPayment",
      entityId: payment.id,
      payload: { sdTransactionId: sdTx.id, iteration: i },
    });

    const closed = await closeTransactionIfAllowed(sdTx.id);
    if (!closed.ok) {
      for (const r of closed.reasons) errors.push(r);
    }

    const sdNum = sdTx.transactionNumber;
    const fresh = await prisma.lecipmSdTransaction.findUnique({
      where: { id: sdTx.id },
      select: { transactionNumber: true, status: true },
    });
    const docRow = await prisma.lecipmSdDocument.findUnique({ where: { id: doc.id } });

    if (!docRow?.bodyHtml?.includes(sdNum)) {
      errors.push("document bodyHtml missing transaction number");
    }
    const meta = docRow?.metadataJson as Record<string, unknown> | null;
    if (meta?.transactionNumber !== sdNum) {
      errors.push("document metadataJson.transactionNumber mismatch");
    }
    if (!docRow?.transactionNumber || docRow.transactionNumber !== sdNum) {
      errors.push("document.transactionNumber column mismatch");
    }

    const dupCount = await prisma.lecipmSdTransaction.count({
      where: { transactionNumber: sdNum },
    });
    if (dupCount !== 1) {
      errors.push(`expected exactly one SD row for ${sdNum}, found ${dupCount}`);
    }

    const pay = await prisma.platformPayment.findFirst({
      where: { id: payment.id },
      select: { status: true, metadata: true },
    });
    if (!pay || pay.status !== "paid") {
      errors.push("payment record not paid");
    } else {
      const md = pay.metadata as Record<string, unknown> | null;
      if (md?.sdTransactionId !== sdTx.id) {
        errors.push("payment metadata.sdTransactionId mismatch");
      }
    }

    const logRow = await prisma.platformEvent.findFirst({
      where: { entityId: payment.id, eventType: "e2e_payment_simulated" },
    });
    if (!logRow) {
      warnings.push(`iteration ${i}: platformEvent e2e_payment_simulated not found for payment ${payment.id}`);
    }

    if (fresh?.status !== "CLOSED") {
      errors.push(`expected transaction CLOSED, got ${fresh?.status ?? "null"}`);
    }

    return {
      iteration: i,
      ok: errors.length === 0,
      errors,
      warnings,
      sdNumber: sdNum,
    };
  } catch (e) {
    return {
      iteration: i,
      ok: false,
      errors: [e instanceof Error ? e.message : String(e)],
      warnings,
    };
  }
}

async function runEdgeCases(edgeErrors: string[], edgeWarnings: string[]): Promise<void> {
  console.log("\n--- Edge-case probes ---\n");

  const broker = await prisma.user.findFirst({
    where: { role: "BROKER" },
    select: { id: true },
  });
  if (!broker) {
    pushUnique(edgeWarnings, "edge cases: no BROKER user — skipped");
    return;
  }

  try {
    const cancelTx = await createTransaction(
      {
        brokerId: broker.id,
        transactionType: "SALE",
        title: "E2E cancel probe",
      },
      "ADMIN"
    );
    await prisma.lecipmSdTransaction.update({
      where: { id: cancelTx.id },
      data: { status: "CANCELLED" },
    });
    const cancelled = await prisma.lecipmSdTransaction.findUnique({
      where: { id: cancelTx.id },
      select: { status: true },
    });
    if (cancelled?.status !== "CANCELLED") {
      pushUnique(edgeErrors, "edge: cancel — status not CANCELLED");
    } else {
      console.log("  [edge] user cancel: OK (status CANCELLED)");
    }
  } catch (e) {
    pushUnique(edgeErrors, `edge: cancel — ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const u = await prisma.user.findFirst({ where: { role: "BROKER" }, select: { id: true } });
    if (u) {
      await prisma.platformPayment.create({
        data: {
          userId: u.id,
          paymentType: "closing_fee",
          amountCents: 100,
          currency: "cad",
          status: "failed",
          metadata: { simulation: "payment_fail_probe" },
        },
      });
      const failed = await prisma.platformPayment.findFirst({
        where: { userId: u.id, status: "failed" },
        orderBy: { createdAt: "desc" },
      });
      if (!failed) {
        pushUnique(edgeWarnings, "edge: payment failed row not found after insert");
      } else {
        console.log("  [edge] payment failed: OK (failed row persisted)");
      }
    }
  } catch (e) {
    pushUnique(edgeErrors, `edge: payment fail — ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const listing = await prisma.listing.findFirst({ select: { id: true, listingCode: true } });
    if (listing) {
      const dupEmail = `dup-lead-${Date.now()}@test.lecipm`;
      await prisma.lead.create({
        data: {
          name: "Dup A",
          email: dupEmail,
          phone: "1",
          message: "a",
          listingId: listing.id,
          listingCode: listing.listingCode,
          status: "new",
          score: 1,
          leadSource: "e2e_dup",
        },
      });
      await prisma.lead.create({
        data: {
          name: "Dup B",
          email: dupEmail,
          phone: "2",
          message: "b",
          listingId: listing.id,
          listingCode: listing.listingCode,
          status: "new",
          score: 2,
          leadSource: "e2e_dup",
        },
      });
      const n = await prisma.lead.count({
        where: { email: dupEmail, listingId: listing.id },
      });
      if (n >= 2) {
        console.log(`  [edge] duplicate lead: OK (DB allows ${n} rows same email+listing — verify policy in product)`);
      }
    }
  } catch (e) {
    pushUnique(edgeErrors, `edge: duplicate lead — ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const missing = await createTransaction(
      {
        brokerId: broker.id,
        transactionType: "SALE",
        title: "E2E missing parties",
      },
      "ADMIN"
    );
    const gate = await closeTransactionIfAllowed(missing.id);
    if (gate.ok) {
      pushUnique(edgeErrors, "edge: missing data — close should have failed without parties/financial/notary");
    } else {
      console.log("  [edge] missing data (no parties): OK (close blocked)");
    }
  } catch (e) {
    pushUnique(edgeErrors, `edge: missing data — ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function main(): Promise<void> {
  console.log("\n========== LECIPM E2E simulation (10 flows) ==========\n");

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("FATAL: DATABASE_URL is not set.");
    process.exit(1);
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.error("FATAL: database unreachable:", e);
    process.exit(1);
  }

  const iterationReports: IterationReport[] = [];
  const iterationErrors: string[] = [];
  const iterationWarnings: string[] = [];
  const edgeErrors: string[] = [];
  const edgeWarnings: string[] = [];

  for (let i = 1; i <= ITERATIONS; i++) {
    process.stdout.write(`  Run ${i}/${ITERATIONS}… `);
    const r = await runFullIteration(i);
    iterationReports.push(r);
    if (r.ok) {
      console.log(`OK ${r.sdNumber ?? ""}`);
    } else {
      console.log("FAIL");
      for (const e of r.errors) console.log(`    - ${e}`);
    }
    r.errors.forEach((e) => pushUnique(iterationErrors, `[iter ${i}] ${e}`));
    r.warnings.forEach((w) => pushUnique(iterationWarnings, w));
  }

  await runEdgeCases(edgeErrors, edgeWarnings);

  const successes = iterationReports.filter((r) => r.ok).length;
  const successRate = (successes / ITERATIONS) * 100;

  console.log("\n========== Report ==========\n");
  console.log(`  Success rate: ${successes}/${ITERATIONS} (${successRate.toFixed(1)}%)`);
  if (iterationErrors.length) {
    console.log("\n  Main-flow errors:");
    for (const e of iterationErrors) console.log(`    - ${e}`);
  }
  if (edgeErrors.length) {
    console.log("\n  Edge-case errors:");
    for (const e of edgeErrors) console.log(`    - ${e}`);
  }
  const allWarnings = [...iterationWarnings, ...edgeWarnings];
  if (allWarnings.length) {
    console.log("\n  Warnings:");
    for (const w of allWarnings) console.log(`    - ${w}`);
  }

  const mainFlowAccepted = successes === ITERATIONS && iterationErrors.length === 0;
  const edgesAccepted = edgeErrors.length === 0;

  console.log("\n----------");
  if (mainFlowAccepted && edgesAccepted) {
    console.log("ACCEPTANCE: PASS — 10/10 flows, no errors, edge probes clean.\n");
    process.exit(0);
  } else if (mainFlowAccepted && !edgesAccepted) {
    console.log("ACCEPTANCE: PARTIAL — main 10/10 OK; edge-case probe(s) failed (see above).\n");
    process.exit(1);
  } else {
    console.log("ACCEPTANCE: FAIL — main flows must be 10/10 with zero iteration errors.\n");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
