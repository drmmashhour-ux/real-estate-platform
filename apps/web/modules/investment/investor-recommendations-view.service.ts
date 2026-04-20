import { prisma } from "@/lib/db";
import { getInvestorByEmail } from "@/modules/investor/auth/investor-auth";
import { listBnhubListingIdsForInvestorScope } from "@/modules/investment/investor-recommendation-access.service";
import { getPortfolioRecommendationSummaryForListingIds } from "@/modules/investment/portfolio-recommendation.service";

/** Server-only bundle for BNHub investor portal recommendation pages. */
export async function loadBnhubInvestorRecommendationsView(email: string | null | undefined) {
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

  const summary = await getPortfolioRecommendationSummaryForListingIds(listingIds);

  return {
    ok: true as const,
    access,
    listingIds,
    recommendations: rows,
    summary,
  };
}
