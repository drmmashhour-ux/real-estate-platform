import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";

export async function createCorrectiveActionPlan(input: {
  complaintCaseId: string;
  rootCauseSummary: string;
  correctiveActions: string[];
  preventiveActions: string[];
  ownerUserId: string;
  dueDate?: Date | null;
}): Promise<{ capaId: string }> {
  const c = await prisma.complaintCase.findUnique({
    where: { id: input.complaintCaseId },
    select: { id: true, ownerType: true, ownerId: true, linkedListingId: true, linkedDealId: true },
  });
  if (!c) throw new Error("COMPLAINT_NOT_FOUND");

  const row = await prisma.complaintCorrectiveActionPlan.create({
    data: {
      complaintCaseId: input.complaintCaseId,
      rootCauseSummary: input.rootCauseSummary,
      correctiveActions: input.correctiveActions,
      preventiveActions: input.preventiveActions,
      ownerUserId: input.ownerUserId,
      dueDate: input.dueDate ?? null,
    },
    select: { id: true },
  });

  await logAuditEvent({
    ownerType: c.ownerType,
    ownerId: c.ownerId,
    entityType: "complaint_capa",
    entityId: row.id,
    actionType: "complaint_capa_created",
    moduleKey: "complaints",
    actorId: input.ownerUserId,
    linkedComplaintCaseId: c.id,
    linkedListingId: c.linkedListingId,
    linkedDealId: c.linkedDealId,
    summary: "Corrective action plan created",
    details: { capaId: row.id, complaintCaseId: c.id },
    severity: "info",
  });

  return { capaId: row.id };
}

export async function completeCorrectiveAction(input: {
  capaId: string;
  performedByUserId: string;
}): Promise<void> {
  const row = await prisma.complaintCorrectiveActionPlan.update({
    where: { id: input.capaId },
    data: { completed: true, completedAt: new Date() },
    include: { complaintCase: { select: { id: true, ownerType: true, ownerId: true, linkedListingId: true, linkedDealId: true } } },
  });

  await logAuditEvent({
    ownerType: row.complaintCase.ownerType,
    ownerId: row.complaintCase.ownerId,
    entityType: "complaint_capa",
    entityId: row.id,
    actionType: "complaint_resolved",
    moduleKey: "complaints",
    actorId: input.performedByUserId,
    linkedComplaintCaseId: row.complaintCase.id,
    linkedListingId: row.complaintCase.linkedListingId,
    linkedDealId: row.complaintCase.linkedDealId,
    summary: "Corrective action plan completed",
    severity: "info",
  });
}

export async function linkComplaintToComplianceRules(input: {
  complaintCaseId: string;
  complianceCaseId: string;
}): Promise<void> {
  await prisma.complaintCase.update({
    where: { id: input.complaintCaseId },
    data: { linkedComplianceCaseId: input.complianceCaseId },
  });
}
