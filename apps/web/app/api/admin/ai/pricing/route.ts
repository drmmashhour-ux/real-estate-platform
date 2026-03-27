import { NextRequest } from "next/server";
import { getAiPricingRecommendation, listAiPricingRecommendations } from "@/lib/ai-pricing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const store = searchParams.get("store") === "true";
    if (listingId) {
      const rec = await getAiPricingRecommendation(listingId, { checkIn, store });
      return Response.json(rec);
    }
    const list = await listAiPricingRecommendations({
      listingId: searchParams.get("listingId") ?? undefined,
      limit: 50,
    });
    return Response.json(list);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get pricing recommendation" }, { status: 500 });
  }
}
