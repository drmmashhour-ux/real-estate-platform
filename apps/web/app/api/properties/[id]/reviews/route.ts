import { NextRequest } from "next/server";
import { getPublicListingReviews } from "@/src/modules/reviews/reviewService";

/** GET /api/properties/:id/reviews — public guest reviews for a BNHUB listing (listing id = :id). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const limit = Math.min(
      50,
      Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "12") || 12)
    );
    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    const payload = await getPublicListingReviews(listingId, { limit, cursor });
    return Response.json(payload);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
