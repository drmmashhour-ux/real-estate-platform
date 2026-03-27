import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { resolveOrganization } from "@/lib/identity-network";

/**
 * POST /api/identity-network/organization/resolve
 * Body: { legalName, existingOrganizationIdentityId? }
 */
export async function POST(request: NextRequest) {
  try {
    await getGuestId();
    const body = await request.json().catch(() => ({}));
    const { legalName, existingOrganizationIdentityId } = body;
    if (!legalName || typeof legalName !== "string") {
      return Response.json({ error: "legalName required" }, { status: 400 });
    }
    const result = await resolveOrganization({
      legalName,
      existingOrganizationIdentityId: existingOrganizationIdentityId ?? null,
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: "Resolution failed" }, { status: 500 });
  }
}
