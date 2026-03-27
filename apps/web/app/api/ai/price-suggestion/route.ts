import { NextRequest } from "next/server";
import {
  getPriceSuggestionForListing,
  getPriceSuggestionFromInput,
  type PriceSuggestionInput,
} from "@/lib/ai";
import { logAiDecision } from "@/lib/ai/logger";

export const dynamic = "force-dynamic";

/** POST /api/ai/price-suggestion – recommended price by listing id or by input (location, demand, seasonality). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, checkIn, checkOut, location, propertyType, season, demandLevel, listingRating, nearbyListingPrices } = body as {
      listingId?: string;
      checkIn?: string;
      checkOut?: string;
    } & PriceSuggestionInput;

    if (listingId) {
      const result = await getPriceSuggestionForListing(listingId, {
        checkIn,
        checkOut,
        store: true,
        log: true,
      });
      return Response.json({
        recommendedPrice: result.recommendedPrice,
        recommendedPriceCents: result.recommendedPriceCents,
        minCents: result.minCents,
        maxCents: result.maxCents,
        factors: result.factors,
        confidence: result.confidence,
        demandLevel: result.demandLevel,
      });
    }

    if (!location || typeof location !== "string") {
      return Response.json(
        { error: "listingId or location required" },
        { status: 400 }
      );
    }
    const result = getPriceSuggestionFromInput({
      location,
      propertyType,
      season,
      demandLevel,
      listingRating,
      nearbyListingPrices,
    });
    await logAiDecision({
      action: "price_suggestion",
      entityType: "input",
      entityId: location,
      recommendedPriceCents: result.recommendedPriceCents,
      details: { factors: result.factors, confidence: result.confidence },
    });
    return Response.json({
      recommendedPrice: result.recommendedPrice,
      recommendedPriceCents: result.recommendedPriceCents,
      minCents: result.minCents,
      maxCents: result.maxCents,
      factors: result.factors,
      confidence: result.confidence,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Price suggestion failed";
    if (msg.includes("not found")) {
      return Response.json({ error: msg }, { status: 404 });
    }
    console.error(e);
    return Response.json({ error: "Failed to get price suggestion" }, { status: 500 });
  }
}

/** GET /api/ai/price-suggestion?id=... (listing id) */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("id") ?? searchParams.get("listingId");
  const checkIn = searchParams.get("checkIn") ?? undefined;
  const checkOut = searchParams.get("checkOut") ?? undefined;
  if (!listingId) {
    return Response.json(
      { error: "query param id or listingId required" },
      { status: 400 }
    );
  }
  try {
    const result = await getPriceSuggestionForListing(listingId, {
      checkIn,
      checkOut,
      store: true,
      log: true,
    });
    return Response.json({
      recommendedPrice: result.recommendedPrice,
      recommendedPriceCents: result.recommendedPriceCents,
      minCents: result.minCents,
      maxCents: result.maxCents,
      factors: result.factors,
      confidence: result.confidence,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Price suggestion failed";
    if (msg.includes("not found")) {
      return Response.json({ error: msg }, { status: 404 });
    }
    console.error(e);
    return Response.json({ error: "Failed to get price suggestion" }, { status: 500 });
  }
}
