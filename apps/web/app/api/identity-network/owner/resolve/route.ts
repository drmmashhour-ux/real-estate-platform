import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { resolveOwner } from "@/lib/identity-network";

/**
 * POST /api/identity-network/owner/resolve
 * Body: { legalName, documentOwnerName?, existingOwnerIdentityId? }
 */
export async function POST(request: NextRequest) {
  try {
    await getGuestId();
    const body = await request.json().catch(() => ({}));
    const { legalName, documentOwnerName, existingOwnerIdentityId } = body;
    if (!legalName || typeof legalName !== "string") {
      return Response.json({ error: "legalName required" }, { status: 400 });
    }
    const result = await resolveOwner({
      legalName,
      documentOwnerName: documentOwnerName ?? null,
      existingOwnerIdentityId: existingOwnerIdentityId ?? null,
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: "Resolution failed" }, { status: 500 });
  }
}
