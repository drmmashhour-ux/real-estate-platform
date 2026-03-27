import { NextRequest } from "next/server";
import { getHostListingRecommendations } from "@/lib/ai-host-optimization";

export const dynamic = "force-dynamic";

/** GET /api/ai/recommendations/:id (id = listingId) – host optimization recommendations. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const recs = await getHostListingRecommendations(listingId);
    return Response.json(recs);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
