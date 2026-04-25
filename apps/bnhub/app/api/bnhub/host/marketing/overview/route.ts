import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { listCampaigns } from "@/src/modules/bnhub-marketing/services/marketingCampaignService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const listings = await prisma.shortTermListing.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true, city: true, listingCode: true },
      take: 20,
    });

    const { campaigns, total } = await listCampaigns({ hostUserId: userId, take: 20 });

    const openRecs = await prisma.bnhubMarketingRecommendation.count({
      where: {
        status: "OPEN",
        listing: { ownerId: userId },
      },
    });

    return Response.json({ listings, campaigns, totalCampaigns: total, openRecommendations: openRecs });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: 401 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
