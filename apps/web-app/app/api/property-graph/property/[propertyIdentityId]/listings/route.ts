import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyListings } from "@/lib/property-graph/graph-service";

/**
 * GET /api/property-graph/property/:propertyIdentityId/listings
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ propertyIdentityId: string }> }
) {
  try {
    await getGuestId();
    const { propertyIdentityId } = await context.params;
    const listings = await getPropertyListings(propertyIdentityId);
    return Response.json({ listings });
  } catch (e) {
    return Response.json({ error: "Failed to load listings" }, { status: 500 });
  }
}
