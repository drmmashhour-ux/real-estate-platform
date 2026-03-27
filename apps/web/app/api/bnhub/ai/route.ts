import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { suggestBnHubPricing } from "@/lib/ai/brain";
import { getOccupancyRateLast30 } from "@/lib/bnhub/dashboard";
import { getListingsByOwner } from "@/lib/bnhub/listings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const guestId = await getGuestId();
    const ownerId =
      request.nextUrl.searchParams.get("ownerId") ??
      guestId ??
      process.env.NEXT_PUBLIC_DEMO_HOST_ID ??
      null;

    const listings = ownerId ? await getListingsByOwner(ownerId) : [];
    const firstListingId = listings[0]?.id ?? "";
    const basePricing = suggestBnHubPricing(firstListingId);

    let occupancyRate = 0;
    if (ownerId) {
      occupancyRate = await getOccupancyRateLast30(ownerId);
    }

    let recommendedCents = basePricing.recommendedCents;
    let pricingSuggestion = `$${(basePricing.recommendedCents / 100).toFixed(0)}/night (${basePricing.demandLevel} demand). ${basePricing.factors.join(", ")}.`;

    if (occupancyRate < 40 && occupancyRate > 0) {
      recommendedCents = Math.round(basePricing.recommendedCents * 0.9);
      pricingSuggestion = `Occupancy is low (${occupancyRate}%). Consider reducing to $${(recommendedCents / 100).toFixed(0)}/night to attract more bookings. ${basePricing.factors.join(", ")}.`;
    } else if (occupancyRate > 80) {
      recommendedCents = Math.round(basePricing.recommendedCents * 1.1);
      pricingSuggestion = `High occupancy (${occupancyRate}%). You can try increasing to $${(recommendedCents / 100).toFixed(0)}/night. ${basePricing.factors.join(", ")}.`;
    }

    let occupancyInsight = "No listings or no bookings yet. Add a listing and get your first booking to see insights.";
    if (listings.length > 0 && occupancyRate >= 0) {
      if (occupancyRate < 40)
        occupancyInsight = `Occupancy is ${occupancyRate}% (last 30 days). Consider lowering your nightly rate or improving your listing photos and description to attract more guests.`;
      else if (occupancyRate > 80)
        occupancyInsight = `Occupancy is ${occupancyRate}% (last 30 days). Strong demand—consider raising your price or adding minimum stay to maximize revenue.`;
      else
        occupancyInsight = `Occupancy is ${occupancyRate}% (last 30 days). Steady demand. Use seasonal pricing and keep your calendar updated.`;
    }

    const revenueTips = [
      "Professional photos and a clear description improve conversion.",
      "Enable instant book for guests who meet your requirements to reduce friction.",
      "Keep your calendar up to date to avoid double bookings and maintain trust.",
      occupancyRate < 40 ? "Try a small price reduction to increase bookings, then adjust." : "",
      occupancyRate > 80 ? "Consider dynamic pricing: raise rates for peak dates." : "",
    ].filter(Boolean);

    return NextResponse.json({
      pricingSuggestion,
      recommendedCents,
      minCents: basePricing.minCents,
      maxCents: basePricing.maxCents,
      demandLevel: basePricing.demandLevel,
      factors: basePricing.factors,
      occupancyRate,
      occupancyInsight,
      revenueTips,
      listingId: firstListingId || null,
    });
  } catch (e) {
    console.error("GET /api/bnhub/ai:", e);
    return NextResponse.json(
      {
        pricingSuggestion: "AI suggestions are temporarily unavailable. Try again later.",
        recommendedCents: 12000,
        minCents: 10000,
        maxCents: 15000,
        demandLevel: "medium",
        factors: ["Default"],
        occupancyRate: 0,
        occupancyInsight: "Add listings and bookings to see occupancy insights.",
        revenueTips: ["Keep your calendar updated.", "Use clear photos and descriptions."],
        listingId: null,
      },
      { status: 200 }
    );
  }
}
