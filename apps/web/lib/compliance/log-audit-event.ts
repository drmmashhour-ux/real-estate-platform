import { prisma } from "@/lib/db";
import { buildAuditNumber, buildAuditSummary, computeImmutableHash } from "@/lib/compliance/audit";

export type LogAuditInput = {
  ownerType: string;
  ownerId: string;
  entityType: string;
  entityId: string;
  actionType: string;
  moduleKey: string;
  actorType?: string;
  actorId?: string | null;
  linkedListingId?: string | null;
  linkedDealId?: string | null;
  linkedOfferId?: string | null;
  linkedContractId?: string | null;
  linkedComplaintCaseId?: string | null;
  linkedTrustDepositId?: string | null;
  aiAssisted?: boolean;
  humanReviewRequired?: boolean;
  humanReviewCompleted?: boolean;
  severity?: string;
  summary: string;
  details?: Record<string, unknown> | null;
};

export async function logAuditEvent(input: LogAuditInput) {
  const eventTimestamp = new Date().toISOString();
  const immutableHash = computeImmutableHash({
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    entityType: input.entityType,
    entityId: input.entityId,
    actionType: input.actionType,
    moduleKey: input.moduleKey,
    actorType: input.actorType ?? null,
    actorId: input.actorId ?? null,
    linkedListingId: input.linkedListingId ?? null,
    linkedDealId: input.linkedDealId ?? null,
    linkedOfferId: input.linkedOfferId ?? null,
    linkedContractId: input.linkedContractId ?? null,
    linkedComplaintCaseId: input.linkedComplaintCaseId ?? null,
    linkedTrustDepositId: input.linkedTrustDepositId ?? null,
    aiAssisted: input.aiAssisted ?? false,
    summary: input.summary,
    details: input.details ?? null,
    eventTimestamp,
  });

  return prisma.complianceAuditRecord.create({
    data: {
      auditNumber: buildAuditNumber(),
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      entityType: input.entityType,
      entityId: input.entityId,
      actionType: input.actionType,
      moduleKey: input.moduleKey,
      actorType: input.actorType ?? null,
      actorId: input.actorId ?? null,
      linkedListingId: input.linkedListingId ?? null,
      linkedDealId: input.linkedDealId ?? null,
      linkedOfferId: input.linkedOfferId ?? null,
      linkedContractId: input.linkedContractId ?? null,
      linkedComplaintCaseId: input.linkedComplaintCaseId ?? null,
      linkedTrustDepositId: input.linkedTrustDepositId ?? null,
      aiAssisted: input.aiAssisted ?? false,
      humanReviewRequired: input.humanReviewRequired ?? false,
      humanReviewCompleted: input.humanReviewCompleted ?? false,
      severity: input.severity ?? "info",
      summary: buildAuditSummary({
        moduleKey: input.moduleKey,
        entityType: input.entityType,
        actionType: input.actionType,
        summary: input.summary,
      }),
      details: input.details ?? undefined,
      immutableHash,
    },
  });
}

/** Resolve trust deposit → trust account profile owner scope for audit partitioning. */
export async function auditOwnerFromTrustDepositId(depositId: string): Promise<{ ownerType: string; ownerId: string }> {
  const deposit = await prisma.trustDeposit.findUnique({
    where: { id: depositId },
    select: {
      trustAccountProfile: { select: { ownerType: true, ownerId: true } },
    },
  });
  const p = deposit?.trustAccountProfile;
  if (!p) {
    return { ownerType: "platform", ownerId: "unknown_trust_scope" };
  }
  return { ownerType: p.ownerType, ownerId: p.ownerId };
}
