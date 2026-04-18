import { prisma } from "@/lib/db";

/** Cross-check CRM leads for the listing to suggest re-engagement drafts (counts only). */
export async function countHotLeadsForListing(input: { brokerId: string; fsboListingId: string }): Promise<number> {
  return prisma.lead.count({
    where: {
      fsboListingId: input.fsboListingId,
      introducedByBrokerId: input.brokerId,
      aiTier: "hot",
      pipelineStatus: { notIn: ["won", "lost"] },
    },
  });
}
