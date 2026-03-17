import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyIdentityNetworkView, getPropertyIdentityById } from "@/lib/identity-network";

/**
 * GET /api/identity-network/property/:propertyIdentityId
 * Full identity network view for a property (ownership, broker auth, listing authorities).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ propertyIdentityId: string }> }
) {
  try {
    await getGuestId();
    const { propertyIdentityId } = await context.params;
    const view = await getPropertyIdentityNetworkView(propertyIdentityId);
    if (!view) {
      const prop = await getPropertyIdentityById(propertyIdentityId);
      if (!prop) return Response.json({ error: "Property not found" }, { status: 404 });
      return Response.json({
        property: prop,
        ownershipHistory: [],
        brokerAuthorizationHistory: [],
        listingAuthorities: [],
      });
    }
    return Response.json(view);
  } catch (e) {
    return Response.json({ error: "Failed to load property identity network" }, { status: 500 });
  }
}
