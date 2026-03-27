import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPromotionsForListing } from "@/lib/monetization";

/**
 * GET /api/monetization/promotions/:id (id = listingId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: listingId } = await context.params;
    const promotions = await getPromotionsForListing(listingId);
    return Response.json({ promotions });
  } catch (e) {
    return Response.json({ error: "Failed to load promotions" }, { status: 500 });
  }
}
