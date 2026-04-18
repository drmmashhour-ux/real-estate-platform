import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function upsertDealAsset(input: {
  dealId: string;
  assetType: string;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return prisma.dealAsset.create({
    data: {
      dealId: input.dealId,
      assetType: input.assetType,
      referenceId: input.referenceId ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listDealAssets(dealId: string) {
  return prisma.dealAsset.findMany({ where: { dealId }, orderBy: { createdAt: "desc" } });
}
