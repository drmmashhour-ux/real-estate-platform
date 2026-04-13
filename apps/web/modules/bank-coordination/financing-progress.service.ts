import type { DealFinancingCoordinationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function upsertFinancingStatus(dealId: string, status: DealFinancingCoordinationStatus) {
  return prisma.dealBankCoordination.upsert({
    where: { dealId },
    create: { dealId, financingStatus: status },
    update: { financingStatus: status },
  });
}
