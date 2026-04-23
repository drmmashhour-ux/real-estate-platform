import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { reputationEngineFlags } from "@/config/feature-flags";
import { computeListingQualityBundle } from "@/modules/reputation/listing-quality.service";
import { computeReputationRankingForListing } from "@/modules/ranking/ranking-engine.service";
import { toPublicTrustIndicators } from "@/modules/ranking/ranking-explainer.service";
import { schedulePersistListingRankingSnapshot } from "@/modules/reputation/snapshot-writer.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const listing = await prisma.shortTermListing.findUnique({
      where: { id },
      select: { id: true, title: true, city: true, bnhubListingRatingAverage: true, bnhubListingReviewCount: true },
    });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const quality = await computeListingQualityBundle(id);

    let publicTrustIndicators: ReturnType<typeof toPublicTrustIndicators> | null = null;
    if (reputationEngineFlags.reputationEngineV1) {
      const ex = await computeReputationRankingForListing(id);
      if (ex) {
        schedulePersistListingRankingSnapshot(id, ex);
        if (reputationEngineFlags.publicTrustBadgesV1) {
          publicTrustIndicators = toPublicTrustIndicators(ex);
        }
      }
    }

    return NextResponse.json({
      listingId: listing.id,
      title: listing.title,
      city: listing.city,
      denormalizedRatingAverage: listing.bnhubListingRatingAverage,
      denormalizedReviewCount: listing.bnhubListingReviewCount,
      quality,
      publicTrustIndicators,
    });
  } catch (e) {
    console.error("[api/reputation/listings]", e);
    return NextResponse.json({ error: "Unable to load listing reputation" }, { status: 503 });
  }
}
