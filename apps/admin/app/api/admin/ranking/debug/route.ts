import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { reputationEngineFlags } from "@/config/feature-flags";
import { computeReputationRankingForListing } from "@/modules/ranking/ranking-engine.service";
import { computeListingQualityBundle } from "@/modules/reputation/listing-quality.service";
import { runReviewEngineForListing } from "@/modules/reviews/review-engine.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  if (!reputationEngineFlags.rankingDebugV1) {
    return NextResponse.json({ error: "FEATURE_RANKING_DEBUG_V1 is off" }, { status: 403 });
  }

  const listingId = request.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId query required" }, { status: 400 });
  }

  const [ranking, quality, reviews] = await Promise.all([
    computeReputationRankingForListing(listingId),
    computeListingQualityBundle(listingId),
    runReviewEngineForListing(listingId),
  ]);

  return NextResponse.json({
    listingId,
    ranking,
    quality,
    reviews,
  });
}
