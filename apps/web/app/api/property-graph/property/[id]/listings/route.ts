import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyListings } from "@/lib/property-graph/graph-service";

/**
 * GET /api/property-graph/property/:id/listings (id = propertyIdentityId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: propertyIdentityId } = await context.params;
    const listings = await getPropertyListings(propertyIdentityId);
    return Response.json({ listings });
  } catch (e) {
    return Response.json({ error: "Failed to load listings" }, { status: 500 });
  }
}
