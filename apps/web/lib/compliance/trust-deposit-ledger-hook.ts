import { prisma } from "@/lib/db";
import { createTrustLedgerEntry } from "@/lib/compliance/trust-ledger";
import { logComplianceModuleAudit } from "@/lib/compliance/compliance-module-audit";

type DepositCtx = {
  ownerType: string;
  ownerId: string;
  actorId?: string | null;
};

/** Call after a deposit is first recorded as received. */
export async function ledgerOnDepositReceived(depositId: string, ctx: DepositCtx) {
  const deposit = await prisma.trustDeposit.findUnique({ where: { id: depositId } });
  if (!deposit) return null;

  const row = await createTrustLedgerEntry({
    ownerType: ctx.ownerType,
    ownerId: ctx.ownerId,
    trustDepositId: deposit.id,
    listingId: deposit.listingId,
    dealId: deposit.dealId,
    entryType: "receipt",
    direction: "credit",
    amountCents: deposit.amountCents,
    referenceNumber: deposit.receiptNumber ?? deposit.id,
    createdById: ctx.actorId ?? null,
  });

  await logComplianceModuleAudit({
    actorUserId: ctx.actorId,
    action: "trust_ledger_receipt",
    payload: { trustDepositId: deposit.id, ledgerEntryId: row.id },
  });

  return row;
}

/** Call when funds move to held-in-trust (often net-zero if already credited — optional second line). */
export async function ledgerOnDepositHeld(depositId: string, ctx: DepositCtx) {
  const deposit = await prisma.trustDeposit.findUnique({ where: { id: depositId } });
  if (!deposit) return null;
  return createTrustLedgerEntry({
    ownerType: ctx.ownerType,
    ownerId: ctx.ownerId,
    trustDepositId: deposit.id,
    listingId: deposit.listingId,
    dealId: deposit.dealId,
    entryType: "hold",
    direction: "credit",
    amountCents: 0,
    referenceNumber: deposit.receiptNumber ?? deposit.id,
    notes: "Hold marker — confirm against brokerage policy.",
    createdById: ctx.actorId ?? null,
  });
}

export async function ledgerOnDepositReleased(depositId: string, ctx: DepositCtx) {
  const deposit = await prisma.trustDeposit.findUnique({ where: { id: depositId } });
  if (!deposit) return null;

  const row = await createTrustLedgerEntry({
    ownerType: ctx.ownerType,
    ownerId: ctx.ownerId,
    trustDepositId: deposit.id,
    listingId: deposit.listingId,
    dealId: deposit.dealId,
    entryType: "release",
    direction: "debit",
    amountCents: deposit.amountCents,
    referenceNumber: deposit.receiptNumber ?? deposit.id,
    createdById: ctx.actorId ?? null,
  });

  await logComplianceModuleAudit({
    actorUserId: ctx.actorId,
    action: "trust_ledger_release",
    payload: { trustDepositId: deposit.id, ledgerEntryId: row.id },
  });

  return row;
}

export async function ledgerOnDepositRefunded(depositId: string, ctx: DepositCtx) {
  const deposit = await prisma.trustDeposit.findUnique({ where: { id: depositId } });
  if (!deposit) return null;

  const row = await createTrustLedgerEntry({
    ownerType: ctx.ownerType,
    ownerId: ctx.ownerId,
    trustDepositId: deposit.id,
    listingId: deposit.listingId,
    dealId: deposit.dealId,
    entryType: "refund",
    direction: "debit",
    amountCents: deposit.amountCents,
    referenceNumber: deposit.receiptNumber ?? deposit.id,
    createdById: ctx.actorId ?? null,
  });

  await logComplianceModuleAudit({
    actorUserId: ctx.actorId,
    action: "trust_ledger_refund",
    payload: { trustDepositId: deposit.id, ledgerEntryId: row.id },
  });

  return row;
}
