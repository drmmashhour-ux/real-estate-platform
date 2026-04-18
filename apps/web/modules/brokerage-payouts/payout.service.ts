import { prisma } from "@/lib/db";
import { brokerageOfficeAuditKeys, logBrokerageOfficeAudit } from "@/lib/brokerage/office-audit";
import type { OfficePayoutRunInput } from "./payouts.types";
import { payoutDisclaimer } from "./payout-explainer";

export async function createPayoutFromCommissionCases(input: OfficePayoutRunInput) {
  const cases = await prisma.brokerageCommissionCase.findMany({
    where: {
      id: { in: input.commissionCaseIds },
      officeId: input.officeId,
      brokerUserId: input.brokerUserId,
      status: "approved",
    },
    include: { splits: true },
  });
  if (cases.length === 0) {
    return { ok: false as const, error: "No approved commission cases matched." };
  }

  let amount = 0;
  for (const c of cases) {
    const brokerLine = c.splits.find((s) => s.payeeKind === "broker" && s.payeeUserId === input.brokerUserId);
    if (brokerLine) amount += brokerLine.amountCents;
  }

  const payout = await prisma.officePayout.create({
    data: {
      officeId: input.officeId,
      brokerUserId: input.brokerUserId,
      status: "ready",
      amountCents: amount,
      lines: {
        create: cases.map((c) => ({
          sourceType: "commission_case" as const,
          sourceId: c.id,
          description: `Commission case ${c.id.slice(0, 8)}`,
          amountCents:
            c.splits.find((s) => s.payeeKind === "broker" && s.payeeUserId === input.brokerUserId)?.amountCents ?? 0,
        })),
      },
    },
    include: { lines: true },
  });

  await logBrokerageOfficeAudit({
    officeId: input.officeId,
    actorUserId: input.actorUserId,
    actionKey: brokerageOfficeAuditKeys.payoutCreated,
    payload: { payoutId: payout.id, amountCents: amount },
  });

  return { ok: true as const, payout, disclaimer: payoutDisclaimer() };
}

export async function approvePayout(payoutId: string, officeId: string, actorUserId: string) {
  const row = await prisma.officePayout.update({
    where: { id: payoutId, officeId },
    data: { status: "approved", approvedAt: new Date(), approvedByUserId: actorUserId },
  });
  await logBrokerageOfficeAudit({
    officeId,
    actorUserId,
    actionKey: brokerageOfficeAuditKeys.payoutApproved,
    payload: { payoutId },
  });
  return row;
}

export async function markPayoutPaid(payoutId: string, officeId: string, actorUserId: string) {
  const row = await prisma.officePayout.update({
    where: { id: payoutId, officeId },
    data: { status: "paid", paidAt: new Date(), paidRecordedByUserId: actorUserId },
  });
  await logBrokerageOfficeAudit({
    officeId,
    actorUserId,
    actionKey: brokerageOfficeAuditKeys.payoutPaid,
    payload: { payoutId },
  });
  return row;
}

export async function listPayouts(officeId: string) {
  return prisma.officePayout.findMany({
    where: { officeId },
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: { broker: { select: { id: true, name: true, email: true } }, lines: true },
  });
}
