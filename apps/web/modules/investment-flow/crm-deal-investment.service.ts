import type { Deal, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordInvestmentFlowAudit } from "./investment-flow-audit.service";

const COMMIT_STATUSES = new Set(["SOFT_COMMIT", "CONFIRMED", "REJECTED", "WITHDRAWN"]);
const PAY_METHODS = new Set(["WIRE", "CHEQUE"]);

export function parseInvestmentTargetCents(deal: Pick<Deal, "executionMetadata">): number | null {
  const m = deal.executionMetadata;
  if (!m || typeof m !== "object") return null;
  const raw = (m as Record<string, unknown>).investmentTargetCents;
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
}

async function recalculateCapTableForSpv(tx: Prisma.TransactionClient, spvId: string) {
  const received = await tx.crmDealInvestorPayment.findMany({
    where: { received: true, subscription: { commitment: { spvId } } },
    select: { amountCents: true, subscription: { select: { investorId: true } } },
  });
  const byInvestor = new Map<string, number>();
  let total = 0;
  for (const p of received) {
    const inv = p.subscription.investorId;
    const next = (byInvestor.get(inv) ?? 0) + p.amountCents;
    byInvestor.set(inv, next);
    total += p.amountCents;
  }
  for (const [investorId, investedAmountCents] of byInvestor) {
    const ownershipPercent = total > 0 ? (investedAmountCents / total) * 100 : 0;
    await tx.crmDealCapTableEntry.upsert({
      where: { spvId_investorId: { spvId, investorId } },
      create: { spvId, investorId, investedAmountCents, ownershipPercent },
      update: { investedAmountCents, ownershipPercent },
    });
  }
}

export async function createSoftCommit(input: {
  dealId: string;
  investorId: string;
  committedAmountCents: number;
  spvId?: string | null;
  actorUserId: string;
}) {
  if (input.committedAmountCents <= 0) throw new Error("INVALID_AMOUNT");
  if (input.spvId) {
    const spv = await prisma.amfSpv.findUnique({ where: { id: input.spvId }, select: { id: true } });
    if (!spv) throw new Error("SPV_NOT_FOUND");
  }

  const row = await prisma.crmDealInvestorCommitment.create({
    data: {
      dealId: input.dealId,
      investorId: input.investorId,
      spvId: input.spvId ?? null,
      committedAmountCents: input.committedAmountCents,
      currency: "CAD",
      status: "SOFT_COMMIT",
    },
  });

  await recordInvestmentFlowAudit({
    dealId: input.dealId,
    actorUserId: input.actorUserId,
    action: "commitment_created",
    entityType: "CrmDealInvestorCommitment",
    entityId: row.id,
    metadata: { committedAmountCents: row.committedAmountCents, spvId: row.spvId },
  });

  return row;
}

export async function brokerApproveCommitment(input: {
  deal: Pick<Deal, "id" | "brokerId">;
  commitmentId: string;
  brokerUserId: string;
}) {
  const c = await prisma.crmDealInvestorCommitment.findFirst({
    where: { id: input.commitmentId, dealId: input.deal.id },
    include: { subscription: true },
  });
  if (!c) throw new Error("COMMITMENT_NOT_FOUND");
  if (c.status !== "SOFT_COMMIT") throw new Error("INVALID_COMMITMENT_STATE");
  if (input.deal.brokerId !== input.brokerUserId) {
    const u = await prisma.user.findUnique({ where: { id: input.brokerUserId }, select: { role: true } });
    if (u?.role !== "ADMIN") throw new Error("BROKER_ONLY");
  }

  let createdSub = false;
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.crmDealInvestorCommitment.update({
      where: { id: c.id },
      data: {
        status: "CONFIRMED",
        brokerApprovedAt: new Date(),
        brokerApprovedById: input.brokerUserId,
        brokerRejectedAt: null,
        brokerRejectedById: null,
        rejectionReason: null,
      },
    });
    if (!c.subscription) {
      await tx.crmDealInvestorSubscription.create({
        data: {
          commitmentId: c.id,
          investorId: c.investorId,
          subscriptionAmountCents: c.committedAmountCents,
          signed: false,
        },
      });
      createdSub = true;
    }
    return next;
  });

  await recordInvestmentFlowAudit({
    dealId: input.deal.id,
    actorUserId: input.brokerUserId,
    action: "commitment_approved",
    entityType: "CrmDealInvestorCommitment",
    entityId: c.id,
    metadata: { newStatus: "CONFIRMED" },
  });
  if (createdSub) {
    await recordInvestmentFlowAudit({
      dealId: input.deal.id,
      actorUserId: input.brokerUserId,
      action: "subscription_created",
      entityType: "CrmDealInvestorCommitment",
      entityId: c.id,
      metadata: { commitmentId: c.id },
    });
  }

  return updated;
}

