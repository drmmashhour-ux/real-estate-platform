import { prisma } from "@/lib/db";

/** Placeholder for broker-curated precedent rows — v1 surfaces ingestion registry only. */
export async function listIngestionPrecedentHints(take = 20) {
  return prisma.draftingKnowledgeIngestion.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, title: true, sourceType: true, status: true, createdAt: true },
  });
}
