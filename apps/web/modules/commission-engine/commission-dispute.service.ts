import { prisma } from "@/lib/db";
import { brokerageOfficeAuditKeys, logBrokerageOfficeAudit } from "@/lib/brokerage/office-audit";

export async function disputeCommissionCase(input: {
  caseId: string;
  officeId: string;
  actorUserId: string;
  note?: string;
}) {
  const row = await prisma.brokerageCommissionCase.update({
    where: { id: input.caseId, officeId: input.officeId },
    data: { status: "disputed" },
  });
  await logBrokerageOfficeAudit({
    officeId: input.officeId,
    actorUserId: input.actorUserId,
    actionKey: brokerageOfficeAuditKeys.commissionDisputed,
    payload: { caseId: input.caseId, note: input.note ?? null },
  });
  return row;
}
