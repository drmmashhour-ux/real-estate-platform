import { revenueV4Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { scoreRevenuePotentialProxy, confidenceBandFromNumeric } from "./revenue.scoring";
import type { PrioritizedRevenueItem, RevenuePotentialEvaluation } from "./revenue.types";
import { logRevenueEngineV4Event } from "./revenue.logger";

export async function evaluateFsboRevenuePotential(listingId: string): Promise<RevenuePotentialEvaluation | null> {
  if (!revenueV4Flags.revenueEngineV1) return null;

  const row = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: {
      _count: { select: { buyerListingViews: true, leads: true } },
    },
  });
  if (!row) return null;

  const featured = row.featuredUntil != null && row.featuredUntil > new Date();
  const { score, explanation } = scoreRevenuePotentialProxy({
    hasPaidPublish: row.paidPublishAt != null,
    isFeatured: featured,
    leadCount: row._count.leads,
    viewCount: row._count.buyerListingViews,
    trustScore: row.trustScore,
  });

  const conf01 = row.trustScore != null && row.trustScore > 30 ? 0.62 : 0.42;
  const evaluation: RevenuePotentialEvaluation = {
    listingId,
    revenuePotentialScore: score,
    confidence: confidenceBandFromNumeric(conf01),
    drivers: explanation,
    cautions:
      row._count.buyerListingViews > 80 && row._count.leads === 0
        ? ["high_traffic_low_conversion — review price/trust before monetization push"]
        : [],
  };

  await logRevenueEngineV4Event({
    engine: "revenue",
    action: "evaluate_fsbo_revenue_potential",
    entityType: "fsbo_listing",
    entityId: listingId,
    outputJson: evaluation as unknown as Record<string, unknown>,
    confidence: conf01 * 100,
    explanation: evaluation.drivers.join("; "),
  });

  return evaluation;
}

export async function prioritizeRevenueOpportunities(limit = 40): Promise<PrioritizedRevenueItem[]> {
  if (!revenueV4Flags.revenueEngineV1) return [];

  const rows = await prisma.fsboListing.findMany({
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    include: { _count: { select: { buyerListingViews: true, leads: true } } },
    orderBy: { updatedAt: "desc" },
    take: 120,
  });

  const items: PrioritizedRevenueItem[] = [];
  for (const row of rows) {
    const featured = row.featuredUntil != null && row.featuredUntil > new Date();
    const { score } = scoreRevenuePotentialProxy({
      hasPaidPublish: row.paidPublishAt != null,
      isFeatured: featured,
      leadCount: row._count.leads,
      viewCount: row._count.buyerListingViews,
      trustScore: row.trustScore,
    });
    items.push({
      entityType: "fsbo_listing",
      entityId: row.id,
      priorityScore: score,
      summary: `${row.city} · views ${row._count.buyerListingViews} · leads ${row._count.leads}`,
    });
  }

  return items.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, limit);
}

/** Admin snapshot: prioritized FSBO queue + recent audit rows. */
export async function getRevenueEngineV4AdminSnapshot(logLimit = 25): Promise<{
  prioritized: PrioritizedRevenueItem[];
  recentAudit: { id: string; engine: string; action: string; createdAt: Date; confidence: number | null }[];
}> {
  const prioritized = await prioritizeRevenueOpportunities(20);
  const recentAudit = await prisma.revenueEngineV4AuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: logLimit,
    select: { id: true, engine: true, action: true, createdAt: true, confidence: true },
  });
  return { prioritized, recentAudit };
}
