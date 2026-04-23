import { prisma } from "@/lib/db";

export type CreateComplianceAlertInput = {
  ownerType: string;
  ownerId: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
};

export async function createComplianceAlert(input: CreateComplianceAlertInput) {
  return prisma.complianceAlert.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      alertType: input.alertType,
      severity: input.severity,
      title: input.title,
      description: input.description,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  });
}
