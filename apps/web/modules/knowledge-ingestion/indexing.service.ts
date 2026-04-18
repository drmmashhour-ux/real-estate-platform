import { prisma } from "@/lib/db";

/**
 * Future: vector / keyword index for clause retrieval. v1: ClauseTemplate + DraftingSource rows.
 */
export async function markIndexed(ingestionId: string): Promise<void> {
  await prisma.draftingKnowledgeIngestion.update({
    where: { id: ingestionId },
    data: { status: "indexed" },
  });
}
