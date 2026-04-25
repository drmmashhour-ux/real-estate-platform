import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  assertListingMarketingAccess,
  MarketingAuthError,
} from "@/src/modules/bnhub-marketing/services/marketingAccess";
import {
  getListingMarketingProfile,
  listRecommendationsForListing,
  refreshListingReadiness,
} from "@/src/modules/bnhub-marketing/services/marketingProfileService";
import { generateRecommendationsForListing } from "@/src/modules/bnhub-marketing/services/marketingRecommendationService";
import { getListingPromotionStats } from "@/src/modules/bnhub-marketing/services/marketingAnalyticsService";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const userId = await getGuestId();
    const { listingId } = await params;
    await assertListingMarketingAccess(userId, listingId);
    const [profile, recommendations, stats] = await Promise.all([
      getListingMarketingProfile(listingId),
      listRecommendationsForListing(listingId),
      getListingPromotionStats(listingId),
    ]);
    return Response.json({ profile, recommendations, stats });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      const st = e.code === "NOT_FOUND" ? 404 : e.code === "UNAUTHORIZED" ? 401 : 403;
      return Response.json({ error: e.message }, { status: st });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const userId = await getGuestId();
    const { listingId } = await params;
    await assertListingMarketingAccess(userId, listingId);
    const profile = await refreshListingReadiness(listingId);
    await generateRecommendationsForListing(listingId, null);
    const recommendations = await listRecommendationsForListing(listingId);
    return Response.json({ profile, recommendations });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      const st = e.code === "NOT_FOUND" ? 404 : e.code === "UNAUTHORIZED" ? 401 : 403;
      return Response.json({ error: e.message }, { status: st });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 400 });
  }
}
