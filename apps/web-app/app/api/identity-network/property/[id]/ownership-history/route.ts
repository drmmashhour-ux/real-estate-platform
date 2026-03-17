import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyOwnershipHistory } from "@/lib/identity-network";

/**
 * GET /api/identity-network/property/:id/ownership-history
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: propertyIdentityId } = await context.params;
    const history = await getPropertyOwnershipHistory(propertyIdentityId);
    return Response.json({ ownershipHistory: history });
  } catch (e) {
    return Response.json({ error: "Failed to load ownership history" }, { status: 500 });
  }
}
