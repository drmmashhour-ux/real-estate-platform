import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { runFraudCheckForListing } from "@/lib/anti-fraud/services/check-listing";

/**
 * POST /api/fraud/check-listing
 * Body: { listing_id: string }
 * Runs fraud check for the listing, stores score and alerts, freezes if score > 70.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const listingId = (body.listing_id as string)?.trim();
    if (!listingId) {
      return Response.json({ error: "listing_id required" }, { status: 400 });
    }

    const { prisma } = await import("@repo/db");
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.ownerId !== userId) {
      return Response.json({ error: "Only the listing host can request a fraud check" }, { status: 403 });
    }

    const result = await runFraudCheckForListing(listingId);
    return Response.json({
      listing_id: result.listingId,
      fraud_score: result.fraudScore,
      risk_level: result.riskLevel,
      reasons: result.reasons,
      frozen: result.frozen,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Fraud check failed" },
      { status: 500 }
    );
  }
}
