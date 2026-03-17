import { NextRequest } from "next/server";
import { isAiManagerEnabled, callAiManager } from "@/lib/ai-manager-client";
import { getPricingFromInput } from "@/lib/ai-pricing-input";

export const dynamic = "force-dynamic";

/** POST /api/ai/pricing-suggestion – recommended nightly price and range. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      location,
      season,
      demandLevel,
      similarListings,
      reviewCount,
      avgRating,
      currentPriceCents,
      listingId,
    } = body;
    if (!location || typeof location !== "string") {
      return Response.json({ error: "location required" }, { status: 400 });
    }

    if (isAiManagerEnabled()) {
      const result = await callAiManager<{
        recommendedNightlyCents: number;
        priceRangeMinCents: number;
        priceRangeMaxCents: number;
        factors: string[];
        confidence: string;
      }>("/v1/ai-manager/pricing-suggestion", body);
      return Response.json(result);
    }

    const nearby = (similarListings ?? []).map((l: { nightPriceCents?: number }) => l.nightPriceCents ?? 0).filter(Boolean);
    const out = getPricingFromInput({
      location,
      season,
      demandLevel,
      listingRating: avgRating,
      nearbyListingPrices: nearby.length ? nearby : undefined,
    });
    return Response.json({
      recommendedNightlyCents: out.recommendedNightlyCents,
      priceRangeMinCents: out.suggestedMinCents,
      priceRangeMaxCents: out.suggestedMaxCents,
      factors: out.factors,
      confidence: out.confidenceLevel,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to get pricing suggestion" },
      { status: 500 }
    );
  }
}
