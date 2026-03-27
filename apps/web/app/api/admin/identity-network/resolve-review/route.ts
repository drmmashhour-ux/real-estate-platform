import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { adminResolveOwnerReview, adminResolveBrokerReview } from "@/lib/identity-network";

/**
 * POST /api/admin/identity-network/resolve-review
 * Body: { identityType: "OWNER"|"BROKER", identityId, verificationStatus: "VERIFIED"|"REJECTED" }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { identityType, identityId, verificationStatus } = body;

    if (!identityType || !["OWNER", "BROKER"].includes(identityType)) {
      return Response.json({ error: "identityType must be OWNER or BROKER" }, { status: 400 });
    }
    if (!identityId || typeof identityId !== "string") {
      return Response.json({ error: "identityId required" }, { status: 400 });
    }
    if (!verificationStatus || !["VERIFIED", "REJECTED"].includes(verificationStatus)) {
      return Response.json({ error: "verificationStatus must be VERIFIED or REJECTED" }, { status: 400 });
    }

    if (identityType === "OWNER") {
      const result = await adminResolveOwnerReview(identityId, verificationStatus, userId);
      return Response.json(result);
    }
    const result = await adminResolveBrokerReview(identityId, verificationStatus, userId);
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Resolve review failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
