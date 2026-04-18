import type { ComplianceEscalationTargetRole, ComplianceEscalationType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { complianceAuditKeys, logComplianceAudit } from "@/lib/admin/compliance-audit";

export async function createEscalation(input: {
  actorUserId: string;
  caseId: string;
  escalationType: ComplianceEscalationType;
  targetRole: ComplianceEscalationTargetRole;
}) {
  const row = await prisma.complianceEscalation.create({
    data: {
      caseId: input.caseId,
      escalationType: input.escalationType,
      targetRole: input.targetRole,
      status: "open",
    },
  });

  await prisma.complianceCase.update({
    where: { id: input.caseId },
    data: { status: "escalated" },
  });

  await logComplianceAudit({
    actorUserId: input.actorUserId,
    actionKey: complianceAuditKeys.escalationCreated,
    caseId: input.caseId,
    payload: { escalationId: row.id },
  });

  return row;
}

export async function resolveEscalation(id: string, actorUserId: string) {
  const row = await prisma.complianceEscalation.update({
    where: { id },
    data: { status: "resolved" },
  });

  await logComplianceAudit({
    actorUserId,
    actionKey: complianceAuditKeys.escalationResolved,
    caseId: row.caseId,
    payload: { escalationId: id },
  });

  return row;
}
