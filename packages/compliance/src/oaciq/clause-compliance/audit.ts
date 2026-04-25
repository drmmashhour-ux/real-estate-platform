import { logAuditEvent } from "@/lib/compliance/log-audit-event";

export async function logClauseComplianceAudit(input: {
  ownerType: string;
  ownerId: string;
  actorId: string | null;
  contractId?: string | null;
  dealId?: string | null;
  event: "clause_created" | "clause_modified" | "clause_validated" | "clause_approved";
  summary: string;
  details?: Record<string, unknown> | null;
  aiAssisted?: boolean;
}) {
  return logAuditEvent({
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    entityType: "oaciq_clause",
    entityId: input.contractId ?? input.dealId ?? "draft",
    actionType: input.event,
    moduleKey: "oaciq_clause_compliance",
    actorId: input.actorId,
    linkedContractId: input.contractId ?? null,
    linkedDealId: input.dealId ?? null,
    aiAssisted: input.aiAssisted ?? false,
    humanReviewRequired: true,
    humanReviewCompleted: input.event === "clause_approved",
    summary: input.summary,
    details: input.details ?? null,
  });
}
