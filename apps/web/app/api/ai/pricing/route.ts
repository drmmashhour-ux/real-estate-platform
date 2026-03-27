import { NextRequest } from "next/server";
import { getPricingFromInput } from "@/lib/ai-pricing-input";

export const dynamic = "force-dynamic";

/** POST /api/ai/pricing – pricing recommendation from location, type, season, demand, rating, comparables. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      location,
      propertyType,
      season,
      demandLevel,
      listingRating,
      nearbyListingPrices,
    } = body;
    if (!location || typeof location !== "string") {
      return Response.json({ error: "location required" }, { status: 400 });
    }
    const result = getPricingFromInput({
      location,
      propertyType: typeof propertyType === "string" ? propertyType : undefined,
      season: typeof season === "string" ? season : undefined,
      demandLevel:
        demandLevel === "low" || demandLevel === "medium" || demandLevel === "high"
          ? demandLevel
          : undefined,
      listingRating:
        typeof listingRating === "number" ? listingRating : undefined,
      nearbyListingPrices: Array.isArray(nearbyListingPrices)
        ? nearbyListingPrices.map(Number).filter((n: number) => !Number.isNaN(n))
        : undefined,
    });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to get pricing recommendation" },
      { status: 500 }
    );
  }
}
