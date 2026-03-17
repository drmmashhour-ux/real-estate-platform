import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AVM_DISCLAIMER } from "@/lib/valuation/constants";

/**
 * GET /api/valuation/listing/:listingId
 * Returns valuations for the property identity linked to this listing.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ listingId: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { listingId } = await context.params;
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { propertyIdentityId: true, ownerId: true },
    });

    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.ownerId !== userId) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    if (!listing.propertyIdentityId) {
      return Response.json({
        listing_id: listingId,
        property_identity_id: null,
        disclaimer: AVM_DISCLAIMER,
        valuations: [],
        message: "Listing is not linked to a property identity. Link the listing to get valuations.",
      });
    }

    const valuations = await prisma.propertyValuation.findMany({
      where: { propertyIdentityId: listing.propertyIdentityId, listingId },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const byType: Record<string, (typeof valuations)[0]> = {};
    for (const v of valuations) {
      if (!byType[v.valuationType]) byType[v.valuationType] = v;
    }

    return Response.json({
      listing_id: listingId,
      property_identity_id: listing.propertyIdentityId,
      disclaimer: AVM_DISCLAIMER,
      valuations: Object.entries(byType).map(([type, v]) => ({
        id: v.id,
        valuation_type: type,
        estimated_value: v.estimatedValue,
        value_min: v.valueMin,
        value_max: v.valueMax,
        monthly_rent_estimate: v.monthlyRentEstimate,
        nightly_rate_estimate: v.nightlyRateEstimate,
        annual_revenue_estimate: v.annualRevenueEstimate,
        gross_yield_estimate: v.grossYieldEstimate,
        investment_score: v.investmentScore,
        confidence_score: v.confidenceScore,
        confidence_label: v.confidenceLabel,
        valuation_summary: v.valuationSummary,
        explanation: v.explanation,
        risk_level: v.riskLevel,
        seasonality_summary: v.seasonalitySummary,
        created_at: v.createdAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch valuations" },
      { status: 500 }
    );
  }
}
