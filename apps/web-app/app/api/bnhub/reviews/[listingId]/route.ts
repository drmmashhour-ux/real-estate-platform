import { NextRequest } from "next/server";
import { ReviewService } from "@/lib/bnhub/services";

/** GET /api/bnhub/reviews/:listingId — List reviews for a listing. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;
    const limit = 50;
    const reviews = await ReviewService.getReviewsForListing(listingId, limit);
    return Response.json(reviews);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
