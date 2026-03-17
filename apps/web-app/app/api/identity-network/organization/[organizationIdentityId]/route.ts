import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getOrganizationIdentity } from "@/lib/identity-network";

/**
 * GET /api/identity-network/organization/:organizationIdentityId
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ organizationIdentityId: string }> }
) {
  try {
    await getGuestId();
    const { organizationIdentityId } = await context.params;
    const org = await getOrganizationIdentity(organizationIdentityId);
    if (!org) return Response.json({ error: "Organization identity not found" }, { status: 404 });
    return Response.json(org);
  } catch (e) {
    return Response.json({ error: "Failed to load organization identity" }, { status: 500 });
  }
}
