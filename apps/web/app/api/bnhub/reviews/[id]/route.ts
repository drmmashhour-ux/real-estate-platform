import { NextRequest } from "next/server";
import { getPublicListingReviews } from "@/src/modules/reviews/reviewService";

/** GET /api/bnhub/reviews/:id (id = listingId) — public reviews (moderation-held excluded). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const limit = Math.min(
      50,
      Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "50") || 50)
    );
    const payload = await getPublicListingReviews(listingId, { limit });
    return Response.json(payload.reviews);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
