import { prisma } from "@/lib/db";

export type ComplianceModuleAuditAction =
  | "evaluated"
  | "blocked"
  | "approved"
  | "override_requested"
  | "override_confirmed"
  | "form_generated"
  | "invoice_generated"
  | "record_created";

export type ComplianceAuditLogEntry = {
  id: string;
  caseId: string;
  actorId: string;
  actorType: "system" | "broker" | "admin";
  action: ComplianceModuleAuditAction;
  details: Record<string, unknown>;
  createdAt: string;
};

/** Persists to `financial_compliance_events` (additive; broker-scoped financial compliance stream). */
export async function writeComplianceEvaluationAudit(input: {
  ownerType: string;
  ownerId: string;
  caseId: string;
  actorId: string;
  actorType: "system" | "broker" | "admin";
  action: ComplianceModuleAuditAction;
  details: Record<string, unknown>;
}): Promise<void> {
  await prisma.financialComplianceEvent.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      eventType: `lecipm_unified_compliance:${input.action}`,
      entityType: "compliance_case",
      entityId: input.caseId,
      performedById: input.actorType === "system" ? null : input.actorId,
      details: {
        actorType: input.actorType,
        ...input.details,
      },
    },
  });
}
