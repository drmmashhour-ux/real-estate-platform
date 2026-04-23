import { getGuestId } from "@/lib/auth/session";
import { assertMarketingAdmin, MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { getCampaignOverviewStats } from "@/src/modules/bnhub-marketing/services/marketingAnalyticsService";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await assertMarketingAdmin(await getGuestId());
    const overview = await getCampaignOverviewStats();
    const alerts = await prisma.bnhubMarketingRecommendation.count({
      where: { status: "OPEN", priority: { in: ["HIGH", "CRITICAL"] } },
    });
    return Response.json({ ...overview, recommendationAlerts: alerts });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
