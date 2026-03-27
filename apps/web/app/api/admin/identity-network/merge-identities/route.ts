import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { adminMergeOwnerIdentities, adminMergeBrokerIdentities } from "@/lib/identity-network";

/**
 * POST /api/admin/identity-network/merge-identities
 * Body: { identityType: "OWNER"|"BROKER", primaryIdentityId, duplicateIdentityId }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { identityType, primaryIdentityId, duplicateIdentityId } = body;

    if (!identityType || !["OWNER", "BROKER"].includes(identityType)) {
      return Response.json({ error: "identityType must be OWNER or BROKER" }, { status: 400 });
    }
    if (!primaryIdentityId || !duplicateIdentityId) {
      return Response.json({ error: "primaryIdentityId and duplicateIdentityId required" }, { status: 400 });
    }

    if (identityType === "OWNER") {
      const result = await adminMergeOwnerIdentities(primaryIdentityId, duplicateIdentityId, userId);
      return Response.json({ merged: result });
    }
    const result = await adminMergeBrokerIdentities(primaryIdentityId, duplicateIdentityId, userId);
    return Response.json({ merged: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Merge failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
