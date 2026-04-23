import { prisma } from "@/lib/db";

export type CreateComplianceAlertInput = {
  ownerType: string;
  ownerId: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  relatedEntityType?: string;
  relatedEntityId?: string | null;
  detectedBy?: string;
};

/** Persists a `ComplianceRiskEvent` (alert / risk signal for dashboards and review). */
export async function createComplianceAlert(input: CreateComplianceAlertInput) {
  return prisma.complianceRiskEvent.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      relatedEntityType: input.relatedEntityType ?? "compliance",
      relatedEntityId: input.relatedEntityId ?? null,
      riskType: input.alertType,
      severity: input.severity,
      description: `${input.title}\n${input.description}`,
      detectedBy: input.detectedBy ?? "system",
      requiresReview: true,
      reviewed: false,
    },
  });
}
