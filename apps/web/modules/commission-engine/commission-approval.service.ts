import { prisma } from "@/lib/db";
import { brokerageOfficeAuditKeys, logBrokerageOfficeAudit } from "@/lib/brokerage/office-audit";

export async function approveCommissionCase(input: {
  caseId: string;
  officeId: string;
  actorUserId: string;
}) {
  const row = await prisma.brokerageCommissionCase.update({
    where: { id: input.caseId, officeId: input.officeId },
    data: { status: "approved" },
  });
  await logBrokerageOfficeAudit({
    officeId: input.officeId,
    actorUserId: input.actorUserId,
    actionKey: brokerageOfficeAuditKeys.commissionApproved,
    payload: { caseId: input.caseId },
  });
  return row;
}
