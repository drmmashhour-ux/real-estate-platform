import { intelligenceFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { getMemorySignalsForEngine } from "@/lib/marketplace-memory/memory-query.service";
import {
  buildMemoryRankHintFromSignals,
  memoryListingAffinity01,
} from "@/lib/marketplace-memory/memory-ranking-hint";
import { getInvestorByEmail } from "@/modules/investor/auth/investor-auth";
import { listBnhubListingIdsForInvestorScope } from "@/modules/investment/investor-recommendation-access.service";
import { getPortfolioRecommendationSummaryForListingIds } from "@/modules/investment/portfolio-recommendation.service";

/** Server-only bundle for BNHub investor portal recommendation pages. */
export async function loadBnhubInvestorRecommendationsView(
  email: string | null | undefined,
  opts?: { userId?: string | null },
) {
  if (!email?.trim()) {
    return { ok: false as const, reason: "no_session" as const };
  }

  const access = await getInvestorByEmail(email);
  if (!access?.isActive) {
    return { ok: false as const, reason: "no_access" as const };
  }

  const listingIds = await listBnhubListingIdsForInvestorScope(access);

  const rows = await prisma.investmentRecommendation.findMany({
    where: {
      scopeType: "listing",
      scopeId: { in: listingIds },
      status: "active",
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  let recommendations = rows;
  if (opts?.userId && intelligenceFlags.marketplaceMemoryEngineV1) {
    const signals = await getMemorySignalsForEngine(opts.userId, null);
    const hint = buildMemoryRankHintFromSignals(signals);
    if (hint && rows.length > 0) {
      const ids = [...new Set(rows.map((r) => r.scopeId))];
      const listings = await prisma.shortTermListing.findMany({
        where: { id: { in: ids } },
        select: { id: true, city: true, region: true, propertyType: true },
      });
      const byId = new Map(listings.map((l) => [l.id, l]));
      const fit = (scopeId: string) => {
        const l = byId.get(scopeId);
        return l ? memoryListingAffinity01(l, hint) : 0;
      };
      recommendations = [...rows].sort((a, b) => {
        const sa = (a.score ?? 0) + fit(a.scopeId) * 8;
        const sb = (b.score ?? 0) + fit(b.scopeId) * 8;
        if (sb !== sa) return sb - sa;
        return String(a.id).localeCompare(String(b.id));
      });
    }
  }

  const summary = await getPortfolioRecommendationSummaryForListingIds(listingIds);

  return {
    ok: true as const,
    access,
    listingIds,
    recommendations,
    summary,
  };
}
