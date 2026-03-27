import { getGuestId } from "@/lib/auth/session";
import { getLeadConversionStats, listLeadsForHost } from "@/src/modules/bnhub-growth-engine/services/leadEngineService";
import { listGrowthCampaigns } from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [campaigns, leads, stats, listings] = await Promise.all([
    listGrowthCampaigns({ hostUserId: userId, take: 30 }),
    listLeadsForHost(userId),
    getLeadConversionStats(userId),
    prisma.shortTermListing.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true, city: true, listingCode: true },
      take: 30,
    }),
  ]);
  return Response.json({ campaigns, leads, stats, listings });
}
