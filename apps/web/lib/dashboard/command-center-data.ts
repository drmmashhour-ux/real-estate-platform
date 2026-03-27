import { prisma } from "@/lib/db";
import { riskLevelPublic } from "@/modules/deal-analyzer/domain/scoring";

export type CommandListingRow = {
  id: string;
  title: string;
  city: string;
  status: string;
  trustScore: number | null;
  dealScore: number | null;
  dealRecommendation: string | null;
  riskLevel: "low" | "medium" | "high" | null;
  updatedAt: string;
  improvementPct: number | null;
};

export type CommandCenterPayload = {
  listings: CommandListingRow[];
  kpis: {
    avgTrust: number | null;
    avgDeal: number | null;
    activeListings: number;
    opportunitiesFound: number;
  };
};

/**
 * Aggregates FSBO listings + latest deal analysis for the premium command dashboard.
 */
export async function loadCommandCenterData(userId: string): Promise<CommandCenterPayload> {
  const rows = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      dealAnalyses: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          investmentScore: true,
          riskScore: true,
          recommendation: true,
        },
      },
      listingAiScores: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { trustScore: true, createdAt: true },
      },
    },
  });

  const listings: CommandListingRow[] = rows.map((r) => {
    const deal = r.dealAnalyses[0] ?? null;
    const scoresChrono = [...r.listingAiScores].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const oldest = scoresChrono[0];
    const newest = scoresChrono[scoresChrono.length - 1];
    let improvementPct: number | null = null;
    if (oldest && newest && oldest.createdAt.getTime() !== newest.createdAt.getTime()) {
      const o = oldest.trustScore;
      const n = newest.trustScore;
      if (o > 0) improvementPct = Math.round(((n - o) / o) * 100);
    }

    return {
      id: r.id,
      title: r.title,
      city: r.city,
      status: r.status,
      trustScore: r.trustScore,
      dealScore: deal?.investmentScore ?? null,
      dealRecommendation: deal?.recommendation ?? null,
      riskLevel: deal ? riskLevelPublic(deal.riskScore) : null,
      updatedAt: r.updatedAt.toISOString(),
      improvementPct,
    };
  });

  const trustVals = listings.map((l) => l.trustScore).filter((x): x is number => x != null);
  const dealVals = listings.map((l) => l.dealScore).filter((x): x is number => x != null);

  const avgTrust = trustVals.length ? Math.round(trustVals.reduce((a, b) => a + b, 0) / trustVals.length) : null;
  const avgDeal = dealVals.length ? Math.round(dealVals.reduce((a, b) => a + b, 0) / dealVals.length) : null;
  const activeListings = listings.filter((l) => l.status === "ACTIVE").length;

  const opportunitiesFound = listings.filter((l) => {
    if (l.dealScore == null) return false;
    if (l.dealScore >= 72) return true;
    const rec = (l.dealRecommendation ?? "").toLowerCase();
    return rec.includes("strong") || rec.includes("buy") || rec.includes("good");
  }).length;

  return { listings, kpis: { avgTrust, avgDeal, activeListings, opportunitiesFound } };
}
