import { getListingRatingSummary } from "@/src/modules/reviews/reviewService";

/** GET /api/properties/:id/rating — aggregate rating row for a BNHUB listing. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const aggregate = await getListingRatingSummary(listingId);
    return Response.json(aggregate);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load rating summary" }, { status: 500 });
  }
}
