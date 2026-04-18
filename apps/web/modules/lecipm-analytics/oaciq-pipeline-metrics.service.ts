import { prisma } from "@/lib/db";

/**
 * Aggregates stored deal timestamps only — no inferred legal milestones.
 */
export async function getDealPipelineMetrics(dealId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      createdAt: true,
      updatedAt: true,
      status: true,
      negotiationThreads: { select: { id: true } },
    },
  });
  if (!deal) return null;

  return {
    dealId,
    status: deal.status,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
    negotiationRoundHint: deal.negotiationThreads.length,
  };
}
