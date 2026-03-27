import { NextRequest } from "next/server";
import { getPricingRecommendation } from "@/lib/bnhub/pricing";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    if (!listingId) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const rec = await getPricingRecommendation(listingId, { checkIn, checkOut });
    return Response.json(rec);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get pricing recommendation" }, { status: 500 });
  }
}
