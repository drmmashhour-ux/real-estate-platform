import { prisma } from "@/lib/db";
import { REVENUE_OPPORTUNITY_STATUS } from "@/src/modules/revenue/revenueEngine";

export type PriorityLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  intentScore: number;
  priorityScore: number;
  executionStage: string;
  nextBestAction: string | null;
  lastActivityAt: Date | null;
  updatedAt: Date;
  shortTermListingId: string | null;
  listingCode: string | null;
  /** Sum of open `RevenueOpportunity.valueEstimate` for this lead (monetization layer). */
  openRevenueValue: number;
  /** `priorityScore` + weighted open revenue — used for ordering. */
  monetizationRank: number;
};

const REVENUE_WEIGHT = 0.12;

/**
 * TOP USERS TO ACT ON NOW — `priorityScore` plus open revenue opportunity value (Close Room / CRM queue).
 */
export async function getTopPriorityLeads(limit = 20): Promise<PriorityLeadRow[]> {
  const pool = Math.min(120, Math.max(limit * 4, 40));
  const rows = await prisma.lead.findMany({
    where: {
      executionStage: { notIn: ["lost", "closed"] },
    },
    orderBy: [{ priorityScore: "desc" }, { lastActivityAt: "desc" }, { updatedAt: "desc" }],
    take: pool,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      intentScore: true,
      priorityScore: true,
      executionStage: true,
      nextBestAction: true,
      lastActivityAt: true,
      updatedAt: true,
      shortTermListingId: true,
      listingCode: true,
    },
  });
  if (rows.length === 0) return [];

  const sums = await prisma.revenueOpportunity.groupBy({
    by: ["leadId"],
    where: {
      status: REVENUE_OPPORTUNITY_STATUS.open,
      leadId: { in: rows.map((r) => r.id) },
    },
    _sum: { valueEstimate: true },
  });
  const revByLead = new Map<string, number>();
  for (const s of sums) {
    if (s.leadId) revByLead.set(s.leadId, s._sum.valueEstimate ?? 0);
  }

  const enriched: PriorityLeadRow[] = rows.map((r) => {
    const openRevenueValue = revByLead.get(r.id) ?? 0;
    const monetizationRank = r.priorityScore + openRevenueValue * REVENUE_WEIGHT;
    return { ...r, openRevenueValue, monetizationRank };
  });

  enriched.sort((a, b) => {
    if (b.monetizationRank !== a.monetizationRank) return b.monetizationRank - a.monetizationRank;
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    const ta = a.lastActivityAt?.getTime() ?? 0;
    const tb = b.lastActivityAt?.getTime() ?? 0;
    return tb - ta;
  });

  return enriched.slice(0, limit);
}
