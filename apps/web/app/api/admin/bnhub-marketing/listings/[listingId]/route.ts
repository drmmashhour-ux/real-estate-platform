import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertMarketingAdmin, MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
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
    await assertMarketingAdmin(await getGuestId());
    const { listingId } = await params;
    const [profile, recommendations, stats] = await Promise.all([
      getListingMarketingProfile(listingId),
      listRecommendationsForListing(listingId),
      getListingPromotionStats(listingId),
    ]);
    return Response.json({ profile, recommendations, stats });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
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
    await assertMarketingAdmin(await getGuestId());
    const { listingId } = await params;
    const profile = await refreshListingReadiness(listingId);
    await generateRecommendationsForListing(listingId, null);
    const recommendations = await listRecommendationsForListing(listingId);
    return Response.json({ profile, recommendations });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 400 });
  }
}
