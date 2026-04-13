import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { parseEarlyBookingPayload } from "@/lib/bnhub/early-booking-discount";
import { generateSmartPrice } from "@/lib/bnhub/smart-pricing";
import { getPricingRulesForListing } from "@/lib/bnhub/pricing";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    if (!listingId) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }
    const checkIn = searchParams.get("checkIn") ?? undefined;

    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { nightPriceCents: true, city: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const [smart, rules] = await Promise.all([
      generateSmartPrice(listingId),
      getPricingRulesForListing(listingId, checkIn),
    ]);

    const marketAvgCents =
      smart.marketAvgCents != null && smart.marketAvgCents > 0
        ? smart.marketAvgCents
        : listing.nightPriceCents;

    const factors: string[] = [
      `BNHUB peer sample in ${listing.city}: ~$${(marketAvgCents / 100).toFixed(0)}/night (${smart.peerListingCount} listings)`,
      `Model confidence: ${smart.confidence} (${smart.confidenceScore}/100)`,
      `Demand signal: ${smart.demandLevel} · seasonality ×${smart.factors.seasonality.toFixed(2)}`,
    ];
    let minStayNights: number | undefined;
    for (const r of rules) {
      if (r.ruleType === "MIN_STAY" && typeof (r.payload as { minNights?: number }).minNights === "number") {
        minStayNights = (r.payload as { minNights: number }).minNights;
        factors.push(`Min-stay rule: ${minStayNights} nights`);
      }
      if (r.ruleType === "SEASONALITY" && typeof (r.payload as { multiplier?: number }).multiplier === "number") {
        factors.push(`Seasonality rule ×${(r.payload as { multiplier: number }).multiplier}`);
      }
    }
    if (checkIn) factors.push(`Check-in: ${checkIn}`);

    for (const r of rules) {
      if (r.ruleType !== "EARLY_BOOKING") continue;
      const eb = parseEarlyBookingPayload(r.payload);
      if (eb) {
        factors.push(
          `Early booking promo: ${eb.discountPercent}% off when guests book ${eb.minLeadDays}+ days before check-in`
        );
      }
    }

    return Response.json({
      recommendedPriceCents: smart.recommendedPriceCents,
      currentPriceCents: listing.nightPriceCents,
      marketAvgCents,
      demandLevel: smart.demandLevel,
      factors,
      minStayNights,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get pricing recommendation" }, { status: 500 });
  }
}
