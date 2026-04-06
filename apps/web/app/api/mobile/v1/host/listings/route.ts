import { prisma } from "@/lib/db";
import { requireMobileUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";
import { fetchListingCardWithQuality, toPublicListingCard } from "@/lib/mobile/listingMobileDto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const appRole = await resolveMobileAppRoleFromRequest(request, user);
    if (appRole === "guest" && user.role !== "ADMIN") {
      return Response.json({ error: "Host access required" }, { status: 403 });
    }
    const rows = await prisma.shortTermListing.findMany({
      where: { ownerId: user.id },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    const listings: unknown[] = [];
    for (const r of rows) {
      const full = await fetchListingCardWithQuality(r.id);
      if (!full) continue;
      const card = toPublicListingCard(full);
      const trust = await prisma.bnhubTrustProfile.findUnique({
        where: { listingId: r.id },
        select: { trustScore: true, overallRiskLevel: true, status: true },
      });
      const pricing = await prisma.bnhubDynamicPricingProfile.findUnique({
        where: { listingId: r.id },
        select: { recommendedPrice: true, confidenceScore: true, minPrice: true, maxPrice: true },
      });
      listings.push({
        ...card,
        listingStatus: full.listingStatus,
        hostTrust: trust
          ? { trustScore: trust.trustScore, riskLevel: trust.overallRiskLevel, status: trust.status }
          : null,
        pricingRecommendation: pricing
          ? {
              recommendedUsd: Number(pricing.recommendedPrice),
              confidence: pricing.confidenceScore,
              minUsd: Number(pricing.minPrice),
              maxUsd: Number(pricing.maxPrice),
            }
          : null,
      });
    }
    return Response.json({ listings });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
