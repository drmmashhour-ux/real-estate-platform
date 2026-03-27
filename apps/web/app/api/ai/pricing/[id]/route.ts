import { NextRequest } from "next/server";
import { getAiPricingRecommendation } from "@/lib/ai-pricing";

export const dynamic = "force-dynamic";

/** GET /api/ai/pricing/:id (id = listingId) – pricing recommendation for host dashboard. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const rec = await getAiPricingRecommendation(listingId, { checkIn, store: true });
    return Response.json(rec);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get pricing recommendation" }, { status: 500 });
  }
}
