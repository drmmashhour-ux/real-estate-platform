import type { VerificationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Prisma-backed repository for verification cases — single place for queries used by TrustGraph services.
 */
export const verificationCaseRepository = {
  async findLatestForEntity(entityType: VerificationEntityType, entityId: string) {
    return prisma.verificationCase.findFirst({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.verificationCase.findUnique({ where: { id } });
  },
};
