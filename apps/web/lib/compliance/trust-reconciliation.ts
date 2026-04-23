import { prisma } from "@/lib/db";
import { generateReconciliationNumber } from "@/lib/compliance/reconciliation-number";
import { logComplianceModuleAudit } from "@/lib/compliance/compliance-module-audit";

export async function runTrustReconciliation(input: {
  ownerType: string;
  ownerId: string;
  actorUserId?: string | null;
}) {
  if (input.ownerType !== "agency" && input.ownerType !== "solo_broker") {
    const run = await prisma.trustReconciliationRun.create({
      data: {
        runNumber: generateReconciliationNumber(),
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        status: "generated",
        totalDepositsCents: 0,
        totalLedgerCents: 0,
        differenceCents: 0,
        details: { note: "owner_type_not_trust_scoped" },
      },
    });
    await logComplianceModuleAudit({
      actorUserId: input.actorUserId,
      action: "trust_reconciliation_generated",
      payload: { entityId: run.id, runNumber: run.runNumber, skipped: true },
    });
    return run;
  }

  const depositWhere =
    input.ownerType === "agency" ? { agencyId: input.ownerId } : { brokerId: input.ownerId };

  const deposits = await prisma.trustDeposit.findMany({
    where: depositWhere,
  });

  const ledger = await prisma.trustLedgerEntry.findMany({
    where: { ownerType: input.ownerType, ownerId: input.ownerId },
  });

  const totalDepositsCents = deposits.reduce((sum, d) => {
    if (d.status === "received" || d.status === "held_in_trust" || d.status === "release_requested") {
      return sum + d.amountCents;
    }
    return sum;
  }, 0);

  const totalLedgerCents = ledger.reduce((sum, e) => {
    return e.direction === "credit" ? sum + e.amountCents : sum - e.amountCents;
  }, 0);

  const differenceCents = totalDepositsCents - totalLedgerCents;
  const status = differenceCents === 0 ? "generated" : "mismatch_found";

  const run = await prisma.trustReconciliationRun.create({
    data: {
      runNumber: generateReconciliationNumber(),
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      status,
      totalDepositsCents,
      totalLedgerCents,
      differenceCents,
      details: {
        depositCount: deposits.length,
        ledgerCount: ledger.length,
      },
    },
  });

  await logComplianceModuleAudit({
    actorUserId: input.actorUserId,
    action: status === "mismatch_found" ? "trust_reconciliation_mismatch" : "trust_reconciliation_generated",
    payload: {
      entityId: run.id,
      runNumber: run.runNumber,
      differenceCents: run.differenceCents,
    },
  });

  return run;
}
