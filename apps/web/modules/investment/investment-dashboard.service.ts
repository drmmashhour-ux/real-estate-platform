/**
 * Read-only advisory snapshots from `InvestmentOpportunity` — not personalized advice execution.
 */
import type { InvestmentOpportunity, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export { formatExpectedRoiBand, summarizeRationale } from "@/modules/investment/investment-opportunity-formatters";

export type InvestmentOpportunitiesQuery = {
  riskLevels?: string[];
  minScore?: number;
  maxScore?: number;
  take?: number;
};

export type InvestmentOpportunityRow = Pick<
  InvestmentOpportunity,
  | "id"
  | "listingId"
  | "score"
  | "expectedROI"
  | "riskLevel"
  | "recommendedInvestmentMajor"
  | "rationaleJson"
  | "createdAt"
> & {
  listingTitle: string | null;
};

export async function listInvestmentOpportunitiesForDashboard(
  q: InvestmentOpportunitiesQuery = {}
): Promise<InvestmentOpportunityRow[]> {
  const take = Math.min(Math.max(q.take ?? 200, 1), 500);

  const riskFilter =
    q.riskLevels && q.riskLevels.length > 0 ?
      {
        riskLevel: { in: q.riskLevels },
      }
    : {};

  const scoreBounds: Prisma.FloatFilter = {};
  if (q.minScore != null) scoreBounds.gte = q.minScore;
  if (q.maxScore != null) scoreBounds.lte = q.maxScore;

  return prisma.investmentOpportunity.findMany({
    where: {
      ...riskFilter,
      ...(Object.keys(scoreBounds).length > 0 ? { score: scoreBounds } : {}),
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      listingId: true,
      score: true,
      expectedROI: true,
      riskLevel: true,
      recommendedInvestmentMajor: true,
      rationaleJson: true,
      createdAt: true,
      listing: { select: { title: true } },
    },
  }).then((rows) =>
    rows.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      score: r.score,
      expectedROI: r.expectedROI,
      riskLevel: r.riskLevel,
      recommendedInvestmentMajor: r.recommendedInvestmentMajor,
      rationaleJson: r.rationaleJson,
      createdAt: r.createdAt,
      listingTitle: r.listing?.title ?? null,
    }))
  );
}
