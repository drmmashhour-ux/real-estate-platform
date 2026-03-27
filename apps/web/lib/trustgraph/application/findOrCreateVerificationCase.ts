import type { VerificationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createVerificationCase } from "@/lib/trustgraph/application/createVerificationCase";

/**
 * Returns an open case for the entity if one exists; otherwise creates a new pending case.
 */
export async function findOrCreateActiveVerificationCase(params: {
  entityType: VerificationEntityType;
  entityId: string;
  createdBy?: string | null;
  assignedTo?: string | null;
}) {
  const existing = await prisma.verificationCase.findFirst({
    where: {
      entityType: params.entityType,
      entityId: params.entityId,
      status: { notIn: ["approved", "rejected"] },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return { case: existing, created: false as const };

  const row = await createVerificationCase({
    entityType: params.entityType,
    entityId: params.entityId,
    createdBy: params.createdBy ?? null,
    assignedTo: params.assignedTo ?? null,
  });

  return { case: row, created: true as const };
}
