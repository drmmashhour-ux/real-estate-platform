import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getOwnerIdentity } from "@/lib/identity-network";

/**
 * GET /api/identity-network/owner/:ownerIdentityId
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ ownerIdentityId: string }> }
) {
  try {
    await getGuestId();
    const { ownerIdentityId } = await context.params;
    const owner = await getOwnerIdentity(ownerIdentityId);
    if (!owner) return Response.json({ error: "Owner identity not found" }, { status: 404 });
    return Response.json(owner);
  } catch (e) {
    return Response.json({ error: "Failed to load owner identity" }, { status: 500 });
  }
}