export async function brokerRejectCommitment(input: {
  deal: Pick<Deal, "id" | "brokerId">;
  commitmentId: string;
  brokerUserId: string;
  reason?: string | null;
}) {
  const c = await prisma.crmDealInvestorCommitment.findFirst({
    where: { id: input.commitmentId, dealId: input.deal.id },
  });
  if (!c) throw new Error("COMMITMENT_NOT_FOUND");
  if (c.status !== "SOFT_COMMIT") throw new Error("INVALID_COMMITMENT_STATE");
  if (input.deal.brokerId !== input.brokerUserId) {
    const u = await prisma.user.findUnique({ where: { id: input.brokerUserId }, select: { role: true } });
    if (u?.role !== "ADMIN") throw new Error("BROKER_ONLY");
  }

  const updated = await prisma.crmDealInvestorCommitment.update({
    where: { id: c.id },
    data: {
      status: "REJECTED",
      brokerRejectedAt: new Date(),
      brokerRejectedById: input.brokerUserId,
      rejectionReason: input.reason?.trim() || null,
    },
  });

  await recordInvestmentFlowAudit({
    dealId: input.deal.id,
    actorUserId: input.brokerUserId,
    action: "commitment_rejected",
    entityType: "CrmDealInvestorCommitment",
    entityId: c.id,
    metadata: { reason: input.reason ?? null },
  });

  return updated;
}

/** Broker records subscription signed (e.g. after e-sign provider or wet ink). Never auto-set. */
export async function brokerRecordSubscriptionSigned(input: {
  dealId: string;
  commitmentId: string;
  brokerUserId: string;
  documentId?: string | null;
}) {
  const c = await prisma.crmDealInvestorCommitment.findFirst({
    where: { id: input.commitmentId, dealId: input.dealId, status: "CONFIRMED" },
    include: { subscription: true },
  });
  if (!c?.subscription) throw new Error("SUBSCRIPTION_NOT_READY");

  if (input.documentId) {
    const doc = await prisma.dealDocument.findFirst({
      where: { id: input.documentId, dealId: input.dealId },
      select: { id: true },
    });
    if (!doc) throw new Error("DOCUMENT_NOT_FOUND");
  }

  const sub = await prisma.crmDealInvestorSubscription.update({
    where: { id: c.subscription.id },
    data: {
      signed: true,
      signedAt: new Date(),
      documentId: input.documentId ?? undefined,
    },
  });

  await recordInvestmentFlowAudit({
    dealId: input.dealId,
    actorUserId: input.brokerUserId,
    action: "subscription_signed",
    entityType: "CrmDealInvestorSubscription",
    entityId: sub.id,
    metadata: { documentId: input.documentId ?? null },
  });

  return sub;
}

/** Explicit broker/admin recording of funds received — `received` must be true (no auto-credit). */
export async function brokerRecordPaymentReceived(input: {
  dealId: string;
  subscriptionId: string;
  amountCents: number;
  method: string;
  referenceNumber?: string | null;
  received: boolean;
  recordedByUserId: string;
}) {
  if (!input.received) throw new Error("RECEIVED_REQUIRED");
  if (input.amountCents <= 0) throw new Error("INVALID_AMOUNT");
  const m = input.method.toUpperCase();
  if (!PAY_METHODS.has(m)) throw new Error("INVALID_METHOD");

  const sub = await prisma.crmDealInvestorSubscription.findFirst({
    where: { id: input.subscriptionId, commitment: { dealId: input.dealId } },
    include: { commitment: true },
  });
  if (!sub) throw new Error("SUBSCRIPTION_NOT_FOUND");
  if (!sub.signed) throw new Error("SUBSCRIPTION_NOT_SIGNED");
  if (!sub.commitment.spvId) throw new Error("SPV_REQUIRED_FOR_FUNDING");

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.crmDealInvestorPayment.create({
      data: {
        subscriptionId: sub.id,
        amountCents: input.amountCents,
        method: m,
        received: true,
        receivedAt: new Date(),
        referenceNumber: input.referenceNumber?.trim() || null,
        recordedByUserId: input.recordedByUserId,
      },
    });
    await recalculateCapTableForSpv(tx, sub.commitment.spvId!);
    return p;
  });

  await recordInvestmentFlowAudit({
    dealId: input.dealId,
    actorUserId: input.recordedByUserId,
    action: "payment_received",
    entityType: "CrmDealInvestorPayment",
    entityId: payment.id,
    metadata: {
      amountCents: payment.amountCents,
      method: payment.method,
      subscriptionId: sub.id,
    },
  });
  await recordInvestmentFlowAudit({
    dealId: input.dealId,
    actorUserId: input.recordedByUserId,
    action: "cap_table_updated",
    entityType: "AmfSpv",
    entityId: sub.commitment.spvId,
    metadata: { reason: "payment_received" },
  });

  return payment;
}

export async function getCapitalSummaryForDeal(dealId: string) {
  const commitments = await prisma.crmDealInvestorCommitment.findMany({
    where: { dealId },
    include: {
      subscription: { include: { payments: true } },
    },
  });

  let softCommitCents = 0;
  let confirmedCommitCents = 0;
  let receivedCents = 0;

  for (const c of commitments) {
    if (c.status === "REJECTED" || c.status === "WITHDRAWN") continue;
    if (c.status === "SOFT_COMMIT") softCommitCents += c.committedAmountCents;
    if (c.status === "CONFIRMED") confirmedCommitCents += c.committedAmountCents;
    for (const p of c.subscription?.payments ?? []) {
      if (p.received) receivedCents += p.amountCents;
    }
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { executionMetadata: true },
  });
  const targetCents = deal ? parseInvestmentTargetCents(deal) : null;
  const committedCapitalCents = softCommitCents + confirmedCommitCents;

  return {
    investmentTargetCents: targetCents,
    softCommitCents,
    confirmedCommitCents,
    committedCapitalCents,
    receivedCapitalCents: receivedCents,
    remainingGapCents:
      targetCents != null ? Math.max(0, targetCents - receivedCents) : null,
  };
}

export { COMMIT_STATUSES };
