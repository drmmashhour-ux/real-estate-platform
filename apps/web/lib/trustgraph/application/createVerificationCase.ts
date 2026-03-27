import { prisma } from "@/lib/db";
import type { VerificationEntityType } from "@prisma/client";
import { verificationCaseRepository } from "@/lib/trustgraph/infrastructure/repositories/verificationCaseRepository";

export async function createVerificationCase(params: {
  entityType: VerificationEntityType;
  entityId: string;
  createdBy?: string | null;
  assignedTo?: string | null;
}) {
  return prisma.verificationCase.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      createdBy: params.createdBy ?? undefined,
      assignedTo: params.assignedTo ?? undefined,
      status: "pending",
      overallScore: 50,
      trustLevel: "medium",
      readinessLevel: "not_ready",
      summary: {},
    },
  });
}

export async function getLatestCaseForEntity(entityType: VerificationEntityType, entityId: string) {
  return verificationCaseRepository.findLatestForEntity(entityType, entityId);
}
