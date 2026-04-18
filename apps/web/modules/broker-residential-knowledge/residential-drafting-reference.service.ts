import { prisma } from "@/lib/db";
import { brokerResidentialFlags } from "@/config/feature-flags";

export async function listDraftingSourceSummaries(take = 40) {
  if (!brokerResidentialFlags.residentialKnowledgeHooksV1) return [];
  return prisma.draftingSource.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, title: true, referenceLabel: true, versionLabel: true, sourceType: true },
  });
}

export async function countKnowledgeIngestions() {
  if (!brokerResidentialFlags.residentialKnowledgeHooksV1) return 0;
  return prisma.draftingKnowledgeIngestion.count();
}
